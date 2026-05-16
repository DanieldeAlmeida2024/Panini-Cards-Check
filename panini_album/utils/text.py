from __future__ import annotations
import re
from unidecode import unidecode
from panini_album.data.aliases import ALIASES

def normalize_name(value: str) -> str:
    cleaned = unidecode(value or "").lower().strip()
    cleaned = cleaned.replace("’", "'").replace("`", "'")
    cleaned = re.sub(r"[^a-z0-9' ]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return ALIASES.get(cleaned, cleaned)

def normalize_code(value: str) -> str:
    v = (value or "").upper().strip()
    v = re.sub(r"[^A-Z0-9]+", "-", v)
    v = re.sub(r"-+", "-", v).strip("-")
    m = re.match(r"^([A-Z]{2,3})-?0*([0-9]{1,2})$", v)
    if m:
        return f"{m.group(1)}-{int(m.group(2))}"
    return v

def safe(value, default="UNKNOWN"):
    if value is None:
        return default
    if isinstance(value, str) and not value.strip():
        return default
    return value
