"""
Moteur de scoring : agrège les résultats de tous les services
en un score final, un verdict et un niveau de confiance.

SCORING INVERSÉ : 0 = authentique, 100 = falsifié.
"""

from __future__ import annotations

from app.config import AUTHENTIC_THRESHOLD, SUSPECT_THRESHOLD, WEIGHTS
from app.utils.logger import logger


def calculate_score(results: dict) -> float:
    """Calcule le score final de suspicion (0 = authentique, 100 = falsifié).

    Chaque critère absent ou négatif AUGMENTE le score.
    """
    score: float = 0.0

    # Si ce n'est pas un diplôme → score maximal
    if not results.get("is_diploma", False):
        return 100.0

    # Signature absente → +15 points de suspicion
    if not results.get("signature_detected", False):
        score += WEIGHTS["signature_present"] * 100

    # Cachet absent → +15 points
    if not results.get("stamp_detected", False):
        score += WEIGHTS["stamp_present"] * 100

    # Mention officielle absente → +10 points
    if not results.get("official_mention_found", False):
        score += WEIGHTS["official_mention"] * 100

    # Texte incohérent → proportionnel
    text_coherence: float = results.get("text_coherence_score", 0.0)
    text_incoherence: float = 1.0 - text_coherence
    score += WEIGHTS["text_coherence"] * text_incoherence * 100

    # Altérations détectées → proportionnel
    tampering: float = results.get("tampering_score", 0.0)
    score += WEIGHTS["tampering_score"] * tampering * 100

    # Métadonnées suspectes → proportionnel
    metadata_suspicion: float = results.get("metadata_suspicion", 0.0)
    score += WEIGHTS["metadata_score"] * metadata_suspicion * 100

    # Pénalités supplémentaires par flags
    total_flags: int = len(results.get("all_flags", []))
    if total_flags > 3:
        score += (total_flags - 3) * 2

    # Bonus cohérence : signature + cachet + mention tous présents
    if (
        results.get("signature_detected", False)
        and results.get("stamp_detected", False)
        and results.get("official_mention_found", False)
    ):
        score -= 5

    return max(0.0, min(100.0, round(score, 1)))


def determine_verdict(score: float) -> str:
    """Détermine le verdict à partir du score.

    - score <= 20 → AUTHENTIQUE
    - score <= 50 → SUSPECT
    - score > 50  → FALSIFIÉ
    """
    if score <= AUTHENTIC_THRESHOLD:
        return "AUTHENTIQUE"
    if score <= SUSPECT_THRESHOLD:
        return "SUSPECT"
    return "FALSIFIÉ"


def determine_confidence(score: float) -> str:
    """Détermine le niveau de confiance du verdict.

    - score <= 10 ou score > 80 → HIGH  (le résultat est clair)
    - score <= 30 ou score > 60 → MEDIUM
    - sinon                     → LOW   (zone d'incertitude)
    """
    if score <= 10 or score > 80:
        return "HIGH"
    if score <= 30 or score > 60:
        return "MEDIUM"
    return "LOW"


def compute_final_score(results: dict) -> tuple[float, str, str]:
    """Point d'entrée principal du moteur de scoring.

    Retourne (score, verdict, confidence).
    """
    score: float = calculate_score(results)
    verdict: str = determine_verdict(score)
    confidence: str = determine_confidence(score)

    logger.info(
        "Scoring final — score=%.1f | verdict=%s | confiance=%s",
        score,
        verdict,
        confidence,
    )

    return score, verdict, confidence
