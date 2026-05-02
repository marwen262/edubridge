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
