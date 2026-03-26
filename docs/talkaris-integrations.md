# Talkaris integrations

## Default path: connect your website

For public websites, Talkaris uses one canonical integration flow regardless of stack:

1. Provide the public `baseUrl`.
2. Talkaris detects a sitemap from `robots.txt`, `/sitemap.xml` or `/sitemap_index.xml`.
3. If no sitemap exists, Talkaris provisions a root `html` source.
4. The project `allowedDomains` are inferred from the website host.
5. An ingestion job is queued automatically.
6. Talkaris returns the canonical widget snippet.

This is the same workflow for:

- Angular
- Node / SSR
- WordPress
- static HTML

There is no framework-specific widget runtime.

## Canonical embed contract

```html
<script>
  window.TalkarisWidgetConfig = {
    siteKey: "YOUR_SITE_KEY",
    apiBase: "https://talkaris.com/api",
    widgetBaseUrl: "https://talkaris.com/widget/"
  };
</script>
<script async src="https://talkaris.com/widget/embed.js"></script>
```

## Advanced knowledge sources

Talkaris still supports advanced source provisioning from the portal:

- `sitemap`
- `html`
- `pdf`
- `markdown`
- `api_endpoint`
- `youtube`
- `notion`
- `gemini_file`

Use these when the public website flow is not enough. They are not the primary onboarding path for normal website deployments.

## Messaging channels

Supported channel surfaces:

- website widget
- Telegram
- WhatsApp

Both Telegram and WhatsApp reuse the same widget answer pipeline through `buildChannelReply()`, so assistant profile, runtime policy, suggestions and CTA logic stay aligned across channels.

## Operational principle

The professional/simple integration path is:

- Connect Website
- Let Talkaris detect sitemap or fall back to crawl
- Paste one snippet

Everything else is an advanced integration.
