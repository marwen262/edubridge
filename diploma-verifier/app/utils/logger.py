"""
Configuration du système de logging avec rotation de fichiers.
Chaque analyse est loggée avec les détails complets du traitement.
"""

import logging
import os
from logging.handlers import RotatingFileHandler

from app.config import LOG_DIR, LOG_FORMAT


def setup_logger(name: str = "diploma_verifier") -> logging.Logger:
    """Configure et retourne un logger avec rotation de fichiers."""
    logger = logging.getLogger(name)

    # Éviter les doublons de handlers si appelé plusieurs fois
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)

    # Créer le dossier de logs si nécessaire
    os.makedirs(LOG_DIR, exist_ok=True)

    # Handler fichier avec rotation (5 Mo max, 5 fichiers de backup)
    file_handler = RotatingFileHandler(
        filename=os.path.join(LOG_DIR, "diploma_verifier.log"),
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT))

    # Handler console (niveau INFO minimum)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter(LOG_FORMAT))

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger


# Instance globale du logger
logger: logging.Logger = setup_logger()


def log_analysis_result(
    filename: str,
    country: str,
    score: float,
    verdict: str,
    processing_time_ms: float,
    flags: list[str],
) -> None:
    """Enregistre le résultat complet d'une analyse dans les logs."""
    logger.info(
        "Analyse terminée — fichier=%s | pays=%s | score=%.1f | verdict=%s "
        "| durée=%dms | flags=[%s]",
        filename,
        country,
        score,
        verdict,
        processing_time_ms,
        ", ".join(flags) if flags else "aucun",
    )
