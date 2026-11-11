# Plano de testes — álbum de figurinhas Copa 2026

> **PAN — documentação v1.1.0 proposta** · 11/11/2026 · revisão do código `99e3b3c60af763b54020fc2e994adf97eb2030dd`.


## Ferramentas e evidência existente
`package.json` oferece `npm run dev`, `npm run build` e `npm run preview`, além de scripts auxiliares de imagens e dados. `tests/test_documentacao.py` verifica estrutura documental; **não há evidência de suíte automatizada de interface** no snapshot. Planejar testes browser/E2E com Playwright ou equivalente sem atribuir execução.

| ID | Prioridade | Cenário | Verificação |
|---|---|---|---|
| PAN-01 | P0 | Carregar base do álbum | 200 e coleção com países, clubes, jogadores e figurinhas |
| PAN-02 | P0 | Registrar uma figurinha | Quantidade persistida no localStorage |
| PAN-03 | P0 | Adicionar figurinha repetida | `repeatCount=quantity-1` e card atualizado |
| PAN-04 | P0 | Recarregar navegador | Coleção mantém quantidades |
| PAN-05 | P0 | Importar JSON antigo e novo | `normalizeCollection` aceita formatos suportados |
| PAN-06 | P0 | Importar quantidade negativa, NaN e texto | Valor descartado sem violar coleção |
| PAN-07 | P1 | Busca por jogador com acento | `normalize` remove diacríticos para comparação |
| PAN-08 | P1 | Trocar filtro por seleção | Cards corretos por countryId |
| PAN-09 | P0 | Base `/data/*.json` indisponível | Mensagem de erro clara |
| PAN-10 | P1 | Manifesto de imagens 404 | Fallback SVG mantém cards úteis |
| PAN-11 | P1 | Imagem externa indisponível | Conteúdo continua acessível |
| PAN-12 | P1 | Exportar coleção | app, version, exportedAt, collection consistentes |
| PAN-13 | P1 | Instalação PWA/service worker | Não impedir uso quando não suportado |
| PAN-14 | P0 | XSS em dados de jogador/código | `escapeHtml` bloqueia HTML injetado |
| PAN-15 | P1 | Teclado/leitor de tela | Cards e controles alcançáveis com estados anunciados |

## Evidência e execução
```bash
npm ci
npm run build
npm run preview
```
Executar testes interativos em Chrome e Firefox no ambiente local antes do deploy, capturando screenshots, estado inicial e dados de teste. Não carregar figurinhas reais no navegador de testes do usuário. Nenhum dos cenários PAN-01–PAN-15 deve ser marcado PASS apenas por análise estática.


## Testes automatizados acrescentados — v1.1.0 proposta

Os sete testes `tests/collection-state.test.ts` executam as **regras puras** sem DOM. O contrato é coberto por:

| Caso original | Verificação implementada | Limite de interpretação |
|---|---|---|
| PAN-04 | Carregamento de JSON persistido filtra IDs obsoletos | Teste de função; persistência real no navegador pendente |
| PAN-05 | Formatos legado e exportado seguem aceitos | Sem teste de upload por elemento HTML |
| PAN-06 | Negativos, zeros, texto, booleano, `Infinity` e decimais inválidos não entram | Quantidade >0 truncada dentro de limites seguros |
| PAN-14 | `__proto__`, `constructor`, IDs falsos/fora do catálogo não contaminam estado | Escape HTML em DOM continua exigindo Playwright |

**Gates:** `npm ci` → `npm run typecheck` → `npm run test:unit` → `npm run build` usando Node 22 em `.github/workflows/verify.yml`. O último SHA da branch precisa apresentar checks success no GitHub. Os casos browser PAN-01..03/07..13/15 continuam sem E2E e devem ser mantidos como planejados.


**Correção de compilação detectada pelo gate:** a primeira execução CI #43110702702 falhou no `tsc --noEmit` por elemento shell opcional e tipo incompleto de Navigator. O patch introduz verificação explícita de `shell` e `Navigator & {standalone?:boolean}`; aguarda rerun no HEAD. Isso demonstra por que somente `vite build` não bastava.


**Resultado verificado:** [run #43110961065](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43110961065), Node 22, job de verificação **success**. O teste de `normalizeCollection` foi executado; typecheck e build passaram. Ainda faltam os critérios de interface e PWA em navegador real. O check separado **Vercel Preview Comments** não comprova publicação.


## Regressão E2E introduzida em 1.2.0

| IDs do plano | Exercício real no Chromium | Estado inicial |
|---|---|---|
| PAN-01 | App carrega base e renderiza `.sticker-card` | Pendente CI browser |
| PAN-02/04 | Clique no card altera `localStorage` e reload conserva `aria-pressed` | Pendente CI browser |
| PAN-03 | Botão `+` incrementa quantidade, `.repeat-count` mostra 1 com total 2 | Pendente CI browser |
| PAN-05/06 | File chooser importa JSON v1, filtra item ausente e quantidade negativa | Pendente CI browser |
| PAN-12 | Download via Blob mantém nome, formato v1, timestamp e quantidade | Pendente CI browser |

**Testes:** `tests/browser-smoke.test.mjs`. Playwright instalado de forma efêmera com versão fixa no runner; não altera o `package-lock` da aplicação. UI de exportação e armazenamento é testada no browser, mas **não** instalação PWA offline. O workflow é executado apenas com localhost, sem Vercel.


## Evidência executada — Chromium e TypeScript

- [Workflow navegador #43114237035](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43114237035): **4/4 testes Chromium aprovados**, com browser headless, Vite local, arquivo JSON sintético e storage em contextos isolados.
- [Workflow TypeScript/Vite #43114236930](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43114236930): **success** para `tsc --noEmit`, unitários Node e build.
- Commit verificado: `5375cf0f8c65f690f8381abda38cdb5033a20f56`; alterações documentais posteriores devem executar o CI novamente.
- Sem Vercel ou publicação; **não foram executados** Safari/Firefox, PWA offline ou acessibilidade por leitor de tela.


## PAN-15 — regressões reais de acessibilidade por teclado (1.3.0 proposta)

- **Novo teste 1:** foco no cartão, Enter → marca quantidade 1 e mantém foco; foco em `+`, Enter → quantidade 2 sem desmarcar o cartão e mantém foco no botão; Espaço no mesmo botão → quantidade 3.
- **Novo teste 2:** Espaço no cartão marca quantidade 1 e mantém foco.
- **Critério de rejeição:** não confundir `keydown` propagado de botão interno com acionamento da `.sticker-card`; o navegador já gera `click` de botões nativos.
- **Evidência:** registrar run Chromium do HEAD do PR. Teste de leitor de tela, tab order completo e navegação por modais ainda pendentes.


### Evidência verificada no CI da revisão 1.3.0

- [GitHub Actions #43116494337](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43116494337): **6/6 PASS**. Seis cenários Chromium aprovados, incluindo os dois testes PAN-15 de Enter/Espaço e preservação de foco; typecheck e Vite aprovados no job separado.
- [TypeScript e Vite #43116494356](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43116494356): **success**.
- Commit de código testado: `ff9304a02d3b85b8f639df4ac12b717c876e00a1`. Documentação adicionada depois do run; novo HEAD deverá manter os mesmos gates verdes antes do merge.
- Sem deploy; CI não substitui testes de segurança/rede/ambiente real fora do escopo.


## PAN-PWA01/02 — testes E2E reais de primeiro uso offline

| ID | Prova automatizada | Resultado inicial |
|---|---|---|
| PAN-PWA01 | Vite build → Chromium controlado por SW → JS/CSS e JSON em CacheStorage → desligar rede → reload renderiza álbum e figura selecionada | Aguardando CI |
| PAN-PWA02 | Cache de aplicação contém somente URLs de **mesma origem** | Aguardando CI |

O novo workflow `.github/workflows/offline-pwa.yml` executa em `localhost:4174` e não publica aplicação na Vercel nem em outro provedor. Os seis testes de navegador e os testes unitários existentes permanecem em workflows separados. Escopo não inclui instalação real no Android/iOS ou flags CDN offline.


### Primeiro CI PWA (evidência de falha e reparo)

- [CI #43118864151](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43118864151): **PAN-PWA01 aprovado** — instalou service worker, comprovou cache do JS/CSS e recarregou o álbum offline preservando a figurinha.
- **PAN-PWA02 falhou apenas no teste**: a constante `const URL = ...` do Node sombreava o construtor global `URL`, resultando em `TypeError: URL is not a constructor`, sem evidenciar falha de cache.
- Revisão do teste: renomeada a constante para `BASE_URL`, preservando `new URL(...)` para validar a origem. **O novo HEAD precisa passar novamente no CI** para confirmar ambos os cenários.
