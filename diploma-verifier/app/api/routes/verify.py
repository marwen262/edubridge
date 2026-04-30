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
    VerifyResponse,
)
from app.services.country_detector import COUNTRY_PATTERNS
from app.services.orchestrator import analyze_document
from app.utils.file_handler import cleanup_temp_file, validate_and_save
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
