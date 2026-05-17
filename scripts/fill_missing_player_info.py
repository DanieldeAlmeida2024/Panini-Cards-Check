from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from urllib.parse import quote

import requests

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from panini_album.enrichers.wikipedia_infobox import WikipediaInfoboxEnricher
from panini_album.utils.text import normalize_name

OUTPUT_JSON = ROOT / "output" / "panini_world_cup_2026.json"
PUBLIC_JSON = ROOT / "public" / "data" / "panini_world_cup_2026.json"


def needs_info(player: dict, clubs_by_id: dict[int, dict]) -> bool:
    club = clubs_by_id.get(player.get("clubId", 0), {})
    return (
        player.get("birthDate") in {"", "UNKNOWN", None}
        or not player.get("heightCm")
        or player.get("position") in {"", "UNKNOWN", None}
        or club.get("name") in {"", "UNKNOWN", None}
    )


def wikipedia_search(session: requests.Session, name: str, country: str) -> str:
    queries = [
        f"{name} footballer {country}",
        f"{name} soccer player {country}",
        f"{name} footballer",
    ]
    for query in queries:
        params = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "srlimit": 5,
            "format": "json",
            "origin": "*",
        }
        try:
            response = session.get("https://en.wikipedia.org/w/api.php", params=params, timeout=10)
            response.raise_for_status()
            results = response.json().get("query", {}).get("search", [])
        except Exception:
            results = []

        target = normalize_name(name)
        for item in results:
            title = item.get("title", "")
            norm = normalize_name(title)
            snippet = normalize_name(item.get("snippet", ""))
            if target in norm or norm in target or ("football" in snippet and target.split(" ")[0] in norm):
                return "https://en.wikipedia.org/wiki/" + quote(title.replace(" ", "_"))
        time.sleep(0.1)
    return "UNKNOWN"


def club_id_for(clubs: list[dict], club_name: str) -> int:
    key = club_name.casefold()
    for club in clubs:
        if str(club.get("name", "")).casefold() == key:
            return club["id"]
    next_id = max([club["id"] for club in clubs] or [0]) + 1
    clubs.append({"id": next_id, "name": club_name, "country": "UNKNOWN"})
    return next_id


def main() -> None:
    data = json.loads(OUTPUT_JSON.read_text(encoding="utf-8"))
    countries_by_id = {country["id"]: country for country in data["countries"]}
    clubs = data.setdefault("clubs", [])
    clubs_by_id = {club["id"]: club for club in clubs}
    enricher = WikipediaInfoboxEnricher(cache_dir=str(ROOT / ".cache"), timeout=10, delay=0.05)
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "PaniniCardsCheck/1.0 (local missing player data enrichment)",
            "Accept-Language": "en,pt-BR;q=0.8,pt;q=0.7",
        }
    )

    processed = 0
    filled = {"birthDate": 0, "heightCm": 0, "position": 0, "clubId": 0}
    searched = 0

    for player in data.get("players", []):
        if player.get("name", "").startswith("UNKNOWN_PLAYER_") or not needs_info(player, clubs_by_id):
            continue

        country = countries_by_id.get(player.get("countryId"), {})
        country_en = country.get("nameEn", "")
        wikipedia_url = player.get("externalIds", {}).get("wikipedia") or "UNKNOWN"
        if wikipedia_url == "UNKNOWN":
            wikipedia_url = wikipedia_search(session, player["name"], country_en)
            searched += 1

        if wikipedia_url == "UNKNOWN":
            continue

        result = enricher.enrich_player(player["name"], country_en, wikipedia_url)
        enrichment = player.setdefault("dataQuality", {}).setdefault("enrichment", {})
        enrichment["wikipediaSearchInfobox"] = {
            "found": result.found,
            "wikipediaUrl": result.wikipediaUrl,
            "clubName": result.clubName,
            "position": result.position,
            "birthDate": result.birthDate,
            "heightCm": result.heightCm,
            "warnings": result.warnings,
        }

        if result.wikipediaUrl != "UNKNOWN":
            player.setdefault("externalIds", {})["wikipedia"] = result.wikipediaUrl
        if player.get("birthDate") in {"", "UNKNOWN", None} and result.birthDate != "UNKNOWN":
            player["birthDate"] = result.birthDate
            filled["birthDate"] += 1
        if not player.get("heightCm") and result.heightCm:
            player["heightCm"] = result.heightCm
            filled["heightCm"] += 1
        if player.get("position") in {"", "UNKNOWN", None} and result.position != "UNKNOWN":
            player["position"] = result.position
            filled["position"] += 1
        current_club = clubs_by_id.get(player.get("clubId", 0), {})
        if current_club.get("name") in {"", "UNKNOWN", None} and result.clubName != "UNKNOWN":
            player["clubId"] = club_id_for(clubs, result.clubName)
            clubs_by_id = {club["id"]: club for club in clubs}
            filled["clubId"] += 1

        processed += 1
        if processed % 25 == 0:
            print(f"[MISSING] processados={processed} preenchidos={filled}", flush=True)
        time.sleep(0.05)

    data.setdefault("metadata", {})["missingInfoEnrichment"] = {
        "enabled": True,
        "provider": "Wikipedia search + infobox",
        "processedPlayers": processed,
        "wikipediaSearches": searched,
        "filled": filled,
        "note": "Preenche apenas campos ausentes quando a infobox publica da Wikipedia traz o dado.",
    }

    serialized = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    OUTPUT_JSON.write_text(serialized, encoding="utf-8")
    PUBLIC_JSON.write_text(serialized, encoding="utf-8")
    print(f"[MISSING] finalizado processados={processed} preenchidos={filled}")


if __name__ == "__main__":
    main()
