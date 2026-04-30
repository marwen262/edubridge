"""
Orchestrateur v2 : coordonne l'analyse et retourne le format strict.

Pipeline :
  1. Conversion → Prétraitement → OCR
  2. Analyse textuelle (sémantique)
  3. Détection diploma_confidence → early return si < 0.3
  4. Détection signature + cachet (confiance continue)
  5. Scoring probabiliste déterministe
  6. Construction de la réponse stricte {score, confidence_level, reasons}
"""

from __future__ import annotations

import hashlib
import random
import time

from app.models.response import VerifyResponse
from app.services.ocr_service import extract_text
from app.services.preprocessing import preprocess
from app.services.scoring_engine import compute_score, _clamp
from app.services.signature_detector import detect_signature
from app.services.stamp_detector import detect_stamp
from app.services.text_analyzer import analyze_text
from app.utils.image_converter import convert_file
from app.utils.logger import log_analysis_result, logger

# Nombre maximal de raisons retournées
_MAX_REASONS = 5


def _deterministic_low_score(content_hash: str, lo: float, hi: float) -> float:
    """Score déterministe dans [lo, hi] basé sur un hash."""
    seed = int(content_hash[:12], 16)
    rng = random.Random(seed)
    return round(rng.uniform(lo, hi), 1)


def _content_hash(text: str, file_path: str) -> str:
    """Hash combiné du texte extrait et du chemin fichier."""
    h = hashlib.sha256()
    h.update(text.encode("utf-8", errors="replace"))
    h.update(file_path.encode("utf-8", errors="replace"))
    return h.hexdigest()


async def analyze_document(
    file_path: str,
    mime_type: str,
    filename: str,
    file_size: int,
    country_hint: str | None = None,
) -> VerifyResponse:
    """Pipeline complet d'analyse d'un document.

    Retourne UNIQUEMENT {score, confidence_level, reasons}.
    """
    start = time.time()

    try:
        logger.info("Début de l'analyse : %s", filename)

        # ── 1. Conversion en image ──
        _pil_image, cv_image = convert_file(file_path, mime_type)

        # ── 2. Prétraitement (pour OCR) ──
        preprocessed = preprocess(cv_image)

        # ── 3. OCR ──
        ocr_result = extract_text(preprocessed)
        raw_text = ocr_result.full_text
        language = ocr_result.language_detected
        c_hash = _content_hash(raw_text, file_path)

        # ── 4. Gestion du document vide ──
        if not raw_text or len(raw_text.strip()) < 10:
            score = _deterministic_low_score(c_hash, 5.0, 25.0)
            score = _clamp(score)
            elapsed = int((time.time() - start) * 1000)
            log_analysis_result(
                filename=filename, country="unknown",
                score=score, verdict="low",
                processing_time_ms=elapsed, flags=[],
            )
            return VerifyResponse(
                score=score,
                confidence_level="low",
                reasons=["Document vide ou contenu insuffisant"],
            )

        # ── 5. Analyse textuelle sémantique ──
        text_result = analyze_text(raw_text, language)

        # ── 6. Early return si pas un diplôme ──
        if text_result.diploma_confidence < 0.3:
            score = _deterministic_low_score(c_hash, 5.0, 30.0)
            score = _clamp(score)
            reasons = ["Document non reconnu comme académique"]
            # Ajouter les raisons textuelles (max 4 restantes)
            for r in text_result.reasons:
                if len(reasons) >= _MAX_REASONS:
                    break
                if r not in reasons:
                    reasons.append(r)

            elapsed = int((time.time() - start) * 1000)
            log_analysis_result(
                filename=filename, country="unknown",
                score=score, verdict="low",
                processing_time_ms=elapsed, flags=[],
            )
            return VerifyResponse(
                score=score,
                confidence_level="low",
                reasons=reasons[:_MAX_REASONS],
            )

        # ── 7. Détection signature + cachet (sur image originale) ──
        sig_result = detect_signature(cv_image)
        stamp_result = detect_stamp(cv_image)

        # ── 8. Construire les données pour le scoring ──
        analysis_data: dict = {
            "has_person_name": 1.0 if text_result.has_person_name else 0.0,
            "has_institution": 1.0 if text_result.has_institution else 0.0,
            "has_degree_keyword": 1.0 if text_result.has_degree_keyword else 0.0,
            "has_date": 1.0 if text_result.has_date else 0.0,
            "signature_confidence": sig_result.confidence,
            "stamp_confidence": stamp_result.confidence,
            "official_mention": 1.0 if text_result.official_mention_found else 0.0,
        }

        # ── 9. Scoring probabiliste déterministe ──
        score, confidence_level = compute_score(analysis_data, raw_text)

        # ── 10. Construire les raisons ──
        reasons = _build_reasons(text_result, sig_result, stamp_result)

        # ── 11. Log ──
        elapsed = int((time.time() - start) * 1000)
        log_analysis_result(
            filename=filename,
            country="unknown",
            score=score,
            verdict=confidence_level,
            processing_time_ms=elapsed,
            flags=[],
        )

        return VerifyResponse(
            score=score,
            confidence_level=confidence_level,
            reasons=reasons,
        )

    except Exception as e:
        logger.error("Erreur fatale lors de l'analyse de %s : %s", filename, e)
        # En cas d'erreur, retourner un score bas déterministe
        fallback_hash = hashlib.sha256(
            filename.encode("utf-8", errors="replace"),
        ).hexdigest()
        score = _deterministic_low_score(fallback_hash, 5.0, 20.0)
        score = _clamp(score)
        return VerifyResponse(
            score=score,
            confidence_level="low",
            reasons=["Erreur lors de l'analyse du document"],
        )


def _build_reasons(text_result, sig_result, stamp_result) -> list[str]:
    """Construit la liste de raisons courtes et humaines (max 5)."""
    reasons: list[str] = []

    # Raisons textuelles
    for r in text_result.reasons:
        if len(reasons) >= _MAX_REASONS:
            break
        if r not in reasons:
            reasons.append(r)

    # Signature
    if sig_result.confidence < 0.3 and len(reasons) < _MAX_REASONS:
        reasons.append("Signature absente ou incertaine")

    # Cachet
    if stamp_result.confidence < 0.3 and len(reasons) < _MAX_REASONS:
        reasons.append("Cachet officiel absent")

    # Mentions officielles
    if not text_result.official_mention_found and len(reasons) < _MAX_REASONS:
        if "Institution non identifiée" not in reasons:
            reasons.append("Structure partiellement reconnue")

    # Si aucune raison mais score moyen
    if not reasons:
        reasons.append("Informations incomplètes")

    return reasons[:_MAX_REASONS]
