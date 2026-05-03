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
