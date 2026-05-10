"""V7 Phase 2 corpus test — bypasses FastAPI to dodge the python-magic
infrastructure bug. Calls the orchestrator directly and prints results.

Run: docker exec diploma-verifier-diploma-verifier-1 python3 /app/scripts/v7_corpus_direct.py
"""

from __future__ import annotations

import asyncio
import glob
import json
import os
import sys

sys.path.insert(0, "/app")

from app.services.orchestrator import analyze_document  # noqa: E402


async def main() -> None:
    files = sorted(glob.glob("/app/diplomes/*"))
    if not files:
        print("No files in /app/diplomes/")
        return

    rows: list[tuple] = []
    full_payloads: dict[str, dict] = {}

    for fp in files:
        name = os.path.basename(fp)
        size = os.path.getsize(fp)
        ext = os.path.splitext(name)[1].lower()
        mime = {
            ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
            ".pdf": "application/pdf",
        }.get(ext, "application/octet-stream")

        try:
            result = await analyze_document(
                file_path=fp, mime_type=mime,
                filename=name, file_size=size,
            )
            v7 = result.v7
            sub = v7.subscores if v7 else None
            rows.append({
                "name": name,
                "score": result.score,
                "conf": result.confidence_level,
                "risk": v7.risk_level if v7 else "-",
                "cf": sub.critical_fields_score if sub else "-",
                "fraud": sub.fraud_score if sub else "-",
                "vis": sub.visual_authenticity_score if sub else "-",
                "struct": sub.structure_score if sub else "-",
                "sem": sub.semantic_score if sub else "-",
                "ocr": sub.ocr_confidence_score if sub else "-",
                "template": v7.subscores and getattr(v7, "tampering", None) and v7.tampering.fraud_score,
                "reasons": result.reasons[:2],
            })
            if v7:
                full_payloads[name] = v7.model_dump()
        except Exception as e:
            rows.append({
                "name": name, "score": "ERR", "conf": "-",
                "risk": "-", "cf": "-", "fraud": "-",
                "vis": "-", "struct": "-", "sem": "-", "ocr": "-",
                "template": False,
                "reasons": [str(e)[:80]],
            })

    # Markdown table
    print()
    print("| File | Score | Conf | Risk | CF | Fraud | Vis | Struct | Sem | OCR | Top reasons |")
    print("|---|---:|:-:|:-:|---:|---:|---:|---:|---:|---:|---|")
    for r in rows:
        score_s = f"{r['score']:.1f}" if isinstance(r['score'], (int, float)) else str(r['score'])
        reasons = " / ".join(r["reasons"])
        print(f"| {r['name']} | {score_s} | {r['conf']} | {r['risk']} "
              f"| {r['cf']} | {r['fraud']} | {r['vis']} "
              f"| {r['struct']} | {r['sem']} | {r['ocr']} "
              f"| {reasons} |")

    print()
    print("### Full v7 payloads")
    for name, payload in full_payloads.items():
        print()
        print(f"#### {name}")
        print("```json")
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        print("```")


if __name__ == "__main__":
    asyncio.run(main())
