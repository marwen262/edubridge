"""
Tests pour le moteur de scoring.
"""

import pytest

from app.services.scoring_engine import (
    calculate_score,
    compute_final_score,
    determine_confidence,
    determine_verdict,
)


class TestCalculateScore:
    """Tests du calcul de score (inversé : 0 = authentique, 100 = falsifié)."""

    def test_not_diploma(self):
        """Document non-diplôme → score 100."""
        results = {"is_diploma": False}
        assert calculate_score(results) == 100.0

    def test_perfect_diploma(self):
        """Diplôme avec tous les critères positifs → score bas."""
        results = {
            "is_diploma": True,
            "signature_detected": True,
            "stamp_detected": True,
            "official_mention_found": True,
            "text_coherence_score": 1.0,
            "tampering_score": 0.0,
            "metadata_suspicion": 0.0,
            "all_flags": [],
        }
        score = calculate_score(results)
        assert score < 20  # Devrait être AUTHENTIQUE

    def test_no_signature_penalty(self):
        """Signature absente augmente le score de 15 points."""
        base = {
            "is_diploma": True,
            "signature_detected": True,
            "stamp_detected": True,
            "official_mention_found": True,
            "text_coherence_score": 1.0,
            "tampering_score": 0.0,
            "metadata_suspicion": 0.0,
            "all_flags": [],
        }
        no_sig = {**base, "signature_detected": False}
        score_base = calculate_score(base)
        score_no_sig = calculate_score(no_sig)
        assert score_no_sig > score_base

    def test_high_tampering_score(self):
        """Score de tampering élevé augmente le score final."""
        results = {
            "is_diploma": True,
            "signature_detected": True,
            "stamp_detected": True,
            "official_mention_found": True,
            "text_coherence_score": 0.8,
            "tampering_score": 0.9,
            "metadata_suspicion": 0.5,
            "all_flags": [],
        }
        score = calculate_score(results)
        assert score > 20  # Devrait être au moins SUSPECT

    def test_many_flags_penalty(self):
        """Plus de 3 flags ajoutent des pénalités supplémentaires."""
        results = {
            "is_diploma": True,
            "signature_detected": True,
            "stamp_detected": True,
            "official_mention_found": True,
            "text_coherence_score": 1.0,
            "tampering_score": 0.0,
            "metadata_suspicion": 0.0,
            "all_flags": ["f1", "f2", "f3", "f4", "f5"],
        }
        score = calculate_score(results)
        # 5 flags → (5-3)*2 = 4 points de pénalité
        assert score > 0

    def test_coherence_bonus(self):
        """Bonus de -5 quand signature + cachet + mention sont tous présents."""
        results = {
            "is_diploma": True,
            "signature_detected": True,
            "stamp_detected": True,
            "official_mention_found": True,
            "text_coherence_score": 1.0,
            "tampering_score": 0.0,
            "metadata_suspicion": 0.0,
            "all_flags": [],
        }
        score = calculate_score(results)
        # Le score devrait être négatif avant le clamp, donc 0
        assert score == 0.0

    def test_score_clamped_0_100(self):
        """Le score est toujours entre 0 et 100."""
        results = {
            "is_diploma": True,
            "signature_detected": False,
            "stamp_detected": False,
            "official_mention_found": False,
            "text_coherence_score": 0.0,
            "tampering_score": 1.0,
            "metadata_suspicion": 1.0,
            "all_flags": ["f"] * 20,
        }
        score = calculate_score(results)
        assert 0.0 <= score <= 100.0


class TestDetermineVerdict:
    """Tests de détermination du verdict."""

    def test_authentic(self):
        """Score <= 20 → AUTHENTIQUE."""
        assert determine_verdict(0) == "AUTHENTIQUE"
        assert determine_verdict(10) == "AUTHENTIQUE"
        assert determine_verdict(20) == "AUTHENTIQUE"

    def test_suspect(self):
        """20 < score <= 50 → SUSPECT."""
        assert determine_verdict(21) == "SUSPECT"
        assert determine_verdict(35) == "SUSPECT"
        assert determine_verdict(50) == "SUSPECT"

    def test_falsified(self):
        """Score > 50 → FALSIFIÉ."""
        assert determine_verdict(51) == "FALSIFIÉ"
        assert determine_verdict(75) == "FALSIFIÉ"
        assert determine_verdict(100) == "FALSIFIÉ"


class TestDetermineConfidence:
    """Tests de détermination de la confiance."""

    def test_high_confidence_low_score(self):
        """Score très bas → HIGH."""
        assert determine_confidence(5) == "HIGH"
        assert determine_confidence(10) == "HIGH"

    def test_high_confidence_high_score(self):
        """Score très élevé → HIGH."""
        assert determine_confidence(85) == "HIGH"
        assert determine_confidence(100) == "HIGH"

    def test_medium_confidence(self):
        """Score modéré → MEDIUM."""
        assert determine_confidence(25) == "MEDIUM"
        assert determine_confidence(65) == "MEDIUM"

    def test_low_confidence(self):
        """Score dans la zone d'incertitude → LOW."""
        assert determine_confidence(40) == "LOW"
        assert determine_confidence(45) == "LOW"


class TestComputeFinalScore:
    """Tests du point d'entrée principal du scoring."""

    def test_returns_tuple(self):
        """Retourne un tuple (score, verdict, confidence)."""
        results = {
            "is_diploma": True,
            "signature_detected": True,
            "stamp_detected": True,
            "official_mention_found": True,
            "text_coherence_score": 0.9,
            "tampering_score": 0.1,
            "metadata_suspicion": 0.0,
            "all_flags": [],
        }
        score, verdict, confidence = compute_final_score(results)
        assert isinstance(score, float)
        assert verdict in ("AUTHENTIQUE", "SUSPECT", "FALSIFIÉ")
        assert confidence in ("HIGH", "MEDIUM", "LOW")
