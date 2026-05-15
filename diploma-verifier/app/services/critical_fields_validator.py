"""
V7 — Critical Fields Validator.

Module dédié à la validation des champs critiques d'un diplôme :
nom, prénom, type de diplôme, date, institution, spécialisation.

Ne refait PAS l'extraction (déjà faite par text_analyzer + spaCy/regex).
Consomme les signaux déjà produits par analyze_text() et calcule un score
0–100 par champ, puis un score agrégé pondéré.

Résout le problème central V6 : un template officiel (cachet + signature +
mention ministérielle) sans identité étudiante peut atteindre 60–75. Le
critical_fields_score isole cette dimension pour permettre au scoring V7
de plafonner ces faux positifs.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field

from app.config import (
    CRITICAL_FIELDS_TEMPLATE_CAP,
    CRITICAL_FIELDS_WEIGHTS,
    OCR_LOW_CONFIDENCE_THRESHOLD,
    OCR_PENALTY_MULTIPLIER,
    SPECIALIZATION_KEYWORDS,
)
from app.services.text_analyzer import TextAnalysisResult
from app.utils.logger import logger


# Sources de détection — alignées avec text_analyzer.TextAnalysisResult.name_source
NAME_SOURCE_NONE = "none"
NAME_SOURCE_SPACY = "spacy"
NAME_SOURCE_REGEX_LATIN = "regex_latin"
NAME_SOURCE_REGEX_ARABIC = "regex_arabic"
# Alias pour compat ascendante (anciennement utilisé)
NAME_SOURCE_REGEX = "regex_latin"

# Pattern complet (jour + mois + année) — score plus haut qu'une simple année.
_FULL_DATE_PATTERN = re.compile(
    r"\b\d{1,2}[\s/.\-]+(?:\d{1,2}|janv|févr|mars|avril|mai|juin|juill|"
    r"août|sept|oct|nov|déc|jan|feb|mar|apr|may|jun|jul|aug|nov|dec)"
    r"[\s/.\-]+\d{2,4}\b",
    re.IGNORECASE | re.UNICODE,
)
_YEAR_PATTERN = re.compile(r"(?<!\d)(19\d{2}|20\d{2})(?!\d)")


# ──────────────────────────────────────────────
# V7 Fix 1 — Faux positifs spaCy NER
# ──────────────────────────────────────────────
# Mots-clés officiels/ministériels que spaCy détecte parfois comme PER
# (notamment sur du texte OCR bruité). Si le `detected_name` chevauche
# un de ces termes, on rejette la détection.
_NAME_FALSE_POSITIVE_KEYWORDS = [
    # Arabic — ministères, république, fonctions officielles
    "وزير", "وزارة", "التربية", "التعليم", "العالي",
    "البحث", "الجمهورية", "وزراء", "رئيس", "مدير",
    "كلية", "جامعة", "معهد", "مديرية",
    # French — fonctions officielles, structures
    "ministre", "ministere", "ministère", "delegation",
    "délégation", "direction", "republique", "république",
    "universite", "université", "faculte", "faculté", "institut",
    "president", "président", "directeur", "doyen", "recteur",
    "academie", "académie",
    # English
    "ministry", "department", "president", "director",
    "university", "faculty", "institute", "academy",
]


def _is_false_positive_name(name: str | None) -> bool:
    """Retourne True si `name` chevauche un mot-clé officiel/ministériel.

    Robuste à la casse, aux accents (NFKD strip), et aux espaces.
    """
    if not name:
        return False
    name_norm = _strip_accents_lower(name)
    if not name_norm:
        return False
    for kw in _NAME_FALSE_POSITIVE_KEYWORDS:
        kw_norm = _strip_accents_lower(kw)
        if kw_norm and kw_norm in name_norm:
            return True
    return False


def _count_real_chars(name: str | None) -> int:
    """Compte les caractères alphabétiques réels (Latin + Arabe).

    Exclut chiffres, ponctuation, espaces. Permet de détecter les
    "noms" qui ne sont en fait que du bruit OCR (ex: "X1!", "(Layard").
    """
    if not name:
        return 0
    # Garde uniquement les lettres Latin (avec accents) et Arabe (block U+0600-U+06FF)
    real = re.sub(
        r"[^a-zA-ZÀ-ÖØ-öø-ÿĀ-ɏ؀-ۿ]",
        "",
        name,
    )
    return len(real)


# ──────────────────────────────────────────────
# V7 Fix 2 — Patterns de champs blank (template officiel sans données)
# ──────────────────────────────────────────────
# Repère les structures du type "label : <vide>" caractéristiques d'un
# document modèle non rempli. Chaque pattern qui match ajoute un point
# de "blank score". À ≥ TEMPLATE_BLANK_THRESHOLD points et sans nom
# valide, on flag is_template_without_identity.
_TEMPLATE_BLANK_PATTERNS = [
    # Arabe — "يسند شهادة [...] إلى" suivi de fin de ligne (pas de nom)
    re.compile(
        r"يسند\s+شهادة[^\n]{0,80}إلى\s*(?:\n|$)",
        re.UNICODE,
    ),
    # Arabe — "إلى" suivi immédiatement (ligne suivante) du label "المولود"
    # (sans nom intercalé)
    re.compile(r"إلى\s*\n\s*المولود", re.UNICODE),
    # Arabe — "المولود(ة) في" suivi directement de "ولاية" sans date
    # (les caractères entre "المولود" et "في" tolèrent OCR noise: ()ة)
    re.compile(
        r"المولود[\(\)ةا\s]{0,15}في\s+ولاية",
        re.UNICODE,
    ),
    # Arabe — "المولود(ة) في" suivi de fin de ligne (date manquante)
    re.compile(
        r"المولود[\(\)ةا\s]{0,15}في\s*(?:\n|$)",
        re.UNICODE,
    ),
    # Arabe — "بملاحظة" (mention) en fin de ligne, rien après
    re.compile(r"بملاحظة\s*(?:\n|$)", re.UNICODE),
    # Arabe — "تحت عدد" (under number) sans chiffre
    re.compile(r"تحت\s+عدد\s*(?:\n|$|[^\d\n])", re.UNICODE),
    # Français — "Né(e) le" en fin de ligne (date manquante)
    re.compile(r"N[ée]\(?e?\)?\s+le\s*$", re.IGNORECASE | re.MULTILINE),
    # Français — "Délivré à" en fin de ligne
    re.compile(
        r"D[ée]livr[ée]?\s+(?:à|au?)\s*$",
        re.IGNORECASE | re.MULTILINE,
    ),
    # Français — "M./Mme" en fin de ligne (titre sans nom)
    re.compile(
        r"\b(?:M\.|Mme|Mlle|Monsieur|Madame)\s*(?:\n|$)",
        re.IGNORECASE | re.MULTILINE,
    ),
]

# Seuil : ≥ 1 pattern match suffit (les patterns sont déjà spécifiques —
# un seul vrai match est un signal fort).
_TEMPLATE_BLANK_THRESHOLD = 1


def _count_template_blanks(text: str) -> int:
    """Compte les patterns de champ blank dans le texte OCR."""
    if not text:
        return 0
    return sum(1 for p in _TEMPLATE_BLANK_PATTERNS if p.search(text))


# ──────────────────────────────────────────────
# V7 Fix 2 (renforcé) — Détection structurelle de template
# ──────────────────────────────────────────────
# Approche OCR-résistante : on recherche les libellés de champs (qui sont
# stables car courts et fréquents) et on mesure le nombre de caractères
# arabes entre deux libellés adjacents. En modèle vide, les libellés se
# suivent avec très peu de contenu entre eux. En diplôme rempli, chaque
# libellé est suivi de données substantielles.
_DIPLOMA_FIELD_LABELS_AR = [
    "إلى",       # to (followed by name)
    "المولود",   # born
    "ولاية",     # region
    "والمرسم",   # registered
    "والمرس",    # registered (variante OCR fréquente)
    "والمسجل",   # registered (variante)
    "شعبة",      # section/specialization
    "تحت عدد",   # under number (with number)
    "بملاحظة",   # mention
    "دورة",      # session
]

_ARABIC_LETTER_RE = re.compile(r"[؀-ۿ]")


def _arabic_letter_count(text: str) -> int:
    """Compte les caractères du bloc Arabe (U+0600 – U+06FF)."""
    if not text:
        return 0
    return len(_ARABIC_LETTER_RE.findall(text))


def _count_adjacent_blank_fields(
    text: str,
    min_arabic_chars_between: int = 5,
) -> int:
    """Compte les paires de libellés adjacents avec ≤ N caractères arabes entre eux.

    Algorithme :
      1. Localise toutes les occurrences des libellés de diplôme.
      2. Trie par position dans le texte.
      3. Pour chaque paire adjacente, compte les caractères arabes
         dans le segment entre la fin du libellé 1 et le début du libellé 2.
      4. Si le segment contient < min_arabic_chars_between caractères arabes,
         considère que ce champ est blank (placeholder non rempli).

    Returns : nombre de paires blank détectées (signal fort si ≥ 2).
    """
    if not text:
        return 0

    positions: list[tuple[int, str, int]] = []
    for label in _DIPLOMA_FIELD_LABELS_AR:
        idx = 0
        while True:
            idx = text.find(label, idx)
            if idx < 0:
                break
            positions.append((idx, label, len(label)))
            idx += len(label)

    if len(positions) < 2:
        return 0

    positions.sort()

    blank_count = 0
    for i in range(len(positions) - 1):
        start_idx, _, start_len = positions[i]
        end_idx, _, _ = positions[i + 1]
        # Skip overlap (un libellé contenu dans un autre)
        if end_idx <= start_idx + start_len:
            continue
        between = text[start_idx + start_len:end_idx]
        ar_chars = _arabic_letter_count(between)
        if ar_chars < min_arabic_chars_between:
            blank_count += 1

    return blank_count


# ──────────────────────────────────────────────
# V7 Fix 1 (renforcé) — Contexte officiel/légal d'une ligne
# ──────────────────────────────────────────────
# Si un nom détecté apparaît sur une ligne dominée par du texte
# officiel/légal (mots-clés OU densité élevée de chiffres/dates), on
# considère que c'est une fausse détection (préambule légal, et non
# l'identité de l'étudiant).
# Mots-clés strictement de préambule légal — peu probables sur la ligne
# qui porte le nom de l'étudiant dans un vrai diplôme. Volontairement
# limités : on EXCLUT "république", "وزارة", "université" car ils peuvent
# coexister avec le nom dans l'en-tête d'un vrai document.
_OFFICIAL_CONTEXT_KEYWORDS = [
    # Arabic — formulations strictement réglementaires
    "قرار", "الأمر", "المؤرخ", "بمقتضى", "بناء على",
    "اطلاعه", "القانون", "المتعلق", "الفصل",
    # French — références légales
    "décret", "arrêté", "considérant", "vu les",
    # English
    "decree",
]


def _is_name_in_official_context(name: str | None, raw_text: str | None) -> bool:
    """Détecte si le nom apparaît sur une ligne du préambule légal.

    Condition : la ligne contenant `name` contient aussi un mot-clé
    strictement légal (`قرار`, `بمقتضى`, `décret`, etc.). On NE compte
    PAS les chiffres/dates car les vraies lignes de diplôme contiennent
    aussi des dates ("Né le 2004/02/13").
    """
    if not name or not raw_text:
        return False

    name_norm = _strip_accents_lower(name)
    if not name_norm:
        return False

    for line in raw_text.split("\n"):
        line_norm = _strip_accents_lower(line)
        if name_norm not in line_norm:
            continue
        for kw in _OFFICIAL_CONTEXT_KEYWORDS:
            kw_norm = _strip_accents_lower(kw)
            if kw_norm and kw_norm in line_norm:
                return True

    return False


@dataclass
class CriticalFieldsResult:
    """Résultat de la validation des champs critiques."""

    score: int = 0                                  # 0–100, score agrégé pondéré
    confidence: float = 0.0                         # 0.0–1.0
    field_scores: dict[str, int] = field(default_factory=dict)
    reasons: list[str] = field(default_factory=list)

    # Indicateur : le document ressemble à un template officiel
    # (degree keyword présent) MAIS sans identité ni date.
    is_template_without_identity: bool = False


def _strip_accents_lower(text: str) -> str:
    """NFKD + strip combining + lowercase. Préserve l'arabe."""
    if not text:
        return ""
    n = unicodedata.normalize("NFKD", text)
    n = "".join(c for c in n if not unicodedata.combining(c))
    return n.lower()


def _split_full_name(detected_name: str | None) -> tuple[str | None, str | None]:
    """Sépare un nom complet en (prénom, nom) — best effort.

    Convention : premier token = prénom, reste = nom de famille.
    Pour l'arabe, l'ordre conventionnel diffère mais on garde la même
    règle (premier = "first", reste = "last") — le score critical_fields
    reste valide (présence vs absence), seule l'attribution sémantique
    est approximative.
    """
    if not detected_name:
        return None, None

    parts = [p for p in detected_name.strip().split() if p]
    if not parts:
        return None, None
    if len(parts) == 1:
        return parts[0], None
    return parts[0], " ".join(parts[1:])


def _score_name_part(
    part: str | None,
    source: str,
    ocr_low_confidence: bool,
) -> tuple[int, str]:
    """Score un fragment de nom (prénom OU nom).

    - 0   si absent
    - 40  si regex-only (Latin ou Arabe)
    - 80  si spaCy NER
    - +20 bonus si longueur > 2 caractères

    Ajustement OCR : si ocr_confidence est faible et le champ est absent,
    on ne pénalise qu'à moitié (multiplier appliqué côté agrégation).
    """
    if not part:
        return 0, "none"

    if source == NAME_SOURCE_SPACY:
        base = 80
    elif source in (NAME_SOURCE_REGEX_LATIN, NAME_SOURCE_REGEX_ARABIC):
        base = 40
    else:
        return 0, "none"

    if len(part) > 2:
        base = min(100, base + 20)

    return base, source


def _score_degree(
    has_degree_keyword: bool,
    doc_type: str,
    detected_degree: str | None,
) -> int:
    """Score le champ degree (type de diplôme).

    - 0  si aucun mot-clé de diplôme détecté
    - 90 si mot-clé détecté ET classifié comme "diploma"
    - 60 si mot-clé générique uniquement (doc_type != "diploma")
    """
    if not has_degree_keyword:
        return 0
    if doc_type == "diploma" and detected_degree:
        return 90
    if doc_type == "diploma":
        return 80
    return 60


def _score_date(raw_text: str, has_date: bool) -> int:
    """Score le champ date.

    - 0  si aucune année/date détectée
    - 85 si année extraite
    - 95 si date complète (jour + mois + année) détectée
    """
    if not has_date:
        return 0
    if _FULL_DATE_PATTERN.search(raw_text):
        return 95
    if _YEAR_PATTERN.search(raw_text):
        return 85
    return 60  # has_date True mais pattern non reconnu — fallback


def _score_institution(has_institution: bool) -> int:
    """Score le champ institution."""
    return 70 if has_institution else 0


def _score_specialization(raw_text: str) -> int:
    """Score le champ spécialisation via recherche par mots-clés."""
    if not raw_text:
        return 0
    normalized = _strip_accents_lower(raw_text)
    for kw in SPECIALIZATION_KEYWORDS:
        kw_norm = _strip_accents_lower(kw)
        if kw_norm and kw_norm in normalized:
            return 60
    return 0


def _aggregate_score(field_scores: dict[str, int]) -> int:
    """Calcule la moyenne pondérée des scores de champ (0–100)."""
    total = 0.0
    for key, weight in CRITICAL_FIELDS_WEIGHTS.items():
        total += field_scores.get(key, 0) * weight
    return int(round(total))


def _apply_ocr_uncertainty_bonus(
    field_scores: dict[str, int],
    ocr_confidence: float,
) -> dict[str, int]:
    """Atténue les scores nuls quand l'OCR est de faible qualité.

    Si ocr_confidence < OCR_LOW_CONFIDENCE_THRESHOLD, on remonte les
    scores à 0 vers une "incertitude" plutôt qu'une absence avérée :
    on les passe à round(ocr_penalty_floor) où ocr_penalty_floor =
    (1 - OCR_PENALTY_MULTIPLIER) * 50 = 25 (par défaut).

    Cela évite de pénaliser deux fois un OCR raté : le critical_fields
    reflète l'incertitude, pas une fraude.
    """
    if ocr_confidence >= OCR_LOW_CONFIDENCE_THRESHOLD:
        return field_scores

    floor = int(round((1.0 - OCR_PENALTY_MULTIPLIER) * 50))  # = 25
    adjusted = dict(field_scores)
    for key, value in field_scores.items():
        if value == 0:
            adjusted[key] = floor
    return adjusted


def validate_critical_fields(
    raw_text: str,
    analysis_result: TextAnalysisResult,
    ocr_confidence: float,
) -> CriticalFieldsResult:
    """Valide les champs critiques d'un diplôme.

    Parameters
    ----------
    raw_text : str
        Texte OCR brut (utilisé pour spécialisation + pattern date complet).
    analysis_result : TextAnalysisResult
        Résultat de text_analyzer.analyze_text() — réutilise ses signaux.
    ocr_confidence : float
        Confiance OCR moyenne (0.0–1.0).

    Returns
    -------
    CriticalFieldsResult
    """
    result = CriticalFieldsResult()

    # ── 1. Pré-calcul : signal structurel template (utilisé par Fix 1 et Fix 2) ──
    # Ce comptage est OCR-résistant : les libellés de champs sont stables
    # même quand le contenu environnant est garblé.
    adjacent_blanks = _count_adjacent_blank_fields(raw_text)
    has_strong_template_structure = (
        analysis_result.has_degree_keyword and adjacent_blanks >= 2
    )

    # ── 2. Nom : récupérer la source réelle + valider contre faux positifs ──
    has_person_name = analysis_result.has_person_name
    detected_name = analysis_result.detected_name
    name_source = analysis_result.name_source or NAME_SOURCE_NONE

    rejection_reason: str | None = None

    if has_person_name and detected_name:
        # V7 Fix 1a — rejet faux positif ministère/officiel (match exact)
        # spaCy NER hallucinе parfois des "PER" depuis "Ministre", "وزارة", etc.
        if _is_false_positive_name(detected_name):
            logger.info(
                "V7 fix1a — detected_name='%s' chevauche un mot-clé "
                "officiel/ministériel → rejeté",
                detected_name,
            )
            has_person_name = False
            detected_name = None
            name_source = NAME_SOURCE_NONE
            rejection_reason = "false_positive_official_keyword"

        # V7 Fix 1b — rejet "noms" trop courts (bruit OCR)
        elif _count_real_chars(detected_name) < 3:
            logger.info(
                "V7 fix1b — detected_name='%s' trop court (<3 lettres "
                "réelles) → rejeté",
                detected_name,
            )
            has_person_name = False
            detected_name = None
            name_source = NAME_SOURCE_NONE
            rejection_reason = "false_positive_short_name"

        # V7 Fix 1c — rejet nom dans contexte officiel/légal d'une ligne
        # Catches OCR-garbled ministry names like "ومرس الثرة" qui passent
        # le filtre keyword mais apparaissent sur des lignes de préambule.
        elif _is_name_in_official_context(detected_name, raw_text):
            logger.info(
                "V7 fix1c — detected_name='%s' apparaît dans le contexte "
                "officiel/légal d'une ligne → rejeté",
                detected_name,
            )
            has_person_name = False
            detected_name = None
            name_source = NAME_SOURCE_NONE
            rejection_reason = "false_positive_official_context"

        # V7 Fix 2 (override) — structure template forte + nom détecté
        # On considère que le "nom" est une fausse détection de la zone
        # ministère/préambule, pas l'identité étudiante.
        elif has_strong_template_structure:
            logger.info(
                "V7 fix2 — structure template forte (%d champs blank "
                "adjacents) → annule la détection du nom '%s'",
                adjacent_blanks, detected_name,
            )
            has_person_name = False
            detected_name = None
            name_source = NAME_SOURCE_NONE
            rejection_reason = "structural_template_override"

    # Split + scoring (utilise les valeurs locales, post-validation)
    first, last = _split_full_name(detected_name)

    ocr_low = ocr_confidence < OCR_LOW_CONFIDENCE_THRESHOLD

    first_score, _ = _score_name_part(first, name_source, ocr_low)
    last_score, _ = _score_name_part(last, name_source, ocr_low)

    # ── 2. Degree ──
    degree_score = _score_degree(
        analysis_result.has_degree_keyword,
        analysis_result.doc_type,
        analysis_result.detected_degree,
    )

    # ── 3. Date ──
    date_score = _score_date(raw_text, analysis_result.has_date)

    # ── 4. Institution ──
    institution_score = _score_institution(analysis_result.has_institution)

    # ── 5. Specialization ──
    specialization_score = _score_specialization(raw_text)

    field_scores: dict[str, int] = {
        "first_name":     first_score,
        "last_name":      last_score,
        "degree":         degree_score,
        "date":           date_score,
        "institution":    institution_score,
        "specialization": specialization_score,
    }

    # ── 6. Tolérance OCR sur les zéros ──
    field_scores = _apply_ocr_uncertainty_bonus(field_scores, ocr_confidence)

    # ── 7. Score agrégé pondéré ──
    aggregated = _aggregate_score(field_scores)

    # ── 8. Détection template-sans-identité (3 chemins indépendants) ──
    # `has_person_name` est la valeur LOCALE (post-validation Fix 1+2) :
    # un faux positif rejeté ici est traité comme "pas de nom".
    template_blank_count = _count_template_blanks(raw_text)
    has_template_blanks = template_blank_count >= _TEMPLATE_BLANK_THRESHOLD

    is_template_strict = (
        analysis_result.has_degree_keyword
        and not has_person_name
        and not analysis_result.has_date
    )
    is_template_pattern = (
        analysis_result.has_degree_keyword
        and has_template_blanks
        and not has_person_name
    )
    # NEW : signal structurel autonome — flag même si has_person_name n'a
    # pas été rejeté (filet de sécurité face à du garbage OCR imprévu).
    is_template_structural = has_strong_template_structure

    is_template = (
        is_template_strict or is_template_pattern or is_template_structural
    )

    if is_template:
        aggregated = min(aggregated, CRITICAL_FIELDS_TEMPLATE_CAP)
        result.is_template_without_identity = True
        logger.info(
            "V7 template flagged (strict=%s, pattern=%s, structural=%s | "
            "blank_patterns=%d, adjacent_blanks=%d, name_rejected=%s) "
            "→ cap %d",
            is_template_strict, is_template_pattern, is_template_structural,
            template_blank_count, adjacent_blanks, rejection_reason,
            CRITICAL_FIELDS_TEMPLATE_CAP,
        )

    # ── 9. Confidence du module : combinaison ocr + complétude ──
    completeness = sum(1 for v in field_scores.values() if v >= 60)
    result.confidence = round(
        (ocr_confidence * 0.5) + ((completeness / len(field_scores)) * 0.5),
        3,
    )

    # ── 10. Reasons descriptives ──
    reasons: list[str] = []

    if is_template:
        reasons.append("Template officiel sans identité étudiante détectée")

    # V7 Fix 1+2 — raison explicite si le nom a été rejeté
    if rejection_reason == "false_positive_official_keyword":
        reasons.append(
            "Nom détecté correspond à un terme officiel/ministériel — rejeté",
        )
    elif rejection_reason == "false_positive_short_name":
        reasons.append(
            "Nom détecté trop court — bruit OCR probable",
        )
    elif rejection_reason == "false_positive_official_context":
        reasons.append(
            "Nom détecté dans le préambule légal du document — rejeté",
        )
    elif rejection_reason == "structural_template_override":
        reasons.append(
            "Structure de template officiel détectée — nom annulé",
        )

    if first_score == 0 and last_score == 0:
        if not ocr_low and rejection_reason is None:
            reasons.append("Nom du titulaire non détecté")
    elif first_score < 60 or last_score < 60:
        reasons.append("Identité partiellement détectée")
    elif first_score >= 80 and last_score >= 80:
        reasons.append("Identité étudiante clairement détectée")

    if degree_score == 0:
        reasons.append("Type de diplôme non reconnu")
    elif degree_score >= 80:
        reasons.append("Type de diplôme clairement identifié")

    if date_score == 0 and not ocr_low:
        reasons.append("Date ou année non détectée")
    elif date_score >= 90:
        reasons.append("Date complète détectée")

    if institution_score == 0 and not ocr_low:
        reasons.append("Institution non identifiée")

    if specialization_score == 0:
        # signal faible — on n'ajoute la raison que si tout le reste est faible aussi
        if aggregated < 30:
            reasons.append("Spécialisation académique non détectée")

    if ocr_low and aggregated < 50:
        reasons.append("Qualité OCR faible — détection partielle des champs")

    result.score = max(0, min(100, aggregated))
    result.field_scores = field_scores
    result.reasons = reasons

    logger.info(
        "Critical fields V7 — first=%d | last=%d | degree=%d | date=%d | "
        "institution=%d | spec=%d | aggregated=%d | template=%s | "
        "ocr_conf=%.2f",
        first_score, last_score, degree_score, date_score,
        institution_score, specialization_score, result.score,
        result.is_template_without_identity, ocr_confidence,
    )

    return result
