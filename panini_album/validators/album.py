from __future__ import annotations
from panini_album.models import Conflict

class AlbumInvariantValidator:
    def __init__(self):
        self.conflicts: list[Conflict] = []
        self._id = 100000

    def _add(self, field, expected, found, message, severity="ERROR"):
        self.conflicts.append(Conflict(id=self._id, severity=severity, source="album_invariants", field=field, expected=str(expected), found=str(found), message=message))
        self._id += 1

    def validate(self, data: dict):
        countries = data["countries"]
        players = data["players"]
        stickers = data["stickers"]
        if len(countries) != 48:
            self._add("countries.length", 48, len(countries), "O álbum deve conter 48 seleções.")
        if len(players) != 864:
            self._add("players.length", 864, len(players), "O álbum deve conter 864 jogadores tradicionais.")
        if len(stickers) != 980:
            self._add("stickers.length", 980, len(stickers), "O álbum base deve conter 980 figurinhas.")
        for c in countries:
            country_stickers = [s for s in stickers if s["countryId"] == c["id"]]
            if len(country_stickers) != 20:
                self._add("country.stickers.length", 20, len(country_stickers), f"{c['code']} deve ter 20 figurinhas.")
            by_slot = {s["slot"]: s for s in country_stickers}
            if by_slot.get(1, {}).get("type") != "BADGE":
                self._add("slot.1", "BADGE", by_slot.get(1, {}).get("type", "MISSING"), f"{c['code']}-1 deve ser escudo.")
            if by_slot.get(13, {}).get("type") != "SQUAD":
                self._add("slot.13", "SQUAD", by_slot.get(13, {}).get("type", "MISSING"), f"{c['code']}-13 deve ser foto da escalação.")
            players_count = sum(1 for s in country_stickers if s["type"] == "PLAYER")
            if players_count != 18:
                self._add("country.players.length", 18, players_count, f"{c['code']} deve ter 18 jogadores.")
        return self.conflicts
