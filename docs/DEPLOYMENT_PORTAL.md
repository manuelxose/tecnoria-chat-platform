# Talkaris deployment

## Goal

Publish the full product on `talkaris.com` with:

- `/` -> `apps/portal`
- `/api/*` -> `apps/chat-api`
- `/widget/*` -> `apps/widget`
- `www.talkaris.com/*` -> `301` to `https://talkaris.com$request_uri`

## Services

- `postgres`
- `chat-api`
- `widget`
- `portal`
- `ingest-worker`

## Internal ports

- `4101` -> `chat-api`
- `4102` -> `widget`
- `4103` -> `portal`

## Required env

### `apps/chat-api/.env`

- `COOKIE_NAME`
- `JWT_SECRET`
- `PORTAL_PUBLIC_URL`
- `PASSWORD_RESET_TTL_MINUTES`
- `SESSION_TTL_HOURS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

### `apps/portal/.env`

- `PORT`
- `API_INTERNAL_URL`
- `WIDGET_INTERNAL_URL`
- `PORTAL_PUBLIC_URL`
- `CANONICAL_HOST`

## Docker Compose reference

```bash
cd infra
cp ../apps/portal/.env.example ../apps/portal/.env
cp ../apps/chat-api/.env.example ../apps/chat-api/.env
docker compose up -d --build postgres chat-api widget portal ingest-worker
```

## Nginx reference

Use `infra/nginx/talkaris.conf.example` as the public reverse-proxy template.

## Cloudflare cutover

```bash
CF_API_TOKEN=... \
CF_ZONE_NAME=talkaris.com \
CF_ORIGIN_IPV4=109.123.248.164 \
CF_SSL_MODE=strict \
bash infra/cloudflare-cutover.sh
```

The script:

- verifies Cloudflare auth,
- resolves the `zone_id`,
- upserts proxied `A` records for apex and `www`,
- sets SSL mode to `strict`,
- purges cache.

## Mandatory smoke checks

```bash
curl -I https://talkaris.com
curl -I https://www.talkaris.com
curl https://talkaris.com/robots.txt
curl https://talkaris.com/sitemap.xml
curl https://talkaris.com/api/health
curl -I https://talkaris.com/widget/embed.js
curl -I https://talkaris.com/login
curl -I https://talkaris.com/app
curl -I https://talkaris.com/admin
```

## Pending items

- Validate SMTP delivery for `hello@talkaris.com`.
- Provision MX/SPF/DKIM/DMARC with the final mail provider.
- Verify the final origin certificate before DNS cutover.

## Recommended next step

Run these checks first on staging, then repeat them immediately after the Cloudflare DNS switch for the live Talkaris domain.
