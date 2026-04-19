"""
Tests pour le service d'analyse textuelle.
"""

import pytest

from app.services.text_analyzer import (
    TextAnalysisResult,
    _calculate_keywords_ratio,
    _check_date_coherence,
    _check_official_mentions,
    _check_text_structure,
    _detect_diploma_type,
    analyze_text,
)


class TestOfficialMentions:
    """Tests de détection des mentions officielles."""

    def test_french_republic(self):
        """Mention 'République Française' détectée."""
        found, mentions = _check_official_mentions("République Française")
        assert found is True
        assert len(mentions) > 0

    def test_tunisian_republic(self):
        """Mention 'République Tunisienne' détectée."""
        found, mentions = _check_official_mentions("République Tunisienne")
        assert found is True

    def test_arabic_republic(self):
        """Mention en arabe détectée."""
        found, mentions = _check_official_mentions("الجمهورية التونسية")
        assert found is True

    def test_english_ministry(self):
        """Mention 'Ministry of Education' détectée."""
        found, mentions = _check_official_mentions("Ministry of Higher Education")
        assert found is True

    def test_no_mention(self):
        """Texte sans mention officielle."""
        found, mentions = _check_official_mentions("Bonjour le monde")
        assert found is False
        assert len(mentions) == 0


class TestKeywordsRatio:
    """Tests du ratio de mots-clés."""

    def test_french_diploma_keywords(self):
        """Texte avec mots-clés français de diplôme."""
        text = "diplôme de master délivré par l'université, mention bien"
        ratio = _calculate_keywords_ratio(text, "fr")
        assert ratio > 0.1

    def test_english_diploma_keywords(self):
        """Texte avec mots-clés anglais de diplôme."""
        text = "bachelor degree awarded by the university faculty dean"
        ratio = _calculate_keywords_ratio(text, "en")
        assert ratio > 0.1

    def test_no_keywords(self):
        """Texte sans mot-clé."""
        ratio = _calculate_keywords_ratio("chat chien poisson", "fr")
        assert ratio == 0.0


class TestDiplomaType:
    """Tests de détection du type de diplôme."""

    def test_french_master(self):
        """Type 'Master' détecté en français."""
        dtype = _detect_diploma_type("diplôme de master professionnel", "fr")
        assert "master" in dtype.lower()

    def test_english_bachelor(self):
        """Type 'Bachelor of Science' détecté en anglais."""
        dtype = _detect_diploma_type("Bachelor of Science in Computer Science", "en")
        assert "bachelor" in dtype.lower()

    def test_unknown_type(self):
        """Type inconnu pour un texte non pertinent."""
        dtype = _detect_diploma_type("recette de cuisine", "fr")
        assert dtype == "unknown"


class TestDateCoherence:
    """Tests de cohérence des dates."""

    def test_valid_year(self):
        """Année valide ne génère aucun flag."""
        score, flags = _check_date_coherence("Délivré en 2023")
        assert score >= 0.8
        assert len(flags) == 0

    def test_future_year(self):
        """Année future génère un flag."""
        score, flags = _check_date_coherence("Délivré en 2099")
        assert any("future" in f.lower() for f in flags)

    def test_no_date(self):
        """Absence de date signalée."""
        score, flags = _check_date_coherence("Texte sans date")
        assert any("aucune" in f.lower() for f in flags)


class TestTextStructure:
    """Tests de la structure du texte."""

    def test_normal_text(self):
        """Texte structuré avec plusieurs lignes."""
        text = "Ligne 1\nLigne 2\nLigne 3\nLigne 4\nLigne 5\nLigne 6"
        score, flags = _check_text_structure(text)
        assert score > 0.3

    def test_very_short_text(self):
        """Texte très court signalé."""
        score, flags = _check_text_structure("abc")
        assert any("court" in f.lower() for f in flags)


class TestAnalyzeText:
    """Tests du pipeline complet d'analyse textuelle."""

    def test_empty_text(self):
        """Texte vide retourne un résultat avec flag."""
        result = analyze_text("", "fr")
        assert isinstance(result, TextAnalysisResult)
        assert "insuffisant" in result.flags[0].lower()

    def test_french_diploma_text(self):
        """Texte de diplôme français analysé correctement."""
        text = (
            "République Tunisienne\n"
            "Ministère de l'Enseignement Supérieur\n"
            "Université de Tunis\n"
            "Diplôme de Master\n"
            "Mention : Bien\n"
            "Année universitaire 2022/2023\n"
            "Délivré le 15/06/2023"
        )
        result = analyze_text(text, "fr")
        assert result.official_mention_found is True
        assert result.keywords_ratio > 0.0
        assert result.text_coherence_score > 0.0
