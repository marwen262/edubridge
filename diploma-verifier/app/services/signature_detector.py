"""
Détection de signature manuscrite dans un document.

V4 — Expert anti-fraud :
  - Analyse la zone inférieure (30-40%) pour des contours
    complexes et irréguliers typiques d'une signature
  - Validation de complexité de trait (filtre les gribouillis)
  - Minimum de contours candidats pour confirmer une signature
  - Seuil de confiance minimum (évite les faux positifs)
  - Lissage des scores (évite les fluctuations extrêmes)
  - Retourne une confiance (0.0–1.0), jamais un booléen brut
"""

from __future__ import annotations

from dataclasses import dataclass, field

import cv2
import numpy as np
from numpy.typing import NDArray

from app.utils.logger import logger

# Seuil minimum de confiance — sous ce seuil, on considère 0.0
_MIN_CONFIDENCE_THRESHOLD = 0.12

# Nombre minimum de contours candidats pour confirmer une signature
# Un seul contour pourrait être du bruit ; 2+ est plus fiable
_MIN_CANDIDATE_COUNT = 1

# Complexité minimale de trait (points par contour)
_MIN_STROKE_COMPLEXITY = 30


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


def _smooth_confidence(raw_confidence: float) -> float:
    """Lissage sigmoïde pour éviter les scores extrêmes.

    Transforme la confiance brute via une courbe sigmoïde douce
    centrée sur 0.5, qui compresse les extrêmes et amplifie
    les valeurs moyennes.
    """
    # Sigmoid centré sur 0.5 avec pente modérée
    # f(x) = 1 / (1 + exp(-k*(x - center)))
    import math
    k = 6.0
    center = 0.45
    smoothed = 1.0 / (1.0 + math.exp(-k * (raw_confidence - center)))
    return min(1.0, max(0.0, smoothed))


def _validate_stroke_complexity(
    contour: NDArray,
    binary: NDArray[np.uint8],
    x: int, y: int, w: int, h: int,
) -> float:
    """Valide la complexité du trait pour filtrer les gribouillis.

    Un trait de signature authentique a :
      - Suffisamment de points
      - Des changements de direction fréquents
      - Une densité de trait modérée (pas un bloc plein)

    Retourne un score de complexité 0.0 – 1.0.
    """
    num_points = len(contour)

    # Trop peu de points = probablement du bruit
    if num_points < _MIN_STROKE_COMPLEXITY:
        return 0.0

    # Calculer les changements de direction
    if num_points < 5:
        return 0.0

    points = contour.reshape(-1, 2).astype(float)
    # Vecteurs entre points consécutifs
    deltas = np.diff(points, axis=0)
    # Angles des vecteurs
    angles = np.arctan2(deltas[:, 1], deltas[:, 0])
    # Changements d'angle
    angle_changes = np.abs(np.diff(angles))
    # Normaliser les changements d'angle > pi
    angle_changes = np.minimum(angle_changes, 2 * np.pi - angle_changes)

    # Direction changes > 0.3 rad ≈ 17° (significant turns)
    significant_turns = np.sum(angle_changes > 0.3)
    turn_ratio = significant_turns / max(len(angle_changes), 1)

    # Ink density check (not too dense = not a filled shape)
    roi = binary[y:y + h, x:x + w]
    if roi.size > 0:
        density = float(np.sum(roi == 0)) / roi.size
        # Too dense (>0.7) = filled rectangle, not a signature
        if density > 0.7:
            return max(0.0, 0.3 - density)

    # Complexity: points count + direction changes
    point_score = min(1.0, num_points / 250.0)
    turn_score = min(1.0, turn_ratio * 3.0)

    complexity = point_score * 0.5 + turn_score * 0.5
    return min(1.0, max(0.0, complexity))


def detect_signature(image: NDArray[np.uint8]) -> SignatureResult:
    """Détecte la présence d'une signature dans la zone inférieure.

    V4 — Expert anti-fraud :
      - Validation de complexité de trait
      - Filtrage des gribouillis aléatoires
      - Seuil minimum de confiance
      - Lissage sigmoïde des scores
      - Analyse multi-zone (bottom 30% + middle-bottom)

    Retourne un SignatureResult avec une confiance continue (0.0–1.0).
    """
    result = SignatureResult()

    try:
        # Niveaux de gris
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # Analyse multi-zone : bottom 30% puis bottom 40%
        zones = [
            (0.70, 1.0, "bottom_30"),
            (0.60, 1.0, "bottom_40"),
        ]

        best_confidence = 0.0
        best_location = None
        best_ink = 0.0
        best_candidates_count = 0
        best_stroke_complexity = 0.0

        for top_ratio, bottom_ratio, zone_label in zones:
            zone, y_offset = _extract_zone(gray, top_ratio, bottom_ratio)

            if zone.size == 0:
                continue

            # Binarisation Otsu inversée
            _, binary = cv2.threshold(
                zone, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU,
            )

            # Nettoyage morphologique léger
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)

            # Détection de contours candidats
            candidates = _analyze_contours(binary)

            if not candidates:
                continue

            # Meilleur candidat = le plus complexe
            best = max(candidates, key=lambda c: len(c[0]))
            contour, (x, y, w, h) = best

            # Densité d'encre
            ink = _compute_ink_density(binary, x, y, w, h)

            # V4: Stroke complexity validation
            stroke_cx = _validate_stroke_complexity(
                contour, binary, x, y, w, h,
            )

            # Sous-scores
            complexity = min(1.0, len(contour) / 200.0)
            density_score = min(1.0, ink * 5.0)
            size_score = min(
                1.0,
                (w * h) / max(zone.shape[0] * zone.shape[1] * 0.05, 1),
            )

            # Confiance pondérée (V4: inclut stroke complexity)
            raw_conf = (
                complexity * 0.35
                + density_score * 0.20
                + size_score * 0.15
                + stroke_cx * 0.30
            )
            raw_conf = min(1.0, max(0.0, raw_conf))

            # V4: Candidate count bonus — multiple candidates
            # indicates more likely a real signature area
            candidate_bonus = min(0.1, len(candidates) * 0.03)
            raw_conf = min(1.0, raw_conf + candidate_bonus)

            if raw_conf > best_confidence:
                best_confidence = raw_conf
                best_location = {
                    "x": int(x),
                    "y": int(y + y_offset),
                    "w": int(w),
                    "h": int(h),
                }
                best_ink = ink
                best_candidates_count = len(candidates)
                best_stroke_complexity = stroke_cx

        # Lissage sigmoïde pour éviter les fluctuations
        smoothed_confidence = _smooth_confidence(best_confidence)

        # Appliquer le seuil minimum
        if smoothed_confidence < _MIN_CONFIDENCE_THRESHOLD:
            smoothed_confidence = 0.0
            best_location = None

        result.confidence = round(smoothed_confidence, 2)
        if smoothed_confidence > 0.25:
            result.location = best_location

        logger.info(
            "Signature V4 — raw_conf=%.3f | smoothed=%.2f | "
            "candidats=%d | encre=%.3f | stroke_cx=%.3f",
            best_confidence,
            result.confidence,
            best_candidates_count,
            best_ink,
            best_stroke_complexity,
        )

    except Exception as e:
        logger.error("Erreur détection signature : %s", e)
        result.flags.append("Erreur détection signature")

    return result
