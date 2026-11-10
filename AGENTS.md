# Instruções para agentes — Panini-Cards-Check

Aplicativo web mobile-first para acompanhar figurinhas do álbum Copa 2026.

Leia README, `package.json, public/data/, panini_album/` e docs/REQUISITOS.md. Preserve a stack existente (Vite, TypeScript, Python, localStorage) e a autoria do projeto.

- Distinguir implementado, conceitual e integração não verificada.
- Preferir nomes em português em novos componentes quando compatível com contratos existentes.
- Não alterar deploy, fonte de dados, cobrança ou credenciais sem aprovação.
- Não colocar segredos ou dados pessoais no repositório.
- Executar testes nativos (npm run build) e, se houver, testes de integração.
- Testes em Python do diretório tests verificam somente documentos.

**Risco:** Dados locais do navegador não são sincronizados. Validar fonte e integridade das imagens/dados.
