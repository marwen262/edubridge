"""
Détection de signature manuscrite dans un document.
Analyse la zone inférieure (30 %) et cherche des contours
complexes et irréguliers typiques d'une signature.
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
    signature_detected: bool = False
    confidence: float = 0.0
    location: dict[str, int] | None = None
    flags: list[str] = field(default_factory=list)


def _extract_bottom_region(image: NDArray[np.uint8], ratio: float = 0.30) -> tuple[NDArray[np.uint8], int]:
    """Extrait la zone inférieure de l'image (par défaut 30 %).

    Retourne la zone recadrée et l'offset Y pour recalculer les coordonnées.
    """
    h: int = image.shape[0]
    y_start: int = int(h * (1.0 - ratio))
    return image[y_start:, :], y_start


def _analyze_contours(binary: NDArray[np.uint8]) -> list[tuple[NDArray, cv2.typing.Rect]]:
    """Trouve et filtre les contours qui pourraient être des signatures.

    Critères : complexité suffisante, taille raisonnable, ratio d'aspect typique.
    """
    contours, _ = cv2.findContours(
        binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    candidates: list[tuple[NDArray, cv2.typing.Rect]] = []

    for contour in contours:
        # Nombre de points du contour (complexité)
        num_points: int = len(contour)
        if num_points < 30:
            continue

        x, y, w, h = cv2.boundingRect(contour)
        area: float = cv2.contourArea(contour)

        # Filtrer par taille
        if w < 40 or h < 15:
            continue
        if w > binary.shape[1] * 0.8:
            continue

        # Ratio d'aspect : une signature est généralement plus large que haute
        aspect_ratio: float = w / max(h, 1)
        if aspect_ratio < 1.2 or aspect_ratio > 12.0:
            continue

        # Vérifier que le contour est assez complexe (pas un simple rectangle)
        perimeter: float = cv2.arcLength(contour, True)
        if perimeter < 100:
            continue

        # Compacité (forme irrégulière = faible compacité)
        compactness: float = (4 * np.pi * area) / max(perimeter ** 2, 1)
        if compactness > 0.5:
            # Trop régulier pour être une signature
            continue

        candidates.append((contour, (x, y, w, h)))

    return candidates


def _compute_ink_density(binary: NDArray[np.uint8], x: int, y: int, w: int, h: int) -> float:
    """Calcule la densité d'encre (pixels noirs) dans une zone donnée."""
    roi = binary[y:y + h, x:x + w]
    if roi.size == 0:
        return 0.0
    # Pixels noirs (0) dans une image binarisée inversée, ou blancs si inversée
    black_pixels: int = int(np.sum(roi == 0))
    density: float = black_pixels / roi.size
    return density


def detect_signature(image: NDArray[np.uint8]) -> SignatureResult:
    """Détecte la présence d'une signature dans la zone inférieure du document.

    Utilise la détection de contours, le filtrage par complexité et taille,
    et l'analyse de densité d'encre.
    """
    result = SignatureResult()

    try:
        # Convertir en niveaux de gris si nécessaire
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # Extraire la zone inférieure (30 %)
        bottom_region, y_offset = _extract_bottom_region(gray, ratio=0.30)

        if bottom_region.size == 0:
            result.flags.append("Zone inférieure vide")
            return result

        # Binarisation
        _, binary = cv2.threshold(
            bottom_region, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )

        # Détection et filtrage des contours
        candidates = _analyze_contours(binary)

        if not candidates:
            result.flags.append("Aucun contour de signature détecté")
            return result

        # Sélectionner le meilleur candidat (le plus complexe)
        best_candidate = max(candidates, key=lambda c: len(c[0]))
        contour, (x, y, w, h) = best_candidate

        # Calculer la densité d'encre
        ink_density = _compute_ink_density(binary, x, y, w, h)

        # Calculer la confiance basée sur plusieurs critères
        complexity_score: float = min(1.0, len(contour) / 200.0)
        density_score: float = min(1.0, ink_density * 5.0)
        size_score: float = min(1.0, (w * h) / (bottom_region.shape[0] * bottom_region.shape[1] * 0.05))

        confidence: float = (
            complexity_score * 0.5
            + density_score * 0.3
            + size_score * 0.2
        )
        confidence = min(1.0, max(0.0, confidence))

        # Seuil de détection
        if confidence > 0.3:
            result.signature_detected = True
            result.confidence = round(confidence, 2)
            result.location = {
                "x": int(x),
                "y": int(y + y_offset),
                "w": int(w),
                "h": int(h),
            }
        else:
            result.flags.append(
                f"Candidat signature trouvé mais confiance trop basse : {confidence:.2f}"
            )

        logger.info(
            "Détection signature — détectée=%s | confiance=%.2f | candidats=%d",
            result.signature_detected,
            result.confidence,
            len(candidates),
        )

    except Exception as e:
        logger.error("Erreur lors de la détection de signature : %s", e)
        result.flags.append(f"Erreur détection signature : {str(e)}")

    return result
