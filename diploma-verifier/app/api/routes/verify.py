"""
Routes de l'API de vérification de diplômes.

Endpoints :
  POST /api/verify   → {score, confidence_level, reasons}
  GET  /api/health
  GET  /api/info
  GET  /api/supported-countries
"""

from __future__ import annotations

import shutil

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.models.response import (
    HealthResponse,
    InfoResponse,
    SupportedCountriesResponse,
    SupportedCountry,
    VerifyDebugResponse,
    VerifyResponse,
)
from app.services.country_detector import COUNTRY_PATTERNS
from app.services.critical_fields_validator import validate_critical_fields
from app.services.ocr_service import extract_text
from app.services.orchestrator import analyze_document
from app.services.signature_detector import detect_signature
from app.services.stamp_detector import detect_stamp
from app.services.text_analyzer import analyze_text
from app.utils.file_handler import cleanup_temp_file, validate_and_save
from app.utils.image_converter import convert_file
from app.utils.logger import logger

router = APIRouter(prefix="/api", tags=["Vérification"])


@router.post("/verify", response_model=VerifyResponse)
async def verify_diploma(
    file: UploadFile = File(..., description="Document à analyser (PDF, JPEG ou PNG)"),
    country_hint: str | None = Form(
        default=None,
        description="Indice optionnel du pays d'origine",
    ),
) -> VerifyResponse:
    """Analyse un diplôme et retourne un rapport concis.

    Accepte un fichier PDF, JPEG ou PNG (max 10 Mo).
    Retourne uniquement : score, confidence_level, reasons.
    """
    temp_path: str | None = None

    try:
        content: bytes = await file.read()
        filename: str = file.filename or "unknown"

        logger.info("Requête de vérification reçue : %s", filename)

        # Valider et sauvegarder temporairement
        temp_path, mime_type, file_size = validate_and_save(filename, content)

        # Lancer l'analyse complète
        response: VerifyResponse = await analyze_document(
            file_path=temp_path,
            mime_type=mime_type,
            filename=filename,
            file_size=file_size,
            country_hint=country_hint,
        )

        return response

    except ValueError as e:
        logger.warning("Validation échouée pour %s : %s", file.filename, e)
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error("Erreur inattendue : %s", e)
        raise HTTPException(
            status_code=500,
            detail="Erreur interne lors de l'analyse.",
        )

    finally:
        if temp_path:
            cleanup_temp_file(temp_path)


@router.post("/verify/debug", response_model=VerifyDebugResponse)
async def verify_diploma_debug(
    file: UploadFile = File(..., description="Document à analyser (PDF, JPEG ou PNG)"),
) -> VerifyDebugResponse:
    """Endpoint de diagnostic V7 — expose l'état interne du pipeline.

    Retourne le texte OCR brut, la source de détection du nom, les scores
    par champ du critical_fields_validator, et les confiances visuelles.

    ⚠️  Endpoint réservé au diagnostic. Ne pas exposer publiquement.
    """
    temp_path: str | None = None

    try:
        content: bytes = await file.read()
        filename: str = file.filename or "unknown"
        logger.info("Debug verify : %s", filename)

        temp_path, mime_type, _ = validate_and_save(filename, content)

        # OCR + signaux visuels (mêmes appels que l'orchestrator)
        _pil, cv_image = convert_file(temp_path, mime_type)
        ocr_result = extract_text(cv_image)
        sig_result = detect_signature(cv_image)
        stamp_result = detect_stamp(cv_image)

        text_result = analyze_text(
            ocr_result.full_text, ocr_result.language_detected,
        )
        cf_result = validate_critical_fields(
            raw_text=ocr_result.full_text,
            analysis_result=text_result,
            ocr_confidence=ocr_result.ocr_confidence,
        )

        return VerifyDebugResponse(
            filename=filename,
            raw_text=ocr_result.full_text,
            raw_text_len=len(ocr_result.full_text),
            ocr_confidence=ocr_result.ocr_confidence,
            language_detected=ocr_result.language_detected,
            detected_name=text_result.detected_name,
            name_source=text_result.name_source,
            has_person_name=text_result.has_person_name,
            has_institution=text_result.has_institution,
            has_degree_keyword=text_result.has_degree_keyword,
            detected_degree=text_result.detected_degree,
            has_date=text_result.has_date,
            structure_count=text_result.structure_count,
            semantic_score=text_result.semantic_score,
            diploma_confidence=text_result.diploma_confidence,
            doc_type=text_result.doc_type,
            critical_fields_score=cf_result.score,
            critical_fields_per_field=cf_result.field_scores,
            is_template_without_identity=cf_result.is_template_without_identity,
            signature_confidence=sig_result.confidence,
            stamp_confidence=stamp_result.confidence,
        )

    except ValueError as e:
        logger.warning("Debug validation échouée pour %s : %s", file.filename, e)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Debug erreur inattendue : %s", e)
        raise HTTPException(status_code=500, detail=f"Erreur debug : {e}")
    finally:
        if temp_path:
            cleanup_temp_file(temp_path)


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Vérifie le statut du service et de ses dépendances."""
    tesseract_ok: bool = False
    spacy_ok: bool = False

    try:
        tesseract_path = shutil.which("tesseract")
        tesseract_ok = tesseract_path is not None
    except Exception:
        pass

    try:
        from app.services.ocr_service import _spacy_fr, _spacy_xx
        spacy_ok = _spacy_fr is not None and _spacy_xx is not None
    except Exception:
        pass

    return HealthResponse(
        status="ok" if (tesseract_ok and spacy_ok) else "degraded",
        version="2.0.0",
        tesseract_available=tesseract_ok,
        spacy_models_loaded=spacy_ok,
    )


@router.get("/info", response_model=InfoResponse)
async def service_info() -> InfoResponse:
    """Retourne la description du service et ses capacités."""
    return InfoResponse()


@router.get("/supported-countries", response_model=SupportedCountriesResponse)
async def supported_countries() -> SupportedCountriesResponse:
    """Retourne la liste des pays supportés avec leurs langues."""
    countries: list[SupportedCountry] = [
        SupportedCountry(country=name, languages=info["languages"])
        for name, info in COUNTRY_PATTERNS.items()
    ]
    return SupportedCountriesResponse(
        count=len(countries),
        countries=countries,
    )
