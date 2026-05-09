"""
Configuration globale du microservice de vérification de diplômes.
Toutes les constantes, seuils et dictionnaires de référence sont centralisés ici.
"""

# --- Contraintes fichier ---
MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10 Mo
ALLOWED_MIME_TYPES: list[str] = ["application/pdf", "image/jpeg", "image/png"]
ALLOWED_EXTENSIONS: list[str] = [".pdf", ".jpg", ".jpeg", ".png"]

# --- Poids et seuils de scoring gérés dans scoring_engine.py ---

# --- Mots-clés universels de diplômes (multi-langues) ---
DIPLOMA_KEYWORDS: dict[str, list[str]] = {
    "fr": [
        "diplôme", "licence", "master", "doctorat",
        "ingénieur", "certificat", "attestation",
        "université", "ministère", "certifie", "attestons",
        "mention", "année universitaire", "faculté",
        "baccalauréat", "brevet",
    ],
    "en": [
        "diploma", "degree", "bachelor", "master",
        "certificate", "university", "awarded",
        "conferred", "board of trustees", "registrar",
        "cum laude", "honors", "faculty", "dean",
        "graduation", "academic year",
    ],
    "ar": [
        "شهادة", "جامعة", "ليسانس", "ماستر",
        "دكتوراه", "كلية", "وزارة",
        "التعليم العالي", "الجمهورية",
        "دبلوم", "بكالوريوس", "معهد",
    ],
    "es": [
        "diploma", "título", "licenciatura", "máster",
        "universidad", "certificado", "ministerio",
        "educación", "bachiller", "facultad",
        "otorga", "registrar",
    ],
    "de": [
        "diplom", "urkunde", "zeugnis", "universität",
        "bachelor", "master", "fakultät", "hochschule",
        "ministerium", "prüfungsamt", "doktorgrad",
    ],
}

# --- Mentions officielles par pattern de pays ---
# V6: ajout de variantes Arabic plus permissives — Tesseract 5.5
# rate parfois التعليم qui suit وزارة (espacement variable).
# Les variantes \s+\w+ matchent toute mention "وزارة X" ou
# "الجمهورية Y" même si le suffixe spécifique n'est pas reconnu.
OFFICIAL_PATTERNS: dict[str, list[str]] = {
    "republic": [
        r"r[ée]publique\s+\w+",
        r"republic\s+of\s+\w+",
        r"rep[úu]blica\s+\w+",
        r"الجمهورية\s+\w+",
        r"republik\s+\w+",
        r"repubblica\s+\w+",
    ],
    "kingdom": [
        r"royaume\s+\w+",
        r"kingdom\s+of\s+\w+",
        r"المملكة\s+\w+",
    ],
    "ministry": [
        r"minist[èeé]re\s+.*(?:éducation|enseignement)",
        r"ministry\s+of\s+.*education",
        r"وزارة\s+.*التعليم",
        r"وزارة\s+\w+",         # V6: permissif pour OCR Tesseract 5.5
        r"الجمهورية\s+\w+",      # V6: permissif (variante du republic)
        r"ministerio\s+de\s+.*educaci[óo]n",
        r"ministerium\s+.*bildung",
    ],
}

# --- Types de diplômes reconnus (universel) ---
DIPLOMA_TYPES: dict[str, list[str]] = {
    "fr": [
        "licence", "licence fondamentale",
        "licence appliquée", "licence professionnelle",
        "master", "master professionnel",
        "master de recherche", "ingénieur",
        "doctorat", "brevet de technicien supérieur",
        "bts", "dut", "deug", "baccalauréat",
    ],
    "en": [
        "bachelor of science", "bachelor of arts",
        "master of science", "master of arts",
        "master of business administration", "mba",
        "doctor of philosophy", "phd",
        "associate degree", "high school diploma",
        "certificate", "postgraduate diploma",
    ],
    "ar": [
        "ليسانس", "ماستر", "ماجستير",
        "دكتوراه", "بكالوريوس", "دبلوم",
        "شهادة التخرج", "شهادة", "إجازة",
    ],
    "es": [
        "licenciatura", "grado", "máster",
        "doctorado", "bachiller", "diplomatura",
        "título profesional",
    ],
    "de": [
        "bachelor", "master", "diplom",
        "doktor", "staatsexamen", "magister",
        "abitur", "gesellenbrief",
    ],
}

# --- Langues OCR supportées ---
OCR_LANGUAGES: str = "fra+eng+ara+spa+deu"


# --- Logging ---
LOG_DIR: str = "logs"
LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# --- Résolution de conversion PDF → image ---
PDF_DPI: int = 300

# --- Taille maximale d'image pour le traitement (pixels, côté le plus long) ---
MAX_IMAGE_DIMENSION: int = 4000


# ──────────────────────────────────────────────
# V7 — Critical Fields Validation
# ──────────────────────────────────────────────
# Pondération du score critical_fields (somme = 1.0).
CRITICAL_FIELDS_WEIGHTS: dict[str, float] = {
    "first_name":     0.25,
    "last_name":      0.25,
    "degree":         0.20,
    "date":           0.15,
    "institution":    0.10,
    "specialization": 0.05,
}

# Plafond appliqué quand le doc ressemble à un template officiel
# (mots-clés diplôme présents) MAIS sans identité ni date.
CRITICAL_FIELDS_TEMPLATE_CAP: int = 20

# Plafond appliqué au score final si critical_fields_score < 30.
CRITICAL_FIELDS_LOW_CAP: int = 45

# Seuil critical_fields en dessous duquel on cap le score final.
CRITICAL_FIELDS_LOW_THRESHOLD: int = 30

# Tolérance OCR : si ocr_confidence < OCR_LOW_CONFIDENCE_THRESHOLD,
# les pénalités de champ manquant sont multipliées par OCR_PENALTY_MULTIPLIER.
OCR_LOW_CONFIDENCE_THRESHOLD: float = 0.40
OCR_PENALTY_MULTIPLIER: float = 0.5


# ──────────────────────────────────────────────
# V7 — Tampering Detection
# ──────────────────────────────────────────────
# Active le détecteur de tampering dans le pipeline.
TAMPERING_ENABLED: bool = True

# Seuil de fraud_score (0–100) en-dessous duquel aucune pénalité n'est
# appliquée au score final.
TAMPERING_PENALTY_THRESHOLD: int = 60

# Facteur de pénalité : penalty_points = fraud_score * factor.
TAMPERING_PENALTY_FACTOR: float = 0.3

# Pénalité maximum (en points) appliquée au score final.
TAMPERING_MAX_PENALTY: int = 30

# Plafond appliqué si fraud_score > TAMPERING_HARD_CAP_THRESHOLD.
TAMPERING_HARD_CAP_THRESHOLD: int = 80
TAMPERING_HARD_CAP_SCORE: int = 35

# Seuil sur diploma_confidence pour activer le tampering detector
# (gating : on n'analyse que les documents qui ressemblent à un diplôme).
TAMPERING_GATE_DIPLOMA_CONFIDENCE: float = 0.2


# ──────────────────────────────────────────────
# V7 — Mots-clés de spécialisation (multi-langues)
# ──────────────────────────────────────────────
SPECIALIZATION_KEYWORDS: list[str] = [
    # Français
    "informatique", "génie civil", "génie mécanique", "génie électrique",
    "télécommunications", "réseaux", "logiciel", "industriel",
    "mathématiques", "physique", "chimie", "biologie", "médecine",
    "pharmacie", "droit", "économie", "gestion", "finance", "marketing",
    "comptabilité", "ressources humaines", "architecture",
    # English
    "computer science", "civil engineering", "mechanical engineering",
    "electrical engineering", "software engineering", "telecommunications",
    "mathematics", "physics", "chemistry", "biology", "medicine",
    "law", "economics", "management", "finance", "marketing",
    "accounting", "architecture", "data science", "artificial intelligence",
    # Arabic
    "إعلامية", "هندسة مدنية", "هندسة كهربائية", "هندسة ميكانيكية",
    "اتصالات", "طب", "صيدلة", "حقوق", "اقتصاد", "إدارة",
]
