# Testes de contrato no Chromium

As jornadas abrem o build de produção e verificam interação, contratos HTTP simulados e acessibilidade. Os testes de funcionalidades interceptam as respectivas APIs. Eles não comprovam execução em AWS/Kubernetes nem integração completa com o control plane.

## Executar

```bash
npm ci
npx playwright install chromium
npm run test:e2e
```

O Playwright compila a interface e inicia o preview em `http://localhost:4173`. Para usar um preview já iniciado:

```bash
E2E_BASE_URL=http://localhost:4173 npm run test:e2e
```

A fixture `fixtures.ts` responde a `/api/v1/me` conforme a presença do Bearer token. `E2E_LIVE_API=1` encaminha essa consulta de identidade ao servidor configurado; as interceptações de APIs declaradas nas jornadas continuam ativas.

## Cobertura

As jornadas cobrem login por token, navegação para criação por Golden Path, aprovação de solicitação, busca da auditoria, consulta de freezes, catálogo, fontes, documentos, APIs, runtime, plugins, scorecards, ambientes, FinOps, incidentes, notificações, tenants, assistente, remediação e home por persona.

A auditoria axe exige uma tela renderizada antes de verificar violações críticas e sérias. Uma tela vazia, um erro de inicialização de JavaScript ou um carregamento de autenticação não contam como sucesso. Toda jornada também falha diante de um erro de execução não tratado no navegador.

Criação/alteração/exclusão de freeze pela UI ainda não estão implementadas. A jornada de freeze valida a consulta de um freeze persistido. A execução de recursos por Golden Path possui testes próprios; a jornada de navegação de recursos valida o acesso a esse fluxo governado.

A integração real entre CLI, API e PostgreSQL é testada no repositório irmão, com `go test -race -tags integration ./internal/adapters/rest/...`. O teste `TestCLIWithDatabase_DependencyCommands` exige o checkout de `zaractl` ao lado do control plane.
