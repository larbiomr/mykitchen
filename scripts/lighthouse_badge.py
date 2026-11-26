#!/usr/bin/env python3
"""Écrit le badge Shields à partir du rapport Lighthouse CI."""
import json
import sys
from pathlib import Path

manifeste = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
scores = next(r["summary"] for r in manifeste if r["isRepresentativeRun"])
perf = round(scores["performance"] * 100)
a11y = round(scores["accessibility"] * 100)
pire = min(perf, a11y)

Path(sys.argv[2]).write_text(json.dumps({
    "schemaVersion": 1,
    "label": "lighthouse",
    "message": f"perf {perf} | a11y {a11y}",
    "color": "brightgreen" if pire >= 90 else "yellow" if pire >= 80 else "red",
}), encoding="utf-8")
