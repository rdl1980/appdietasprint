import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const databaseUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing POSTGRES_URL_NON_POOLING, POSTGRES_URL or DATABASE_URL.");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(process.cwd(), "backups");
const outputPath = path.join(backupDir, `supabase-${timestamp}.dump`);

await mkdir(backupDir, { recursive: true });

const pgDump = spawn(
  "pg_dump",
  [
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    "--file",
    outputPath,
    databaseUrl,
  ],
  {
    stdio: ["ignore", "inherit", "inherit"],
    shell: false,
  },
);

pgDump.on("exit", (code) => {
  if (code === 0) {
    console.log(`Backup created: ${outputPath}`);
    return;
  }

  console.error("Backup failed. Ensure PostgreSQL client tools are installed and the database URL is valid.");
  process.exit(code || 1);
});
