from __future__ import annotations
from panini_album.models import Conflict, ExternalSticker
from panini_album.utils.text import normalize_code
from panini_album.validators.names import same_player
from panini_album.validators.slots import expected_type_for_slot

class CrossChecker:
    def __init__(self):
        self._conflicts: list[Conflict] = []
        self._next_id = 1

    @property
    def conflicts(self) -> list[Conflict]:
        return self._conflicts

    def add(self, severity: str, source: str, field: str, expected, found, message: str, code="UNKNOWN", countryCode="UNKNOWN", slot=0):
        self._conflicts.append(Conflict(
            id=self._next_id,
            severity=severity,
            source=source,
            code=str(code or "UNKNOWN"),
            countryCode=str(countryCode or "UNKNOWN"),
            slot=int(slot or 0),
            field=field,
            expected=str(expected),
            found=str(found),
            message=message,
        ))
        self._next_id += 1

    def validate_external(self, external: ExternalSticker, sticker_by_code: dict[str, dict]):
        code = normalize_code(external.code)
        base = sticker_by_code.get(code)
        if not base:
            self.add("INFO", external.source, "code", "BASE_ALBUM", code, "Código externo não existe no álbum base ou é promocional/paralelo.", code, external.countryCode, external.slot)
            return
        expected_type = expected_type_for_slot(base["slot"])
        if expected_type != base["type"]:
            self.add("ERROR", "internal", "slotType", expected_type, base["type"], "Erro interno de classificação de slot.", code, base["countryCode"], base["slot"])
        ext_type = (external.type or "UNKNOWN").upper()
        if ext_type != "UNKNOWN" and ext_type != base["type"]:
            self.add("WARN", external.source, "type", base["type"], ext_type, "Tipo da fonte externa diverge da regra oficial do slot.", code, base["countryCode"], base["slot"])
        if base["type"] == "PLAYER" and external.playerName != "UNKNOWN":
            ok, score, exp_n, got_n = same_player(base["title"], external.playerName)
            if not ok:
                self.add("ERROR", external.source, "playerName", base["title"], external.playerName, f"Jogador diferente para o mesmo código/slot. Similaridade={score}.", code, base["countryCode"], base["slot"])
