from __future__ import annotations
import csv
from pathlib import Path
from panini_album.models import ExternalSticker
from panini_album.utils.text import normalize_code

class LocalCsvSource:
    name = "local_csv"
    def __init__(self, path: str | Path):
        self.path = Path(path)
    def parse(self) -> list[ExternalSticker]:
        if not self.path.exists():
            return []
        items: list[ExternalSticker] = []
        with self.path.open("r", encoding="utf-8-sig", newline="") as f:
            for row in csv.DictReader(f):
                code = normalize_code(row.get("code", ""))
                if not code:
                    continue
                country, slot = code.split("-") if "-" in code else (row.get("countryCode", "UNKNOWN"), row.get("slot", "0"))
                items.append(ExternalSticker(
                    source=self.name,
                    code=code,
                    countryCode=row.get("countryCode") or country,
                    slot=int(row.get("slot") or slot or 0),
                    type=(row.get("type") or "UNKNOWN").upper(),
                    playerName=row.get("playerName") or row.get("title") or "UNKNOWN",
                    title=row.get("title") or row.get("playerName") or "UNKNOWN",
                    raw=dict(row),
                ))
        return items
