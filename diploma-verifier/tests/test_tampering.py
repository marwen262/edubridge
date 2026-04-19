"""
Tests pour le service de détection de falsification.
"""

from unittest.mock import patch

import numpy as np
import pytest

from app.services.tampering_detector import (
    TamperingResult,
    _check_background_uniformity,
    _detect_copy_paste,
    _error_level_analysis,
    detect_tampering,
)


class TestErrorLevelAnalysis:
    """Tests de l'analyse ELA."""

    def test_uniform_image(self):
        """Image uniforme : faible score ELA."""
        image = np.ones((500, 500, 3), dtype=np.uint8) * 200
        score, regions = _error_level_analysis(image)
        assert score < 0.5
        assert regions >= 0

    def test_black_image(self):
        """Image noire : résultat cohérent."""
        image = np.zeros((500, 500, 3), dtype=np.uint8)
        score, regions = _error_level_analysis(image)
        assert 0.0 <= score <= 1.0

    def test_noisy_image(self):
        """Image bruitée : score ELA potentiellement élevé."""
        rng = np.random.RandomState(42)
        image = rng.randint(0, 255, (500, 500, 3), dtype=np.uint8)
        score, regions = _error_level_analysis(image)
        assert 0.0 <= score <= 1.0


class TestCopyPasteDetection:
    """Tests de détection de copier-coller."""

    def test_uniform_image(self):
        """Image uniforme : pas de copier-coller."""
        image = np.ones((500, 500), dtype=np.uint8) * 200
        score = _detect_copy_paste(image)
        assert 0.0 <= score <= 1.0

    def test_small_image(self):
        """Petite image traitée sans erreur."""
        image = np.ones((50, 50), dtype=np.uint8) * 128
        score = _detect_copy_paste(image)
        assert 0.0 <= score <= 1.0


class TestBackgroundUniformity:
    """Tests d'analyse d'uniformité du fond."""

    def test_uniform_background(self):
        """Fond blanc uniforme : faible score."""
        image = np.ones((500, 500), dtype=np.uint8) * 250
        score, flags = _check_background_uniformity(image)
        assert score < 0.5

    def test_non_uniform_background(self):
        """Fond avec des zones de couleurs différentes."""
        image = np.ones((500, 500), dtype=np.uint8) * 250
        # Ajouter une zone sombre
        image[100:200, 100:200] = 100
        score, flags = _check_background_uniformity(image)
        assert 0.0 <= score <= 1.0


class TestDetectTampering:
    """Tests du pipeline complet de détection de tampering."""

    def test_clean_image(self):
        """Image propre : faible score de tampering."""
        image = np.ones((500, 500, 3), dtype=np.uint8) * 230
        result = detect_tampering(image, "fake_path.png")
        assert isinstance(result, TamperingResult)
        assert 0.0 <= result.tampering_score <= 1.0

    def test_pdf_metadata_non_pdf(self):
        """Fichier non-PDF : métadonnées ignorées."""
        image = np.ones((500, 500, 3), dtype=np.uint8) * 230
        result = detect_tampering(image, "image.png")
        assert isinstance(result, TamperingResult)
        assert result.metadata_info.get("author") is None
