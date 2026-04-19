"""
Tests pour le service de détection de pays.
"""

import pytest

from app.services.country_detector import CountryResult, detect_country


class TestDetectCountry:
    """Tests de détection de pays d'origine du diplôme."""

    def test_tunisia_french(self):
        """République Tunisienne détectée en français."""
        text = "République Tunisienne - Université de Tunis"
        result = detect_country(text, "fr")
        assert result.country_detected == "Tunisia"
        assert result.confidence > 0.0

    def test_tunisia_arabic(self):
        """République Tunisienne détectée en arabe."""
        text = "الجمهورية التونسية - جامعة تونس"
        result = detect_country(text, "ar")
        assert result.country_detected == "Tunisia"

    def test_france(self):
        """République Française détectée."""
        text = "République Française - Académie de Paris - Université Paris-Saclay"
        result = detect_country(text, "fr")
        assert result.country_detected == "France"

    def test_algeria(self):
        """République Algérienne détectée."""
        text = "République Algérienne Démocratique et Populaire"
        result = detect_country(text, "fr")
        assert result.country_detected == "Algeria"

    def test_morocco(self):
        """Royaume du Maroc détecté."""
        text = "Royaume du Maroc - Université Mohammed V de Rabat"
        result = detect_country(text, "fr")
        assert result.country_detected == "Morocco"

    def test_usa(self):
        """USA détecté."""
        text = "Board of Trustees - University of California"
        result = detect_country(text, "en")
        assert result.country_detected == "USA"

    def test_germany(self):
        """Allemagne détectée."""
        text = "Bundesrepublik Deutschland - Technische Universität München"
        result = detect_country(text, "de")
        assert result.country_detected == "Germany"

    def test_egypt_arabic(self):
        """Égypte détectée en arabe."""
        text = "جمهورية مصر العربية - جامعة القاهرة"
        result = detect_country(text, "ar")
        assert result.country_detected == "Egypt"

    def test_spain(self):
        """Espagne détectée."""
        text = "Reino de España - Ministerio de Educación - Universidad de Madrid"
        result = detect_country(text, "es")
        assert result.country_detected == "Spain"

    def test_saudi_arabia(self):
        """Arabie Saoudite détectée en arabe."""
        text = "المملكة العربية السعودية - جامعة الملك سعود"
        result = detect_country(text, "ar")
        assert result.country_detected == "Saudi Arabia"

    def test_unknown_country(self):
        """Texte sans pays identifiable → 'Unknown'."""
        text = "Bonjour le monde, ceci est un texte générique"
        result = detect_country(text, "fr")
        assert result.country_detected == "Unknown"

    def test_empty_text(self):
        """Texte vide → 'Unknown'."""
        result = detect_country("", "fr")
        assert result.country_detected == "Unknown"

    def test_country_hint_boost(self):
        """L'indice de pays augmente la confiance."""
        text = "Université de Tunis"
        result_without = detect_country(text, "fr")
        result_with = detect_country(text, "fr", country_hint="Tunisia")
        assert result_with.confidence >= result_without.confidence

    def test_uk(self):
        """Royaume-Uni détecté."""
        text = "University of Oxford - United Kingdom"
        result = detect_country(text, "en")
        assert result.country_detected == "UK"

    def test_lebanon(self):
        """Liban détecté."""
        text = "République Libanaise - Université Libanaise"
        result = detect_country(text, "fr")
        assert result.country_detected == "Lebanon"

    def test_result_type(self):
        """Le résultat est bien un CountryResult."""
        result = detect_country("test", "en")
        assert isinstance(result, CountryResult)
        assert hasattr(result, "country_detected")
        assert hasattr(result, "confidence")
        assert hasattr(result, "language_detected")
        assert hasattr(result, "matching_patterns")
