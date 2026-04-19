"""
Modèles Pydantic pour les réponses de l'API.
Scoring inversé : 0 = authentique, 100 = falsifié.
"""

from pydantic import BaseModel, Field


# --- Sous-modèles pour la section "checks" ---

class SignatureLocation(BaseModel):
    """Coordonnées de la zone de signature détectée."""
    x: int = 0
    y: int = 0
    w: int = 0
    h: int = 0


class SignatureCheck(BaseModel):
    """Résultat de la détection de signature."""
    detected: bool = False
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    location: SignatureLocation | None = None


class StampLocation(BaseModel):
    """Coordonnées du cachet détecté."""
    x: int = 0
    y: int = 0
    radius: int = 0


class StampCheck(BaseModel):
    """Résultat de la détection de cachet."""
    detected: bool = False
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    color: str = "inconnu"
    location: StampLocation | None = None


class OfficialMentionCheck(BaseModel):
    """Résultat de la vérification des mentions officielles."""
    found: bool = False
    mentions_detected: list[str] = Field(default_factory=list)


class TamperingCheck(BaseModel):
    """Résultat de la détection de falsification."""
    detected: bool = False
    score: float = Field(default=0.0, ge=0.0, le=1.0)
    suspicious_regions: int = 0


class TextCoherenceCheck(BaseModel):
    """Résultat de l'analyse de cohérence textuelle."""
    score: float = Field(default=0.0, ge=0.0, le=1.0)
    keywords_ratio: float = Field(default=0.0, ge=0.0, le=1.0)
    ocr_confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class MetadataCheck(BaseModel):
    """Métadonnées extraites du document."""
    author: str | None = None
    creation_date: str | None = None
    modification_date: str | None = None
    software: str | None = None
    flags: list[str] = Field(default_factory=list)


class Checks(BaseModel):
    """Regroupement de toutes les vérifications effectuées."""
    signature: SignatureCheck = Field(default_factory=SignatureCheck)
    stamp: StampCheck = Field(default_factory=StampCheck)
    official_mention: OfficialMentionCheck = Field(default_factory=OfficialMentionCheck)
    tampering: TamperingCheck = Field(default_factory=TamperingCheck)
    text_coherence: TextCoherenceCheck = Field(default_factory=TextCoherenceCheck)
    metadata: MetadataCheck = Field(default_factory=MetadataCheck)


# --- Sous-modèle pour les informations du fichier ---

class FileInfo(BaseModel):
    """Informations sur le fichier analysé."""
    filename: str = ""
    mime_type: str = ""
    size_bytes: int = 0


# --- Sous-modèle pour les données extraites ---

class ExtractedData(BaseModel):
    """Données extraites du diplôme par OCR et NLP."""
    full_name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    institution: str | None = None
    date: str | None = None
    academic_year: str | None = None
    grade: str | None = None
    speciality: str | None = None
    diploma_type: str | None = None


# --- Réponse principale ---

class VerifyResponse(BaseModel):
    """Réponse complète de l'analyse d'un diplôme."""
    score: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Score de suspicion (0 = authentique, 100 = falsifié)",
    )
    verdict: str = Field(
        default="SUSPECT",
        description="AUTHENTIQUE | SUSPECT | FALSIFIÉ",
    )
    confidence: str = Field(
        default="LOW",
        description="HIGH | MEDIUM | LOW",
    )
    processing_time_ms: int = 0

    file_info: FileInfo = Field(default_factory=FileInfo)

    country_detected: str = "Unknown"
    country_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    language_detected: str = "unknown"

    is_diploma: bool = False
    diploma_type: str | None = None

    extracted_data: ExtractedData = Field(default_factory=ExtractedData)

    checks: Checks = Field(default_factory=Checks)

    anomalies: list[str] = Field(default_factory=list)
    all_flags: list[str] = Field(default_factory=list)


# --- Réponses utilitaires ---

class HealthResponse(BaseModel):
    """Réponse du endpoint de santé."""
    status: str = "ok"
    version: str = "1.0.0"
    tesseract_available: bool = False
    spacy_models_loaded: bool = False


class InfoResponse(BaseModel):
    """Description du service."""
    name: str = "Diploma Verifier API"
    version: str = "1.0.0"
    description: str = (
        "Microservice universel de vérification d'authenticité "
        "des diplômes — tous pays"
    )
    scoring: str = "Inversé : 0 = authentique, 100 = falsifié"
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
