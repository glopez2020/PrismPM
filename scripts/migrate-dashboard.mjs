import { queryAll, execute } from '../src/lib/turso-http.ts';

const cols = await queryAll("PRAGMA table_info(users)");
const hasCol = cols.some(c => c.name === 'last_dashboard_view_at');
console.log('Has last_dashboard_view_at:', hasCol);
if (!hasCol) {
  await execute("ALTER TABLE users ADD COLUMN last_dashboard_view_at TEXT DEFAULT ''");
  console.log('Column added');
}
const cols2 = await queryAll("PRAGMA table_info(users)");
cols2.forEach(c => console.log('  ', c.name, c.type));