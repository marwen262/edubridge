"""
Analyse textuelle sémantique du diplôme.

V5 — Enhanced intelligence layers :
  - Scoring sémantique structuré (semantic_score + components)
  - Détection de phrases de certification ("certifie que", "atteste que"…)
  - Densité de mots-clés académiques (penalty si aucune)
  - Comptage structurel : ≥3 composantes → boost, <2 → penalty
  - Quick semantic scoring pour la sélection OCR multi-pass
  - Raisons améliorées, descriptives et contextuelles
  - Classification du type de document (diploma / certificate / unknown)
  - Vérification de la cohérence sémantique
  - Détection de keyword stuffing (anti-fraude)

Détecte :
  - Nom de personne  (spaCy + regex fallback)
  - Institution / université
  - Mot-clé de diplôme (licence, master, bachelor…)
  - Présence d'une date / année
  - Phrases de certification officielles

Calcule :
  - semantic_score (0–1) — score composite de validation sémantique
  - semantic_components — détail par composante
  - completeness_score (0–1)
  - diploma_confidence (0–1)
  - coherence_score (0–1) — cohérence logique académique
  - keyword_penalty (0–0.3) — pénalité si keyword stuffing
  - doc_type — classification du type de document
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field

from app.config import DIPLOMA_KEYWORDS, DIPLOMA_TYPES, OFFICIAL_PATTERNS
from app.utils.logger import logger


def _strip_accents_lower(text: str) -> str:
    """Normalize text: NFKD strip combining marks + lowercase.

    Required for matching keywords across French (avec/sans accents)
    and supporting Arabic without altering Arabic characters.
    """
    if not text:
        return ""
    normalized = unicodedata.normalize("NFKD", text)
    normalized = "".join(c for c in normalized if not unicodedata.combining(c))
    return normalized.lower()


# ──────────────────────────────────────────────
# Regex fallback pour les noms propres
# ──────────────────────────────────────────────
_NAME_PATTERN = re.compile(
    r"(?:(?:M\.|Mme|Mr\.?|Mrs\.?|Monsieur|Madame|Mademoiselle|Mlle)"
    r"\s+)?([A-ZÀ-ÖÙ-Ü][a-zà-öù-ü]+(?:\s+[A-ZÀ-ÖÙ-Ü][a-zà-öù-ü]+)+)"
)

# V6: pattern Arabic — nom de personne après titre courant
_ARABIC_NAME_PATTERN = re.compile(
    r"(?:السيد|السيدة|الطالب|الطالبة|الآنسة|للسيد|للسيدة|"
    r"يشهد\s+بأن|نشهد\s+بأن|تشهد\s+بأن)\s+"
    r"([؀-ۿ]+(?:\s+[؀-ۿ]+){1,4})",
    re.UNICODE,
)

# Patterns qui signalent une institution
_INSTITUTION_KEYWORDS = [
    "universit", "facult", "école", "institut", "college",
    "school", "academy", "hochschule", "ministère", "ministry",
    "جامعة", "كلية", "معهد", "وزارة",
]

_INSTITUTION_PATTERN = re.compile(
    r"(?:universit[éeya]\w*|facult[éeya]\w*|école|institut\w*|"
    r"college|school|academy|hochschule|ministère|ministry)"
    r"[^.\n]{0,80}",
    re.IGNORECASE | re.UNICODE,
)

# Mots-clés de diplôme (cross-language, flat)
_DEGREE_KEYWORDS: list[str] = []
for _kws in DIPLOMA_TYPES.values():
    _DEGREE_KEYWORDS.extend(kw.lower() for kw in _kws)
# dédupliquer
_DEGREE_KEYWORDS = list(set(_DEGREE_KEYWORDS))

# Pattern pour les années
# V6: lookbehind/lookahead négatifs au lieu de \b — \b ne fonctionne
# pas bien quand l'année est entourée de caractères Unicode (arabe,
# accents) ou de bruit OCR. Cette version capture aussi les années
# isolées par n'importe quel non-chiffre.
_YEAR_PATTERN = re.compile(r"(?<!\d)(19\d{2}|20\d{2})(?!\d)")


# ──────────────────────────────────────────────
# Phrases de certification (multi-langues)
# ──────────────────────────────────────────────
_CERTIFICATION_PHRASES: list[str] = [
    # Français
    r"certifi(?:e|ons)\s+que",
    r"attest(?:e|ons)\s+que",
    r"d[ée]livr[ée]\s+(?:à|a|au)",
    r"a\s+obtenu",
    r"confère\s+(?:le|la|les)",
    r"décern[ée]?\s+(?:à|a|au|le|la)",
    r"a\s+soutenu",
    r"vu\s+les?\s+résultats?",
    r"au\s+vu\s+des?\s+délibérations?",
    r"en\s+foi\s+de\s+quoi",
    # English
    r"this\s+is\s+to\s+certify",
    r"hereby\s+certif(?:y|ies)",
    r"has\s+(?:been\s+)?awarded",
    r"has\s+(?:been\s+)?conferred",
    r"has\s+(?:successfully\s+)?completed",
    r"granted\s+(?:the|this)\s+(?:degree|diploma)",
    r"in\s+witness\s+whereof",
    r"this\s+diploma\s+is\s+awarded",
    # Arabic
    r"يشهد\s+أن",
    r"نشهد\s+أن",
    r"تحصل\s+على",
    r"منحت?\s+(?:لـ|له|لها)",
    # Spanish
    r"certifica\s+que",
    r"se\s+otorga\s+(?:a|el|la)",
    r"ha\s+obtenido",
    # German
    r"hiermit\s+(?:wird\s+)?bescheinigt",
    r"hat\s+(?:die|den)\s+(?:prüfung|grad)\s+bestanden",
    r"wird\s+(?:der|die|das)\s+(?:grad|titel)\s+verliehen",
]

_COMPILED_CERT_PHRASES = [
    re.compile(p, re.IGNORECASE | re.UNICODE)
    for p in _CERTIFICATION_PHRASES
]


# ──────────────────────────────────────────────
# Data classes
# ──────────────────────────────────────────────

@dataclass
class SemanticComponents:
    """Détail des composantes sémantiques détectées."""
    name: float = 0.0       # 0 ou 1
    institution: float = 0.0  # 0 ou 1
    degree: float = 0.0     # 0 ou 1
    date: float = 0.0       # 0 ou 1
    phrases: float = 0.0    # 0 ou 1


@dataclass
class TextAnalysisResult:
    """Résultat de l'analyse textuelle sémantique."""

    has_person_name: bool = False
    has_institution: bool = False
    has_degree_keyword: bool = False
    has_date: bool = False
    has_certification_phrase: bool = False
    official_mention_found: bool = False
    mentions_detected: list[str] = field(default_factory=list)

    diploma_confidence: float = 0.0
    completeness_score: float = 0.0
    semantic_score: float = 0.0
    semantic_components: SemanticComponents = field(
        default_factory=SemanticComponents,
    )

    # Structural analysis (V4)
    structure_count: int = 0       # how many of the 4 core fields present
    keyword_density: float = 0.0   # ratio of academic keywords found

    # V5 — Enhanced intelligence layers
    doc_type: str = "unknown"         # "diploma", "certificate", or "unknown"
    coherence_score: float = 0.0      # 0–1, semantic coherence
    keyword_penalty: float = 0.0      # 0–0.3, keyword stuffing penalty

    detected_degree: str | None = None
    detected_institution: str | None = None
    detected_name: str | None = None

    reasons: list[str] = field(default_factory=list)


# ──────────────────────────────────────────────
# Détection du nom de personne
# ──────────────────────────────────────────────

def _detect_person_name(text: str, language: str) -> str | None:
    """Détecte un nom de personne via spaCy puis regex fallback."""
    # 1. spaCy
    try:
        from app.services.ocr_service import _spacy_fr, _spacy_xx
        nlp = _spacy_fr if language == "fr" else _spacy_xx
        if nlp is not None:
            doc = nlp(text[:5000])
            persons = [ent.text.strip() for ent in doc.ents if ent.label_ == "PER"]
            if persons:
                return persons[0]
    except Exception:
        pass

    # 2. Regex fallback (Latin)
    match = _NAME_PATTERN.search(text)
    if match:
        return match.group(1).strip()

    # 3. V6: Regex fallback (Arabic)
    match = _ARABIC_NAME_PATTERN.search(text)
    if match:
        return match.group(1).strip()

    return None


# ──────────────────────────────────────────────
# Détection de l'institution
# ──────────────────────────────────────────────

def _detect_institution(text: str, language: str) -> str | None:
    """Détecte un nom d'institution via spaCy puis regex fallback."""
    # 1. spaCy ORG
    try:
        from app.services.ocr_service import _spacy_fr, _spacy_xx
        nlp = _spacy_fr if language == "fr" else _spacy_xx
        if nlp is not None:
            doc = nlp(text[:5000])
            orgs = [ent.text.strip() for ent in doc.ents if ent.label_ == "ORG"]
            for org in orgs:
                if any(kw in org.lower() for kw in _INSTITUTION_KEYWORDS):
                    return org
            if orgs:
                return orgs[0]
    except Exception:
        pass

    # 2. Regex fallback
    match = _INSTITUTION_PATTERN.search(text)
    if match:
        return match.group(0).strip()

    return None


# ──────────────────────────────────────────────
# Détection du type de diplôme
# ──────────────────────────────────────────────

def _detect_degree(text: str) -> str | None:
    """Détecte le type de diplôme dans le texte."""
    text_lower = text.lower()
    # Tester les plus longs d'abord (plus spécifiques)
    for kw in sorted(_DEGREE_KEYWORDS, key=len, reverse=True):
        if kw in text_lower:
            return kw.capitalize()
    return None


# ──────────────────────────────────────────────
# Détection de date / année
# ──────────────────────────────────────────────

def _detect_date(text: str) -> bool:
    """Vérifie la présence d'au moins une année valide."""
    return bool(_YEAR_PATTERN.search(text))


# ──────────────────────────────────────────────
# Détection de phrases de certification
# ──────────────────────────────────────────────

def _detect_certification_phrases(text: str) -> tuple[bool, list[str]]:
    """Détecte les phrases de certification officielle dans le texte.

    Retourne (found, list_of_matched_phrases).
    """
    found: list[str] = []
    for pattern in _COMPILED_CERT_PHRASES:
        match = pattern.search(text)
        if match:
            phrase = match.group(0).strip()
            if phrase and phrase not in found:
                found.append(phrase)

    return len(found) > 0, found


# ──────────────────────────────────────────────
# Mentions officielles
# ──────────────────────────────────────────────

def _check_official_mentions(text: str) -> tuple[bool, list[str]]:
    """Vérifie la présence de mentions officielles dans le texte."""
    mentions: list[str] = []
    for _category, patterns in OFFICIAL_PATTERNS.items():
        for pattern in patterns:
            try:
                matches = re.findall(pattern, text, re.IGNORECASE | re.UNICODE)
                for m in matches:
                    cleaned = m.strip()
                    if cleaned and cleaned not in mentions:
                        mentions.append(cleaned)
            except re.error:
                continue
    return len(mentions) > 0, mentions


# ──────────────────────────────────────────────
# Mots-clés de diplôme (ratio / density)
# ──────────────────────────────────────────────

def _diploma_keyword_ratio(text: str, language: str) -> float:
    """Ratio de mots-clés diploma trouvés (meilleure langue)."""
    text_lower = text.lower()
    languages = [language] + [l for l in DIPLOMA_KEYWORDS if l != language]
    best: float = 0.0
    for lang in languages:
        keywords = DIPLOMA_KEYWORDS.get(lang, [])
        if not keywords:
            continue
        found = sum(1 for kw in keywords if kw.lower() in text_lower)
        ratio = found / len(keywords)
        if ratio > best:
            best = ratio
    return round(best, 3)


def _academic_keyword_density(text: str) -> float:
    """Calcule la densité de mots-clés académiques dans le texte.

    Retourne le nombre de mots-clés uniques trouvés divisé par
    le nombre total de mots-clés possibles (cross-language).
    """
    if not text or len(text.strip()) < 5:
        return 0.0

    text_lower = text.lower()
    all_keywords: set[str] = set()
    found: set[str] = set()

    for lang_keywords in DIPLOMA_KEYWORDS.values():
        for kw in lang_keywords:
            kw_lower = kw.lower()
            all_keywords.add(kw_lower)
            if kw_lower in text_lower:
                found.add(kw_lower)

    if not all_keywords:
        return 0.0

    return round(len(found) / len(all_keywords), 3)


# ──────────────────────────────────────────────
# Semantic scoring
# ──────────────────────────────────────────────

def _compute_semantic_score(
    components: SemanticComponents,
    keyword_density: float,
) -> float:
    """Calcule le score sémantique composite.

    V6: institution supprimée du calcul — un diplôme sans institution
    détectée ne doit pas être pénalisé. Poids redistribués (somme=1.0).

    Pondération :
      - name:         0.27
      - degree:       0.27
      - date:         0.20
      - phrases:      0.26

    Bonus : keyword_density (capped at 0.10)
    """
    score = (
        components.name * 0.27
        + components.degree * 0.27
        + components.date * 0.20
        + components.phrases * 0.26
    )

    # Keyword density bonus (capped)
    density_bonus = min(0.10, keyword_density * 0.5)
    score += density_bonus

    return round(min(1.0, max(0.0, score)), 3)


# ──────────────────────────────────────────────
# Quick semantic scoring (for OCR selection)
# ──────────────────────────────────────────────

def quick_semantic_score(text: str) -> float:
    """Score sémantique rapide pour la sélection OCR multi-pass.

    Évalue rapidement si un texte ressemble à un diplôme
    SANS appeler spaCy (trop lent pour la sélection).

    Retourne un score 0.0 – 1.0.
    """
    if not text or len(text.strip()) < 10:
        return 0.0

    text_lower = text.lower()
    score = 0.0

    # Check degree keywords (0.25)
    for kw in _DEGREE_KEYWORDS:
        if kw in text_lower:
            score += 0.25
            break

    # Check institution keywords (0.25)
    for kw in _INSTITUTION_KEYWORDS:
        if kw in text_lower:
            score += 0.25
            break

    # Check year (0.15)
    if _YEAR_PATTERN.search(text):
        score += 0.15

    # Check certification phrases (0.20)
    for pattern in _COMPILED_CERT_PHRASES:
        if pattern.search(text):
            score += 0.20
            break

    # Check name pattern (0.15)
    if _NAME_PATTERN.search(text):
        score += 0.15

    return round(min(1.0, score), 3)


# ──────────────────────────────────────────────
# V5 — Document type classification
# ──────────────────────────────────────────────

def classify_document(text: str) -> str:
    """Classify document type based on keywords.

    Returns: "diploma", "certificate", or "unknown"

    V6: Threshold lowered to >= 1 (a real diploma may only contain
    one degree keyword). Multi-langue (fr/en/ar) avec gestion
    des accents (normalisation NFKD).
    """
    text_lower = _strip_accents_lower(text)

    diploma_keywords = [
        # Français (sans accents après normalisation NFKD)
        "diplome", "licence", "ingenieur", "master", "bachelor",
        "doctorat", "baccalaureat", "maitrise", "brevet",
        # Anglais
        "degree", "phd", "doctorate",
        # Arabe (Unicode preservé par NFKD)
        "شهادة", "ليسانس", "ماستر", "دكتوراه", "دبلوم",
        "إجازة", "بكالوريوس", "ماجستير",
    ]
    cert_keywords = ["certificat", "attestation", "stage"]

    diploma_score = sum(k in text_lower for k in diploma_keywords)
    cert_score = sum(k in text_lower for k in cert_keywords)

    if diploma_score >= 1:
        return "diploma"
    elif cert_score >= 2:
        return "certificate"
    else:
        return "unknown"


# ──────────────────────────────────────────────
# V5 — Semantic coherence check
# ──────────────────────────────────────────────

def check_coherence(text: str) -> float:
    """Detect logical academic phrasing.

    V6: Patterns multi-langues (fr/en/ar), accents normalisés,
    flag DOTALL pour multilignes.

    Returns value between 0 and 1.
    """
    normalized = _strip_accents_lower(text)

    patterns = [
        # Français (accents strippés)
        r"(certifie que|atteste que|delivre|confere).*(a obtenu|diplome|licence|master)",
        r"(diplome|licence|master|doctorat).*(universite|faculte|institut)",
        # Anglais
        r"(this is to certify|hereby certif|has been awarded).*(degree|diploma|bachelor|master)",
        r"(degree|diploma|bachelor).*(university|college|institute)",
        # Arabe
        r"(يشهد|نشهد|تشهد|منحت).*(شهادة|ليسانس|ماستر|دكتوراه|دبلوم)",
        r"(جامعة|كلية|معهد|وزارة).*(شهادة|ليسانس|ماستر|دكتوراه)",
    ]

    matches = sum(
        bool(re.search(p, normalized, re.DOTALL | re.UNICODE))
        for p in patterns
    )
    return matches / len(patterns)


# ──────────────────────────────────────────────
# V5 — Keyword density penalty (anti-stuffing)
# ──────────────────────────────────────────────

def keyword_density_penalty(text: str) -> float:
    """Detect keyword stuffing attacks.

    V6: liste étendue avec accents normalisés et arabe.

    If academic keywords represent > 30% of total words,
    applies a 0.3 penalty. Otherwise 0.0.
    """
    normalized = _strip_accents_lower(text)

    keywords = {
        # Français (sans accents)
        "diplome", "universite", "ingenieur", "licence", "master",
        "doctorat", "faculte", "ministere",
        # Anglais
        "degree", "diploma", "university", "bachelor", "ministry",
        # Arabe
        "شهادة", "جامعة", "ليسانس", "ماستر", "دكتوراه", "دبلوم",
    }
    words = normalized.split()

    if not words:
        return 0.0

    density = sum(word in keywords for word in words) / len(words)

    return 0.3 if density > 0.3 else 0.0


# ──────────────────────────────────────────────
# Pipeline principal
# ──────────────────────────────────────────────

def analyze_text(text: str, language: str = "unknown") -> TextAnalysisResult:
    """Analyse sémantique complète du texte extrait.

    V5 — Enhanced intelligence layers :
      - Score sémantique structuré avec composantes détaillées
      - Détection de phrases de certification
      - Densité de mots-clés académiques
      - Comptage structurel pour boost/penalty
      - Raisons contextuelles améliorées
      - Classification du type de document
      - Vérification de cohérence sémantique
      - Détection de keyword stuffing

    Retourne un TextAnalysisResult avec les détections
    et les scores de complétude / confiance / sémantique.
    """
    result = TextAnalysisResult()

    try:
        if not text or len(text.strip()) < 5:
            result.reasons.append("Document vide ou contenu insuffisant")
            return result

        # ── 1. Nom de personne ──
        name = _detect_person_name(text, language)
        if name:
            result.has_person_name = True
            result.detected_name = name
            result.semantic_components.name = 1.0
        else:
            result.reasons.append("Nom du titulaire non détecté")

        # ── 2. Institution ──
        institution = _detect_institution(text, language)
        if institution:
            result.has_institution = True
            result.detected_institution = institution
            result.semantic_components.institution = 1.0
        else:
            result.reasons.append("Institution non identifiée")

        # ── 3. Mot-clé de diplôme ──
        degree = _detect_degree(text)
        if degree:
            result.has_degree_keyword = True
            result.detected_degree = degree
            result.semantic_components.degree = 1.0
        else:
            result.reasons.append("Type de diplôme non reconnu")

        # ── 4. Date / année ──
        result.has_date = _detect_date(text)
        if result.has_date:
            result.semantic_components.date = 1.0
        else:
            result.reasons.append("Date ou année non détectée")

        # ── 5. Phrases de certification ──
        result.has_certification_phrase, cert_phrases = (
            _detect_certification_phrases(text)
        )
        if result.has_certification_phrase:
            result.semantic_components.phrases = 1.0

        # ── 6. Mentions officielles ──
        result.official_mention_found, result.mentions_detected = (
            _check_official_mentions(text)
        )

        # ── 7. Keyword density ──
        kw_ratio = _diploma_keyword_ratio(text, language)
        result.keyword_density = _academic_keyword_density(text)

        # ── 8. Structure count ──
        # V6: has_institution retiré — un diplôme sans institution détectée
        # ne doit pas être pénalisé. Max struct=3 désormais.
        core_fields = [
            result.has_person_name,
            result.has_degree_keyword,
            result.has_date,
        ]
        result.structure_count = sum(core_fields)

        # ── 9. Completeness score ──
        result.completeness_score = round(
            result.structure_count / len(core_fields), 2,
        )

        # ── 10. Semantic score ──
        result.semantic_score = _compute_semantic_score(
            result.semantic_components,
            result.keyword_density,
        )

        # ── 11. Diploma confidence ──
        # Weighted: semantic_score + keywords + official mentions
        confidence = (
            result.semantic_score * 0.50
            + kw_ratio * 0.30
            + (0.20 if result.official_mention_found else 0.0)
        )
        result.diploma_confidence = round(min(1.0, confidence), 2)

        # ── 12. V5 — Document type classification ──
        result.doc_type = classify_document(text)

        # ── 13. V5 — Semantic coherence check ──
        result.coherence_score = check_coherence(text)

        # ── 14. V5 — Keyword density penalty (anti-stuffing) ──
        result.keyword_penalty = keyword_density_penalty(text)

        # ── 15. Improved reasons based on structure ──
        # Replace generic reasons with contextual ones
        if result.structure_count < 2 and not result.has_certification_phrase:
            # Clear existing reasons and replace with better ones
            result.reasons = [
                r for r in result.reasons
                if r not in (
                    "Nom du titulaire non détecté",
                    "Institution non identifiée",
                    "Type de diplôme non reconnu",
                    "Date ou année non détectée",
                )
            ]
            result.reasons.insert(
                0, "Structure du document incomplète",
            )
            if result.keyword_density == 0.0:
                result.reasons.append(
                    "Absence de mentions académiques clés",
                )

        # Add positive reasons for high-confidence documents
        if result.semantic_score >= 0.6:
            # Remove negative reasons that are minor
            pass  # keep all reasons, they serve as explanatory context

        logger.info(
            "Analyse texte V5 — nom=%s | institution=%s | diplôme=%s | "
            "date=%s | phrases=%s | semantic=%.3f | struct=%d | "
            "density=%.3f | confiance=%.2f | doc_type=%s | "
            "coherence=%.2f | kw_penalty=%.2f",
            result.has_person_name,
            result.has_institution,
            result.has_degree_keyword,
            result.has_date,
            result.has_certification_phrase,
            result.semantic_score,
            result.structure_count,
            result.keyword_density,
            result.diploma_confidence,
            result.doc_type,
            result.coherence_score,
            result.keyword_penalty,
        )

    except Exception as e:
        logger.error("Erreur analyse textuelle : %s", e)
        result.reasons.append("Erreur lors de l'analyse du texte")

    return result
