import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

const env = envSchema.parse(process.env);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(currentDir, "../migrations/001_init.sql");

async function main(): Promise<void> {
  const sql = await readFile(migrationPath, "utf8");
  const client = new Client({ connectionString: env.DATABASE_URL });

  await client.connect();
  try {
    await client.query(sql);
    console.log(`Applied migration ${migrationPath}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
