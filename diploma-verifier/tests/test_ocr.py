"""
Tests pour le service OCR.
"""

from unittest.mock import MagicMock, patch

import numpy as np
import pytest

from app.services.ocr_service import (
    OCRResult,
    _detect_language,
    _extract_academic_year,
    _extract_dates,
    _extract_text_tesseract,
    extract_text,
)


class TestDetectLanguage:
    """Tests de détection de langue."""

    def test_detect_french(self):
        """Texte français correctement détecté."""
        text = "Ceci est un diplôme délivré par l'Université de Tunis"
        lang = _detect_language(text)
        assert lang == "fr"

    def test_detect_english(self):
        """Texte anglais correctement détecté."""
        text = "This diploma is hereby awarded to the above named student"
        lang = _detect_language(text)
        assert lang == "en"

    def test_empty_text(self):
        """Texte vide retourne 'unknown'."""
        assert _detect_language("") == "unknown"

    def test_short_text(self):
        """Texte trop court retourne 'unknown'."""
        assert _detect_language("abc") == "unknown"


class TestExtractDates:
    """Tests d'extraction de dates."""

    def test_date_dd_mm_yyyy(self):
        """Format DD/MM/YYYY détecté."""
        text = "Délivré le 15/06/2023 à Tunis"
        assert _extract_dates(text) == "15/06/2023"

    def test_date_yyyy_mm_dd(self):
        """Format YYYY-MM-DD détecté."""
        text = "Date: 2023-06-15"
        assert _extract_dates(text) == "2023-06-15"

    def test_no_date(self):
        """Aucune date dans le texte."""
        assert _extract_dates("Un texte sans date") is None


class TestExtractAcademicYear:
    """Tests d'extraction d'année universitaire."""

    def test_academic_year_slash(self):
        """Année académique avec slash détectée."""
        text = "Année universitaire 2022/2023"
        assert _extract_academic_year(text) == "2022/2023"

    def test_academic_year_dash(self):
        """Année académique avec tiret détectée."""
        text = "Academic year 2021-2022"
        assert _extract_academic_year(text) == "2021/2022"

    def test_no_academic_year(self):
        """Aucune année académique dans le texte."""
        assert _extract_academic_year("Un texte simple") is None


class TestExtractText:
    """Tests du pipeline complet d'extraction OCR."""

    @patch("app.services.ocr_service._extract_text_tesseract")
    def test_empty_image(self, mock_tesseract):
        """Image sans texte retourne un résultat avec flag."""
        mock_tesseract.return_value = ("", 0.0)
        image = np.zeros((100, 100), dtype=np.uint8)
        result = extract_text(image)
        assert isinstance(result, OCRResult)
        assert result.full_text == ""
        assert "Aucun texte extrait" in result.flags[0]

    @patch("app.services.ocr_service._extract_text_tesseract")
    def test_low_confidence(self, mock_tesseract):
        """Confiance basse signalée par un flag."""
        mock_tesseract.return_value = ("texte flou", 0.15)
        image = np.zeros((100, 100), dtype=np.uint8)
        result = extract_text(image)
        assert result.ocr_confidence == 0.15
        assert any("basse" in f for f in result.flags)

    @patch("app.services.ocr_service._extract_text_tesseract")
    def test_successful_extraction(self, mock_tesseract):
        """Extraction réussie retourne texte et confiance."""
        mock_tesseract.return_value = (
            "Diplôme délivré le 15/06/2023 année universitaire 2022/2023",
            0.85,
        )
        image = np.zeros((100, 100), dtype=np.uint8)
        result = extract_text(image)
        assert result.ocr_confidence == 0.85
        assert result.full_text != ""
        assert result.extracted_fields.get("date") is not None
