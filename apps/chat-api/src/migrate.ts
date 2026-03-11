import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

const env = envSchema.parse(process.env);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(currentDir, "../migrations");

async function main(): Promise<void> {
  const client = new Client({ connectionString: env.DATABASE_URL });
  const migrationFiles = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  await client.connect();
  try {
    for (const migrationFile of migrationFiles) {
      const migrationPath = path.resolve(migrationsDir, migrationFile);
      const sql = await readFile(migrationPath, "utf8");
      await client.query(sql);
      console.log(`Applied migration ${migrationPath}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
