import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const [, , outputPath, targetSpecifier] = process.argv;

if (!outputPath || !targetSpecifier) {
  console.error("Usage: node scripts/write-entry-shim.mjs <outputPath> <targetSpecifier>");
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `import ${JSON.stringify(targetSpecifier)};\n`,
  "utf8",
);
