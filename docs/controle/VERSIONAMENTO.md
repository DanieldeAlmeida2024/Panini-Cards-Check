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
| 1.1.0 (proposta) | `fix/collection-state-validation-ci-20261111` | `normalizeCollection` isolado e testado; filtros de IDs e quantidades; `localStorage` também normalizado; `tsc --noEmit` passa a integrar build e CI | CI TypeScript/Node 22/Vite pendente de evidência |

**Contrato de intercâmbio:** `ExportPayload.version=1` permanece compatível. A versão 1.1.0 é da especificação/documentação, **não** da estrutura JSON exportada. Nenhum dado em navegadores reais foi migrado, não foi feito deploy.
