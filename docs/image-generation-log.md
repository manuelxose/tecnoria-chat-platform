# Image Generation Log

## Criterio visual

Dirección elegida:

- editorial
- tecnológica sin cliché sci-fi
- corporativa premium
- paleta coherente con el nuevo sistema visual: navy, verde mineral, acentos champagne
- sin personas ni stock obvio
- con sensación de plataforma seria y alto control operacional

## Imágenes reemplazadas o creadas

### SVG propios creados en repo

| Asset | Tipo | Uso |
| --- | --- | --- |
| `apps/portal/src/public/assets/talkaris-hero-scene.svg` | SVG editorial | Hero principal home |
| `apps/portal/src/public/assets/talkaris-integration-scene.svg` | SVG editorial | Secciones de plataforma e integraciones |
| `apps/portal/src/public/assets/talkaris-blog-scene.svg` | SVG editorial | Soporte visual para blog / fallback |
| `apps/portal/src/public/assets/talkaris-social-card.svg` | SVG social card | OG / social share |

### Generación SiliconFlow

Proveedor: SiliconFlow  
Modelo usado finalmente: `Qwen/Qwen-Image`  
Motivo: el modelo por defecto del workspace (`black-forest-labs/FLUX.2-flex`) devolvía `403` por restricción de cuenta/saldo.

| Asset | Estado | Uso |
| --- | --- | --- |
| `apps/portal/src/public/assets/talkaris-editorial-campaign.png` | aceptado | Hero de blog y casos de uso; fallback visual editorial |
| `apps/portal/src/public/assets/talkaris-hero-campaign.png` | descartado | no usado por contaminación tipográfica dentro de la escena |

## Prompts usados

### 1. Hero experimental descartada

Prompt:

```text
Premium editorial campaign image for a conversational AI platform, no humans, sculptural translucent interface panels floating in a refined architectural space, deep navy and mineral green palette with champagne accents, high-end corporate technology aesthetic, cinematic lighting, crisp depth, subtle glassmorphism, precise composition, clean premium atmosphere, believable materials, no text, no logos, no watermark, no cheap stock look
```

Negative prompt:

```text
people, hands, text, letters, watermark, logo, low quality, blurry, clutter, distorted geometry, stock photo, cheesy neon, sci fi cliché
```

Resultado:

- técnicamente bueno
- visualmente premium
- descartado porque el modelo introdujo texto visible dentro de la composición

### 2. Editorial final aceptada

Prompt:

```text
Premium editorial still life for enterprise conversational AI content hub, layered documents, data ribbons and luminous conversation nodes in a modern architectural studio environment, sophisticated magazine art direction, deep navy, soft stone and emerald palette, tactile materials, cinematic but restrained, clean negative space, no humans, no text, no watermark
```

Negative prompt:

```text
people, hands, text, letters, watermark, logo, low quality, blurry, clutter, cheap render, chaotic composition, stock photo, excessive neon
```

Resultado:

- aceptado
- sin texto no deseado
- coherente con la identidad premium del sitio
- útil en contextos editoriales y como fallback visual

## Notas de optimización

- Los SVG propios se priorizaron para hero e integraciones por control total, escalabilidad y ligereza.
- La imagen generada aceptada se dejó en PNG por velocidad de integración y por ausencia de pipeline automático de reconversión en este turno.
- La hero generada se retuvo en repo para trazabilidad, pero no se usa en producción.

## Ubicación de uso

- `talkaris-editorial-campaign.png`
  - `apps/portal/src/app/content/public-site.ts`
  - `apps/portal/src/app/pages/blog-list-page.component.ts`
  - `apps/portal/src/app/pages/blog-article-page.component.ts`

- `talkaris-hero-scene.svg`
  - `apps/portal/src/app/content/public-site.ts`

- `talkaris-integration-scene.svg`
  - `apps/portal/src/app/content/public-site.ts`

- `talkaris-blog-scene.svg`
  - soporte visual y fallback reusable
