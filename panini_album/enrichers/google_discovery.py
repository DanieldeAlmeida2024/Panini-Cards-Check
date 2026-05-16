from __future__ import annotations
import time
import urllib.parse
from dataclasses import dataclass, field
import requests
from bs4 import BeautifulSoup
from panini_album.enrichers.cache import JsonCache

@dataclass
class GoogleDiscoveryResult:
    query: str
    links: list[str] = field(default_factory=list)
    error: str = ""
    cached: bool = False

class GoogleDiscovery:
    """
    Descoberta opcional por Google Search.

    IMPORTANTE:
    - Google pode bloquear scraping, responder captcha ou demorar.
    - Este módulo NUNCA é fonte soberana e NUNCA deve travar o build.
    - Ele só registra links candidatos para auditoria/manual review.
    """
    def __init__(self, cache_dir: str = ".cache", timeout: int = 6, delay: float = 0.25, max_results: int = 5):
        self.timeout = timeout
        self.delay = delay
        self.max_results = max_results
        self.cache = JsonCache(cache_dir)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        })

    def search_player(self, player_name: str, country_name: str) -> GoogleDiscoveryResult:
        query = f'{player_name} {country_name} footballer current club date of birth height weight'
        cached = self.cache.get("google_discovery", query)
        if cached:
            return GoogleDiscoveryResult(**cached, cached=True)

        url = "https://www.google.com/search?num=10&q=" + urllib.parse.quote_plus(query)
        try:
            resp = self.session.get(url, timeout=(3, self.timeout))
            resp.raise_for_status()
            html = resp.text
            if "captcha" in html.lower() or "unusual traffic" in html.lower():
                result = GoogleDiscoveryResult(query=query, error="Google bloqueou a busca com captcha/unusual traffic")
                self.cache.set("google_discovery", query, result.__dict__)
                return result

            soup = BeautifulSoup(html, "lxml")
            links: list[str] = []
            for a in soup.select("a"):
                href = a.get("href") or ""
                if href.startswith("/url?q="):
                    parsed = urllib.parse.parse_qs(urllib.parse.urlparse(href).query).get("q", [""])[0]
                    if parsed.startswith("http") and "google." not in parsed and "webcache" not in parsed:
                        links.append(parsed)
                if len(links) >= self.max_results:
                    break
            result = GoogleDiscoveryResult(query=query, links=list(dict.fromkeys(links)))
            self.cache.set("google_discovery", query, result.__dict__)
            time.sleep(self.delay)
            return result
        except Exception as exc:
            result = GoogleDiscoveryResult(query=query, error=f"{type(exc).__name__}: {exc}")
            self.cache.set("google_discovery", query, result.__dict__)
            return result
