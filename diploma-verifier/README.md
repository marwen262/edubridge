# Diploma Verifier

Microservice **universel** de vérification d'authenticité de diplômes — **tous pays**.
100 % local, aucune API externe.

Ce service analyse un PDF ou une image (JPEG/PNG) représentant un diplôme et
détermine s'il est authentique, suspect ou falsifié via une batterie
d'analyses : OCR multi-langues, détection de signature et de cachet,
vérification des mentions officielles, analyse de cohérence textuelle,
détection de falsification (ELA, copier-coller, métadonnées) et classification.

## Architecture

```
Upload → Validation → Conversion → Prétraitement
   ↓
OCR (Tesseract multi-langues)
   ↓
Détection de pays (patterns + langue)
   ↓
Analyses parallèles :
  • Signature (OpenCV — contours)
  • Cachet (OpenCV — Hough, HSV)
  • Texte (regex + spaCy NLP)
  • Falsification (ELA + métadonnées PDF)
  • Classification diplôme (règles)
   ↓
Scoring inversé (0 = authentique, 100 = falsifié)
   ↓
Réponse JSON complète
```

## Scoring INVERSÉ

| Score | Verdict |
|-------|---------|
| 0 → 20 | AUTHENTIQUE |
| 21 → 50 | SUSPECT |
| 51 → 100 | FALSIFIÉ |

- 0 = document très fiable
- 100 = document très suspect

## Pays supportés

Tunisia, Algeria, Morocco, France, USA, UK, Germany, Spain, Egypt,
Saudi Arabia, Lebanon, Canada, Italy, China, Japan, India, Brazil,
Turkey, Libya, Jordan, Iraq, UAE, Senegal, Ivory Coast, Cameroon.

Pour la liste complète et à jour :
```
GET /api/supported-countries
```

## Langues supportées

- Français (`fr`)
- Anglais (`en`)
- Arabe (`ar`)
- Espagnol (`es`)
- Allemand (`de`)

## Prérequis

- Python 3.11+
- Tesseract OCR (avec packs fra, eng, ara, spa, deu)
- Poppler (pour `pdf2image`)
- libmagic (pour `python-magic`)

## Installation locale (sans Docker)

```bash
# 1. Installer les paquets système (Debian/Ubuntu)
sudo apt install tesseract-ocr tesseract-ocr-fra tesseract-ocr-ara \
    tesseract-ocr-eng tesseract-ocr-spa tesseract-ocr-deu \
    libmagic1 poppler-utils

# 2. Installer les dépendances Python
pip install -r requirements.txt

# 3. Télécharger les modèles spaCy
python -m spacy download fr_core_news_sm
python -m spacy download xx_ent_wiki_sm

# 4. Lancer le serveur
uvicorn app.main:app --reload
```

Le service est disponible sur http://localhost:8000.
Documentation interactive : http://localhost:8000/docs.

## Installation avec Docker

```bash
docker-compose up --build
```

## Exemples de requêtes

### Sans indice de pays (détection automatique)
```bash
curl -X POST http://localhost:8000/api/verify \
  -F "file=@diploma.pdf"
```

### Avec indice de pays
```bash
curl -X POST http://localhost:8000/api/verify \
  -F "file=@diploma.pdf" \
  -F "country_hint=France"
```

### Vérifier la santé du service
```bash
curl http://localhost:8000/api/health
```

### Obtenir la liste des pays supportés
```bash
curl http://localhost:8000/api/supported-countries
```

## Exemple de réponse

```json
{
  "score": 23.5,
  "verdict": "SUSPECT",
  "confidence": "MEDIUM",
  "processing_time_ms": 1856,
  "file_info": {
    "filename": "diploma.pdf",
    "mime_type": "application/pdf",
    "size_bytes": 512000
  },
  "country_detected": "France",
  "country_confidence": 0.92,
  "language_detected": "fr",
  "is_diploma": true,
  "diploma_type": "Master",
  "extracted_data": {
    "full_name": "Jean Dupont",
    "first_name": "Jean",
    "last_name": "Dupont",
    "institution": "Université Paris-Saclay",
    "date": "15/06/2023",
    "academic_year": "2022/2023",
    "grade": "Bien",
    "speciality": null,
    "diploma_type": "Master"
  },
  "checks": {
    "signature": { "detected": true, "confidence": 0.85, "location": {"x":120,"y":800,"w":200,"h":80} },
    "stamp": { "detected": true, "confidence": 0.92, "color": "bleu", "location": {"x":400,"y":750,"radius":60} },
    "official_mention": {
      "found": true,
      "mentions_detected": ["République Française", "Ministère de l'Enseignement Supérieur"]
    },
    "tampering": { "detected": false, "score": 0.12, "suspicious_regions": 0 },
    "text_coherence": { "score": 0.88, "keywords_ratio": 0.75, "ocr_confidence": 0.91 },
    "metadata": {
      "author": "Microsoft Word",
      "creation_date": "2023-07-10",
      "modification_date": "2023-07-10",
      "software": "Microsoft Word",
      "flags": []
    }
  },
  "anomalies": [],
  "all_flags": []
}
```

## Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/verify` | Analyse un diplôme (PDF/JPEG/PNG) |
| GET | `/api/health` | Santé du service + dépendances |
| GET | `/api/info` | Description du service |
| GET | `/api/supported-countries` | Liste des pays supportés |
| GET | `/docs` | Swagger UI (auto-généré) |

## Flags possibles (liste non exhaustive)

- `Aucun texte extrait par l'OCR`
- `Confiance OCR très basse : X.XX`
- `Date dans le futur détectée : ...`
- `Date antérieure à 1900 : ...`
- `Année académique incohérente : ...`
- `Aucun contour de signature détecté`
- `Aucun cachet circulaire/ovale détecté`
- `ELA : N régions suspectes détectées`
- `Possible copier-coller détecté (score=X.XX)`
- `Fond non uniforme (écart-type=X.X)`
- `Logiciel d'édition d'image détecté : ...`
- `Date de modification antérieure à la date de création`
- `Métadonnées PDF vides (auteur et logiciel absents)`
- `Document probablement pas un diplôme (confiance=X.XX)`

## Ajouter un nouveau pays

Éditer [app/services/country_detector.py](app/services/country_detector.py) et
ajouter une entrée dans `COUNTRY_PATTERNS` :

```python
COUNTRY_PATTERNS = {
    # ...
    "MonPays": {
        "patterns": [
            r"motif\s+regex\s+1",
            r"motif\s+regex\s+2",
        ],
        "languages": ["fr", "en"],
    },
}
```

Si le pays utilise une langue non encore supportée, ajouter également :
1. Les mots-clés de diplôme dans `DIPLOMA_KEYWORDS` de [app/config.py](app/config.py)
2. Les types de diplômes dans `DIPLOMA_TYPES`
3. Le pack Tesseract dans [Dockerfile](Dockerfile)
4. Mettre à jour `OCR_LANGUAGES` dans la config

## Tests

```bash
pytest tests/ -v
```

Couverture par module :
- `test_ocr.py` — extraction texte et champs
- `test_signature.py` — détection de signature
- `test_stamp.py` — détection de cachet
- `test_text.py` — analyse textuelle
- `test_tampering.py` — détection de falsification
- `test_classifier.py` — classification diplôme
- `test_country.py` — détection de pays
- `test_scoring.py` — moteur de scoring

## Structure du projet

```
diploma-verifier/
├── app/
│   ├── main.py               # Point d'entrée FastAPI
│   ├── config.py             # Constantes globales
│   ├── api/routes/verify.py  # Endpoints REST
│   ├── services/             # Logique métier (10 services)
│   ├── models/               # Schémas Pydantic
│   └── utils/                # Logger, file handler, image converter
├── tests/                    # Tests pytest
├── sample_docs/              # Exemples de diplômes
├── logs/                     # Logs rotatifs
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## Limitations connues

- La détection de signature et cachet est sensible à la qualité de l'image
  (privilégier ≥ 300 DPI).
- Les PDF multi-pages sont analysés sur la première page uniquement.
- La détection de langue nécessite un texte d'au moins 20 caractères.
- L'ELA est plus efficace sur les JPEG que sur les PNG ou les PDF vectoriels.

## Licence

Projet académique — PFE (Projet de Fin d'Études).
