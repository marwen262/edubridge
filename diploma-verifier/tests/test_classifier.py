"""
Tests pour le service de classification de diplômes.
"""

import numpy as np
import pytest

from app.services.diploma_classifier import (
    ClassificationResult,
    _analyze_document_layout,
    _count_diploma_keywords,
    _detect_type_from_text,
    classify_diploma,
)


class TestCountDiplomaKeywords:
    """Tests du comptage de mots-clés."""

    def test_french_keywords(self):
        """Mots-clés français comptés correctement."""
        text = "diplôme master université mention faculté"
        found, total, lang = _count_diploma_keywords(text)
        assert found >= 3
        assert lang == "fr"

    def test_english_keywords(self):
        """Mots-clés anglais comptés correctement."""
        text = "diploma degree bachelor university faculty awarded"
        found, total, lang = _count_diploma_keywords(text)
        assert found >= 3
        assert lang == "en"

    def test_no_keywords(self):
        """Texte sans mot-clé : found = 0."""
        found, total, lang = _count_diploma_keywords("chat chien lapin")
        assert found == 0

    def test_arabic_keywords(self):
        """Mots-clés arabes comptés."""
        text = "شهادة جامعة كلية دكتوراه"
        found, total, lang = _count_diploma_keywords(text)
        assert found >= 2
        assert lang == "ar"


class TestDetectTypeFromText:
    """Tests de détection du type de diplôme."""

    def test_detect_master(self):
        """Type 'Master' détecté."""
        assert "master" in _detect_type_from_text("diplôme de master", "fr").lower()

    def test_detect_bachelor_of_science(self):
        """Type 'Bachelor of Science' détecté."""
        result = _detect_type_from_text("Bachelor of Science in Physics", "en")
        assert "bachelor" in result.lower()

    def test_detect_phd(self):
        """Type 'PhD' détecté."""
        result = _detect_type_from_text("Doctor of Philosophy", "en")
        assert "doctor" in result.lower()

    def test_no_type(self):
        """Aucun type détecté pour un texte non pertinent."""
        assert _detect_type_from_text("recette de cuisine", "fr") == "unknown"


class TestAnalyzeDocumentLayout:
    """Tests de l'analyse du layout."""

    def test_portrait_format(self):
        """Image au format portrait (A4)."""
        # 2480 x 3508 = proportions A4 à 300 DPI, réduit
        image = np.ones((1169, 827, 3), dtype=np.uint8) * 240
        score, flags = _analyze_document_layout(image)
        assert score >= 0.5

    def test_small_image(self):
        """Petite image traitée sans erreur."""
        image = np.ones((100, 80, 3), dtype=np.uint8) * 240
        score, flags = _analyze_document_layout(image)
        assert 0.0 <= score <= 1.0


class TestClassifyDiploma:
    """Tests du pipeline complet de classification."""

    def test_diploma_text(self):
        """Texte de diplôme classifié comme diplôme."""
        text = (
            "Diplôme de Master délivré par l'Université, "
            "mention Bien, faculté des sciences, "
            "année universitaire 2022/2023, attestation"
        )
        image = np.ones((1000, 800, 3), dtype=np.uint8) * 240
        result = classify_diploma(text, image)
        assert isinstance(result, ClassificationResult)
        assert result.is_diploma is True
        assert result.confidence > 0.3

    def test_random_text(self):
        """Texte aléatoire classifié comme non-diplôme."""
        text = "La météo aujourd'hui est ensoleillée avec quelques nuages"
        image = np.ones((500, 500, 3), dtype=np.uint8) * 200
        result = classify_diploma(text, image)
        assert isinstance(result, ClassificationResult)
        assert result.is_diploma is False

    def test_empty_text(self):
        """Texte vide classifié comme non-diplôme."""
        image = np.ones((500, 500, 3), dtype=np.uint8) * 200
        result = classify_diploma("", image)
        assert result.is_diploma is False
