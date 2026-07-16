import { readFileSync } from 'fs';
const schema = readFileSync('src/db/schema.sql', 'utf-8');
const cleaned = schema.replace(/ DEFAULT\s*\(datetime\(['"]now['"]\)\)/gi, '');
const stmts = cleaned.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
stmts.forEach((s, i) => {
  console.log(`${i}: [${s.slice(0, 60)}...] upperIncludesCreateTable=${s.toUpperCase().includes('CREATE TABLE')}`);
});