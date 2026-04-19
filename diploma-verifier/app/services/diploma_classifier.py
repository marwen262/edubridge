"""
Classificateur de documents : détermine si le document est un diplôme
ou non, via une approche par règles universelles multi-langues.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import cv2
import numpy as np
from numpy.typing import NDArray

from app.config import DIPLOMA_KEYWORDS, DIPLOMA_TYPES
from app.utils.logger import logger


@dataclass
class ClassificationResult:
    """Résultat de la classification du document."""
    is_diploma: bool = False
    confidence: float = 0.0
    detected_type: str = "unknown"
    flags: list[str] = field(default_factory=list)


def _count_diploma_keywords(text: str) -> tuple[int, int, str]:
    """Compte les mots-clés de diplôme trouvés dans le texte (toutes langues).

    Retourne (mots_trouvés, mots_attendus, meilleure_langue).
    """
    text_lower: str = text.lower()
    best_found: int = 0
    best_total: int = 1
    best_lang: str = "unknown"

    for lang, keywords in DIPLOMA_KEYWORDS.items():
        found: int = sum(1 for kw in keywords if kw.lower() in text_lower)
        if found > best_found:
            best_found = found
            best_total = len(keywords)
            best_lang = lang

    return best_found, best_total, best_lang


def _detect_type_from_text(text: str) -> str:
    """Détecte le type de diplôme dans le texte (toutes langues)."""
    text_lower: str = text.lower()

    for lang, types in DIPLOMA_TYPES.items():
        for dtype in sorted(types, key=len, reverse=True):
            if dtype.lower() in text_lower:
                return dtype.capitalize()

    return "unknown"


def _analyze_document_layout(image: NDArray[np.uint8]) -> tuple[float, list[str]]:
    """Analyse la structure visuelle du document.

    Vérifie :
    - Le format (portrait/paysage)
    - La présence de texte centré
    - Les zones de signature/cachet en bas
    """
    flags: list[str] = []
    score: float = 0.5  # Score de base

    try:
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        h, w = gray.shape

        # Vérifier le format du document
        aspect_ratio: float = w / max(h, 1)
        if 0.6 < aspect_ratio < 0.85:
            # Format portrait typique (A4 debout) — courant pour les diplômes
            score += 0.1
        elif 1.2 < aspect_ratio < 1.6:
            # Format paysage — aussi courant pour certains diplômes
            score += 0.1

        # Vérifier la présence de contenu dans la zone inférieure
        # (signatures, cachets, etc.)
        bottom_third = gray[int(h * 0.7):, :]
        _, bottom_binary = cv2.threshold(
            bottom_third, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )
        bottom_density: float = float(np.sum(bottom_binary > 0)) / max(bottom_binary.size, 1)

        if 0.01 < bottom_density < 0.25:
            # Densité raisonnable en bas = probablement signatures/cachets
            score += 0.1

        # Vérifier que le document a du contenu centré
        center_strip = gray[:, int(w * 0.25):int(w * 0.75)]
        _, center_binary = cv2.threshold(
            center_strip, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )
        center_density: float = float(np.sum(center_binary > 0)) / max(center_binary.size, 1)

        left_strip = gray[:, :int(w * 0.25)]
        _, left_binary = cv2.threshold(
            left_strip, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )
        left_density: float = float(np.sum(left_binary > 0)) / max(left_binary.size, 1)

        # Si le centre est plus dense que les bords = texte centré
        if center_density > left_density * 1.3:
            score += 0.1

        # Vérifier le fond clair (les diplômes ont souvent un fond blanc/crème)
        bg_mean: float = float(np.mean(gray))
        if bg_mean > 180:
            score += 0.05

    except Exception as e:
        logger.warning("Erreur analyse layout : %s", e)
        flags.append(f"Erreur analyse layout : {str(e)}")

    return min(1.0, score), flags


def classify_diploma(text: str, image: NDArray[np.uint8]) -> ClassificationResult:
    """Détermine si le document est un diplôme via une approche par règles.

    Combine l'analyse textuelle (mots-clés, type de diplôme)
    et l'analyse visuelle (layout, structure).
    """
    result = ClassificationResult()

    try:
        # 1. Compter les mots-clés de diplôme
        found, total, best_lang = _count_diploma_keywords(text)
        keyword_ratio: float = found / max(total, 1)

        # 2. Détecter le type de diplôme
        detected_type: str = _detect_type_from_text(text)
        result.detected_type = detected_type

        # 3. Analyser le layout du document
        layout_score, layout_flags = _analyze_document_layout(image)
        result.flags.extend(layout_flags)

        # 4. Calculer la confiance globale
        keyword_score: float = min(1.0, keyword_ratio * 3.0)
        type_score: float = 0.3 if detected_type != "unknown" else 0.0

        confidence: float = (
            keyword_score * 0.50
            + type_score * 0.25
            + layout_score * 0.25
        )
        confidence = min(1.0, max(0.0, confidence))

        result.confidence = round(confidence, 2)
        result.is_diploma = confidence > 0.30

        if not result.is_diploma:
            result.flags.append(
                f"Document probablement pas un diplôme (confiance={confidence:.2f})"
            )

        logger.info(
            "Classification — is_diploma=%s | confiance=%.2f | type=%s "
            "| mots-clés=%d/%d | layout=%.2f",
            result.is_diploma,
            result.confidence,
            result.detected_type,
            found,
            total,
            layout_score,
        )

    except Exception as e:
        logger.error("Erreur classification : %s", e)
        result.flags.append(f"Erreur classification : {str(e)}")

    return result
