import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = "/var/www/talkaris";
const SOURCE_DIRS = [
  path.join(ROOT, "apps/chat-api/src"),
  path.join(ROOT, "apps/ingest-worker/src"),
  path.join(ROOT, "apps/widget/public"),
  path.join(ROOT, "apps/portal/src/app"),
];

function collectFiles(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
      continue;
    }
    if (entry.isFile() && /\.(ts|js|html|md)$/.test(entry.name) && !entry.name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

test("tracked source does not import stale dist runtime artifacts", () => {
  const violations: string[] = [];
  const patterns = [
    /dist\/apps\/chat-api\/src\/index\.js/,
    /dist\/apps\/ingest-worker\/src\/index\.js/,
    /new URL\("\.\/apps\/chat-api\/src\/index\.js"/,
    /new URL\("\.\/apps\/ingest-worker\/src\/index\.js"/,
  ];

  for (const file of SOURCE_DIRS.flatMap((dir) => collectFiles(dir))) {
    const source = fs.readFileSync(file, "utf8");
    for (const pattern of patterns) {
      if (pattern.test(source)) {
        violations.push(path.relative(ROOT, file));
        break;
      }
    }
  }

  assert.deepEqual(violations, [], `Dist-backed runtime imports detected:\n${violations.join("\n")}`);
});

test("tracked source does not reintroduce legacy widget aliases", () => {
  const violations: string[] = [];
  const checks = [
    /ChatPortalWidgetConfig/,
    /TecnoriaChatWidgetConfig/,
    /tecnoria-chat:/,
    /globalConfig\.widgetOrigin/,
    /dataset\.widgetOrigin/,
  ];

  for (const file of SOURCE_DIRS.flatMap((dir) => collectFiles(dir))) {
    const source = fs.readFileSync(file, "utf8");
    for (const check of checks) {
      if (check.test(source)) {
        violations.push(path.relative(ROOT, file));
        break;
      }
    }
  }

  assert.deepEqual(violations, [], `Legacy widget aliases detected:\n${violations.join("\n")}`);
});
