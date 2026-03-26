# Talkaris Design System

## Positioning

Talkaris is a premium B2B conversational AI platform. The interface must read as operational software, not a consumer toy. Every screen should communicate technical control, low friction and confidence.

The current visual archetype is **Modern Glassmorphism**:

- Light-glass marketing surfaces for public routes
- Dark-glass cockpit surfaces for auth, workspace and admin
- Crisp indigo action states and violet AI accents
- Dense but calm layouts with strong whitespace discipline

## Non-Negotiables

- `apps/portal/src/styles.css` is the only styling source of truth.
- No `style=""`, no `[style]`, no `[style.*]`, no component `styles: []`, no `styleUrls`.
- Use `--ck-*` tokens only for new work.
- Prefer reusable `ck-` classes over one-off template styling.
- Keep transitions short: `0.2s` to `0.3s`, no exaggerated spring motion.

## Surface Model

### Level 0: Canvas

- Use a 24px dot-grid field built from `radial-gradient`.
- The canvas should feel technical and continuous, not flat.

### Level 1: Shells, panels, sidebars

- `backdrop-filter: blur(12px)`
- Background opacity between `0.5` and `0.7`
- Borders use `color-mix(...)` against text tokens at low opacity

### Level 2: Cards, wizards, elevated modules

- Higher-opacity glass surfaces around `0.9`
- 1px luminous border
- Soft depth shadow, never muddy black strokes

## Color System

### Core Tokens

```css
--ck-primary: #6366f1;
--ck-primary-hover: #4f46e5;
--ck-accent: #8b5cf6;
--ck-success: #10b981;
--ck-danger: #ef4444;
```

### Dark Surface

```css
--ck-bg: #0f172a;
--ck-text: #f8fafc;
```

### Light Surface

```css
--ck-bg: #f8fafc;
--ck-text: #0f172a;
```

### Usage Rules

- Indigo is the action system.
- Violet is reserved for AI moments, summaries, copilots and “magic” states.
- Red and green are for critical feedback only.
- Avoid random accent colors and avoid generic Bootstrap/Tailwind defaults.

## Typography

- Headings: `Outfit`
- Body: `Manrope`
- Main titles: `font-weight: 800`
- Secondary titles: `font-weight: 700`
- All headings: `letter-spacing: -0.02em`
- Body copy: `line-height: 1.6`
- Never use pure black text; always use the text tokens

## Interaction Patterns

### Buttons

- Pill shape only: `border-radius: 999px`
- Indigo-led fills with restrained glow
- Hover state should feel tighter and darker, not louder

### Magic Cards

- AI-assisted blocks may use slow moving gradients or subtle border glow
- Motion should be almost ambient

### Progress and Logs

- Logs use small monospace text
- Accent color for progress/log emphasis is violet
- Sequential fade-in is preferred over spinners when showing crawl or ingestion progress

## Layout Rules

- Marketing routes use `.ck-surface--marketing`
- Auth, cockpit and admin use `.ck-surface--cockpit`
- Prefer `ck-grid-*`, `ck-stack-*`, `ck-row-*` utilities
- Preserve whitespace; density is fine, clutter is not

## Governance

The portal test suite enforces the styling contract. Any reintroduction of inline or component-local styling is a regression.

Before shipping, verify:

- marketing, auth, cockpit and admin all render on the correct glass surface
- the 24px dot-grid is visible in both themes
- buttons, cards and sidebars match the indigo/violet system
- AI-specific UI uses the accent system, not ad hoc colors
