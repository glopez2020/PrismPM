import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

// Server-side fetch helpers
const fetchBriefing = createServerFn({ method: "GET" }).handler(async () => {
  "use server";
  try {
    const res = await fetch("http://localhost:3000/api/dashboard/briefing", { headers: { cookie: req.headers?.cookie || "" } });
    if (!res.ok) return { greeting: "", date: "", headlineStatus: "", metrics: {} };
    return await res.json();
  } catch { return { greeting: "", date: "", headlineStatus: "", metrics: {} }; }
});

const fetchChanges = createServerFn({ method: "GET" }).handler(async () => {
  "use server";
  try {
    const res = await fetch("http://localhost:3000/api/dashboard/changes", { headers: { cookie: req.headers?.cookie || "" } });
    if (!res.ok) return { changes: [], viewedAt: "" };
    return await res.json();
  } catch { return { changes: [], viewedAt: "" }; }
});

const fetchAttention = createServerFn({ method: "GET" }).handler(async () => {
  "use server";
  try {
    const res = await fetch("http://localhost:3000/api/dashboard/attention", { headers: { cookie: req.headers?.cookie || "" } });
    if (!res.ok) return { items: [] };
    return await res.json();
  } catch { return { items: [] }; }
});

const fetchProjects = createServerFn({ method: "GET" }).handler(async () => {
  "use server";
  try {
    const res = await fetch("http://localhost:3000/api/projects");
    const data = await res.json();
    return { projects: data.projects || [] };
  } catch { return { projects: [] }; }
});

export const Route = createFileRoute("/dashboard")({
  loader: async () => {
    const [briefing, attention, changes, projects] = await Promise.all([
      fetchBriefing(), fetchAttention(), fetchChanges(), fetchProjects(),
    ]);
    return { briefing, attention, changes, projects };
  },
  component: Dashboard,
});

type ChangeItem = {
  id: string; timestamp: string; relativeTime: string;
  projectId: string; projectName: string; type: string;
  title: string; description: string; severity: string; actionRequired: boolean;
};

type AttentionItem = {
  id: string; priority: string; type: string;
  projectId: string; projectName: string; title: string;
  description: string; confidence: string; options: { label: string; action: string; target?: string }[];
  createdAt: string;
};

type Project = {
  id: string; name: string; description: string; status: string;
  start_date: string | null; end_date: string | null;
  budget_total: number; budget_spent: number;
};

function Dashboard() {
  const { briefing, attention, changes, projects: projectsData } = Route.useLoaderData();
  const { greeting, date: briefDate, headlineStatus, metrics } = briefing as any;
  const { items } = attention as any;
  const { changes: changeItems } = changes as any;
  const projects = (projectsData as any)?.projects || [];

  // Group changes by project
  const changesByProject: Record<string, ChangeItem[]> = {};
  for (const c of (changeItems || [])) {
    if (!changesByProject[c.projectName]) changesByProject[c.projectName] = [];
    changesByProject[c.projectName].push(c);
  }

  // Group attention items by priority
  const criticalItems = (items || []).filter((i: AttentionItem) => i.priority === "critical");
  const todayItems = (items || []).filter((i: AttentionItem) => i.priority === "today");
  const thisWeekItems = (items || []).filter((i: AttentionItem) => i.priority === "this_week");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* ==================== HERO PANEL ==================== */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-navy-900 p-6 sm:p-8 text-white shadow-lg">
        {greeting ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting}</h1>
                <p className="mt-1 text-sm text-indigo-200">{briefDate || new Date().toISOString().slice(0, 10)}</p>
              </div>
              <Link to="/projects/new" className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors backdrop-blur-sm">
                + New Project
              </Link>
            </div>
            {headlineStatus && (
              <p className="mt-4 text-lg font-medium text-indigo-100">{headlineStatus}</p>
            )}
            {/* Metrics row */}
            {metrics && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <MetricCard label="Projects" value={metrics.totalProjects ?? "—"} />
                <MetricCard label="Active Risks" value={metrics.activeRisks ?? "—"} severity={metrics.activeRisks > 0 ? "amber" : undefined} />
                <MetricCard label="Need Review" value={metrics.pendingVerifications ?? "—"} severity={metrics.pendingVerifications > 0 ? "amber" : undefined} />
                <MetricCard label="Supplier Inbox" value={metrics.unreadSupplierResponses ?? "—"} />
                <MetricCard label="Milestones Due" value={metrics.milestonesDueThisWeek ?? "—"} />
                <MetricCard label="Budgets At Risk" value={metrics.budgetsAtRisk ?? "—"} severity={metrics.budgetsAtRisk > 0 ? "red" : undefined} />
              </div>
            )}
          </>
        ) : (
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 rounded bg-white/10" />
            <div className="h-4 w-96 rounded bg-white/10" />
            <div className="grid grid-cols-6 gap-3"><div className="col-span-1 h-16 rounded bg-white/10" /></div>
          </div>
        )}
      </div>

      {/* ==================== ATTENTION REQUIRED ==================== */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Attention Required</h2>
        {items?.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">Nothing needs your attention right now. Great job.</p>
          </div>
        ) : (
          <>
            {criticalItems.length > 0 && <PrioritySection title="Critical" items={criticalItems} color="red" />}
            {todayItems.length > 0 && <PrioritySection title="Today" items={todayItems} color="indigo" />}
            {thisWeekItems.length > 0 && <PrioritySection title="This Week" items={thisWeekItems} color="gray" />}
          </>
        )}
      </section>

      {/* ==================== WHAT CHANGED ==================== */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">What Changed</h2>
        {changeItems?.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">No recent changes to show.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(changesByProject).map(([project, projectChanges]) => (
              <details key={project} className="group rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <span>{project}</span>
                  <span className="text-xs text-gray-500">{projectChanges.length} change{projectChanges.length > 1 ? "s" : ""}</span>
                </summary>
                <div className="border-t border-gray-100 dark:border-gray-800">
                  {projectChanges.map((c: ChangeItem) => (
                    <div key={c.id} className="flex items-start gap-3 px-4 py-3 text-sm border-b border-gray-50 last:border-0 dark:border-gray-800">
                      <SeverityDot severity={c.severity} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{c.title}</span>
                          {c.actionRequired && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">action</span>}
                        </div>
                        {c.description && <p className="mt-0.5 text-gray-600 dark:text-gray-400">{c.description}</p>}
                        <p className="mt-0.5 text-xs text-gray-400">{c.relativeTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      {/* ==================== PROJECT LISTING ==================== */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">All Projects</h2>
          <Link to="/projects/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            + New Project
          </Link>
        </div>
        {projects?.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">No projects yet. Create your first project to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(projects as Project[]).map((project) => {
              const budgetPct = project.budget_total > 0 ? Math.round((project.budget_spent / project.budget_total) * 100) : 0;
              return (
                <Link key={project.id} to="/projects/$projectId" params={{ projectId: project.id }}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={project.status} />
                    <span className="text-sm text-gray-400">{project.budget_total > 0 ? `$${(project.budget_total / 1000000).toFixed(1)}M` : ''}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
                  {project.description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{project.description}</p>}
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    {project.start_date && <span>{project.start_date.slice(0, 10)}{project.end_date ? ` — ${project.end_date.slice(0, 10)}` : ''}</span>}
                    <span className="font-medium text-gray-500">{budgetPct}% spent</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className={`h-1.5 rounded-full transition-all ${budgetPct > 85 ? 'bg-red-500' : budgetPct > 65 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ===== Sub-components =====

function MetricCard({ label, value, severity }: { label: string; value: number | string; severity?: string }) {
  const colorMap: Record<string, string> = {
    amber: "text-amber-300",
    red: "text-red-300",
  };
  return (
    <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
      <p className="text-2xl font-bold tracking-tight text-white">{String(value)}</p>
      <p className={`mt-0.5 text-xs ${severity ? colorMap[severity] || "text-indigo-200" : "text-indigo-200"}`}>{label}</p>
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500",
    attention: "bg-amber-400",
    neutral: "bg-gray-400 dark:bg-gray-500",
  };
  return <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${colors[severity] || colors.neutral}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    planning: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    completed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || colors.planning}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function PrioritySection({ title, items, color }: { title: string; items: AttentionItem[]; color: string }) {
  const borderColor = color === "red" ? "border-red-200 dark:border-red-900" : color === "indigo" ? "border-indigo-200 dark:border-indigo-900" : "border-gray-200 dark:border-gray-800";
  const badgeColor = color === "red" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : color === "indigo" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  const confidenceMap: Record<string, string> = { high: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", medium: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };

  return (
    <div className={`mb-3 rounded-xl border ${borderColor} bg-white dark:bg-gray-900 overflow-hidden`}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>{title}</span>
        <span className="text-xs text-gray-500">{items.length} item{items.length > 1 ? "s" : ""}</span>
      </div>
      {items.map((item) => (
        <details key={item.id} className="group border-b border-gray-50 last:border-0 dark:border-gray-800">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.title}</span>
              <span className={`rounded px-1.5 py-0.5 text-xs ${confidenceMap[item.confidence] || confidenceMap.low}`}>{item.confidence}</span>
            </div>
            <span className="text-xs text-gray-400 shrink-0">{item.projectName}</span>
          </summary>
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
            {item.options?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.options.map((opt, i) => (
                  opt.action === "navigate" && opt.target ? (
                    <Link key={i} to={opt.target} className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors">
                      {opt.label}
                    </Link>
                  ) : (
                    <button key={i} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
                      {opt.label}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}