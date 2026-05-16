from __future__ import annotations
from panini_album.data.countries import COUNTRIES
from panini_album.models import AlbumPage, Club, Country, Player, Sticker
from panini_album.utils.text import normalize_name
from panini_album.validators.slots import slot_for_player_index

class RelationalBuilder:
    def __init__(self, primary_players: dict[str, list[str]]):
        self.primary_players = primary_players
        self.countries: list[Country] = []
        self.clubs: list[Club] = [Club(id=1, name="UNKNOWN", country="UNKNOWN")]
        self.players: list[Player] = []
        self.pages: list[AlbumPage] = []
        self.stickers: list[Sticker] = []

    def build(self) -> dict:
        country_id_by_pt: dict[str, int] = {}
        player_id_by_country_slot: dict[tuple[str, int], int] = {}
        sticker_id = 1
        player_id = 1
        page_id = 1

        for idx, (group, code, pt, en) in enumerate(COUNTRIES, start=1):
            country = Country(id=idx, group=group, code=code, namePt=pt, nameEn=en)
            self.countries.append(country)
            country_id_by_pt[pt] = idx
            self.pages.append(AlbumPage(
                id=page_id,
                type="COUNTRY",
                title=pt,
                group=group,
                countryId=idx,
                startCode=f"{code}-1",
                endCode=f"{code}-20",
                slots=20,
            ))
            page_id_current = page_id
            page_id += 1

            source_players = list(self.primary_players.get(pt, []))
            # Nunca gera null: se o gabarito estiver incompleto, cria placeholder rastreável.
            while len(source_players) < 18:
                missing_index = len(source_players) + 1
                source_players.append(f"UNKNOWN_PLAYER_{code}_{missing_index:02d}")
            source_players = source_players[:18]

            for i, player_name in enumerate(source_players):
                slot = slot_for_player_index(i)
                p = Player(
                    id=player_id,
                    name=player_name,
                    normalizedName=normalize_name(player_name),
                    countryId=idx,
                    clubId=1,
                    position="UNKNOWN",
                    birthDate="UNKNOWN",
                    heightCm=0,
                    weightKg=0,
                    externalIds={},
                    dataQuality={
                        "source": "primary_txt_gabarito",
                        "isPlaceholder": player_name.startswith("UNKNOWN_PLAYER_"),
                        "validatedBy": [],
                        "conflictCount": 0,
                    },
                )
                self.players.append(p)
                player_id_by_country_slot[(code, slot)] = player_id
                player_id += 1

            for slot in range(1, 21):
                if slot == 1:
                    stype = "BADGE"
                    title = f"{pt} - Escudo"
                    pid = 0
                elif slot == 13:
                    stype = "SQUAD"
                    title = f"{pt} - Foto da seleção"
                    pid = 0
                else:
                    stype = "PLAYER"
                    pid = player_id_by_country_slot[(code, slot)]
                    title = next(p.name for p in self.players if p.id == pid)
                self.stickers.append(Sticker(
                    id=sticker_id,
                    code=f"{code}-{slot}",
                    albumPageId=page_id_current,
                    countryId=idx,
                    playerId=pid,
                    slot=slot,
                    type=stype,
                    title=title,
                    scope="BASE_ALBUM",
                    dataQuality={"source": "generated_from_primary_txt", "validatedBy": []},
                ))
                sticker_id += 1

        # 20 figurinhas especiais gerais do álbum base.
        self.pages.append(AlbumPage(id=page_id, type="SPECIAL", title="Especiais gerais", countryId=0, startCode="SP-1", endCode="SP-20", slots=20))
        for slot in range(1, 21):
            self.stickers.append(Sticker(
                id=sticker_id,
                code=f"SP-{slot}",
                albumPageId=page_id,
                countryId=0,
                playerId=0,
                slot=slot,
                type="SPECIAL",
                title=f"SPECIAL_BASE_{slot:02d}",
                scope="BASE_ALBUM",
                dataQuality={"source": "album_base_placeholder", "validatedBy": []},
            ))
            sticker_id += 1

        return {
            "countries": [x.model_dump() for x in self.countries],
            "clubs": [x.model_dump() for x in self.clubs],
            "players": [x.model_dump() for x in self.players],
            "albumPages": [x.model_dump() for x in self.pages],
            "stickers": [x.model_dump() for x in self.stickers],
        }
