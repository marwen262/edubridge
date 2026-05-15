"""
Moteur de scoring probabiliste et déterministe.

V5 — Enhanced anti-fraud scoring :
  - Score entre 3 et 98 (jamais 0 ni 100).
  - Bruit déterministe basé sur le texte NORMALISÉ.
  - Pondération dynamique (OCR-aware).
  - Structure-aware : ≥3 composantes → boost, <2 → penalty.
  - Anti-fake heuristics : random image ceiling, suspicious patterns.
  - Keyword density penalty si aucun mot-clé académique.
  - Confidence calibration avec semantic override.
  - V5: Document type penalty (certificate/unknown).
  - V5: Coherence boost.
  - V5: Keyword stuffing penalty.
  - V5: Visual consistency check (stamp/signature mismatch).
  - V5: Final safety rule (block false positives).
  - V6: Visual boost (weak OCR + strong visual → floor at 60).
  - V6: Safety ceiling (no semantic → cap boosted score at 70).
  - Retourne (score, confidence_level).
"""

from __future__ import annotations

import hashlib
import random
import re
import unicodedata

from app.utils.logger import logger


# ──────────────────────────────────────────────
# Poids des critères (total ≈ 1.0)
# Séparés en text-dependent et visual-only
# ──────────────────────────────────────────────
TEXT_WEIGHTS: dict[str, float] = {
    # V6: has_institution retiré — un diplôme sans institution
    # détectée ne doit pas être pénalisé. Le poids 0.15 est
    # redistribué proportionnellement aux autres signaux textuels.
    "has_person_name":    0.20,
    "has_degree_keyword": 0.16,
    "has_date":           0.10,
    "official_mention":   0.10,
    "certification_phrase": 0.09,
}

VISUAL_WEIGHTS: dict[str, float] = {
    "signature_confidence": 0.18,
    "stamp_confidence":     0.17,
}

# Tous les poids combinés (pour compatibilité)
WEIGHTS: dict[str, float] = {**TEXT_WEIGHTS, **VISUAL_WEIGHTS}


# ──────────────────────────────────────────────
# Fixed seed for empty documents
# ──────────────────────────────────────────────
_EMPTY_SEED = "empty_document"


# ──────────────────────────────────────────────
# Structure-aware thresholds
# V6: institution retirée du structure_count (max=3 désormais).
# Seuils abaissés pour ne pas pénaliser un diplôme sans institution.
# ──────────────────────────────────────────────
_STRUCTURE_BOOST_THRESHOLD = 2     # ≥2 of 3 core fields → boost
_STRUCTURE_PENALTY_THRESHOLD = 1   # <1 core fields → penalty
_STRUCTURE_BOOST_FACTOR = 1.12     # 12% boost
_STRUCTURE_PENALTY_FACTOR = 0.80   # 20% penalty

# Anti-fake ceiling: max score for random/non-document images
_RANDOM_IMAGE_CEILING = 20.0
_SUSPICIOUS_VISUAL_ONLY_CEILING = 35.0

# Keyword density penalty threshold
_MIN_KEYWORD_DENSITY = 0.01


def _normalize_for_hash(text: str) -> str:
    """Normalise le texte avant hashing pour garantir le déterminisme.

    Applique la même normalisation que ocr_service.normalize_ocr_text
    mais sans dépendance circulaire.
    """
    if not text:
        return _EMPTY_SEED

    # Unicode NFKD → strip accents
    normalized = unicodedata.normalize("NFKD", text)
    normalized = "".join(c for c in normalized if not unicodedata.combining(c))

    # Lowercase
    normalized = normalized.lower()

    # Whitespace normalization
    normalized = normalized.replace("\n", " ").replace("\r", " ").replace("\t", " ")

    # Remove non-alphanumeric (keep spaces)
    normalized = re.sub(r"[^a-z0-9\s]", "", normalized)

    # Collapse spaces
    normalized = re.sub(r"\s+", " ", normalized).strip()

    if not normalized:
        return _EMPTY_SEED

    return normalized


def _deterministic_noise(text: str, amplitude: float = 5.0) -> float:
    """Génère un bruit déterministe basé sur le hash du texte NORMALISÉ.

    Le même texte produit toujours le même décalage.
    Plage : [-amplitude, +amplitude].
    """
    clean = _normalize_for_hash(text)
    digest = hashlib.sha256(clean.encode("utf-8")).hexdigest()
    seed = int(digest[:12], 16)
    rng = random.Random(seed)
    return rng.uniform(-amplitude, amplitude)


def _clamp(value: float, lo: float = 3.0, hi: float = 98.0) -> float:
    """Clamp une valeur dans [lo, hi]."""
    return max(lo, min(hi, value))


def determine_confidence_level(
    score: float,
    semantic_score: float = 0.0,
) -> str:
    """Détermine le niveau de confiance à partir du score.

    V4 — Calibration globale avec override sémantique :
      - score >= 70  → high
      - score >= 30  → medium
      - sinon        → low

    Override :
      - semantic_score >= 0.7 + score >= 55 → push to high
      - semantic_score < 0.3 → downgrade one level
    """
    # Base level from score
    if score >= 70:
        base_level = "high"
    elif score >= 30:
        base_level = "medium"
    else:
        base_level = "low"

    # Semantic override: strong semantic can push up
    if semantic_score >= 0.7 and score >= 55 and base_level == "medium":
        logger.debug(
            "Confidence override: medium → high (semantic=%.2f, score=%.1f)",
            semantic_score, score,
        )
        return "high"

    # Semantic downgrade: weak semantic can push down
    if semantic_score < 0.3 and base_level == "high":
        logger.debug(
            "Confidence downgrade: high → medium (semantic=%.2f)",
            semantic_score,
        )
        return "medium"

    if semantic_score < 0.15 and base_level == "medium":
        logger.debug(
            "Confidence downgrade: medium → low (semantic=%.2f)",
            semantic_score,
        )
        return "low"

    return base_level


def _compute_dynamic_weights(
    analysis: dict,
    ocr_confidence: float,
) -> dict[str, float]:
    """Calcule les poids dynamiques en fonction de la qualité OCR.

    Si l'OCR a échoué (confidence == 0), les poids text-dependent
    sont réduits à 0 et redistribués aux signaux visuels.
    Si l'OCR est partiel (0 < confidence < 0.3), les poids text
    sont réduits proportionnellement.
    """
    if ocr_confidence >= 0.3:
        # OCR fiable → poids normaux
        return dict(WEIGHTS)

    if ocr_confidence == 0.0:
        # OCR totalement absent → ne compter que les signaux visuels
        total_visual = sum(VISUAL_WEIGHTS.values())
        if total_visual == 0:
            return dict(WEIGHTS)

        # Redistribuer le poids total aux signaux visuels
        scale_factor = 1.0 / total_visual
        dynamic: dict[str, float] = {}
        for key in TEXT_WEIGHTS:
            dynamic[key] = 0.0
        for key, w in VISUAL_WEIGHTS.items():
            dynamic[key] = w * scale_factor
        return dynamic

    # OCR partiel (0 < confidence < 0.3) → réduction proportionnelle
    text_scale = ocr_confidence / 0.3  # 0.0 – 1.0
    visual_bonus = (1.0 - text_scale) * sum(TEXT_WEIGHTS.values())
    total_visual = sum(VISUAL_WEIGHTS.values())

    dynamic = {}
    for key, w in TEXT_WEIGHTS.items():
        dynamic[key] = w * text_scale
    for key, w in VISUAL_WEIGHTS.items():
        bonus = (visual_bonus * w / total_visual) if total_visual > 0 else 0.0
        dynamic[key] = w + bonus

    return dynamic


def _apply_structure_adjustment(
    raw_score: float,
    structure_count: int,
) -> float:
    """Applique le boost/penalty structurel.

    ≥3 composantes structurelles → +12% boost
    <2 composantes → -20% penalty
    """
    if structure_count >= _STRUCTURE_BOOST_THRESHOLD:
        adjusted = raw_score * _STRUCTURE_BOOST_FACTOR
        logger.debug(
            "Structure boost: %.1f → %.1f (count=%d)",
            raw_score, adjusted, structure_count,
        )
        return adjusted

    if structure_count < _STRUCTURE_PENALTY_THRESHOLD:
        adjusted = raw_score * _STRUCTURE_PENALTY_FACTOR
        logger.debug(
            "Structure penalty: %.1f → %.1f (count=%d)",
            raw_score, adjusted, structure_count,
        )
        return adjusted

    return raw_score


def _apply_anti_fake_ceiling(
    raw_score: float,
    analysis: dict,
    ocr_confidence: float,
    semantic_score: float,
    structure_count: int,
) -> float:
    """Applique les plafonds anti-fraude.

    1. Random image : no text + no stamp + no signature → cap at 20
    2. Suspicious : high stamp + no text + no structure → cap at 35
    3. Keyword density : text exists but no academic keywords → penalty
    """
    has_text = ocr_confidence > 0.0
    sig_conf = float(analysis.get("signature_confidence", 0.0))
    stamp_conf = float(analysis.get("stamp_confidence", 0.0))
    keyword_density = float(analysis.get("keyword_density", 0.0))

    # 1. Random image detection
    # No text + no circular stamp + no signature → score must stay ≤ 20
    if not has_text and stamp_conf < 0.2 and sig_conf < 0.2:
        if raw_score > _RANDOM_IMAGE_CEILING:
            logger.info(
                "Anti-fake: random image ceiling applied (%.1f → %.1f)",
                raw_score, _RANDOM_IMAGE_CEILING,
            )
            return _RANDOM_IMAGE_CEILING

    # 2. Suspicious pattern
    # High stamp + no text + no structure → reduce confidence
    if stamp_conf > 0.5 and not has_text and structure_count < 1:
        if raw_score > _SUSPICIOUS_VISUAL_ONLY_CEILING:
            logger.info(
                "Anti-fake: suspicious visual-only ceiling applied "
                "(%.1f → %.1f)",
                raw_score, _SUSPICIOUS_VISUAL_ONLY_CEILING,
            )
            return _SUSPICIOUS_VISUAL_ONLY_CEILING

    # 3. Keyword density penalty
    # Text exists but contains no academic keywords → penalty
    if has_text and keyword_density < _MIN_KEYWORD_DENSITY and semantic_score < 0.2:
        penalty = 0.75  # 25% reduction
        adjusted = raw_score * penalty
        logger.info(
            "Anti-fake: keyword density penalty (%.1f → %.1f | "
            "density=%.3f)",
            raw_score, adjusted, keyword_density,
        )
        return adjusted

    return raw_score


def compute_score(
    analysis: dict,
    raw_text: str,
    ocr_confidence: float = 1.0,
    semantic_score: float = 0.0,
    structure_count: int = 2,
    doc_type: str = "unknown",
    coherence_score: float = 0.0,
    keyword_penalty: float = 0.0,
) -> tuple[float, str]:
    """Calcule le score probabiliste et le confidence_level.

    V5 — Enhanced anti-fraud scoring :
      1. Dynamic weight computation (OCR-aware)
      2. Weighted sum of signals
      3. Structure-aware boost/penalty
      4. Anti-fake heuristics (ceiling/penalty)
      5. V5: Document type penalty
      6. V5: Coherence boost
      7. V5: Keyword stuffing penalty
      8. V5: Visual consistency check
      9. Deterministic noise
      10. V5: Final safety rule
      11. Clamp + confidence calibration with semantic override

    Parameters
    ----------
    analysis : dict
        Clés attendues (chacune entre 0.0 et 1.0) :
        - has_person_name        (0 ou 1)
        - has_institution        (0 ou 1)
        - has_degree_keyword     (0 ou 1)
        - has_date               (0 ou 1)
        - signature_confidence   (0.0 – 1.0)
        - stamp_confidence       (0.0 – 1.0)
        - official_mention       (0 ou 1)
        - certification_phrase   (0 ou 1)
        - keyword_density        (0.0 – 1.0)
    raw_text : str
        Texte extrait (utilisé comme graine de bruit APRÈS normalisation).
    ocr_confidence : float
        Confiance OCR (0.0 – 1.0). Utilisée pour pondération dynamique.
    semantic_score : float
        Score sémantique (0.0 – 1.0). Utilisé pour calibration.
    structure_count : int
        Nombre de composantes structurelles présentes (0–4).
    doc_type : str
        Type de document ("diploma", "certificate", "unknown").
    coherence_score : float
        Score de cohérence sémantique (0.0 – 1.0).
    keyword_penalty : float
        Pénalité pour keyword stuffing (0.0 – 0.3).

    Returns
    -------
    (score, confidence_level)
    """
    # ── 1. Dynamic weights ──
    weights = _compute_dynamic_weights(analysis, ocr_confidence)

    # ── 2. Weighted sum → base_score sur [0, 1] ──
    base: float = 0.0
    for key, weight in weights.items():
        value = float(analysis.get(key, 0.0))
        base += weight * value

    # Normaliser sur [0, 100]
    raw_score = base * 100.0

    # ── 3. Structure-aware adjustment ──
    raw_score = _apply_structure_adjustment(raw_score, structure_count)

    # ── 4. Anti-fake heuristics ──
    raw_score = _apply_anti_fake_ceiling(
        raw_score, analysis, ocr_confidence,
        semantic_score, structure_count,
    )

    # ── 5. V5: Document type penalty ──
    if doc_type == "certificate":
        raw_score *= 0.80  # -20% for non-diploma documents
        logger.debug(
            "V5 doc_type penalty: certificate → -20%% (score=%.1f)",
            raw_score,
        )
    elif doc_type == "unknown":
        raw_score *= 0.90  # -10% for unclassified documents
        logger.debug(
            "V5 doc_type penalty: unknown → -10%% (score=%.1f)",
            raw_score,
        )

    # ── 6. V5: Coherence boost ──
    if coherence_score > 0.5:
        raw_score *= 1.05  # +5% for coherent academic phrasing
        logger.debug(
            "V5 coherence boost: +5%% (coherence=%.2f, score=%.1f)",
            coherence_score, raw_score,
        )

    # ── 7. V5: Keyword stuffing penalty ──
    if keyword_penalty > 0.0:
        raw_score -= keyword_penalty * 100.0  # Convert to score scale
        logger.debug(
            "V5 keyword stuffing penalty: -%.1f (score=%.1f)",
            keyword_penalty * 100.0, raw_score,
        )

    # ── 8. V5: Visual consistency check ──
    stamp_conf = float(analysis.get("stamp_confidence", 0.0))
    sig_conf = float(analysis.get("signature_confidence", 0.0))
    if stamp_conf > 0.8 and sig_conf < 0.1:
        # Suspicious mismatch: high stamp but no signature
        raw_score -= 0.2 * 100.0  # -20 points
        logger.debug(
            "V5 visual consistency penalty: stamp=%.2f, sig=%.2f → -20pts",
            stamp_conf, sig_conf,
        )

    # ── 9. Deterministic noise ──
    noise = _deterministic_noise(raw_text, amplitude=4.0)
    raw_score += noise

    # ── 10. V5: Final safety rule ──
    if semantic_score < 0.3 and structure_count < 2:
        raw_score = min(raw_score, 35.0)
        logger.debug(
            "V5 safety rule: semantic=%.2f, struct=%d → capped at 35",
            semantic_score, structure_count,
        )

    # ── 11. V6: Visual boost (weak OCR + strong visual signals) ──
    sig_conf_boost = float(analysis.get("signature_confidence", 0.0))
    stamp_conf_boost = float(analysis.get("stamp_confidence", 0.0))

    if ocr_confidence < 0.3 and (sig_conf_boost >= 0.7 or stamp_conf_boost >= 0.7):
        if raw_score < 60.0:
            logger.info(
                "V6 visual boost: weak OCR (%.2f) + strong visual "
                "(sig=%.2f, stamp=%.2f) → floor at 60 (was %.1f)",
                ocr_confidence, sig_conf_boost, stamp_conf_boost, raw_score,
            )
            raw_score = 60.0

    # ── 12. V6: Safety ceiling (prevent boosted fakes) ──
    if semantic_score < 0.15 and raw_score > 70.0:
        logger.info(
            "V6 safety ceiling: semantic too low (%.2f) → capped at 70 "
            "(was %.1f)",
            semantic_score, raw_score,
        )
        raw_score = 70.0

    # ── 12bis. V6: Hard ceiling for no-content documents (logos, random
    # images avec features géométriques type cercle/ligne qui font monter
    # signature/cachet artificiellement). Pas de structure + pas de
    # sémantique = pas un diplôme, peu importe les signaux visuels.
    if structure_count == 0 and semantic_score < 0.1:
        if raw_score > 18.0:
            logger.info(
                "V6 no-content ceiling: struct=0 + semantic=%.2f → "
                "capped at 18 (was %.1f)",
                semantic_score, raw_score,
            )
            raw_score = 18.0

    # ── 12ter. V6 perf-fix: élargi pour gérer les hallucinations OCR.
    # Tesseract peut halluciner un nom à partir de bruit (typique sur
    # logo Linux/Tesseract 5.5 vs Windows 5.4). Si le seul "champ"
    # détecté est le nom, sans diplôme/date, et que le texte est très
    # court (< 50 chars), c'est probablement une fausse détection.
    has_degree_keyword = float(analysis.get("has_degree_keyword", 0.0)) >= 0.5
    has_date = float(analysis.get("has_date", 0.0)) >= 0.5
    if (
        structure_count <= 1
        and not has_degree_keyword
        and not has_date
        and len(raw_text.strip()) < 50
    ):
        if raw_score > 18.0:
            logger.info(
                "V6 hallucination ceiling: struct=%d, no degree/date, "
                "text_len=%d → capped at 18 (was %.1f)",
                structure_count, len(raw_text.strip()), raw_score,
            )
            raw_score = 18.0

    # ── 13. Clamp strict ──
    score = round(_clamp(raw_score), 1)

    # ── 14. Confidence calibration with semantic override ──
    confidence_level = determine_confidence_level(score, semantic_score)

    # ── Logging diagnostique (interne uniquement) ──
    logger.info(
        "Scoring V5 DIAG — raw=%.1f | noise=%.2f | final=%.1f | "
        "confidence=%s | ocr_conf=%.3f | semantic=%.3f | "
        "struct=%d | doc_type=%s | coherence=%.2f | "
        "kw_penalty=%.2f | weights=%s",
        base * 100.0,
        noise,
        score,
        confidence_level,
        ocr_confidence,
        semantic_score,
        structure_count,
        doc_type,
        coherence_score,
        keyword_penalty,
        {k: round(v, 3) for k, v in weights.items()},
    )

    return score, confidence_level


# ──────────────────────────────────────────────
# V7 — Post-processing caps (Phase 1 — DEPRECATED)
# ──────────────────────────────────────────────
# Conservé pour compatibilité ascendante uniquement. Phase 2 intègre les
# caps directement dans compute_global_trust_score(). Ne plus utiliser
# pour le nouveau code — préférez le pipeline multi-score V7.

def apply_v7_post_caps(
    score: float,
    confidence_level: str,
    semantic_score: float,
    critical_fields_score: int,
    fraud_score: int,
    is_template_without_identity: bool = False,
) -> tuple[float, str, list[str]]:
    """Applique les plafonds V7 au score V6.

    Phase 1 : corrige le problème central des templates qui scoraient
    60–75 sans contenir d'identité étudiante, et active la pénalité
    tampering.

    Parameters
    ----------
    score : float
        Score V6 retourné par compute_score().
    confidence_level : str
        Niveau de confiance V6.
    semantic_score : float
        Score sémantique (0.0–1.0).
    critical_fields_score : int
        Score critical_fields (0–100).
    fraud_score : int
        Score de fraude/tampering (0–100). 0 si tampering désactivé.
    is_template_without_identity : bool
        Indicateur explicite du critical_fields_validator.

    Returns
    -------
    (adjusted_score, adjusted_confidence_level, applied_caps)
        applied_caps : liste des plafonds appliqués (pour logging/diag).
    """
    from app.config import (
        CRITICAL_FIELDS_LOW_CAP,
        CRITICAL_FIELDS_LOW_THRESHOLD,
        TAMPERING_HARD_CAP_SCORE,
        TAMPERING_HARD_CAP_THRESHOLD,
        TAMPERING_MAX_PENALTY,
        TAMPERING_PENALTY_FACTOR,
        TAMPERING_PENALTY_THRESHOLD,
    )

    applied: list[str] = []
    adjusted = float(score)

    # ── Cap 1 : critical_fields_score < threshold → cap final ──
    if critical_fields_score < CRITICAL_FIELDS_LOW_THRESHOLD:
        if adjusted > CRITICAL_FIELDS_LOW_CAP:
            logger.info(
                "V7 critical_fields cap : %.1f → %d (cf_score=%d < %d)",
                adjusted, CRITICAL_FIELDS_LOW_CAP,
                critical_fields_score, CRITICAL_FIELDS_LOW_THRESHOLD,
            )
            adjusted = float(CRITICAL_FIELDS_LOW_CAP)
            applied.append("critical_fields_low_cap")

    # ── Cap 2 : template officiel sans identité → plafonnage agressif ──
    if is_template_without_identity:
        TEMPLATE_FINAL_CAP = 35.0
        if adjusted > TEMPLATE_FINAL_CAP:
            logger.info(
                "V7 template cap : %.1f → %.1f (template sans identité)",
                adjusted, TEMPLATE_FINAL_CAP,
            )
            adjusted = TEMPLATE_FINAL_CAP
            applied.append("template_without_identity_cap")

    # ── Cap 3 : fraud_score élevé → hard cap ──
    if fraud_score > TAMPERING_HARD_CAP_THRESHOLD:
        if adjusted > TAMPERING_HARD_CAP_SCORE:
            logger.info(
                "V7 tampering hard cap : %.1f → %d (fraud=%d > %d)",
                adjusted, TAMPERING_HARD_CAP_SCORE,
                fraud_score, TAMPERING_HARD_CAP_THRESHOLD,
            )
            adjusted = float(TAMPERING_HARD_CAP_SCORE)
            applied.append("tampering_hard_cap")

    # ── Cap 4 : fraud_score modéré → pénalité proportionnelle ──
    elif fraud_score > TAMPERING_PENALTY_THRESHOLD:
        penalty = min(
            TAMPERING_MAX_PENALTY,
            fraud_score * TAMPERING_PENALTY_FACTOR,
        )
        if penalty > 0:
            new_score = adjusted - penalty
            logger.info(
                "V7 tampering penalty : %.1f → %.1f (-%.1f, fraud=%d)",
                adjusted, new_score, penalty, fraud_score,
            )
            adjusted = new_score
            applied.append("tampering_penalty")

    # Clamp et arrondi
    adjusted = round(_clamp(adjusted), 1)

    # Recalibrer confidence_level si le score a notablement bougé
    if applied:
        adjusted_confidence = determine_confidence_level(adjusted, semantic_score)
    else:
        adjusted_confidence = confidence_level

    return adjusted, adjusted_confidence, applied


# ══════════════════════════════════════════════════════════════════
# V7 PHASE 2 — Multi-score Engine
# ══════════════════════════════════════════════════════════════════
# Architecture explicable et modulaire :
#   - 6 sous-scores indépendants (structure, semantic, critical_fields,
#     visual_authenticity, fraud, ocr_confidence)
#   - Pondération avec ajustement dynamique selon qualité OCR
#   - Caps de sécurité (V6 préservés + V7 nouveaux)
#   - Mapping risk_level → confidence_level pour rétrocompat backend

from dataclasses import dataclass, field

from app.config import (
    GLOBAL_SCORE_WEIGHTS,
    OCR_DYNAMIC_SEMANTIC_FACTOR,
    OCR_DYNAMIC_STRUCTURE_FACTOR,
    OCR_DYNAMIC_THRESHOLD,
    OCR_DYNAMIC_VISUAL_BONUS,
    V7_FRAUD_HARD_CAP_SCORE,
    V7_FRAUD_HARD_CAP_THRESHOLD,
    V7_HALLUCINATION_CAP,
    V7_HALLUCINATION_STRUCTURE_MAX,
    V7_HALLUCINATION_TEXT_LEN,
    V7_NO_CONTENT_CAP,
    V7_NO_CONTENT_SEMANTIC,
    V7_NO_CONTENT_STRUCTURE,
    V7_SCORE_MAX,
    V7_SCORE_MIN,
    V7_SEMANTIC_CEILING_CAP,
    V7_SEMANTIC_CEILING_THRESHOLD,
    V7_TEMPLATE_CAP,
    V7_TEMPLATE_CRITICAL_FIELDS_THRESHOLD,
    V7_TEMPLATE_FLAG_CAP,
    V7_TEMPLATE_VISUAL_THRESHOLD,
)


# ──────────────────────────────────────────────
# Dataclasses
# ──────────────────────────────────────────────

@dataclass
class SubscoreBundle:
    """6 sous-scores indépendants (chacun 0–100)."""
    structure_score: int = 0
    semantic_score: int = 0
    critical_fields_score: int = 0
    visual_authenticity_score: int = 0
    fraud_score: int = 0           # INVERSE — plus haut = plus suspect
    ocr_confidence_score: int = 0


@dataclass
class ExplainableReason:
    """Raison attribuée à une couche d'analyse, avec niveau d'impact."""
    layer: str       # "structure", "semantic", "critical_fields",
                     # "visual_authenticity", "tampering", "ocr", "scoring"
    signal: str      # message lisible
    impact: str = "medium"  # "high" | "medium" | "low"


# ──────────────────────────────────────────────
# Compute subscores depuis les modules
# ──────────────────────────────────────────────

def compute_subscores(
    *,
    ocr_result,
    text_result,
    sig_result,
    stamp_result,
    cf_result,
    tampering_result=None,
) -> SubscoreBundle:
    """Produit les 6 sous-scores indépendants à partir des objets de pipeline.

    Tous les paramètres sont des objets typés (OcrResult, TextAnalysisResult,
    SignatureResult, StampResult, CriticalFieldsResult, TamperingResult |
    None). Aucune logique d'agrégation ici — chaque sous-score est
    auto-suffisant.

    Returns
    -------
    SubscoreBundle avec chaque champ en 0–100.
    """
    # ── Structure : structure_count + bonus phrases/mentions officielles ──
    # Base : structure_count (0-3) → 0/33/67/100. On garde 70 pour la base
    # et on ajoute jusqu'à 30 via les bonus, pour pouvoir dépasser le simple
    # comptage de champs quand le document a une structure officielle riche.
    structure = (text_result.structure_count / 3.0) * 70.0
    if getattr(text_result, "has_certification_phrase", False):
        structure += 15.0
    if getattr(text_result, "official_mention_found", False):
        structure += 15.0
    structure_score = int(round(max(0.0, min(100.0, structure))))

    # ── Semantic : semantic_score + coherence - keyword_penalty ──
    # semantic_score (0-1) est le signal principal (70%); coherence_score
    # (0-1) le complète (30%). Le keyword_penalty (0-0.3) est soustrait.
    semantic_raw = (
        text_result.semantic_score * 70.0
        + getattr(text_result, "coherence_score", 0.0) * 30.0
    )
    semantic_raw -= getattr(text_result, "keyword_penalty", 0.0) * 100.0
    semantic_score = int(round(max(0.0, min(100.0, semantic_raw))))

    # ── Critical fields : déjà en 0-100, calculé par le validator ──
    critical_fields_score = int(cf_result.score)

    # ── Visual authenticity : signature 40% + cachet 60% (cachet plus
    # important dans les documents officiels tunisiens). ──
    sig_conf = float(getattr(sig_result, "confidence", 0.0))
    stamp_conf = float(getattr(stamp_result, "confidence", 0.0))
    visual = (sig_conf * 0.4 + stamp_conf * 0.6) * 100.0
    visual_authenticity_score = int(round(max(0.0, min(100.0, visual))))

    # ── Fraud (INVERSE de fraud_trust) : 0 = clean, 100 = très suspect ──
    if tampering_result is None:
        fraud_score = 0
    else:
        fraud_raw = float(tampering_result.tampering_score) * 100.0
        fraud_score = int(round(max(0.0, min(100.0, fraud_raw))))

    # ── OCR confidence : ocr_confidence (0-1) → 0-100 ──
    ocr_conf = float(getattr(ocr_result, "ocr_confidence", 0.0))
    ocr_confidence_score = int(round(max(0.0, min(100.0, ocr_conf * 100.0))))

    return SubscoreBundle(
        structure_score=structure_score,
        semantic_score=semantic_score,
        critical_fields_score=critical_fields_score,
        visual_authenticity_score=visual_authenticity_score,
        fraud_score=fraud_score,
        ocr_confidence_score=ocr_confidence_score,
    )


# ──────────────────────────────────────────────
# Pondération dynamique selon qualité OCR
# ──────────────────────────────────────────────

def _compute_dynamic_weights_v7(
    subscores: SubscoreBundle,
) -> dict[str, float]:
    """Ajuste les poids selon la qualité OCR.

    Quand ocr_confidence_score < OCR_DYNAMIC_THRESHOLD, on réduit les
    poids des signaux qui dépendent du texte (semantic, structure) et
    on renforce le poids visuel. Renormalise pour somme = 1.0.
    """
    weights = dict(GLOBAL_SCORE_WEIGHTS)

    if subscores.ocr_confidence_score >= OCR_DYNAMIC_THRESHOLD:
        return weights

    # adjustment ∈ [0, 0.5] quand ocr_confidence_score ∈ [0, 50]
    adjustment = (OCR_DYNAMIC_THRESHOLD - subscores.ocr_confidence_score) / 100.0

    weights["semantic"] *= (1.0 - adjustment * OCR_DYNAMIC_SEMANTIC_FACTOR)
    weights["structure"] *= (1.0 - adjustment * OCR_DYNAMIC_STRUCTURE_FACTOR)
    weights["visual_authenticity"] += adjustment * OCR_DYNAMIC_VISUAL_BONUS

    # Renormaliser à 1.0
    total = sum(weights.values())
    if total > 0:
        weights = {k: v / total for k, v in weights.items()}

    return weights


# ──────────────────────────────────────────────
# Caps de sécurité (V6 préservés + V7 nouveaux)
# ──────────────────────────────────────────────

def _apply_safety_caps_v7(
    raw_score: float,
    subscores: SubscoreBundle,
    *,
    raw_text_len: int = 0,
    has_degree_keyword: bool = False,
    has_date: bool = False,
    is_template_without_identity: bool = False,
) -> tuple[float, list[str]]:
    """Applique les plafonds. Retourne (score_capped, list_of_caps).

    Caps V6 préservés :
      - no-content (structure=0 ET sémantique<10 → cap 18)
      - hallucination (structure≤33 ET pas de degree/date ET texte court → cap 18)
      - semantic ceiling (sémantique<15 ET score>70 → cap 70)

    Caps V7 nouveaux :
      - template (visual>70 ET critical_fields<30 → cap 40)
      - template_flag (drapeau explicit du validator → cap 35)
      - fraud hard cap (fraud_score>80 → cap 35)
    """
    applied: list[str] = []
    score = float(raw_score)

    # ── Cap 1 : no-content ──
    if (
        subscores.structure_score <= V7_NO_CONTENT_STRUCTURE
        and subscores.semantic_score < V7_NO_CONTENT_SEMANTIC
    ):
        if score > V7_NO_CONTENT_CAP:
            logger.info(
                "V7 cap no-content : %.1f → %d (struct=%d, sem=%d)",
                score, V7_NO_CONTENT_CAP,
                subscores.structure_score, subscores.semantic_score,
            )
            score = float(V7_NO_CONTENT_CAP)
            applied.append("no_content")

    # ── Cap 2 : hallucination ──
    if (
        subscores.structure_score <= V7_HALLUCINATION_STRUCTURE_MAX
        and not has_degree_keyword
        and not has_date
        and raw_text_len < V7_HALLUCINATION_TEXT_LEN
    ):
        if score > V7_HALLUCINATION_CAP:
            logger.info(
                "V7 cap hallucination : %.1f → %d (struct=%d, text_len=%d)",
                score, V7_HALLUCINATION_CAP,
                subscores.structure_score, raw_text_len,
            )
            score = float(V7_HALLUCINATION_CAP)
            applied.append("hallucination")

    # ── Cap 3 : semantic ceiling ──
    if (
        subscores.semantic_score < V7_SEMANTIC_CEILING_THRESHOLD
        and score > V7_SEMANTIC_CEILING_CAP
    ):
        logger.info(
            "V7 cap semantic ceiling : %.1f → %d (sem=%d)",
            score, V7_SEMANTIC_CEILING_CAP, subscores.semantic_score,
        )
        score = float(V7_SEMANTIC_CEILING_CAP)
        applied.append("semantic_ceiling")

    # ── Cap 4 : template (visual fort + critical_fields faible) ──
    if (
        subscores.visual_authenticity_score > V7_TEMPLATE_VISUAL_THRESHOLD
        and subscores.critical_fields_score < V7_TEMPLATE_CRITICAL_FIELDS_THRESHOLD
    ):
        if score > V7_TEMPLATE_CAP:
            logger.info(
                "V7 cap template : %.1f → %d (visual=%d, cf=%d)",
                score, V7_TEMPLATE_CAP,
                subscores.visual_authenticity_score,
                subscores.critical_fields_score,
            )
            score = float(V7_TEMPLATE_CAP)
            applied.append("template")

    # ── Cap 5 : template_flag (drapeau explicit du validator) ──
    if is_template_without_identity:
        if score > V7_TEMPLATE_FLAG_CAP:
            logger.info(
                "V7 cap template_flag : %.1f → %d "
                "(critical_fields_validator a flag is_template)",
                score, V7_TEMPLATE_FLAG_CAP,
            )
            score = float(V7_TEMPLATE_FLAG_CAP)
            applied.append("template_flag")

    # ── Cap 6 : fraud hard cap ──
    if subscores.fraud_score > V7_FRAUD_HARD_CAP_THRESHOLD:
        if score > V7_FRAUD_HARD_CAP_SCORE:
            logger.info(
                "V7 cap fraud : %.1f → %d (fraud=%d)",
                score, V7_FRAUD_HARD_CAP_SCORE, subscores.fraud_score,
            )
            score = float(V7_FRAUD_HARD_CAP_SCORE)
            applied.append("fraud_hard_cap")

    return score, applied


# ──────────────────────────────────────────────
# Score global de confiance
# ──────────────────────────────────────────────

def compute_global_trust_score(
    subscores: SubscoreBundle,
    *,
    raw_text_len: int = 0,
    has_degree_keyword: bool = False,
    has_date: bool = False,
    is_template_without_identity: bool = False,
) -> tuple[int, list[str], dict[str, float]]:
    """Calcule le score global de confiance V7 (0–100).

    Pipeline :
      1. Pondération dynamique selon ocr_confidence_score
      2. Somme pondérée des sous-scores (avec fraud_trust = 100 - fraud_score)
      3. Application des caps de sécurité
      4. Clamp à [V7_SCORE_MIN, V7_SCORE_MAX]

    Returns
    -------
    (score: int, applied_caps: list[str], weights_used: dict[str, float])
    """
    weights = _compute_dynamic_weights_v7(subscores)

    # fraud_trust est l'inverse de fraud_score : plus de tampering = moins
    # de confiance. C'est cette valeur qui contribue positivement au total.
    fraud_trust = 100 - subscores.fraud_score

    values = {
        "structure":           subscores.structure_score,
        "semantic":            subscores.semantic_score,
        "critical_fields":     subscores.critical_fields_score,
        "visual_authenticity": subscores.visual_authenticity_score,
        "fraud_trust":         fraud_trust,
        "ocr_confidence":      subscores.ocr_confidence_score,
    }

    raw = sum(weights[k] * values[k] for k in weights)

    # Caps de sécurité
    raw, applied = _apply_safety_caps_v7(
        raw, subscores,
        raw_text_len=raw_text_len,
        has_degree_keyword=has_degree_keyword,
        has_date=has_date,
        is_template_without_identity=is_template_without_identity,
    )

    # Clamp final
    final = int(round(max(float(V7_SCORE_MIN), min(float(V7_SCORE_MAX), raw))))

    logger.info(
        "V7 global trust score = %d (raw=%.2f, caps=%s, "
        "weights=%s, subscores=%s)",
        final, raw, applied,
        {k: round(v, 3) for k, v in weights.items()},
        {
            "struct": subscores.structure_score,
            "sem": subscores.semantic_score,
            "cf": subscores.critical_fields_score,
            "vis": subscores.visual_authenticity_score,
            "fraud": subscores.fraud_score,
            "ocr": subscores.ocr_confidence_score,
        },
    )

    return final, applied, weights


# ──────────────────────────────────────────────
# Mapping risk_level / confidence_level
# ──────────────────────────────────────────────

def compute_risk_level(score: int | float) -> str:
    """Mappe le score V7 (0–100) en risk_level granulaire.

    Returns: "trusted" | "review_recommended" | "suspicious" | "highly_suspicious"
    """
    s = float(score)
    if s >= 80:
        return "trusted"
    if s >= 60:
        return "review_recommended"
    if s >= 30:
        return "suspicious"
    return "highly_suspicious"


_RISK_TO_CONFIDENCE = {
    "trusted":            "high",
    "review_recommended": "medium",
    "suspicious":         "low",
    "highly_suspicious":  "very_low",
}


def risk_level_to_confidence(risk_level: str) -> str:
    """Mappe risk_level vers confidence_level (rétrocompat backend).

    Le V6 utilisait 3 niveaux ("low" | "medium" | "high"). V7 ajoute
    "very_low" pour les documents les plus suspects. Le backend lit ce
    champ comme une simple chaîne et le stocke dans notes_institut —
    pas de validation enum côté serveur.
    """
    return _RISK_TO_CONFIDENCE.get(risk_level, "low")


# ──────────────────────────────────────────────
# Aggregation des reasons explicables
# ──────────────────────────────────────────────

def aggregate_explainable_reasons(
    *,
    text_result,
    cf_result,
    tampering_result=None,
    applied_caps: list[str] | None = None,
) -> list[ExplainableReason]:
    """Construit la liste de raisons explicables, attribuées par couche.

    Ordre : critical_fields > tampering > scoring caps > semantic.
    Chaque raison porte un impact (high/medium/low) selon la sévérité.
    """
    reasons: list[ExplainableReason] = []

    # ── Critical fields ──
    cf_impact = "high" if cf_result.score < 40 else "medium"
    for r in (cf_result.reasons or []):
        reasons.append(ExplainableReason(
            layer="critical_fields", signal=r, impact=cf_impact,
        ))

    # ── Tampering ──
    if tampering_result is not None:
        for flag in (tampering_result.flags or []):
            severity = (
                "high" if tampering_result.tampering_score > 0.7
                else "medium" if tampering_result.tampering_score > 0.35
                else "low"
            )
            reasons.append(ExplainableReason(
                layer="tampering", signal=flag, impact=severity,
            ))

    # ── Scoring caps ──
    for cap in (applied_caps or []):
        reasons.append(ExplainableReason(
            layer="scoring",
            signal=f"Plafond V7 appliqué : {cap}",
            impact="high",
        ))

    # ── Semantic / structure (si signaux faibles) ──
    if getattr(text_result, "coherence_score", 1.0) < 0.3:
        reasons.append(ExplainableReason(
            layer="semantic",
            signal="Cohérence sémantique faible",
            impact="medium",
        ))
    if getattr(text_result, "keyword_penalty", 0.0) > 0.0:
        reasons.append(ExplainableReason(
            layer="semantic",
            signal="Densité de mots-clés anormale (keyword stuffing)",
            impact="medium",
        ))

    return reasons
