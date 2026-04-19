FROM python:3.11-slim

# Installer tesseract + langues + dépendances système
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-fra \
    tesseract-ocr-ara \
    tesseract-ocr-eng \
    tesseract-ocr-spa \
    tesseract-ocr-deu \
    libmagic1 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Télécharger les modèles spaCy
RUN python -m spacy download fr_core_news_sm
RUN python -m spacy download xx_ent_wiki_sm

# Copier le code source
COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p logs sample_docs/authentic sample_docs/fake

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
