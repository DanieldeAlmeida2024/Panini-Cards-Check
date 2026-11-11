# Controle de versões — Panini-Cards-Check

ID: **PAN-DOC** · versão **1.1.0 proposta** · 11/11/2026 · código analisado `99e3b3c60af763b54020fc2e994adf97eb2030dd`.

| Artefato | Versão | Escopo |
|---|---|---|
| [Projeto](../projeto/ESPECIFICACAO.md) | 1.1.0 proposta | Domínio, contratos e fluxos |
| [UML](../uml/README.md) | 1.1.0 proposta | Diagramas do repositório |
| [Testes](../testes/PLANO_DE_TESTES.md) | 1.1.0 proposta | Plano, evidências e lacunas |

Aumentar MAJOR para quebra de contrato/estado, MINOR para funcionalidade/caso novo e PATCH para correção de documentação. Todo PR funcional deve atualizar estes documentos e registrar execução por commit; nunca chamar cenários planejados de PASS.


## Linha de base e histórico da revisão

| Versão | Referência | Mudança específica | Gate |
|---|---|---|---|
| 1.0.0 | main `97d2a337c4673d067ed3280140f8f8ea629b4909` | Controle de figurinhas e documentação da arquitetura inicial | Build Vite não garantia typecheck nem testes de estado |
| 1.1.0 (proposta) | `fix/collection-state-validation-ci-20261111` | `normalizeCollection` isolado e testado; filtros de IDs e quantidades; `localStorage` também normalizado; `tsc --noEmit` passa a integrar build e CI | CI TypeScript/Node 22/Vite aprovado no #43110961065 |

**Contrato de intercâmbio:** `ExportPayload.version=1` permanece compatível. A versão 1.1.0 é da especificação/documentação, **não** da estrutura JSON exportada. Nenhum dado em navegadores reais foi migrado, não foi feito deploy.


### Resultado do primeiro typecheck (antes de correções)
- [GitHub Actions #43110702702](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43110702702) falhou na **compilação TypeScript** com TS18047 (`shell` possivelmente nulo no render) e TS2339 (propriedade `navigator.standalone` exclusiva de alguns browsers, fora do tipo padrão).
- **Correção neste commit:** o guard de render agora verifica `shell`; a API não padronizada é tratada como interface estendida com propriedade opcional. Esses erros existiam sem serem detectados pelo Vite build anterior.
- O novo HEAD deve rodar novamente typecheck, testes Node e build. Um CI anterior vermelho não pode ser tratado como aprovação.


### Revisão do gate após correção TypeScript

- Primeira execução [CI #43110702702](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43110702702) **failure** por `shell` possivelmente `null` e propriedade Safari `navigator.standalone` não declarada; ambas corrigidas no código e explicadas nos documentos.
- Execução de revisão [CI #43110961065](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43110961065) **success**: `tsc --noEmit`, testes de coleção em Node 22 e build Vite no commit `3b362ff8a89fe1342323a1cd64d4c16b1f6445c1`.
- **Pendente:** Playwright em browser, teste real de PWA offline/import-export, armazenamento privado, políticas de imagens. Nenhum deploy Vercel foi solicitado neste PR.


## Registro de integração e testes browser — 11/11/2026

| Versão documental | Commit / PR | Gate / implantação |
|---|---|---|
| **1.1.0 integrada** | [PR #3](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/pull/3), squash `9a1b73f68c30dc3047327407a97de93932254e4e` | [CI #43111881405](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43111881405): TypeScript, testes unitários e Vite aprovados; sem deploy |
| **1.2.0 proposta** | `test/browser-persistence-no-vercel-20261111` | Introduz testes Chromium reais para PAN-01/02/03/04/05/06/12; CI browser pendente no primeiro commit |

O proprietário retirou o projeto correspondente da Vercel. O status legado `Vercel: Deployment was blocked` não representa a qualidade do código da aplicação. O arquivo `vercel.json` é removido **apenas nesta branch**; não há vínculo/configuração de outro provedor no workflow e nenhum deploy é executado.


## Evidência executada — Chromium e TypeScript

- [Workflow navegador #43114237035](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43114237035): **4/4 testes Chromium aprovados**, com browser headless, Vite local, arquivo JSON sintético e storage em contextos isolados.
- [Workflow TypeScript/Vite #43114236930](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43114236930): **success** para `tsc --noEmit`, unitários Node e build.
- Commit verificado: `5375cf0f8c65f690f8381abda38cdb5033a20f56`; alterações documentais posteriores devem executar o CI novamente.
- Sem Vercel ou publicação; **não foram executados** Safari/Firefox, PWA offline ou acessibilidade por leitor de tela.


## Versão 1.3.0 proposta — regressão de acessibilidade por teclado (11/11/2026)

| Marco | Código / revisão | Evidência |
|---|---|---|
| **1.2.0 integrada** | [PR #4](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/pull/4), squash `fee61d282e2fdfc69e217e41534c5a70385a9aca` | Chromium 4/4, TS e Vite aprovados; hospedagem Vercel removida |
| **1.3.0 proposta** | `fix/keyboard-sticker-repeat-20261111` | Corrigir propagação `keydown` entre cartão e controles internos, preservar foco; novos E2E PAN-15 pendentes de CI |

**Não alterar** o schema JSON v1 nem o armazenamento da coleção. A correção se limita à interação de teclado. Nenhuma implantação web.


### Evidência verificada no CI da revisão 1.3.0

- [GitHub Actions #43116494337](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43116494337): **6/6 PASS**. Seis cenários Chromium aprovados, incluindo os dois testes PAN-15 de Enter/Espaço e preservação de foco; typecheck e Vite aprovados no job separado.
- [TypeScript e Vite #43116494356](https://github.com/DanieldeAlmeida2024/Panini-Cards-Check/actions/runs/43116494356): **success**.
- Commit de código testado: `ff9304a02d3b85b8f639df4ac12b717c876e00a1`. Documentação adicionada depois do run; novo HEAD deverá manter os mesmos gates verdes antes do merge.
- Sem deploy; CI não substitui testes de segurança/rede/ambiente real fora do escopo.
