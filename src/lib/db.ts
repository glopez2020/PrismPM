// Turso HTTP API v2 — direct HTTP queries, no local sync engine needed.
// The init script (src/db/init.ts) handles schema setup; this module handles
// runtime CRUD operations.

const DB_URL = process.env.PRISM_DB_URL || process.env.TURSO_DATABASE_URL || "";
const DB_AUTH_TOKEN = process.env.PRISM_DB_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || "";
const API_URL = DB_URL.replace(/^libsql:/, "https:") + "/v2/pipeline";

/** Convert Turso HTTP API result rows into a flat array of objects. */
function rowsToObjects(
  cols: Array<{ name: string; decltype: string | null }>,
  rows: Array<Array<{ type: string; value: string | number | null }>>,
): Record<string, unknown>[] {
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < cols.length; i++) {
      const val = row[i];
      obj[cols[i].name] = val?.value ?? null;
    }
    return obj;
  });
}

async function pipeline(requests: unknown[]) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${DB_AUTH_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests }),
  });
  const data = (await res.json()) as {
    results?: Array<{
      type: string;
      error?: { message: string };
      response?: { type: string; result: { cols: Array<{ name: string; decltype: string | null }>; rows: Array<Array<{ type: string; value: string | number | null }>>; affected_row_count: number; last_insert_rowid: string | null } };
    }>;
  };
  const firstErr = data.results?.find((r) => r.type === "error");
  if (firstErr) throw new Error(firstErr.error?.message ?? "SQL error");
  return data.results?.[0]?.response?.result ?? null;
}

/** Execute a SQL query and return all rows as objects. */
export async function queryAll(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
  const result = await pipeline([
    {
      type: "execute",
      stmt: {
        sql,
        params: params,
      },
    },
  ]);
  if (!result) return [];
  return rowsToObjects(result.cols, result.rows);
}

/** Execute a single-row query and return the first row or null. */
export async function queryOne(sql: string, params: unknown[] = []): Promise<Record<string, unknown> | null> {
  const rows = await queryAll(sql, params);
  return rows[0] ?? null;
}

/** Execute a mutation (INSERT, UPDATE, DELETE) and return result rows. */
export async function execute(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
  return queryAll(sql, params);
}

/** Initialize the database schema from schema.sql. */
export async function initDb(): Promise<void> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const schemaPath = path.resolve(import.meta.dirname, "../db/schema.sql");
  const schema = await fs.readFile(schemaPath, "utf-8");

  const stmts: string[] = [];
  let current = "";
  for (const line of schema.split("\n")) {
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

  // Send in batches of 5
  for (let i = 0; i < stmts.length; i += 5) {
    const batch = stmts.slice(i, i + 5);
    const requests = batch.map((s) => ({ type: "execute" as const, stmt: { sql: s + ";" } }));
    const data = await fetch(API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${DB_AUTH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ requests }),
    });
    const result = (await data.json()) as { results?: Array<{ type: string; error?: { message: string } }> };
    for (const r of result.results ?? []) {
      if (r.type === "error" && !r.error?.message?.includes("already exists")) {
        console.warn("initDb:", r.error?.message);
      }
    }
  }
}

/** Generate a UUID v4. */
export function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Get the current timestamp as ISO8601 string. */
export function now(): string {
  return new Date().toISOString();
}