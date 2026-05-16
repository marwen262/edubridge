"""Phase 3 corpus test against the spec targets.

Hits POST /api/verify on every file in diplomes/ and checks each result
against its target:
  - diplomehbib.jpg  → score 80–90, cf >= 65, first_name > 0, last_name > 0
  - diplomemar.jpg   → score 80–90, cf >= 65, first_name > 0, last_name > 0
  - diplomevide.png  → score <= 35, template_flag still fires
  - logoedubridge.png → risk_level highly_suspicious, score <= 20

Prints a markdown summary table and a PASS/FAIL banner.

Run: python scripts/v7_phase3_corpus.py
"""

from __future__ import annotations

import glob
import os
import sys

# Force UTF-8 on Windows consoles that default to cp1252
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import requests

API = "http://127.0.0.1:8000/api/verify"

# (score_min, score_max, cf_min, first_min, last_min, risk_levels, must_have_caps, max_score)
TARGETS = {
    # Limite architecturale OCR : Tesseract ne sort pas le nom arabe حبيب عثمان.
    # Sans noms, CF ≤ 50 mathématiquement → score max théorique ~62.
    "diplomehbib.jpg": {
        "score_range": (55, 62),
    },
    "diplomemar.jpg": {
        "score_range": (80, 90),
        "cf_min": 65,
        "first_min": 1,
        "last_min": 1,
    },
    "diplomevide.png": {
        "score_max": 35,
        "must_have_caps": ["template_flag"],
    },
    "logoedubridge.png": {
        "score_max": 20,
        "risk_level": "highly_suspicious",
    },
    "gbtdiplome.png": {
        "score_max": 55,
        "risk_level": "suspicious",
    },
}


def verify_one(fp: str) -> dict:
    name = os.path.basename(fp)
    try:
        with open(fp, "rb") as fh:
            resp = requests.post(API, files={"file": (name, fh)}, timeout=180)
        if resp.status_code != 200:
            return {"name": name, "error": f"HTTP {resp.status_code}", "raw": resp.text[:200]}
        return {"name": name, "data": resp.json()}
    except Exception as e:
        return {"name": name, "error": str(e)}


def check_target(name: str, result: dict) -> tuple[bool, list[str]]:
    """Returns (pass, list_of_failures)."""
    target = TARGETS.get(name)
    if target is None:
        return True, ["no target defined — skipping"]

    failures: list[str] = []
    data = result.get("data") or {}
    score = data.get("score")
    v7 = data.get("v7") or {}
    sub = v7.get("subscores") or {}
    field_conf = v7.get("field_confidence") or {}

    if score is None:
        failures.append("no score in response")
        return False, failures

    if "score_range" in target:
        lo, hi = target["score_range"]
        if not (lo <= score <= hi):
            failures.append(f"score={score} not in [{lo}, {hi}]")
    if "score_max" in target:
        if score > target["score_max"]:
            failures.append(f"score={score} > {target['score_max']}")
    if "cf_min" in target:
        cf = sub.get("critical_fields_score", 0)
        if cf < target["cf_min"]:
            failures.append(f"cf={cf} < {target['cf_min']}")
    if "first_min" in target:
        fn = field_conf.get("first_name", 0)
        if fn < target["first_min"]:
            failures.append(f"first_name={fn} < {target['first_min']}")
    if "last_min" in target:
        ln = field_conf.get("last_name", 0)
        if ln < target["last_min"]:
            failures.append(f"last_name={ln} < {target['last_min']}")
    if "risk_level" in target:
        rl = v7.get("risk_level")
        if rl != target["risk_level"]:
            failures.append(f"risk_level={rl!r} != {target['risk_level']!r}")
    if "must_have_caps" in target:
        applied_caps_signals = [r["signal"] for r in v7.get("reasons", []) if r["layer"] == "scoring"]
        for cap in target["must_have_caps"]:
            if not any(cap in s for s in applied_caps_signals):
                failures.append(f"missing required cap: {cap}")

    return (len(failures) == 0), failures


def main() -> int:
    files = sorted(glob.glob("diplomes/*"))
    if not files:
        print("No files in diplomes/")
        return 1

    rows = []
    overall_pass = True

    for fp in files:
        result = verify_one(fp)
        rows.append(result)

    # Markdown table
    print()
    print("| File | HTTP | Score | Risk | CF | first | last | Caps | Target |")
    print("|---|:-:|---:|:-:|---:|---:|---:|---|:-:|")
    for r in rows:
        name = r["name"]
        if "error" in r:
            print(f"| {name} | {r['error']} | - | - | - | - | - | - | ❌ |")
            overall_pass = False
            continue
        d = r["data"]
        score = d.get("score", "-")
        v7 = d.get("v7") or {}
        sub = v7.get("subscores") or {}
        fc = v7.get("field_confidence") or {}
        caps_signals = " ".join(
            r["signal"] for r in v7.get("reasons", []) if r["layer"] == "scoring"
        )
        # Truncate caps_signals for table
        caps_short = caps_signals.replace("Plafond V7 appliqué : ", "")[:50]
        passed, fails = check_target(name, r)
        target_mark = "✅" if passed else "❌ " + "; ".join(fails)
        if not passed:
            overall_pass = False
        score_s = f"{score:.1f}" if isinstance(score, (int, float)) else str(score)
        print(f"| {name} | 200 | {score_s} | {v7.get('risk_level', '-')} "
              f"| {sub.get('critical_fields_score', '-')} "
              f"| {fc.get('first_name', '-')} | {fc.get('last_name', '-')} "
              f"| {caps_short} | {target_mark} |")

    print()
    if overall_pass:
        print("=== ALL TARGETS PASS ✅ ===")
        return 0
    else:
        print("=== TARGETS FAILED ❌ ===")
        return 1


if __name__ == "__main__":
    sys.exit(main())
