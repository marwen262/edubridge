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

from app.config import TAMPERING_ENABLED, TAMPERING_GATE_DIPLOMA_CONFIDENCE
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
    apply_v7_post_caps,
    compute_score,
    _clamp,
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

        # ── 9. Scoring V5 : structure + anti-fake + V5 layers ──
        score, confidence_level = compute_score(
            analysis_data,
            raw_text,
            ocr_confidence=ocr_confidence,
            semantic_score=text_result.semantic_score,
            structure_count=text_result.structure_count,
            doc_type=text_result.doc_type,
            coherence_score=text_result.coherence_score,
            keyword_penalty=text_result.keyword_penalty,
        )

        # ── 9.5. V7 — Post-processing caps ──
        # Plafonne les templates sans identité et applique la pénalité
        # tampering. Ne touche pas aux diplômes valides (cf_score >= 30,
        # fraud_score <= 60).
        fraud_score = (
            int(round(tampering_result.tampering_score * 100))
            if tampering_result is not None
            else 0
        )

        score, confidence_level, applied_caps = apply_v7_post_caps(
            score=score,
            confidence_level=confidence_level,
            semantic_score=text_result.semantic_score,
            critical_fields_score=cf_result.score,
            fraud_score=fraud_score,
            is_template_without_identity=cf_result.is_template_without_identity,
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

        # ── 11. Construire le payload V7 (additif) ──
        v7_payload = _build_v7_payload(
            score=score,
            text_result=text_result,
            cf_result=cf_result,
            tampering_result=tampering_result,
            sig_confidence=sig_result.confidence,
            stamp_confidence=stamp_result.confidence,
            ocr_confidence=ocr_confidence,
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

def _map_score_to_risk_level(score: float) -> str:
    """Mappe le score final V7 vers un risk_level."""
    if score >= 80:
        return "trusted"
    if score >= 60:
        return "review_recommended"
    if score >= 30:
        return "suspicious"
    return "highly_suspicious"


def _compute_visual_authenticity_score(
    sig_confidence: float,
    stamp_confidence: float,
) -> int:
    """Combine signature + cachet en un score 0–100."""
    combined = (sig_confidence * 0.5 + stamp_confidence * 0.5) * 100
    return int(round(min(100, max(0, combined))))


def _compute_structure_score(structure_count: int, max_count: int = 3) -> int:
    """Convertit structure_count (0–3) en score 0–100."""
    if max_count <= 0:
        return 0
    return int(round((structure_count / max_count) * 100))


def _collect_v7_priority_reasons(
    cf_result: CriticalFieldsResult,
    tampering_result: TamperingResult | None,
    applied_caps: list[str],
) -> list[str]:
    """Ajoute les raisons V7 prioritaires (ordre d'importance).

    Ces raisons doivent apparaître en tête de la liste quand elles
    s'appliquent — elles expliquent pourquoi un document a été
    plafonné par les caps V7.
    """
    out: list[str] = []
    if "template_without_identity_cap" in applied_caps:
        out.append("Template officiel sans identité étudiante")
    elif "critical_fields_low_cap" in applied_caps:
        out.append("Champs critiques d'identité incomplets")

    if "tampering_hard_cap" in applied_caps:
        out.append("Signaux de falsification élevés")
    elif "tampering_penalty" in applied_caps and tampering_result is not None:
        # Reprendre une raison concise du module tampering
        if tampering_result.flags:
            out.append(tampering_result.flags[0])
        else:
            out.append("Anomalies de cohérence visuelle détectées")

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


def _build_v7_payload(
    score: float,
    text_result,
    cf_result: CriticalFieldsResult,
    tampering_result: TamperingResult | None,
    sig_confidence: float,
    stamp_confidence: float,
    ocr_confidence: float,
    applied_caps: list[str],
) -> VerifyResponseV7Detail:
    """Construit le payload V7 additif.

    En Phase 1, certains sous-scores sont dérivés des signaux V6 plutôt
    que calculés indépendamment. La Phase 2 introduit le multi-score
    engine complet.
    """
    fraud_score = (
        int(round(tampering_result.tampering_score * 100))
        if tampering_result is not None
        else 0
    )

    subscores = V7Subscores(
        structure_score=_compute_structure_score(text_result.structure_count),
        semantic_score=int(round(text_result.semantic_score * 100)),
        critical_fields_score=cf_result.score,
        visual_authenticity_score=_compute_visual_authenticity_score(
            sig_confidence, stamp_confidence,
        ),
        fraud_score=fraud_score,
        ocr_confidence_score=int(round(ocr_confidence * 100)),
    )

    tampering_detail = V7TamperingDetail(
        ran=tampering_result is not None,
        fraud_score=fraud_score,
        signals=_build_tampering_signals(tampering_result),
    )

    # Reasons attribuées par couche
    reasons: list[V7Reason] = []
    for r in cf_result.reasons:
        impact = "high" if cf_result.score < 40 else "medium"
        reasons.append(V7Reason(layer="critical_fields", signal=r, impact=impact))
    if tampering_result is not None:
        for sig in _build_tampering_signals(tampering_result):
            reasons.append(V7Reason(
                layer="tampering",
                signal=sig["description"],
                impact=sig["severity"],
            ))
    if applied_caps:
        for cap in applied_caps:
            reasons.append(V7Reason(
                layer="scoring",
                signal=f"Plafond V7 appliqué : {cap}",
                impact="high",
            ))

    # Confidence par champ
    field_confidence = dict(cf_result.field_scores)

    return VerifyResponseV7Detail(
        document_type=text_result.doc_type,
        global_trust_score=int(round(score)),
        risk_level=_map_score_to_risk_level(score),
        subscores=subscores,
        field_confidence=field_confidence,
        tampering=tampering_detail,
        reasons=reasons,
    )
