"""
Moteur de scoring probabiliste et déterministe.

Règles :
  - Score entre 3 et 98 (jamais 0 ni 100).
  - Bruit déterministe (même document → même score).
  - Pas de verdict "fake" / "real" / "authentic".
  - Retourne (score, confidence_level).
"""

from __future__ import annotations

import hashlib
import random

from app.utils.logger import logger


# ──────────────────────────────────────────────
# Poids des critères (total ≈ 1.0)
# ──────────────────────────────────────────────
WEIGHTS: dict[str, float] = {
    "has_person_name":     0.18,
    "has_institution":     0.18,
    "has_degree_keyword":  0.14,
    "has_date":            0.10,
    "signature_confidence": 0.15,
    "stamp_confidence":    0.15,
    "official_mention":    0.10,
}


def _deterministic_noise(text: str, amplitude: float = 5.0) -> float:
    """Génère un bruit déterministe basé sur le hash du texte.

    Le même texte produit toujours le même décalage.
    Plage : [-amplitude, +amplitude].
    """
    digest = hashlib.sha256(text.encode("utf-8", errors="replace")).hexdigest()
    seed = int(digest[:12], 16)
    rng = random.Random(seed)
    return rng.uniform(-amplitude, amplitude)


def _clamp(value: float, lo: float = 3.0, hi: float = 98.0) -> float:
    """Clamp une valeur dans [lo, hi]."""
    return max(lo, min(hi, value))


def determine_confidence_level(score: float) -> str:
    """Détermine le niveau de confiance à partir du score.

    - score >= 70  → high
    - score >= 40  → medium
    - sinon        → low
    """
    if score >= 70:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def compute_score(
    analysis: dict,
    raw_text: str,
) -> tuple[float, str]:
    """Calcule le score probabiliste et le confidence_level.

    Parameters
    ----------
    analysis : dict
        Clés attendues (chacune entre 0.0 et 1.0) :
        - has_person_name      (0 ou 1)
        - has_institution      (0 ou 1)
        - has_degree_keyword   (0 ou 1)
        - has_date             (0 ou 1)
        - signature_confidence (0.0 – 1.0)
        - stamp_confidence     (0.0 – 1.0)
        - official_mention     (0 ou 1)
    raw_text : str
        Texte extrait (utilisé comme graine de bruit).

    Returns
    -------
    (score, confidence_level)
    """
    # Somme pondérée → base_score sur [0, 1]
    base: float = 0.0
    for key, weight in WEIGHTS.items():
        value = float(analysis.get(key, 0.0))
        base += weight * value

    # Normaliser sur [0, 100]
    raw_score = base * 100.0

    # Bruit déterministe
    noise = _deterministic_noise(raw_text, amplitude=4.0)
    raw_score += noise

    # Clamp strict
    score = round(_clamp(raw_score), 1)

    confidence_level = determine_confidence_level(score)

    logger.info(
        "Scoring — raw=%.1f | noise=%.2f | final=%.1f | confidence=%s",
        base * 100.0,
        noise,
        score,
        confidence_level,
    )

    return score, confidence_level
