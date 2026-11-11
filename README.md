# Panini-Cards-Check

Aplicativo web mobile-first para acompanhar figurinhas do álbum Copa 2026.

## Tecnologias e organização
Vite, TypeScript, Python, localStorage. Código e configurações principais: `package.json, public/data/, panini_album/`.

## Começar
npm ci && npm run dev

**Validação nativa:** `npm run build`. Não afirmar sucesso sem executar o procedimento com as dependências necessárias.

## Cuidados
Dados locais do navegador não são sincronizados. Validar fonte e integridade das imagens/dados.

**Documentação técnica:** [Requisitos](docs/REQUISITOS.md) · [Arquitetura](docs/ARQUITETURA.md) · [UML](docs/UML.puml) · [Plano de testes](docs/PLANO_TESTES.md) · [Guia para IA](AGENTS.md).

---

## Conteúdo anterior do repositório (preservado)

# Panini Cards Check

Aplicacao web mobile-first para gerenciar as figurinhas do album Panini da Copa do Mundo 2026.

## Funcionalidades

- Grade por selecao com 20 cartas: escudo no slot 1, foto da selecao no slot 13 e jogadores nos demais slots.
- Filtro por selecao e busca por nome do jogador, numero do slot ou codigo da carta.
- Estado salvo no navegador com `localStorage`, sem alterar a base oficial.
- Controle de cartas selecionadas e repetidas diretamente no card.
- Lista completa e compacta das cartas ainda nao selecionadas pelo usuario.
- Configuracao pronta para deploy na Vercel.

## Dados

A aplicacao usa como fonte somente leitura:

- `public/data/panini_world_cup_2026.json`

Esse arquivo foi copiado a partir de `output/panini_world_cup_2026.json`.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Preview de producao

```bash
npm run preview
```

## Documentação técnica versionada

- [Especificação e análise de domínio](docs/projeto/ESPECIFICACAO.md)
- [Diagramas UML editáveis](docs/uml/README.md)
- [Plano de testes](docs/testes/PLANO_DE_TESTES.md)
- [Controle de versões](docs/controle/VERSIONAMENTO.md)


## Integridade do álbum e CI (v1.1.0 proposta)

A validação do `localStorage` e dos arquivos importados agora usa as mesmas regras de coleção, com descarte de IDs inexistentes no álbum e de quantidades inválidas. A estrutura JSON exportada permanece na versão 1.

```bash
npm ci
npm run typecheck
npm run test:unit
npm run build
```

O CI Node 22/Vite precisa aprovar os comandos no GitHub. Esta revisão não substitui os testes manuais de navegação, PWA ou limpeza de armazenamento. [Contrato](docs/projeto/ESPECIFICACAO.md) · [Testes](docs/testes/PLANO_DE_TESTES.md) · [Versões](docs/controle/VERSIONAMENTO.md).
