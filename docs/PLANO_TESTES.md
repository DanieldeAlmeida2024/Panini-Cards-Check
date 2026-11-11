# Plano de testes

1. Documento: rodar `python -m unittest discover -s tests -p test_documentacao.py -v`.
2. Build/fluxo da stack: `npm run build`.
3. Casos negativos: entradas invalidas e serviços indisponíveis.
4. Integração: verificar serviços externos conforme configuração real.
5. Segurança: ausência de senhas e dados sensíveis no versionamento.

Somente o item 1 é abrangido pelo teste documental incluído. Dados locais do navegador não são sincronizados. Validar fonte e integridade das imagens/dados.
