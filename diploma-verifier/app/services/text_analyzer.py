"""
Analyse textuelle du diplôme : mentions officielles, mots-clés,
cohérence du texte, type de diplôme via NLP et regex.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime

from app.config import DIPLOMA_KEYWORDS, DIPLOMA_TYPES, OFFICIAL_PATTERNS
from app.utils.logger import logger


@dataclass
class TextAnalysisResult:
    """Résultat de l'analyse textuelle."""
    official_mention_found: bool = False
    mentions_detected: list[str] = field(default_factory=list)
    keywords_ratio: float = 0.0
    diploma_type: str = "unknown"
    text_coherence_score: float = 0.0
    nlp_entities: dict[str, list[str]] = field(default_factory=dict)
    flags: list[str] = field(default_factory=list)


def _check_official_mentions(text: str) -> tuple[bool, list[str]]:
    """Vérifie la présence de mentions officielles dans le texte."""
    mentions: list[str] = []

    for category, patterns in OFFICIAL_PATTERNS.items():
        for pattern in patterns:
            try:
                matches = re.findall(pattern, text, re.IGNORECASE | re.UNICODE)
                for match in matches:
                    cleaned: str = match.strip()
                    if cleaned and cleaned not in mentions:
                        mentions.append(cleaned)
            except re.error:
                continue

    return len(mentions) > 0, mentions


def _calculate_keywords_ratio(text: str, language: str) -> float:
    """Calcule le ratio de mots-clés de diplôme trouvés dans le texte."""
    text_lower: str = text.lower()

    # Tester la langue détectée en priorité, puis toutes les autres
    languages_to_check: list[str] = [language] + [
        lang for lang in DIPLOMA_KEYWORDS if lang != language
    ]

    best_ratio: float = 0.0

    for lang in languages_to_check:
        keywords = DIPLOMA_KEYWORDS.get(lang, [])
        if not keywords:
            continue

        found: int = sum(1 for kw in keywords if kw.lower() in text_lower)
        ratio: float = found / len(keywords)

        if ratio > best_ratio:
            best_ratio = ratio

    return round(best_ratio, 2)


def _detect_diploma_type(text: str, language: str) -> str:
    """Détecte le type de diplôme dans le texte."""
    text_lower: str = text.lower()

    # Tester la langue détectée en priorité
    languages_to_check: list[str] = [language] + [
        lang for lang in DIPLOMA_TYPES if lang != language
    ]

    for lang in languages_to_check:
        types = DIPLOMA_TYPES.get(lang, [])
        # Tester les types les plus spécifiques d'abord (les plus longs)
        for dtype in sorted(types, key=len, reverse=True):
            if dtype.lower() in text_lower:
                return dtype.capitalize()

    return "unknown"


def _extract_nlp_entities(text: str, language: str) -> dict[str, list[str]]:
    """Extrait les entités nommées via spaCy."""
    try:
        from app.services.ocr_service import _spacy_fr, _spacy_xx

        nlp = _spacy_fr if language == "fr" else _spacy_xx
        if nlp is None:
            return {}

        doc = nlp(text[:5000])
        entities: dict[str, list[str]] = {}

        for ent in doc.ents:
            label: str = ent.label_
            if label not in entities:
                entities[label] = []
            if ent.text.strip() not in entities[label]:
                entities[label].append(ent.text.strip())

        return entities
    except Exception as e:
        logger.warning("Extraction NLP échouée : %s", e)
        return {}


def _check_date_coherence(text: str) -> tuple[float, list[str]]:
    """Vérifie la cohérence des dates trouvées dans le texte."""
    flags: list[str] = []
    score: float = 1.0

    # Chercher toutes les années à 4 chiffres
    years = re.findall(r"\b(19\d{2}|20\d{2})\b", text)
    current_year: int = datetime.now().year

    if not years:
        flags.append("Aucune date trouvée dans le document")
        score -= 0.2

    for year_str in years:
        year = int(year_str)
        if year > current_year:
            flags.append(f"Année future détectée : {year}")
            score -= 0.3
        if year < 1900:
            flags.append(f"Année antérieure à 1900 : {year}")
            score -= 0.2

    # Vérifier la cohérence des années académiques
    academic_years = re.findall(r"(\d{4})\s*[/\-]\s*(\d{4})", text)
    for start_str, end_str in academic_years:
        start, end = int(start_str), int(end_str)
        if end - start != 1:
            flags.append(f"Année académique incohérente : {start}/{end}")
            score -= 0.2

    return max(0.0, min(1.0, score)), flags


def _check_text_structure(text: str) -> tuple[float, list[str]]:
    """Vérifie la structure générale du texte d'un diplôme."""
    flags: list[str] = []
    score: float = 0.5  # Score de base

    # Un diplôme a généralement un texte d'une certaine longueur
    word_count: int = len(text.split())

    if word_count < 15:
        flags.append("Texte très court pour un diplôme")
        score -= 0.3
    elif word_count > 30:
        score += 0.2

    # Vérifier la présence de lignes structurées
    lines: list[str] = [line.strip() for line in text.split("\n") if line.strip()]
    if len(lines) < 3:
        flags.append("Trop peu de lignes structurées")
        score -= 0.2
    elif len(lines) > 5:
        score += 0.1

    return max(0.0, min(1.0, score)), flags


def analyze_text(text: str, language: str = "unknown") -> TextAnalysisResult:
    """Pipeline complet d'analyse textuelle.

    Vérifie les mentions officielles, les mots-clés, la cohérence
    et extrait les entités NLP.
    """
    result = TextAnalysisResult()

    try:
        if not text or len(text.strip()) < 5:
            result.flags.append("Texte insuffisant pour l'analyse")
            return result

        # 1. Mentions officielles
        result.official_mention_found, result.mentions_detected = (
            _check_official_mentions(text)
        )

        # 2. Ratio de mots-clés
        result.keywords_ratio = _calculate_keywords_ratio(text, language)

        # 3. Type de diplôme
        result.diploma_type = _detect_diploma_type(text, language)

        # 4. Entités NLP
        result.nlp_entities = _extract_nlp_entities(text, language)

        # 5. Cohérence des dates
        date_score, date_flags = _check_date_coherence(text)
        result.flags.extend(date_flags)

        # 6. Structure du texte
        structure_score, structure_flags = _check_text_structure(text)
        result.flags.extend(structure_flags)

        # Score de cohérence global
        mention_bonus: float = 0.2 if result.official_mention_found else 0.0
        keyword_bonus: float = result.keywords_ratio * 0.3
        type_bonus: float = 0.1 if result.diploma_type != "unknown" else 0.0

        result.text_coherence_score = round(
            min(
                1.0,
                date_score * 0.3
                + structure_score * 0.2
                + mention_bonus
                + keyword_bonus
                + type_bonus,
            ),
            2,
        )

        logger.info(
            "Analyse texte — mentions=%s | mots-clés=%.2f | type=%s | cohérence=%.2f",
            result.official_mention_found,
            result.keywords_ratio,
            result.diploma_type,
            result.text_coherence_score,
        )

    except Exception as e:
        logger.error("Erreur lors de l'analyse textuelle : %s", e)
        result.flags.append(f"Erreur analyse texte : {str(e)}")

    return result
