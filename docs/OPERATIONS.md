# Operacion del MVP

## Flujo base

1. Levantar `postgres`, `chat-api`, `widget` e `ingest-worker`.
2. Ejecutar `npm run migrate -w @tecnoria-chat/chat-api`.
3. Crear `project`.
4. Registrar `source` con sitemap y dominio permitido.
5. Lanzar `ingestion job`.
6. Ejecutar `ingest-worker` hasta completar documentos y chunks.
7. Validar respuestas con `ops-cli eval`.
8. Integrar widget en la web con `site_key`.

## Comandos clave

- `npm run migrate -w @tecnoria-chat/chat-api`
- `npm run cli -- seed-tecnoria`
- `npm run cli -- create-project --key tecnoria --name "TecnoRia"`
- `npm run cli -- upsert-source --project tecnoria --kind sitemap --entry https://tecnoriasl.com/sitemap.xml`
- `npm run cli -- queue-ingestion --project tecnoria --source public-web`
- `npm run cli -- analytics-summary --project tecnoria`
- `npm run cli -- run-eval --project tecnoria`

## Rutas publicas recomendadas

- Widget: `https://tecnoriasl.com/chat-widget/embed.js`
- Frame: `https://tecnoriasl.com/chat-widget/frame.html`
- API: `https://tecnoriasl.com/chat-api/v1/widget/*`
- Health: `https://tecnoriasl.com/chat-api/health`

## Reingesta

- Usar jobs on-demand cuando cambie el contenido publico.
- Si se mantienen `etag` o `last-modified`, el worker evita reprocesado innecesario.
- Documentos cambiados generan nueva version y obsoletan los chunks anteriores.

## Guardrails

- Solo se indexan dominios autorizados por proyecto.
- El widget nunca consulta conocimiento de otro `project`.
- Los leads salen por adaptadores configurados y auditados en `lead_events`.
