# Tecnoria Chat Platform

Producto desacoplado para asistentes conversacionales empresariales. La web corporativa es el primer proyecto configurado del sistema, no un caso especial.

## Entregables

- `apps/chat-api`: API publica y administrativa para widget, leads, analitica e ingestiones.
- `apps/ingest-worker`: worker de ingesta para sitemap, HTML publico y reindexacion.
- `apps/ops-cli`: CLI operativa para crear proyectos, fuentes, jobs y evaluaciones.
- `apps/widget`: assets del widget embebible por `iframe` y snippet loader.
- `packages/core`: tipos, chunking, scoring y utilidades compartidas.

## MVP implementado

- Modelo multi-proyecto con `project_id` en conocimiento, conversaciones, leads y analitica.
- Pipeline estandar para web publica con sitemap, extraccion HTML, limpieza, chunking y versionado.
- Motor conversacional RAG-ready con retrieval lexico y estructura preparada para embeddings/pgvector.
- Widget desacoplado con launcher, historial, citas, CTA y captura ligera de leads.
- Integracion por webhook para entregar leads al flujo de contacto actual de Tecnoria.
- Documentacion operativa y `docker-compose` de referencia.

## Puesta en marcha

1. Crear `.env` en `apps/chat-api`, `apps/ingest-worker` y `apps/ops-cli` a partir de los ejemplos.
2. Levantar PostgreSQL/pgvector, `chat-api`, `widget` e `ingest-worker`.
3. Ejecutar `npm run migrate -w @tecnoria-chat/chat-api`.
4. Ejecutar `npm run cli -- seed-tecnoria`.
5. Validar con `npm run cli -- run-eval --project tecnoria`.
6. Integrar la web corporativa apuntando al widget en `http://localhost:4102/` en local o `https://tecnoriasl.com/chat-widget/` en produccion.

## Despliegue publico recomendado

- `widget`: `https://tecnoriasl.com/chat-widget/`
- `api`: `https://tecnoriasl.com/chat-api/`
- `health`: `https://tecnoriasl.com/chat-api/health`

El despliegue recomendado reutiliza el mismo dominio principal y deja a `nginx` reescribir `/chat-widget/*` y `/chat-api/*` hacia los servicios internos. Con esto se evita depender de `chat.tecnoriasl.com` y `chat-api.tecnoriasl.com`.

## Limitaciones actuales

- El retrieval hibrido usa busqueda lexica y deja el ranking vectorial preparado a traves de la columna `embedding`.
- El cliente LLM por defecto es determinista y basado en plantillas; el adaptador OpenAI-compatible esta preparado por configuracion.
- La operacion del MVP se realiza por CLI y endpoints internos; el backoffice visual queda para la siguiente fase.
