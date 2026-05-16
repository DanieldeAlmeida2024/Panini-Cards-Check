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
