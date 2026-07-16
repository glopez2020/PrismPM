import { readFileSync } from "fs";
import { resolve } from "path";

const schema = readFileSync(resolve(import.meta.dirname, "schema.sql"), "utf-8");
let current = "";
let inSQ = false;
let parens = 0;
const stmts: string[] = [];

for (let i = 0; i < schema.length; i++) {
  const c = schema[i];
  if (c === "'" && (i === 0 || schema[i - 1] !== "\\")) inSQ = !inSQ;
  if (!inSQ) {
    if (c === "(") parens++;
    if (c === ")") parens--;
  }
  if (c === ";" && !inSQ && parens === 0) {
    const t = current.trim();
    if (t && !t.startsWith("--")) stmts.push(t);
    current = "";
  } else {
    current += c;
  }
}

const t = current.trim();
if (t && !t.startsWith("--")) stmts.push(t);

console.log("Count:", stmts.length);
stmts.forEach((s, i) => {
  console.log(`\n[${i}] ${s.slice(0, 100)}`);
  const upper = s.toUpperCase();
  if (upper.startsWith("CREATE TABLE")) {
    const name = s.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1] ?? "?";
    console.log(`  → TABLE: ${name}`);
  } else if (upper.startsWith("CREATE INDEX")) {
    const name = s.match(/CREATE INDEX IF NOT EXISTS (\w+)/i)?.[1] ?? "?";
    console.log(`  → INDEX: ${name}`);
  } else if (upper.includes("PRAGMA")) {
    console.log(`  → PRAGMA`);
  } else {
    console.log(`  → OTHER`);
  }
});