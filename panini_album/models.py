from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field

class Country(BaseModel):
    id: int
    group: str
    code: str
    namePt: str
    nameEn: str

class Club(BaseModel):
    id: int
    name: str = "UNKNOWN"
    country: str = "UNKNOWN"

class Player(BaseModel):
    id: int
    name: str
    normalizedName: str
    countryId: int
    clubId: int
    position: str = "UNKNOWN"
    birthDate: str = "UNKNOWN"
    heightCm: int = 0
    weightKg: int = 0
    externalIds: dict[str, str] = Field(default_factory=dict)
    dataQuality: dict[str, Any] = Field(default_factory=dict)

class AlbumPage(BaseModel):
    id: int
    type: Literal["COUNTRY", "SPECIAL"]
    title: str
    group: str = "SPECIAL"
    countryId: int = 0
    startCode: str
    endCode: str
    slots: int

class Sticker(BaseModel):
    id: int
    code: str
    albumPageId: int
    countryId: int
    playerId: int
    slot: int
    type: Literal["BADGE", "PLAYER", "SQUAD", "SPECIAL"]
    title: str
    scope: str = "BASE_ALBUM"
    dataQuality: dict[str, Any] = Field(default_factory=dict)

class Conflict(BaseModel):
    id: int
    severity: Literal["INFO", "WARN", "ERROR"]
    source: str
    code: str = "UNKNOWN"
    countryCode: str = "UNKNOWN"
    slot: int = 0
    field: str
    expected: str
    found: str
    message: str

class ExternalSticker(BaseModel):
    source: str
    code: str
    countryCode: str = "UNKNOWN"
    slot: int = 0
    type: str = "UNKNOWN"
    playerName: str = "UNKNOWN"
    title: str = "UNKNOWN"
    raw: dict[str, Any] = Field(default_factory=dict)
