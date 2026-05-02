"""
Prétraitement de l'image avant analyse :
niveaux de gris, binarisation, débruitage, correction d'orientation, etc.

V3 — Production-grade :
  - Upscale x2 pour les petites images (améliore OCR)
  - CLAHE amélioré
  - Deskew plus robuste
  - Pipeline entièrement déterministe
"""

import cv2
import numpy as np
from numpy.typing import NDArray

from app.config import MAX_IMAGE_DIMENSION
from app.utils.logger import logger

# Taille minimale pour upscale automatique
_MIN_DIMENSION_FOR_UPSCALE = 1500


def to_grayscale(image: NDArray[np.uint8]) -> NDArray[np.uint8]:
    """Convertit l'image en niveaux de gris."""
    if len(image.shape) == 2:
        return image
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)


def apply_clahe(gray: NDArray[np.uint8]) -> NDArray[np.uint8]:
    """Améliore le contraste avec CLAHE (Contrast Limited Adaptive Histogram Equalization)."""
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)


def denoise(gray: NDArray[np.uint8]) -> NDArray[np.uint8]:
    """Supprime le bruit avec un filtre gaussien."""
    return cv2.GaussianBlur(gray, (3, 3), 0)


def adaptive_binarize(gray: NDArray[np.uint8]) -> NDArray[np.uint8]:
    """Binarisation adaptative de l'image."""
    return cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=15,
        C=10,
    )


def upscale_if_small(image: NDArray[np.uint8]) -> NDArray[np.uint8]:
    """Upscale x2 si l'image est trop petite pour un bon OCR.

    Les images de faible résolution produisent un OCR de mauvaise qualité.
    L'upscale bicubique améliore significativement les résultats.
    """
    h, w = image.shape[:2]
    max_dim = max(h, w)

    if max_dim < _MIN_DIMENSION_FOR_UPSCALE:
        new_w, new_h = w * 2, h * 2
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
        logger.debug("Image upscalée x2 : %dx%d → %dx%d", w, h, new_w, new_h)

    return image


def deskew(gray: NDArray[np.uint8]) -> NDArray[np.uint8]:
    """Corrige l'orientation de l'image si elle est légèrement inclinée."""
    # Détecter les coordonnées des pixels non nuls
    coords = np.column_stack(np.where(gray > 0))
    if coords.shape[0] < 100:
        return gray

    # Calculer l'angle minimal du rectangle englobant
    rect = cv2.minAreaRect(coords)
    angle: float = rect[-1]

    # Normaliser l'angle
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    # Ne corriger que si l'inclinaison est significative mais raisonnable
    if abs(angle) < 0.5 or abs(angle) > 15:
        return gray

    logger.debug("Correction d'inclinaison : %.2f°", angle)
    h, w = gray.shape[:2]
    center: tuple[float, float] = (w / 2.0, h / 2.0)
    rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated: NDArray[np.uint8] = cv2.warpAffine(
        gray,
        rotation_matrix,
        (w, h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE,
    )
    return rotated


def resize_image(image: NDArray[np.uint8]) -> NDArray[np.uint8]:
    """Redimensionne l'image si elle est trop grande."""
    h, w = image.shape[:2]
    max_dim: int = max(h, w)
    if max_dim > MAX_IMAGE_DIMENSION:
        ratio: float = MAX_IMAGE_DIMENSION / max_dim
        new_w, new_h = int(w * ratio), int(h * ratio)
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        logger.debug("Image redimensionnée à %dx%d", new_w, new_h)
    return image


def preprocess(image: NDArray[np.uint8]) -> NDArray[np.uint8]:
    """Pipeline complet de prétraitement.

    V3 — Pipeline :
      1. Redimensionner si trop grand
      2. Upscale x2 si trop petit
      3. Niveaux de gris
      4. CLAHE
      5. Débruitage
      6. Deskew
      7. Binarisation adaptative

    Retourne l'image prétraitée en niveaux de gris, binarisée et nettoyée.
    """
    try:
        logger.debug("Début du prétraitement de l'image")

        # Redimensionner si nécessaire (trop grand)
        image = resize_image(image)

        # Upscale si trop petit (améliore OCR)
        image = upscale_if_small(image)

        # Niveaux de gris
        gray = to_grayscale(image)

        # Amélioration du contraste
        enhanced = apply_clahe(gray)

        # Suppression du bruit
        denoised = denoise(enhanced)

        # Correction d'orientation
        straightened = deskew(denoised)

        # Binarisation adaptative
        binary = adaptive_binarize(straightened)

        logger.debug("Prétraitement terminé — dimensions=%dx%d", binary.shape[1], binary.shape[0])
        return binary

    except Exception as e:
        logger.error("Erreur lors du prétraitement : %s", e)
        # En cas d'erreur, retourner au moins une version en niveaux de gris
        return to_grayscale(image)
