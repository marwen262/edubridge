import sys
import os
import shutil

print("--- VERIFICATION DES DEPENDANCES ---")

# 1. Verification des modeles SpaCy
print("\n[SpaCy Models]")
try:
    import spacy
    for model in ["fr_core_news_sm", "xx_ent_wiki_sm"]:
        if spacy.util.is_package(model):
            print(f"OK - Modele spaCy '{model}' installe.")
        else:
            print(f"ERROR - Modele spaCy '{model}' MANQUANT.")
except ImportError:
    print("ERROR - SpaCy n'est pas installe.")

# 2. Verification des langues Tesseract
print("\n[Tesseract Languages]")
try:
    import pytesseract
    if sys.platform.startswith("win"):
        if pytesseract.pytesseract.tesseract_cmd == 'tesseract':
            pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    
    installed_langs = pytesseract.get_languages()
    required_langs = ["fra", "eng", "ara", "spa", "deu"]
    for lang in required_langs:
        if lang in installed_langs:
            print(f"OK - Pack de langue Tesseract '{lang}' installe.")
        else:
            print(f"ERROR - Pack de langue Tesseract '{lang}' MANQUANT.")
except Exception as e:
    print(f"ERROR - Erreur avec Tesseract: {e}")

# 3. Verification de Poppler (pour pdf2image)
print("\n[Poppler (pdf2image)]")
poppler_path = shutil.which("pdftoppm")
if poppler_path:
    print(f"OK - Poppler trouve : {poppler_path}")
else:
    print("ERROR - Poppler (pdftoppm) MANQUANT. Les conversions PDF vers Image risquent d'echouer sur Windows.")

# 4. Verification de libmagic (python-magic)
print("\n[Libmagic]")
try:
    import magic
    magic.from_buffer(b"test")
    print("OK - python-magic fonctionne correctement.")
except Exception as e:
    print(f"ERROR - Erreur avec python-magic: {e}")

print("\n------------------------------------")
