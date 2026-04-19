"""
Détection de cachet officiel (tampon) dans un document.
Cherche les formes circulaires / ovales et les zones de couleur
caractéristiques (bleu, rouge, noir, violet).
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
    stamp_detected: bool = False
    confidence: float = 0.0
    stamp_color: str = "inconnu"
    location: dict[str, int] | None = None
    flags: list[str] = field(default_factory=list)


# Plages HSV pour les couleurs d'encre courantes
INK_COLORS: dict[str, list[tuple[NDArray[np.uint8], NDArray[np.uint8]]]] = {
    "bleu": [
        (np.array([100, 50, 50], dtype=np.uint8), np.array([130, 255, 255], dtype=np.uint8)),
    ],
    "rouge": [
        (np.array([0, 70, 50], dtype=np.uint8), np.array([10, 255, 255], dtype=np.uint8)),
        (np.array([170, 70, 50], dtype=np.uint8), np.array([180, 255, 255], dtype=np.uint8)),
    ],
    "violet": [
        (np.array([130, 50, 50], dtype=np.uint8), np.array([160, 255, 255], dtype=np.uint8)),
    ],
    "noir": [
        (np.array([0, 0, 0], dtype=np.uint8), np.array([180, 50, 80], dtype=np.uint8)),
    ],
}


def _detect_colored_regions(hsv: NDArray[np.uint8]) -> tuple[NDArray[np.uint8], str]:
    """Crée un masque combiné pour les couleurs d'encre et retourne la couleur dominante."""
    best_color: str = "inconnu"
    best_pixel_count: int = 0
    combined_mask: NDArray[np.uint8] = np.zeros(hsv.shape[:2], dtype=np.uint8)

    for color_name, ranges in INK_COLORS.items():
        color_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
        for lower, upper in ranges:
            mask = cv2.inRange(hsv, lower, upper)
            color_mask = cv2.bitwise_or(color_mask, mask)

        pixel_count: int = int(cv2.countNonZero(color_mask))
        if pixel_count > best_pixel_count:
            best_pixel_count = pixel_count
            best_color = color_name

        combined_mask = cv2.bitwise_or(combined_mask, color_mask)

    return combined_mask, best_color


def _find_circles(
    gray: NDArray[np.uint8],
    color_mask: NDArray[np.uint8],
) -> list[tuple[int, int, int, float]]:
    """Détecte les cercles via HoughCircles et analyse de masque couleur.

    Retourne une liste de (x, y, rayon, score_couleur).
    """
    circles_found: list[tuple[int, int, int, float]] = []

    # Flou pour réduire le bruit avant HoughCircles
    blurred = cv2.GaussianBlur(gray, (9, 9), 2)

    # Détection de cercles avec Hough
    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=50,
        param1=100,
        param2=40,
        minRadius=20,
        maxRadius=min(gray.shape[0], gray.shape[1]) // 4,
    )

    if circles is not None:
        circles_arr = np.uint16(np.around(circles))
        for circle in circles_arr[0, :]:
            cx, cy, radius = int(circle[0]), int(circle[1]), int(circle[2])

            # Vérifier la densité de couleur dans la zone circulaire
            mask_circle = np.zeros(gray.shape[:2], dtype=np.uint8)
            cv2.circle(mask_circle, (cx, cy), radius, 255, -1)
            color_in_circle = cv2.bitwise_and(color_mask, color_mask, mask=mask_circle)
            circle_area: float = np.pi * radius * radius
            colored_pixels: int = int(cv2.countNonZero(color_in_circle))
            color_score: float = colored_pixels / max(circle_area, 1)

            circles_found.append((cx, cy, radius, color_score))

    return circles_found


def _find_ellipses(binary: NDArray[np.uint8]) -> list[tuple[int, int, int, int, float]]:
    """Détecte les contours elliptiques qui pourraient être des cachets.

    Retourne une liste de (x, y, major_axis, minor_axis, angle).
    """
    ellipses_found: list[tuple[int, int, int, int, float]] = []

    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours:
        if len(contour) < 5:
            continue

        # Ajuster une ellipse
        try:
            (cx, cy), (ma, MA), angle = cv2.fitEllipse(contour)
        except cv2.error:
            continue

        # Vérifier que c'est approximativement circulaire (ratio des axes)
        if ma < 40 or MA < 40:
            continue
        axis_ratio: float = min(ma, MA) / max(ma, MA)
        if axis_ratio < 0.5:
            continue

        # Vérifier que le contour est assez circulaire
        area: float = cv2.contourArea(contour)
        ellipse_area: float = np.pi * (ma / 2) * (MA / 2)
        if ellipse_area == 0:
            continue
        fill_ratio: float = area / ellipse_area
        if fill_ratio < 0.3:
            continue

        ellipses_found.append((int(cx), int(cy), int(MA / 2), int(ma / 2), angle))

    return ellipses_found


def detect_stamp(image: NDArray[np.uint8]) -> StampResult:
    """Détecte la présence d'un cachet officiel dans le document.

    Combine la détection de cercles (Hough), l'analyse de couleur HSV
    et la détection de contours elliptiques.
    """
    result = StampResult()

    try:
        # S'assurer que l'image est en couleur
        if len(image.shape) == 2:
            result.flags.append("Image en niveaux de gris — détection couleur limitée")
            # Convertir en BGR factice pour continuer
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

        # Conversion HSV
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Étape 1 : détecter les régions colorées
        color_mask, dominant_color = _detect_colored_regions(hsv)

        # Filtrage morphologique pour nettoyer le masque
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        color_mask = cv2.dilate(color_mask, kernel, iterations=1)
        color_mask = cv2.erode(color_mask, kernel, iterations=1)

        # Étape 2 : détecter les cercles
        circles = _find_circles(gray, color_mask)

        # Étape 3 : détecter les ellipses dans le masque couleur
        _, binary_color = cv2.threshold(color_mask, 127, 255, cv2.THRESH_BINARY)
        ellipses = _find_ellipses(binary_color)

        # Évaluer les résultats
        best_confidence: float = 0.0
        best_location: dict[str, int] | None = None

        # Analyser les cercles détectés
        for cx, cy, radius, color_score in circles:
            # Score basé sur la couleur et la taille
            size_score: float = min(1.0, radius / 80.0)
            confidence: float = color_score * 0.6 + size_score * 0.4
            if confidence > best_confidence:
                best_confidence = confidence
                best_location = {"x": cx, "y": cy, "radius": radius}

        # Analyser les ellipses détectées
        for cx, cy, r1, r2, _ in ellipses:
            avg_radius: int = (r1 + r2) // 2
            size_score = min(1.0, avg_radius / 80.0)
            # Les ellipses colorées sont un bon indice
            confidence = 0.5 + size_score * 0.3
            if confidence > best_confidence:
                best_confidence = confidence
                best_location = {"x": cx, "y": cy, "radius": avg_radius}

        # Seuil de détection
        if best_confidence > 0.25 and best_location is not None:
            result.stamp_detected = True
            result.confidence = round(min(1.0, best_confidence), 2)
            result.stamp_color = dominant_color
            result.location = best_location
        else:
            result.flags.append("Aucun cachet circulaire/ovale détecté")

        logger.info(
            "Détection cachet — détecté=%s | confiance=%.2f | couleur=%s "
            "| cercles=%d | ellipses=%d",
            result.stamp_detected,
            result.confidence,
            result.stamp_color,
            len(circles),
            len(ellipses),
        )

    except Exception as e:
        logger.error("Erreur lors de la détection de cachet : %s", e)
        result.flags.append(f"Erreur détection cachet : {str(e)}")

    return result
