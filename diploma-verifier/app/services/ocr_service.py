"""
Service OCR : extraction de texte, détection de langue,
extraction des champs clés via regex et spaCy.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime

import numpy as np
import pytesseract
from langdetect import LangDetectException, detect
from numpy.typing import NDArray
from PIL import Image

from app.config import DIPLOMA_TYPES, OCR_LANGUAGES
from app.utils.logger import logger

# Modèles spaCy chargés au démarrage (cf. main.py)
_spacy_fr = None
_spacy_xx = None


def load_spacy_models() -> None:
    """Charge les modèles spaCy une seule fois en mémoire."""
    global _spacy_fr, _spacy_xx
    import spacy

    if _spacy_fr is None:
        logger.info("Chargement du modèle spaCy fr_core_news_sm...")
        _spacy_fr = spacy.load("fr_core_news_sm")
    if _spacy_xx is None:
        logger.info("Chargement du modèle spaCy xx_ent_wiki_sm...")
        _spacy_xx = spacy.load("xx_ent_wiki_sm")


@dataclass
class OCRResult:
    """Résultat de l'extraction OCR."""
    full_text: str = ""
    extracted_fields: dict[str, str | None] = field(default_factory=dict)
    ocr_confidence: float = 0.0
    language_detected: str = "unknown"
    flags: list[str] = field(default_factory=list)


# --- Patterns regex pour l'extraction de champs ---

DATE_PATTERNS: list[str] = [
    r"\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})\b",
    r"\b(\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2})\b",
    r"\b(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|"
    r"août|septembre|octobre|novembre|décembre)\s+\d{4})\b",
    r"\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|"
    r"August|September|October|November|December)\s+\d{4})\b",
    r"\b(?:January|February|March|April|May|June|July|August|"
    r"September|October|November|December)\s+\d{1,2},?\s+\d{4}\b",
]

ACADEMIC_YEAR_PATTERN: str = r"(\d{4})\s*[/\-]\s*(\d{4})"

GRADE_PATTERNS: dict[str, list[str]] = {
    "fr": [
        r"mention\s*[:\s]*(.+?)(?:\n|$)",
        r"(très bien|bien|assez bien|passable|excellent)",
    ],
    "en": [
        r"(cum laude|magna cum laude|summa cum laude)",
        r"(first class|second class|third class|distinction|merit|pass)",
        r"(?:grade|gpa)\s*[:\s]*([\d.]+(?:\s*/\s*[\d.]+)?)",
    ],
}


def _extract_text_tesseract(image: NDArray[np.uint8]) -> tuple[str, float]:
    """Extrait le texte et la confiance OCR moyenne via Tesseract."""
    try:
        # Extraction du texte brut
        pil_img = Image.fromarray(image)
        text: str = pytesseract.image_to_string(pil_img, lang=OCR_LANGUAGES)

        # Calcul de la confiance moyenne
        data = pytesseract.image_to_data(
            pil_img, lang=OCR_LANGUAGES, output_type=pytesseract.Output.DICT
        )
        confidences: list[int] = [
            int(c) for c in data["conf"] if str(c).isdigit() and int(c) > 0
        ]
        avg_confidence: float = (
            sum(confidences) / len(confidences) / 100.0
            if confidences
            else 0.0
        )

        return text.strip(), avg_confidence
    except Exception as e:
        logger.error("Erreur Tesseract : %s", e)
        return "", 0.0


def _detect_language(text: str) -> str:
    """Détecte la langue du texte extrait."""
    try:
        if len(text.strip()) < 20:
            return "unknown"
        lang: str = detect(text)
        return lang
    except LangDetectException:
        return "unknown"


def _extract_names_spacy(text: str, lang: str) -> tuple[str | None, str | None, str | None]:
    """Extrait les noms via les entités PER de spaCy."""
    try:
        nlp = _spacy_fr if lang == "fr" else _spacy_xx
        if nlp is None:
            return None, None, None

        doc = nlp(text[:5000])  # Limiter pour performance
        persons: list[str] = [
            ent.text.strip() for ent in doc.ents if ent.label_ == "PER"
        ]

        if not persons:
            return None, None, None

        # Prendre le premier nom détecté (souvent le titulaire)
        full_name: str = persons[0]
        parts: list[str] = full_name.split()
        first_name: str | None = parts[0] if parts else None
        last_name: str | None = " ".join(parts[1:]) if len(parts) > 1 else None

        return full_name, first_name, last_name
    except Exception as e:
        logger.warning("Extraction des noms spaCy échouée : %s", e)
        return None, None, None


def _extract_institutions_spacy(text: str, lang: str) -> str | None:
    """Extrait le nom de l'établissement via les entités ORG de spaCy."""
    try:
        nlp = _spacy_fr if lang == "fr" else _spacy_xx
        if nlp is None:
            return None

        doc = nlp(text[:5000])
        orgs: list[str] = [
            ent.text.strip() for ent in doc.ents if ent.label_ == "ORG"
        ]
        # Filtrer les organisations qui ressemblent à des établissements
        education_keywords = [
            "universit", "facult", "école", "institut", "college",
            "school", "academy", "hochschule", "جامعة", "كلية",
        ]
        for org in orgs:
            if any(kw in org.lower() for kw in education_keywords):
                return org

        return orgs[0] if orgs else None
    except Exception as e:
        logger.warning("Extraction des établissements spaCy échouée : %s", e)
        return None


def _extract_dates(text: str) -> str | None:
    """Extrait la première date trouvée dans le texte."""
    for pattern in DATE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(0)
    return None


def _extract_academic_year(text: str) -> str | None:
    """Extrait l'année universitaire (format YYYY/YYYY)."""
    match = re.search(ACADEMIC_YEAR_PATTERN, text)
    if match:
        return f"{match.group(1)}/{match.group(2)}"
    return None


def _extract_grade(text: str, lang: str) -> str | None:
    """Extrait la mention ou grade du diplôme."""
    patterns = GRADE_PATTERNS.get(lang, [])
    # Tester la langue détectée puis les autres
    all_patterns: list[str] = patterns.copy()
    for other_lang, other_patterns in GRADE_PATTERNS.items():
        if other_lang != lang:
            all_patterns.extend(other_patterns)

    for pattern in all_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1) if match.lastindex else match.group(0)
    return None


def _detect_diploma_type(text: str, lang: str) -> str | None:
    """Détecte le type de diplôme dans le texte."""
    text_lower = text.lower()

    # Tester la langue détectée en priorité
    languages_to_check: list[str] = [lang] + [
        l for l in DIPLOMA_TYPES if l != lang
    ]

    for check_lang in languages_to_check:
        types = DIPLOMA_TYPES.get(check_lang, [])
        for diploma_type in types:
            if diploma_type.lower() in text_lower:
                return diploma_type.capitalize()

    return None


def _validate_date(date_str: str | None) -> list[str]:
    """Vérifie la cohérence d'une date extraite (pas dans le futur, pas avant 1900)."""
    flags: list[str] = []
    if not date_str:
        return flags

    # Extraire l'année
    year_match = re.search(r"(\d{4})", date_str)
    if year_match:
        year = int(year_match.group(1))
        current_year = datetime.now().year
        if year > current_year:
            flags.append(f"Date dans le futur détectée : {date_str}")
        if year < 1900:
            flags.append(f"Date antérieure à 1900 : {date_str}")

    return flags


def extract_text(image: NDArray[np.uint8]) -> OCRResult:
    """Pipeline complet d'extraction OCR.

    Retourne un OCRResult avec le texte, les champs extraits,
    la confiance et la langue détectée.
    """
    result = OCRResult()

    try:
        # Étape 1 : extraction Tesseract
        full_text, confidence = _extract_text_tesseract(image)
        result.full_text = full_text
        result.ocr_confidence = confidence

        if not full_text:
            result.flags.append("Aucun texte extrait par l'OCR")
            return result

        if confidence < 0.3:
            result.flags.append(
                f"Confiance OCR très basse : {confidence:.2f}"
            )

        # Étape 2 : détection de la langue
        lang = _detect_language(full_text)
        result.language_detected = lang

        # Étape 3 : extraction des champs clés
        full_name, first_name, last_name = _extract_names_spacy(full_text, lang)
        institution = _extract_institutions_spacy(full_text, lang)
        date = _extract_dates(full_text)
        academic_year = _extract_academic_year(full_text)
        grade = _extract_grade(full_text, lang)
        diploma_type = _detect_diploma_type(full_text, lang)

        result.extracted_fields = {
            "full_name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "institution": institution,
            "date": date,
            "academic_year": academic_year,
            "grade": grade,
            "diploma_type": diploma_type,
        }

        # Étape 4 : validation des dates
        date_flags = _validate_date(date)
        result.flags.extend(date_flags)

        logger.info(
            "OCR terminé — confiance=%.2f | langue=%s | champs extraits=%d",
            confidence,
            lang,
            sum(1 for v in result.extracted_fields.values() if v is not None),
        )

    except Exception as e:
        logger.error("Erreur dans le service OCR : %s", e)
        result.flags.append(f"Erreur OCR : {str(e)}")

    return result
