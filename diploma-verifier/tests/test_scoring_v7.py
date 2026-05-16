"""
Tests V7 Phase 2 — Multi-score scoring engine.

Couvre :
  - SubscoreBundle dataclass
  - compute_subscores : extraction des sous-scores depuis les modules
  - compute_global_trust_score : pondération + ajustement dynamique + caps
  - compute_risk_level + risk_level_to_confidence
  - aggregate_explainable_reasons
"""

from __future__ import annotations

from dataclasses import dataclass, field
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from app.config import (
    GLOBAL_SCORE_WEIGHTS,
    OCR_DYNAMIC_THRESHOLD,
    V7_FRAUD_HARD_CAP_SCORE,
    V7_FRAUD_HARD_CAP_THRESHOLD,
    V7_HALLUCINATION_CAP,
    V7_NO_CONTENT_CAP,
    V7_SCORE_MAX,
    V7_SCORE_MIN,
    V7_SEMANTIC_CEILING_CAP,
    V7_TEMPLATE_CAP,
    V7_TEMPLATE_FLAG_CAP,
)
from app.services.scoring_engine import (
    ExplainableReason,
    SubscoreBundle,
    aggregate_explainable_reasons,
    compute_global_trust_score,
    compute_risk_level,
    compute_subscores,
    risk_level_to_confidence,
)


# ──────────────────────────────────────────────
# Fixtures helper — mocks légers des objets de pipeline
# ──────────────────────────────────────────────

def _make_ocr_result(text="", confidence=0.9, lang="fr"):
    return SimpleNamespace(
        full_text=text,
        ocr_confidence=confidence,
        language_detected=lang,
    )


def _make_text_result(
    *,
    structure_count=0,
    semantic_score=0.0,
    coherence_score=0.0,
    keyword_penalty=0.0,
    has_certification_phrase=False,
    official_mention_found=False,
    has_degree_keyword=False,
    has_date=False,
    doc_type="unknown",
):
    return SimpleNamespace(
        structure_count=structure_count,
        semantic_score=semantic_score,
        coherence_score=coherence_score,
        keyword_penalty=keyword_penalty,
        has_certification_phrase=has_certification_phrase,
        official_mention_found=official_mention_found,
        has_degree_keyword=has_degree_keyword,
        has_date=has_date,
        doc_type=doc_type,
    )


def _make_visual(sig=0.0, stamp=0.0):
    return (
        SimpleNamespace(confidence=sig),
        SimpleNamespace(confidence=stamp),
    )


def _make_cf(score=50, is_template=False, reasons=None, field_scores=None):
    return SimpleNamespace(
        score=score,
        is_template_without_identity=is_template,
        reasons=reasons or [],
        field_scores=field_scores or {},
    )


def _make_tampering(score=0.0, flags=None):
    if score is None:
        return None
    return SimpleNamespace(
        tampering_score=score,
        tampering_detected=score > 0.35,
        ela_suspicious_regions=0,
        metadata_flags=[],
        metadata_info={},
        flags=flags or [],
    )


# ──────────────────────────────────────────────
# SubscoreBundle dataclass
# ──────────────────────────────────────────────

class TestSubscoreBundle:
    def test_default_values(self):
        b = SubscoreBundle()
        assert b.structure_score == 0
        assert b.semantic_score == 0
        assert b.critical_fields_score == 0
        assert b.visual_authenticity_score == 0
        assert b.fraud_score == 0
        assert b.ocr_confidence_score == 0

    def test_all_fields_settable(self):
        b = SubscoreBundle(
            structure_score=80, semantic_score=70,
            critical_fields_score=90, visual_authenticity_score=60,
            fraud_score=10, ocr_confidence_score=85,
        )
        assert b.structure_score == 80
        assert b.fraud_score == 10


class TestExplainableReason:
    def test_default_impact(self):
        r = ExplainableReason(layer="critical_fields", signal="x")
        assert r.impact == "medium"

    def test_explicit_impact(self):
        r = ExplainableReason(layer="tampering", signal="ELA", impact="high")
        assert r.impact == "high"


# ──────────────────────────────────────────────
# compute_subscores — extraction depuis les modules
# ──────────────────────────────────────────────

class TestComputeSubscores:
    def test_full_diploma_high_subscores(self):
        """Tous les signaux positifs → tous les sous-scores élevés."""
        ocr = _make_ocr_result(text="full diploma", confidence=0.95)
        tr = _make_text_result(
            structure_count=3, semantic_score=0.85, coherence_score=0.8,
            has_certification_phrase=True, official_mention_found=True,
        )
        sig, stamp = _make_visual(sig=0.7, stamp=0.85)
        cf = _make_cf(score=85)
        tamp = _make_tampering(score=0.05, flags=[])

        b = compute_subscores(
            ocr_result=ocr, text_result=tr,
            sig_result=sig, stamp_result=stamp,
            cf_result=cf, tampering_result=tamp,
        )
        assert b.structure_score >= 90
        assert b.semantic_score >= 70
        assert b.critical_fields_score == 85
        assert b.visual_authenticity_score >= 70
        assert b.fraud_score <= 10
        assert b.ocr_confidence_score >= 90

    def test_empty_document_low_subscores(self):
        """Document vide → tous les sous-scores nuls ou très bas."""
        ocr = _make_ocr_result(text="", confidence=0.0)
        tr = _make_text_result()
        sig, stamp = _make_visual()
        cf = _make_cf(score=0)
        b = compute_subscores(
            ocr_result=ocr, text_result=tr,
            sig_result=sig, stamp_result=stamp,
            cf_result=cf, tampering_result=None,
        )
        assert b.structure_score == 0
        assert b.semantic_score == 0
        assert b.critical_fields_score == 0
        assert b.visual_authenticity_score == 0
        assert b.fraud_score == 0
        assert b.ocr_confidence_score == 0

    def test_no_tampering_result_fraud_zero(self):
        """tampering_result=None → fraud_score=0."""
        ocr = _make_ocr_result(confidence=0.5)
        tr = _make_text_result(structure_count=2, semantic_score=0.5)
        sig, stamp = _make_visual()
        cf = _make_cf(score=50)
        b = compute_subscores(
            ocr_result=ocr, text_result=tr,
            sig_result=sig, stamp_result=stamp,
            cf_result=cf, tampering_result=None,
        )
        assert b.fraud_score == 0

    def test_keyword_penalty_reduces_semantic(self):
        """keyword_penalty > 0 réduit le semantic_score."""
        ocr = _make_ocr_result(confidence=0.9)
        tr_clean = _make_text_result(semantic_score=0.7)
        tr_stuffed = _make_text_result(semantic_score=0.7, keyword_penalty=0.3)

        sig, stamp = _make_visual()
        cf = _make_cf(score=50)

        b_clean = compute_subscores(
            ocr_result=ocr, text_result=tr_clean,
            sig_result=sig, stamp_result=stamp, cf_result=cf,
        )
        b_stuffed = compute_subscores(
            ocr_result=ocr, text_result=tr_stuffed,
            sig_result=sig, stamp_result=stamp, cf_result=cf,
        )
        assert b_clean.semantic_score > b_stuffed.semantic_score

    def test_visual_score_weights_stamp_higher(self):
        """Le cachet (60%) pèse plus que la signature (40%) dans visual."""
        ocr = _make_ocr_result(confidence=0.9)
        tr = _make_text_result()
        cf = _make_cf(score=50)

        sig_only, stamp_zero = _make_visual(sig=1.0, stamp=0.0)
        no_sig, stamp_only = _make_visual(sig=0.0, stamp=1.0)

        b_sig = compute_subscores(
            ocr_result=ocr, text_result=tr,
            sig_result=sig_only, stamp_result=stamp_zero, cf_result=cf,
        )
        b_stamp = compute_subscores(
            ocr_result=ocr, text_result=tr,
            sig_result=no_sig, stamp_result=stamp_only, cf_result=cf,
        )
        assert b_stamp.visual_authenticity_score > b_sig.visual_authenticity_score


# ──────────────────────────────────────────────
# compute_global_trust_score — pondération + caps
# ──────────────────────────────────────────────

class TestGlobalTrustScore:
    def _good_subscores(self):
        return SubscoreBundle(
            structure_score=90, semantic_score=80, critical_fields_score=85,
            visual_authenticity_score=80, fraud_score=10,
            ocr_confidence_score=90,
        )

    def test_high_quality_diploma_high_score(self):
        b = self._good_subscores()
        score, caps, weights = compute_global_trust_score(
            b,
            raw_text_len=500,
            has_degree_keyword=True,
            has_date=True,
        )
        assert score >= 80
        assert caps == []  # aucun cap appliqué

    def test_score_clamped_to_v7_bounds(self):
        # Subscores aberrants — vérifie bornes
        b = SubscoreBundle(
            structure_score=100, semantic_score=100,
            critical_fields_score=100, visual_authenticity_score=100,
            fraud_score=0, ocr_confidence_score=100,
        )
        score, _, _ = compute_global_trust_score(
            b, raw_text_len=500,
            has_degree_keyword=True, has_date=True,
        )
        assert V7_SCORE_MIN <= score <= V7_SCORE_MAX

    def test_critical_fields_weight_dominant(self):
        """critical_fields a le poids le plus élevé (0.30)."""
        b_high_cf = SubscoreBundle(
            structure_score=50, semantic_score=50, critical_fields_score=100,
            visual_authenticity_score=50, fraud_score=0,
            ocr_confidence_score=50,
        )
        b_low_cf = SubscoreBundle(
            structure_score=50, semantic_score=50, critical_fields_score=0,
            visual_authenticity_score=50, fraud_score=0,
            ocr_confidence_score=50,
        )
        score_high, _, _ = compute_global_trust_score(
            b_high_cf, raw_text_len=200,
            has_degree_keyword=True, has_date=True,
        )
        score_low, _, _ = compute_global_trust_score(
            b_low_cf, raw_text_len=200,
            has_degree_keyword=True, has_date=True,
        )
        # Critical fields contribue 35 points (poids 0.35 × valeur 100/0)
        assert score_high - score_low == pytest.approx(35, abs=2)

    def test_fraud_inverted_into_trust(self):
        """fraud_score=0 → fraud_trust=100 contribue positivement.
        fraud_score=80 → fraud_trust=20 contribue peu."""
        b_clean = SubscoreBundle(
            structure_score=70, semantic_score=70, critical_fields_score=70,
            visual_authenticity_score=70, fraud_score=0,
            ocr_confidence_score=70,
        )
        b_dirty = SubscoreBundle(
            structure_score=70, semantic_score=70, critical_fields_score=70,
            visual_authenticity_score=70, fraud_score=80,  # déclenche fraud cap
            ocr_confidence_score=70,
        )
        s_clean, _, _ = compute_global_trust_score(
            b_clean, raw_text_len=500,
            has_degree_keyword=True, has_date=True,
        )
        # b_dirty avec fraud=80 ne déclenche PAS le hard cap (>80 strict),
        # mais réduit fortement le total via fraud_trust=20.
        s_dirty, _, _ = compute_global_trust_score(
            b_dirty, raw_text_len=500,
            has_degree_keyword=True, has_date=True,
        )
        assert s_clean > s_dirty


class TestDynamicOCRWeighting:
    """Quand OCR est faible, semantic+structure sont sous-pondérés."""

    def test_high_ocr_no_adjustment(self):
        b = SubscoreBundle(ocr_confidence_score=85)
        # Récupérer les poids via le résultat
        _, _, weights = compute_global_trust_score(
            b, raw_text_len=200,
            has_degree_keyword=True, has_date=True,
        )
        # Identique à GLOBAL_SCORE_WEIGHTS (pas d'ajustement)
        for key, expected in GLOBAL_SCORE_WEIGHTS.items():
            assert weights[key] == pytest.approx(expected, abs=0.001)

    def test_low_ocr_reduces_text_weights(self):
        """OCR=10 → semantic et structure réduits, visual augmenté."""
        b = SubscoreBundle(ocr_confidence_score=10)
        _, _, weights = compute_global_trust_score(
            b, raw_text_len=200,
            has_degree_keyword=False, has_date=False,
        )
        # Semantic et structure réduits
        assert weights["semantic"] < GLOBAL_SCORE_WEIGHTS["semantic"]
        assert weights["structure"] < GLOBAL_SCORE_WEIGHTS["structure"]
        # Renormalisé : somme = 1
        assert sum(weights.values()) == pytest.approx(1.0, abs=0.001)

    def test_ocr_at_threshold_unchanged(self):
        """Au seuil exact (50), pas d'ajustement."""
        b = SubscoreBundle(ocr_confidence_score=OCR_DYNAMIC_THRESHOLD)
        _, _, weights = compute_global_trust_score(
            b, raw_text_len=200,
            has_degree_keyword=True, has_date=True,
        )
        for key, expected in GLOBAL_SCORE_WEIGHTS.items():
            assert weights[key] == pytest.approx(expected, abs=0.001)


# ──────────────────────────────────────────────
# Caps de sécurité (V6 préservés + V7 nouveaux)
# ──────────────────────────────────────────────

class TestSafetyCaps:
    def test_no_content_cap(self):
        """structure=0 + semantic<10 → cap à V7_NO_CONTENT_CAP."""
        b = SubscoreBundle(
            structure_score=0, semantic_score=5,
            critical_fields_score=80, visual_authenticity_score=90,
            fraud_score=0, ocr_confidence_score=80,
        )
        score, caps, _ = compute_global_trust_score(
            b, raw_text_len=200,
            has_degree_keyword=True, has_date=True,
        )
        assert "no_content" in caps
        assert score <= V7_NO_CONTENT_CAP

    def test_hallucination_cap(self):
        """structure≤33 + pas de degree/date + texte court → cap."""
        b = SubscoreBundle(
            structure_score=20, semantic_score=20,
            critical_fields_score=80, visual_authenticity_score=85,
            fraud_score=0, ocr_confidence_score=80,
        )
        score, caps, _ = compute_global_trust_score(
            b, raw_text_len=20,  # < 50
            has_degree_keyword=False, has_date=False,
        )
        assert "hallucination" in caps
        assert score <= V7_HALLUCINATION_CAP

    def test_semantic_ceiling_cap(self):
        """semantic<15 + score>70 → cap à 70."""
        # On veut un score > 70 sans cap. structure 90, cf 90, visual 90,
        # fraud 0, ocr 90 → ~83. semantic = 5 (<15) → ceiling à 70.
        b = SubscoreBundle(
            structure_score=90, semantic_score=5,
            critical_fields_score=90, visual_authenticity_score=90,
            fraud_score=0, ocr_confidence_score=90,
        )
        score, caps, _ = compute_global_trust_score(
            b, raw_text_len=500,
            has_degree_keyword=True, has_date=True,
        )
        assert "semantic_ceiling" in caps
        assert score <= V7_SEMANTIC_CEILING_CAP

    def test_template_cap(self):
        """visual>80 + critical_fields<40 + semantic>=50 → template cap."""
        b = SubscoreBundle(
            structure_score=60, semantic_score=60,   # semantic=60 >= 50 ✓
            critical_fields_score=20,                # < 40
            visual_authenticity_score=85,            # > 80
            fraud_score=0, ocr_confidence_score=80,
        )
        score, caps, _ = compute_global_trust_score(
            b, raw_text_len=300,
            has_degree_keyword=True, has_date=True,
        )
        assert "template" in caps
        assert score <= V7_TEMPLATE_CAP

    def test_template_flag_cap(self):
        """is_template_without_identity=True → cap."""
        b = SubscoreBundle(
            structure_score=80, semantic_score=70,
            critical_fields_score=20, visual_authenticity_score=60,
            fraud_score=0, ocr_confidence_score=80,
        )
        score, caps, _ = compute_global_trust_score(
            b, raw_text_len=300,
            has_degree_keyword=True, has_date=True,
            is_template_without_identity=True,
        )
        assert "template_flag" in caps
        assert score <= V7_TEMPLATE_FLAG_CAP

    def test_template_flag_skipped_when_ocr_low(self):
        """Phase 3 Fix 1 — template_flag NE doit PAS être appliqué quand
        ocr_confidence_score < 55. Cas réel : un vrai diplôme arabe avec
        OCR raté à 46 ne doit pas être plafonné comme un template vide."""
        b = SubscoreBundle(
            structure_score=62, semantic_score=39,
            critical_fields_score=31, visual_authenticity_score=84,
            fraud_score=34, ocr_confidence_score=46,  # < 55
        )
        score, caps, _ = compute_global_trust_score(
            b, raw_text_len=400,
            has_degree_keyword=True, has_date=True,
            is_template_without_identity=True,
        )
        # template_flag est sauté grâce au guard OCR-confidence
        assert "template_flag" not in caps

    def test_template_flag_applied_at_ocr_55_threshold(self):
        """Phase 3 Fix 1 — au seuil exact (ocr=55), template_flag s'applique."""
        b = SubscoreBundle(
            structure_score=70, semantic_score=50,
            critical_fields_score=20, visual_authenticity_score=60,
            fraud_score=10, ocr_confidence_score=55,
        )
        score, caps, _ = compute_global_trust_score(
            b, raw_text_len=400,
            has_degree_keyword=True, has_date=True,
            is_template_without_identity=True,
        )
        assert "template_flag" in caps
        assert score <= V7_TEMPLATE_FLAG_CAP

    def test_fraud_hard_cap(self):
        """fraud_score>80 → cap à V7_FRAUD_HARD_CAP_SCORE."""
        b = SubscoreBundle(
            structure_score=80, semantic_score=70,
            critical_fields_score=80, visual_authenticity_score=70,
            fraud_score=85,  # > 80
            ocr_confidence_score=80,
        )
        score, caps, _ = compute_global_trust_score(
            b, raw_text_len=400,
            has_degree_keyword=True, has_date=True,
        )
        assert "fraud_hard_cap" in caps
        assert score <= V7_FRAUD_HARD_CAP_SCORE

    def test_no_caps_on_clean_diploma(self):
        """Diplôme propre → aucun cap déclenché."""
        b = SubscoreBundle(
            structure_score=85, semantic_score=80,
            critical_fields_score=80, visual_authenticity_score=70,
            fraud_score=10, ocr_confidence_score=85,
        )
        score, caps, _ = compute_global_trust_score(
            b, raw_text_len=600,
            has_degree_keyword=True, has_date=True,
        )
        assert caps == []


# ──────────────────────────────────────────────
# Mapping risk_level + confidence_level
# ──────────────────────────────────────────────

class TestRiskLevelMapping:
    @pytest.mark.parametrize("score,expected", [
        (98, "trusted"),
        (80, "trusted"),
        (79, "review_recommended"),
        (60, "review_recommended"),
        (59, "suspicious"),
        (30, "suspicious"),
        (29, "highly_suspicious"),
        (3,  "highly_suspicious"),
    ])
    def test_risk_thresholds(self, score, expected):
        assert compute_risk_level(score) == expected

    @pytest.mark.parametrize("risk,expected", [
        ("trusted",            "high"),
        ("review_recommended", "medium"),
        ("suspicious",         "low"),
        ("highly_suspicious",  "very_low"),
    ])
    def test_risk_to_confidence(self, risk, expected):
        assert risk_level_to_confidence(risk) == expected

    def test_unknown_risk_defaults_to_low(self):
        assert risk_level_to_confidence("nonexistent") == "low"


# ──────────────────────────────────────────────
# Reasons aggregation
# ──────────────────────────────────────────────

class TestExplainableReasons:
    def test_critical_fields_reasons_high_impact_when_low_score(self):
        cf = _make_cf(score=20, reasons=["Nom du titulaire non détecté"])
        tr = _make_text_result()
        out = aggregate_explainable_reasons(
            text_result=tr, cf_result=cf, applied_caps=[],
        )
        cf_reasons = [r for r in out if r.layer == "critical_fields"]
        assert len(cf_reasons) == 1
        assert cf_reasons[0].impact == "high"

    def test_critical_fields_reasons_medium_impact_when_decent(self):
        cf = _make_cf(score=70, reasons=["Spécialisation absente"])
        tr = _make_text_result()
        out = aggregate_explainable_reasons(
            text_result=tr, cf_result=cf, applied_caps=[],
        )
        cf_reasons = [r for r in out if r.layer == "critical_fields"]
        assert cf_reasons[0].impact == "medium"

    def test_tampering_reasons_severity_from_score(self):
        tr = _make_text_result()
        cf = _make_cf()
        tamp = _make_tampering(score=0.85, flags=["ELA suspect"])
        out = aggregate_explainable_reasons(
            text_result=tr, cf_result=cf, tampering_result=tamp,
            applied_caps=[],
        )
        tamp_reasons = [r for r in out if r.layer == "tampering"]
        assert len(tamp_reasons) == 1
        assert tamp_reasons[0].impact == "high"

    def test_applied_caps_become_high_impact_reasons(self):
        tr = _make_text_result()
        cf = _make_cf()
        out = aggregate_explainable_reasons(
            text_result=tr, cf_result=cf,
            applied_caps=["template", "fraud_hard_cap"],
        )
        scoring = [r for r in out if r.layer == "scoring"]
        assert len(scoring) == 2
        assert all(r.impact == "high" for r in scoring)
        assert any("template" in r.signal for r in scoring)

    def test_low_coherence_adds_semantic_reason(self):
        tr = _make_text_result(coherence_score=0.1)
        cf = _make_cf()
        out = aggregate_explainable_reasons(
            text_result=tr, cf_result=cf, applied_caps=[],
        )
        sem = [r for r in out if r.layer == "semantic"]
        assert any("Cohérence" in r.signal for r in sem)


# ──────────────────────────────────────────────
# Intégration : pipeline complet (subscores → score)
# ──────────────────────────────────────────────

class TestEndToEndPipeline:
    def test_real_diploma_scores_high(self):
        """Pipeline complet sur un diplôme valide → score >= 70."""
        ocr = _make_ocr_result(text="Diplôme délivré à Mohamed Ben Ali", confidence=0.95)
        tr = _make_text_result(
            structure_count=3, semantic_score=0.8, coherence_score=0.7,
            has_certification_phrase=True, official_mention_found=True,
            has_degree_keyword=True, has_date=True, doc_type="diploma",
        )
        sig, stamp = _make_visual(sig=0.6, stamp=0.8)
        cf = _make_cf(score=85)
        tamp = _make_tampering(score=0.05)

        b = compute_subscores(
            ocr_result=ocr, text_result=tr,
            sig_result=sig, stamp_result=stamp,
            cf_result=cf, tampering_result=tamp,
        )
        score, caps, _ = compute_global_trust_score(
            b, raw_text_len=400,
            has_degree_keyword=True, has_date=True,
            is_template_without_identity=False,
        )
        assert score >= 70
        assert caps == []
        assert compute_risk_level(score) in ("trusted", "review_recommended")

    def test_template_without_identity_caps_at_35(self):
        """Pipeline complet sur un template flag → cap à 35."""
        ocr = _make_ocr_result(text="empty template ...", confidence=0.7)
        tr = _make_text_result(
            structure_count=1, semantic_score=0.4,
            has_degree_keyword=True, has_date=False,
            doc_type="diploma",
        )
        sig, stamp = _make_visual(sig=0.7, stamp=0.85)  # visuels forts
        cf = _make_cf(score=15, is_template=True)       # validator a flag
        tamp = _make_tampering(score=0.1)

        b = compute_subscores(
            ocr_result=ocr, text_result=tr,
            sig_result=sig, stamp_result=stamp,
            cf_result=cf, tampering_result=tamp,
        )
        score, caps, _ = compute_global_trust_score(
            b, raw_text_len=200,
            has_degree_keyword=True, has_date=False,
            is_template_without_identity=True,
        )
        assert score <= V7_TEMPLATE_FLAG_CAP
        assert "template_flag" in caps
        assert compute_risk_level(score) == "suspicious"

    def test_random_image_scores_low(self):
        """Pipeline complet sur du bruit → score très bas."""
        ocr = _make_ocr_result(text="abc", confidence=0.05)
        tr = _make_text_result()  # rien
        sig, stamp = _make_visual(sig=0.0, stamp=0.0)
        cf = _make_cf(score=0)

        b = compute_subscores(
            ocr_result=ocr, text_result=tr,
            sig_result=sig, stamp_result=stamp,
            cf_result=cf, tampering_result=None,
        )
        score, caps, _ = compute_global_trust_score(
            b, raw_text_len=3,
            has_degree_keyword=False, has_date=False,
        )
        # Cap no_content OU hallucination
        assert score <= max(V7_NO_CONTENT_CAP, V7_HALLUCINATION_CAP)
        assert compute_risk_level(score) == "highly_suspicious"


# ──────────────────────────────────────────────
# EXIF analysis — _analyze_exif unit tests
# ──────────────────────────────────────────────

class TestEXIFAnalysis:
    def test_photoshop_software_tag_detected(self):
        """JPEG avec tag Software=Photoshop → exif_score = 1.0 (signal fort)."""
        from app.services.tampering_detector import _analyze_exif

        mock_img = MagicMock()
        # Tag 305 = "Software" dans PIL ExifTags (EXIF standard IFD tag 0x0131)
        # getexif() returns an Exif object (dict-like) — mock as plain dict.
        mock_img.getexif.return_value = {305: "Adobe Photoshop 2024"}

        with patch("app.services.tampering_detector.Image.open", return_value=mock_img):
            score = _analyze_exif("/fake/test.jpg")

        assert score == 1.0

    def test_absent_exif_on_jpeg_is_minor_signal(self):
        """JPEG sans aucun EXIF → exif_score = 0.3 (signal mineur)."""
        from app.services.tampering_detector import _analyze_exif

        mock_img = MagicMock()
        # getexif() returns an empty Exif object (falsy) when no EXIF present.
        mock_img.getexif.return_value = {}

        with patch("app.services.tampering_detector.Image.open", return_value=mock_img):
            score = _analyze_exif("/fake/test.jpg")

        assert score == pytest.approx(0.3)


# ──────────────────────────────────────────────
# Cap template IA — diplôme généré visuellement parfait sans identité
# ──────────────────────────────────────────────

class TestAIDiplomaTemplateCap:
    def test_ai_diploma_capped_at_50_and_suspicious(self):
        """Diplôme IA : visual=90, CF=35, semantic=60 → cap template à 50 → suspicious.

        Un document généré par IA a une structure parfaite (semantic élevée) mais
        pas d'identité réelle (CF faible). Le cap détecte ce profil spécifique.
        """
        b = SubscoreBundle(
            structure_score=85, semantic_score=60,   # IA : sémantique ≥ 50
            critical_fields_score=35,                # < V7_TEMPLATE_CRITICAL_FIELDS_THRESHOLD (40)
            visual_authenticity_score=90,            # > V7_TEMPLATE_VISUAL_THRESHOLD (80)
            fraud_score=0, ocr_confidence_score=85,
        )
        score, caps, _ = compute_global_trust_score(
            b, raw_text_len=400,
            has_degree_keyword=True, has_date=True,
        )
        assert "template" in caps
        assert score <= V7_TEMPLATE_CAP   # 50
        assert compute_risk_level(score) == "suspicious"
