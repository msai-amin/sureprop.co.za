/**
 * Verifies required env vars for local dev. Loads .env then .env.local (.env.local wins).
 * Run: npm run check:env
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const SUPABASE_PUBLISH_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

function loadMergedEnv() {
  const base = parseEnvFile(path.join(root, ".env"));
  const local = parseEnvFile(path.join(root, ".env.local"));
  const merged = { ...base, ...local };
  for (const k of SUPABASE_PUBLISH_KEYS) {
    if (process.env[k] !== undefined) merged[k] = process.env[k];
  }
  return merged;
}

const env = loadMergedEnv();

const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const anon = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

const errors = [];

if (!url) {
  errors.push("NEXT_PUBLIC_SUPABASE_URL: missing (.env, .env.local, or export in shell)");
} else if (/your_project_ref/i.test(url)) {
  errors.push("NEXT_PUBLIC_SUPABASE_URL: still placeholder (replace YOUR_PROJECT_REF)");
}

if (!anon) {
  errors.push(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY: missing — paste anon public key from Supabase dashboard (API settings).",
  );
} else if (/^your_anon_public_key$/i.test(anon)) {
  errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY: still env.example placeholder");
}

if (errors.length) {
  console.error("Environment check failed:\n");
  for (const e of errors) console.error(`  - ${e}`);
  console.error("\nDocs: env.example | https://supabase.com/dashboard/project/_/settings/api");
  console.error("Tip: add the key to .env.local (gitignored), then run this command again.\n");
  process.exit(1);
}

console.log("Supabase publishable env OK (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY).");
