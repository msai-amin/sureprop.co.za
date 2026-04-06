import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const IMPORT_AGENT_ID = "00000000-0000-4000-8000-000000000024";
const DEFAULT_CSV_PATH =
  "/Users/aminamouhadi/prop24/property24_western_cape_20260406_174706.csv";

function getEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function deriveSupabaseUrlFromJwt(jwt) {
  const parts = jwt.split(".");
  if (parts.length < 2) return "";
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    const ref = typeof payload?.ref === "string" ? payload.ref.trim() : "";
    return ref ? `https://${ref}.supabase.co` : "";
  } catch {
    return "";
  }
}

function resolveSupabaseUrl() {
  return (
    getEnv("NEXT_PUBLIC_SUPABASE_URL") ||
    getEnv("SUPABASE_URL") ||
    deriveSupabaseUrlFromJwt(getEnv("SUPABASE_SERVICE_ROLE_KEY")) ||
    deriveSupabaseUrlFromJwt(getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"))
  );
}

function parseCsvLine(line) {
  const out = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cell);
      cell = "";
      continue;
    }
    cell += ch;
  }
  out.push(cell);
  return out;
}

function toInteger(value) {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePrice(raw) {
  const value = toInteger(raw);
  return value && value > 0 ? value : null;
}

function asIso(raw) {
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j += 1) {
      row[headers[j]] = (values[j] ?? "").trim();
    }
    rows.push(row);
  }
  return rows;
}

async function fetchExistingListingIds(supabase) {
  const listingIds = new Set();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("Property")
      .select("features")
      .order("createdAt", { ascending: false })
      .range(from, to);

    if (error) throw error;
    if (!data?.length) break;

    for (const row of data) {
      const features = row?.features;
      if (!features || typeof features !== "object") continue;
      const source = features.source;
      const sourceListingId = features.sourceListingId;
      if (source === "property24" && typeof sourceListingId === "string") {
        listingIds.add(sourceListingId);
      }
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return listingIds;
}

function buildPropertyRow(csvRow, nowIso) {
  const listingId = csvRow.listing_id || "";
  const title = csvRow.title || "";
  const price = parsePrice(csvRow.price || "");

  if (!listingId || !title || !price) return null;

  return {
    id: randomUUID(),
    agentId: IMPORT_AGENT_ID,
    title,
    price,
    location: {
      suburb: csvRow.location || null,
      address: csvRow.address || null,
      province: "Western Cape",
      country: "South Africa",
    },
    features: {
      source: "property24",
      sourceListingId: listingId,
      category: csvRow.category || null,
      sourceUrl: csvRow.listing_url || null,
      imageUrl:
        csvRow.image_url && csvRow.image_url !== "/blank.gif"
          ? csvRow.image_url
          : null,
      scrapedAt: asIso(csvRow.scraped_at || ""),
      bedrooms: toInteger(csvRow.bedrooms || ""),
      bathrooms: toInteger(csvRow.bathrooms || ""),
      parking: toInteger(csvRow.parking || ""),
      floorSizeSqm: toInteger(csvRow.floor_size || ""),
      sourceLocation: csvRow.location || null,
      sourceAddress: csvRow.address || null,
    },
    status: "ACTIVE",
    updatedAt: nowIso,
  };
}

async function ensureImportAgent(supabase, nowIso) {
  const { error } = await supabase.from("User").upsert(
    {
      id: IMPORT_AGENT_ID,
      role: "AGENT",
      verificationStatus: "VERIFIED",
      fullName: "Property24 Import Agent",
      email: "imports+property24@sureprop.co.za",
      updatedAt: nowIso,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

async function main() {
  const csvPath = process.argv[2] || DEFAULT_CSV_PATH;
  const supabaseUrl = resolveSupabaseUrl();
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const text = await readFile(csvPath, "utf8");
  const rows = parseCsv(text);
  const nowIso = new Date().toISOString();

  await ensureImportAgent(supabase, nowIso);
  const existing = await fetchExistingListingIds(supabase);
  const incomingSeen = new Set();

  const toInsert = [];
  let skippedInvalid = 0;
  let skippedDuplicate = 0;

  for (const row of rows) {
    const listingId = row.listing_id || "";
    if (!listingId) {
      skippedInvalid += 1;
      continue;
    }
    if (existing.has(listingId) || incomingSeen.has(listingId)) {
      skippedDuplicate += 1;
      continue;
    }

    const mapped = buildPropertyRow(row, nowIso);
    if (!mapped) {
      skippedInvalid += 1;
      continue;
    }

    incomingSeen.add(listingId);
    toInsert.push(mapped);
  }

  let inserted = 0;
  const chunkSize = 200;
  for (let i = 0; i < toInsert.length; i += chunkSize) {
    const chunk = toInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from("Property").insert(chunk);
    if (error) throw error;
    inserted += chunk.length;
  }

  console.log("Property24 import completed.");
  console.log(`CSV rows: ${rows.length}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped duplicates: ${skippedDuplicate}`);
  console.log(`Skipped invalid: ${skippedInvalid}`);
}

main().catch((error) => {
  console.error("Import failed:", error?.message ?? error);
  process.exitCode = 1;
});
