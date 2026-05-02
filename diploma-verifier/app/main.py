"""
Point d'entrée du microservice Diploma Verifier v2.
Initialise FastAPI, charge les modèles et configure les middlewares.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.verify import router as verify_router
from app.config import LOG_DIR
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Événements de démarrage et d'arrêt du service."""
    # --- Startup ---
    logger.info("Démarrage du service Diploma Verifier v2...")

    # Créer le dossier de logs
    os.makedirs(LOG_DIR, exist_ok=True)

    # Vérifier Tesseract
    try:
        import pytesseract
        import sys
        if sys.platform.startswith("win"):
            if pytesseract.pytesseract.tesseract_cmd == 'tesseract':
                pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        version = pytesseract.get_tesseract_version()
        logger.info("Tesseract trouvé (version %s)", version)
    except Exception as e:
        logger.warning(
            "Tesseract non trouvé ou non configuré. "
            "L'OCR ne fonctionnera pas correctement."
        )

    # Charger les modèles spaCy une seule fois
    try:
        from app.services.ocr_service import load_spacy_models
        load_spacy_models()
        logger.info("Modèles spaCy chargés avec succès")
    except Exception as e:
        logger.warning("Impossible de charger les modèles spaCy : %s", e)

    logger.info("Service démarré — prêt à recevoir des requêtes")

    yield

    # --- Shutdown ---
    logger.info("Service arrêté")


# --- Application FastAPI ---

app = FastAPI(
    title="Diploma Verifier API",
    description=(
        "Microservice de vérification d'authenticité "
        "des diplômes — approche probabiliste par règles. "
        "Retourne : {score, confidence_level, reasons}."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# --- Middleware CORS (ouvert pour le développement) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Router principal ---
app.include_router(verify_router)


# --- Gestionnaire d'erreurs global ---

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Capture toutes les exceptions non gérées et les logue."""
    logger.error(
        "Erreur non gérée sur %s %s : %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Erreur interne du serveur."
        },
    )
