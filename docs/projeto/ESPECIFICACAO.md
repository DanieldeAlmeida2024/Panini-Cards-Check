# Álbum Copa 2026 — especificação da aplicação

> **PAN — documentação v1.0.0** · 11/11/2026 · revisão do código `99e3b3c60af763b54020fc2e994adf97eb2030dd`.


## Objetivo e estrutura
Aplicativo web mobile-first para controlar figurinhas de um álbum de seleções/jogadores sem necessidade de conta, servidor de autenticação ou banco remoto. A entrada é `src/main.ts` e a compilação usa `npm run build` (Vite + TypeScript). `public/data/panini_world_cup_2026.json` é a base **somente leitura** com `countries`, `clubs`, `players`, `stickers`.

## Domínio documentado no TypeScript
- `Country`: id, group, code, nome PT/EN.
- `Club`: id, name, country.
- `Player`: id, nome, país, clube, data de nascimento, altura em cm, posição; metadados opcionais de imagem e atribuição.
- `Sticker`: id, código, countryId, playerId, posição (`slot`) e tipo `BADGE | PLAYER | SQUAD | SPECIAL`.
- `AlbumData`: quatro coleções acima.
- `CollectionState`: `Record<string,number>` indexado pelo identificador do adesivo, onde zero/ausência representa não obtido; quantidade acima de 1 representa repetidas.

## Persistência e intercâmbio de dados
A chave de armazenamento local é `panini-world-cup-2026-collection-v1`. `readCollection` recupera JSON do `localStorage`, `writeCollection` grava e `normalizeCollection` aceita estrutura antiga simples ou objeto `{collection:{...}}`. Quantidades inválidas são descartadas; positivas são truncadas para inteiros.

`ExportPayload` registra `app="panini-world-cup-2026-album"`, `version=1`, `exportedAt` e coleção. A versão do **arquivo exportado** é diferente do versionamento desta documentação.

## Apresentação e imagens
- `loadAlbum()` obtém JSON em `/data/panini_world_cup_2026.json` e falha se a resposta não for OK.
- `loadCardImages()` tenta `/images-cards/manifest.json`, degradando para manifesto vazio quando indisponível.
- `stickerSvg()` gera arte SVG local como fallback, evitando cartão vazio.
- `flagUrl()` utiliza bandeiras de `flagcdn.com` para códigos conhecidos; imagem remota pode falhar.
- `buildCard()` cria card acessível com `role=button` e `aria-pressed`, distingue escudo/seleção/jogador e calcula `repeatCount=max(quantity-1,0)`.
- O service worker é registrado em `/sw.js` após carregamento, quando suportado.

## Restrições técnicas
A coleção fica apenas neste navegador/dispositivo; não há sincronização nem recuperação automática após limpeza de storage. Evitar prometer equivalência com álbum físico oficial. Fontes externas e direitos de imagens devem ser revisados. Não interpretar cards renderizados como prova de integridade da base de dados.
