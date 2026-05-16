from __future__ import annotations
from typing import Any
from panini_album.enrichers.wikidata import WikidataEnricher
from panini_album.enrichers.google_discovery import GoogleDiscovery
from panini_album.enrichers.wikipedia_infobox import WikipediaInfoboxEnricher

class EnrichmentEngine:
    def __init__(
        self,
        cache_dir: str = ".cache",
        google_discovery: bool = False,
        max_players: int = 0,
        verbose: bool = False,
        wikidata_timeout: int = 8,
        google_timeout: int = 6,
        google_delay: float = 0.25,
    ):
        self.wikidata = WikidataEnricher(cache_dir=cache_dir, timeout=wikidata_timeout, delay=0.05)
        self.wikipedia = WikipediaInfoboxEnricher(cache_dir=cache_dir, timeout=wikidata_timeout, delay=0.05)
        self.google = GoogleDiscovery(cache_dir=cache_dir, timeout=google_timeout, delay=google_delay) if google_discovery else None
        self.max_players = max_players
        self.verbose = verbose

    def enrich(self, data: dict[str, Any]) -> dict[str, Any]:
        countries_by_id = {c["id"]: c for c in data.get("countries", [])}
        clubs = data.setdefault("clubs", [])
        club_id_by_name = {str(c.get("name", "UNKNOWN")).casefold(): c["id"] for c in clubs}
        next_club_id = max([c["id"] for c in clubs] or [0]) + 1

        players = [p for p in data.get("players", []) if not p.get("name", "").startswith("UNKNOWN_PLAYER_")]
        total = len(players) if not self.max_players else min(len(players), self.max_players)
        enriched_count = 0
        found_count = 0
        club_filled = 0
        errors = []

        if self.verbose:
            print(f"[ENRICH] Iniciando enriquecimento: {total} jogadores | google_discovery={bool(self.google)}")
            print("[ENRICH] Observação: Google é apenas descoberta de links; preenchimento vem principalmente do Wikidata.")

        for idx, player in enumerate(players, start=1):
            if self.max_players and enriched_count >= self.max_players:
                break

            country = countries_by_id.get(player["countryId"], {})
            country_pt = country.get("namePt", "UNKNOWN")
            country_en = country.get("nameEn", country_pt)

            if self.verbose:
                print(f"[ENRICH] {idx}/{total} {player['name']} ({country_en})", flush=True)

            dq = player.setdefault("dataQuality", {})
            dq.setdefault("enrichment", {})

            try:
                result = self.wikidata.enrich_player(player["name"], country_pt, country_en)
            except Exception as exc:
                result = None
                err = {"playerId": player.get("id"), "name": player.get("name"), "source": "wikidata", "error": f"{type(exc).__name__}: {exc}"}
                errors.append(err)
                dq["enrichment"]["wikidata"] = {"found": False, "error": err["error"]}

            google_evidence = {}
            if self.google:
                # Google nunca pode travar/prejudicar a geração.
                try:
                    g = self.google.search_player(player["name"], country_en)
                    google_evidence = {"query": g.query, "links": g.links, "error": g.error, "cached": g.cached}
                    dq["enrichment"]["googleDiscovery"] = google_evidence
                except Exception as exc:
                    dq["enrichment"]["googleDiscovery"] = {"query": "UNKNOWN", "links": [], "error": f"{type(exc).__name__}: {exc}"}

            if result is not None:
                dq["enrichment"]["wikidata"] = {
                    "found": result.found,
                    "confidence": result.confidence,
                    "wikidataId": result.wikidataId,
                    "wikipediaUrl": result.wikipediaUrl,
                    "warnings": result.warnings,
                }

                if result.found:
                    found_count += 1

                # Fallback/complement: Wikipedia infobox often has "Current team"
                # even when Wikidata P54 is missing/stale.
                try:
                    wiki_result = self.wikipedia.enrich_player(player["name"], country_en, result.wikipediaUrl)
                    dq["enrichment"]["wikipediaInfobox"] = {
                        "found": wiki_result.found,
                        "wikipediaUrl": wiki_result.wikipediaUrl,
                        "clubName": wiki_result.clubName,
                        "position": wiki_result.position,
                        "birthDate": wiki_result.birthDate,
                        "heightCm": wiki_result.heightCm,
                        "weightKg": wiki_result.weightKg,
                        "warnings": wiki_result.warnings,
                    }
                    # Use Wikipedia to fill missing fields, and prefer infobox Current team
                    # over UNKNOWN Wikidata club.
                    if result.clubName == "UNKNOWN" and wiki_result.clubName != "UNKNOWN":
                        result.clubName = wiki_result.clubName
                    if result.position == "UNKNOWN" and wiki_result.position != "UNKNOWN":
                        result.position = wiki_result.position
                    if result.birthDate == "UNKNOWN" and wiki_result.birthDate != "UNKNOWN":
                        result.birthDate = wiki_result.birthDate
                    if result.heightCm == 0 and wiki_result.heightCm > 0:
                        result.heightCm = wiki_result.heightCm
                    if result.weightKg == 0 and wiki_result.weightKg > 0:
                        result.weightKg = wiki_result.weightKg
                except Exception as exc:
                    dq["enrichment"]["wikipediaInfobox"] = {"found": False, "error": f"{type(exc).__name__}: {exc}"}
                if result.wikidataId != "UNKNOWN":
                    player.setdefault("externalIds", {})["wikidata"] = result.wikidataId
                if result.wikipediaUrl != "UNKNOWN":
                    player.setdefault("externalIds", {})["wikipedia"] = result.wikipediaUrl

                # Sem null: só troca UNKNOWN/0 quando a fonte encontrou algo.
                if result.position != "UNKNOWN":
                    player["position"] = result.position
                if result.birthDate != "UNKNOWN":
                    player["birthDate"] = result.birthDate
                if result.heightCm > 0:
                    player["heightCm"] = result.heightCm
                if result.weightKg > 0:
                    player["weightKg"] = result.weightKg
                if result.clubName != "UNKNOWN":
                    key = result.clubName.casefold()
                    if key not in club_id_by_name:
                        clubs.append({"id": next_club_id, "name": result.clubName, "country": result.clubCountry or "UNKNOWN"})
                        club_id_by_name[key] = next_club_id
                        next_club_id += 1
                    if player.get("clubId", 0) != club_id_by_name[key]:
                        player["clubId"] = club_id_by_name[key]
                        club_filled += 1

            enriched_count += 1

        data.setdefault("metadata", {})["enrichment"] = {
            "enabled": True,
            "providerOrder": ["wikidata", "wikipedia_infobox_current_team_fallback", "google_discovery_optional"],
            "playersProcessed": enriched_count,
            "playersFoundInWikidata": found_count,
            "clubsFilled": club_filled,
            "errors": errors,
            "noNullPolicy": "Campos ausentes permanecem UNKNOWN/0/[] e são rastreados em dataQuality.enrichment.",
        }
        if self.verbose:
            print(f"[ENRICH] Finalizado: processados={enriched_count}, wikidata_found={found_count}, clubs_filled={club_filled}")
        return data
