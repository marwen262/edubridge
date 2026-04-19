"""
Conversion des fichiers uploadés (PDF ou image) en objets PIL.Image et numpy array
exploitables par les services d'analyse.
"""

import numpy as np
from numpy.typing import NDArray
from pdf2image import convert_from_path
from PIL import Image

from app.config import MAX_IMAGE_DIMENSION, PDF_DPI
from app.utils.logger import logger


def pdf_to_image(file_path: str) -> Image.Image:
    """Convertit la première page d'un PDF en image PIL à 300 DPI."""
    logger.debug("Conversion PDF → image à %d DPI : %s", PDF_DPI, file_path)
    pages: list[Image.Image] = convert_from_path(
        file_path,
        dpi=PDF_DPI,
        first_page=1,
        last_page=1,
    )
    if not pages:
        raise ValueError("Le PDF ne contient aucune page exploitable.")
    return pages[0]


def load_image(file_path: str) -> Image.Image:
    """Charge une image depuis un fichier (JPEG, PNG)."""
    logger.debug("Chargement image : %s", file_path)
    img: Image.Image = Image.open(file_path)
    # Convertir en RGB si nécessaire (ex : RGBA, palette)
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
    """Point d'entrée principal : convertit un fichier en PIL.Image + numpy array.

    Gère les PDF (première page) et les images classiques.
    Retourne (pil_image, numpy_array_bgr) prêts pour les traitements.
    """
    if mime_type == "application/pdf":
        pil_img = pdf_to_image(file_path)
    else:
        pil_img = load_image(file_path)

    # Redimensionner si trop grande
    pil_img = resize_if_needed(pil_img)

    # S'assurer qu'on est en RGB
    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")

    # Conversion en numpy array (format BGR pour OpenCV)
    np_array: NDArray[np.uint8] = np.array(pil_img)[:, :, ::-1].copy()

    logger.info(
        "Image convertie — dimensions=%dx%d | mode=%s",
        pil_img.size[0],
        pil_img.size[1],
        pil_img.mode,
    )
    return pil_img, np_array
