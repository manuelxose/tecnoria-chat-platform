# Talkaris launch runbook

## Objective

Launch the product publicly on `https://talkaris.com` with Cloudflare in front, apex canonical routing, working transactional email and SEO-ready public pages.

## Launch checklist

1. `npm install`
2. `npm run build`
3. `npm run test`
4. `npm run migrate -w @tecnoria-chat/chat-api`
5. `npm run cli -- seed-talkaris --tenant platform-default`
6. `SUPERADMIN_EMAIL=admin@talkaris.com SUPERADMIN_PASSWORD=... npm run seed:talkaris -w @tecnoria-chat/chat-api`
7. Verify `apps/portal/.env` and `apps/chat-api/.env`
8. Start `chat-api`, `widget`, `portal`, `ingest-worker`
9. Validate local/staging smoke checks
10. Run `infra/cloudflare-cutover.sh`
11. Re-run smoke checks against `https://talkaris.com`
12. Submit sitemap to Google Search Console and Bing Webmaster

## DNS and email prerequisites

- Cloudflare zone `talkaris.com` exists and is accessible
- Apex and `www` will point to the current VPS IP
- Origin certificate is installed on the VPS
- `Always Use HTTPS` is enabled in Cloudflare
- Mail provider for `hello@talkaris.com` is provisioned
- MX, SPF, DKIM and DMARC records are configured in Cloudflare

## Validation list

- Home and all public SEO pages return the correct canonical host
- `www.talkaris.com` redirects to apex
- `robots.txt` and `sitemap.xml` are live
- Widget loader works from `/widget/embed.js`
- Access request can be created
- Superadmin can approve and issue reset
- Reset email arrives
- Login works
- Tenant console and superadmin load behind SSR redirects

## Rollback

1. Revert the Nginx vhost to the previous known-good config.
2. Point Cloudflare DNS back only if the new origin is different; here the origin stays the same VPS.
3. Roll back the code revision and restart `chat-api`, `widget`, `portal`, `ingest-worker`.
4. Purge Cloudflare cache again.

## Pending items

- Add Lighthouse evidence for the final live host.
- Add Search Console verification screenshots or DNS record notes.
- Record the exact systemd unit names used in production.

## Recommended next step

Use this runbook on a staging subdomain first, then execute the exact same sequence for the live Talkaris cutover.
