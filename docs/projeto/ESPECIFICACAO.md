# Álbum Copa 2026 — especificação da aplicação

> **PAN — documentação v1.1.0 proposta** · 11/11/2026 · revisão do código `99e3b3c60af763b54020fc2e994adf97eb2030dd`.


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
A chave de armazenamento local é `panini-world-cup-2026-collection-v1`. `readCollection` obtinha JSON do `localStorage` sem validação; a revisão 1.1.0 passa a aplicar `normalizeCollection` tanto no estado armazenado quanto nos imports, com filtro por IDs do catálogo carregado. `writeCollection` grava o estado. `normalizeCollection` aceita formato antigo simples ou `{collection:{...}}`; quantidades positivas finitas e seguras são truncadas, com descarte de zero, texto arbitrário, chaves especiais e IDs fora do catálogo.

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


## Contrato reforçado de importação e persistência (v1.1.0 proposta)

- **Compatibilidade:** JSON legado `{"10":2}` e exportado `{"app":"panini-world-cup-2026-album","version":1,"collection":{"10":2}}` continuam aceitos.
- **Proteção do estado:** `normalizeCollection(value, allowedStickerIds)` não aceita arrays, objetos `collection` inválidos, IDs não numéricos/não canônicos, quantidade negativa/zero, texto não numérico, `NaN`, `Infinity`, valores maiores que `Number.MAX_SAFE_INTEGER` ou quantidade fracionária menor que 1. Objetos usam protótipo nulo, evitando chaves perigosas.
- **Fonte da verdade:** o conjunto `allowedStickerIds` é criado a partir do arquivo JSON de catálogo depois do download. O mesmo filtro valida o `localStorage` carregado e importações de arquivo; IDs removidos do álbum não são considerados colecionados.
- **Build:** `npm run build` executa `tsc --noEmit` **antes** de `vite build`; `npm run test:unit` executa testes Node 22 com TypeScript nativo; CI exige todos os gates.
- **Não coberto ainda:** testes browser/Playwright de eventos, quota/limpeza de storage, sincronização entre dispositivos, PWA offline em produção e direitos de imagens de terceiros.

[UML da validação](../uml/04_importacao_estado.puml), [plano de testes](../testes/PLANO_DE_TESTES.md) e [controle documental](../controle/VERSIONAMENTO.md).


**Compatibilidade entre DOM e TypeScript:** a renderização testa a existência do elemento `.shell` antes de ler `dataset`. O campo iOS Safari `navigator.standalone` não faz parte do `Navigator` universal, portanto é lido como propriedade opcional de interface estendida (com fallback pelo `matchMedia`). O tipo correto não altera o funcionamento do botão PWA em navegadores sem a extensão.


**Evidência:** [CI #43110961065](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43110961065) validou TypeScript estrito, função de importação e Vite; o primeiro run #43110702702 havia revelado duas falhas de tipagem e motivou a correção de `.shell` nulo e de `Navigator.standalone` opcional. Isso não executa navegador/PWA reais.


## Browser E2E (1.2.0 proposta, sem produção)

O novo workflow `.github/workflows/browser-smoke.yml` inicia o Vite em `127.0.0.1:4173` e utiliza Playwright `1.56.1` com Chromium headless. Cada teste usa novo contexto/navegador e `serviceWorkers: 'block'` para que o teste não confunda cache PWA com integridade do fluxo de UI.

Coberturas: cards carregados; click, armazenamento e reload; repetidas no DOM/storage; importação de fixture sintética com ID desconhecido/quantidade inválida; exportação JSON (`app`, `version=1`, data e coleção). Esses testes não representam dados de um usuário real. A estrutura JSON exportada continua v1.

**Pendente mesmo com CI verde:** Chrome mobile/Firefox/WebKit, service worker offline, acessibilidade por teclado/leitor de tela, direitos de imagens e testes de stress/quota de storage. O projeto Vercel foi removido pelo proprietário; o repositório não requer deploy automático.


## Evidência executada — Chromium e TypeScript

- [Workflow navegador #43114237035](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43114237035): **4/4 testes Chromium aprovados**, com browser headless, Vite local, arquivo JSON sintético e storage em contextos isolados.
- [Workflow TypeScript/Vite #43114236930](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43114236930): **success** para `tsc --noEmit`, unitários Node e build.
- Commit verificado: `5375cf0f8c65f690f8381abda38cdb5033a20f56`; alterações documentais posteriores devem executar o CI novamente.
- Sem Vercel ou publicação; **não foram executados** Safari/Firefox, PWA offline ou acessibilidade por leitor de tela.
