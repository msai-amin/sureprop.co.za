/**
 * Runs `prisma generate` during npm install (e.g. on Vercel). Prisma still
 * reads DATABASE_URL from the schema even though generate does not connect;
 * supply a placeholder when unset so CI/build succeeds before env is injected.
 */
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL =
    "postgresql://postgres:postgres@127.0.0.1:5432/prisma_generate_ci?schema=public";
}

const result = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
