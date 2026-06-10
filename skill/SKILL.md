---
name: vercel
description: Deploy e operação da Vercel pelo terminal via Vercel CLI, complementando o MCP vercel-mcp-pro. Use quando o usuário pedir para fazer deploy, subir na Vercel, ver logs de deploy, configurar env vars, promover preview para produção, fazer rollback ou linkar um projeto. Triggers - /vercel, "deploy na vercel", "subir na vercel", "deployar na vercel", "vercel deploy", "logs da vercel", "rollback na vercel", "promover para produção na vercel", "linkar projeto vercel", "configurar env da vercel".
---

# /vercel — Deploy e operação via Vercel CLI

Esta skill dirige a **Vercel CLI** para o ciclo de deploy no terminal. Ela é o par operacional do MCP **vercel-mcp-pro**:

- **CLI (esta skill)** → melhor para *fazer o deploy* a partir do código local (`git push → deploy`, build, preview/prod), porque envia os arquivos do diretório atual.
- **MCP vercel-mcp-pro** → melhor para *tudo o resto via API* em qualquer client: listar/inspecionar deployments, ler logs estruturados, CRUD de env/domínios/DNS/aliases/certs/webhooks/edge-config, promover, rollback, checks.

Quando a tarefa for **deploy do projeto atual**, prefira o CLI. Quando for **consulta/gestão de recursos**, prefira as tools do MCP. Diga ao usuário qual caminho está usando.

## Pré-requisitos (verifique antes de agir)

1. **CLI instalado:** `vercel --version`. Se faltar: `npm i -g vercel`.
2. **Autenticação por token** (não-interativa, ideal para automação):
   - Use a env var `VERCEL_TOKEN` (a mesma do MCP) e passe `--token $VERCEL_TOKEN` nos comandos, OU rode `vercel login` se o usuário preferir o fluxo interativo.
   - Para equipes: adicione `--scope <team-slug>` (ou configure em `.vercel/project.json` via `vercel link`).
3. **Projeto linkado:** se não houver `.vercel/project.json`, rode `vercel link` (ou `vercel pull`) antes de deployar.

> Nunca imprima o valor de `VERCEL_TOKEN`. Referencie sempre como `$VERCEL_TOKEN`.

## Fluxos

### 1. Deploy de preview
```bash
vercel --token $VERCEL_TOKEN --yes
```
Retorna a URL de preview. `--yes` aceita os defaults sem prompt.

### 2. Deploy de produção
```bash
vercel --prod --token $VERCEL_TOKEN --yes
```
Confirme com o usuário antes de ir para produção (ação outward-facing).

### 3. Ver logs
- Deploy/runtime de um deployment:
  ```bash
  vercel logs <deployment-url-ou-id> --token $VERCEL_TOKEN
  ```
- Para logs históricos/estruturados e diagnóstico de build com erro, prefira o MCP: `get_build_logs` / `get_runtime_logs` / `get_deployment_events`.

### 4. Variáveis de ambiente
```bash
vercel env add <NOME> <production|preview|development> --token $VERCEL_TOKEN
vercel env ls --token $VERCEL_TOKEN
vercel env rm <NOME> <ambiente> --token $VERCEL_TOKEN
```
Para CRUD em lote/programático, prefira o MCP (`bulk_create_env_vars`, `update_env_var`).

### 5. Promover preview → produção (sem rebuild)
```bash
vercel promote <deployment-url-ou-id> --token $VERCEL_TOKEN
```
Equivalente MCP: `promote_deployment`.

### 6. Rollback
```bash
vercel rollback <deployment-url-ou-id> --token $VERCEL_TOKEN
```
Equivalente MCP: `rollback_deployment`.

### 7. Linkar / puxar config
```bash
vercel link --token $VERCEL_TOKEN --yes
vercel pull --token $VERCEL_TOKEN --yes   # baixa env + settings para .vercel/
```

### 8. Inspecionar um deployment
```bash
vercel inspect <deployment-url-ou-id> --token $VERCEL_TOKEN
```

## Regras de operação

- **Confirme antes de produção, rollback e remoção de env/domínio** — são ações difíceis de reverter e/ou voltadas ao público. Para preview, pode seguir direto.
- Reporte o resultado real: cole a URL retornada, o estado do deploy e, se falhar, o trecho de erro relevante (não invente sucesso).
- Se o build falhar, busque a causa nos logs (CLI `vercel logs` ou MCP `get_build_logs`) antes de tentar de novo — não fique re-deployando às cegas.
- Se o diretório atual não for um projeto Vercel (sem `.vercel/`), rode `vercel link` primeiro e avise o usuário.
- Para qualquer operação que o CLI não cobre bem (webhooks, edge config, DNS, certs, checks, aliases), use as tools do MCP `vercel-mcp-pro`.

## Mapa rápido CLI ⇄ MCP

| Intenção | CLI (esta skill) | MCP vercel-mcp-pro |
|----------|------------------|--------------------|
| Deploy do código atual | `vercel` / `vercel --prod` | `create_deployment` (headless) |
| Listar deployments | — | `list_deployments` |
| Logs de build com erro | `vercel logs` | `get_build_logs` |
| Promover / rollback | `vercel promote` / `vercel rollback` | `promote_deployment` / `rollback_deployment` |
| Env vars | `vercel env` | `list/create/update/delete_env_var` |
| Domínios / DNS / certs | parcial | tools dedicadas |
| Webhooks / edge config / checks | — | tools dedicadas |
| Qualquer endpoint | — | `vercel_raw` |
