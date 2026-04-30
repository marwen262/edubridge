"""
Modèles Pydantic pour les réponses de l'API.

Format de sortie strict pour /api/verify :
  - score: float (3–98)
  - confidence_level: "low" | "medium" | "high"
  - reasons: list[str]  (max 5, human-readable)
"""

from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
# Réponse principale de vérification (STRICT)
# ──────────────────────────────────────────────

class VerifyResponse(BaseModel):
    """Réponse de vérification – format strict, sans champs internes."""

    score: float = Field(
        default=15.0,
        ge=3.0,
        le=98.0,
        description="Score de confiance (3 = très peu fiable, 98 = très fiable)",
    )
    confidence_level: str = Field(
        default="low",
        description="low | medium | high",
    )
    reasons: list[str] = Field(
        default_factory=list,
        description="Raisons courtes, max 5",
    )


# ──────────────────────────────────────────────
# Réponses utilitaires (inchangées)
# ──────────────────────────────────────────────

class HealthResponse(BaseModel):
    """Réponse du endpoint de santé."""
    status: str = "ok"
    version: str = "2.0.0"
    tesseract_available: bool = False
    spacy_models_loaded: bool = False


class InfoResponse(BaseModel):
    """Description du service."""
    name: str = "Diploma Verifier API"
    version: str = "2.0.0"
    description: str = (
        "Microservice de vérification d'authenticité "
        "des diplômes – approche probabiliste par règles"
    )
    scoring: str = "Probabiliste : 3 = très faible confiance, 98 = très haute confiance"
    supported_formats: list[str] = Field(
        default_factory=lambda: ["PDF", "JPEG", "PNG"]
    )
    supported_languages: list[str] = Field(
        default_factory=lambda: ["Français", "Anglais", "Arabe", "Espagnol", "Allemand"]
    )


class SupportedCountry(BaseModel):
    """Pays supporté avec ses langues associées."""
    country: str
    languages: list[str]


class SupportedCountriesResponse(BaseModel):
    """Liste des pays supportés."""
    count: int = 0
    countries: list[SupportedCountry] = Field(default_factory=list)
