# Plano de testes — álbum de figurinhas Copa 2026

> **PAN — documentação v1.0.0** · 11/11/2026 · revisão do código `99e3b3c60af763b54020fc2e994adf97eb2030dd`.


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
