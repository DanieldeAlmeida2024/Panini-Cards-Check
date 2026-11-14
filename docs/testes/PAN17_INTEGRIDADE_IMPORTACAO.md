# PAN-17 — Importação inválida não pode apagar coleção

14/11/2026 · Regressão de integridade do estado local.

## Risco identificado
O importador aceitava um backup do aplicativo com app e version válidos mesmo quando sua coleção continha apenas IDs inexistentes ou quantidades inválidas. A normalização gerava objeto vazio e a aplicação podia substituir o progresso salvo por esse objeto.

## Contrato corrigido
- Backup explicitamente vazio continua permitido somente quando `collection` é um objeto sem nenhuma chave, identificado pelo aplicativo e versão 1.
- Backup com chaves declaradas mas nenhuma figurinha válida é rejeitado antes de modificar o progresso.
- Um backup válido com parte das figurinhas fora do catálogo continua importando as entradas válidas.
- A verificação ocorre na camada de domínio e é coberta por testes TypeScript de importação.

## Limite
Os dados permanecem no navegador; não existe restauração remota automática nem banco sincronizado.
