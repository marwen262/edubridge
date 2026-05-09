"""
Modèles Pydantic pour les réponses de l'API.

Format de sortie pour /api/verify :
  - score: float (3–98)              ← V6 backward compatible
  - confidence_level: "low" | "medium" | "high"
  - reasons: list[str]  (max 5, human-readable)
  - v7: VerifyResponseV7Detail | None ← payload V7 additif (optionnel)
"""

from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
# V7 — Sous-modèles explicables (additifs)
# ──────────────────────────────────────────────

class V7Subscores(BaseModel):
    """Sous-scores indépendants exposés par le pipeline V7.

    En Phase 1, certains de ces sous-scores sont dérivés des signaux V6
    existants plutôt que calculés indépendamment. Ils deviennent
    pleinement indépendants en Phase 2.
    """
    structure_score: int = Field(default=0, ge=0, le=100)
    semantic_score: int = Field(default=0, ge=0, le=100)
    critical_fields_score: int = Field(default=0, ge=0, le=100)
    visual_authenticity_score: int = Field(default=0, ge=0, le=100)
    fraud_score: int = Field(default=0, ge=0, le=100)
    ocr_confidence_score: int = Field(default=0, ge=0, le=100)


class V7TamperingDetail(BaseModel):
    """Détail du module de détection de falsification."""
    ran: bool = False
    fraud_score: int = Field(default=0, ge=0, le=100)
    signals: list[dict] = Field(default_factory=list)


class V7Reason(BaseModel):
    """Raison explicable, attribuée à une couche d'analyse."""
    layer: str
    signal: str
    impact: str = "medium"  # "high" | "medium" | "low"


class VerifyResponseV7Detail(BaseModel):
    """Payload V7 additif — ignoré par les consommateurs V6."""
    document_type: str = "unknown"        # "diploma" | "certificate" | "unknown"
    global_trust_score: int = Field(default=0, ge=0, le=100)
    risk_level: str = "highly_suspicious"
    subscores: V7Subscores = Field(default_factory=V7Subscores)
    field_confidence: dict[str, int] = Field(default_factory=dict)
    tampering: V7TamperingDetail = Field(default_factory=V7TamperingDetail)
    reasons: list[V7Reason] = Field(default_factory=list)


# ──────────────────────────────────────────────
# Réponse principale de vérification
# ──────────────────────────────────────────────

class VerifyResponse(BaseModel):
    """Réponse de vérification — V6 backward compatible + champ v7 optionnel."""

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
    v7: VerifyResponseV7Detail | None = Field(
        default=None,
        description="Payload V7 additif (sous-scores, tampering, reasons explicables). "
                    "Optionnel — les consommateurs V6 peuvent l'ignorer.",
    )


# ──────────────────────────────────────────────
# Debug — diagnostic non-public
# ──────────────────────────────────────────────

class VerifyDebugResponse(BaseModel):
    """Réponse de l'endpoint debug — expose l'état interne du pipeline.

    Attention : cet endpoint est destiné au diagnostic V7 uniquement.
    Ne pas exposer en production sans gating.
    """
    filename: str
    raw_text: str = Field(description="Texte OCR brut (best pass)")
    raw_text_len: int = 0
    ocr_confidence: float = 0.0
    language_detected: str = "unknown"

    # Détection de nom : ce qui a été trouvé et par quel moyen
    detected_name: str | None = None
    name_source: str = "none"  # spacy | regex_latin | regex_arabic | none
    has_person_name: bool = False

    # Autres signaux text_analyzer
    has_institution: bool = False
    has_degree_keyword: bool = False
    detected_degree: str | None = None
    has_date: bool = False
    structure_count: int = 0
    semantic_score: float = 0.0
    diploma_confidence: float = 0.0
    doc_type: str = "unknown"

    # Critical fields V7 — score complet du validator
    critical_fields_score: int = 0
    critical_fields_per_field: dict[str, int] = Field(default_factory=dict)
    is_template_without_identity: bool = False

    # Visual signals
    signature_confidence: float = 0.0
    stamp_confidence: float = 0.0


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
