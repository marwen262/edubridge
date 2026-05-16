"""
Chargement des images uploadées (JPEG, PNG, WebP, TIFF) en objets
PIL.Image et numpy array exploitables par les services d'analyse.

PDF non supporté — le service accepte uniquement des images.
"""

import numpy as np
from numpy.typing import NDArray
from PIL import Image

from app.config import MAX_IMAGE_DIMENSION
from app.utils.logger import logger


def load_image(file_path: str) -> Image.Image:
    """Charge une image depuis un fichier (JPEG, PNG, WebP, TIFF)."""
    logger.debug("Chargement image : %s", file_path)
    img: Image.Image = Image.open(file_path)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    return img


def resize_if_needed(img: Image.Image) -> Image.Image:
    """Redimensionne l'image si elle dépasse MAX_IMAGE_DIMENSION."""
    w, h = img.size
    max_dim: int = max(w, h)
    if max_dim > MAX_IMAGE_DIMENSION:
        ratio: float = MAX_IMAGE_DIMENSION / max_dim
        new_size: tuple[int, int] = (int(w * ratio), int(h * ratio))
        logger.debug("Redimensionnement de %dx%d vers %dx%d", w, h, *new_size)
        img = img.resize(new_size, Image.LANCZOS)
    return img


def convert_file(file_path: str, mime_type: str) -> tuple[Image.Image, NDArray[np.uint8]]:
    """Charge une image et retourne (PIL.Image, numpy array BGR) pour OpenCV.

    Seules les images sont acceptées. Un fichier non-image lève ValueError.
    """
    if mime_type == "application/pdf":
        raise ValueError(
            "Les fichiers PDF ne sont pas acceptés. "
            "Veuillez soumettre une image (JPEG, PNG, WebP ou TIFF)."
        )

    pil_img = load_image(file_path)
    pil_img = resize_if_needed(pil_img)

    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")

    np_array: NDArray[np.uint8] = np.array(pil_img)[:, :, ::-1].copy()

    logger.info(
        "Image chargée — dimensions=%dx%d | mode=%s",
        pil_img.size[0],
        pil_img.size[1],
        pil_img.mode,
    )
    return pil_img, np_array
