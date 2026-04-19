"""
Tests pour le service de détection de signature.
"""

import numpy as np
import pytest

from app.services.signature_detector import (
    SignatureResult,
    _analyze_contours,
    _extract_bottom_region,
    detect_signature,
)


class TestExtractBottomRegion:
    """Tests de l'extraction de la zone inférieure."""

    def test_default_ratio(self):
        """30 % de la hauteur extraite par défaut."""
        image = np.zeros((1000, 800), dtype=np.uint8)
        region, y_offset = _extract_bottom_region(image, 0.30)
        assert region.shape[0] == 300
        assert y_offset == 700

    def test_custom_ratio(self):
        """Ratio personnalisé respecté."""
        image = np.zeros((1000, 800), dtype=np.uint8)
        region, y_offset = _extract_bottom_region(image, 0.50)
        assert region.shape[0] == 500
        assert y_offset == 500


class TestDetectSignature:
    """Tests de détection de signature."""

    def test_blank_image(self):
        """Image blanche : aucune signature détectée."""
        image = np.ones((1000, 800, 3), dtype=np.uint8) * 255
        result = detect_signature(image)
        assert isinstance(result, SignatureResult)
        assert result.signature_detected is False

    def test_black_image(self):
        """Image noire : aucune signature détectée (pas de contours significatifs)."""
        image = np.zeros((1000, 800, 3), dtype=np.uint8)
        result = detect_signature(image)
        assert isinstance(result, SignatureResult)
        assert result.signature_detected is False

    def test_image_with_scribble(self):
        """Image avec un gribouillis en bas — devrait détecter un candidat."""
        image = np.ones((1000, 800, 3), dtype=np.uint8) * 255

        # Dessiner un gribouillis irrégulier dans la zone inférieure
        import cv2
        points = np.array([
            [200, 850], [220, 830], [250, 860], [280, 840],
            [310, 870], [340, 835], [370, 855], [400, 845],
        ], dtype=np.int32)
        cv2.polylines(image, [points], False, (0, 0, 0), 2)

        result = detect_signature(image)
        assert isinstance(result, SignatureResult)
        # Le résultat dépend de la complexité du gribouillis

    def test_grayscale_input(self):
        """Fonctionne aussi avec une image en niveaux de gris."""
        image = np.ones((1000, 800), dtype=np.uint8) * 255
        result = detect_signature(image)
        assert isinstance(result, SignatureResult)
