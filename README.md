# Panini Cards Check

Aplicação web mobile-first para organizar a coleção de figurinhas do álbum da Copa do Mundo 2026. Permite selecionar cartas, controlar repetidas, consultar itens faltantes e manter o progresso no próprio navegador.

## Recursos

- Grade de figurinhas por seleção, com pesquisa por nome, número, código e filtros.
- Marcação de figurinhas adquiridas e controle de quantidade repetida.
- Relação de cartas faltantes, em visualização completa ou compacta.
- Persistência local em `localStorage`, com importação/exportação e validação da coleção.
- Service worker e recursos de uso offline testados em Chromium.

## Tecnologias e dados

Vite · TypeScript · JavaScript · Python (scripts de preparação de dados).

A base consumida pela aplicação é `public/data/panini_world_cup_2026.json`. Os scripts de dados e imagens estão em `scripts/`; a aplicação não altera o arquivo de catálogo quando o usuário marca cartas.

## Execução local

```bash
npm ci
npm run dev
```

A aplicação usa `127.0.0.1` no servidor de desenvolvimento. Para testar outro dispositivo na rede local confiável, utilize `npm run dev:lan`.

```bash
npm run check
npm run preview
```

O comando `check` reúne typecheck, testes de regras da coleção e build. O comando `fill:missing-info` utiliza o interpretador `python` disponível no ambiente; instale as dependências Python exigidas pelo script antes de executá-lo.

## Qualidade e integração contínua

Os workflows do GitHub Actions incluem:
- `verify.yml`: validações TypeScript, regras da coleção e build.
- `browser-smoke.yml`: cenários em Chromium para seleção, persistência e importação/exportação.
- `offline-pwa.yml`: regressão de instalação/recarga offline de recursos essenciais.

Os dados da coleção persistem no navegador e não são sincronizados entre dispositivos. O uso offline depende dos recursos previamente armazenados; imagens externas não têm garantia de disponibilidade sem conexão.

## Publicação e conteúdo

A aplicação pode ser executada localmente ou gerada como site estático; **não há deploy público automático configurado neste repositório**. A publicação deve respeitar os direitos de uso de imagens, nomes, marcas e dados do álbum.

## Documentação

[Requisitos](docs/REQUISITOS.md) · [Arquitetura](docs/ARQUITETURA.md) · [UML](docs/uml/README.md) · [Especificação de domínio](docs/projeto/ESPECIFICACAO.md) · [Testes](docs/testes/PLANO_DE_TESTES.md) · [Versionamento](docs/controle/VERSIONAMENTO.md).
