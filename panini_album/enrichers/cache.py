from __future__ import annotations
import json
from pathlib import Path
from typing import Any

class JsonCache:
    def __init__(self, root: str = ".cache"):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def path(self, namespace: str, key: str) -> Path:
        safe = "".join(ch if ch.isalnum() or ch in "._-" else "_" for ch in key)[:180]
        folder = self.root / namespace
        folder.mkdir(parents=True, exist_ok=True)
        return folder / f"{safe}.json"

    def get(self, namespace: str, key: str) -> Any | None:
        p = self.path(namespace, key)
        if not p.exists():
            return None
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            return None

    def set(self, namespace: str, key: str, value: Any) -> None:
        p = self.path(namespace, key)
        p.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
