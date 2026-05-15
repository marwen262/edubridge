"""V7 debug-endpoint corpus probe.

POST each file in diplomes/ to /api/verify/debug and print the OCR text +
name detection details + critical_fields breakdown for diagnosis.

Run: python scripts/v7_debug_corpus.py
"""

from __future__ import annotations

import glob
import os

import requests

API = "http://localhost:8000/api/verify/debug"


def main() -> None:
    files = sorted(glob.glob("diplomes/*"))
    if not files:
        print("No files in diplomes/")
        return

    for fp in files:
        name = os.path.basename(fp)
        print("=" * 80)
        print(f"FILE: {name}")
        print("=" * 80)

        try:
            with open(fp, "rb") as fh:
                resp = requests.post(API, files={"file": (name, fh)}, timeout=120)
        except Exception as e:
            print(f"  ERROR: {e}")
            continue

        if resp.status_code != 200:
            print(f"  HTTP {resp.status_code}: {resp.text[:200]}")
            continue

        d = resp.json()

        print(f"  language_detected     : {d.get('language_detected')}")
        print(f"  ocr_confidence        : {d.get('ocr_confidence')}")
        print(f"  raw_text_len          : {d.get('raw_text_len')}")
        print(f"  doc_type              : {d.get('doc_type')}")
        print(f"  diploma_confidence    : {d.get('diploma_confidence')}")
        print(f"  semantic_score        : {d.get('semantic_score')}")
        print(f"  structure_count       : {d.get('structure_count')}")
        print()
        print("  --- Name detection ---")
        print(f"  has_person_name       : {d.get('has_person_name')}")
        print(f"  detected_name         : {d.get('detected_name')!r}")
        print(f"  name_source           : {d.get('name_source')}")
        print()
        print("  --- Other fields ---")
        print(f"  has_institution       : {d.get('has_institution')}")
        print(f"  has_degree_keyword    : {d.get('has_degree_keyword')}")
        print(f"  detected_degree       : {d.get('detected_degree')!r}")
        print(f"  has_date              : {d.get('has_date')}")
        print()
        print("  --- Visual ---")
        print(f"  signature_confidence  : {d.get('signature_confidence')}")
        print(f"  stamp_confidence      : {d.get('stamp_confidence')}")
        print()
        print("  --- Critical fields V7 ---")
        print(f"  critical_fields_score : {d.get('critical_fields_score')}")
        print(f"  per_field             : {d.get('critical_fields_per_field')}")
        print(f"  is_template_without_identity : {d.get('is_template_without_identity')}")
        print()
        print("  --- Raw OCR text ---")
        text = d.get("raw_text", "") or ""
        # Print first 1500 chars to keep output bounded
        if len(text) > 1500:
            print(text[:1500] + f"\n  ... [truncated, total {len(text)} chars]")
        else:
            print(text)
        print()


if __name__ == "__main__":
    main()
