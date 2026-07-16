// Initialize Turso database via HTTP API v2 pipeline
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const DB_URL = process.env.PRISM_DB_URL!;
const DB_AUTH_TOKEN = process.env.PRISM_DB_AUTH_TOKEN!;
const API_URL = DB_URL.replace(/^libsql:/, "https:") + "/v2/pipeline";

async function pipeline(requests: unknown[]) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${DB_AUTH_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests }),
  });
  return res.json() as Promise<{ results?: Array<{ type: string; error?: { message: string } }> }>;
}

/** Extract individual SQL statements by reassembling lines that end with ; */
function extractStatements(sql: string): string[] {
  const stmts: string[] = [];
  let current = "";
  for (const line of sql.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("--")) continue;
    current += " " + trimmed;
    if (trimmed.endsWith(";")) {
      const clean = current.trim().replace(/;$/, "");
      if (clean) stmts.push(clean);
      current = "";
    }
  }
  if (current.trim()) stmts.push(current.trim());
  return stmts;
}

async function main() {
  if (!DB_URL || !DB_AUTH_TOKEN) { console.error("Set PRISM_DB_URL and PRISM_DB_AUTH_TOKEN"); process.exit(1); }

  console.log(`Using Turso API: ${API_URL}`);

  const schemaPath = resolve(import.meta.dirname, "../db/schema.sql");
  const schema = await readFile(schemaPath, "utf-8");
  const stmts = extractStatements(schema);
  
  console.log(`Found ${stmts.length} statements`);

  // Send in batches
  let ok = 0, err = 0;
  for (let i = 0; i < stmts.length; i += 5) {
    const batch = stmts.slice(i, i + 5);
    const requests = batch.map((s) => ({ type: "execute", stmt: { sql: s + ";" } }));
    const result = await pipeline(requests);
    
    if (result.results) {
      for (let j = 0; j < result.results.length; j++) {
        const r = result.results[j];
        if (r.type === "ok") {
          const label = batch[j].slice(0, 60);
          ok++;
          // Only print a short summary for CREATE statements
          if (batch[j].toUpperCase().startsWith("CREATE TABLE")) {
            const name = batch[j].match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1] ?? "?";
            console.log(`  ✓ TABLE ${name}`);
          } else if (batch[j].toUpperCase().startsWith("CREATE INDEX")) {
            const name = batch[j].match(/CREATE INDEX IF NOT EXISTS (\w+)/i)?.[1] ?? "?";
            console.log(`  ✓ INDEX ${name}`);
          } else if (batch[j].toUpperCase().includes("PRAGMA")) {
            console.log(`  ✓ ${batch[j].slice(0, 40)}`);
          }
        } else {
          const msg = r.error?.message ?? "";
          if (msg.includes("already exists")) {
            const name = batch[j].match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1] ?? "?";
            console.log(`  - ${name} (exists)`);
            ok++;
          } else {
            console.error(`  ✗ ${batch[j].slice(0, 50)}: ${msg.slice(0, 100)}`);
            err++;
          }
        }
      }
    }
  }

  console.log(`\n✓ ${ok} ok, ${err} errors`);

  // Verify
  const v = await pipeline([{ type: "execute", stmt: { sql: "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name" } }]);
  const rows = (v as any)?.results?.[0]?.response?.result?.rows ?? [];
  if (rows.length > 0) {
    console.log("\nTables:");
    for (const row of rows) console.log(`  - ${row[0]}`);
  } else {
    // Try again
    const c = await pipeline([{ type: "execute", stmt: { sql: "SELECT count(*) as c FROM sqlite_master WHERE type='table'" } }]);
    console.log("\nVerification:", JSON.stringify(c).slice(0, 300));
  }
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });