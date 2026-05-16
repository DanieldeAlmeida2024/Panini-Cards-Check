from __future__ import annotations
from pathlib import Path
import json
from panini_album.data.countries import COUNTRY_BY_PT, COUNTRIES
from panini_album.data.aliases import PRIMARY_SOURCE_FIXUPS

class PrimaryTxtSource:
    name = "primary_txt_gabarito"

    def __init__(self, path: str | Path, patches_path: str | Path | None = None):
        self.path = Path(path)
        self.patches_path = Path(patches_path) if patches_path else None

    def read(self) -> dict[str, list[str]]:
        text = self.path.read_text(encoding="utf-8")
        raw_lines = [line.strip() for line in text.splitlines() if line.strip()]
        lines: list[str] = []
        for line in raw_lines:
            if line in PRIMARY_SOURCE_FIXUPS:
                lines.extend(PRIMARY_SOURCE_FIXUPS[line])
            else:
                lines.append(line)
        country_names = set(COUNTRY_BY_PT.keys())
        parsed: dict[str, list[str]] = {}
        current: str | None = None
        for line in lines:
            if line.startswith("Todos os jogadores") or line.startswith("Grupo "):
                continue
            if line in country_names:
                current = line
                parsed[current] = []
                continue
            if current:
                parsed[current].append(line)
        if self.patches_path and self.patches_path.exists():
            patches = json.loads(self.patches_path.read_text(encoding="utf-8"))
            for country, players in patches.items():
                if country in parsed and isinstance(players, list):
                    parsed[country] = [str(p) for p in players]
        return parsed

    def validate_completeness(self, parsed: dict[str, list[str]]) -> list[str]:
        errors: list[str] = []
        for _group, _code, pt, _en in COUNTRIES:
            players = parsed.get(pt, [])
            if len(players) != 18:
                errors.append(f"{pt}: esperado 18 jogadores, encontrado {len(players)}")
        return errors
