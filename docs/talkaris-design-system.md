# Talkaris — Design System

## Overview

Talkaris uses a dual design system:

1. **Marketing Design System** — Light mode, public-facing, Manrope + Outfit fonts, organic/earthy aesthetic
2. **Cockpit Design System** — Dark mode, application-facing, professional SaaS aesthetic

This document covers the **Cockpit Design System** (`--ck-*` namespace).

---

## Design Principles

| Principle | Description |
|-----------|-------------|
| **Dark-first** | Dark backgrounds reduce eye strain for power users |
| **Information density** | More data visible per screen vs. airy consumer UIs |
| **Clarity over decoration** | No gradients, blurs, or effects unless they serve a purpose |
| **Status legibility** | Every item's state is immediately visible via badges |
| **Progressive disclosure** | Forms appear inline, not in modals that block context |
| **Monospace for data** | IDs, keys, codes use `ui-monospace` for scannability |

---

## Color Tokens

```css
/* Background */
--ck-bg:              #06100e   /* Page background */
--ck-surface:         #0c1a14   /* Cards, sidebar */
--ck-surface-raised:  #13221a   /* Inputs, dropdowns, hover */
--ck-surface-high:    #1a2e22   /* Selected state, tabs */
--ck-surface-overlay: #1f3628   /* Tooltips, popovers */

/* Borders */
--ck-border:          rgba(255,255,255,0.06)    /* Default borders */
--ck-border-strong:   rgba(255,255,255,0.11)    /* Input borders */
--ck-border-focus:    rgba(28,122,103,0.5)      /* Focus ring */

/* Text */
--ck-text:            #e2e8f0   /* Primary text */
--ck-text-soft:       #94a3b8   /* Secondary text */
--ck-text-muted:      #4f6079   /* Disabled, timestamps */
--ck-text-inverse:    #06100e   /* On accent buttons */

/* Accent — Teal (Talkaris brand identity) */
--ck-accent:          #1c7a67   /* Primary brand action */
--ck-accent-strong:   #24a08a   /* Hover, active link */
--ck-accent-soft:     rgba(28,122,103,0.16)    /* Soft backgrounds */
--ck-accent-glow:     0 0 0 3px rgba(28,122,103,0.3)  /* Focus shadow */

/* Gold secondary accent */
--ck-gold:            #c29a52   /* Secondary highlight */
--ck-gold-soft:       rgba(194,154,82,0.16)

/* Semantic */
--ck-success:         #10b981   /* Active, done, healthy */
--ck-success-soft:    rgba(16,185,129,0.12)
--ck-warning:         #f59e0b   /* Draft, queued, pending */
--ck-warning-soft:    rgba(245,158,11,0.12)
--ck-danger:          #ef4444   /* Error, failed, disabled */
--ck-danger-soft:     rgba(239,68,68,0.12)
--ck-info:            #38bdf8   /* Running, in-progress */
--ck-info-soft:       rgba(56,189,248,0.12)
```

---

## Typography

```css
font-family: "Manrope", "Segoe UI", sans-serif;  /* Body */
font-family: "Outfit", "Segoe UI", sans-serif;    /* Headings, numbers */
font-family: ui-monospace, "Fira Code", monospace; /* Code, IDs, keys */
```

### Type Scale

| Class / Usage | Size | Weight | Usage |
|---------------|------|--------|-------|
| Page title | 1.35rem | 700 | `.ck-page-header__title` |
| Card title | 0.9rem | 700 | `.ck-card__title` |
| Table header | 0.72rem | 700, uppercase | `th` |
| Body text | 0.84–0.88rem | 400–600 | General content |
| Small / muted | 0.72–0.78rem | 400 | Timestamps, subtitles |
| Section label | 0.68–0.72rem | 700, uppercase | `.ck-nav__group-label` |

---

## Spacing

```css
--ck-gap:     20px  /* Standard gap between sections */
--ck-gap-sm:  12px  /* Tight gaps, form fields */
```

Padding inside cards: `20px` (standard), `14px 16px` (compact)
Padding in topbar: `0 24px`
Padding in content: `24px`
Sidebar item padding: `7px 16px`

---

## Border Radius

```css
--ck-radius:    12px  /* Buttons, inputs, cards */
--ck-radius-lg: 20px  /* Cards, larger containers */
--ck-radius-sm: 6px   /* Small badges, tiny elements */
```

---

## Shadows

```css
--ck-shadow:    0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)
--ck-shadow-lg: 0 8px 30px rgba(0,0,0,0.5)
```

---

## Components

### Layout Shell

```html
<div class="ck-shell">
  <aside class="ck-sidebar">...</aside>
  <main class="ck-main">
    <div class="ck-topbar">...</div>
    <div class="ck-content">...</div>
  </main>
</div>
```

### Cards

```html
<!-- Standard -->
<div class="ck-card">
  <div class="ck-card__header">
    <p class="ck-card__title">Title</p>
    <p class="ck-card__sub">Subtitle</p>
  </div>
  <!-- content -->
</div>

<!-- Compact -->
<div class="ck-card ck-card--compact">...</div>
```

### Stats

```html
<div class="ck-stats">
  <div class="ck-stat">
    <div class="ck-stat__label">Conversations</div>
    <div class="ck-stat__value">1,234</div>
    <div class="ck-stat__delta ck-stat__delta--up">+12% this week</div>
  </div>
</div>
```

### Tables

```html
<div class="ck-table-wrap">
  <table class="ck-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="ck-table__cell--strong">My Bot</td>
        <td><span class="ck-badge ck-badge--success"><span class="ck-dot"></span> active</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

### Badges

```html
<!-- Status badges -->
<span class="ck-badge ck-badge--success"><span class="ck-dot"></span> active</span>
<span class="ck-badge ck-badge--warning"><span class="ck-dot"></span> queued</span>
<span class="ck-badge ck-badge--danger"><span class="ck-dot"></span> failed</span>
<span class="ck-badge ck-badge--info"><span class="ck-dot"></span> running</span>
<span class="ck-badge ck-badge--accent">sitemap</span>
<span class="ck-badge ck-badge--default">disabled</span>
```

### Buttons

```html
<!-- Variants -->
<button class="ck-btn ck-btn--primary">Primary</button>
<button class="ck-btn ck-btn--secondary">Secondary</button>
<button class="ck-btn ck-btn--ghost">Ghost</button>
<button class="ck-btn ck-btn--danger">Danger</button>

<!-- Sizes -->
<button class="ck-btn ck-btn--primary ck-btn--sm">Small</button>
<button class="ck-btn ck-btn--primary ck-btn--icon">⊕</button>
```

### Form Elements

```html
<div class="ck-field">
  <label class="ck-label">Bot Name</label>
  <input class="ck-input" placeholder="My Assistant" />
</div>

<div class="ck-field">
  <label class="ck-label">Type</label>
  <select class="ck-select">
    <option>Sitemap</option>
  </select>
</div>

<div class="ck-field">
  <label class="ck-label">Description</label>
  <textarea class="ck-textarea" rows="3"></textarea>
</div>

<!-- Grid layouts -->
<div class="ck-form-grid">...</div>         <!-- 2 columns -->
<div class="ck-form-grid ck-form-grid--three">...</div>  <!-- 3 columns -->
<div class="ck-form-stack">...</div>        <!-- stacked -->
```

### Search / Toolbar

```html
<div class="ck-toolbar">
  <div class="ck-search-wrap">
    <span class="ck-search-icon">⌕</span>
    <input class="ck-input ck-search" placeholder="Search..." />
  </div>
  <select class="ck-select">...</select>
  <button class="ck-btn ck-btn--secondary">Filter</button>
</div>
```

### Tabs

```html
<div class="ck-tabs">
  <button class="ck-tab is-active">All</button>
  <button class="ck-tab">Pending</button>
  <button class="ck-tab">Done</button>
</div>
```

### Empty States

```html
<div class="ck-empty">
  <div class="ck-empty__icon">◈</div>
  <p class="ck-empty__title">No bots yet</p>
  <p class="ck-empty__sub">Create your first AI assistant to get started.</p>
  <button class="ck-btn ck-btn--primary">Create Bot</button>
</div>
```

### Skeleton Loaders

```html
<div class="ck-skeleton" style="height: 44px; margin-bottom: 8px;"></div>
<div class="ck-skeleton" style="height: 44px; margin-bottom: 8px;"></div>
```

### Alerts

```html
<div class="ck-alert ck-alert--success">Operation completed.</div>
<div class="ck-alert ck-alert--danger">An error occurred.</div>
```

### Code Blocks

```html
<pre class="ck-code">{{ snippetText }}</pre>
```

### Dividers

```html
<div class="ck-divider"></div>
```

---

## Grid System

```html
<!-- Two columns -->
<div class="ck-grid-two">...</div>

<!-- Three columns -->
<div class="ck-grid-three">...</div>

<!-- Sidebar layout (content + narrow sidebar) -->
<div class="ck-grid-sidebar">
  <div>Main content</div>
  <div>Sidebar (340px)</div>
</div>
```

---

## Navigation

### Sidebar Item

```html
<a class="ck-nav__item" routerLink="/app/bots" routerLinkActive="is-active">
  <span class="ck-nav__icon">◈</span>
  Bots
  <span class="ck-nav__badge">3</span>  <!-- optional notification -->
</a>
```

### Group Header

```html
<div class="ck-nav__group-label">Knowledge</div>
```

---

## Status Conventions

| Status | Badge Class | Color | Usage |
|--------|------------|-------|-------|
| active | `ck-badge--success` | Green | Active bots, users |
| done | `ck-badge--success` | Green | Completed jobs |
| running | `ck-badge--info` | Blue | In-progress jobs |
| queued | `ck-badge--warning` | Amber | Pending jobs |
| draft | `ck-badge--warning` | Amber | Draft bots |
| pending | `ck-badge--warning` | Amber | Pending users/requests |
| disabled | `ck-badge--default` | Gray | Inactive items |
| failed | `ck-badge--danger` | Red | Failed jobs/items |
| rejected | `ck-badge--danger` | Red | Rejected requests |
| error | `ck-badge--danger` | Red | System errors |

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|------------|---------|
| > 1024px | Full sidebar visible |
| ≤ 1024px | Sidebar hidden (mobile navigation TBD) |
| ≤ 768px | Two-column grids stack, stats grid 2-col |
| ≤ 640px | Public marketing site adjustments |

---

## Marketing Design System (Light Mode)

The public site uses a separate design vocabulary:

| Token | Value | Usage |
|-------|-------|-------|
| `--brand` | `#1c7a67` | Teal/green brand |
| `--bg` | `#f6f4ef` | Warm off-white |
| `--surface` | `rgba(255,255,255,0.88)` | Card backgrounds |
| `--ink` | `#081424` | Dark text |
| `--radius-2xl` | `32px` | Large card radius |
| Font | Manrope + Outfit | Body + headings |

These tokens are completely separate from `--ck-*` and only apply to public pages.
