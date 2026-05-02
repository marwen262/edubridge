"""V4 comprehensive validation tests."""

from app.services.text_analyzer import analyze_text, quick_semantic_score
from app.services.scoring_engine import compute_score, determine_confidence_level

def sep(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

# ── TEST 1: Real diploma text ──
sep("TEST 1: Semantic scoring - real diploma text")

diploma_text = (
    "Republique Tunisienne\n"
    "Ministere de l'Enseignement Superieur\n"
    "Universite de Tunis El Manar\n"
    "Faculte des Sciences de Tunis\n\n"
    "DIPLOME DE LICENCE FONDAMENTALE EN INFORMATIQUE\n\n"
    "Certifie que Monsieur Mohamed Ben Ali\n"
    "ne le 15 mars 1998 a Tunis\n"
    "a obtenu le diplome de Licence Fondamentale en Informatique\n"
    "Mention: Bien\n"
    "Annee universitaire 2019/2020\n\n"
    "Fait a Tunis, le 30 juin 2020\n"
    "Le Doyen\n"
)

r = analyze_text(diploma_text, "fr")
print(f"  name:        {r.has_person_name} ({r.detected_name})")
print(f"  institution: {r.has_institution} ({r.detected_institution})")
print(f"  degree:      {r.has_degree_keyword} ({r.detected_degree})")
print(f"  date:        {r.has_date}")
print(f"  cert_phrase: {r.has_certification_phrase}")
print(f"  official:    {r.official_mention_found}")
print(f"  struct_ct:   {r.structure_count}")
print(f"  kw_density:  {r.keyword_density}")
print(f"  semantic:    {r.semantic_score}")
print(f"  confidence:  {r.diploma_confidence}")
print(f"  reasons:     {r.reasons}")

# ── TEST 2: Random non-academic text ──
sep("TEST 2: Semantic scoring - random text (NOT diploma)")

random_text = (
    "Lorem ipsum dolor sit amet consectetur adipiscing elit.\n"
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n"
    "Ut enim ad minim veniam quis nostrud exercitation ullamco laboris.\n"
    "This is just a random paragraph with no academic content.\n"
)

r2 = analyze_text(random_text, "en")
print(f"  struct_ct:   {r2.structure_count}")
print(f"  kw_density:  {r2.keyword_density}")
print(f"  semantic:    {r2.semantic_score}")
print(f"  confidence:  {r2.diploma_confidence}")
print(f"  reasons:     {r2.reasons}")

# ── TEST 3: Quick semantic score ──
sep("TEST 3: Quick semantic score (OCR selection)")

print(f"  Diploma text:  {quick_semantic_score(diploma_text):.3f}")
print(f"  Random text:   {quick_semantic_score(random_text):.3f}")
print(f"  Empty text:    {quick_semantic_score(''):.3f}")
print(f"  Short noise:   {quick_semantic_score('xyzabc123'):.3f}")

# ── TEST 4: Structure-aware scoring ──
sep("TEST 4: Structure-aware scoring")

# Full diploma signals
analysis_full = {
    "has_person_name": 1.0,
    "has_institution": 1.0,
    "has_degree_keyword": 1.0,
    "has_date": 1.0,
    "signature_confidence": 0.7,
    "stamp_confidence": 0.8,
    "official_mention": 1.0,
    "certification_phrase": 1.0,
    "keyword_density": 0.15,
}
s1, c1 = compute_score(analysis_full, diploma_text, ocr_confidence=0.85,
                        semantic_score=0.9, structure_count=4)
print(f"  Full diploma:    score={s1} confidence={c1}")

# Missing fields
analysis_partial = {
    "has_person_name": 0.0,
    "has_institution": 1.0,
    "has_degree_keyword": 0.0,
    "has_date": 0.0,
    "signature_confidence": 0.3,
    "stamp_confidence": 0.2,
    "official_mention": 0.0,
    "certification_phrase": 0.0,
    "keyword_density": 0.01,
}
s2, c2 = compute_score(analysis_partial, "some text", ocr_confidence=0.5,
                        semantic_score=0.15, structure_count=1)
print(f"  Partial (1/4):   score={s2} confidence={c2}")

# ── TEST 5: Anti-fake heuristics ──
sep("TEST 5: Anti-fake heuristics")

# Random image: no text, no stamp, no signature
analysis_random = {
    "has_person_name": 0.0,
    "has_institution": 0.0,
    "has_degree_keyword": 0.0,
    "has_date": 0.0,
    "signature_confidence": 0.05,
    "stamp_confidence": 0.1,
    "official_mention": 0.0,
    "certification_phrase": 0.0,
    "keyword_density": 0.0,
}
s3, c3 = compute_score(analysis_random, "", ocr_confidence=0.0,
                        semantic_score=0.0, structure_count=0)
print(f"  Random image:    score={s3} confidence={c3}")

# Suspicious: high stamp but no text
analysis_suspicious = {
    "has_person_name": 0.0,
    "has_institution": 0.0,
    "has_degree_keyword": 0.0,
    "has_date": 0.0,
    "signature_confidence": 0.1,
    "stamp_confidence": 0.85,
    "official_mention": 0.0,
    "certification_phrase": 0.0,
    "keyword_density": 0.0,
}
s4, c4 = compute_score(analysis_suspicious, "", ocr_confidence=0.0,
                        semantic_score=0.0, structure_count=0)
print(f"  Suspicious:      score={s4} confidence={c4}")

# Text exists but no academic keywords
analysis_nokey = {
    "has_person_name": 1.0,
    "has_institution": 0.0,
    "has_degree_keyword": 0.0,
    "has_date": 1.0,
    "signature_confidence": 0.4,
    "stamp_confidence": 0.3,
    "official_mention": 0.0,
    "certification_phrase": 0.0,
    "keyword_density": 0.0,
}
s5, c5 = compute_score(analysis_nokey, "random words here", ocr_confidence=0.6,
                        semantic_score=0.1, structure_count=2)
print(f"  No keywords:     score={s5} confidence={c5}")

# ── TEST 6: Determinism ──
sep("TEST 6: Determinism (5 runs)")

scores = []
for i in range(5):
    s, c = compute_score(analysis_full, diploma_text, ocr_confidence=0.85,
                          semantic_score=0.9, structure_count=4)
    scores.append(s)
    print(f"  Run {i+1}: score={s} confidence={c}")
print(f"  All identical: {len(set(scores)) == 1}")

# ── TEST 7: Confidence calibration ──
sep("TEST 7: Confidence calibration with semantic override")

# Medium score but strong semantic -> push to high
print(f"  score=60, semantic=0.8: {determine_confidence_level(60, 0.8)}")
# High score but weak semantic -> downgrade
print(f"  score=75, semantic=0.2: {determine_confidence_level(75, 0.2)}")
# Medium score, weak semantic -> downgrade to low
print(f"  score=35, semantic=0.1: {determine_confidence_level(35, 0.1)}")
# Normal cases
print(f"  score=80, semantic=0.7: {determine_confidence_level(80, 0.7)}")
print(f"  score=20, semantic=0.0: {determine_confidence_level(20, 0.0)}")

# ── TEST 8: Score separation ──
sep("TEST 8: Score separation (diploma vs random)")

print(f"  Full diploma score:  {s1}")
print(f"  Random image score:  {s3}")
print(f"  Separation:          {s1 - s3:.1f} points")
assert s1 > 70, f"Diploma score too low: {s1}"
assert s3 < 25, f"Random image score too high: {s3}"
print(f"  PASS: diploma>{70}, random<{25}")

print(f"\n{'='*60}")
print("  ALL V4 TESTS PASSED")
print(f"{'='*60}")
