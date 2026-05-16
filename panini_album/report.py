from __future__ import annotations
from collections import Counter

def build_report(data: dict, conflicts: list[dict]) -> dict:
    by_type = Counter(s["type"] for s in data["stickers"])
    players_by_country = Counter(p["countryId"] for p in data["players"])
    return {
        "summary": {
            "countries": len(data["countries"]),
            "clubs": len(data["clubs"]),
            "players": len(data["players"]),
            "albumPages": len(data["albumPages"]),
            "stickers": len(data["stickers"]),
            "conflicts": len(conflicts),
            "stickersByType": dict(by_type),
            "playersPerCountryMin": min(players_by_country.values()) if players_by_country else 0,
            "playersPerCountryMax": max(players_by_country.values()) if players_by_country else 0,
        },
        "conflictsBySeverity": dict(Counter(c["severity"] for c in conflicts)),
    }
