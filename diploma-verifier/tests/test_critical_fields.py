"""
Tests V7 — Critical Fields Validator.

Couvre les cas centraux de Phase 1 :
  - Diplôme valide → score élevé
  - Template officiel sans identité → flagged + capped
  - Champs manquants → pénalisés
  - OCR de qualité faible → tolérance appliquée
  - Spécialisation détectée par mots-clés
  - Score agrégé pondéré conforme aux poids config
"""

from __future__ import annotations

import pytest

from app.config import (
    CRITICAL_FIELDS_LOW_THRESHOLD,
    CRITICAL_FIELDS_TEMPLATE_CAP,
    CRITICAL_FIELDS_WEIGHTS,
)
from app.services.critical_fields_validator import (
    CriticalFieldsResult,
    validate_critical_fields,
)
from app.services.text_analyzer import SemanticComponents, TextAnalysisResult


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _make_analysis(
    *,
    has_person_name: bool = False,
    detected_name: str | None = None,
    name_source: str = "spacy",
    has_institution: bool = False,
    has_degree_keyword: bool = False,
    detected_degree: str | None = None,
    has_date: bool = False,
    doc_type: str = "unknown",
) -> TextAnalysisResult:
    """Construit un TextAnalysisResult minimal pour les tests.

    name_source par défaut "spacy" — préserve le comportement attendu
    par les tests existants. Spécifier explicitement "regex_latin",
    "regex_arabic" ou "none" pour tester d'autres branches.
    """
    return TextAnalysisResult(
        has_person_name=has_person_name,
        detected_name=detected_name,
        name_source=name_source if has_person_name else "none",
        has_institution=has_institution,
        has_degree_keyword=has_degree_keyword,
        detected_degree=detected_degree,
        has_date=has_date,
        doc_type=doc_type,
        semantic_components=SemanticComponents(),
    )


# ──────────────────────────────────────────────
# Tests : champs vides
# ──────────────────────────────────────────────

class TestEmptyFields:
    """Aucun champ détecté → score très bas."""

    def test_all_fields_empty_high_ocr(self):
        """Aucun champ + bon OCR → score = 0 (aucune tolérance OCR)."""
        analysis = _make_analysis()
        result = validate_critical_fields(
            raw_text="random noise text",
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        assert result.score == 0
        assert isinstance(result, CriticalFieldsResult)

    def test_all_fields_empty_low_ocr(self):
        """Aucun champ + OCR faible → tolérance bonus appliquée (score > 0)."""
        analysis = _make_analysis()
        result = validate_critical_fields(
            raw_text="",
            analysis_result=analysis,
            ocr_confidence=0.1,
        )
        # Le bonus de tolérance OCR remonte les zéros à ~25
        assert result.score > 0
        assert result.score < 30  # mais reste sous le low threshold


# ──────────────────────────────────────────────
# Tests : template sans identité
# ──────────────────────────────────────────────

class TestTemplateWithoutIdentity:
    """Cœur du V7 : un document avec keyword diplôme mais sans identité."""

    def test_template_flagged(self):
        """Degree keyword + pas de nom + pas de date → flag is_template."""
        analysis = _make_analysis(
            has_degree_keyword=True,
            detected_degree="Licence",
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text="République Tunisienne — Licence en informatique",
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        assert result.is_template_without_identity is True

    def test_template_score_capped(self):
        """Template sans identité → score capped à TEMPLATE_CAP."""
        analysis = _make_analysis(
            has_degree_keyword=True,
            has_institution=True,
            detected_degree="Master",
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text="Université de Tunis — Master en informatique",
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        assert result.is_template_without_identity is True
        assert result.score <= CRITICAL_FIELDS_TEMPLATE_CAP

    def test_template_with_name_not_flagged(self):
        """Avec un nom détecté → pas un template."""
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="Mohamed Ben Ali",
            has_degree_keyword=True,
            detected_degree="Licence",
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text="Mohamed Ben Ali a obtenu sa Licence",
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        assert result.is_template_without_identity is False


# ──────────────────────────────────────────────
# Tests : diplôme complet (cas favorable)
# ──────────────────────────────────────────────

class TestRealDiploma:
    """Diplôme avec tous les champs critiques → score élevé."""

    def test_full_diploma_high_score(self):
        """Tous les champs présents → score >= 70."""
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="Mohamed Ben Ali",
            has_institution=True,
            has_degree_keyword=True,
            detected_degree="Licence",
            has_date=True,
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text=(
                "République Tunisienne. Université de Tunis. "
                "Mohamed Ben Ali a obtenu sa Licence en informatique "
                "le 15 juin 2024."
            ),
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        assert result.score >= 70
        assert result.is_template_without_identity is False
        assert result.field_scores["first_name"] > 0
        assert result.field_scores["last_name"] > 0
        assert result.field_scores["degree"] >= 80
        assert result.field_scores["date"] >= 85

    def test_full_date_pattern_higher_than_year_only(self):
        """Date complète scorée plus haut qu'année seule."""
        analysis_year = _make_analysis(has_date=True, has_degree_keyword=True)
        analysis_full = _make_analysis(has_date=True, has_degree_keyword=True)

        r_year = validate_critical_fields(
            raw_text="Diplôme délivré en 2024",
            analysis_result=analysis_year,
            ocr_confidence=0.9,
        )
        r_full = validate_critical_fields(
            raw_text="Diplôme délivré le 15 juin 2024",
            analysis_result=analysis_full,
            ocr_confidence=0.9,
        )
        assert r_full.field_scores["date"] >= r_year.field_scores["date"]


# ──────────────────────────────────────────────
# Tests : champs partiels
# ──────────────────────────────────────────────

class TestPartialFields:
    """Champs partiellement présents → score modéré."""

    def test_only_name(self):
        """Seul le nom (50% du poids) → score ~50."""
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="Marie Dupont",
        )
        result = validate_critical_fields(
            raw_text="Marie Dupont",
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        # first(0.25) + last(0.25) = 50% du poids → score ~50
        assert 45 <= result.score <= 55
        # Sans degree → ne risque pas de passer en "trusted"
        assert result.score < 70

    def test_name_and_date_only(self):
        """Nom + date sans diplôme → score modéré (sans degree, plafonne)."""
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="Marie Dupont",
            has_date=True,
        )
        result = validate_critical_fields(
            raw_text="Marie Dupont — 15 juin 2024",
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        # name(0.50) + date(0.15) = 65% max → score < 70
        assert result.score < 70
        # Mais clairement au-dessus du low threshold
        assert result.score >= CRITICAL_FIELDS_LOW_THRESHOLD


# ──────────────────────────────────────────────
# Tests : spécialisation
# ──────────────────────────────────────────────

class TestSpecialization:
    """Détection de mots-clés de spécialisation."""

    def test_french_specialization_detected(self):
        """Spécialisation en français détectée."""
        analysis = _make_analysis(has_degree_keyword=True)
        result = validate_critical_fields(
            raw_text="Licence en informatique",
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        assert result.field_scores["specialization"] == 60

    def test_english_specialization_detected(self):
        """Spécialisation en anglais détectée."""
        analysis = _make_analysis(has_degree_keyword=True)
        result = validate_critical_fields(
            raw_text="Bachelor of Computer Science",
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        assert result.field_scores["specialization"] == 60

    def test_no_specialization_keyword(self):
        """Aucune spécialisation détectée → score 0."""
        analysis = _make_analysis(has_degree_keyword=True)
        result = validate_critical_fields(
            raw_text="Diplôme général",
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        assert result.field_scores["specialization"] == 0


# ──────────────────────────────────────────────
# Tests : tolérance OCR
# ──────────────────────────────────────────────

class TestOCRTolerance:
    """Quand l'OCR est mauvais, ne pas pénaliser deux fois."""

    def test_low_ocr_lifts_zero_scores(self):
        """OCR faible → les scores 0 sont remontés au floor."""
        analysis = _make_analysis()  # tous les champs vides
        result_high = validate_critical_fields(
            raw_text="",
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        result_low = validate_critical_fields(
            raw_text="",
            analysis_result=analysis,
            ocr_confidence=0.1,
        )
        assert result_low.score > result_high.score

    def test_low_ocr_does_not_inflate_present_fields(self):
        """OCR faible ne change pas les scores des champs détectés."""
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="Mohamed",
            has_degree_keyword=True,
            doc_type="diploma",
        )
        result_high = validate_critical_fields(
            raw_text="Mohamed — Licence",
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        result_low = validate_critical_fields(
            raw_text="Mohamed — Licence",
            analysis_result=analysis,
            ocr_confidence=0.1,
        )
        assert result_low.field_scores["first_name"] == result_high.field_scores["first_name"]
        assert result_low.field_scores["degree"] == result_high.field_scores["degree"]


# ──────────────────────────────────────────────
# Tests : agrégation pondérée
# ──────────────────────────────────────────────

class TestAggregation:
    """Le score agrégé respecte les poids du config."""

    def test_weights_sum_to_one(self):
        """Sanity check : les poids critical_fields somment à 1.0."""
        total = sum(CRITICAL_FIELDS_WEIGHTS.values())
        assert abs(total - 1.0) < 0.001

    def test_score_in_valid_range(self):
        """Score toujours dans [0, 100]."""
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="A B C D E",  # nom long
            has_institution=True,
            has_degree_keyword=True,
            detected_degree="Master",
            has_date=True,
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text="Tres long texte avec licence en informatique le 15 juin 2024",
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        assert 0 <= result.score <= 100

    def test_aggregation_respects_first_name_weight(self):
        """Activer first_name (poids 0.25) sur 100 → contribue ~25 au total."""
        # Cas A : tout vide
        analysis_a = _make_analysis()
        r_a = validate_critical_fields(
            raw_text="",
            analysis_result=analysis_a,
            ocr_confidence=0.9,
        )

        # Cas B : seulement first_name à 100 (nom 1 token, > 2 chars, source spaCy)
        # Note : detected_name="Mohamed" → split = ("Mohamed", None)
        # → first_name=80+20=100, last_name=0
        analysis_b = _make_analysis(
            has_person_name=True,
            detected_name="Mohamed",
        )
        r_b = validate_critical_fields(
            raw_text="Mohamed",
            analysis_result=analysis_b,
            ocr_confidence=0.9,
        )

        delta = r_b.score - r_a.score
        # Poids 0.25 × valeur 100 = 25 attendu (à arrondi près)
        assert 20 <= delta <= 30


# ──────────────────────────────────────────────
# Fix 1 — Rejet faux positifs spaCy NER
# ──────────────────────────────────────────────

class TestFix1FalsePositiveRejection:
    """spaCy hallucinе parfois 'PER' depuis du texte officiel/ministériel."""

    def test_arabic_ministry_keyword_rejected(self):
        """detected_name='وزارة التربية' → rejeté (mot-clé ministériel)."""
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="وزارة التربية",
            name_source="spacy",
            has_degree_keyword=True,
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text="وزارة التربية الجمهورية التونسية شهادة البكالوريا",
            analysis_result=analysis,
            ocr_confidence=0.8,
        )
        # Nom rejeté → first/last = 0
        assert result.field_scores["first_name"] == 0
        assert result.field_scores["last_name"] == 0
        # Une raison explicite est ajoutée
        assert any("officiel" in r or "ministériel" in r for r in result.reasons)

    def test_french_ministre_rejected(self):
        """detected_name='Ministre Délégation' → rejeté."""
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="Ministre Délégation",
            name_source="spacy",
            has_degree_keyword=True,
        )
        result = validate_critical_fields(
            raw_text="Ministère de l'Éducation Nationale Diplôme",
            analysis_result=analysis,
            ocr_confidence=0.8,
        )
        assert result.field_scores["first_name"] == 0
        assert result.field_scores["last_name"] == 0

    def test_real_arabic_name_not_rejected(self):
        """Vrai nom arabe 'حبيب عثمان' → préservé."""
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="حبيب عثمان",
            name_source="regex_arabic",
            has_degree_keyword=True,
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text="السيد حبيب عثمان شهادة الهندسة",
            analysis_result=analysis,
            ocr_confidence=0.8,
        )
        # Nom préservé → score > 0
        assert result.field_scores["first_name"] > 0
        assert result.field_scores["last_name"] > 0

    def test_real_latin_name_not_rejected(self):
        """Vrai nom latin 'Mohamed Ben Ali' → préservé."""
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="Mohamed Ben Ali",
            name_source="spacy",
            has_degree_keyword=True,
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text="Diplôme de Licence — Mohamed Ben Ali",
            analysis_result=analysis,
            ocr_confidence=0.8,
        )
        assert result.field_scores["first_name"] > 0
        assert result.field_scores["last_name"] > 0

    def test_short_name_rejected(self):
        """detected_name='X1' (1 lettre réelle) → rejeté comme bruit OCR."""
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="X1",
            name_source="regex_latin",
        )
        result = validate_critical_fields(
            raw_text="X1 random",
            analysis_result=analysis,
            ocr_confidence=0.8,
        )
        assert result.field_scores["first_name"] == 0
        assert any("trop court" in r.lower() or "bruit" in r.lower()
                   for r in result.reasons)

    def test_name_with_only_punctuation_rejected(self):
        """detected_name='(!@$' (0 lettres réelles) → rejeté."""
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="(!@$",
            name_source="regex_latin",
        )
        result = validate_critical_fields(
            raw_text="(!@$ noise",
            analysis_result=analysis,
            ocr_confidence=0.8,
        )
        assert result.field_scores["first_name"] == 0

    def test_regex_latin_lower_score_than_spacy(self):
        """Source regex_latin → score 60, spacy → score 100."""
        analysis_spacy = _make_analysis(
            has_person_name=True,
            detected_name="Marie Dupont",
            name_source="spacy",
        )
        analysis_regex = _make_analysis(
            has_person_name=True,
            detected_name="Marie Dupont",
            name_source="regex_latin",
        )
        r_spacy = validate_critical_fields(
            raw_text="Marie Dupont",
            analysis_result=analysis_spacy,
            ocr_confidence=0.8,
        )
        r_regex = validate_critical_fields(
            raw_text="Marie Dupont",
            analysis_result=analysis_regex,
            ocr_confidence=0.8,
        )
        # spaCy: 80+20=100 ; regex: 40+20=60
        assert r_spacy.field_scores["first_name"] == 100
        assert r_regex.field_scores["first_name"] == 60
        assert r_spacy.score > r_regex.score


# ──────────────────────────────────────────────
# Fix 2 — Template blank pattern detection
# ──────────────────────────────────────────────

class TestFix2TemplateBlankPatterns:
    """Détecte les structures 'label : <vide>' caractéristiques d'un modèle."""

    def test_arabic_blank_template_flagged(self):
        """Texte avec patterns blank arabes + degree → is_template=True."""
        # Reproduit l'OCR de diplomevide.png : labels sans données
        raw_text = (
            "وزارة التربية\n"
            "يسند شهادة البكالوريا إلى\n"
            "المولود(ة) في                    ولاية\n"
            "والمرسم(ة) في شعبة                تحت عدد\n"
            "بملاحظة\n"
        )
        analysis = _make_analysis(
            has_degree_keyword=True,
            detected_degree="باكالوريا",
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=analysis,
            ocr_confidence=0.7,
        )
        assert result.is_template_without_identity is True
        assert result.score <= 20  # capped at TEMPLATE_CAP

    def test_french_blank_template_flagged(self):
        """Patterns français blank + degree → flagged."""
        raw_text = (
            "République Française — Diplôme\n"
            "Délivré à\n"
            "Né(e) le\n"
            "M.\n"
        )
        analysis = _make_analysis(
            has_degree_keyword=True,
            detected_degree="Diplôme",
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=analysis,
            ocr_confidence=0.7,
        )
        assert result.is_template_without_identity is True
        assert result.score <= 20

    def test_real_diploma_with_filled_fields_not_flagged(self):
        """Diplôme rempli avec données → pas flag template."""
        raw_text = (
            "وزارة التربية الجمهورية التونسية\n"
            "يسند شهادة البكالوريا إلى مَرْوان بَلْقَاسِم\n"
            "المولود(ة) في 2004/02/13 براس الجبل\n"
            "العلوم التقنية 2023\n"
            "بملاحظة قريب من الحسن\n"
        )
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="مَرْوان بَلْقَاسِم",
            name_source="regex_arabic",
            has_degree_keyword=True,
            detected_degree="باكالوريا",
            has_date=True,
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=analysis,
            ocr_confidence=0.8,
        )
        assert result.is_template_without_identity is False
        assert result.score > 40  # bien au-dessus du cap template

    def test_template_with_rejected_false_positive_name(self):
        """Combine Fix 1 + Fix 2 : nom rejeté + patterns blank → flag."""
        # spaCy hallucinе 'وزارة التربية' comme nom, mais c'est un faux positif.
        # Les patterns blank confirment qu'il s'agit d'un template.
        raw_text = (
            "وزارة التربية الجمهورية التونسية\n"
            "يسند شهادة البكالوريا إلى\n"
            "المولود(ة) في                    ولاية\n"
        )
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="وزارة التربية",  # faux positif
            name_source="spacy",
            has_degree_keyword=True,
            detected_degree="باكالوريا",
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=analysis,
            ocr_confidence=0.7,
        )
        # Fix 1 rejette le nom → has_person_name local=False
        assert result.field_scores["first_name"] == 0
        # Fix 2 + Fix 1 ⇒ flag template (degree + blanks + pas de nom valide)
        assert result.is_template_without_identity is True
        assert result.score <= 20

    def test_blank_patterns_alone_without_degree_no_flag(self):
        """Patterns blank sans degree keyword → pas flag (juste low score)."""
        raw_text = "Délivré à\nNé(e) le\n"
        analysis = _make_analysis()  # pas de degree
        result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=analysis,
            ocr_confidence=0.7,
        )
        # Sans degree, l'heuristique template ne s'applique pas
        assert result.is_template_without_identity is False


# ──────────────────────────────────────────────
# Fix 2 (renforcé) — Détection structurelle adjacency
# ──────────────────────────────────────────────

class TestStructuralBlankFieldDetection:
    """Le détecteur structurel compte les libellés adjacents avec
    peu de contenu arabe entre eux. OCR-résistant car les libellés
    sont stables même quand le contenu environnant est garblé."""

    def test_diplomevide_garbled_ministry_name_caught(self):
        """diplomevide.png : 'ومرس الثرة' (وزير garbled) bypass keyword
        filter, mais le signal structurel multi-blank capture le template."""
        # Reproduit la structure réelle observée par OCR : multiples
        # libellés adjacents avec contenu arabe quasi-nul entre eux.
        raw_text = (
            "ومرس الثرة\n"        # garbled ministry — would bypass Fix 1a
            "يسند شهادة البكالوريا إلى\n"
            "المولود(ة) في                    ولاية\n"
            "والمرسم(ة) في شعبة                تحت عدد\n"
            "وذلك بعد نجاحه في امتحان البكالوريا دورة          بملاحظة\n"
        )
        # Simule la situation où spaCy a halluciné "ومرس الثرة" comme PER
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="ومرس الثرة",  # garble que Fix 1a ne catch pas
            name_source="spacy",
            has_degree_keyword=True,
            detected_degree="باكالوريا",
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=analysis,
            ocr_confidence=0.7,
        )

        # La structure (≥2 libellés adjacents blank) override la détection
        # du nom et flag is_template_without_identity.
        assert result.is_template_without_identity is True
        assert result.score <= 20
        assert result.field_scores["first_name"] == 0
        # La raison explicite indique un override structurel
        assert any(
            ("Structure de template" in r) or ("rejeté" in r)
            for r in result.reasons
        )

    def test_diplomevide_with_strong_visual_signature(self):
        """Empty template avec stamp + signature : le signal structurel
        empêche le score visuel de tirer le total vers le haut."""
        # Cas réel diplomevide.png : a un cachet visible
        raw_text = (
            "يسند شهادة البكالوريا إلى\n"
            "المولود(ة) في                    ولاية\n"
            "والمرسم(ة) في شعبة                تحت عدد\n"
            "بملاحظة\n"
        )
        analysis = _make_analysis(
            has_person_name=False,
            has_degree_keyword=True,
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=analysis,
            ocr_confidence=0.7,
        )
        assert result.is_template_without_identity is True
        assert result.score <= 20

    def test_real_diploma_no_false_structural_flag(self):
        """Diplôme rempli : libellés présents mais avec données entre eux
        → 0 ou 1 paire blank → ne déclenche PAS le signal structurel."""
        # diplomemar-like : labels with substantive data between
        raw_text = (
            "وزارة التربية الجمهورية التونسية\n"
            "يسند شهادة البكالوريا إلى مَرْوان بَلْقَاسِم\n"
            "المولود(ة) في 2004/02/13 براس الجبل\n"
            "والمرسم(ة) في شعبة العلوم التقنية\n"
            "بملاحظة قريب من الحسن دورة 2023\n"
        )
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="مَرْوان بَلْقَاسِم",
            name_source="regex_arabic",
            has_degree_keyword=True,
            detected_degree="باكالوريا",
            has_date=True,
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=analysis,
            ocr_confidence=0.8,
        )
        # Doit PAS être flag template
        assert result.is_template_without_identity is False
        # Le nom doit être préservé (pas dans contexte légal)
        assert result.field_scores["first_name"] > 0
        # Score raisonnable
        assert result.score >= 50

    def test_latin_only_text_no_structural_check(self):
        """Texte purement latin : pas de libellés arabes → pas de flag
        structurel (sécurité, évite faux positifs sur diplômes français)."""
        raw_text = (
            "République Française. Université Paris-Sorbonne. "
            "Mohamed Ben Ali a obtenu sa Licence d'informatique le 15 juin 2024."
        )
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="Mohamed Ben Ali",
            name_source="spacy",
            has_degree_keyword=True,
            detected_degree="Licence",
            has_date=True,
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        assert result.is_template_without_identity is False
        assert result.field_scores["first_name"] > 0


# ──────────────────────────────────────────────
# Fix 1c — Line-context check
# ──────────────────────────────────────────────

class TestFix1cLineContextRejection:
    """Rejette les noms qui apparaissent sur une ligne dominée par
    du texte légal/réglementaire (préambule)."""

    def test_arabic_legal_preamble_line_rejected(self):
        """Nom sur ligne avec 'بمقتضى القانون' → rejeté."""
        raw_text = (
            "وزارة التربية الجمهورية التونسية\n"
            "بمقتضى القانون التوجيهي عدد 80 لسنة 2002 المتعلق بالتربية\n"
            "وعلى الأمر عدد 1932 المؤرخ\n"
        )
        analysis = _make_analysis(
            has_person_name=True,
            # Faux nom hallucinе depuis la ligne du préambule
            detected_name="القانون التوجيهي",
            name_source="spacy",
            has_degree_keyword=True,
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=analysis,
            ocr_confidence=0.8,
        )
        assert result.field_scores["first_name"] == 0
        assert any("préambule" in r.lower() for r in result.reasons)

    def test_french_decree_line_rejected(self):
        """Nom sur ligne avec 'Vu le décret' → rejeté."""
        raw_text = (
            "République Française\n"
            "Vu les décret n° 2008-1245 du 28 novembre 2008 considérant\n"
            "Mohamed Ben Ali — Diplôme\n"
        )
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="2008",  # faux nom (chiffres) — devrait aussi être rejeté par Fix 1b
            name_source="spacy",
            has_degree_keyword=True,
        )
        result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=analysis,
            ocr_confidence=0.8,
        )
        # Rejeté soit par Fix 1b (pas de lettres réelles) soit par Fix 1c
        assert result.field_scores["first_name"] == 0

    def test_name_on_clean_line_not_rejected(self):
        """Nom sur ligne sans contexte légal → préservé."""
        raw_text = (
            "République Tunisienne. Université de Tunis.\n"
            "Mohamed Ben Ali a obtenu sa Licence en informatique.\n"
            "Le 15 juin 2024.\n"
        )
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="Mohamed Ben Ali",
            name_source="spacy",
            has_degree_keyword=True,
            doc_type="diploma",
        )
        result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        assert result.field_scores["first_name"] > 0

    def test_date_on_same_line_does_not_reject(self):
        """'Marie Dupont — 15 juin 2024' contient une date mais pas de
        préambule légal → préservé (régression : ne pas rejeter sur dates seules)."""
        raw_text = "Marie Dupont — 15 juin 2024"
        analysis = _make_analysis(
            has_person_name=True,
            detected_name="Marie Dupont",
            name_source="spacy",
            has_date=True,
        )
        result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=analysis,
            ocr_confidence=0.9,
        )
        assert result.field_scores["first_name"] > 0
