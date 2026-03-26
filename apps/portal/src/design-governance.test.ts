import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const appDir = new URL("./app/", import.meta.url);
const stylesFile = new URL("./styles.css", import.meta.url);

function collectTsFiles(dir: URL, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const next = new URL(entry.isDirectory() ? `${entry.name}/` : entry.name, dir);
    if (entry.isDirectory()) {
      collectTsFiles(next, files);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(next.pathname);
    }
  }
  return files;
}

test("portal app does not reintroduce local or inline styling", () => {
  const checks = [
    { label: "inline style attribute", pattern: /style="/ },
    { label: "style binding", pattern: /\[style(?:\.|\])/ },
    { label: "component-local styles", pattern: /styles:\s*\[/ },
    { label: "component styleUrls", pattern: /styleUrls/ },
  ];

  const violations: string[] = [];
  for (const file of collectTsFiles(appDir)) {
    const source = fs.readFileSync(file, "utf8");
    for (const check of checks) {
      if (check.pattern.test(source)) {
        violations.push(`${path.relative("/var/www/talkaris/apps/portal/src", file)}: ${check.label}`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Design governance violations detected:\n${violations.map((item) => `- ${item}`).join("\n")}`
  );
});

test("auth and marketing routes use ck form primitives for text controls", () => {
  const targets = [
    { file: new URL("./app/pages/login-page.component.ts", import.meta.url), tag: "input", expectedClass: "ck-input" },
    { file: new URL("./app/pages/reset-password-page.component.ts", import.meta.url), tag: "input", expectedClass: "ck-input" },
    { file: new URL("./app/pages/access-request-page.component.ts", import.meta.url), tag: "input", expectedClass: "ck-input" },
    { file: new URL("./app/pages/access-request-page.component.ts", import.meta.url), tag: "textarea", expectedClass: "ck-textarea" },
    { file: new URL("./app/pages/public-page.component.ts", import.meta.url), tag: "input", expectedClass: "ck-input" },
    { file: new URL("./app/pages/blog-list-page.component.ts", import.meta.url), tag: "input", expectedClass: "ck-input" },
  ];

  const violations: string[] = [];

  for (const target of targets) {
    const source = fs.readFileSync(target.file, "utf8");
    const tagPattern = new RegExp(`<${target.tag}\\b[\\s\\S]*?>`, "g");
    const tags = source.match(tagPattern) ?? [];

    for (const tag of tags) {
      if (
        target.tag === "input"
        && /type\s*=\s*["'](?:checkbox|radio|hidden|range|file)["']/i.test(tag)
      ) {
        continue;
      }

      const classPattern = new RegExp(`class\\s*=\\s*["'][^"']*\\b${target.expectedClass}\\b[^"']*["']`, "i");
      if (!classPattern.test(tag)) {
        const snippet = tag.replace(/\s+/g, " ").slice(0, 120);
        violations.push(`${path.relative("/var/www/talkaris/apps/portal/src", target.file.pathname)}: ${snippet}`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Form primitive violations detected:\n${violations.map((item) => `- ${item}`).join("\n")}`
  );
});

test("styles.css does not reintroduce legacy teal primary literals", () => {
  const source = fs.readFileSync(stylesFile, "utf8");
  const checks = [
    { label: "legacy teal rgba", pattern: /rgba\(28,\s*122,\s*103/i },
    { label: "legacy teal dark", pattern: /#06100e/i },
    { label: "legacy teal mid", pattern: /#0c1a14/i },
    { label: "legacy teal raised", pattern: /#13221a/i },
    { label: "legacy teal high", pattern: /#1a2e22/i },
    { label: "legacy teal overlay", pattern: /#1f3628/i },
    { label: "legacy teal gradient", pattern: /#2d8e79/i },
    { label: "legacy mint gradient", pattern: /#4fbba1/i },
  ];

  const violations = checks.filter((check) => check.pattern.test(source)).map((check) => check.label);

  assert.deepEqual(
    violations,
    [],
    `Legacy primary literals detected in styles.css:\n${violations.map((item) => `- ${item}`).join("\n")}`
  );
});

test("portal source uses the canonical talkaris embed bases", () => {
  const checks = [
    { label: "old API base", pattern: /https:\/\/api\.talkaris\.com/i },
    { label: "old widget base", pattern: /https:\/\/widget\.talkaris\.com/i },
    { label: "legacy bundle embed", pattern: /bundle\.js/i },
  ];

  const violations: string[] = [];
  for (const file of collectTsFiles(appDir)) {
    const source = fs.readFileSync(file, "utf8");
    for (const check of checks) {
      if (check.pattern.test(source)) {
        violations.push(`${path.relative("/var/www/talkaris/apps/portal/src", file)}: ${check.label}`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Legacy embed base references detected:\n${violations.map((item) => `- ${item}`).join("\n")}`
  );
});

test("portal source does not reintroduce legacy widget aliases", () => {
  const checks = [
    { label: "chat portal widget global", pattern: /ChatPortalWidgetConfig/ },
    { label: "tecnoria widget global", pattern: /TecnoriaChatWidgetConfig/ },
    { label: "tecnoria postmessage alias", pattern: /tecnoria-chat:/ },
  ];

  const violations: string[] = [];
  for (const file of collectTsFiles(appDir)) {
    const source = fs.readFileSync(file, "utf8");
    for (const check of checks) {
      if (check.pattern.test(source)) {
        violations.push(`${path.relative("/var/www/talkaris/apps/portal/src", file)}: ${check.label}`);
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Legacy widget aliases detected:\n${violations.map((item) => `- ${item}`).join("\n")}`
  );
});
