"""
Détection de falsification et de modifications dans un document :
Error Level Analysis (ELA), copier-coller, artefacts JPEG,
uniformité du fond et métadonnées PDF.
"""

from __future__ import annotations

import io
import os
from dataclasses import dataclass, field

import cv2
import fitz  # PyMuPDF
import numpy as np
from numpy.typing import NDArray
from PIL import Image

from app.utils.logger import logger


@dataclass
class TamperingResult:
    """Résultat de la détection de falsification."""
    tampering_detected: bool = False
    tampering_score: float = 0.0
    ela_suspicious_regions: int = 0
    metadata_flags: list[str] = field(default_factory=list)
    metadata_info: dict[str, str | None] = field(default_factory=dict)
    flags: list[str] = field(default_factory=list)


# Logiciels d'édition d'image suspects
SUSPICIOUS_SOFTWARE: list[str] = [
    "gimp", "photoshop", "adobe photoshop",
    "paint.net", "pixlr", "canva",
    "affinity photo", "corel", "inkscape",
]


def _error_level_analysis(image: NDArray[np.uint8], quality: int = 95) -> tuple[float, int]:
    """Effectue une Error Level Analysis (ELA).

    Sauvegarde l'image en JPEG à une qualité donnée, puis compare
    pixel à pixel avec l'originale. Les zones modifiées présentent
    un niveau d'erreur différent.

    Retourne (score_ela, nombre_zones_suspectes).
    """
    try:
        # Convertir en PIL pour la recompression JPEG
        if len(image.shape) == 2:
            pil_img = Image.fromarray(image)
        else:
            pil_img = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

        # Recompresser en JPEG
        buffer = io.BytesIO()
        pil_img.save(buffer, format="JPEG", quality=quality)
        buffer.seek(0)
        recompressed = Image.open(buffer)

        # Calculer la différence
        original_array = np.array(pil_img, dtype=np.float64)
        recompressed_array = np.array(recompressed, dtype=np.float64)

        # S'assurer que les dimensions correspondent
        if original_array.shape != recompressed_array.shape:
            return 0.0, 0

        diff = np.abs(original_array - recompressed_array)

        # Amplifier la différence pour la rendre visible
        ela_image = (diff * 10).clip(0, 255).astype(np.uint8)

        # Convertir en niveaux de gris pour l'analyse
        if len(ela_image.shape) == 3:
            ela_gray = cv2.cvtColor(ela_image, cv2.COLOR_RGB2GRAY)
        else:
            ela_gray = ela_image

        # Calculer l'écart-type global (indicateur de tampering)
        std_dev: float = float(np.std(ela_gray))

        # Détecter les zones avec un niveau d'erreur anormalement élevé
        mean_val: float = float(np.mean(ela_gray))
        threshold: float = mean_val + 2 * std_dev
        suspicious_mask = ela_gray > threshold

        # Compter les régions suspectes contiguës
        if np.any(suspicious_mask):
            suspicious_uint8 = suspicious_mask.astype(np.uint8) * 255
            contours, _ = cv2.findContours(
                suspicious_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )
            # Filtrer les petites régions (bruit)
            significant_regions = [
                c for c in contours if cv2.contourArea(c) > 100
            ]
            num_regions: int = len(significant_regions)
        else:
            num_regions = 0

        # Normaliser le score (0 = propre, 1 = très altéré)
        ela_score: float = min(1.0, std_dev / 30.0)

        return round(ela_score, 3), num_regions

    except Exception as e:
        logger.warning("Erreur ELA : %s", e)
        return 0.0, 0


def _detect_copy_paste(image: NDArray[np.uint8], block_size: int = 32) -> float:
    """Détecte les zones de copier-coller par comparaison de blocs.

    Retourne un score de suspicion (0.0 à 1.0).
    """
    try:
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        h, w = gray.shape
        # Réduire la résolution pour accélérer le calcul
        scale: float = 0.5
        small = cv2.resize(gray, (int(w * scale), int(h * scale)))
        sh, sw = small.shape

        # Découper en blocs et comparer leurs hashes
        blocks: list[tuple[int, int, float]] = []
        for y in range(0, sh - block_size, block_size // 2):
            for x in range(0, sw - block_size, block_size // 2):
                block = small[y:y + block_size, x:x + block_size]
                block_mean: float = float(np.mean(block))
                block_std: float = float(np.std(block))
                blocks.append((y, x, block_mean * 1000 + block_std))

        # Chercher des blocs avec des signatures similaires mais éloignés
        if len(blocks) < 2:
            return 0.0

        # Trier par signature et chercher les doublons
        blocks.sort(key=lambda b: b[2])
        duplicates: int = 0
        min_distance: int = block_size * 3

        for i in range(len(blocks) - 1):
            y1, x1, sig1 = blocks[i]
            y2, x2, sig2 = blocks[i + 1]
            if abs(sig1 - sig2) < 1.0:
                distance = ((y2 - y1) ** 2 + (x2 - x1) ** 2) ** 0.5
                if distance > min_distance:
                    duplicates += 1

        # Normaliser
        max_expected: int = max(len(blocks) // 20, 1)
        score: float = min(1.0, duplicates / max_expected)

        return round(score, 3)

    except Exception as e:
        logger.warning("Erreur détection copier-coller : %s", e)
        return 0.0


def _check_background_uniformity(image: NDArray[np.uint8]) -> tuple[float, list[str]]:
    """Analyse l'uniformité des couleurs de fond.

    Des zones de fond avec des couleurs différentes peuvent indiquer
    une insertion suspecte.
    """
    flags: list[str] = []

    try:
        if len(image.shape) == 2:
            gray = image
        else:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Binariser pour séparer fond et contenu
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Le fond = pixels blancs (majoritaires dans un diplôme)
        background_mask = binary == 255
        if not np.any(background_mask):
            return 0.0, []

        # Extraire les valeurs du fond
        background_values = gray[background_mask]
        bg_std: float = float(np.std(background_values))

        # Un fond uniforme a un faible écart-type
        if bg_std > 25:
            flags.append(f"Fond non uniforme (écart-type={bg_std:.1f})")

        # Vérifier par quadrants
        h, w = gray.shape
        quadrants = [
            gray[:h // 2, :w // 2],
            gray[:h // 2, w // 2:],
            gray[h // 2:, :w // 2],
            gray[h // 2:, w // 2:],
        ]
        quad_means: list[float] = [
            float(np.mean(q[q > 200])) if np.any(q > 200) else 0.0
            for q in quadrants
        ]
        valid_means = [m for m in quad_means if m > 0]
        if len(valid_means) >= 2:
            quad_diff: float = max(valid_means) - min(valid_means)
            if quad_diff > 15:
                flags.append(
                    f"Différence de fond entre quadrants : {quad_diff:.1f}"
                )

        score: float = min(1.0, bg_std / 40.0)
        return round(score, 3), flags

    except Exception as e:
        logger.warning("Erreur analyse fond : %s", e)
        return 0.0, []


def _analyze_pdf_metadata(file_path: str) -> tuple[dict[str, str | None], list[str]]:
    """Analyse les métadonnées d'un PDF avec PyMuPDF.

    Vérifie l'auteur, le logiciel, les dates de création/modification.
    """
    metadata: dict[str, str | None] = {
        "author": None,
        "creation_date": None,
        "modification_date": None,
        "software": None,
    }
    flags: list[str] = []

    try:
        if not file_path.lower().endswith(".pdf"):
            return metadata, flags

        if not os.path.exists(file_path):
            return metadata, flags

        doc = fitz.open(file_path)
        meta = doc.metadata

        if meta:
            metadata["author"] = meta.get("author") or None
            metadata["software"] = meta.get("producer") or meta.get("creator") or None
            metadata["creation_date"] = meta.get("creationDate") or None
            metadata["modification_date"] = meta.get("modDate") or None

            # Vérifier logiciel suspect
            software_str: str = (
                (metadata["software"] or "") + " " + (metadata["author"] or "")
            ).lower()
            for suspect in SUSPICIOUS_SOFTWARE:
                if suspect in software_str:
                    flags.append(
                        f"Logiciel d'édition d'image détecté : {metadata['software']}"
                    )
                    break

            # Vérifier dates incohérentes
            creation = metadata["creation_date"]
            modification = metadata["modification_date"]
            if creation and modification:
                if modification < creation:
                    flags.append(
                        "Date de modification antérieure à la date de création"
                    )

            # Métadonnées vides = suspect
            if not metadata["author"] and not metadata["software"]:
                flags.append("Métadonnées PDF vides (auteur et logiciel absents)")

        doc.close()

    except Exception as e:
        logger.warning("Erreur analyse métadonnées PDF : %s", e)
        flags.append(f"Impossible de lire les métadonnées PDF : {str(e)}")

    return metadata, flags


def detect_tampering(
    image: NDArray[np.uint8],
    file_path: str,
) -> TamperingResult:
    """Pipeline complet de détection de falsification.

    Combine ELA, copier-coller, uniformité du fond et métadonnées PDF.
    """
    result = TamperingResult()

    try:
        # 1. Error Level Analysis
        ela_score, ela_regions = _error_level_analysis(image)
        result.ela_suspicious_regions = ela_regions

        # 2. Détection copier-coller
        copy_paste_score = _detect_copy_paste(image)

        # 3. Uniformité du fond
        bg_score, bg_flags = _check_background_uniformity(image)
        result.flags.extend(bg_flags)

        # 4. Métadonnées PDF
        meta_info, meta_flags = _analyze_pdf_metadata(file_path)
        result.metadata_info = meta_info
        result.metadata_flags = meta_flags
        result.flags.extend(meta_flags)

        # Score global de tampering
        tampering_score: float = (
            ela_score * 0.40
            + copy_paste_score * 0.25
            + bg_score * 0.15
            + (len(meta_flags) * 0.1)
        )
        tampering_score = min(1.0, tampering_score)

        result.tampering_score = round(tampering_score, 3)
        result.tampering_detected = tampering_score > 0.35

        if ela_regions > 3:
            result.flags.append(
                f"ELA : {ela_regions} régions suspectes détectées"
            )

        if copy_paste_score > 0.3:
            result.flags.append(
                f"Possible copier-coller détecté (score={copy_paste_score:.2f})"
            )

        logger.info(
            "Détection tampering — score=%.3f | ELA=%.3f (%d régions) | "
            "copier-coller=%.3f | fond=%.3f | meta_flags=%d",
            result.tampering_score,
            ela_score,
            ela_regions,
            copy_paste_score,
            bg_score,
            len(meta_flags),
        )

    except Exception as e:
        logger.error("Erreur détection de falsification : %s", e)
        result.flags.append(f"Erreur détection tampering : {str(e)}")

    return result
