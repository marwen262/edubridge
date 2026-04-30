"""
Détection de cachet officiel (tampon) dans un document.

Combine :
  - Détection de cercles (Hough Circle Transform) → fonctionne en N&B
  - Analyse de couleur HSV (bleu, rouge, violet, noir)
  - Détection d'ellipses par contours

Retourne une confiance continue (0.0–1.0), jamais un booléen brut.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import cv2
import numpy as np
from numpy.typing import NDArray

from app.utils.logger import logger


@dataclass
class StampResult:
    """Résultat de la détection de cachet."""

    confidence: float = 0.0
    stamp_color: str = "inconnu"
    location: dict[str, int] | None = None
    flags: list[str] = field(default_factory=list)


# ──────────────────────────────────────────────
# Plages HSV pour les couleurs d'encre courantes
# ──────────────────────────────────────────────
INK_COLORS: dict[str, list[tuple[NDArray[np.uint8], NDArray[np.uint8]]]] = {
    "bleu": [
        (np.array([100, 50, 50], dtype=np.uint8),
         np.array([130, 255, 255], dtype=np.uint8)),
    ],
    "rouge": [
        (np.array([0, 70, 50], dtype=np.uint8),
         np.array([10, 255, 255], dtype=np.uint8)),
        (np.array([170, 70, 50], dtype=np.uint8),
         np.array([180, 255, 255], dtype=np.uint8)),
    ],
    "violet": [
        (np.array([130, 50, 50], dtype=np.uint8),
         np.array([160, 255, 255], dtype=np.uint8)),
    ],
    "noir": [
        (np.array([0, 0, 0], dtype=np.uint8),
         np.array([180, 50, 80], dtype=np.uint8)),
    ],
}


# ──────────────────────────────────────────────
# Détection par couleur (HSV)
# ──────────────────────────────────────────────

def _detect_colored_regions(
    hsv: NDArray[np.uint8],
) -> tuple[NDArray[np.uint8], str]:
    """Masque combiné des couleurs d'encre + couleur dominante."""
    best_color = "inconnu"
    best_count = 0
    combined = np.zeros(hsv.shape[:2], dtype=np.uint8)

    for color_name, ranges in INK_COLORS.items():
        color_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
        for lower, upper in ranges:
            mask = cv2.inRange(hsv, lower, upper)
            color_mask = cv2.bitwise_or(color_mask, mask)

        count = int(cv2.countNonZero(color_mask))
        if count > best_count:
            best_count = count
            best_color = color_name

        combined = cv2.bitwise_or(combined, color_mask)

    return combined, best_color


# ──────────────────────────────────────────────
# Détection de cercles (Hough) — fonctionne en N&B
# ──────────────────────────────────────────────

def _find_circles_hough(
    gray: NDArray[np.uint8],
) -> list[tuple[int, int, int]]:
    """Détecte les cercles via HoughCircles.

    Retourne [(cx, cy, radius), …].
    """
    blurred = cv2.GaussianBlur(gray, (9, 9), 2)
    max_radius = min(gray.shape[0], gray.shape[1]) // 4

    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=50,
        param1=100,
        param2=40,
        minRadius=20,
        maxRadius=max_radius,
    )

    results: list[tuple[int, int, int]] = []
    if circles is not None:
        rounded = np.uint16(np.around(circles))
        for c in rounded[0, :]:
            results.append((int(c[0]), int(c[1]), int(c[2])))

    return results


# ──────────────────────────────────────────────
# Détection d'ellipses par contours
# ──────────────────────────────────────────────

def _find_ellipses(
    binary: NDArray[np.uint8],
) -> list[tuple[int, int, int, int, float]]:
    """Détecte les contours elliptiques potentiellement des cachets.

    Retourne [(cx, cy, r_major, r_minor, angle), …].
    """
    contours, _ = cv2.findContours(
        binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE,
    )

    results: list[tuple[int, int, int, int, float]] = []

    for contour in contours:
        if len(contour) < 5:
            continue

        try:
            (cx, cy), (ma, MA), angle = cv2.fitEllipse(contour)
        except cv2.error:
            continue

        if ma < 40 or MA < 40:
            continue

        # Ratio des axes → quasi-circulaire
        axis_ratio = min(ma, MA) / max(ma, MA)
        if axis_ratio < 0.45:
            continue

        # Remplissage
        area = cv2.contourArea(contour)
        ellipse_area = np.pi * (ma / 2) * (MA / 2)
        if ellipse_area == 0:
            continue
        fill = area / ellipse_area
        if fill < 0.25:
            continue

        results.append((int(cx), int(cy), int(MA / 2), int(ma / 2), angle))

    return results


# ──────────────────────────────────────────────
# Détection de cercles par contours (fallback N&B)
# ──────────────────────────────────────────────

def _find_circular_contours(
    gray: NDArray[np.uint8],
) -> list[tuple[int, int, int, float]]:
    """Détecte les contours circulaires dans une image en niveaux de gris.

    Complément de Hough pour les scans N&B à faible contraste.
    Retourne [(cx, cy, radius, circularity), …].
    """
    # Binarisation adaptative
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, blockSize=15, C=8,
    )

    # Nettoyage
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(
        binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE,
    )

    results: list[tuple[int, int, int, float]] = []

    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 800:
            continue

        perimeter = cv2.arcLength(contour, True)
        if perimeter == 0:
            continue

        circularity = 4 * np.pi * area / (perimeter * perimeter)

        # Un cercle parfait a circularity = 1.0
        if circularity < 0.55:
            continue

        (cx, cy), radius = cv2.minEnclosingCircle(contour)
        radius = int(radius)
        if radius < 20:
            continue

        results.append((int(cx), int(cy), radius, float(circularity)))

    return results


# ──────────────────────────────────────────────
# Pipeline principal
# ──────────────────────────────────────────────

def detect_stamp(image: NDArray[np.uint8]) -> StampResult:
    """Détecte la présence d'un cachet officiel.

    Combine trois approches :
      1. Hough Circle Transform (fonctionne en N&B)
      2. Couleur HSV + ellipses par contour
      3. Contours circulaires (fallback N&B)

    Retourne une confiance continue (0.0–1.0).
    """
    result = StampResult()

    try:
        is_grayscale = len(image.shape) == 2

        if is_grayscale:
            gray = image.copy()
            bgr = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        else:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            bgr = image

        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)

        # ── Approche 1 : Hough circles (shape-based, N&B friendly) ──
        hough_circles = _find_circles_hough(gray)

        # ── Approche 2 : Couleur + ellipses ──
        color_mask, dominant_color = _detect_colored_regions(hsv)

        # Nettoyage morphologique du masque couleur
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        color_mask = cv2.dilate(color_mask, kernel, iterations=1)
        color_mask = cv2.erode(color_mask, kernel, iterations=1)

        _, binary_color = cv2.threshold(color_mask, 127, 255, cv2.THRESH_BINARY)
        ellipses = _find_ellipses(binary_color)

        # ── Approche 3 : Contours circulaires (fallback N&B) ──
        circular_contours = _find_circular_contours(gray)

        # ── Évaluation combinée ──
        best_confidence: float = 0.0
        best_location: dict[str, int] | None = None

        # Score Hough circles
        for cx, cy, radius in hough_circles:
            # Vérifier couleur dans le cercle
            mask_circle = np.zeros(gray.shape[:2], dtype=np.uint8)
            cv2.circle(mask_circle, (cx, cy), radius, 255, -1)
            color_in_circle = cv2.bitwise_and(
                color_mask, color_mask, mask=mask_circle,
            )
            circle_area = max(np.pi * radius * radius, 1)
            colored_px = int(cv2.countNonZero(color_in_circle))
            color_score = colored_px / circle_area

            size_score = min(1.0, radius / 80.0)

            # Confiance : shape (Hough) + couleur + taille
            conf = 0.35 + color_score * 0.35 + size_score * 0.30
            if conf > best_confidence:
                best_confidence = conf
                best_location = {"x": cx, "y": cy, "radius": radius}

        # Score ellipses
        for cx, cy, r1, r2, _ in ellipses:
            avg_r = (r1 + r2) // 2
            size_score = min(1.0, avg_r / 80.0)
            conf = 0.40 + size_score * 0.35
            if conf > best_confidence:
                best_confidence = conf
                best_location = {"x": cx, "y": cy, "radius": avg_r}

        # Score contours circulaires (fallback)
        for cx, cy, radius, circularity in circular_contours:
            size_score = min(1.0, radius / 80.0)
            # circularity bonus
            conf = circularity * 0.40 + size_score * 0.30 + 0.10
            if conf > best_confidence:
                best_confidence = conf
                best_location = {"x": cx, "y": cy, "radius": radius}

        # Finaliser
        result.confidence = round(min(1.0, best_confidence), 2)
        result.stamp_color = dominant_color if best_confidence > 0.20 else "inconnu"
        result.location = best_location if best_confidence > 0.20 else None

        if is_grayscale and best_confidence > 0.0:
            result.stamp_color = "noir"

        logger.info(
            "Cachet — confiance=%.2f | couleur=%s | "
            "hough=%d | ellipses=%d | contours=%d",
            result.confidence,
            result.stamp_color,
            len(hough_circles),
            len(ellipses),
            len(circular_contours),
        )

    except Exception as e:
        logger.error("Erreur détection cachet : %s", e)
        result.flags.append("Erreur détection cachet")

    return result
