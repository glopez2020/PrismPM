import { Database } from "@tursodatabase/sync";
import { readFileSync } from "fs";
import path from "path";

const schema = readFileSync(path.join(process.cwd(), "src", "db", "schema.sql"), "utf-8");
const db = new Database({ path: path.join(process.cwd(), "prism.db") });

const statements = schema.split(";").map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith("--"));

let ok = 0, err = 0;
for (const stmt of statements) {
  try {
    const s = await db.prepare(stmt + ";");
    s.run();
    ok++;
  } catch (e) {
    const msg = e.message || "";
    if (msg.includes("already exists") || msg.includes("duplicate")) {
      ok++;
    } else {
      console.log("ERR:", stmt.substring(0, 60), "-", msg.substring(0, 80));
      err++;
    }
  }
}
console.log(`OK: ${ok}, ERR: ${err}`);
