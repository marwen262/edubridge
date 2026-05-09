"""V7 corpus regression test driver.

POST each file in diploma-verifier/diplomes/ to /api/verify and print
a markdown summary table + full v7 payloads.

Run: python scripts/v7_corpus_test.py
"""

from __future__ import annotations

import glob
import json
import os
import time

import requests

API = "http://localhost:8000/api/verify"


def main() -> None:
    files = sorted(glob.glob("diplomes/*"))
    if not files:
        print("No files in diplomes/")
        return

    rows: list[tuple] = []
    full_payloads: dict[str, dict] = {}

    for fp in files:
        name = os.path.basename(fp)
        t0 = time.time()
        try:
            with open(fp, "rb") as fh:
                resp = requests.post(API, files={"file": (name, fh)}, timeout=120)
            elapsed = time.time() - t0

            if resp.status_code != 200:
                rows.append((name, f"HTTP {resp.status_code}", "-", "-", "-",
                             resp.text[:80], elapsed))
                continue

            data = resp.json()
            full_payloads[name] = data
            score = data.get("score", "-")
            conf = data.get("confidence_level", "-")
            reasons = data.get("reasons", []) or []
            v7 = data.get("v7") or {}
            sub = v7.get("subscores") or {}
            cf = sub.get("critical_fields_score", "-")
            fraud = sub.get("fraud_score", "-")
            top_reasons = " / ".join(reasons[:2])

            rows.append((name, score, conf, cf, fraud, top_reasons, elapsed))

        except Exception as e:
            rows.append((name, "ERROR", "-", "-", "-", str(e)[:80],
                         time.time() - t0))

    # Print markdown table
    print()
    print("| File | Score | Confidence | CF score | Fraud | Top reasons | Time (s) |")
    print("|---|---:|:-:|---:|---:|---|---:|")
    for name, score, conf, cf, fraud, reasons, elapsed in rows:
        score_s = f"{score:.1f}" if isinstance(score, (int, float)) else str(score)
        elapsed_s = f"{elapsed:.1f}"
        print(f"| {name} | {score_s} | {conf} | {cf} | {fraud} | {reasons} | {elapsed_s} |")

    # Full v7 payloads
    print()
    print("### Full v7 payloads")
    for name, data in full_payloads.items():
        v7 = data.get("v7")
        print()
        print(f"#### {name}")
        print("```json")
        print(json.dumps(v7, indent=2, ensure_ascii=False) if v7 else "null")
        print("```")


if __name__ == "__main__":
    main()
