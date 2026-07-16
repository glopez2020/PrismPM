const API = "http://localhost:3000";
const post = (url, body) => fetch(API+url, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(r=>r.json());

const ids = ["db2eeb35-5ca3-463f-9a54-86579da58f7d","a267819c-8cb0-4fd8-b52e-eb7742d0531d","b286c626-0da6-4077-b185-b5fdc0c8ca43","ac7e8b6d-effd-4890-a475-3213c9ce3665","6c82b5a1-7516-4218-a9dc-72c6bb25f629"];

const milestones = [
  [{t:"Site Prep & Survey",s:"2026-01-05",e:"2026-02-15",p:100,o:1},{t:"Foundation & Piers",s:"2026-02-15",e:"2026-04-30",p:100,o:2},{t:"Substructure",s:"2026-04-01",e:"2026-06-15",p:100,o:3},{t:"Deck Formwork & Pouring",s:"2026-06-01",e:"2026-08-30",p:75,o:4},{t:"Steel Girder Installation",s:"2026-08-15",e:"2026-10-01",p:20,o:5},{t:"Roadway Surfacing",s:"2026-09-15",e:"2026-11-15",p:0,o:6},{t:"Walkway & Railings",s:"2026-10-01",e:"2026-12-15",p:0,o:7},{t:"Load Testing",s:"2026-12-01",e:"2027-01-30",p:0,o:8},{t:"Finishing",s:"2027-01-15",e:"2027-03-15",p:0,o:9},{t:"Commissioning",s:"2027-03-01",e:"2027-05-30",p:0,o:10}],
  [{t:"Demolition & Site Prep",s:"2026-02-10",e:"2026-03-30",p:100,o:1},{t:"Excavation & Shoring",s:"2026-03-15",e:"2026-05-15",p:100,o:2},{t:"Foundation & Mat Slab",s:"2026-05-01",e:"2026-07-15",p:60,o:3},{t:"Steel Frame",s:"2026-07-01",e:"2026-10-30",p:10,o:4},{t:"Floor Slab & Core",s:"2026-08-15",e:"2026-12-30",p:0,o:5},{t:"Curtain Wall",s:"2026-11-01",e:"2027-03-30",p:0,o:6},{t:"MEP Rough-In",s:"2026-12-15",e:"2027-05-30",p:0,o:7},{t:"Interior Fit-Out",s:"2027-04-01",e:"2027-09-30",p:0,o:8},{t:"Finishing",s:"2027-09-01",e:"2027-12-15",p:0,o:9}],
  [{t:"Foundations & Piling",s:"2025-10-01",e:"2025-12-20",p:100,o:1},{t:"Underground Parking",s:"2025-12-01",e:"2026-03-15",p:100,o:2},{t:"Frame Levels 1-3",s:"2026-03-01",e:"2026-05-30",p:100,o:3},{t:"Frame Levels 4-6",s:"2026-05-15",e:"2026-07-30",p:100,o:4},{t:"Envelope & Glazing",s:"2026-06-15",e:"2026-08-30",p:85,o:5},{t:"MEP Installation",s:"2026-07-01",e:"2026-09-30",p:60,o:6},{t:"Interior Finishes",s:"2026-08-15",e:"2026-10-15",p:40,o:7},{t:"Landscaping",s:"2026-09-01",e:"2026-10-15",p:25,o:8}],
  [{t:"Survey & Geotechnical",s:"2026-03-01",e:"2026-04-15",p:100,o:1},{t:"Earthworks & Grading",s:"2026-04-01",e:"2026-06-30",p:80,o:2},{t:"Utility Installation",s:"2026-05-15",e:"2026-08-15",p:30,o:3},{t:"Rail Spur",s:"2026-07-01",e:"2026-09-30",p:0,o:4},{t:"Warehouse A",s:"2026-08-01",e:"2026-11-30",p:0,o:5},{t:"Warehouse B",s:"2026-09-01",e:"2026-12-30",p:0,o:6},{t:"Warehouse C",s:"2026-10-01",e:"2027-01-15",p:0,o:7},{t:"Truck Depot",s:"2026-12-01",e:"2027-02-28",p:0,o:8},{t:"Paving & Finishing",s:"2027-01-15",e:"2027-03-31",p:0,o:9}],
  [{t:"Demolition",s:"2026-02-01",e:"2026-03-15",p:100,o:1},{t:"Structural Reinforcement",s:"2026-03-01",e:"2026-05-15",p:100,o:2},{t:"Frame Floor 4 (Surgical)",s:"2026-05-01",e:"2026-07-15",p:60,o:3},{t:"Frame Floor 5 (ICU)",s:"2026-07-01",e:"2026-09-01",p:10,o:4},{t:"Frame Floor 6 (Patient)",s:"2026-08-15",e:"2026-10-15",p:0,o:5},{t:"MEP Rough-In",s:"2026-09-01",e:"2026-12-30",p:0,o:6},{t:"Fit-Out Surgical",s:"2026-11-15",e:"2027-01-30",p:0,o:7},{t:"Fit-Out ICU & Patient",s:"2026-12-15",e:"2027-02-15",p:0,o:8},{t:"Medical Equipment",s:"2027-01-15",e:"2027-02-28",p:0,o:9}]
];

const names = ["Riverbridge","Acme Tower","Harbor View","Site 7","North Wing"];

const statuses = ["active","active","active","active","active"];

const budgets = [
  [{c:"labour",d:"Site crew & engineering labor",a:1350000,s:850000,cm:150000},{c:"materials",d:"Steel, concrete, rebar",a:1200000,s:780000,cm:180000},{c:"equipment",d:"Crane, excavator rental",a:500000,s:340000,cm:50000},{c:"other",d:"Subcontractors",a:600000,s:420000,cm:80000},{c:"permits",d:"Permits & inspections",a:200000,s:150000,cm:20000},{c:"other",d:"Contingency",a:650000,s:260000,cm:40000}],
  [{c:"labour",d:"Construction labor",a:4200000,s:950000,cm:350000},{c:"materials",d:"Steel, concrete, glass",a:3800000,s:720000,cm:450000},{c:"equipment",d:"Tower crane, hoists",a:1500000,s:380000,cm:100000},{c:"other",d:"Subcontractors",a:3200000,s:520000,cm:200000},{c:"permits",d:"Building permits",a:800000,s:180000,cm:0},{c:"other",d:"Contingency 10%",a:1500000,s:150000,cm:0}],
  [{c:"labour",d:"Construction labor",a:3600000,s:3100000,cm:300000},{c:"materials",d:"Concrete, steel",a:2800000,s:2500000,cm:200000},{c:"equipment",d:"Crane, hoists",a:900000,s:850000,cm:50000},{c:"other",d:"Subcontractors",a:2400000,s:2100000,cm:200000},{c:"permits",d:"Permits & fees",a:500000,s:480000,cm:0},{c:"other",d:"Contingency",a:1800000,s:1900000,cm:100000}],
  [{c:"labour",d:"Site crew & grading",a:2100000,s:280000,cm:200000},{c:"materials",d:"Steel, concrete",a:1800000,s:150000,cm:150000},{c:"equipment",d:"Excavators",a:1100000,s:120000,cm:100000},{c:"other",d:"Subcontractors",a:2000000,s:160000,cm:100000},{c:"permits",d:"Environmental permits",a:500000,s:50000,cm:50000},{c:"other",d:"Contingency",a:1000000,s:50000,cm:50000}],
  [{c:"labour",d:"Construction labor",a:2200000,s:350000,cm:150000},{c:"materials",d:"Steel, concrete",a:2100000,s:280000,cm:100000},{c:"equipment",d:"Crane, hoists",a:800000,s:120000,cm:30000},{c:"other",d:"Subcontractors MEP",a:1400000,s:150000,cm:20000},{c:"permits",d:"Hospital permits",a:400000,s:50000,cm:0},{c:"other",d:"Contingency",a:600000,s:50000,cm:0}]
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // Add milestones
  for (let i=0;i<ids.length;i++) {
    let n=0;
    for (const ms of milestones[i]) {
      try {
        const r = await post(`/api/projects/${ids[i]}/schedule`,{title:ms.t,planned_start:ms.s,planned_end:ms.e,progress_pct:ms.p,sort_order:ms.o});
        if (r.milestone) n++;
      } catch(e) {}
      await sleep(20);
    }
    console.log(`✓ ${names[i]} — ${n} milestones`);
  }

  // Add budgets
  for (let i=0;i<ids.length;i++) {
    let n=0;
    for (const line of budgets[i]) {
      try {
        const r = await post(`/api/projects/${ids[i]}/budget`,{category:line.c,description:line.d,allocated:line.a,spent:line.s,committed:line.cm});
        if (r.budgetLine) n++;
      } catch(e) {}
      await sleep(20);
    }
    console.log(`✓ ${names[i]} — ${n} budget lines`);
  }
  
  // Try to update statuses via Turso pipeline
  const turl = (process.env.TURSO_DATABASE_URL || "").replace(/^libsql:/,"https:") + "/v2/pipeline";
  const tok = process.env.TURSO_AUTH_TOKEN || "";
  
  const budgetTotals = [
    {total:4500000,spent:2800000},
    {total:15000000,spent:2900000},
    {total:12000000,spent:10500000},
    {total:8500000,spent:810000},
    {total:7500000,spent:1000000}
  ];
  
  for (let i=0;i<ids.length;i++) {
    const bt = budgetTotals[i];
    try {
      const sql = `UPDATE projects SET status='${statuses[i]}', budget_total=${bt.total}, budget_spent=${bt.spent} WHERE id='${ids[i]}'`;
      const r = await fetch(turl, {
        method:"POST",
        headers: {Authorization:`Bearer ${tok}`, "Content-Type":"application/json"},
        body: JSON.stringify({requests:[{type:"execute",stmt:{sql}}]})
      });
      const data = await r.json();
      console.log(`✓ ${names[i]} status update:`, data.results?.[0]?.type || "unknown");
    } catch(e) {
      console.log(`- ${names[i]} status: API-only (no direct DB)`);
    }
  }
}

main().catch(e=>console.error(e));