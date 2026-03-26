import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const repo = "/var/www/talkaris";
const appDir = path.join(repo, "apps/portal/src/app");
const stylesPath = path.join(repo, "apps/portal/src/styles.css");

const styleClassMap = new Map();
const extractedStyles = [];
let classCounter = 1;

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const filePath = path.join(dir, name);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, files);
      continue;
    }
    if (filePath.endsWith(".ts")) {
      files.push(filePath);
    }
  }
  return files;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getClassName(style) {
  if (!styleClassMap.has(style)) {
    styleClassMap.set(style, `ck-auto-${String(classCounter++).padStart(3, "0")}`);
  }
  return styleClassMap.get(style);
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function runGit(args) {
  try {
    return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" });
  } catch (error) {
    if ((error?.status === 0 || error?.code === "EPERM") && typeof error?.stdout === "string") {
      return error.stdout;
    }
    throw error;
  }
}

function recoverExistingClassMap() {
  const diff = runGit(["diff", "--unified=0", "--", "apps/portal/src/app"]);
  let removedStyles = [];
  let addedClasses = [];

  const flush = () => {
    const limit = Math.min(removedStyles.length, addedClasses.length);
    for (let index = 0; index < limit; index += 1) {
      const style = normalizeWhitespace(removedStyles[index]);
      const className = addedClasses[index];
      if (!style || styleClassMap.has(style)) continue;
      styleClassMap.set(style, className);
    }
    removedStyles = [];
    addedClasses = [];
  };

  for (const line of diff.split("\n")) {
    if (line.startsWith("@@")) {
      flush();
      continue;
    }
    if (line.startsWith("-") && !line.startsWith("---")) {
      for (const match of line.matchAll(/style="([^"]*)"/g)) {
        removedStyles.push(match[1]);
      }
      continue;
    }
    if (line.startsWith("+") && !line.startsWith("+++")) {
      for (const match of line.matchAll(/\bck-auto-\d+\b/g)) {
        addedClasses.push(match[0]);
      }
    }
  }

  flush();

  const maxRecovered = [...styleClassMap.values()]
    .map((className) => Number.parseInt(className.replace("ck-auto-", ""), 10))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0);
  classCounter = Math.max(classCounter, maxRecovered + 1);
}

function mergeDuplicateClasses(text) {
  return text
    .split("\n")
    .map((line) => {
      let current = line;
      let previous = "";
      while (current !== previous) {
        previous = current;
        current = current.replace(/class="([^"]*)"(.*?)class="([^"]*)"/, (_match, left, middle, right) => {
          const merged = [...new Set(`${left} ${right}`.split(/\s+/).filter(Boolean))].join(" ");
          return `class="${merged}"${middle}`;
        });
      }
      return current;
    })
    .join("\n");
}

function replaceStyleAttrs(text) {
  const styles = [...new Set(Array.from(text.matchAll(/style="([^"]*)"/g), (match) => match[1]))];
  for (const style of styles) {
    const className = getClassName(style);
    const escapedStyle = escapeRegExp(style);
    text = text.replace(new RegExp(`class="([^"]*)"\\s+style="${escapedStyle}"`, "g"), (_match, existing) => {
      return `class="${existing} ${className}"`;
    });
    text = text.replace(new RegExp(`style="${escapedStyle}"\\s+class="([^"]*)"`, "g"), (_match, existing) => {
      return `class="${existing} ${className}"`;
    });
    text = text.replace(new RegExp(`style="${escapedStyle}"`, "g"), `class="${className}"`);
  }
  return text;
}

function extractStyles(text, filePath) {
  return text.replace(/,\s*styles:\s*\[`([\s\S]*?)`\]\s*,?\s*(?=}\))/m, (_match, css) => {
    let cleaned = css.trim();
    if (path.basename(filePath) === "login-page.component.ts") {
      cleaned = cleaned.replace(/:host/g, "app-login-page");
    }
    extractedStyles.push(`/* Extracted from ${path.relative(repo, filePath)} */\n${canonicalizeCss(cleaned)}`);
    return "";
  });
}

function canonicalizeCss(css) {
  const replacements = [
    ["var(--paper)", "var(--ck-surface-body)"],
    ["var(--bg-elevated)", "var(--ck-surface-base)"],
    ["var(--bg)", "var(--ck-bg)"],
    ["var(--surface-strong)", "var(--ck-surface-strong)"],
    ["var(--surface-dark-2)", "var(--ck-surface-dark-soft)"],
    ["var(--surface-dark)", "var(--ck-surface-dark-strong)"],
    ["var(--surface)", "var(--ck-surface-panel)"],
    ["var(--panel-border-strong)", "var(--ck-border-strong)"],
    ["var(--panel-border)", "var(--ck-border)"],
    ["var(--ink-soft)", "var(--ck-text-soft)"],
    ["var(--ink)", "var(--ck-text)"],
    ["var(--muted)", "var(--ck-text-muted)"],
    ["var(--brand-strong)", "var(--ck-primary-hover)"],
    ["var(--brand-soft)", "var(--ck-primary-soft)"],
    ["var(--brand)", "var(--ck-primary)"],
    ["var(--gold-soft)", "var(--ck-accent-soft)"],
    ["var(--gold)", "var(--ck-accent)"],
    ["var(--danger)", "var(--ck-danger)"],
    ["var(--shadow-xl)", "var(--ck-shadow-lg)"],
    ["var(--shadow-lg)", "var(--ck-shadow)"],
    ["var(--radius-2xl)", "var(--ck-radius-2xl)"],
    ["var(--radius-xl)", "var(--ck-radius-lg)"],
    ["var(--radius-lg)", "var(--ck-radius)"],
    ["var(--radius-md)", "var(--ck-radius-sm)"],
    ["var(--radius-pill)", "var(--ck-radius-pill)"],
  ];

  let next = css;
  for (const [from, to] of replacements) {
    next = next.replaceAll(from, to);
  }
  return next;
}

function stripLegacyRoot(css) {
  return css.replace(/^:root\s*\{[\s\S]*?^\}\n*/m, "");
}

recoverExistingClassMap();

const files = walk(appDir);
for (const filePath of files) {
  const original = fs.readFileSync(filePath, "utf8");
  const mergedClasses = mergeDuplicateClasses(original);
  const withoutStyles = extractStyles(mergedClasses, filePath);
  const withoutInlineStyles = replaceStyleAttrs(withoutStyles);
  fs.writeFileSync(filePath, mergeDuplicateClasses(withoutInlineStyles));
}

const baseCss = runGit(["show", "HEAD:apps/portal/src/styles.css"]);

const glassOverrides = String.raw`
/* ============================================================
   TALKARIS GLASS REPLATFORM
   ============================================================ */

:root {
  color-scheme: light;
  --ck-font-body: "Manrope", "Segoe UI", sans-serif;
  --ck-font-heading: "Outfit", "Segoe UI", sans-serif;
  --ck-space-xs: 0.375rem;
  --ck-space-sm: 0.5rem;
  --ck-space-md: 0.75rem;
  --ck-space-lg: 1rem;
  --ck-space-xl: 1.5rem;
  --ck-space-2xl: 2rem;
  --ck-radius-sm: 10px;
  --ck-radius: 14px;
  --ck-radius-lg: 22px;
  --ck-radius-2xl: 32px;
  --ck-radius-pill: 999px;
  --ck-blur: blur(12px);
  --ck-duration-fast: 0.2s;
  --ck-duration: 0.3s;
  --ck-primary: #6366f1;
  --ck-primary-hover: #4f46e5;
  --ck-primary-soft: rgba(99, 102, 241, 0.14);
  --ck-primary-glow: rgba(99, 102, 241, 0.24);
  --ck-accent: #8b5cf6;
  --ck-accent-strong: #7c3aed;
  --ck-accent-soft: rgba(139, 92, 246, 0.16);
  --ck-success: #10b981;
  --ck-success-soft: rgba(16, 185, 129, 0.14);
  --ck-warning: #f59e0b;
  --ck-warning-soft: rgba(245, 158, 11, 0.14);
  --ck-danger: #ef4444;
  --ck-danger-soft: rgba(239, 68, 68, 0.14);
  --ck-info: #60a5fa;
  --ck-info-soft: rgba(96, 165, 250, 0.14);
  --ck-green: var(--ck-success);
  --ck-gold: var(--ck-warning);
  --ck-red: var(--ck-danger);
  --ck-shadow-sm: 0 14px 30px rgba(15, 23, 42, 0.06);
  --ck-shadow: 0 22px 56px rgba(15, 23, 42, 0.12);
  --ck-shadow-lg: 0 28px 80px rgba(15, 23, 42, 0.18);
}

html,
body {
  min-height: 100%;
  font-family: var(--ck-font-body);
  color: #0f172a;
  background: #f8fafc;
}

body {
  line-height: 1.6;
}

h1,
h2,
h3,
h4,
h5,
h6,
.brand-lockup strong,
.ck-brand__name,
.ck-page-header__title,
.ck-stat__value,
.ck-card__title,
.hero-copy-pane h1,
.article-hero-card h1,
.form-pitch-card h1,
.section-heading h2,
.cta-panel h2,
.site-footer h2,
.login-card__header h1 {
  font-family: var(--ck-font-heading);
  letter-spacing: -0.02em;
}

.ck-surface--marketing,
.ck-surface--cockpit {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
  color: var(--ck-text);
  background: var(--page-gradient);
}

.ck-surface--marketing::before,
.ck-surface--cockpit::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, var(--ck-dot-color) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.95;
}

.ck-surface--marketing > *,
.ck-surface--cockpit > * {
  position: relative;
  z-index: 1;
}

.ck-surface--marketing {
  --ck-bg: #f8fafc;
  --ck-surface-body: #f8fafc;
  --ck-dot-color: rgba(148, 163, 184, 0.55);
  --ck-text: #0f172a;
  --ck-text-soft: #334155;
  --ck-text-muted: #64748b;
  --ck-text-inverse: #f8fafc;
  --ck-border: color-mix(in srgb, var(--ck-text) 8%, transparent);
  --ck-border-strong: color-mix(in srgb, var(--ck-text) 12%, transparent);
  --ck-border-focus: color-mix(in srgb, var(--ck-primary) 40%, transparent);
  --ck-surface-base: rgba(255, 255, 255, 0.52);
  --ck-surface-panel: rgba(255, 255, 255, 0.68);
  --ck-surface-strong: rgba(255, 255, 255, 0.9);
  --ck-surface-raised: rgba(255, 255, 255, 0.86);
  --ck-surface-high: rgba(255, 255, 255, 0.94);
  --ck-surface-overlay: rgba(255, 255, 255, 0.82);
  --ck-surface-dark-strong: #e2e8f0;
  --ck-surface-dark-soft: #cbd5e1;
  --page-gradient:
    radial-gradient(circle at 12% 14%, rgba(99, 102, 241, 0.15), transparent 28%),
    radial-gradient(circle at 85% 8%, rgba(139, 92, 246, 0.14), transparent 26%),
    linear-gradient(180deg, #fcfdff 0%, #f8fafc 52%, #eef2ff 100%);
  --bg: var(--ck-bg);
  --bg-elevated: var(--ck-surface-base);
  --surface: var(--ck-surface-panel);
  --surface-strong: var(--ck-surface-strong);
  --surface-dark: var(--ck-surface-dark-strong);
  --surface-dark-2: var(--ck-surface-dark-soft);
  --panel-border: var(--ck-border);
  --panel-border-strong: var(--ck-border-strong);
  --ink: var(--ck-text);
  --ink-soft: var(--ck-text-soft);
  --muted: var(--ck-text-muted);
  --brand: var(--ck-primary);
  --brand-strong: var(--ck-primary-hover);
  --brand-soft: var(--ck-primary-soft);
  --gold: var(--ck-accent);
  --gold-soft: var(--ck-accent-soft);
  --danger: var(--ck-danger);
  --shadow-xl: var(--ck-shadow-lg);
  --shadow-lg: var(--ck-shadow);
  --radius-2xl: var(--ck-radius-2xl);
  --radius-xl: var(--ck-radius-lg);
  --radius-lg: var(--ck-radius);
  --radius-md: var(--ck-radius-sm);
  --radius-pill: var(--ck-radius-pill);
  --container: min(1220px, calc(100vw - 40px));
}

.ck-surface--cockpit {
  --ck-bg: #0f172a;
  --ck-surface-body: #0f172a;
  --ck-dot-color: rgba(71, 85, 105, 0.45);
  --ck-text: #f8fafc;
  --ck-text-soft: #cbd5e1;
  --ck-text-muted: #94a3b8;
  --ck-text-inverse: #0f172a;
  --ck-border: color-mix(in srgb, var(--ck-text) 8%, transparent);
  --ck-border-strong: color-mix(in srgb, var(--ck-text) 12%, transparent);
  --ck-border-focus: color-mix(in srgb, var(--ck-primary) 45%, transparent);
  --ck-surface-base: rgba(15, 23, 42, 0.78);
  --ck-surface-panel: rgba(30, 41, 59, 0.58);
  --ck-surface-strong: rgba(30, 41, 59, 0.9);
  --ck-surface-raised: rgba(30, 41, 59, 0.78);
  --ck-surface-high: rgba(51, 65, 85, 0.84);
  --ck-surface-overlay: rgba(15, 23, 42, 0.9);
  --ck-surface-dark-strong: #0f172a;
  --ck-surface-dark-soft: #1e293b;
  --page-gradient:
    radial-gradient(circle at 12% 14%, rgba(99, 102, 241, 0.18), transparent 28%),
    radial-gradient(circle at 85% 8%, rgba(139, 92, 246, 0.14), transparent 26%),
    linear-gradient(180deg, #020617 0%, #0f172a 44%, #111c38 100%);
  --bg: var(--ck-bg);
  --bg-elevated: var(--ck-surface-base);
  --surface: var(--ck-surface-panel);
  --surface-strong: var(--ck-surface-strong);
  --surface-dark: var(--ck-surface-dark-strong);
  --surface-dark-2: var(--ck-surface-dark-soft);
  --panel-border: var(--ck-border);
  --panel-border-strong: var(--ck-border-strong);
  --ink: var(--ck-text);
  --ink-soft: var(--ck-text-soft);
  --muted: var(--ck-text-muted);
  --brand: var(--ck-primary);
  --brand-strong: var(--ck-primary-hover);
  --brand-soft: var(--ck-primary-soft);
  --gold: var(--ck-accent);
  --gold-soft: var(--ck-accent-soft);
  --danger: var(--ck-danger);
  --shadow-xl: 0 32px 90px rgba(2, 6, 23, 0.56);
  --shadow-lg: 0 22px 60px rgba(2, 6, 23, 0.42);
  --radius-2xl: var(--ck-radius-2xl);
  --radius-xl: var(--ck-radius-lg);
  --radius-lg: var(--ck-radius);
  --radius-md: var(--ck-radius-sm);
  --radius-pill: var(--ck-radius-pill);
}

.ck-surface--marketing,
.ck-surface--marketing .marketing-shell,
.ck-surface--cockpit,
.ck-surface--cockpit .ck-shell,
.ck-surface--cockpit .login-shell {
  color: var(--ck-text);
}

.ck-surface--marketing .marketing-shell,
.ck-surface--cockpit .login-shell,
.ck-surface--cockpit .ck-shell {
  background: transparent;
}

.button,
.ck-btn {
  border-radius: var(--ck-radius-pill);
  transition:
    transform var(--ck-duration-fast) ease,
    box-shadow var(--ck-duration-fast) ease,
    background var(--ck-duration-fast) ease,
    border-color var(--ck-duration-fast) ease,
    color var(--ck-duration-fast) ease;
}

.button-primary,
.ck-btn--primary {
  background: linear-gradient(135deg, var(--ck-primary), var(--ck-accent));
  color: #fff;
  box-shadow: 0 18px 46px color-mix(in srgb, var(--ck-primary) 22%, transparent);
}

.button-primary:hover,
.ck-btn--primary:hover {
  background: linear-gradient(135deg, var(--ck-primary-hover), var(--ck-accent));
  box-shadow: 0 22px 56px color-mix(in srgb, var(--ck-primary) 28%, transparent);
}

.button-secondary,
.ck-btn--secondary,
.ck-btn--ghost,
.site-nav__link--lang,
.ck-tab,
.ck-workspace__select,
.ck-input,
.ck-select,
.ck-textarea {
  border-color: var(--ck-border-strong);
  background: color-mix(in srgb, var(--ck-surface-raised) 88%, transparent);
  color: var(--ck-text);
}

.ck-btn--ghost,
.site-nav__link,
.plain-link,
.ck-link-muted {
  color: var(--ck-text-soft);
}

.ck-btn--ghost:hover,
.site-nav__link:hover,
.site-nav__link.is-active,
.ck-nav__item:hover,
.ck-tab.is-active,
.ck-nav__item.is-active {
  color: var(--ck-text);
}

.ck-nav__item.is-active,
.ck-tab.is-active,
.site-nav__link.is-active,
.site-nav__link:hover,
.button-secondary:hover,
.ck-btn--secondary:hover,
.ck-btn--ghost:hover {
  background: color-mix(in srgb, var(--ck-primary) 12%, var(--ck-surface-raised));
  border-color: color-mix(in srgb, var(--ck-primary) 26%, transparent);
}

.ck-nav__item.is-active {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ck-primary) 36%, transparent);
}

.brand-lockup__mark,
.ck-brand__mark,
.login-brand__logo,
.ck-admin-badge {
  background: linear-gradient(135deg, var(--ck-primary), var(--ck-accent));
}

.skip-link,
.site-header,
.hero-copy-pane,
.hero-visual,
.lead-in-panel,
.cta-panel,
.site-footer,
.article-hero-card,
.article-body-card,
.article-sidebar__card,
.feature-card,
.empty-state-card,
.form-shell,
.form-pitch-card,
.surface-card,
.hero-card,
.pitch-card,
.form-card,
.blog-card,
.blog-card--featured,
.pricing-card,
.testimonial-strip__card,
.timeline-card,
.faq-card,
.ck-card,
.ck-stat,
.ck-sidebar,
.ck-topbar,
.ck-user-pill,
.ck-table-wrap,
.ck-tabs,
.login-card,
.login-mockup,
.inline-demo-panel,
.hero-visual__note,
.pricing-table-wrap {
  backdrop-filter: var(--ck-blur);
  -webkit-backdrop-filter: var(--ck-blur);
  border-color: var(--ck-border);
}

.site-header,
.hero-copy-pane,
.hero-visual,
.lead-in-panel,
.article-hero-card,
.article-body-card,
.article-sidebar__card,
.feature-card,
.empty-state-card,
.form-shell,
.form-pitch-card,
.surface-card,
.hero-card,
.pitch-card,
.form-card,
.blog-card,
.blog-card--featured,
.pricing-card,
.faq-card,
.inline-demo-panel,
.login-card,
.login-mockup {
  background: var(--ck-surface-panel);
  box-shadow: var(--shadow-xl);
  border: 1px solid color-mix(in srgb, var(--ck-text) 9%, transparent);
}

.hero-visual__note,
.cta-panel,
.site-footer,
.timeline-card,
.testimonial-strip,
.login-aside {
  background:
    radial-gradient(circle at 88% 12%, color-mix(in srgb, var(--ck-accent) 24%, transparent), transparent 28%),
    radial-gradient(circle at 14% 10%, color-mix(in srgb, var(--ck-primary) 22%, transparent), transparent 30%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--ck-surface-dark-strong) 92%, black 8%),
      color-mix(in srgb, var(--ck-surface-dark-soft) 86%, black 14%)
    );
}

.magic-card {
  padding: 40px;
  background:
    radial-gradient(circle at 12% 12%, color-mix(in srgb, var(--ck-accent) 16%, transparent), transparent 32%),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--ck-surface-panel) 90%, transparent),
      color-mix(in srgb, var(--ck-primary) 8%, var(--ck-surface-panel))
    );
  position: relative;
  overflow: hidden;
}

.magic-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent, color-mix(in srgb, var(--ck-primary) 8%, transparent), transparent);
  background-size: 200% 100%;
  animation: ck-magic-shift 8s linear infinite;
  pointer-events: none;
}

@keyframes ck-magic-shift {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.wizard-container {
  display: flex;
  min-height: calc(100vh - 120px);
  margin: -32px -48px;
}

.wizard-sidebar {
  width: 320px;
  border-right: 1px solid var(--ck-border);
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  background: color-mix(in srgb, var(--ck-surface-panel) 82%, transparent);
  backdrop-filter: var(--ck-blur);
}

.wizard-step {
  display: flex;
  gap: 16px;
  align-items: center;
  opacity: 0.58;
  transition: opacity var(--ck-duration) ease, transform var(--ck-duration-fast) ease;
}

.wizard-step.active,
.wizard-step.completed {
  opacity: 1;
}

.step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--ck-text) 14%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  background: color-mix(in srgb, var(--ck-surface-high) 72%, transparent);
}

.wizard-step.active .step-number {
  border-color: color-mix(in srgb, var(--ck-primary) 38%, transparent);
  background: linear-gradient(135deg, var(--ck-primary), var(--ck-accent));
  color: white;
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--ck-primary) 10%, transparent);
}

.wizard-step.completed .step-number {
  background: color-mix(in srgb, var(--ck-accent) 18%, var(--ck-surface-high));
  border-color: color-mix(in srgb, var(--ck-accent) 42%, transparent);
  color: #fff;
}

.step-title {
  margin: 0;
  color: var(--ck-text);
  font-weight: 700;
}

.step-sub {
  margin: 0;
  font-size: 0.75rem;
  color: var(--ck-text-muted);
}

.wizard-content {
  flex: 1;
  padding: 64px;
  max-width: 980px;
  margin: 0 auto;
}

.wizard-title {
  font-size: clamp(2.4rem, 4vw, 4.4rem);
  font-weight: 800;
  margin-bottom: 12px;
}

.wizard-sub {
  font-size: 1.05rem;
  color: var(--ck-text-muted);
  margin-bottom: 48px;
}

.analysis-progress {
  margin-top: 32px;
}

.analysis-log,
.ck-test-log {
  margin-top: 18px;
  min-height: 150px;
  max-height: 220px;
  overflow-y: auto;
  padding: 16px;
  border-radius: var(--ck-radius);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  color: var(--ck-accent);
  background: color-mix(in srgb, var(--ck-surface-high) 78%, transparent);
}

.log-item {
  margin: 0 0 0.5rem;
  opacity: 0;
  animation: ck-log-in 0.35s ease forwards;
}

@keyframes ck-log-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tone-grid,
.ck-swatch-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.tone-card,
.ck-widget-swatch {
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--ck-text) 10%, transparent);
  border-radius: var(--ck-radius);
  text-align: center;
  cursor: pointer;
  transition:
    transform var(--ck-duration-fast) ease,
    border-color var(--ck-duration-fast) ease,
    box-shadow var(--ck-duration-fast) ease;
  font-weight: 700;
  background: color-mix(in srgb, var(--ck-surface-high) 72%, transparent);
}

.tone-card:hover,
.ck-widget-swatch:hover,
.tone-card.active,
.ck-widget-swatch.is-active {
  border-color: color-mix(in srgb, var(--ck-primary) 38%, transparent);
  transform: translateY(-2px);
  box-shadow: 0 14px 36px color-mix(in srgb, var(--ck-primary) 14%, transparent);
}

.tone-card.active,
.ck-widget-swatch.is-active {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--ck-primary) 18%, var(--ck-surface-high)),
    color-mix(in srgb, var(--ck-accent) 16%, var(--ck-surface-high))
  );
}

.preview-card,
.ck-widget-preview {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--ck-surface-dark-strong) 92%, black 8%),
    color-mix(in srgb, var(--ck-surface-dark-soft) 86%, black 14%)
  );
  border-radius: var(--ck-radius-2xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-header {
  padding: 16px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.72;
}

.chat-mockup,
.ck-widget-preview__body {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.chat-bubble {
  padding: 14px 18px;
  border-radius: 16px;
  max-width: 85%;
  font-size: 0.95rem;
  line-height: 1.45;
}

.chat-bubble.bot {
  background: linear-gradient(135deg, var(--ck-primary), var(--ck-accent));
  color: white;
  border-bottom-left-radius: 4px;
}

.widget-preview-container,
.ck-widget-preview-wrap {
  display: flex;
  align-items: stretch;
}

.widget-mockup,
.ck-widget-preview__launcher {
  min-height: 100%;
  width: 100%;
  padding: 2rem;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  background: linear-gradient(135deg, var(--ck-primary), var(--ck-accent));
}

.widget-mockup.is-indigo,
.ck-widget-preview--indigo .ck-widget-preview__launcher {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

.widget-mockup.is-violet,
.ck-widget-preview--violet .ck-widget-preview__launcher {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.widget-mockup.is-midnight,
.ck-widget-preview--midnight .ck-widget-preview__launcher {
  background: linear-gradient(135deg, #334155, #1e293b);
}

.widget-mockup.is-aurora,
.ck-widget-preview--aurora .ck-widget-preview__launcher {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.launcher-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.25rem;
  border-radius: var(--ck-radius-pill);
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: white;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.22);
}

.page-list {
  max-height: 450px;
  overflow-y: auto;
  border: 1px solid var(--ck-border);
  border-radius: var(--ck-radius);
}

.page-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 16px 20px;
  border-bottom: 1px solid var(--ck-border);
}

.page-item:last-child {
  border-bottom: none;
}

.page-info {
  display: grid;
  gap: 4px;
}

.page-title {
  font-size: 0.92rem;
  font-weight: 700;
}

.page-url {
  font-size: 0.78rem;
  color: var(--ck-text-muted);
}

.wizard-footer {
  display: flex;
  gap: 16px;
  padding-top: 48px;
  border-top: 1px solid var(--ck-border);
  margin-top: 64px;
}

.ck-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(2, 6, 23, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.ck-modal {
  width: min(100%, 360px);
  padding: 20px;
  border-radius: var(--ck-radius-lg);
}

.ck-link-muted {
  color: var(--ck-text-muted);
  text-decoration: none;
}

.ck-link-muted:hover {
  color: var(--ck-text);
}

.ck-stack-xs { display: grid; gap: 0.375rem; }
.ck-stack-sm { display: grid; gap: 0.5rem; }
.ck-stack-md { display: grid; gap: 0.75rem; }
.ck-stack-lg { display: grid; gap: 1rem; }
.ck-stack-xl { display: grid; gap: 1.25rem; }
.ck-flow-inline { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.ck-row { display: flex; align-items: center; gap: 0.5rem; }
.ck-row-start { display: flex; align-items: flex-start; gap: 1rem; }
.ck-row-between { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
.ck-row-between-start { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.ck-row-wrap { display: flex; flex-wrap: wrap; gap: 1rem; }
.ck-grow { flex: 1; }
.ck-shrink-0 { flex-shrink: 0; }
.ck-w-full { width: 100%; }
.ck-w-auto { width: auto; }
.ck-max-w-sm { max-width: 300px; }
.ck-max-w-md { max-width: 480px; }
.ck-max-w-lg { max-width: 560px; }
.ck-max-w-xl { max-width: 640px; }
.ck-text-xs { font-size: 0.72rem; }
.ck-text-sm { font-size: 0.78rem; }
.ck-text-md { font-size: 0.84rem; }
.ck-text-lg { font-size: 1.1rem; }
.ck-text-muted { color: var(--ck-text-muted); }
.ck-text-soft { color: var(--ck-text-soft); }
.ck-text-default { color: var(--ck-text); }
.ck-text-success { color: var(--ck-success); }
.ck-text-warning { color: var(--ck-warning); }
.ck-text-danger { color: var(--ck-danger); }
.ck-text-accent { color: var(--ck-accent); }
.ck-font-medium { font-weight: 500; }
.ck-font-bold { font-weight: 700; }
.ck-font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.ck-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ck-note { padding: 12px; border-radius: var(--ck-radius); background: color-mix(in srgb, var(--ck-surface-high) 74%, transparent); }
.ck-note--accent { background: color-mix(in srgb, var(--ck-accent) 12%, var(--ck-surface-high)); }
.ck-note--quote { margin: 0; padding: 8px 10px; border-radius: var(--ck-radius-sm); background: color-mix(in srgb, var(--ck-surface-high) 76%, transparent); }
.ck-skeleton--sm { height: 40px; }
.ck-skeleton--md { height: 44px; }
.ck-skeleton--lg { height: 52px; }
.ck-skeleton--xl { height: 60px; }
.ck-skeleton--2xl { height: 80px; }
.ck-skeleton--mb-sm { margin-bottom: 8px; }
.ck-skeleton--mb-md { margin-bottom: 10px; }
.ck-skeleton--pill { width: 8px; height: 8px; border-radius: 50%; }
.ck-mt-sm { margin-top: 4px; }
.ck-mt-md { margin-top: 10px; }
.ck-mt-lg { margin-top: 16px; }
.ck-mt-xl { margin-top: 20px; }
.ck-mt-2xl { margin-top: 24px; }
.ck-mt-3xl { margin-top: 32px; }
.ck-mb-sm { margin-bottom: 8px; }
.ck-mb-md { margin-bottom: 12px; }
.ck-mb-lg { margin-bottom: 16px; }
.ck-mb-xl { margin-bottom: 20px; }
.ck-mb-2xl { margin-bottom: 24px; }
.ck-p-md { padding: 10px; }
.ck-center { text-align: center; }
.ck-align-start { align-content: start; }
.ck-btn--fill { width: 100%; justify-content: center; }
.ck-btn--start { justify-content: flex-start; }
.ck-select--compact { width: auto; min-width: 120px; }
.ck-select--wide { width: auto; min-width: 140px; }
.ck-select--project { max-width: 300px; }
.ck-score--success { color: var(--ck-success); }
.ck-score--warning { color: var(--ck-warning); }
.ck-score--danger { color: var(--ck-danger); }
.ck-score--accent { color: var(--ck-accent); }
.ck-score--muted { color: var(--ck-text-muted); }
.ck-nav-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  border-radius: var(--ck-radius-sm);
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.ck-nav-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--ck-primary) 28%, transparent);
}
.ck-progress {
  width: 100%;
  height: 10px;
}
.ck-progress::-webkit-progress-bar {
  background: color-mix(in srgb, var(--ck-text) 10%, transparent);
  border-radius: 999px;
}
.ck-progress::-webkit-progress-value {
  background: linear-gradient(90deg, var(--ck-primary), var(--ck-accent));
  border-radius: 999px;
}
.ck-progress::-moz-progress-bar {
  background: linear-gradient(90deg, var(--ck-primary), var(--ck-accent));
  border-radius: 999px;
}
.ck-rating-row { display: flex; align-items: center; gap: 16px; }
.ck-rating-stars { font-size: 2rem; line-height: 1; }
.ck-rating-bar { flex: 1; background: color-mix(in srgb, var(--ck-text) 10%, transparent); border-radius: 4px; height: 10px; overflow: hidden; }
.ck-rating-bar__fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; background: linear-gradient(90deg, var(--ck-primary), var(--ck-accent)); }
.ck-test-shell { max-width: 720px; margin-top: 16px; display: flex; flex-direction: column; gap: 0; }
.ck-test-log { min-height: 360px; max-height: 520px; margin-top: 0; border-radius: var(--ck-radius) var(--ck-radius) 0 0; display: flex; flex-direction: column; gap: 14px; background: color-mix(in srgb, var(--ck-surface-panel) 82%, transparent); }
.ck-test-empty { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--ck-text-muted); font-size: 0.84rem; }
.ck-chat-msg--user { display: flex; justify-content: flex-end; }
.ck-chat-msg--bot { display: flex; flex-direction: column; gap: 8px; max-width: 88%; }
.ck-chat-bubble--user { background: linear-gradient(135deg, var(--ck-primary), var(--ck-accent)); color: #fff; padding: 10px 14px; border-radius: 16px 16px 4px 16px; max-width: 78%; font-size: 0.86rem; line-height: 1.5; }
.ck-chat-bubble--bot { background: color-mix(in srgb, var(--ck-surface-high) 78%, transparent); border: 1px solid var(--ck-border); padding: 12px 14px; border-radius: 4px 16px 16px 16px; font-size: 0.86rem; line-height: 1.6; color: var(--ck-text); }
.ck-chat-meta { display: flex; align-items: center; gap: 10px; padding-left: 4px; }
.ck-chat-citations { display: flex; flex-direction: column; gap: 4px; padding-left: 4px; }
.ck-chat-composer { display: flex; gap: 0; border: 1px solid var(--ck-border); border-top: none; border-radius: 0 0 var(--ck-radius) var(--ck-radius); background: color-mix(in srgb, var(--ck-surface-raised) 82%, transparent); overflow: hidden; }
.ck-chat-composer .ck-input { border: none; border-radius: 0; background: transparent; flex: 1; }
.ck-chat-composer .ck-btn { border-radius: 0; min-width: 80px; }
.ck-thinking { display: flex; gap: 5px; padding-left: 4px; }
.ck-spin { animation: spin 1s linear infinite; display: inline-block; }
.ck-bar-cell { display: flex; align-items: center; gap: 8px; }
.ck-bar-cell__label { font-size: 0.82rem; width: 42px; color: var(--ck-text-soft); }
.ck-bar-cell__count { font-size: 0.78rem; color: var(--ck-text-muted); width: 32px; text-align: right; }
.ck-stat-list { display: grid; gap: 6px; }
.ck-stat-list__row { display: flex; justify-content: space-between; align-items: center; }
.ck-stat-list__label { font-size: 0.8rem; color: var(--ck-text-soft); }
.ck-api-method { min-width: 46px; justify-content: center; font-size: 0.68rem; }
.ck-api-endpoint { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.78rem; color: var(--ck-text-soft); flex: 1; }
.ck-api-meta { font-size: 0.72rem; color: var(--ck-text-muted); }
.ck-breadcrumb-link { color: var(--ck-text-muted); text-decoration: none; }
.ck-breadcrumb-link:hover { color: var(--ck-text); }
.ck-rating-inline { font-size: 0.84rem; }
.ck-range { width: 100%; accent-color: var(--ck-primary); }

@media (max-width: 1024px) {
  .wizard-container {
    flex-direction: column;
    margin: -16px -16px 0;
  }

  .wizard-sidebar {
    width: auto;
    border-right: 0;
    border-bottom: 1px solid var(--ck-border);
    padding: 24px 20px;
  }

  .wizard-content {
    padding: 32px 20px;
  }

  .tone-grid,
  .ck-swatch-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .ck-row-between,
  .ck-row-between-start,
  .ck-row-start {
    flex-direction: column;
    align-items: stretch;
  }

  .ck-select--compact,
  .ck-select--wide,
  .ck-select--project,
  .ck-max-w-sm,
  .ck-max-w-md,
  .ck-max-w-lg,
  .ck-max-w-xl {
    max-width: none;
    width: 100%;
  }
}
`;

const autoCss = ["/* Extracted inline style utilities */"];
for (const [style, className] of styleClassMap.entries()) {
  autoCss.push(`.${className} { ${style} }`);
}

const finalCss = [
  canonicalizeCss(stripLegacyRoot(baseCss).trim()),
  glassOverrides.trim(),
  extractedStyles.join("\n\n"),
  autoCss.join("\n"),
].join("\n\n");

fs.writeFileSync(stylesPath, `${finalCss}\n`);
