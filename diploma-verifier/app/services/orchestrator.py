"""
Orchestrateur : chef d'orchestre qui coordonne tous les services
d'analyse et construit la réponse finale.
"""

from __future__ import annotations

import time

from app.models.response import (
    Checks,
    ExtractedData,
    FileInfo,
    MetadataCheck,
    OfficialMentionCheck,
    SignatureCheck,
    SignatureLocation,
    StampCheck,
    StampLocation,
    TamperingCheck,
    TextCoherenceCheck,
    VerifyResponse,
)
from app.services.country_detector import detect_country
from app.services.diploma_classifier import classify_diploma
from app.services.ocr_service import extract_text
from app.services.preprocessing import preprocess
from app.services.scoring_engine import compute_final_score
from app.services.signature_detector import detect_signature
from app.services.stamp_detector import detect_stamp
from app.services.tampering_detector import detect_tampering
from app.services.text_analyzer import analyze_text
from app.utils.image_converter import convert_file
from app.utils.logger import log_analysis_result, logger


async def analyze_document(
    file_path: str,
    mime_type: str,
    filename: str,
    file_size: int,
    country_hint: str | None = None,
) -> VerifyResponse:
    """Pipeline complet d'analyse d'un document.

    Coordonne les étapes : conversion → prétraitement → OCR →
    détection pays → analyses spécialisées → scoring → réponse.
    """
    start_time: float = time.time()
    all_flags: list[str] = []

    try:
        # 1. Conversion du fichier en image exploitable
        logger.info("Début de l'analyse : %s", filename)
        pil_image, cv_image = convert_file(file_path, mime_type)

        # 2. Prétraitement de l'image (pour l'OCR)
        preprocessed = preprocess(cv_image)

        # 3. Extraction OCR du texte
        ocr_result = extract_text(preprocessed)
        all_flags.extend(ocr_result.flags)

        # 4. Détection du pays d'origine
        country_result = detect_country(
            ocr_result.full_text,
            ocr_result.language_detected,
            country_hint,
        )

        # 5. Analyses spécialisées (sur l'image originale, pas prétraitée)
        signature_result = detect_signature(cv_image)
        all_flags.extend(signature_result.flags)

        stamp_result = detect_stamp(cv_image)
        all_flags.extend(stamp_result.flags)

        text_result = analyze_text(
            ocr_result.full_text,
            ocr_result.language_detected,
        )
        all_flags.extend(text_result.flags)

        tampering_result = detect_tampering(cv_image, file_path)
        all_flags.extend(tampering_result.flags)

        classification_result = classify_diploma(
            ocr_result.full_text, cv_image,
        )
        all_flags.extend(classification_result.flags)

        # 6. Préparer les données pour le scoring
        metadata_flag_count: int = len(tampering_result.metadata_flags)
        metadata_suspicion: float = min(1.0, metadata_flag_count * 0.33)

        scoring_data: dict = {
            "is_diploma": classification_result.is_diploma,
            "signature_detected": signature_result.signature_detected,
            "stamp_detected": stamp_result.stamp_detected,
            "official_mention_found": text_result.official_mention_found,
            "text_coherence_score": text_result.text_coherence_score,
            "tampering_score": tampering_result.tampering_score,
            "metadata_suspicion": metadata_suspicion,
            "all_flags": all_flags,
        }

        # 7. Scoring final
        score, verdict, confidence = compute_final_score(scoring_data)

        # 8. Calculer le temps de traitement
        processing_time_ms: int = int((time.time() - start_time) * 1000)

        # 9. Construire la réponse
        response = _build_response(
            score=score,
            verdict=verdict,
            confidence=confidence,
            processing_time_ms=processing_time_ms,
            filename=filename,
            mime_type=mime_type,
            file_size=file_size,
            country_result=country_result,
            ocr_result=ocr_result,
            classification_result=classification_result,
            signature_result=signature_result,
            stamp_result=stamp_result,
            text_result=text_result,
            tampering_result=tampering_result,
            all_flags=all_flags,
        )

        # 10. Logger le résultat
        log_analysis_result(
            filename=filename,
            country=country_result.country_detected,
            score=score,
            verdict=verdict,
            processing_time_ms=processing_time_ms,
            flags=all_flags,
        )

        return response

    except Exception as e:
        processing_time_ms = int((time.time() - start_time) * 1000)
        logger.error("Erreur fatale lors de l'analyse de %s : %s", filename, e)

        # Retourner une réponse d'erreur minimale
        return VerifyResponse(
            score=100.0,
            verdict="FALSIFIÉ",
            confidence="LOW",
            processing_time_ms=processing_time_ms,
            file_info=FileInfo(
                filename=filename,
                mime_type=mime_type,
                size_bytes=file_size,
            ),
            anomalies=[f"Erreur lors de l'analyse : {str(e)}"],
            all_flags=[f"Erreur fatale : {str(e)}"],
        )


def _build_response(
    *,
    score: float,
    verdict: str,
    confidence: str,
    processing_time_ms: int,
    filename: str,
    mime_type: str,
    file_size: int,
    country_result,
    ocr_result,
    classification_result,
    signature_result,
    stamp_result,
    text_result,
    tampering_result,
    all_flags: list[str],
) -> VerifyResponse:
    """Construit l'objet VerifyResponse à partir de tous les résultats."""

    # Informations fichier
    file_info = FileInfo(
        filename=filename,
        mime_type=mime_type,
        size_bytes=file_size,
    )

    # Données extraites
    fields = ocr_result.extracted_fields
    extracted_data = ExtractedData(
        full_name=fields.get("full_name"),
        first_name=fields.get("first_name"),
        last_name=fields.get("last_name"),
        institution=fields.get("institution"),
        date=fields.get("date"),
        academic_year=fields.get("academic_year"),
        grade=fields.get("grade"),
        speciality=None,
        diploma_type=fields.get("diploma_type"),
    )

    # Signature
    sig_location = None
    if signature_result.location:
        sig_location = SignatureLocation(**signature_result.location)
    signature_check = SignatureCheck(
        detected=signature_result.signature_detected,
        confidence=signature_result.confidence,
        location=sig_location,
    )

    # Cachet
    stp_location = None
    if stamp_result.location:
        stp_location = StampLocation(**stamp_result.location)
    stamp_check = StampCheck(
        detected=stamp_result.stamp_detected,
        confidence=stamp_result.confidence,
        color=stamp_result.stamp_color,
        location=stp_location,
    )

    # Mentions officielles
    official_check = OfficialMentionCheck(
        found=text_result.official_mention_found,
        mentions_detected=text_result.mentions_detected,
    )

    # Tampering
    tampering_check = TamperingCheck(
        detected=tampering_result.tampering_detected,
        score=tampering_result.tampering_score,
        suspicious_regions=tampering_result.ela_suspicious_regions,
    )

    # Cohérence texte
    text_check = TextCoherenceCheck(
        score=text_result.text_coherence_score,
        keywords_ratio=text_result.keywords_ratio,
        ocr_confidence=ocr_result.ocr_confidence,
    )

    # Métadonnées
    meta_info = tampering_result.metadata_info
    metadata_check = MetadataCheck(
        author=meta_info.get("author"),
        creation_date=meta_info.get("creation_date"),
        modification_date=meta_info.get("modification_date"),
        software=meta_info.get("software"),
        flags=tampering_result.metadata_flags,
    )

    checks = Checks(
        signature=signature_check,
        stamp=stamp_check,
        official_mention=official_check,
        tampering=tampering_check,
        text_coherence=text_check,
        metadata=metadata_check,
    )

    # Anomalies = flags critiques
    anomalies: list[str] = [
        f for f in all_flags
        if any(
            kw in f.lower()
            for kw in ["suspect", "incohérent", "futur", "détecté", "absent", "vide"]
        )
    ]

    return VerifyResponse(
        score=score,
        verdict=verdict,
        confidence=confidence,
        processing_time_ms=processing_time_ms,
        file_info=file_info,
        country_detected=country_result.country_detected,
        country_confidence=country_result.confidence,
        language_detected=ocr_result.language_detected,
        is_diploma=classification_result.is_diploma,
        diploma_type=classification_result.detected_type
        if classification_result.detected_type != "unknown"
        else text_result.diploma_type
        if text_result.diploma_type != "unknown"
        else None,
        extracted_data=extracted_data,
        checks=checks,
        anomalies=anomalies,
        all_flags=all_flags,
    )
