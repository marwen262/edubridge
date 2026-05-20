"""
Détection de falsification et de modifications dans une image :
Error Level Analysis (ELA), copier-coller, artefacts JPEG,
uniformité du fond.

PDF non supporté — analyse uniquement des images.
"""

from __future__ import annotations

import io
import os
from dataclasses import dataclass, field

import cv2
import numpy as np
from numpy.typing import NDArray
from PIL import Image
from PIL.ExifTags import TAGS

from app.config import MANTRANET_ENABLED
from app.utils.logger import logger

try:
    from pyzbar.pyzbar import decode as _qr_decode
    _PYZBAR_AVAILABLE = True
except ImportError:
    _PYZBAR_AVAILABLE = False

if MANTRANET_ENABLED:
    from app.services.mantranet_detector import detect_mantranet as _detect_mantranet
else:
    def _detect_mantranet(image_path: str) -> float:  # type: ignore[misc]
        return 0.0

# Logiciels d'édition d'image dont la présence en EXIF est un signal de fraude.
_SUSPICIOUS_EXIF_SOFTWARE: list[str] = [
    "photoshop", "adobe photoshop",
    "gimp", "canva", "paint.net", "pixlr",
    "affinity photo", "corel", "inkscape",
]


@dataclass
class TamperingResult:
    """Résultat de la détection de falsification."""
    tampering_detected: bool = False
    tampering_score: float = 0.0
    ela_suspicious_regions: int = 0
    flags: list[str] = field(default_factory=list)
    metadata_info: dict = field(default_factory=dict)


def _compute_ela_spatial_factor(
    ela_gray: NDArray[np.uint8],
    suspicious_mask: NDArray[np.bool_],
    grid_rows: int = 4,
    grid_cols: int = 4,
    uniform_threshold: float = 0.5,
) -> float:
    """Distingue artefact JPEG (distribué) de vrai tampering (concentré).

    Divise l'image ELA en grille 4×4 et mesure dans combien de cellules
    les anomalies sont présentes :
      - spread_ratio > 50% des cellules → distribué uniformément
        → artefact de recompression JPEG normale → factor = 0.2
      - spread_ratio ≤ 50% → concentré dans quelques zones
        → manipulation localisée réelle → factor = 1.0

    Minimum de pixels par cellule = 0.5% de l'aire de la cellule pour
    ignorer le bruit de quantification JPEG isolé.
    """
    if not np.any(suspicious_mask):
        return 1.0

    h, w = ela_gray.shape
    cell_h = max(1, h // grid_rows)
    cell_w = max(1, w // grid_cols)
    min_pixels = max(1, int(cell_h * cell_w * 0.005))

    cells_hit = 0
    total_cells = grid_rows * grid_cols

    for r in range(grid_rows):
        for c in range(grid_cols):
            y0, y1 = r * cell_h, min(h, (r + 1) * cell_h)
            x0, x1 = c * cell_w, min(w, (c + 1) * cell_w)
            if int(np.sum(suspicious_mask[y0:y1, x0:x1])) >= min_pixels:
                cells_hit += 1

    spread_ratio = cells_hit / total_cells
    factor = 0.2 if spread_ratio > uniform_threshold else 1.0

    logger.debug(
        "ELA spatial — cells_hit=%d/%d spread=%.2f factor=%.1f",
        cells_hit, total_cells, spread_ratio, factor,
    )
    return factor


def _error_level_analysis(image: NDArray[np.uint8], quality: int = 95) -> tuple[float, int, float]:
    """Effectue une Error Level Analysis (ELA).

    Sauvegarde l'image en JPEG à une qualité donnée, puis compare
    pixel à pixel avec l'originale. Les zones modifiées présentent
    un niveau d'erreur différent.

    Retourne (score_ela, nombre_zones_suspectes, spatial_factor).
    spatial_factor = 1.0 si anomalies concentrées (vrai tampering),
                     0.2 si distribuées (artefact JPEG recompression).
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
            return 0.0, 0, 1.0

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

        # Vérifier si les anomalies sont concentrées ou distribuées
        spatial_factor: float = _compute_ela_spatial_factor(ela_gray, suspicious_mask)

        # Normaliser le score (0 = propre, 1 = très altéré)
        ela_score: float = min(1.0, std_dev / 30.0)

        return round(ela_score, 3), num_regions, spatial_factor

    except Exception as e:
        logger.warning("Erreur ELA : %s", e)
        return 0.0, 0, 1.0


def _detect_copy_paste(image: NDArray[np.uint8], block_size: int = 32) -> float:
    """Détecte les zones de copier-coller par comparaison de blocs.

    Phase 3 — Fix FP : on ignore les blocs à faible variance (fond
    uniforme, marges blanches). Sur un document propre, des dizaines
    de blocs de fond identiques étaient comptés comme "copier-coller"
    et maxaient le score à 1.00. Un vrai copier-coller copie du
    CONTENU, pas du fond — on skip les blocs avec std < 5.

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

        # Seuil de variance : en dessous, le bloc est du fond/décor répétitif.
        # Diplômes authentiques ont des bordures décoratives et du texte uniforme
        # avec std 10–40 qui généraient des faux positifs massifs (score 0.97).
        # Avec le poids copy_paste à 0.35, même un score de 0.33 dégrade trop.
        # Un vrai copier-coller copie du contenu dense (signature, cachet, nom)
        # qui a forcément std >> 50 à résolution ×0.5 (image réduite).
        _MIN_CONTENT_STD = 50.0

        # Découper en blocs et collecter ceux qui contiennent du contenu
        blocks: list[tuple[int, int, float]] = []
        for y in range(0, sh - block_size, block_size // 2):
            for x in range(0, sw - block_size, block_size // 2):
                block = small[y:y + block_size, x:x + block_size]
                block_mean: float = float(np.mean(block))
                block_std: float = float(np.std(block))
                # Skip uniform-content blocks (background/whitespace)
                if block_std < _MIN_CONTENT_STD:
                    continue
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
            if quad_diff > 30:
                flags.append(
                    f"Différence de fond entre quadrants : {quad_diff:.1f}"
                )

        # Normalisé sur 100 : la photographie génère naturellement bg_std 20–30.
        # L'ancienne normalisation /40 pénalisait tous les diplômes photographiés.
        score: float = min(1.0, bg_std / 100.0)
        return round(score, 3), flags

    except Exception as e:
        logger.warning("Erreur analyse fond : %s", e)
        return 0.0, []


def _analyze_dct(image: NDArray[np.uint8]) -> float:
    """Détecte les discontinuités de coefficients DCT entre blocs adjacents.

    Un document modifié numériquement présente souvent des transitions
    abruptes d'énergie haute-fréquence entre blocs 8×8 aux frontières
    de la région éditée. Cette analyse mesure ces discontinuités.

    Pipeline :
      1. Conversion en niveaux de gris (float32)
      2. Découpage en blocs 8×8 non-chevauchants
      3. Pour chaque bloc : DCT → énergie haute-fréquence (coin bas-droite 4×4)
      4. Comparaison de l'énergie entre blocs horizontalement et verticalement adjacents
      5. Moyenne des discontinuités → normalisée en [0.0, 0.5]

    Blocs avec std des pixels < 10 (fond uniforme) : ignorés.
    """
    try:
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY).astype(np.float32)
        else:
            gray = image.astype(np.float32)

        h, w = gray.shape
        block_size = 8
        hf_start = 4  # coin bas-droite 4×4 des coefficients DCT

        # Calcul de l'énergie haute-fréquence par bloc
        rows = h // block_size
        cols = w // block_size
        block_energies: dict[tuple[int, int], float] = {}

        for r in range(rows):
            for c in range(cols):
                y0, x0 = r * block_size, c * block_size
                block = gray[y0:y0 + block_size, x0:x0 + block_size]

                # Ignorer les blocs de fond uniforme
                if float(np.std(block)) < 10.0:
                    continue

                dct_block = cv2.dct(block)
                hf_energy = float(np.sum(dct_block[hf_start:, hf_start:] ** 2))
                block_energies[(r, c)] = hf_energy

        if len(block_energies) < 4:
            return 0.0

        # Mesure des discontinuités entre blocs adjacents
        discontinuities: list[float] = []
        for (r, c), energy in block_energies.items():
            if (r, c + 1) in block_energies:
                discontinuities.append(abs(energy - block_energies[(r, c + 1)]))
            if (r + 1, c) in block_energies:
                discontinuities.append(abs(energy - block_energies[(r + 1, c)]))

        if not discontinuities:
            return 0.0

        mean_disc = float(np.mean(discontinuities))

        # Normalisation vers [0.0, 0.5]
        # Seuil de 1 800 : en-dessous, la variance est naturelle (scan JPEG ou
        # rendu PNG uniforme). Au-delà, un document numériquement altéré présente
        # des discontinuités bien supérieures (typiquement 3 000–50 000+).
        _DCT_THRESHOLD = 1_800.0
        _DCT_RANGE = 20_000.0
        if mean_disc <= _DCT_THRESHOLD:
            return 0.0
        return min(0.5, (mean_disc - _DCT_THRESHOLD) / _DCT_RANGE * 0.5)

    except Exception as e:
        logger.warning("Erreur analyse DCT : %s", e)
        return 0.0


def _png_laplacian_noise(file_path: str) -> float:
    """Laplacian variance signal for PNG files.

    Real scans and camera photos have organic noise; AI-generated or
    heavily edited PNGs are often unusually sharp (very high variance)
    or perfectly smooth (very low variance).  Threshold 800 flags images
    whose sharpness is implausibly high for a physical document scan.

    Returns 0.4 if Laplacian variance > 800, else 0.0.
    """
    try:
        img = Image.open(file_path).convert("L")
        gray = np.array(img, dtype=np.float64)
        lap_var = float(cv2.Laplacian(gray.astype(np.uint8), cv2.CV_64F).var())
        logger.debug("PNG Laplacian variance: %.1f", lap_var)
        return 0.4 if lap_var > 800 else 0.0
    except Exception as e:
        logger.warning("PNG Laplacian noise check failed: %s", e)
        return 0.0


def _analyze_noise_pattern(image: NDArray[np.uint8]) -> float:
    """Détecte les irrégularités de bruit spatiales (signal d'édition localisée).

    Pipeline :
      1. Conversion en niveaux de gris
      2. Filtre médian 3×3 soustrait de l'original → carte de bruit
      3. Découpage en grille 8×8 de blocs
      4. Moyenne du bruit par bloc (les blocs avec std<3 sont ignorés —
         fond uniforme sans contenu)
      5. Écart-type des moyennes de blocs (mesure d'hétérogénéité spatiale)

    Interprétation :
      std > 15 → édition localisée → 0.4
      std < 5  → document très uniforme → 0.0
      sinon    → (std - 5) / 10 × 0.4 (proportionnel)
    """
    try:
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # Filtre médian 3×3 → carte de bruit absolue
        median = cv2.medianBlur(gray, 3)
        noise_map = np.abs(gray.astype(np.float32) - median.astype(np.float32))

        h, w = noise_map.shape
        block_size = 8
        block_means: list[float] = []

        for y in range(0, h - block_size + 1, block_size):
            for x in range(0, w - block_size + 1, block_size):
                block = noise_map[y:y + block_size, x:x + block_size]
                # Ignorer les blocs de fond uniforme (bruit trop régulier)
                if float(np.std(block)) < 3.0:
                    continue
                block_means.append(float(np.mean(block)))

        if not block_means:
            return 0.0

        std = float(np.std(block_means))

        if std > 15.0:
            return 0.4
        if std < 5.0:
            return 0.0
        return (std - 5.0) / 10.0 * 0.4

    except Exception as e:
        logger.warning("Erreur analyse pattern de bruit : %s", e)
        return 0.0


def _analyze_exif(file_path: str) -> float:
    """Analyse les métadonnées EXIF pour détecter une retouche suspecte.

    PNG → Laplacian noise check (no EXIF on PNGs).
      - Laplacian variance > 800 (implausibly sharp for a real scan) → 0.4

    JPEG signaux (max des signaux détectés) :
      - Software suspect (Photoshop / GIMP / Canva / Paint.NET) → 1.0
      - DateTimeOriginal ≠ DateTime (dates incohérentes) → 0.7
      - JPEG sans aucun EXIF → 0.3 (signal mineur : photo whatsapp ou retouche)
    """
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".png":
        return _png_laplacian_noise(file_path)
    if ext not in (".jpg", ".jpeg"):
        return 0.0

    try:
        img = Image.open(file_path)
        exif_data = img.getexif()

        if not exif_data:
            return 0.3  # JPEG sans EXIF : signal mineur

        score: float = 0.0
        software_val: str | None = None
        datetime_original: str | None = None
        datetime_val: str | None = None

        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, "")
            if tag_name == "Software" and isinstance(value, str):
                software_val = value.lower()
            elif tag_name == "DateTimeOriginal" and isinstance(value, str):
                datetime_original = value
            elif tag_name == "DateTime" and isinstance(value, str):
                datetime_val = value

        if software_val:
            for suspect in _SUSPICIOUS_EXIF_SOFTWARE:
                if suspect in software_val:
                    score = max(score, 1.0)
                    break

        if datetime_original and datetime_val and datetime_original != datetime_val:
            score = max(score, 0.7)

        return round(score, 3)

    except Exception as e:
        logger.warning("Erreur analyse EXIF : %s", e)
        return 0.0


def _detect_qr_code(image: NDArray[np.uint8]) -> tuple[bool, list[str]]:
    """Détecte les QR codes dans l'image via pyzbar.

    Returns (found, list_of_decoded_strings).
    Silently returns (False, []) when pyzbar is not installed.
    """
    if not _PYZBAR_AVAILABLE:
        return False, []
    try:
        if len(image.shape) == 3:
            pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        else:
            pil = Image.fromarray(image)
        decoded = _qr_decode(pil)
        if decoded:
            data = [d.data.decode("utf-8", errors="replace") for d in decoded]
            logger.info("QR code(s) détecté(s) : %d | data=%r", len(decoded), data[:2])
            return True, data
        return False, []
    except Exception as e:
        logger.debug("QR detection failed: %s", e)
        return False, []


def _is_high_res_clean_diploma(
    image: NDArray[np.uint8],
    bg_score: float,
    file_path: str = "",
) -> bool:
    """True si l'image ressemble à un diplôme numérique haute résolution.

    Conditions :
      - côté le plus long > 2000 px (haute résolution)
      - fond très uniforme (bg_score < 0.10)
      - format PNG — les diplômes physiques numérisés sont presque toujours
        des JPEG (scanner / appareil photo). Un PNG haute-résolution propre
        indique une origine numérique (export logiciel, IA) où un QR de
        vérification serait attendu.

    Les JPEG sont exclus pour éviter les faux positifs sur les vrais
    diplômes photographiés / scannés.
    """
    ext = os.path.splitext(file_path)[1].lower()
    if ext != ".png":
        return False
    h, w = image.shape[:2]
    return max(h, w) > 2000 and bg_score < 0.10


def detect_tampering(
    image: NDArray[np.uint8],
    file_path: str,
) -> TamperingResult:
    """Pipeline de détection de falsification sur image.

    Formule avec MantraNet activé (MANTRANET_ENABLED=True, somme = 1.0) :
      ELA_effective × 0.20 + copier-coller × 0.25 + fond × 0.12
      + EXIF × 0.13 + bruit × 0.15 + MantraNet × 0.15

    Formule sans MantraNet (MANTRANET_ENABLED=False, somme = 1.0) :
      ELA_effective × 0.25 + copier-coller × 0.28 + fond × 0.15
      + EXIF × 0.15 + bruit × 0.17

    Ajustements post-formule (QR) :
      QR trouvé              → −0.10 (document vérifiable)
      Pas de QR + haute-rés  → +0.20 (diplôme numérique sans code vérification)

    ELA_effective = ela_score × spatial_factor
      spatial_factor = 1.0 si anomalies concentrées (manipulation réelle)
                     = 0.2 si anomalies distribuées (artefact JPEG)
    """
    result = TamperingResult()

    try:
        # 1. Error Level Analysis + vérification de concentration spatiale
        ela_score, ela_regions, ela_spatial_factor = _error_level_analysis(image)
        result.ela_suspicious_regions = ela_regions

        ela_effective = ela_score * ela_spatial_factor

        # 2. Analyse DCT (discontinuités haute-fréquence entre blocs adjacents)
        dct_score = _analyze_dct(image)

        # Combinaison ELA + DCT (ELA 60%, DCT 40%)
        ela_dct_combined = ela_effective * 0.6 + dct_score * 0.4

        # 3. Détection copier-coller
        copy_paste_score = _detect_copy_paste(image)

        # 4. Uniformité du fond
        bg_score, bg_flags = _check_background_uniformity(image)
        result.flags.extend(bg_flags)

        # 5. Analyse EXIF (logiciel suspect / dates incohérentes / absent JPEG)
        exif_score = _analyze_exif(file_path)

        # 6. Analyse pattern de bruit spatial (détection d'édition localisée)
        noise_score = _analyze_noise_pattern(image)

        # 7. MantraNet (6e composant — pixel-level manipulation map)
        mantranet_score = _detect_mantranet(file_path)

        # Score global
        if MANTRANET_ENABLED:
            # Nouvelle formule 6 composants (somme = 1.0)
            tampering_score: float = (
                ela_dct_combined  * 0.20
                + copy_paste_score * 0.25
                + bg_score         * 0.12
                + exif_score       * 0.13
                + noise_score      * 0.15
                + mantranet_score  * 0.15
            )
        else:
            # Formule originale 5 composants (somme = 1.0)
            tampering_score = (
                ela_dct_combined  * 0.25
                + copy_paste_score * 0.28
                + bg_score         * 0.15
                + exif_score       * 0.15
                + noise_score      * 0.17
            )
        tampering_score = min(1.0, tampering_score)

        # QR code detection — post-formula adjustment.
        qr_found, qr_data = _detect_qr_code(image)
        if qr_found:
            tampering_score = max(0.0, tampering_score - 0.1)
            data_preview = qr_data[0][:60] if qr_data else ""
            result.flags.append(f"QR vérifiable détecté : {data_preview}")
        elif _is_high_res_clean_diploma(image, bg_score, file_path):
            tampering_score = min(1.0, tampering_score + 0.2)
            result.flags.append("Diplôme haute résolution sans QR de vérification")

        result.tampering_score = round(tampering_score, 3)
        result.tampering_detected = tampering_score > 0.45

        if ela_regions > 3 and ela_spatial_factor == 1.0:
            result.flags.append(
                f"ELA : {ela_regions} régions suspectes concentrées"
            )
        elif ela_regions > 3:
            logger.debug(
                "ELA : %d régions mais distribuées uniformément → artefact JPEG",
                ela_regions,
            )

        if copy_paste_score > 0.3:
            result.flags.append(
                f"Possible copier-coller détecté (score={copy_paste_score:.2f})"
            )

        if exif_score >= 1.0:
            result.flags.append("EXIF : logiciel d'édition d'image détecté")
        elif exif_score >= 0.7:
            result.flags.append("EXIF : dates de création incohérentes")

        logger.info(
            "Détection tampering — score=%.3f | ELA=%.3f (spatial=%.1f "
            "effective=%.3f) | DCT=%.3f | ela_dct=%.3f | %d régions | "
            "copier-coller=%.3f | fond=%.3f | exif=%.2f | bruit=%.3f | "
            "mantranet=%.3f (enabled=%s) | qr=%s",
            result.tampering_score,
            ela_score,
            ela_spatial_factor,
            ela_effective,
            dct_score,
            ela_dct_combined,
            ela_regions,
            copy_paste_score,
            bg_score,
            exif_score,
            noise_score,
            mantranet_score,
            MANTRANET_ENABLED,
            "found" if qr_found else "absent",
        )

    except Exception as e:
        logger.error("Erreur détection de falsification : %s", e)
        result.flags.append(f"Erreur détection tampering : {str(e)}")

    return result
