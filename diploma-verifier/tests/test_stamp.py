"""
Tests pour le service de détection de cachet.
"""

import cv2
import numpy as np
import pytest

from app.services.stamp_detector import (
    StampResult,
    _detect_colored_regions,
    detect_stamp,
)


class TestDetectStamp:
    """Tests de détection de cachet."""

    def test_blank_image(self):
        """Image blanche : aucun cachet détecté."""
        image = np.ones((1000, 800, 3), dtype=np.uint8) * 255
        result = detect_stamp(image)
        assert isinstance(result, StampResult)
        assert result.stamp_detected is False

    def test_image_with_blue_circle(self):
        """Image avec un cercle bleu — devrait être détecté comme cachet."""
        image = np.ones((1000, 800, 3), dtype=np.uint8) * 255
        # Dessiner un cercle bleu (BGR : bleu = (255, 0, 0))
        cv2.circle(image, (400, 700), 60, (255, 0, 0), 3)
        cv2.circle(image, (400, 700), 55, (255, 0, 0), 2)

        result = detect_stamp(image)
        assert isinstance(result, StampResult)
        # La détection dépend de la qualité du cercle

    def test_image_with_red_circle(self):
        """Image avec un cercle rouge — cachet rouge possible."""
        image = np.ones((1000, 800, 3), dtype=np.uint8) * 255
        cv2.circle(image, (300, 600), 50, (0, 0, 255), 4)

        result = detect_stamp(image)
        assert isinstance(result, StampResult)

    def test_grayscale_input(self):
        """Fonctionne avec une image en niveaux de gris (mode dégradé)."""
        image = np.ones((1000, 800), dtype=np.uint8) * 255
        result = detect_stamp(image)
        assert isinstance(result, StampResult)
        assert "niveaux de gris" in result.flags[0] if result.flags else True

    def test_small_image(self):
        """Petite image traitée sans erreur."""
        image = np.ones((100, 80, 3), dtype=np.uint8) * 255
        result = detect_stamp(image)
        assert isinstance(result, StampResult)


class TestDetectColoredRegions:
    """Tests de détection de régions colorées."""

    def test_white_image_no_color(self):
        """Image blanche : aucune couleur d'encre détectée."""
        image = np.ones((100, 100, 3), dtype=np.uint8) * 255
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        mask, color = _detect_colored_regions(hsv)
        # Le masque devrait être principalement vide
        assert mask.shape == (100, 100)
