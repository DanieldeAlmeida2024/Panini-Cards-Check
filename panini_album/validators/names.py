from __future__ import annotations
from rapidfuzz import fuzz
from panini_album.utils.text import normalize_name

def same_player(expected: str, found: str, threshold: int = 92) -> tuple[bool, int, str, str]:
    a = normalize_name(expected)
    b = normalize_name(found)
    if a == b:
        return True, 100, a, b
    score = fuzz.token_sort_ratio(a, b)
    return score >= threshold, int(score), a, b
