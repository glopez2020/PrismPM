// Standalone API handler for Prism PM
// Wired directly into serve.ts to bypass TanStack Start API route bundling issue
import { queryAll, queryOne, execute, uuid, now } from "./lib/turso-http";

interface RouteHandler {
  GET?: (req: Request, params: Record<string, string>) => Response | Promise<Response>;
  POST?: (req: Request, params: Record<string, string>) => Response | Promise<Response>;
  PATCH?: (req: Request, params: Record<string, string>) => Response | Promise<Response>;
  DELETE?: (req: Request, params: Record<string, string>) => Response | Promise<Response>;
}

type RoutePattern = RegExp;
type RouteEntry = [RoutePattern, RouteHandler];

function pathToRegex(path: string): RegExp {
  return new RegExp(
    "^" +
    path
      .replace(/:(\w+)/g, "(?<$1>[^/]+)")
      .replace(/\$(\w+)/g, "(?<$1>[^/]+)")
      .replace(/\//g, "\\/") +
    "$"
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
}

async function initDbSchema() {
  const fs = await import("node:fs/promises");
  let schema = await fs.readFile(
    new URL("./db/schema.sql", import.meta.url),
    "utf-8"
  );
  // Strip non-constant datetime('now') defaults — @tursodatabase/sync rejects them
  schema = schema.replace(/ DEFAULT\s*\(datetime\(['"]now['"]\)\)/gi, " DEFAULT ''");
  // Discard comment-only lines
  const lines = schema.split("\n").filter((l: string) => !l.trim().startsWith("--")).join("\n");
  // Split by semicolons, clean, and re-join
  const stmts = lines.split(";").map((s: string) => s.trim()).filter((s: string) => s.length > 0);
  // Use a fresh Database per statement via prepare/run (avoid exec connection-close bug)
  const { Database } = await import("@tursodatabase/sync");
  const { fileURLToPath } = await import("url");
  const pathMod = await import("path");
  const __dirname = pathMod.dirname(fileURLToPath(import.meta.url));
  const dbPath = pathMod.join(__dirname, "..", "prism.db");
  // First pass: CREATE TABLE statements only (in order, one per connection)
  for (const stmt of stmts) {
    if (stmt.toUpperCase().startsWith("CREATE TABLE")) {
      try {
        const db = new Database({ path: dbPath });
        await db.connect();
        const p = await db.prepare(stmt + ";");
        p.run();
        console.error("Created table:", stmt.slice(0, 50));
      } catch (e: any) {
        console.error("Table error:", e?.message?.slice(0, 100));
      }
    }
  }
  // Second pass: everything else (indexes, etc.)
  for (const stmt of stmts) {
    if (!stmt.toUpperCase().startsWith("CREATE TABLE")) {
      try {
        const db = new Database({ path: dbPath });
        await db.connect();
        const p = await db.prepare(stmt + ";");
        p.run();
      } catch (e: any) {
        // Indexes and other non-table statements may fail silently if table not found
        console.error("Index/other error:", stmt.slice(0, 50), e?.message?.slice(0, 80));
      }
    }
  }
  console.error("DB schema initialization complete");
}

try {
  // Fire-and-forget schema init — errors are logged, never crash the server
  initDbSchema().catch((e: any) => console.error("Schema init unhandled:", e?.message));
} catch {}

const routes: RouteEntry[] = [
  // Health
  [
    pathToRegex("/api/health"),
    {
      GET: async () =>
        new Response(
          JSON.stringify({ status: "ok", service: "prism-pm" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        ),
    },
  ],

  // Auth - Register
  [pathToRegex("/api/auth/register"), {
    POST: async (req) => {
      try {
        const { registerUser } = await import("./lib/auth");
        const body = await req.json() as { email?: string; display_name?: string; password?: string };
        if (!body.email || !body.password) {
          return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        const result = await registerUser(body.email, body.display_name || "", body.password);
        if ("error" in result) {
          return new Response(JSON.stringify({ error: result.error }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        return new Response(
          JSON.stringify({ user: result.user, token: result.sessionId }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    },
  }],

  // Auth - Login
  [pathToRegex("/api/auth/login"), {
    POST: async (req) => {
      try {
        const { loginUser } = await import("./lib/auth");
        const body = await req.json() as { email?: string; password?: string };
        if (!body.email || !body.password) {
          return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        const result = await loginUser(body.email, body.password);
        if ("error" in result) {
          return new Response(JSON.stringify({ error: result.error }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        return new Response(
          JSON.stringify({ user: result.user, token: result.sessionId }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    },
  }],

  // Auth - Logout
  [pathToRegex("/api/auth/logout"), {
    POST: async (req) => {
      const { logoutUser } = await import("./lib/auth");
      const cookie = req.headers.get("cookie") || "";
      const sessionMatch = cookie.match(/prism_session=([^;]+)/);
      if (sessionMatch) await logoutUser(sessionMatch[1]);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  }],

  // Auth - Me
  [pathToRegex("/api/auth/me"), {
    GET: async (req) => {
      try {
        const { getUserFromSession } = await import("./lib/auth");
        const cookie = req.headers.get("cookie") || "";
        const sessionMatch = cookie.match(/prism_session=([^;]+)/);
        if (!sessionMatch) {
          return new Response(JSON.stringify({ user: null }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        const user = await getUserFromSession(sessionMatch[1]);
        return new Response(JSON.stringify({ user }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ user: null }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    },
  }],

  // ==============================
  // Dashboard API
  // ==============================

  // GET /api/dashboard/briefing — Morning Briefing
  [pathToRegex("/api/dashboard/briefing"), {
    GET: async (req) => {
      // Try to get user from session for greeting; fall back to generic
      let displayName = "Project Manager";
      try {
        const { getUserFromSession } = await import("./lib/auth");
        const cookie = req.headers.get("cookie") || "";
        const sessionMatch = cookie.match(/prism_session=([^;]+)/);
        if (sessionMatch) {
          const user = await getUserFromSession(sessionMatch[1]);
          if (user) displayName = user.display_name || "Project Manager";
        }
      } catch { /* use fallback greeting */ }

      const hour = new Date().getHours();
      const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

      // Fetch metrics
      const totalProjects = ((await queryOne("SELECT COUNT(*) as c FROM projects")) as any)?.c || 0;
      const activeRisks = ((await queryOne("SELECT COUNT(*) as c FROM risk_flags WHERE status != 'resolved'")) as any)?.c || 0;
      const pendingVerifications = ((await queryOne("SELECT COUNT(*) as c FROM supplier_communications WHERE status='draft' AND direction='outgoing'")) as any)?.c || 0;
      const unreadSupplierResponses = ((await queryOne("SELECT COUNT(*) as c FROM supplier_communications WHERE direction='incoming' AND status='unread'")) as any)?.c || 0;
      const today = new Date().toISOString().slice(0, 10);
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const milestonesDueThisWeek = ((await queryOne("SELECT COUNT(*) as c FROM schedules WHERE planned_end >= ? AND planned_end <= ?", [today, nextWeek])) as any)?.c || 0;
      const budgetsAtRisk = ((await queryOne("SELECT COUNT(*) as c FROM projects WHERE budget_total > 0 AND CAST(budget_spent AS REAL) / CAST(budget_total AS REAL) > 0.85")) as any)?.c || 0;

      // AI-generated headline status (with fallback)
      let headlineStatus = "";
      const { callAi } = await import("./lib/ai");
      try {
        headlineStatus = await callAi(
          "You are a concise project briefing assistant. Generate ONE sentence summarizing the current state of projects for a project manager. Be calm, professional, data-driven.",
          `Metrics: ${totalProjects} projects, ${activeRisks} active risks, ${pendingVerifications} pending verifications, ${unreadSupplierResponses} unread supplier responses, ${milestonesDueThisWeek} milestones due this week, ${budgetsAtRisk} budgets at risk.`
        );
      } catch {
        headlineStatus = `${activeRisks > 0 ? activeRisks + " risk" + (activeRisks > 1 ? "s" : "") + " flagged. " : "No active risks. "}${pendingVerifications > 0 ? pendingVerifications + " action" + (pendingVerifications > 1 ? "s" : "") + " need review." : "All clear on pending items."}`;
      }

      return new Response(JSON.stringify({
        greeting: `${timeGreeting}, ${displayName}`,
        date: new Date().toISOString().slice(0, 10),
        headlineStatus,
        metrics: { totalProjects, activeRisks, pendingVerifications, unreadSupplierResponses, milestonesDueThisWeek, budgetsAtRisk }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  }],

  // GET /api/dashboard/changes — What Changed (delta feed)
  [pathToRegex("/api/dashboard/changes"), {
    GET: async (req) => {
      let userId = "";
      let lastViewed = "1970-01-01T00:00:00Z";
      try {
        const { getUserFromSession } = await import("./lib/auth");
        const cookie = req.headers.get("cookie") || "";
        const sessionMatch = cookie.match(/prism_session=([^;]+)/);
        if (sessionMatch) {
          const user = await getUserFromSession(sessionMatch[1]);
          if (user) {
            userId = user.id;
            lastViewed = (user as any).last_dashboard_view_at || "1970-01-01T00:00:00Z";
          }
        }
      } catch { /* use defaults */ }

      const changes: any[] = [];

      // Recently updated projects
      const updatedProjects = await queryAll("SELECT id, name, updated_at FROM projects WHERE updated_at > ? ORDER BY updated_at DESC LIMIT 10", [lastViewed]);
      for (const p of updatedProjects) {
        changes.push({
          id: uuid(), timestamp: p.updated_at, relativeTime: timeAgo(p.updated_at),
          projectId: p.id, projectName: p.name, type: "schedule_change",
          title: "Project updated", description: `"${p.name}" was recently modified.`,
          severity: "neutral", actionRequired: false,
        });
      }

      // New risk flags
      const newRisks = await queryAll("SELECT r.*, p.name as project_name FROM risk_flags r JOIN projects p ON r.project_id = p.id WHERE r.created_at > ? ORDER BY r.created_at DESC LIMIT 10", [lastViewed]);
      for (const r of newRisks) {
        changes.push({
          id: uuid(), timestamp: r.created_at, relativeTime: timeAgo(r.created_at),
          projectId: r.project_id, projectName: r.project_name, type: "risk_raised",
          title: r.title || "Risk flagged", description: r.description || "",
          severity: r.severity === "critical" || r.severity === "high" ? "critical" : "attention",
          actionRequired: r.severity === "critical" || r.severity === "high",
        });
      }

      // New supplier communications
      const newComms = await queryAll("SELECT sc.*, p.name as project_name FROM supplier_communications sc JOIN projects p ON sc.project_id = p.id WHERE sc.created_at > ? ORDER BY sc.created_at DESC LIMIT 10", [lastViewed]);
      for (const c of newComms) {
        changes.push({
          id: uuid(), timestamp: c.created_at, relativeTime: timeAgo(c.created_at),
          projectId: c.project_id, projectName: c.project_name,
          type: c.direction === "incoming" ? "supplier_response" : "ai_action",
          title: c.direction === "incoming" ? "Supplier response received" : "Communication drafted",
          description: c.subject || "", severity: "neutral",
          actionRequired: c.direction === "incoming" || c.status === "draft",
        });
      }

      // Sort by timestamp descending
      changes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Update last_dashboard_view_at
      if (userId) {
        await execute("UPDATE users SET last_dashboard_view_at=? WHERE id=?", [now(), userId]);
      }

      return new Response(JSON.stringify({ changes, viewedAt: lastViewed }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    },
  }],

  // GET /api/dashboard/attention — Priority Queue
  [pathToRegex("/api/dashboard/attention"), {
    GET: async () => {
      const items: any[] = [];
      const { callAi } = await import("./lib/ai");

      // Critical: Budget overruns >15% and milestones >7 days late
      const budgetOverruns = await queryAll(
        "SELECT p.id, p.name, p.budget_total, p.budget_spent FROM projects p WHERE p.budget_total > 0 AND CAST(p.budget_spent AS REAL) / CAST(p.budget_total AS REAL) > 1.15"
      );
      for (const p of budgetOverruns) {
        const overPct = Math.round(((p.budget_spent - p.budget_total) / p.budget_total) * 100);
        items.push({
          id: uuid(), priority: "critical", type: "budget_overrun",
          projectId: p.id, projectName: p.name,
          title: `Budget overrun — ${p.name} is ${overPct}% over`,
          description: `${p.name} has spent ${(p.budget_spent / 1000000).toFixed(1)}M against a ${(p.budget_total / 1000000).toFixed(1)}M budget. Review and adjust immediately.`,
          confidence: "high",
          options: [{ label: "Review budget", action: "navigate", target: `/projects/${p.id}/budget` }],
          createdAt: now(),
        });
      }

      // Critical: Milestones >7 days delayed
      const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const delayedMilestones = await queryAll(
        "SELECT s.*, p.name as project_name FROM schedules s JOIN projects p ON s.project_id = p.id WHERE s.status='delayed' AND s.planned_end < ?", [lastWeek]
      );
      for (const m of delayedMilestones) {
        items.push({
          id: uuid(), priority: "critical", type: "schedule_delay",
          projectId: m.project_id, projectName: m.project_name,
          title: `Schedule delay — "${m.title}" overdue in ${m.project_name}`,
          description: `"${m.title}" was due ${m.planned_end} and is still in progress. Review schedule impact.`,
          confidence: "high",
          options: [{ label: "View schedule", action: "navigate", target: `/projects/${m.project_id}/schedule` }],
          createdAt: now(),
        });
      }

      // Today: Pending verifications
      const pendingVerifs = await queryAll(
        "SELECT sc.*, p.name as project_name FROM supplier_communications sc JOIN projects p ON sc.project_id = p.id WHERE sc.status='draft' AND sc.direction='outgoing'"
      );
      for (const v of pendingVerifs) {
        items.push({
          id: uuid(), priority: "today", type: "verification_needed",
          projectId: v.project_id, projectName: v.project_name,
          title: `PM verification needed — "${v.subject || 'Draft'}"`,
          description: `A communication to a supplier is ready for your review and approval before sending.`,
          confidence: "high",
          options: [{ label: "Review", action: "navigate", target: `/projects/${v.project_id}` }],
          createdAt: v.created_at || now(),
        });
      }

      // Today: Unread supplier responses
      const unreadResponses = await queryAll(
        "SELECT sc.*, p.name as project_name FROM supplier_communications sc JOIN projects p ON sc.project_id = p.id WHERE sc.direction='incoming' AND sc.status='unread'"
      );
      for (const r of unreadResponses) {
        items.push({
          id: uuid(), priority: "today", type: "supplier_response",
          projectId: r.project_id, projectName: r.project_name,
          title: `Supplier response — ${r.subject || 'Reply received'}`,
          description: `A supplier has responded. Review their reply.`,
          confidence: "medium",
          options: [{ label: "View response", action: "navigate", target: `/projects/${r.project_id}` }],
          createdAt: r.created_at || now(),
        });
      }

      // This Week: Milestones due within 7 days
      const today2 = new Date().toISOString().slice(0, 10);
      const nextWeek2 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const upcomingMilestones = await queryAll(
        "SELECT s.*, p.name as project_name FROM schedules s JOIN projects p ON s.project_id = p.id WHERE s.planned_end >= ? AND s.planned_end <= ? AND s.status != 'completed' ORDER BY s.planned_end ASC", [today2, nextWeek2]
      );
      for (const m of upcomingMilestones) {
        items.push({
          id: uuid(), priority: "this_week", type: "milestone_due",
          projectId: m.project_id, projectName: m.project_name,
          title: `Milestone due — "${m.title}" in ${m.project_name}`,
          description: `"${m.title}" is due ${m.planned_end}. Current status: ${m.status}.`,
          confidence: "medium",
          options: [{ label: "View schedule", action: "navigate", target: `/projects/${m.project_id}/schedule` }],
          createdAt: now(),
        });
      }

      return new Response(JSON.stringify({ items }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    },
  }],

  // Projects - List & Create
  [
    pathToRegex("/api/projects"),
    {
      GET: async () => {
        try {
          await queryAll("SELECT 1 FROM projects LIMIT 1");
          const projects = await queryAll(
            "SELECT p.*, u.display_name as pm_name " +
              "FROM projects p LEFT JOIN users u ON p.pm_id = u.id " +
              "ORDER BY p.created_at DESC"
          );
          return new Response(JSON.stringify({ projects }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response(
            JSON.stringify({ projects: [], error: "DB not initialized" }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
      POST: async (req) => {
        try {
          const body = (await req.json()) as any;
          if (!body.name)
            return new Response(JSON.stringify({ error: "name required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          const id = uuid();
          const ts = now();
          await execute(
            "INSERT INTO projects (id, organization_id, name, description, status, start_date, end_date, budget_total, budget_spent, created_at, updated_at) " +
              "VALUES (?,?,?,?,'planning',?,?,?,0,?,?)",
            [
              id,
              "org-1",
              body.name,
              body.description || "",
              body.start_date || null,
              body.end_date || null,
              body.budget_total || 0,
              ts,
              ts,
            ]
          );
          const project = await queryOne(
            "SELECT * FROM projects WHERE id=?",
            [id]
          );
          return new Response(JSON.stringify({ project }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  ],

  // Project by ID
  [
    pathToRegex("/api/projects/:id"),
    {
      GET: async (_, params) => {
        const project = await queryOne(
          "SELECT p.*, u.display_name as pm_name " +
            "FROM projects p LEFT JOIN users u ON p.pm_id = u.id " +
            "WHERE p.id=?",
          [params.id]
        );
        if (!project)
          return new Response(JSON.stringify({ error: "not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        const milestones = await queryAll(
          "SELECT * FROM schedules WHERE project_id=? ORDER BY sort_order",
          [params.id]
        );
        const budget = await queryAll(
          "SELECT * FROM budget_line_items WHERE project_id=?",
          [params.id]
        );
        return new Response(
          JSON.stringify({ project, milestones, budget }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      },
      PATCH: async (req, params) => {
        const body = (await req.json()) as any;
        const updates: string[] = [];
        const values: any[] = [];
        for (const key of [
          "name",
          "description",
          "status",
          "start_date",
          "end_date",
          "budget_total",
          "budget_spent",
        ]) {
          if (body[key] !== undefined) {
            updates.push(key + "=?");
            values.push(body[key]);
          }
        }
        if (updates.length === 0)
          return new Response(JSON.stringify({ error: "no fields" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        updates.push("updated_at=?");
        values.push(now());
        values.push(params.id);
        await execute(
          "UPDATE projects SET " + updates.join(",") + " WHERE id=?",
          values
        );
        const project = await queryOne(
          "SELECT * FROM projects WHERE id=?",
          [params.id]
        );
        return new Response(JSON.stringify({ project }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
      DELETE: async (_, params) => {
        await execute("DELETE FROM projects WHERE id=?", [params.id]);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  ],

  // Schedule
  [
    pathToRegex("/api/projects/:id/schedule"),
    {
      GET: async (_, params) => {
        const items = await queryAll(
          "SELECT * FROM schedules WHERE project_id=? ORDER BY sort_order",
          [params.id]
        );
        return new Response(JSON.stringify({ milestones: items }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
      POST: async (req, params) => {
        const body = (await req.json()) as any;
        if (!body.title)
          return new Response(JSON.stringify({ error: "title required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        const id = uuid();
        await execute(
          "INSERT INTO schedules (id, project_id, title, description, planned_start, planned_end, progress_pct, status, sort_order) " +
            "VALUES (?,?,?,?,?,?,?,?,?)",
          [
            id,
            params.id,
            body.title,
            body.description || "",
            body.planned_start || null,
            body.planned_end || null,
            body.progress_pct || 0,
            body.status || "pending",
            body.sort_order || 0,
          ]
        );
        const item = await queryOne("SELECT * FROM schedules WHERE id=?", [
          id,
        ]);
        return new Response(JSON.stringify({ milestone: item }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  ],

  // Budget
  [
    pathToRegex("/api/projects/:id/budget"),
    {
      GET: async (_, params) => {
        const items = await queryAll(
          "SELECT * FROM budget_line_items WHERE project_id=?",
          [params.id]
        );
        return new Response(JSON.stringify({ budgetLines: items }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
      POST: async (req, params) => {
        const body = (await req.json()) as any;
        const id = uuid();
        await execute(
          "INSERT INTO budget_line_items (id, project_id, category, description, allocated, spent, committed) " +
            "VALUES (?,?,?,?,?,?,?)",
          [
            id,
            params.id,
            body.category || "other",
            body.description || "",
            body.allocated || 0,
            body.spent || 0,
            body.committed || 0,
          ]
        );
        const rows = (await queryAll(
          "SELECT SUM(allocated) as total, SUM(spent) as spent FROM budget_line_items WHERE project_id=?",
          [params.id]
        )) as any[];
        if (rows.length > 0) {
          await execute(
            "UPDATE projects SET budget_total=?, budget_spent=? WHERE id=?",
            [rows[0].total || 0, rows[0].spent || 0, params.id]
          );
        }
        const item = await queryOne(
          "SELECT * FROM budget_line_items WHERE id=?",
          [id]
        );
        return new Response(JSON.stringify({ budgetLine: item }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  ],

  // ==============================
  // Daily Reports — AI Ingestion
  // ==============================
  [
    pathToRegex("/api/projects/:id/reports"),
    {
      GET: async (_, params) => {
        const reports = await queryAll(
          "SELECT * FROM daily_reports WHERE project_id=? ORDER BY report_date DESC, created_at DESC",
          [params.id]
        );
        return new Response(JSON.stringify({ reports }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
      POST: async (req, params) => {
        const body = (await req.json()) as any;
        if (!body.raw_text) {
          return new Response(JSON.stringify({ error: "raw_text is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const reportId = uuid();
        const reportDate = body.report_date || now().split("T")[0];

        // Insert report as pending_parse
        await execute(
          "INSERT INTO daily_reports (id, project_id, submitted_by, raw_text, report_date, status) VALUES (?,?,?,?,?,'pending_parse')",
          [reportId, params.id, body.submitted_by || "unknown", body.raw_text, reportDate]
        );

        // Try AI parsing
        let parsedData: Record<string, any> = {};
        let aiConfidence = 0;
        let parseStatus = "parsed";
        const parseError: string[] = [];

        try {
          const { parseDailyReport } = await import("./lib/ai");
          const result = await parseDailyReport(body.raw_text);
          parsedData = result.parsedData as Record<string, any>;
          aiConfidence = result.confidence;

          // Auto-generate risk flags from parsed issues
          if (parsedData.issues && Array.isArray(parsedData.issues)) {
            for (const issue of parsedData.issues as Array<{ type: string; description: string; severity: string }>) {
              const riskType = issue.type || "other";
              const severity = ["low", "medium", "high", "critical"].includes(issue.severity?.toLowerCase())
                ? issue.severity.toLowerCase()
                : "medium";
              const flagId = uuid();
              await execute(
                "INSERT INTO risk_flags (id, project_id, type, severity, title, description, source, source_report_id, status) VALUES (?,?,?,?,?,?,'ai_detected',?,'open')",
                [
                  flagId,
                  params.id,
                  riskType,
                  severity,
                  `${severity === "high" || severity === "critical" ? "🚨 " : "⚠️ "}${issue.description?.slice(0, 80) || "Issue detected"}`,
                  issue.description || "",
                  reportId,
                ]
              );
            }
          }

          // Auto-generate supplier communication drafts from supplier_updates
          if (parsedData.supplier_updates && typeof parsedData.supplier_updates === "string" && parsedData.supplier_updates.trim()) {
            try {
              const { draftSupplierComms } = await import("./lib/ai");
              const project = await queryOne("SELECT name FROM projects WHERE id=?", [params.id]);
              const projectName = (project?.name as string) || "Project";

              // Try to find suppliers for this org
              const projectRow = await queryOne("SELECT organization_id FROM projects WHERE id=?", [params.id]);
              const orgId = (projectRow?.organization_id as string) || "org-1";
              const suppliers = await queryAll("SELECT id, name FROM suppliers WHERE organization_id=?", [orgId]);

              if (suppliers.length > 0) {
                for (const supplier of suppliers as Array<{ id: string; name: string }>) {
                  const comm = await draftSupplierComms({
                    type: "delivery_update",
                    supplierName: supplier.name,
                    projectName,
                    details: parsedData.supplier_updates,
                  });
                  const commId = uuid();
                  await execute(
                    "INSERT INTO supplier_communications (id, project_id, supplier_id, type, direction, subject, body, ai_generated, status) VALUES (?,?,?,?,'outgoing',?,?,1,'draft')",
                    [commId, params.id, supplier.id, "delivery_update", comm.subject, comm.body]
                  );
                }
              }
            } catch {}
          }

          // Update schedule milestones based on progress
          if (parsedData.progress && Array.isArray(parsedData.progress)) {
            for (const prog of parsedData.progress as Array<{ milestone: string; status: string; progress_pct: number }>) {
              // Try to match milestone by title
              const milestones = await queryAll(
                "SELECT id FROM schedules WHERE project_id=? AND title LIKE ?",
                [params.id, `%${prog.milestone || ""}%`]
              );
              if (milestones.length > 0) {
                const milestoneId = (milestones[0] as any).id;
                const schedStatus = prog.status === "completed" ? "completed"
                  : prog.status === "behind" ? "delayed"
                  : prog.status === "ahead" || prog.status === "on_track" ? "in_progress"
                  : "pending";
                await execute(
                  "UPDATE schedules SET progress_pct=?, status=? WHERE id=?",
                  [prog.progress_pct ?? 0, schedStatus, milestoneId]
                );
              }
            }
          }
        } catch (e) {
          parseStatus = "error";
          parseError.push(String(e));
        }

        // Update report with parsed data
        await execute(
          "UPDATE daily_reports SET parsed_data=?, status=?, ai_confidence=? WHERE id=?",
          [JSON.stringify(parsedData), parseStatus, aiConfidence, reportId]
        );

        const report = await queryOne("SELECT * FROM daily_reports WHERE id=?", [reportId]);
        return new Response(JSON.stringify({
          report,
          parsed: parseStatus === "parsed",
          riskFlagsGenerated: (parsedData.issues as any[])?.length || 0,
          parseError: parseError.length > 0 ? parseError[0] : null,
        }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  ],

  // ==============================
  // Risk Flags for a project
  // ==============================
  [
    pathToRegex("/api/projects/:id/risks"),
    {
      GET: async (_, params) => {
        const risks = await queryAll(
          "SELECT * FROM risk_flags WHERE project_id=? ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC",
          [params.id]
        );
        return new Response(JSON.stringify({ risks }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  ],

  // ==============================
  // Risk Analysis (AI-powered)
  // ==============================
  [
    pathToRegex("/api/projects/:id/risk-analysis"),
    {
      GET: async (_, params) => {
        const project = await queryOne("SELECT * FROM projects WHERE id=?", [params.id]);
        if (!project) {
          return new Response(JSON.stringify({ error: "Project not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
        }

        const milestones = await queryAll("SELECT title, status, progress_pct, planned_end FROM schedules WHERE project_id=?", [params.id]);
        const budgetItems = await queryAll("SELECT category, allocated, spent, committed FROM budget_line_items WHERE project_id=?", [params.id]);
        const recentReports = await queryAll("SELECT id FROM daily_reports WHERE project_id=? ORDER BY created_at DESC LIMIT 5", [params.id]);

        // Calculated risk metrics (without AI)
        const budgetTotal = (project as any).budget_total as number || 0;
        const budgetSpent = (project as any).budget_spent as number || 0;
        const budgetRemaining = budgetTotal - budgetSpent;
        const spendPct = budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0;

        // Schedule risk
        const delayedMilestones = (milestones as any[]).filter(m => m.status === "delayed");
        const atRiskMilestones = (milestones as any[]).filter(m => m.progress_pct < 50 && m.planned_end);

        const analysisResults: Record<string, any>[] = [];

        // Budget risk
        if (budgetTotal > 0 && spendPct > 80) {
          analysisResults.push({
            type: "budget",
            severity: spendPct > 90 ? "high" : "medium",
            title: spendPct > 90 ? "Budget nearly exhausted" : "Budget running low",
            description: `${spendPct.toFixed(1)}% of budget spent (${budgetSpent.toLocaleString()} of ${budgetTotal.toLocaleString()}). Remaining: ${budgetRemaining.toLocaleString()}.`,
            recommended_action: "Review remaining budget and identify areas to reduce spending or request追加 funding.",
          });
        }

        // Schedule risk
        if (delayedMilestones.length > 0) {
          analysisResults.push({
            type: "schedule",
            severity: delayedMilestones.length > 2 ? "high" : "medium",
            title: `${delayedMilestones.length} milestone(s) behind schedule`,
            description: `Milestones delayed: ${delayedMilestones.map((m: any) => m.title).join(", ")}.`,
            recommended_action: "Review critical path and consider resource reallocation to get back on track.",
          });
        }
        if (atRiskMilestones.length > 0) {
          analysisResults.push({
            type: "schedule",
            severity: "medium",
            title: `${atRiskMilestones.length} milestone(s) at risk`,
            description: `Milestones with low progress: ${atRiskMilestones.map((m: any) => m.title).join(", ")}.`,
            recommended_action: "Increase monitoring frequency for at-risk milestones.",
          });
        }

        // Try AI-powered analysis
        let aiRisks: Record<string, any>[] = [];
        try {
          const { analyzeRisks } = await import("./lib/ai");
          const aiResult = await analyzeRisks({
            projectName: (project as any).name as string,
            milestones: milestones as any[],
            budgetItems: budgetItems as any[],
            recentReportCount: recentReports.length,
          });
          aiRisks = aiResult.risks || [];
        } catch {}

        // Merge: calculated first, AI suggestions added as supplementary
        const allRisks = [...analysisResults, ...aiRisks];

        return new Response(JSON.stringify({
          projectId: params.id,
          projectName: (project as any).name,
          metrics: {
            budgetTotal,
            budgetSpent,
            budgetRemaining,
            spendPct: Math.round(spendPct * 10) / 10,
            totalMilestones: milestones.length,
            delayedMilestones: delayedMilestones.length,
            reportCount: recentReports.length,
          },
          risks: allRisks,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  ],

  // ==============================
  // All risks (aggregate)
  // ==============================
  [
    pathToRegex("/api/risks"),
    {
      GET: async () => {
        const risks = await queryAll(
          "SELECT r.*, p.name as project_name FROM risk_flags r LEFT JOIN projects p ON r.project_id = p.id ORDER BY CASE r.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, r.created_at DESC"
        );
        return new Response(JSON.stringify({ risks }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  ],

  // ==============================
  // Resolve a risk flag
  // ==============================
  [
    pathToRegex("/api/risks/:id/resolve"),
    {
      POST: async (req, params) => {
        const body = (await req.json()) as any;
        await execute(
          "UPDATE risk_flags SET status='resolved', resolved_at=?, resolved_by=? WHERE id=?",
          [now(), body.resolved_by || null, params.id]
        );
        const risk = await queryOne("SELECT * FROM risk_flags WHERE id=?", [params.id]);
        return new Response(JSON.stringify({ risk }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  ],

  // ==============================
  // Suppliers CRUD
  // ==============================
  [
    pathToRegex("/api/suppliers"),
    {
      GET: async () => {
        const suppliers = await queryAll("SELECT * FROM suppliers ORDER BY name ASC");
        return new Response(JSON.stringify({ suppliers }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
      POST: async (req) => {
        const body = (await req.json()) as any;
        if (!body.name) {
          return new Response(JSON.stringify({ error: "name is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        const id = uuid();
        await execute(
          "INSERT INTO suppliers (id, organization_id, name, contact_email, contact_phone, notes) VALUES (?,?,?,?,?,?)",
          [id, body.organization_id || "org-1", body.name, body.contact_email || "", body.contact_phone || "", body.notes || ""]
        );
        const supplier = await queryOne("SELECT * FROM suppliers WHERE id=?", [id]);
        return new Response(JSON.stringify({ supplier }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  ],

  [
    pathToRegex("/api/suppliers/:id"),
    {
      GET: async (_, params) => {
        const supplier = await queryOne("SELECT * FROM suppliers WHERE id=?", [params.id]);
        if (!supplier) {
          return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ supplier }), { status: 200, headers: { "Content-Type": "application/json" } });
      },
      PATCH: async (req, params) => {
        const body = (await req.json()) as any;
        const updates: string[] = [];
        const values: any[] = [];
        for (const key of ["name", "contact_email", "contact_phone", "notes"]) {
          if (body[key] !== undefined) {
            updates.push(`${key}=?`);
            values.push(body[key]);
          }
        }
        if (updates.length === 0) {
          return new Response(JSON.stringify({ error: "no fields to update" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        values.push(params.id);
        await execute(`UPDATE suppliers SET ${updates.join(",")} WHERE id=?`, values);
        const supplier = await queryOne("SELECT * FROM suppliers WHERE id=?", [params.id]);
        return new Response(JSON.stringify({ supplier }), { status: 200, headers: { "Content-Type": "application/json" } });
      },
      DELETE: async (_, params) => {
        await execute("DELETE FROM suppliers WHERE id=?", [params.id]);
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      },
    },
  ],

  // ==============================
  // Supplier Communications
  // ==============================
  [
    pathToRegex("/api/projects/:id/supplier-comms"),
    {
      GET: async (_, params) => {
        const comms = await queryAll(
          "SELECT sc.*, s.name as supplier_name FROM supplier_communications sc LEFT JOIN suppliers s ON sc.supplier_id = s.id WHERE sc.project_id=? ORDER BY sc.created_at DESC",
          [params.id]
        );
        return new Response(JSON.stringify({ communications: comms }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
      POST: async (req, params) => {
        const body = (await req.json()) as any;
        if (!body.supplier_id || !body.details) {
          return new Response(JSON.stringify({ error: "supplier_id and details are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const supplier = await queryOne("SELECT name FROM suppliers WHERE id=?", [body.supplier_id]);
        if (!supplier) {
          return new Response(JSON.stringify({ error: "Supplier not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
        }
        const project = await queryOne("SELECT name FROM projects WHERE id=?", [params.id]);
        const projectName = (project?.name as string) || "Project";

        let subject = "";
        let bodyText = "";
        let aiGenerated = 0;

        try {
          const { draftSupplierComms } = await import("./lib/ai");
          const comm = await draftSupplierComms({
            type: body.type || "general",
            supplierName: supplier.name as string,
            projectName,
            details: body.details,
          });
          subject = comm.subject;
          bodyText = comm.body;
          aiGenerated = 1;
        } catch {
          subject = `Update: ${projectName}`;
          bodyText = body.details;
        }

        const commId = uuid();
        await execute(
          "INSERT INTO supplier_communications (id, project_id, supplier_id, type, direction, subject, body, ai_generated, status) VALUES (?,?,?,?,'outgoing',?,?,?,'draft')",
          [commId, params.id, body.supplier_id, body.type || "general", subject, bodyText, aiGenerated]
        );

        // Create PM approval request
        const approvalId = uuid();
        await execute(
          "INSERT INTO pm_approvals (id, project_id, type, proposal_data, options, status) VALUES (?,?,'supplier_comms',?,?,'pending')",
          [
            approvalId,
            params.id,
            JSON.stringify({ communicationId: commId, subject, body: bodyText, supplierId: body.supplier_id }),
            JSON.stringify([
              { label: "Send as-is", action: "send" },
              { label: "Edit before sending", action: "edit" },
              { label: "Discard", action: "discard" },
            ]),
          ]
        );

        const comm = await queryOne("SELECT sc.*, s.name as supplier_name FROM supplier_communications sc LEFT JOIN suppliers s ON sc.supplier_id = s.id WHERE sc.id=?", [commId]);
        return new Response(JSON.stringify({ communication: comm, approvalId }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  ],

  // Update supplier comm status (e.g., mark as sent)
  [
    pathToRegex("/api/supplier-comms/:id"),
    {
      PATCH: async (req, params) => {
        const body = (await req.json()) as any;
        if (body.status) {
          await execute("UPDATE supplier_communications SET status=? WHERE id=?", [body.status, params.id]);
        }
        const comm = await queryOne("SELECT sc.*, s.name as supplier_name FROM supplier_communications sc LEFT JOIN suppliers s ON sc.supplier_id = s.id WHERE sc.id=?", [params.id]);
        return new Response(JSON.stringify({ communication: comm }), { status: 200, headers: { "Content-Type": "application/json" } });
      },
    },
  ],

  // ==============================
  // PM Approvals (Verification Loop)
  // ==============================
  [
    pathToRegex("/api/approvals"),
    {
      GET: async () => {
        const approvals = await queryAll(
          "SELECT a.*, p.name as project_name FROM pm_approvals a LEFT JOIN projects p ON a.project_id = p.id ORDER BY CASE a.status WHEN 'pending' THEN 0 ELSE 1 END, a.created_at DESC"
        );
        return new Response(JSON.stringify({ approvals }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
      POST: async (req) => {
        const body = (await req.json()) as any;
        if (!body.project_id || !body.type || !body.proposal_data) {
          return new Response(JSON.stringify({ error: "project_id, type, and proposal_data are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        const id = uuid();
        await execute(
          "INSERT INTO pm_approvals (id, project_id, type, proposal_data, options, status) VALUES (?,?,?,?,?,'pending')",
          [id, body.project_id, body.type, JSON.stringify(body.proposal_data), body.options ? JSON.stringify(body.options) : null]
        );
        const approval = await queryOne("SELECT * FROM pm_approvals WHERE id=?", [id]);
        return new Response(JSON.stringify({ approval }), { status: 201, headers: { "Content-Type": "application/json" } });
      },
    },
  ],

  // Approve an approval request
  [
    pathToRegex("/api/approvals/:id/approve"),
    {
      POST: async (req, params) => {
        const body = (await req.json()) as any;
        const approval = await queryOne("SELECT * FROM pm_approvals WHERE id=?", [params.id]);
        if (!approval) {
          return new Response(JSON.stringify({ error: "Approval not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
        }

        await execute(
          "UPDATE pm_approvals SET status='approved', pm_decision=?, pm_id=?, resolved_at=? WHERE id=?",
          [JSON.stringify(body.decision || {}), body.pm_id || null, now(), params.id]
        );

        // If this is a supplier_comms approval, mark the communication as sent
        if ((approval as any).type === "supplier_comms") {
          const proposalData = JSON.parse((approval as any).proposal_data as string);
          if (proposalData.communicationId) {
            await execute(
              "UPDATE supplier_communications SET status='needs_review', pm_approved_at=?, pm_approved_by=? WHERE id=?",
              [now(), body.pm_id || null, proposalData.communicationId]
            );
          }
        }

        const updated = await queryOne("SELECT * FROM pm_approvals WHERE id=?", [params.id]);
        return new Response(JSON.stringify({ approval: updated }), { status: 200, headers: { "Content-Type": "application/json" } });
      },
    },
  ],

  // Reject an approval request
  [
    pathToRegex("/api/approvals/:id/reject"),
    {
      POST: async (req, params) => {
        const body = (await req.json()) as any;
        await execute(
          "UPDATE pm_approvals SET status='rejected', pm_decision=?, pm_id=?, resolved_at=? WHERE id=?",
          [JSON.stringify({ reason: body.reason || "No reason given" }), body.pm_id || null, now(), params.id]
        );
        const updated = await queryOne("SELECT * FROM pm_approvals WHERE id=?", [params.id]);
        return new Response(JSON.stringify({ approval: updated }), { status: 200, headers: { "Content-Type": "application/json" } });
      },
    },
  ],
];

function toColonParams(
  pattern: RegExp,
  pathname: string
): Record<string, string> | null {
  const match = pathname.match(pattern);
  if (!match) return null;
  return match.groups || {};
}

export async function handleApiRequest(
  req: Request
): Promise<Response | null> {
  const url = new URL(req.url);
  const method = req.method as "GET" | "POST" | "PATCH" | "DELETE";

  for (const [pattern, handler] of routes) {
    const params = toColonParams(pattern, url.pathname);
    if (params && handler[method]) {
      try {
        return await handler[method]!(req, params);
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }
  return null;
}