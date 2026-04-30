"""
Analyse textuelle sémantique du diplôme.

Détecte :
  - Nom de personne  (spaCy + regex fallback)
  - Institution / université
  - Mot-clé de diplôme (licence, master, bachelor…)
  - Présence d'une date / année

Calcule :
  - completeness_score (0–1)
  - diploma_confidence (0–1)
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.config import DIPLOMA_KEYWORDS, DIPLOMA_TYPES, OFFICIAL_PATTERNS
from app.utils.logger import logger


# ──────────────────────────────────────────────
# Regex fallback pour les noms propres
# ──────────────────────────────────────────────
_NAME_PATTERN = re.compile(
    r"(?:(?:M\.|Mme|Mr\.?|Mrs\.?|Monsieur|Madame|Mademoiselle|Mlle)"
    r"\s+)?([A-ZÀ-ÖÙ-Ü][a-zà-öù-ü]+(?:\s+[A-ZÀ-ÖÙ-Ü][a-zà-öù-ü]+)+)"
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
_YEAR_PATTERN = re.compile(r"\b(19\d{2}|20\d{2})\b")


@dataclass
class TextAnalysisResult:
    """Résultat de l'analyse textuelle sémantique."""

    has_person_name: bool = False
    has_institution: bool = False
    has_degree_keyword: bool = False
    has_date: bool = False
    official_mention_found: bool = False
    mentions_detected: list[str] = field(default_factory=list)

    diploma_confidence: float = 0.0
    completeness_score: float = 0.0

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

    # 2. Regex fallback
    match = _NAME_PATTERN.search(text)
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
# Mots-clés de diplôme (ratio)
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


# ──────────────────────────────────────────────
# Pipeline principal
# ──────────────────────────────────────────────

def analyze_text(text: str, language: str = "unknown") -> TextAnalysisResult:
    """Analyse sémantique complète du texte extrait.

    Retourne un TextAnalysisResult avec les détections
    et les scores de complétude / confiance.
    """
    result = TextAnalysisResult()

    try:
        if not text or len(text.strip()) < 5:
            result.reasons.append("Document vide ou contenu insuffisant")
            return result

        # 1. Nom de personne
        name = _detect_person_name(text, language)
        if name:
            result.has_person_name = True
            result.detected_name = name
        else:
            result.reasons.append("Nom du titulaire non détecté")

        # 2. Institution
        institution = _detect_institution(text, language)
        if institution:
            result.has_institution = True
            result.detected_institution = institution
        else:
            result.reasons.append("Institution non identifiée")

        # 3. Mot-clé de diplôme
        degree = _detect_degree(text)
        if degree:
            result.has_degree_keyword = True
            result.detected_degree = degree
        else:
            result.reasons.append("Type de diplôme non reconnu")

        # 4. Date / année
        result.has_date = _detect_date(text)
        if not result.has_date:
            result.reasons.append("Date ou année non détectée")

        # 5. Mentions officielles
        result.official_mention_found, result.mentions_detected = (
            _check_official_mentions(text)
        )

        # 6. Diploma keyword ratio (pour la confiance)
        kw_ratio = _diploma_keyword_ratio(text, language)

        # ── Calcul completeness_score ──
        fields = [
            result.has_person_name,
            result.has_institution,
            result.has_degree_keyword,
            result.has_date,
        ]
        result.completeness_score = round(sum(fields) / len(fields), 2)

        # ── Calcul diploma_confidence ──
        # Pondéré : keywords ratio + complétude + mentions
        confidence = (
            kw_ratio * 0.40
            + result.completeness_score * 0.40
            + (0.20 if result.official_mention_found else 0.0)
        )
        result.diploma_confidence = round(min(1.0, confidence), 2)

        logger.info(
            "Analyse texte — nom=%s | institution=%s | diplôme=%s | "
            "date=%s | complétude=%.2f | confiance=%.2f",
            result.has_person_name,
            result.has_institution,
            result.has_degree_keyword,
            result.has_date,
            result.completeness_score,
            result.diploma_confidence,
        )

    except Exception as e:
        logger.error("Erreur analyse textuelle : %s", e)
        result.reasons.append("Erreur lors de l'analyse du texte")

    return result
