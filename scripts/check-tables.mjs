import { Database } from "@tursodatabase/sync";
const db = new Database({ path: "prism.db" });
const stmt = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
const rows = stmt.all();
for (const r of rows) console.log(r.name);
