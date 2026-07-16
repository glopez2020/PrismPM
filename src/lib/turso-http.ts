/**
 * Prism PM Database Module
 * Uses @tursodatabase/sync for local SQLite storage.
 * Database file: prism.db in the project root.
 */
import { Database } from "@tursodatabase/sync";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "..", "prism.db");

/** Open a new database connection. */
async function openDb(): Promise<Database> {
  const db = new Database({ path: DB_PATH });
  await db.connect();
  return db;
}

/** Execute a SQL query and return all rows as objects. */
export async function queryAll(sql: string, params: any[] = []): Promise<any[]> {
  const db = await openDb();
  try {
    const stmt = await db.prepare(sql);
    const rows = await stmt.all(...params);
    return Array.isArray(rows) ? rows : [];
  } finally {
    db.close();
  }
}

/** Execute a single-row query and return the first row or null. */
export async function queryOne(sql: string, params: any[] = []): Promise<any | null> {
  const rows = await queryAll(sql, params);
  return rows[0] ?? null;
}

/** Execute a mutation (INSERT, UPDATE, DELETE). */
export async function execute(sql: string, params: any[] = []): Promise<void> {
  const db = await openDb();
  try {
    const stmt = await db.prepare(sql);
    await stmt.run(...params);
  } finally {
    db.close();
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

/** Initialize the database schema from schema.sql. */
export async function initDb(): Promise<void> {
  const fs = await import("node:fs/promises");
  const schemaPath = path.resolve(__dirname, "../db/schema.sql");
  let schema = await fs.readFile(schemaPath, "utf-8");
  // Remove non-constant defaults like DEFAULT (datetime('now')) which
  // @tursodatabase/sync doesn't support. Replace with empty string default.
  schema = schema.replace(/ DEFAULT\s*\(datetime\(['"]now['"]\)\)/gi, " DEFAULT ''");
  // Remove all SQL comments (lines starting with --) before splitting
  schema = schema.replace(/^--.*$/gm, "");
  // Split by semicolons and clean
  const stmts = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  // Use a fresh Database per statement via prepare/run (avoid exec connection-close bug)
  for (const stmt of stmts) {
    if (stmt.toUpperCase().includes("CREATE TABLE")) {
      try {
        const db = new Database({ path: DB_PATH });
        db.connect();
        const p = db.prepare(stmt + ";");
        p.run();
        db.close();
      } catch (e: any) {
        if (!(e as any).message?.includes("already exists")) {
          console.warn("initDb table:", (e as any).message?.slice(0, 100));
        }
      }
    }
  }
  // Second pass: indexes and other non-table statements
  for (const stmt of stmts) {
    if (!stmt.toUpperCase().includes("CREATE TABLE")) {
      try {
        const db = new Database({ path: DB_PATH });
        db.connect();
        const p = db.prepare(stmt + ";");
        p.run();
        db.close();
      } catch (e: any) {
        // Non-table statements may fail silently
        console.warn("initDb other:", stmt.slice(0, 40), (e as any).message?.slice(0, 80));
      }
    }
  }
}