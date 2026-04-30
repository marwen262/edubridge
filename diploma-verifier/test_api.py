"""
API de test simple pour le Diploma Verifier.
Teste le moteur de scoring sans dépendances lourdes (Tesseract, spaCy, etc.)

Usage:
    pip install fastapi uvicorn python-multipart
    python test_api.py

Endpoints:
    POST /api/test-score    — Scoring à partir de paramètres manuels
    POST /api/test-upload   — Upload d'un fichier (simulation d'analyse)
    GET  /                  — Page web de test
    GET  /api/health        — Santé du service
"""

from __future__ import annotations

import time
import random
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

# --- Import du scoring engine existant ---
from app.services.scoring_engine import compute_final_score

app = FastAPI(title="Diploma Verifier — Test API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# 1) POST /api/test-score — scoring manuel
# ─────────────────────────────────────────────
@app.post("/api/test-score")
async def test_score(
    is_diploma: bool = Form(True),
    signature_detected: bool = Form(True),
    stamp_detected: bool = Form(True),
    official_mention_found: bool = Form(True),
    text_coherence_score: float = Form(0.85),
    tampering_score: float = Form(0.1),
    metadata_suspicion: float = Form(0.0),
    flag_count: int = Form(0),
):
    """Calcule le score à partir de paramètres fournis manuellement."""
    start = time.time()

    flags = [f"flag_{i}" for i in range(flag_count)]

    scoring_data = {
        "is_diploma": is_diploma,
        "signature_detected": signature_detected,
        "stamp_detected": stamp_detected,
        "official_mention_found": official_mention_found,
        "text_coherence_score": text_coherence_score,
        "tampering_score": tampering_score,
        "metadata_suspicion": metadata_suspicion,
        "all_flags": flags,
    }

    score, verdict, confidence = compute_final_score(scoring_data)
    ms = int((time.time() - start) * 1000)

    return {
        "score": score,
        "verdict": verdict,
        "confidence": confidence,
        "processing_time_ms": ms,
        "input": scoring_data,
    }


# ─────────────────────────────────────────────
# 2) POST /api/test-upload — upload simulé
# ─────────────────────────────────────────────
@app.post("/api/test-upload")
async def test_upload(
    file: UploadFile = File(...),
    country_hint: str | None = Form(None),
):
    """Simule l'analyse d'un diplôme uploadé (sans OCR réel).
    Génère des résultats aléatoires réalistes pour tester le scoring.
    """
    start = time.time()
    content = await file.read()
    file_size = len(content)
    filename = file.filename or "unknown"

    # Simulation réaliste
    is_diploma = random.random() > 0.1
    sig = random.random() > 0.3
    stamp = random.random() > 0.3
    mention = random.random() > 0.2
    coherence = round(random.uniform(0.5, 1.0), 2)
    tampering = round(random.uniform(0.0, 0.4), 2)
    meta_susp = round(random.uniform(0.0, 0.3), 2)

    flag_list = []
    if not sig:
        flag_list.append("Aucun contour de signature détecté")
    if not stamp:
        flag_list.append("Aucun cachet circulaire/ovale détecté")
    if coherence < 0.6:
        flag_list.append(f"Confiance OCR très basse : {coherence}")
    if tampering > 0.25:
        flag_list.append(f"ELA : {random.randint(1,5)} régions suspectes détectées")

    scoring_data = {
        "is_diploma": is_diploma,
        "signature_detected": sig,
        "stamp_detected": stamp,
        "official_mention_found": mention,
        "text_coherence_score": coherence,
        "tampering_score": tampering,
        "metadata_suspicion": meta_susp,
        "all_flags": flag_list,
    }

    score, verdict, confidence = compute_final_score(scoring_data)
    ms = int((time.time() - start) * 1000)

    return {
        "score": score,
        "verdict": verdict,
        "confidence": confidence,
        "processing_time_ms": ms,
        "file_info": {
            "filename": filename,
            "size_bytes": file_size,
            "country_hint": country_hint,
        },
        "simulated_checks": {
            "is_diploma": is_diploma,
            "signature_detected": sig,
            "stamp_detected": stamp,
            "official_mention_found": mention,
            "text_coherence_score": coherence,
            "tampering_score": tampering,
            "metadata_suspicion": meta_susp,
        },
        "flags": flag_list,
    }


# ─────────────────────────────────────────────
# 3) GET /api/health
# ─────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "mode": "test", "version": "0.1.0"}


# ─────────────────────────────────────────────
# 4) GET / — Page web de test
# ─────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def test_page():
    html_path = Path(__file__).parent / "test_page.html"
    if html_path.exists():
        return HTMLResponse(html_path.read_text(encoding="utf-8"))
    return HTMLResponse("<h1>test_page.html introuvable</h1>")


# ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("  Diploma Verifier — Test API")
    print("  http://localhost:8000")
    print("  http://localhost:8000/docs")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
