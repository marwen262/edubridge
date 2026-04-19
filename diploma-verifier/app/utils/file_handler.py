"""
Gestion des fichiers uploadés : validation MIME, extension, taille,
sauvegarde temporaire et nettoyage.
"""

import os
import tempfile
import uuid

import magic

from app.config import ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE
from app.utils.logger import logger


def validate_mime_type(file_content: bytes) -> str:
    """Vérifie le vrai type MIME du fichier via libmagic.

    Retourne le type MIME détecté.
    Lève ValueError si le type n'est pas autorisé.
    """
    mime = magic.Magic(mime=True)
    detected_mime: str = mime.from_buffer(file_content)
    logger.debug("Type MIME détecté : %s", detected_mime)

    if detected_mime not in ALLOWED_MIME_TYPES:
        raise ValueError(
            f"Type MIME non autorisé : {detected_mime}. "
            f"Types acceptés : {ALLOWED_MIME_TYPES}"
        )
    return detected_mime


def validate_extension(filename: str) -> str:
    """Vérifie que l'extension du fichier est autorisée.

    Retourne l'extension en minuscules.
    Lève ValueError si l'extension n'est pas autorisée.
    """
    ext: str = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Extension non autorisée : {ext}. "
            f"Extensions acceptées : {ALLOWED_EXTENSIONS}"
        )
    return ext


def validate_file_size(content: bytes) -> int:
    """Vérifie que le fichier ne dépasse pas la taille maximale.

    Retourne la taille en octets.
    Lève ValueError si le fichier est trop volumineux.
    """
    size: int = len(content)
    if size > MAX_FILE_SIZE:
        raise ValueError(
            f"Fichier trop volumineux : {size} octets "
            f"(maximum : {MAX_FILE_SIZE} octets)"
        )
    if size == 0:
        raise ValueError("Le fichier est vide.")
    return size


def save_temp_file(content: bytes, extension: str) -> str:
    """Sauvegarde le contenu dans un fichier temporaire.

    Retourne le chemin absolu du fichier temporaire.
    """
    unique_name: str = f"diploma_{uuid.uuid4().hex}{extension}"
    temp_path: str = os.path.join(tempfile.gettempdir(), unique_name)

    with open(temp_path, "wb") as f:
        f.write(content)

    logger.debug("Fichier temporaire créé : %s", temp_path)
    return temp_path


def cleanup_temp_file(file_path: str) -> None:
    """Supprime un fichier temporaire après traitement."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.debug("Fichier temporaire supprimé : %s", file_path)
    except OSError as e:
        logger.warning("Impossible de supprimer %s : %s", file_path, e)


def validate_and_save(filename: str, content: bytes) -> tuple[str, str, int]:
    """Pipeline complet de validation et sauvegarde d'un fichier uploadé.

    Retourne (chemin_temporaire, type_mime, taille_octets).
    Lève ValueError en cas de problème de validation.
    """
    logger.info("Validation du fichier : %s", filename)

    # Étape 1 : vérifier la taille
    size: int = validate_file_size(content)

    # Étape 2 : vérifier l'extension
    extension: str = validate_extension(filename)

    # Étape 3 : vérifier le type MIME réel
    mime_type: str = validate_mime_type(content)

    # Étape 4 : sauvegarder temporairement
    temp_path: str = save_temp_file(content, extension)

    logger.info(
        "Fichier validé — mime=%s | taille=%d octets | chemin=%s",
        mime_type,
        size,
        temp_path,
    )
    return temp_path, mime_type, size
