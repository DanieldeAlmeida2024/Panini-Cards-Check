from __future__ import annotations

def expected_type_for_slot(slot: int) -> str:
    if slot == 1:
        return "BADGE"
    if slot == 13:
        return "SQUAD"
    if 2 <= slot <= 12 or 14 <= slot <= 20:
        return "PLAYER"
    return "SPECIAL"

def player_index_for_slot(slot: int) -> int:
    """Retorna índice 0-based do jogador no gabarito para slots de jogador."""
    if 2 <= slot <= 12:
        return slot - 2
    if 14 <= slot <= 20:
        return slot - 3
    raise ValueError(f"Slot {slot} não é slot de jogador")

def slot_for_player_index(index: int) -> int:
    """Converte índice 0-based dos 18 jogadores para slot Panini."""
    if not 0 <= index <= 17:
        raise ValueError("Cada seleção deve ter 18 jogadores")
    return index + 2 if index <= 10 else index + 3
