# Talkaris Blog Integration With Auctorio

## Summary

Talkaris now exposes a native editorial module for Auctorio.

## Private editorial API

- `POST /v1/ops/blog`
- `PUT /v1/ops/blog/:id`
- `DELETE /v1/ops/blog/:id`

Authentication:

- `Authorization: Bearer <AUCTORIO_PUBLISHER_TOKEN>`
- If no dedicated token is configured, the service falls back to `ADMIN_BEARER_TOKEN`

## Public blog API

- `GET /v1/public/blog`
- `GET /v1/public/blog/:slug`

## Public routes

- `/blog`
- `/blog/:slug`
- `/en/blog`
- `/en/blog/:slug`

These routes are included in the public sitemap.

## Re-ingestion

After any publish/update/delete operation, Talkaris queues a sitemap ingestion job using:

- `BLOG_REINGEST_PROJECT_KEY`
- `BLOG_REINGEST_SOURCE_KEY`

This keeps the public chatbot aligned with the latest published blog content.

## Validation

Validated on March 11, 2026:

- `POST /api/v1/ops/blog` with the Auctorio bearer token returns `201`
- Draft entries are not visible through `/api/v1/public/blog/:slug`
- `DELETE /api/v1/ops/blog/:id` with the same token returns `204`
- `https://talkaris.com/blog` and `https://talkaris.com/sitemap.xml` are live in production
