#!/usr/bin/env node
/**
 * Prism PM — Demo Seed Data Script
 * 
 * Uses the running API endpoints on localhost:3000.
 * For tables without dedicated endpoints, adds API routes inline.
 */

const API = "http://localhost:3000";

async function api(url, opts = {}) {
  const res = await fetch(`${API}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function get(url) { return api(url, { method: "GET" }); }
async function post(url, body) { return api(url, { method: "POST", body: JSON.stringify(body) }); }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function randomUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

async function main() {
  console.log("🌱 Prism PM — Demo Seed Data\n");

  // Initialize DB schema
  console.log("📦 Initializing database...");
  const initResult = await post("/api/init", {});
  console.log("   DB:", initResult?.message || "OK");

  // Delete all existing projects to avoid duplicates on re-seed
  const existing = await get("/api/projects");
  const oldProjects = existing.projects || [];
  for (const p of oldProjects) {
    await api(`/api/projects/${p.id}`, { method: "DELETE" });
  }
  console.log(`   Cleared ${oldProjects.length} existing projects`);

  // Step 1: Create 5 realistic projects
  const PROJECTS = [
    { name: "Riverbridge Crossing", description: "Major bridge reconstruction over the Merrimack River. 4-lane replacement with pedestrian walkway and cycle path. Completion expected Q2 2027.", start_date: "2026-01-05", end_date: "2027-05-30" },
    { name: "Acme Tower", description: "New 20-story commercial office tower in downtown financial district. 300,000 sq ft of premium office space with ground-floor retail.", start_date: "2026-02-10", end_date: "2027-12-15" },
    { name: "Harbor View Residences", description: "Luxury waterfront residential development with 48 units. 6-story building with underground parking, rooftop gardens, and marina access.", start_date: "2025-10-01", end_date: "2026-10-15" },
    { name: "Site 7 — Industrial Park", description: "Greenfield industrial park development on 85 acres. Includes 3 warehouse units, truck depot, rail spur, and utility infrastructure.", start_date: "2026-03-01", end_date: "2027-03-31" },
    { name: "North Wing Expansion", description: "Hospital expansion adding 3 floors (surgical wing, ICU, patient rooms) to existing St. Mary's Medical Center North Wing.", start_date: "2026-02-01", end_date: "2027-02-28" },
  ];

  console.log("\n📋 Creating projects...");
  const ids = [];
  for (const p of PROJECTS) {
    const result = await post("/api/projects", { organization_id: "org-1", ...p });
    if (result.project) {
      ids.push(result.project.id);
      console.log(`   ✓ ${p.name}`);
    } else {
      console.error(`   ✗ ${p.name}: ${JSON.stringify(result).slice(0,150)}`);
    }
  }

  // Step 2: Add milestones
  console.log("\n📅 Adding schedule milestones...");
  const allMilestones = [
    [ // Riverbridge
      { title: "Site Preparation & Survey", planned_start: "2026-01-05", planned_end: "2026-02-15", progress_pct: 100, sort_order: 1 },
      { title: "Foundation & Pier Construction", planned_start: "2026-02-15", planned_end: "2026-04-30", progress_pct: 100, sort_order: 2 },
      { title: "Substructure & Abutments", planned_start: "2026-04-01", planned_end: "2026-06-15", progress_pct: 100, sort_order: 3 },
      { title: "Deck Formwork & Pouring", planned_start: "2026-06-01", planned_end: "2026-08-30", progress_pct: 75, sort_order: 4 },
      { title: "Steel Girder Installation", planned_start: "2026-08-15", planned_end: "2026-10-01", progress_pct: 20, sort_order: 5 },
      { title: "Roadway Surfacing", planned_start: "2026-09-15", planned_end: "2026-11-15", progress_pct: 0, sort_order: 6 },
      { title: "Pedestrian Walkway & Railings", planned_start: "2026-10-01", planned_end: "2026-12-15", progress_pct: 0, sort_order: 7 },
      { title: "Load Testing & Inspection", planned_start: "2026-12-01", planned_end: "2027-01-30", progress_pct: 0, sort_order: 8 },
      { title: "Finishing & Landscaping", planned_start: "2027-01-15", planned_end: "2027-03-15", progress_pct: 0, sort_order: 9 },
      { title: "Final Commissioning", planned_start: "2027-03-01", planned_end: "2027-05-30", progress_pct: 0, sort_order: 10 },
    ],
    [ // Acme Tower
      { title: "Demolition & Site Prep", planned_start: "2026-02-10", planned_end: "2026-03-30", progress_pct: 100, sort_order: 1 },
      { title: "Deep Excavation & Shoring", planned_start: "2026-03-15", planned_end: "2026-05-15", progress_pct: 100, sort_order: 2 },
      { title: "Foundation & Mat Slab", planned_start: "2026-05-01", planned_end: "2026-07-15", progress_pct: 60, sort_order: 3 },
      { title: "Structural Steel Frame", planned_start: "2026-07-01", planned_end: "2026-10-30", progress_pct: 10, sort_order: 4 },
      { title: "Floor Slab & Core Construction", planned_start: "2026-08-15", planned_end: "2026-12-30", progress_pct: 0, sort_order: 5 },
      { title: "Building Envelope & Curtain Wall", planned_start: "2026-11-01", planned_end: "2027-03-30", progress_pct: 0, sort_order: 6 },
      { title: "MEP Rough-In", planned_start: "2026-12-15", planned_end: "2027-05-30", progress_pct: 0, sort_order: 7 },
      { title: "Interior Fit-Out", planned_start: "2027-04-01", planned_end: "2027-09-30", progress_pct: 0, sort_order: 8 },
      { title: "Finishing & Commissioning", planned_start: "2027-09-01", planned_end: "2027-12-15", progress_pct: 0, sort_order: 9 },
    ],
    [ // Harbor View
      { title: "Foundations & Piling", planned_start: "2025-10-01", planned_end: "2025-12-20", progress_pct: 100, sort_order: 1 },
      { title: "Underground Parking Structure", planned_start: "2025-12-01", planned_end: "2026-03-15", progress_pct: 100, sort_order: 2 },
      { title: "Structural Frame — Levels 1–3", planned_start: "2026-03-01", planned_end: "2026-05-30", progress_pct: 100, sort_order: 3 },
      { title: "Structural Frame — Levels 4–6", planned_start: "2026-05-15", planned_end: "2026-07-30", progress_pct: 100, sort_order: 4 },
      { title: "Building Envelope & Glazing", planned_start: "2026-06-15", planned_end: "2026-08-30", progress_pct: 85, sort_order: 5 },
      { title: "MEP Installation", planned_start: "2026-07-01", planned_end: "2026-09-30", progress_pct: 60, sort_order: 6 },
      { title: "Interior Finishes", planned_start: "2026-08-15", planned_end: "2026-10-15", progress_pct: 40, sort_order: 7 },
      { title: "Landscaping & Marina Works", planned_start: "2026-09-01", planned_end: "2026-10-15", progress_pct: 25, sort_order: 8 },
    ],
    [ // Site 7
      { title: "Land Survey & Geotechnical", planned_start: "2026-03-01", planned_end: "2026-04-15", progress_pct: 100, sort_order: 1 },
      { title: "Earthworks & Site Grading", planned_start: "2026-04-01", planned_end: "2026-06-30", progress_pct: 80, sort_order: 2 },
      { title: "Utility Installation (Water/Sewer/Power)", planned_start: "2026-05-15", planned_end: "2026-08-15", progress_pct: 30, sort_order: 3 },
      { title: "Rail Spur Construction", planned_start: "2026-07-01", planned_end: "2026-09-30", progress_pct: 0, sort_order: 4 },
      { title: "Warehouse Unit A — Shell", planned_start: "2026-08-01", planned_end: "2026-11-30", progress_pct: 0, sort_order: 5 },
      { title: "Warehouse Unit B — Shell", planned_start: "2026-09-01", planned_end: "2026-12-30", progress_pct: 0, sort_order: 6 },
      { title: "Warehouse Unit C — Shell", planned_start: "2026-10-01", planned_end: "2027-01-15", progress_pct: 0, sort_order: 7 },
      { title: "Truck Depot & Loading Bays", planned_start: "2026-12-01", planned_end: "2027-02-28", progress_pct: 0, sort_order: 8 },
      { title: "Paving & Site Finishing", planned_start: "2027-01-15", planned_end: "2027-03-31", progress_pct: 0, sort_order: 9 },
    ],
    [ // North Wing
      { title: "Demolition & Abatement", planned_start: "2026-02-01", planned_end: "2026-03-15", progress_pct: 100, sort_order: 1 },
      { title: "Structural Reinforcement", planned_start: "2026-03-01", planned_end: "2026-05-15", progress_pct: 100, sort_order: 2 },
      { title: "Steel Frame — Floor 4 (Surgical)", planned_start: "2026-05-01", planned_end: "2026-07-15", progress_pct: 60, sort_order: 3 },
      { title: "Steel Frame — Floor 5 (ICU)", planned_start: "2026-07-01", planned_end: "2026-09-01", progress_pct: 10, sort_order: 4 },
      { title: "Steel Frame — Floor 6 (Patient Rooms)", planned_start: "2026-08-15", planned_end: "2026-10-15", progress_pct: 0, sort_order: 5 },
      { title: "MEP Rough-In (All Floors)", planned_start: "2026-09-01", planned_end: "2026-12-30", progress_pct: 0, sort_order: 6 },
      { title: "Interior Fit-Out Surgical Floor", planned_start: "2026-11-15", planned_end: "2027-01-30", progress_pct: 0, sort_order: 7 },
      { title: "Interior Fit-Out ICU & Patient Floors", planned_start: "2026-12-15", planned_end: "2027-02-15", progress_pct: 0, sort_order: 8 },
      { title: "Medical Equipment Installation", planned_start: "2027-01-15", planned_end: "2027-02-28", progress_pct: 0, sort_order: 9 },
    ],
  ];

  for (let i = 0; i < ids.length; i++) {
    const milestones = allMilestones[i];
    let count = 0;
    for (const ms of milestones) {
      const result = await post(`/api/projects/${ids[i]}/schedule`, ms);
      if (result.milestone) count++;
      await sleep(30);
    }
    console.log(`   ✓ ${PROJECTS[i].name} — ${count}/${milestones.length} milestones`);
  }

  // Step 3: Add budgets
  console.log("\n💰 Adding budget line items...");
  const allBudgets = [
    [ { category: "labour", description: "Site crew & engineering labor", allocated: 1350000, spent: 850000, committed: 150000 }, { category: "materials", description: "Steel, concrete, rebar, asphalt", allocated: 1200000, spent: 780000, committed: 180000 }, { category: "equipment", description: "Crane, pile driver, excavator rental", allocated: 500000, spent: 340000, committed: 50000 }, { category: "other", description: "Subcontractors — piling, electrical", allocated: 600000, spent: 420000, committed: 80000 }, { category: "permits", description: "Environmental permits, inspections", allocated: 200000, spent: 150000, committed: 20000 }, { category: "other", description: "Contingency fund", allocated: 650000, spent: 260000, committed: 40000 } ],
    [ { category: "labour", description: "Construction labor & supervision", allocated: 4200000, spent: 950000, committed: 350000 }, { category: "materials", description: "Steel, concrete, glass curtain wall", allocated: 3800000, spent: 720000, committed: 450000 }, { category: "equipment", description: "Tower crane, hoists, concrete pumps", allocated: 1500000, spent: 380000, committed: 100000 }, { category: "other", description: "Subcontractors — MEP, elevators, facade", allocated: 3200000, spent: 520000, committed: 200000 }, { category: "permits", description: "Building permits, zoning fees, inspections", allocated: 800000, spent: 180000, committed: 0 }, { category: "other", description: "Contingency (10%)", allocated: 1500000, spent: 150000, committed: 0 } ],
    [ { category: "labour", description: "Construction labor", allocated: 3600000, spent: 3100000, committed: 300000 }, { category: "materials", description: "Concrete, steel, finishes", allocated: 2800000, spent: 2500000, committed: 200000 }, { category: "equipment", description: "Crane, hoists, scaffolding", allocated: 900000, spent: 850000, committed: 50000 }, { category: "other", description: "Subcontractors — glazing, MEP", allocated: 2400000, spent: 2100000, committed: 200000 }, { category: "permits", description: "Permits & impact fees", allocated: 500000, spent: 480000, committed: 0 }, { category: "other", description: "Contingency", allocated: 1800000, spent: 1900000, committed: 100000 } ],
    [ { category: "labour", description: "Site crew & grading labor", allocated: 2100000, spent: 280000, committed: 200000 }, { category: "materials", description: "Steel, concrete, utilities", allocated: 1800000, spent: 150000, committed: 150000 }, { category: "equipment", description: "Excavators, bulldozers, compactors", allocated: 1100000, spent: 120000, committed: 100000 }, { category: "other", description: "Subcontractors — rail, utilities", allocated: 2000000, spent: 160000, committed: 100000 }, { category: "permits", description: "Environmental & building permits", allocated: 500000, spent: 50000, committed: 50000 }, { category: "other", description: "Contingency", allocated: 1000000, spent: 50000, committed: 50000 } ],
    [ { category: "labour", description: "Construction labor", allocated: 2200000, spent: 350000, committed: 150000 }, { category: "materials", description: "Steel, concrete, medical-grade finishes", allocated: 2100000, spent: 280000, committed: 100000 }, { category: "equipment", description: "Crane, hoists, scaffolding", allocated: 800000, spent: 120000, committed: 30000 }, { category: "other", description: "Subcontractors — MEP, medical gas", allocated: 1400000, spent: 150000, committed: 20000 }, { category: "permits", description: "Hospital construction permits", allocated: 400000, spent: 50000, committed: 0 }, { category: "other", description: "Contingency", allocated: 600000, spent: 50000, committed: 0 } ],
  ];

  for (let i = 0; i < ids.length; i++) {
    const lines = allBudgets[i];
    let count = 0;
    for (const line of lines) {
      const result = await post(`/api/projects/${ids[i]}/budget`, line);
      if (result.budgetLine) count++;
      await sleep(30);
    }
    console.log(`   ✓ ${PROJECTS[i].name} — ${count}/${lines.length} budget lines`);
  }

  // Step 4: Update project metadata via the API
  console.log("\n🔄 Updating project metadata...");
  const budgets = [
    { total: 4500000, spent: 2800000, status: "active" }, // Riverbridge
    { total: 15000000, spent: 2900000, status: "active" }, // Acme
    { total: 12000000, spent: 10500000, status: "active" }, // Harbor View
    { total: 8500000, spent: 810000, status: "active" }, // Site 7
    { total: 7500000, spent: 1000000, status: "active" }, // North Wing
  ];

  async function patch(url, body) {
    return api(url, { method: "PATCH", body: JSON.stringify(body) });
  }

  for (let i = 0; i < ids.length; i++) {
    const b = budgets[i];
    try {
      const result = await patch(`/api/projects/${ids[i]}`, {
        status: b.status,
        budget_total: b.total,
        budget_spent: b.spent
      });
      // Verify the PATCH actually persisted
      const updated = result.project;
      if (updated && (updated.budget_total !== b.total || updated.budget_spent !== b.spent)) {
        console.warn(`   ⚠ ${PROJECTS[i].name}: expected total=${b.total} got ${updated.budget_total}`);
      }
      console.log(`   ✓ ${PROJECTS[i].name}: ${updated?.status || "updated"}`);
    } catch (e) {
      console.error(`   ✗ ${PROJECTS[i].name}: ${e.message}`);
    }
    await sleep(30);
  }

  // Verify
  console.log("\n🔍 Verifying...");
  const projects = await get("/api/projects");
  console.log(`   Projects: ${projects.projects?.length || 0}`);
  if (ids[0]) {
    const sched = await get(`/api/projects/${ids[0]}/schedule`);
    console.log(`   Riverbridge milestones: ${sched.milestones?.length || 0}`);
    const bgt = await get(`/api/projects/${ids[0]}/budget`);
    console.log(`   Riverbridge budget lines: ${bgt.budgetLines?.length || 0}`);
  }

  console.log("\n✨ Seed complete!");
}

main().catch(e => { console.error("❌", e); process.exit(1); });