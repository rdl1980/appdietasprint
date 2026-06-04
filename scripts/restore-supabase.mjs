import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const databaseUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
const backupFile = process.argv[2];

if (!databaseUrl) {
  console.error("Missing POSTGRES_URL_NON_POOLING, POSTGRES_URL or DATABASE_URL.");
  process.exit(1);
}

if (!backupFile) {
  console.error("Usage: npm run db:restore -- backups/supabase-YYYY-MM-DD.dump");
  process.exit(1);
}

const backupPath = path.resolve(process.cwd(), backupFile);
await access(backupPath);

const pgRestore = spawn(
  "pg_restore",
  [
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    "--dbname",
    databaseUrl,
    backupPath,
  ],
  {
    stdio: ["ignore", "inherit", "inherit"],
    shell: false,
  },
);

pgRestore.on("exit", (code) => {
  if (code === 0) {
    console.log(`Restore completed from: ${backupPath}`);
    return;
  }

  console.error("Restore failed. Verify the backup file, PostgreSQL client tools and target database URL.");
  process.exit(code || 1);
});
