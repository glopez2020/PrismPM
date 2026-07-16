#!/usr/bin/env bash
set -euo pipefail
cd /home/team/shared/site

# Init local DB
bun -e "
const {Database}=await import('@tursodatabase/sync');
const {readFileSync}=await import('fs');
const db=new Database({path:'prism.db'});
const schema=readFileSync('src/db/schema.sql','utf-8');
const statements=schema.split(';').map(s=>s.trim()).filter(s=>s.length>0&&!s.startsWith('--'));
for(const stmt of statements){
  try{
    const s=await db.prepare(stmt+';');
    await s.run();
  }catch(e){}
}
const verify=await db.prepare(\"SELECT count(*) as c FROM projects\");
const result=await verify.all();
console.log('DB ready, tables exist:', result.length > 0);
"

# Start server
bun run serve.ts
