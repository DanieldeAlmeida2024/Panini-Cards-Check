from __future__ import annotations
import re
import requests
from bs4 import BeautifulSoup
from panini_album.models import ExternalSticker
from panini_album.utils.text import normalize_code

class HtmlSource:
    name = "html_source"
    url = ""
    timeout = 30

    def fetch_html(self) -> str:
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; PaniniAlbumValidator/3.0; +https://local)",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        }
        resp = requests.get(self.url, headers=headers, timeout=self.timeout)
        resp.raise_for_status()
        return resp.text

    def parse(self) -> list[ExternalSticker]:
        raise NotImplementedError

    def _extract_from_text(self, text: str) -> list[ExternalSticker]:
        # Captura padrões como BRA-14 Vinícius, BRA14 - Vinícius, BRA 14 Vinícius.
        items: list[ExternalSticker] = []
        for match in re.finditer(r"\b([A-Z]{2,3})\s*-?\s*(\d{1,2})\b\s*[-–:]?\s*([^\n\r<]{2,80})", text):
            country = match.group(1).upper()
            slot = int(match.group(2))
            code = normalize_code(f"{country}-{slot}")
            title = re.sub(r"\s+", " ", match.group(3)).strip(" -–:|")
            if not title:
                continue
            kind = "UNKNOWN"
            if slot == 1:
                kind = "BADGE"
            elif slot == 13:
                kind = "SQUAD"
            elif 2 <= slot <= 12 or 14 <= slot <= 20:
                kind = "PLAYER"
            items.append(ExternalSticker(source=self.name, code=code, countryCode=country, slot=slot, type=kind, playerName=title if kind == "PLAYER" else "UNKNOWN", title=title))
        return items

class GenericChecklistSource(HtmlSource):
    def parse(self) -> list[ExternalSticker]:
        html = self.fetch_html()
        soup = BeautifulSoup(html, "lxml")
        text = soup.get_text("\n")
        return self._extract_from_text(text)
