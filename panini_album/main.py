from __future__ import annotations
import argparse
import json
from pathlib import Path
from panini_album.sources.primary_txt import PrimaryTxtSource
from panini_album.sources.local_csv import LocalCsvSource
from panini_album.sources.cromocheck import CromoCheckSource
from panini_album.sources.laststicker import LastStickerSource
from panini_album.sources.cartophilic import CartophilicSource
from panini_album.builders.relational import RelationalBuilder
from panini_album.validators.album import AlbumInvariantValidator
from panini_album.validators.crosscheck import CrossChecker
from panini_album.report import build_report
from panini_album.enrichers.engine import EnrichmentEngine


def parse_args():
    p = argparse.ArgumentParser(description="Panini FIFA World Cup 2026 relational album builder")
    p.add_argument("--primary", default="input/gabarito_jogadores.txt", help="TXT com o gabarito soberano dos jogadores por país/grupo")
    p.add_argument("--patches", default="", help="JSON opcional para corrigir/substituir países incompletos do gabarito primário")
    p.add_argument("--out", default="output/panini_world_cup_2026.json")
    p.add_argument("--report", default="output/report.json")
    p.add_argument("--local-csv", default="input/external_checklist.csv", help="CSV opcional exportado de site confiável: code,type,title,playerName")
    p.add_argument("--fetch-external", action="store_true", help="Busca fontes externas online para validar numeração")
    p.add_argument("--strict", action="store_true", help="Falha se gabarito primário estiver incompleto ou houver conflito ERROR")
    p.add_argument("--pretty", action="store_true")
    p.add_argument("--enrich-players", action="store_true", help="Enriquece jogadores com clube atual, nascimento, altura, peso e posição via Wikidata")
    p.add_argument("--google-discovery", action="store_true", help="Opcional: faz busca Google para registrar links candidatos no dataQuality; não é fonte soberana")
    p.add_argument("--cache-dir", default=".cache", help="Diretório de cache para Wikidata/Google")
    p.add_argument("--max-players", type=int, default=0, help="Limita enriquecimento para testes. 0 = todos")
    p.add_argument("--verbose", action="store_true", help="Mostra progresso por etapa/jogador")
    p.add_argument("--wikidata-timeout", type=int, default=8, help="Timeout por request do Wikidata")
    p.add_argument("--google-timeout", type=int, default=6, help="Timeout por request do Google Discovery")
    p.add_argument("--google-delay", type=float, default=0.25, help="Delay entre buscas Google")
    return p.parse_args()


def main():
    args = parse_args()
    primary = PrimaryTxtSource(args.primary, args.patches or None)
    parsed = primary.read()
    primary_errors = primary.validate_completeness(parsed)

    builder = RelationalBuilder(parsed)
    data = builder.build()

    invariant_validator = AlbumInvariantValidator()
    invariant_conflicts = invariant_validator.validate(data)

    checker = CrossChecker()
    sticker_by_code = {
        s["code"]: {
            **s,
            "countryCode": next((c["code"] for c in data["countries"] if c["id"] == s["countryId"]), "SPECIAL"),
        }
        for s in data["stickers"]
    }

    for err in primary_errors:
        checker.add("ERROR" if args.strict else "WARN", primary.name, "primaryCompleteness", "18 players/country", err, "Gabarito primário incompleto. Em modo não estrito, placeholders UNKNOWN_PLAYER_* são criados.")

    local_items = LocalCsvSource(args.local_csv).parse()
    for item in local_items:
        checker.validate_external(item, sticker_by_code)
    print(f"[OK] local_csv: {len(local_items)} itens")

    if args.fetch_external:
        for source in [CromoCheckSource(), LastStickerSource(), CartophilicSource()]:
            try:
                items = source.parse()
                for item in items:
                    checker.validate_external(item, sticker_by_code)
                print(f"[OK] {source.name}: {len(items)} itens")
            except Exception as exc:
                checker.add("WARN", source.name, "fetch", "reachable source", type(exc).__name__, str(exc))
                print(f"[WARN] {source.name}: {exc}")

    if args.enrich_players:
        engine = EnrichmentEngine(cache_dir=args.cache_dir, google_discovery=args.google_discovery, max_players=args.max_players, verbose=args.verbose, wikidata_timeout=args.wikidata_timeout, google_timeout=args.google_timeout, google_delay=args.google_delay)
        data = engine.enrich(data)

    conflicts = [c.model_dump() for c in [*invariant_conflicts, *checker.conflicts]]
    data["conflicts"] = conflicts
    data["report"] = build_report(data, conflicts)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    report = Path(args.report)
    report.parent.mkdir(parents=True, exist_ok=True)

    indent = 2 if args.pretty else None
    out.write_text(json.dumps(data, ensure_ascii=False, indent=indent), encoding="utf-8")
    report.write_text(json.dumps(data["report"], ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[DONE] JSON: {out.resolve()}")
    print(f"[DONE] REPORT: {report.resolve()}")
    print("[SUMMARY]", data["report"]["summary"])

    if args.strict:
        errors = [c for c in conflicts if c["severity"] == "ERROR"]
        if errors:
            print(f"[STRICT] {len(errors)} erro(s) encontrados. Corrija antes de usar como base final.")
            raise SystemExit(2)

if __name__ == "__main__":
    main()
