from __future__ import annotations
import re
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
import requests
from unidecode import unidecode
from panini_album.enrichers.cache import JsonCache
from panini_album.utils.text import normalize_name

POSITION_MAP = {
    "association football goalkeeper": "GOALKEEPER",
    "association football defender": "DEFENDER",
    "association football midfielder": "MIDFIELDER",
    "association football forward": "FORWARD",
    "goalkeeper": "GOALKEEPER",
    "defender": "DEFENDER",
    "midfielder": "MIDFIELDER",
    "forward": "FORWARD",
    "winger": "FORWARD",
    "striker": "FORWARD",
}

@dataclass
class PlayerEnrichment:
    source: str = "wikidata"
    found: bool = False
    confidence: float = 0.0
    wikidataId: str = "UNKNOWN"
    wikipediaUrl: str = "UNKNOWN"
    clubName: str = "UNKNOWN"
    clubCountry: str = "UNKNOWN"
    position: str = "UNKNOWN"
    birthDate: str = "UNKNOWN"  # dd-mm-aaaa
    heightCm: int = 0
    weightKg: int = 0
    evidence: dict[str, Any] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)

class WikidataEnricher:
    API = "https://www.wikidata.org/w/api.php"
    ENTITY = "https://www.wikidata.org/wiki/Special:EntityData/{qid}.json"

    def __init__(self, cache_dir: str = ".cache", timeout: int = 25, delay: float = 0.1):
        self.cache = JsonCache(cache_dir)
        self.timeout = timeout
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "PaniniAlbumRelationalBot/4.0 (local research tool)"})

    def enrich_player(self, player_name: str, country_pt: str, country_en: str) -> PlayerEnrichment:
        key = f"{player_name}__{country_en}"
        cached = self.cache.get("wikidata_enriched", key)
        if cached:
            return PlayerEnrichment(**cached)

        candidates = self._search_candidates(player_name)
        best: PlayerEnrichment | None = None
        for qid in candidates[:8]:
            item = self._load_entity(qid)
            if not item:
                continue
            score = self._score_entity(item, player_name, country_pt, country_en)
            if score < 0.35:
                continue
            enriched = self._extract(item)
            enriched.confidence = score
            enriched.found = True
            if best is None or enriched.confidence > best.confidence:
                best = enriched
        if best is None:
            best = PlayerEnrichment(found=False, warnings=["Nenhum candidato confiável encontrado no Wikidata"])
        self.cache.set("wikidata_enriched", key, best.__dict__)
        time.sleep(self.delay)
        return best

    def _search_candidates(self, name: str) -> list[str]:
        cached = self.cache.get("wikidata_search", name)
        if cached is not None:
            return cached
        params = {
            "action": "wbsearchentities",
            "search": name,
            "language": "en",
            "format": "json",
            "limit": 10,
            "type": "item",
        }
        try:
            r = self.session.get(self.API, params=params, timeout=self.timeout)
            r.raise_for_status()
            ids = [x["id"] for x in r.json().get("search", []) if x.get("id", "").startswith("Q")]
        except Exception:
            ids = []
        self.cache.set("wikidata_search", name, ids)
        return ids

    def _load_entity(self, qid: str) -> dict[str, Any] | None:
        cached = self.cache.get("wikidata_entity", qid)
        if cached is not None:
            return cached
        try:
            r = self.session.get(self.ENTITY.format(qid=qid), timeout=self.timeout)
            r.raise_for_status()
            entity = r.json().get("entities", {}).get(qid)
        except Exception:
            entity = None
        self.cache.set("wikidata_entity", qid, entity)
        return entity

    def _score_entity(self, entity: dict[str, Any], player_name: str, country_pt: str, country_en: str) -> float:
        labels = self._labels(entity)
        aliases = self._aliases(entity)
        all_names = [*labels.values(), *aliases]
        target = normalize_name(player_name)
        name_score = 0.0
        for n in all_names:
            nn = normalize_name(n)
            if nn == target:
                name_score = max(name_score, 0.55)
            elif target in nn or nn in target:
                name_score = max(name_score, 0.42)

        claims = entity.get("claims", {})
        is_footballer = "P106" in claims or "P54" in claims or "P413" in claims
        occupation_bonus = 0.2 if is_footballer else 0.0
        country_bonus = 0.0
        country_text = normalize_name(f"{country_pt} {country_en}")
        desc = " ".join(entity.get("descriptions", {}).get(lang, {}).get("value", "") for lang in ["en", "pt", "es", "fr"]) 
        if normalize_name(country_pt) in normalize_name(desc) or normalize_name(country_en) in normalize_name(desc):
            country_bonus = 0.15
        return min(1.0, name_score + occupation_bonus + country_bonus)

    def _extract(self, entity: dict[str, Any]) -> PlayerEnrichment:
        qid = entity.get("id", "UNKNOWN")
        claims = entity.get("claims", {})
        labels = self._labels(entity)
        sitelinks = entity.get("sitelinks", {})
        wiki = sitelinks.get("enwiki", {}).get("title") or sitelinks.get("ptwiki", {}).get("title") or "UNKNOWN"
        wikipedia_url = "UNKNOWN" if wiki == "UNKNOWN" else "https://en.wikipedia.org/wiki/" + wiki.replace(" ", "_")

        birth = self._time_claim(claims.get("P569", []))
        height = self._quantity_claim(claims.get("P2048", []), multiply_meter_to_cm=True)
        weight = self._quantity_claim(claims.get("P2067", []), multiply_meter_to_cm=False)
        position = self._position(claims.get("P413", []))
        club_qid = self._current_team_qid(claims.get("P54", []))
        club_name = "UNKNOWN"
        if club_qid:
            club_ent = self._load_entity(club_qid)
            if club_ent:
                club_name = self._best_label(club_ent)

        return PlayerEnrichment(
            wikidataId=qid,
            wikipediaUrl=wikipedia_url,
            clubName=club_name or "UNKNOWN",
            clubCountry="UNKNOWN",
            position=position,
            birthDate=birth,
            heightCm=height,
            weightKg=weight,
            evidence={"labels": labels, "claimsUsed": ["P569", "P2048", "P2067", "P413", "P54"]},
        )

    def _labels(self, entity: dict[str, Any]) -> dict[str, str]:
        return {k: v.get("value", "") for k, v in entity.get("labels", {}).items() if v.get("value")}

    def _aliases(self, entity: dict[str, Any]) -> list[str]:
        out = []
        for vals in entity.get("aliases", {}).values():
            for v in vals:
                if v.get("value"):
                    out.append(v["value"])
        return out

    def _best_label(self, entity: dict[str, Any]) -> str:
        labels = self._labels(entity)
        return labels.get("en") or labels.get("pt") or next(iter(labels.values()), "UNKNOWN")

    def _time_claim(self, stmts: list[dict[str, Any]]) -> str:
        for st in stmts:
            val = st.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("time")
            if not val:
                continue
            m = re.match(r"^[+]?([0-9]{4})-([0-9]{2})-([0-9]{2})", val)
            if m:
                y, mo, d = m.groups()
                return f"{d}-{mo}-{y}"
        return "UNKNOWN"

    def _quantity_claim(self, stmts: list[dict[str, Any]], multiply_meter_to_cm: bool) -> int:
        for st in stmts:
            val = st.get("mainsnak", {}).get("datavalue", {}).get("value", {})
            amount = val.get("amount")
            if amount is None:
                continue
            try:
                number = float(str(amount).replace("+", ""))
                unit = val.get("unit", "")
                if multiply_meter_to_cm:
                    # Wikidata costuma guardar altura em metro; se vier 1.78 => 178 cm.
                    if number < 3:
                        return int(round(number * 100))
                    return int(round(number))
                return int(round(number))
            except Exception:
                continue
        return 0

    def _position(self, stmts: list[dict[str, Any]]) -> str:
        for st in stmts:
            qid = st.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id")
            if not qid:
                continue
            ent = self._load_entity(qid)
            label = normalize_name(self._best_label(ent or {}))
            for key, val in POSITION_MAP.items():
                if normalize_name(key) in label or label in normalize_name(key):
                    return val
        return "UNKNOWN"

    def _current_team_qid(self, stmts: list[dict[str, Any]]) -> str:
        best_qid = ""
        best_start = ""
        for st in stmts:
            mainsnak = st.get("mainsnak", {})
            qid = mainsnak.get("datavalue", {}).get("value", {}).get("id")
            if not qid:
                continue
            qualifiers = st.get("qualifiers", {})
            has_end = "P582" in qualifiers
            if has_end:
                continue
            start = ""
            if "P580" in qualifiers:
                start = qualifiers["P580"][0].get("datavalue", {}).get("value", {}).get("time", "")
            rank = st.get("rank", "normal")
            weight = "2" if rank == "preferred" else "1"
            sort_key = weight + start
            if sort_key > best_start:
                best_start = sort_key
                best_qid = qid
        if best_qid:
            return best_qid
        # fallback: último P54, mesmo se tiver end date
        for st in reversed(stmts):
            qid = st.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id")
            if qid:
                return qid
        return ""
