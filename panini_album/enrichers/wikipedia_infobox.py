from __future__ import annotations
import re
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from urllib.parse import quote, urlparse

import requests
from bs4 import BeautifulSoup

from panini_album.enrichers.cache import JsonCache
from panini_album.utils.text import normalize_name

MONTHS = {
    "january": "01", "february": "02", "march": "03", "april": "04",
    "may": "05", "june": "06", "july": "07", "august": "08",
    "september": "09", "october": "10", "november": "11", "december": "12",
    "jan": "01", "feb": "02", "mar": "03", "apr": "04", "jun": "06",
    "jul": "07", "aug": "08", "sep": "09", "sept": "09", "oct": "10",
    "nov": "11", "dec": "12",
}

POSITION_MAP = {
    "goalkeeper": "GOALKEEPER",
    "defender": "DEFENDER",
    "centre back": "DEFENDER",
    "center back": "DEFENDER",
    "full back": "DEFENDER",
    "left back": "DEFENDER",
    "right back": "DEFENDER",
    "midfielder": "MIDFIELDER",
    "winger": "FORWARD",
    "forward": "FORWARD",
    "striker": "FORWARD",
}

@dataclass
class WikipediaInfoboxResult:
    source: str = "wikipedia_infobox"
    found: bool = False
    wikipediaUrl: str = "UNKNOWN"
    clubName: str = "UNKNOWN"
    position: str = "UNKNOWN"
    birthDate: str = "UNKNOWN"
    heightCm: int = 0
    weightKg: int = 0
    evidence: dict[str, Any] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)

class WikipediaInfoboxEnricher:
    """Scrapes only public Wikipedia infobox fields.

    This is intentionally a fallback/complement to Wikidata because many player pages
    expose the current club as an infobox row named "Current team", while Wikidata's
    P54 can be stale, historically qualified, or missing an open-ended statement.
    """

    def __init__(self, cache_dir: str = ".cache", timeout: int = 8, delay: float = 0.05):
        self.cache = JsonCache(cache_dir)
        self.timeout = timeout
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "PaniniAlbumRelationalBot/6.0 (local research tool; Wikipedia infobox fallback)",
            "Accept-Language": "en,pt-BR;q=0.8,pt;q=0.7",
        })

    def enrich_player(self, player_name: str, country_en: str, wikipedia_url: str = "UNKNOWN") -> WikipediaInfoboxResult:
        url = self._safe_url(player_name, wikipedia_url)
        key = f"{player_name}__{country_en}__{url}"
        cached = self.cache.get("wikipedia_infobox", key)
        if cached:
            return WikipediaInfoboxResult(**cached)

        result = WikipediaInfoboxResult(wikipediaUrl=url)
        try:
            html = self._fetch(url)
            if not html:
                result.warnings.append("Wikipedia page not fetched")
            else:
                result = self._parse(html, url)
        except Exception as exc:
            result.warnings.append(f"{type(exc).__name__}: {exc}")

        self.cache.set("wikipedia_infobox", key, result.__dict__)
        time.sleep(self.delay)
        return result

    def _safe_url(self, player_name: str, wikipedia_url: str) -> str:
        if wikipedia_url and wikipedia_url != "UNKNOWN":
            parsed = urlparse(wikipedia_url)
            if parsed.netloc.endswith("wikipedia.org"):
                return wikipedia_url
        return "https://en.wikipedia.org/wiki/" + quote(player_name.replace(" ", "_"))

    def _fetch(self, url: str) -> str:
        r = self.session.get(url, timeout=self.timeout)
        if r.status_code == 404:
            return ""
        r.raise_for_status()
        return r.text

    def _parse(self, html: str, url: str) -> WikipediaInfoboxResult:
        soup = BeautifulSoup(html, "lxml")
        infobox = soup.select_one("table.infobox")
        if not infobox:
            return WikipediaInfoboxResult(wikipediaUrl=url, warnings=["Infobox not found"])

        rows: dict[str, str] = {}
        for tr in infobox.select("tr"):
            th = tr.find("th")
            td = tr.find("td")
            if not th or not td:
                continue
            label = self._clean_text(th.get_text(" ", strip=True))
            value = self._clean_text(td.get_text(" ", strip=True))
            if label and value:
                rows[label] = value

        club = self._extract_current_team(infobox, rows)
        position = self._extract_position(rows)
        birth = self._extract_birth_date(rows)
        height = self._extract_height(rows)
        weight = self._extract_weight(rows)

        found = any([club != "UNKNOWN", position != "UNKNOWN", birth != "UNKNOWN", height > 0, weight > 0])
        return WikipediaInfoboxResult(
            found=found,
            wikipediaUrl=url,
            clubName=club,
            position=position,
            birthDate=birth,
            heightCm=height,
            weightKg=weight,
            evidence={"infoboxRows": rows, "fieldsUsed": ["Current team", "Position(s)", "Date of birth", "Height", "Weight"]},
            warnings=[] if found else ["No target fields found in infobox"],
        )

    def _extract_current_team(self, infobox: BeautifulSoup, rows: dict[str, str]) -> str:
        accepted = ["current team", "current club", "team", "club"]
        for label, value in rows.items():
            norm_label = normalize_name(label)
            if any(a == norm_label or a in norm_label for a in accepted):
                # Prefer the first linked club text in the row, because the full text
                # may include shirt number or footnotes.
                tr = self._row_by_label(infobox, label)
                if tr:
                    td = tr.find("td")
                    if td:
                        links = [self._clean_text(a.get_text(" ", strip=True)) for a in td.find_all("a")]
                        links = [x for x in links if x and not x.isdigit() and normalize_name(x) not in {"club", "team"}]
                        if links:
                            return links[0]
                return self._clean_club_value(value)
        return "UNKNOWN"

    def _row_by_label(self, infobox: BeautifulSoup, label: str):
        target = normalize_name(label)
        for tr in infobox.select("tr"):
            th = tr.find("th")
            if th and normalize_name(th.get_text(" ", strip=True)) == target:
                return tr
        return None

    def _clean_club_value(self, value: str) -> str:
        v = re.sub(r"\bNo\.\s*\d+\b", "", value, flags=re.I)
        v = re.sub(r"\bNumber\s*\d+\b", "", v, flags=re.I)
        v = re.sub(r"\s+", " ", v).strip(" ,;|-/")
        return v or "UNKNOWN"

    def _extract_position(self, rows: dict[str, str]) -> str:
        for label, value in rows.items():
            if "position" in normalize_name(label):
                val = normalize_name(value)
                for key, mapped in POSITION_MAP.items():
                    if key in val:
                        return mapped
        return "UNKNOWN"

    def _extract_birth_date(self, rows: dict[str, str]) -> str:
        for label, value in rows.items():
            if "date of birth" in normalize_name(label) or normalize_name(label) == "born":
                parsed = self._parse_date(value)
                if parsed != "UNKNOWN":
                    return parsed
        return "UNKNOWN"

    def _parse_date(self, value: str) -> str:
        # Wikipedia often contains hidden ISO dates in text: "(2000-07-12) 12 July 2000"
        m = re.search(r"(\d{4})-(\d{2})-(\d{2})", value)
        if m:
            y, mo, d = m.groups()
            return f"{d}-{mo}-{y}"
        m = re.search(r"\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b", value)
        if m:
            d, mon, y = m.groups()
            mo = MONTHS.get(mon.lower())
            if mo:
                return f"{int(d):02d}-{mo}-{y}"
        for fmt in ["%B %d, %Y", "%b %d, %Y"]:
            try:
                dt = datetime.strptime(value[:30], fmt)
                return dt.strftime("%d-%m-%Y")
            except Exception:
                pass
        return "UNKNOWN"

    def _extract_height(self, rows: dict[str, str]) -> int:
        for label, value in rows.items():
            if "height" not in normalize_name(label):
                continue
            # 1.76 m, 1,76 m, 176 cm
            m = re.search(r"(\d+(?:[\.,]\d+)?)\s*m\b", value, flags=re.I)
            if m:
                n = float(m.group(1).replace(",", "."))
                return int(round(n * 100 if n < 3 else n))
            m = re.search(r"(\d{2,3})\s*cm\b", value, flags=re.I)
            if m:
                return int(m.group(1))
        return 0

    def _extract_weight(self, rows: dict[str, str]) -> int:
        for label, value in rows.items():
            if "weight" not in normalize_name(label):
                continue
            m = re.search(r"(\d{2,3})\s*kg\b", value, flags=re.I)
            if m:
                return int(m.group(1))
        return 0

    def _clean_text(self, text: str) -> str:
        text = re.sub(r"\[[^\]]+\]", "", text)
        text = text.replace("\xa0", " ")
        text = re.sub(r"\s+", " ", text).strip()
        return text
