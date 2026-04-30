"""
Détection de signature manuscrite dans un document.

Analyse la zone inférieure (30 %) et cherche des contours
complexes et irréguliers typiques d'une signature.

Retourne une confiance (0.0–1.0), jamais un booléen brut.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import cv2
import numpy as np
from numpy.typing import NDArray

from app.utils.logger import logger


@dataclass
class SignatureResult:
    """Résultat de la détection de signature."""

    confidence: float = 0.0
    location: dict[str, int] | None = None
    flags: list[str] = field(default_factory=list)


def _extract_zone(
    image: NDArray[np.uint8],
    top_ratio: float = 0.70,
    bottom_ratio: float = 1.0,
) -> tuple[NDArray[np.uint8], int]:
    """Extrait une bande horizontale de l'image.

    Retourne (zone, offset_y).
    """
    h = image.shape[0]
    y_start = int(h * top_ratio)
    y_end = int(h * bottom_ratio)
    return image[y_start:y_end, :], y_start


def _analyze_contours(
    binary: NDArray[np.uint8],
) -> list[tuple[NDArray, tuple[int, int, int, int]]]:
    """Trouve et filtre les contours pouvant être des signatures.

    Critères : complexité, taille, ratio d'aspect, compacité.
    """
    contours, _ = cv2.findContours(
        binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE,
    )

    candidates: list[tuple[NDArray, tuple[int, int, int, int]]] = []

    for contour in contours:
        num_points = len(contour)
        if num_points < 25:
            continue

        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)

        # Taille minimale
        if w < 35 or h < 12:
            continue
        # Pas trop large (tout l'image)
        if w > binary.shape[1] * 0.80:
            continue

        # Ratio d'aspect : signature = plus large que haute
        aspect = w / max(h, 1)
        if aspect < 1.0 or aspect > 14.0:
            continue

        # Périmètre minimal
        perimeter = cv2.arcLength(contour, True)
        if perimeter < 80:
            continue

        # Compacité : forme irrégulière = faible compacité
        compactness = (4 * np.pi * area) / max(perimeter ** 2, 1)
        if compactness > 0.55:
            continue

        candidates.append((contour, (x, y, w, h)))

    return candidates


def _compute_ink_density(
    binary: NDArray[np.uint8], x: int, y: int, w: int, h: int,
) -> float:
    """Densité d'encre (pixels noirs) dans une ROI."""
    roi = binary[y : y + h, x : x + w]
    if roi.size == 0:
        return 0.0
    return float(np.sum(roi == 0)) / roi.size


def detect_signature(image: NDArray[np.uint8]) -> SignatureResult:
    """Détecte la présence d'une signature dans la zone inférieure.

    Retourne un SignatureResult avec une confiance continue (0.0–1.0).
    """
    result = SignatureResult()

    try:
        # Niveaux de gris
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # Zone inférieure (30 %)
        bottom, y_offset = _extract_zone(gray, top_ratio=0.70)

        if bottom.size == 0:
            result.flags.append("Zone inférieure vide")
            return result

        # Binarisation Otsu inversée
        _, binary = cv2.threshold(
            bottom, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU,
        )

        # Nettoyage morphologique léger
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)

        # Détection de contours candidats
        candidates = _analyze_contours(binary)

        if not candidates:
            # Aucun candidat → confiance nulle
            return result

        # Meilleur candidat = le plus complexe
        best = max(candidates, key=lambda c: len(c[0]))
        contour, (x, y, w, h) = best

        # Densité d'encre
        ink = _compute_ink_density(binary, x, y, w, h)

        # Sous-scores
        complexity = min(1.0, len(contour) / 200.0)
        density_score = min(1.0, ink * 5.0)
        size_score = min(
            1.0,
            (w * h) / max(bottom.shape[0] * bottom.shape[1] * 0.05, 1),
        )

        # Confiance pondérée
        confidence = (
            complexity * 0.50
            + density_score * 0.30
            + size_score * 0.20
        )
        confidence = min(1.0, max(0.0, confidence))

        result.confidence = round(confidence, 2)
        if confidence > 0.25:
            result.location = {
                "x": int(x),
                "y": int(y + y_offset),
                "w": int(w),
                "h": int(h),
            }

        logger.info(
            "Signature — confiance=%.2f | candidats=%d | encre=%.3f",
            result.confidence,
            len(candidates),
            ink,
        )

    except Exception as e:
        logger.error("Erreur détection signature : %s", e)
        result.flags.append("Erreur détection signature")

    return result
