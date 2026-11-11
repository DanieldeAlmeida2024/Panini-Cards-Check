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
