"""
Service OCR : extraction de texte, détection de langue,
extraction des champs clés via regex et spaCy.

V6 — Production OCR fix :
  - Auto-rotation via pytesseract OSD
  - Simple preprocessing (grayscale + resize x2, NO aggressive threshold)
  - 3-pass OCR per language (ara / fra / eng) — NOT combined
  - Text normalization (lowercase, remove accents, strip special chars)
  - Semantic scoring based on diploma structure keywords
  - Best text selection purely by semantic score
  - Deterministic, no ML models
"""

from __future__ import annotations

import hashlib
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime

import cv2
import numpy as np
import pytesseract
from langdetect import LangDetectException, detect
from numpy.typing import NDArray
from PIL import Image

from app.config import DIPLOMA_TYPES, MAX_IMAGE_DIMENSION, OCR_LANGUAGES
from app.utils.logger import logger

# --- Configuration Tesseract ---
if sys.platform.startswith("win"):
    if pytesseract.pytesseract.tesseract_cmd == 'tesseract':
        pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

TESSERACT_AVAILABLE = False
try:
    pytesseract.get_tesseract_version()
    TESSERACT_AVAILABLE = True
except Exception:
    logger.warning("Tesseract not found – OCR disabled")

# Optimized Tesseract config: LSTM engine + block-based PSM
_TESSERACT_CONFIG = "--oem 3 --psm 6"

# Languages to run OCR passes for.
# V6: passes individuelles + passes combinées pour les diplômes
# bilingues (typique tunisien fr/ar). La meilleure passe est
# sélectionnée par scoring sémantique. (P2 reverté — la passe
# combinée unique générait des faux positifs sur le bruit OCR.)
_OCR_PASS_LANGS = ["ara", "fra", "eng", "ara+fra", "fra+eng"]

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


# ──────────────────────────────────────────────
# Semantic scoring — keyword groups & weights
# ──────────────────────────────────────────────

# Each entry: (weight, [variant_group])
# A variant group matches if ANY word in the group appears in the text.

_DEGREE_KEYWORDS: list[list[str]] = [
    ["baccalaureat", "bac"],
    ["بكالوريا", "البكالوريا"],
    ["diplome"],
    ["licence"],
    ["master"],
    ["ingenieur"],
    ["doctorat"],
    ["شهادة"],
    ["certificate"],
    ["degree"],
    ["bachelor"],
    ["دكتوراه"],
    ["ليسانس"],
    ["ماستر"],
    ["دبلوم"],
    ["brevet"],
    ["attestation"],
]

_INSTITUTION_KEYWORDS: list[list[str]] = [
    ["universite", "faculte"],
    ["ecole"],
    ["academie"],
    ["جامعة"],
    ["مدرسة"],
    ["كلية"],
    ["institut"],
    ["college"],
    ["school"],
    ["معهد"],
    ["hochschule"],
]

_AUTHORITY_KEYWORDS: list[list[str]] = [
    ["ministere"],
    ["republique"],
    ["وزارة"],
    ["الجمهورية"],
    ["ministry"],
    ["التعليم العالي"],
    ["education"],
]

_SCORE_DEGREE = 3
_SCORE_INSTITUTION = 2
_SCORE_AUTHORITY = 2


def _normalize_for_scoring(text: str) -> str:
    """Normalize text for semantic keyword matching.

    Steps:
      1. Unicode NFKD — strip combining marks (accents)
      2. Lowercase
      3. Replace newlines/tabs with spaces
      4. Remove special characters EXCEPT Arabic Unicode range
      5. Collapse multiple spaces
    """
    if not text:
        return ""

    # NFKD normalization — strips accents
    normalized = unicodedata.normalize("NFKD", text)
    normalized = "".join(
        c for c in normalized if not unicodedata.combining(c)
    )

    # Lowercase
    normalized = normalized.lower()

    # Newlines / tabs → space
    normalized = normalized.replace("\n", " ").replace("\r", " ").replace("\t", " ")

    # Remove special chars but KEEP Arabic characters (U+0600–U+06FF)
    # and basic alphanumeric + spaces
    normalized = re.sub(r"[^a-z0-9\s\u0600-\u06FF]", "", normalized)

    # Collapse spaces
    normalized = re.sub(r"\s+", " ", normalized).strip()

    return normalized


def _semantic_score(text: str) -> int:
    """Compute a semantic score for OCR text based on diploma keywords.

    Scoring:
      - Each DEGREE keyword group matched → +3
      - Each INSTITUTION keyword group matched → +2
      - Each AUTHORITY keyword group matched → +2

    Only counts each group once (no double counting variants).
    Returns the total integer score.
    """
    normalized = _normalize_for_scoring(text)
    if not normalized:
        return 0

    score = 0

    for group in _DEGREE_KEYWORDS:
        if any(kw in normalized for kw in group):
            score += _SCORE_DEGREE

    for group in _INSTITUTION_KEYWORDS:
        if any(kw in normalized for kw in group):
            score += _SCORE_INSTITUTION

    for group in _AUTHORITY_KEYWORDS:
        if any(kw in normalized for kw in group):
            score += _SCORE_AUTHORITY

    return score


# ──────────────────────────────────────────────
# Text normalization (for hashing & clean_text)
# ──────────────────────────────────────────────

def normalize_ocr_text(raw_text: str) -> str:
    """Normalise le texte OCR pour un hashing déterministe.

    Étapes :
      1. Suppression des accents (normalisation Unicode)
      2. Lowercase
      3. Remplacement des sauts de ligne par des espaces
      4. Collapse des espaces multiples
      5. Trim des espaces en début/fin
      6. Suppression des caractères non alphanumériques (hors espaces)
    """
    if not raw_text:
        return ""

    # Normalisation Unicode NFKD → strip les accents
    text = unicodedata.normalize("NFKD", raw_text)
    text = "".join(c for c in text if not unicodedata.combining(c))

    # Lowercase
    text = text.lower()

    # Sauts de ligne → espace
    text = text.replace("\n", " ").replace("\r", " ").replace("\t", " ")

    # Suppression des caractères non alphanumériques (garder espaces)
    text = re.sub(r"[^a-z0-9\s]", "", text)

    # Collapse des espaces multiples
    text = re.sub(r"\s+", " ", text)

    # Trim
    text = text.strip()

    return text


def compute_text_hash(text: str) -> str:
    """Hash SHA-256 du texte normalisé (pour seed déterministe)."""
    clean = normalize_ocr_text(text) if text else "empty_document"
    if not clean:
        clean = "empty_document"
    return hashlib.sha256(clean.encode("utf-8")).hexdigest()


@dataclass
class OCRResult:
    """Résultat de l'extraction OCR."""
    full_text: str = ""
    clean_text: str = ""
    text_hash: str = ""
    extracted_fields: dict[str, str | None] = field(default_factory=dict)
    ocr_confidence: float = 0.0
    language_detected: str = "unknown"
    flags: list[str] = field(default_factory=list)


# --- Patterns regex pour l'extraction de champs ---

DATE_PATTERNS: list[str] = [
    r"\b(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{4})\b",
    r"\b(\d{4}[/\-\.]\d{1,2}[/\-\.]\d{1,2})\b",
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


# ──────────────────────────────────────────────
# Auto-rotation via OSD
# ──────────────────────────────────────────────

def _correct_rotation(image: NDArray[np.uint8]) -> NDArray[np.uint8]:
    """Détecte et corrige l'orientation via pytesseract OSD.

    Utilise image_to_osd pour détecter la rotation et auto-rotater.
    Retourne l'image corrigée ou l'originale si la détection échoue.
    """
    if not TESSERACT_AVAILABLE:
        return image

    try:
        # OSD nécessite une image PIL
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        pil_img = Image.fromarray(gray)
        osd_data = pytesseract.image_to_osd(pil_img, output_type=pytesseract.Output.DICT)
        rotation_angle = int(osd_data.get("rotate", 0))

        if rotation_angle == 0:
            return image

        logger.info("Rotation détectée par OSD : %d°", rotation_angle)

        if rotation_angle == 90:
            rotated = cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
        elif rotation_angle == 180:
            rotated = cv2.rotate(image, cv2.ROTATE_180)
        elif rotation_angle == 270:
            rotated = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
        else:
            # Rotation arbitraire
            h, w = image.shape[:2]
            center = (w / 2.0, h / 2.0)
            rotation_matrix = cv2.getRotationMatrix2D(center, rotation_angle, 1.0)
            rotated = cv2.warpAffine(
                image, rotation_matrix, (w, h),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE,
            )

        return rotated

    except Exception as e:
        logger.debug("OSD rotation detection failed (non-critique) : %s", e)
        return image


# ──────────────────────────────────────────────
# Simple preprocessing (grayscale + resize x2)
# ──────────────────────────────────────────────

def _resize_to_max(
    image: NDArray[np.uint8],
    max_dim: int,
) -> NDArray[np.uint8]:
    """Downscale image so the longest side is at most max_dim."""
    h, w = image.shape[:2]
    longest = max(h, w)
    if longest <= max_dim:
        return image
    ratio = max_dim / longest
    new_w = int(w * ratio)
    new_h = int(h * ratio)
    return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)


def _ocr_preprocess(image: NDArray[np.uint8]) -> NDArray[np.uint8]:
    """Simple preprocessing for OCR.

    V6: applique MAX_IMAGE_DIMENSION pour borner le coût OCR sur les
    grandes images (Tesseract LSTM ne profite pas au-delà de ~2000px).

    Pipeline:
      1. Resize si > MAX_IMAGE_DIMENSION
      2. Convert to grayscale
      3. Upscale x2 (sauf si ça dépasse encore MAX)

    NO blur, NO adaptive threshold, NO aggressive filters.
    """
    # Resize si trop grande (avant grayscale pour économiser)
    image = _resize_to_max(image, MAX_IMAGE_DIMENSION)

    # Grayscale
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()

    # Upscale x2 (mais reste borné par MAX_IMAGE_DIMENSION)
    h, w = gray.shape[:2]
    target_w, target_h = w * 2, h * 2
    if max(target_w, target_h) > MAX_IMAGE_DIMENSION:
        # Skip upscale si on dépasserait la borne
        return gray
    upscaled = cv2.resize(gray, (target_w, target_h), interpolation=cv2.INTER_CUBIC)

    return upscaled


# ──────────────────────────────────────────────
# 3-pass per-language OCR
# ──────────────────────────────────────────────

def _ocr_single_lang(
    image: NDArray[np.uint8],
    lang: str,
) -> dict[str, str | float]:
    """Run Tesseract OCR for a single language.

    V6 perf: un seul appel Tesseract via image_to_data — le texte est
    reconstruit à partir des mots, et la confidence est calculée en
    même temps. Évite le doublon image_to_string + image_to_data.

    Returns dict with 'text', 'confidence', and 'lang' keys.
    """
    if not TESSERACT_AVAILABLE:
        return {"text": "", "confidence": 0.0, "lang": lang}

    try:
        pil_img = Image.fromarray(image)

        # Single Tesseract call — get words + confidences together
        data = pytesseract.image_to_data(
            pil_img,
            lang=lang,
            config=_TESSERACT_CONFIG,
            output_type=pytesseract.Output.DICT,
        )

        # Reconstruct text from words (preserve line breaks via line_num)
        words = data.get("text", [])
        confs_raw = data.get("conf", [])
        line_nums = data.get("line_num", [0] * len(words))
        block_nums = data.get("block_num", [0] * len(words))

        # Build text with line breaks at line_num/block_num boundaries
        text_parts: list[str] = []
        prev_line: tuple[int, int] | None = None
        confidences: list[int] = []

        for i, word in enumerate(words):
            if not word or not word.strip():
                continue
            cur_line = (block_nums[i], line_nums[i])
            if prev_line is not None and cur_line != prev_line:
                text_parts.append("\n")
            elif text_parts:
                text_parts.append(" ")
            text_parts.append(word)
            prev_line = cur_line

            # Collect confidence (str or int)
            try:
                c = int(confs_raw[i])
                if c > 0:
                    confidences.append(c)
            except (ValueError, TypeError, IndexError):
                continue

        text = "".join(text_parts).strip()
        avg_confidence: float = (
            sum(confidences) / len(confidences) / 100.0
            if confidences
            else 0.0
        )

        logger.debug(
            "OCR pass [%s] — text_len=%d | confidence=%.3f",
            lang, len(text), avg_confidence,
        )

        return {"text": text, "confidence": avg_confidence, "lang": lang}

    except Exception as e:
        logger.error("Erreur Tesseract [%s] : %s", lang, e)
        return {"text": "", "confidence": 0.0, "lang": lang}


def _extract_best_text(image: NDArray[np.uint8]) -> dict[str, str | float]:
    """Run OCR in 3 languages separately, select BEST by semantic score.

    Pipeline:
      1. Preprocess image (grayscale + resize x2)
      2. OCR with lang="ara"
      3. OCR with lang="fra"
      4. OCR with lang="eng"
      5. Normalize each result
      6. Score each result with _semantic_score()
      7. Return the result with highest semantic score

    This replaces the old combined-language + threshold multi-pass approach.
    """
    # Preprocess once
    preprocessed = _ocr_preprocess(image)

    # Run OCR for each language
    results: list[dict[str, str | float]] = []
    for lang in _OCR_PASS_LANGS:
        res = _ocr_single_lang(preprocessed, lang)
        results.append(res)

    # Score each result semantically
    best_result = None
    best_score = -1

    for res in results:
        text = str(res.get("text", ""))
        score = _semantic_score(text)
        lang = str(res.get("lang", "?"))
        confidence = float(res.get("confidence", 0.0))

        logger.debug(
            "OCR semantic — lang=%s | score=%d | confidence=%.3f | text_len=%d",
            lang, score, confidence, len(text),
        )

        if score > best_score:
            best_score = score
            best_result = res

    # 🔥 fallback when semantic is too weak
    if best_score == 0:
        best_result = max(results, key=lambda r: len(str(r.get("text", ""))))

    selected_lang = str(best_result.get("lang", "?"))
    selected_text = str(best_result.get("text", ""))
    selected_conf = float(best_result.get("confidence", 0.0))

    logger.info(
        "OCR best selection — lang=%s | semantic_score=%d | "
        "confidence=%.3f | text_len=%d",
        selected_lang, best_score, selected_conf, len(selected_text),
    )

    # Safety check: reject weak / garbage OCR output
    if selected_text is None or len(selected_text.strip()) < 10:
        logger.warning(
            "OCR safety filter — text too short (%d chars), returning empty",
            len(selected_text.strip()) if selected_text else 0,
        )
        return {"text": "", "confidence": 0.0, "lang": ""}

    return best_result


# ──────────────────────────────────────────────
# Language detection
# ──────────────────────────────────────────────

def _detect_language(text: str) -> str:
    """Détecte la langue du texte extrait."""
    try:
        if len(text.strip()) < 20:
            return "unknown"
        lang: str = detect(text)
        return lang
    except LangDetectException:
        return "unknown"


# ──────────────────────────────────────────────
# spaCy field extraction
# ──────────────────────────────────────────────

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


# ──────────────────────────────────────────────
# Field extraction helpers
# ──────────────────────────────────────────────

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


# ──────────────────────────────────────────────
# Main pipeline
# ──────────────────────────────────────────────

def _rotate_image(
    image: NDArray[np.uint8],
    angle: int,
) -> NDArray[np.uint8]:
    """Rotate an image by a multiple of 90°."""
    if angle == 0:
        return image
    if angle == 90:
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    if angle == 180:
        return cv2.rotate(image, cv2.ROTATE_180)
    if angle == 270:
        return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
    return image


# V6 perf: dimension max pour le quick rotation test
# (assez petit pour scorer rapidement, assez grand pour que les
# mots-clés diplôme restent lisibles)
_QUICK_ROTATION_DIM = 800


def _quick_rotation_score(
    image: NDArray[np.uint8],
    angle: int,
) -> int:
    """Quick semantic-score test for a given rotation.

    V6 perf: image downsamplée à 800px max + un seul appel Tesseract
    avec lang combinée. Réduit chaque test rotation de ~7s à ~1s.

    Returns the semantic score of the result.
    """
    try:
        # Downsample d'abord, rotation ensuite (moins de pixels à tourner)
        small = _resize_to_max(image, _QUICK_ROTATION_DIM)
        rotated = _rotate_image(small, angle)

        # Grayscale only (skip the x2 upscale du _ocr_preprocess pour gagner du temps)
        if len(rotated.shape) == 3:
            gray = cv2.cvtColor(rotated, cv2.COLOR_BGR2GRAY)
        else:
            gray = rotated

        result = _ocr_single_lang(gray, "ara+fra+eng")
        text = str(result.get("text", ""))
        return _semantic_score(text)
    except Exception as e:
        logger.debug("Quick rotation %d° failed: %s", angle, e)
        return -1


def _find_best_rotation(
    image: NDArray[np.uint8],
    osd_corrected: NDArray[np.uint8],
    osd_semantic: int,
) -> NDArray[np.uint8]:
    """Fallback 4-rotation: test 0/90/180/270 + keep best semantic score.

    Activé uniquement quand OSD donne un OCR faible (semantic < 5).
    Lance _semantic_score sur chaque rotation, garde la meilleure.
    """
    if osd_semantic >= 5:
        return osd_corrected

    logger.info(
        "OSD semantic faible (%d) — fallback 4-rotation activé",
        osd_semantic,
    )

    best_image = osd_corrected
    best_score = osd_semantic
    best_angle = "OSD"

    for angle in [0, 90, 180, 270]:
        score = _quick_rotation_score(image, angle)
        logger.info(
            "Rotation fallback %d° → semantic_score=%d", angle, score,
        )
        if score > best_score:
            best_score = score
            best_image = _rotate_image(image, angle)
            best_angle = f"{angle}°"

    logger.info(
        "Best rotation selected: %s (semantic=%d)", best_angle, best_score,
    )
    return best_image


def extract_text(image: NDArray[np.uint8]) -> OCRResult:
    """Pipeline complet d'extraction OCR.

    V6 — Pipeline robuste multi-langue :
      1. Auto-rotation via OSD
      2. Si OSD faible : fallback 4-rotation par scoring sémantique
      3. 5-pass OCR (ara/fra/eng + bilingues) with simple preprocessing
      4. Semantic scoring → select best text
      5. Normalisation + hash
      6. Extraction des champs clés
      7. Logging diagnostique complet

    Retourne un OCRResult avec le texte, les champs extraits,
    la confiance et la langue détectée.
    """
    result = OCRResult()

    try:
        # Étape 1 : Auto-rotation OSD
        corrected_image = _correct_rotation(image)

        # Étape 2 : OCR initial (5-lang) sur image OSD-corrigée
        best = _extract_best_text(corrected_image)
        full_text = str(best.get("text", ""))
        primary_semantic = _semantic_score(full_text)

        # Étape 2bis : Si OSD a échoué (semantic faible), fallback 4-rotation
        if primary_semantic < 5:
            better_image = _find_best_rotation(
                image, corrected_image, primary_semantic,
            )
            # Si la rotation a changé, ré-exécuter le pipeline OCR complet
            if better_image is not corrected_image:
                best = _extract_best_text(better_image)
                full_text = str(best.get("text", ""))

        confidence = float(best.get("confidence", 0.0))

        result.full_text = full_text
        result.ocr_confidence = confidence

        # Étape 3 : Normalisation du texte + hash déterministe
        result.clean_text = normalize_ocr_text(full_text)
        result.text_hash = compute_text_hash(full_text)

        # ── Logging diagnostique (interne uniquement) ──
        logger.info(
            "OCR DIAG — text_len=%d | clean_len=%d | confidence=%.3f | "
            "hash_seed=%s",
            len(full_text),
            len(result.clean_text),
            confidence,
            result.text_hash[:16],
        )

        # Étape 4 : gestion du texte vide
        if not full_text or len(full_text.strip()) < 5:
            result.flags.append("Aucun texte extrait par l'OCR")
            result.ocr_confidence = 0.0
            result.clean_text = ""
            result.text_hash = compute_text_hash("")
            logger.warning("OCR vide ou quasi-vide — retour avec confiance 0")
            return result

        if confidence < 0.3:
            result.flags.append(
                f"Confiance OCR très basse : {confidence:.2f}"
            )

        # Étape 5 : détection de la langue
        lang = _detect_language(full_text)
        result.language_detected = lang

        # Étape 6 : extraction des champs clés
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

        # Étape 7 : validation des dates
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
        result.ocr_confidence = 0.0
        result.clean_text = ""
        result.text_hash = compute_text_hash("")

    return result
