"""
Modèles Pydantic pour les requêtes entrantes.
"""

from pydantic import BaseModel, Field


class VerifyRequest(BaseModel):
    """Paramètres optionnels accompagnant l'upload du fichier."""

    country_hint: str | None = Field(
        default=None,
        description="Indice optionnel du pays d'origine pour aider la détection.",
        examples=["France", "Tunisia", "USA"],
    )
