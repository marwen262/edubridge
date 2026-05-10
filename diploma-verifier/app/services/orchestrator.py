"""
Orchestrateur v5 : coordonne l'analyse et retourne le format strict.

V5 — Enhanced anti-fraud pipeline :
  - Pipeline déterministe (même fichier → même score toujours)
  - Semantic scoring intégré dans le scoring pipeline
  - Anti-fake heuristics (random image rejection, suspicious pattern)
  - Structure-aware scoring (boost/penalty)
  - Confidence calibration avec semantic override
  - Raisons améliorées et contextuelles
  - Visual detectors toujours exécutés
  - V5: Document type classification + penalty
  - V5: Semantic coherence validation
  - V5: Keyword stuffing detection
  - V5: Visual consistency check
  - V5: Final safety rule

Pipeline :
  1. Conversion → Prétraitement → OCR (avec rotation + sélection sémantique)
  2. Analyse textuelle sémantique V5 (classification, coherence, stuffing)
  3. Détection signature + cachet (toujours exécutées)
  4. Scoring V5 : dynamic weights + structure + anti-fake + V5 layers
  5. Construction de la réponse stricte {score, confidence_level, reasons}
"""

from __future__ import annotations

import hashlib
import random
import time

from app.config import (
    TAMPERING_ENABLED,
    TAMPERING_GATE_DIPLOMA_CONFIDENCE,
    V7_DIVERGENCE_LOG_THRESHOLD,
)
from app.models.response import (
    V7Reason,
    V7Subscores,
    V7TamperingDetail,
    VerifyResponse,
    VerifyResponseV7Detail,
)
from app.services.critical_fields_validator import (
    CriticalFieldsResult,
    validate_critical_fields,
)
from app.services.ocr_service import extract_text, normalize_ocr_text, compute_text_hash
from app.services.scoring_engine import (
    SubscoreBundle,
    _clamp,
    aggregate_explainable_reasons,
    compute_global_trust_score,
    compute_risk_level,
    compute_score,
    compute_subscores,
    risk_level_to_confidence,
)
from app.services.signature_detector import detect_signature
from app.services.stamp_detector import detect_stamp
from app.services.tampering_detector import TamperingResult, detect_tampering
from app.services.text_analyzer import analyze_text
from app.utils.image_converter import convert_file
from app.utils.logger import log_analysis_result, logger

# Nombre maximal de raisons retournées
_MAX_REASONS = 5


def _deterministic_low_score(content_hash: str, lo: float, hi: float) -> float:
    """Score déterministe dans [lo, hi] basé sur un hash."""
    seed = int(content_hash[:12], 16)
    rng = random.Random(seed)
    return round(rng.uniform(lo, hi), 1)


def _content_hash(text: str, file_path: str) -> str:
    """Hash combiné du texte NORMALISÉ et du chemin fichier.

    Utilise le texte normalisé (pas brut) pour garantir
    le déterminisme même si l'OCR brut varie légèrement.
    """
    clean = normalize_ocr_text(text) if text else "empty_document"
    if not clean:
        clean = "empty_document"

    h = hashlib.sha256()
    h.update(clean.encode("utf-8"))
    h.update(file_path.encode("utf-8", errors="replace"))
    return h.hexdigest()


def _is_document_truly_empty(
    raw_text: str,
    ocr_confidence: float,
    sig_confidence: float,
    stamp_confidence: float,
) -> bool:
    """Détermine si le document est VRAIMENT vide.

    Un document est vide SEULEMENT si :
      - Aucun texte détecté
      - ET aucune signature détectée
      - ET aucun cachet détecté

    Cela évite de rejeter un document scanné à faible
    qualité OCR mais qui contient des éléments visuels.
    """
    has_no_text = not raw_text or len(raw_text.strip()) < 10
    has_no_visual = sig_confidence < 0.15 and stamp_confidence < 0.15
    return has_no_text and has_no_visual


async def analyze_document(
    file_path: str,
    mime_type: str,
    filename: str,
    file_size: int,
    country_hint: str | None = None,
) -> VerifyResponse:
    """Pipeline complet d'analyse d'un document.

    V5 — Enhanced anti-fraud pipeline :
      1. Conversion + prétraitement + OCR (sélection sémantique)
      2. Analyse textuelle sémantique V5
      3. Détection visuelle (signature + cachet)
      4. Scoring V5 avec structure + anti-fake + V5 layers
      5. Construction de réponse avec raisons contextuelles

    Retourne UNIQUEMENT {score, confidence_level, reasons}.
    """
    start = time.time()

    try:
        logger.info("Début de l'analyse V5 : %s", filename)

        # ── 1. Conversion en image ──
        _pil_image, cv_image = convert_file(file_path, mime_type)

        # ── 2. OCR (avec rotation auto + multi-pass sémantique) ──
        # Note : pas de preprocess() ici — le service OCR gère son
        # propre pipeline (rotation + grayscale + upscale x2). Une
        # binarisation préalable dégrade fortement Tesseract LSTM.
        ocr_result = extract_text(cv_image)
        raw_text = ocr_result.full_text
        ocr_confidence = ocr_result.ocr_confidence
        language = ocr_result.language_detected
        c_hash = _content_hash(raw_text, file_path)

        # ── 4. Détection signature + cachet (TOUJOURS exécutées) ──
        # Exécutées sur l'image originale, pas la prétraitée
        sig_result = detect_signature(cv_image)
        stamp_result = detect_stamp(cv_image)

        # ── Logging diagnostique (interne uniquement) ──
        logger.info(
            "ORCH V5 DIAG — ocr_len=%d | ocr_conf=%.3f | "
            "sig_conf=%.2f | stamp_conf=%.2f | hash=%s",
            len(raw_text),
            ocr_confidence,
            sig_result.confidence,
            stamp_result.confidence,
            c_hash[:16],
        )

        # ── 5. Early return : document VRAIMENT vide ──
        if _is_document_truly_empty(
            raw_text, ocr_confidence,
            sig_result.confidence, stamp_result.confidence,
        ):
            score = _deterministic_low_score(c_hash, 5.0, 18.0)
            score = _clamp(score)

            reasons = [
                "Document sans caractéristiques officielles visibles",
            ]
            if ocr_confidence == 0.0:
                reasons.insert(0, "Texte non détecté dans le document")

            elapsed = int((time.time() - start) * 1000)
            log_analysis_result(
                filename=filename, country="unknown",
                score=score, verdict="low",
                processing_time_ms=elapsed, flags=[],
            )
            return VerifyResponse(
                score=score,
                confidence_level="low",
                reasons=reasons[:_MAX_REASONS],
            )

        # ── 6. Analyse textuelle sémantique V5 ──
        text_result = analyze_text(raw_text, language)

        # ── 6.5. V7 — Validation des champs critiques ──
        # Léger : ne refait pas l'extraction, consomme les signaux
        # déjà produits par analyze_text() + spaCy/regex.
        cf_result = validate_critical_fields(
            raw_text=raw_text,
            analysis_result=text_result,
            ocr_confidence=ocr_confidence,
        )
        logger.info(
            "V7 critical_fields — score=%d | confidence=%.2f | template=%s",
            cf_result.score, cf_result.confidence,
            cf_result.is_template_without_identity,
        )

        # ── 7. Early return si pas un diplôme ET pas de signaux visuels ──
        # V6: seuil textuel abaissé à 0.2 — les diplômes arabes ont
        # souvent une diploma_confidence faible (regex name/inst Latin
        # uniquement). On évite ainsi les faux rejets.
        if text_result.diploma_confidence < 0.2:
            visual_signal = (
                sig_result.confidence * 0.5
                + stamp_result.confidence * 0.5
            )

            if visual_signal < 0.3:
                # Ni le texte ni les signaux visuels ne confirment un diplôme
                score = _deterministic_low_score(c_hash, 5.0, 25.0)
                score = _clamp(score)

                reasons = _build_rejection_reasons(
                    text_result, ocr_confidence,
                )

                elapsed = int((time.time() - start) * 1000)
                log_analysis_result(
                    filename=filename, country="unknown",
                    score=score, verdict="low",
                    processing_time_ms=elapsed, flags=[],
                )
                return VerifyResponse(
                    score=score,
                    confidence_level="low",
                    reasons=reasons[:_MAX_REASONS],
                )

            # Signaux visuels forts → continuer le scoring normal
            logger.info(
                "diploma_confidence basse (%.2f) mais signaux visuels "
                "forts (%.2f) — poursuite du scoring V5",
                text_result.diploma_confidence,
                visual_signal,
            )

        # ── 7.5. V7 — Détection de falsification (gated) ──
        # Activée uniquement sur les documents qui ressemblent à un
        # diplôme (gate diploma_confidence) ET si TAMPERING_ENABLED.
        # Wrappé dans try/except : en cas d'échec, on dégrade gracieusement
        # avec fraud_score=0 et on continue le pipeline.
        tampering_result: TamperingResult | None = None
        if (
            TAMPERING_ENABLED
            and text_result.diploma_confidence >= TAMPERING_GATE_DIPLOMA_CONFIDENCE
        ):
            try:
                tampering_result = detect_tampering(cv_image, file_path)
                logger.info(
                    "V7 tampering — score=%.2f | ELA_regions=%d | flags=%d",
                    tampering_result.tampering_score,
                    tampering_result.ela_suspicious_regions,
                    len(tampering_result.flags),
                )
            except Exception as exc:
                logger.warning(
                    "V7 tampering detection failed (%s) — graceful "
                    "degradation, fraud_score=0", exc,
                )
                tampering_result = None

        # ── 8. Construire les données pour le scoring V5 ──
        analysis_data: dict = {
            "has_person_name": 1.0 if text_result.has_person_name else 0.0,
            "has_institution": 1.0 if text_result.has_institution else 0.0,
            "has_degree_keyword": 1.0 if text_result.has_degree_keyword else 0.0,
            "has_date": 1.0 if text_result.has_date else 0.0,
            "signature_confidence": sig_result.confidence,
            "stamp_confidence": stamp_result.confidence,
            "official_mention": 1.0 if text_result.official_mention_found else 0.0,
            "certification_phrase": (
                1.0 if text_result.has_certification_phrase else 0.0
            ),
            "keyword_density": text_result.keyword_density,
        }

        # ── 9a. V6 (shadow run) — pour suivre la divergence pendant migration ──
        score_v6, confidence_v6 = compute_score(
            analysis_data,
            raw_text,
            ocr_confidence=ocr_confidence,
            semantic_score=text_result.semantic_score,
            structure_count=text_result.structure_count,
            doc_type=text_result.doc_type,
            coherence_score=text_result.coherence_score,
            keyword_penalty=text_result.keyword_penalty,
        )

        # ── 9b. V7 Phase 2 — Multi-score engine (path principal) ──
        subscores: SubscoreBundle = compute_subscores(
            ocr_result=ocr_result,
            text_result=text_result,
            sig_result=sig_result,
            stamp_result=stamp_result,
            cf_result=cf_result,
            tampering_result=tampering_result,
        )

        score_v7_int, applied_caps, weights_used = compute_global_trust_score(
            subscores,
            raw_text_len=len(raw_text.strip()) if raw_text else 0,
            has_degree_keyword=text_result.has_degree_keyword,
            has_date=text_result.has_date,
            is_template_without_identity=cf_result.is_template_without_identity,
        )

        risk_level = compute_risk_level(score_v7_int)
        confidence_level = risk_level_to_confidence(risk_level)
        score = float(score_v7_int)

        # ── 9c. Logging de divergence V6 vs V7 ──
        delta = abs(score_v7_int - score_v6)
        if delta > V7_DIVERGENCE_LOG_THRESHOLD:
            logger.warning(
                "V6/V7 divergence (%.1f pts) — V6=%.1f (%s) | V7=%d (%s, %s)"
                " | applied_caps=%s",
                delta, score_v6, confidence_v6, score_v7_int,
                confidence_level, risk_level, applied_caps,
            )
        else:
            logger.info(
                "V6/V7 alignés — V6=%.1f V7=%d (delta=%.1f)",
                score_v6, score_v7_int, delta,
            )

        # ── 10. Construire les raisons V5 (+ raisons V7 ajoutées) ──
        reasons = _build_reasons_v5(
            text_result, sig_result, stamp_result,
            ocr_confidence=ocr_confidence,
            score=score,
        )
        # Injecter les raisons V7 prioritaires (template, tampering)
        # devant les raisons V5 si elles ne sont pas déjà couvertes.
        v7_priority_reasons = _collect_v7_priority_reasons(
            cf_result, tampering_result, applied_caps,
        )
        if v7_priority_reasons:
            reasons = (v7_priority_reasons + reasons)[:_MAX_REASONS]

        # ── 11. Construire le payload V7 (Phase 2 — sous-scores réels) ──
        v7_payload = _build_v7_payload_phase2(
            score=score,
            risk_level=risk_level,
            subscores=subscores,
            text_result=text_result,
            cf_result=cf_result,
            tampering_result=tampering_result,
            applied_caps=applied_caps,
        )

        # ── 12. Log ──
        elapsed = int((time.time() - start) * 1000)
        log_analysis_result(
            filename=filename,
            country="unknown",
            score=score,
            verdict=confidence_level,
            processing_time_ms=elapsed,
            flags=[],
        )

        return VerifyResponse(
            score=score,
            confidence_level=confidence_level,
            reasons=reasons,
            v7=v7_payload,
        )

    except Exception as e:
        logger.error("Erreur fatale lors de l'analyse de %s : %s", filename, e)
        # En cas d'erreur, retourner un score bas déterministe
        fallback_hash = hashlib.sha256(
            filename.encode("utf-8", errors="replace"),
        ).hexdigest()
        score = _deterministic_low_score(fallback_hash, 5.0, 20.0)
        score = _clamp(score)
        return VerifyResponse(
            score=score,
            confidence_level="low",
            reasons=["Erreur lors de l'analyse du document"],
        )


# ──────────────────────────────────────────────
# Rejection reasons (early return)
# ──────────────────────────────────────────────

def _build_rejection_reasons(
    text_result,
    ocr_confidence: float,
) -> list[str]:
    """Construit les raisons pour un rejet anticipé (non-diplôme).

    Utilise des raisons descriptives et contextuelles.
    """
    reasons: list[str] = []

    if text_result.structure_count == 0:
        reasons.append("Document non reconnu comme académique")
    else:
        reasons.append("Structure du document incomplète")

    if text_result.keyword_density == 0.0:
        reasons.append("Absence de mentions académiques clés")

    if ocr_confidence == 0.0:
        reasons.append("Texte non détecté dans le document")

    # Add specific missing fields
    if not text_result.has_person_name and len(reasons) < _MAX_REASONS:
        reasons.append("Nom du titulaire non détecté")

    if not reasons:
        reasons.append("Document non reconnu comme académique")

    return reasons[:_MAX_REASONS]


# ──────────────────────────────────────────────
# V5 Reasons builder
# ──────────────────────────────────────────────

def _build_reasons_v5(
    text_result,
    sig_result,
    stamp_result,
    ocr_confidence: float = 1.0,
    score: float = 50.0,
) -> list[str]:
    """Construit la liste de raisons V5 — descriptives et contextuelles.

    V5 améliorations :
      - Raisons positives pour les documents bien validés
      - Raisons descriptives plutôt que techniques
      - V5: Raisons pour doc_type, cohérence, keyword stuffing
      - Maximum 5 raisons, ordonnées par importance
    """
    reasons: list[str] = []

    # ── Raisons positives (pour les bons scores) ──
    if score >= 60:
        if text_result.has_certification_phrase and len(reasons) < _MAX_REASONS:
            reasons.append("Formulation de certification détectée")
        if text_result.structure_count >= 3 and len(reasons) < _MAX_REASONS:
            reasons.append("Informations académiques cohérentes")
        if stamp_result.confidence >= 0.5 and len(reasons) < _MAX_REASONS:
            reasons.append("Présence de cachet officiel")
        if sig_result.confidence >= 0.5 and len(reasons) < _MAX_REASONS:
            reasons.append("Signature manuscrite détectée")

    # ── V5: Document type reason ──
    if text_result.doc_type != "diploma" and len(reasons) < _MAX_REASONS:
        reasons.append("Type de document non académique")

    # ── V5: Coherence reason ──
    if text_result.coherence_score < 0.5 and len(reasons) < _MAX_REASONS:
        reasons.append("Cohérence sémantique faible")

    # ── V5: Keyword stuffing reason ──
    if text_result.keyword_penalty > 0.0 and len(reasons) < _MAX_REASONS:
        reasons.append("Utilisation excessive de mots-clés")

    # ── Raisons négatives ──
    # OCR failure
    if ocr_confidence == 0.0 and len(reasons) < _MAX_REASONS:
        reasons.append("Texte non détecté dans le document")

    # Structure
    if text_result.structure_count < 2 and len(reasons) < _MAX_REASONS:
        reasons.append("Structure du document incomplète")

    # Keyword density
    if text_result.keyword_density == 0.0 and ocr_confidence > 0.0:
        if len(reasons) < _MAX_REASONS:
            reasons.append("Absence de mentions académiques clés")

    # Specific missing fields (V6: institution non requise)
    if not text_result.has_person_name and len(reasons) < _MAX_REASONS:
        reasons.append("Nom du titulaire non détecté")

    if not text_result.has_degree_keyword and len(reasons) < _MAX_REASONS:
        reasons.append("Type de diplôme non reconnu")

    # Visual signals
    if sig_result.confidence < 0.3 and len(reasons) < _MAX_REASONS:
        reasons.append("Signature absente ou incertaine")

    if stamp_result.confidence < 0.3 and len(reasons) < _MAX_REASONS:
        reasons.append("Cachet officiel absent")

    # Official mentions
    if not text_result.official_mention_found and len(reasons) < _MAX_REASONS:
        reasons.append("Structure partiellement reconnue")

    # Fallback
    if not reasons:
        if score >= 50:
            reasons.append("Document partiellement vérifié")
        else:
            reasons.append("Document sans caractéristiques officielles visibles")

    return reasons[:_MAX_REASONS]


# ──────────────────────────────────────────────
# V7 helpers
# ──────────────────────────────────────────────

def _collect_v7_priority_reasons(
    cf_result: CriticalFieldsResult,
    tampering_result: TamperingResult | None,
    applied_caps: list[str],
) -> list[str]:
    """Convertit les caps V7 Phase 2 en raisons user-facing prioritaires.

    Caps Phase 2 (depuis scoring_engine.compute_global_trust_score) :
      - no_content        → document vide/illisible
      - hallucination     → texte trop court / détection hallucinée
      - semantic_ceiling  → sémantique trop faible pour le score
      - template          → visual fort + critical_fields faible
      - template_flag     → drapeau explicit du critical_fields_validator
      - fraud_hard_cap    → fraud_score > 80
    """
    out: list[str] = []

    if "template_flag" in applied_caps or "template" in applied_caps:
        out.append("Template officiel sans identité étudiante")
    if "fraud_hard_cap" in applied_caps:
        out.append("Signaux de falsification élevés")
        # Reprendre éventuellement un flag concret du tampering
        if tampering_result and tampering_result.flags:
            top_flag = tampering_result.flags[0]
            if top_flag not in out:
                out.append(top_flag)
    if "no_content" in applied_caps:
        out.append("Document sans contenu lisible")
    if "hallucination" in applied_caps:
        out.append("Texte insuffisant — analyse incertaine")

    return out


def _build_tampering_signals(
    tampering_result: TamperingResult | None,
) -> list[dict]:
    """Convertit les flags du tampering_detector en signaux structurés."""
    if tampering_result is None:
        return []

    signals: list[dict] = []

    # ELA suspicious regions
    if tampering_result.ela_suspicious_regions > 0:
        severity = (
            "high" if tampering_result.ela_suspicious_regions > 5
            else "medium" if tampering_result.ela_suspicious_regions > 2
            else "low"
        )
        signals.append({
            "type": "ela_anomaly",
            "severity": severity,
            "description": (
                f"{tampering_result.ela_suspicious_regions} régions "
                "avec niveau d'erreur ELA anormal"
            ),
        })

    # Generic flags (bg uniformity, metadata, copy-paste)
    for flag in tampering_result.flags:
        # Skip ELA flag déjà inclus ci-dessus
        if "ELA" in flag and tampering_result.ela_suspicious_regions > 0:
            continue
        signals.append({
            "type": "anomaly",
            "severity": "medium",
            "description": flag,
        })

    return signals


def _build_v7_payload_phase2(
    *,
    score: float,
    risk_level: str,
    subscores: SubscoreBundle,
    text_result,
    cf_result: CriticalFieldsResult,
    tampering_result: TamperingResult | None,
    applied_caps: list[str],
) -> VerifyResponseV7Detail:
    """Construit le payload V7 à partir des vrais sous-scores (Phase 2).

    Différence avec Phase 1 : les sous-scores sont calculés par le moteur
    de scoring V7 (compute_subscores) plutôt que dérivés inline. Les
    raisons sont structurées par couche via aggregate_explainable_reasons.
    """
    v7_subscores = V7Subscores(
        structure_score=subscores.structure_score,
        semantic_score=subscores.semantic_score,
        critical_fields_score=subscores.critical_fields_score,
        visual_authenticity_score=subscores.visual_authenticity_score,
        fraud_score=subscores.fraud_score,
        ocr_confidence_score=subscores.ocr_confidence_score,
    )

    tampering_detail = V7TamperingDetail(
        ran=tampering_result is not None,
        fraud_score=subscores.fraud_score,
        signals=_build_tampering_signals(tampering_result),
    )

    # Aggrégation explicable des reasons (toutes couches)
    structured_reasons = aggregate_explainable_reasons(
        text_result=text_result,
        cf_result=cf_result,
        tampering_result=tampering_result,
        applied_caps=applied_caps,
    )

    v7_reasons: list[V7Reason] = [
        V7Reason(layer=r.layer, signal=r.signal, impact=r.impact)
        for r in structured_reasons
    ]

    return VerifyResponseV7Detail(
        document_type=text_result.doc_type,
        global_trust_score=int(round(score)),
        risk_level=risk_level,
        subscores=v7_subscores,
        field_confidence=dict(cf_result.field_scores),
        tampering=tampering_detail,
        reasons=v7_reasons,
    )
