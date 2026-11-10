# Arquitetura inicial — Panini-Cards-Check

**Stack:** Vite, TypeScript, Python, localStorage. **Referências:** package.json, public/data/, panini_album/.

```mermaid
flowchart LR
  Usuario --> Entrada["Interface ou endpoint"]
  Entrada --> Aplicacao["Regra de aplicacao"]
  Aplicacao --> Integracao["Dados / dependencia externa"]
```

O desenho é conceitual. Verifique os módulos reais antes de alterá-los. Para evoluir: introduzir limites claros entre entrada, domínio e infraestrutura; manter configuração segura e testes por camada.

**Restrição:** Dados locais do navegador não são sincronizados. Validar fonte e integridade das imagens/dados.
