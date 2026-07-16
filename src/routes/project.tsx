import { createFileRoute, useSearch } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getProject = createServerFn({ method: "GET" }).handler(async ({ id }: { id: string }) => {
  "use server";
  try {
    const { queryAll, queryOne } = await import("~/lib/db");
    const project = await queryOne("SELECT p.*, u.display_name as pm_name FROM projects p LEFT JOIN users u ON p.pm_id = u.id WHERE p.id=?", [id]);
    if (!project) return { project: null };
    const milestones = await queryAll("SELECT * FROM schedules WHERE project_id=? ORDER BY sort_order", [id]);
    const budgetLines = await queryAll("SELECT * FROM budget_line_items WHERE project_id=?", [id]);
    return { project, milestones, budgetLines };
  } catch (e) {
    return { project: null, milestones: [], budgetLines: [], error: String(e) };
  }
});

export const Route = createFileRoute("/project")({
  validateSearch: (search: Record<string, string>) => ({ id: search.id || "" }),
  loaderDeps: ({ search: { id } }) => ({ id }),
  loader: async ({ deps: { id } }) => {
    if (!id) return { project: null };
    return getProject({ id });
  },
  component: ProjectPage,
});

function ProjectPage() {
  const data = Route.useLoaderData();
  const project = data.project as Record<string, any> | null;

  if (!project) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-navy-900">Project not found</h1>
        <a href="/dashboard" className="mt-4 text-indigo-600 hover:underline">Back to dashboard</a>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-navy-50">
      <header className="glass sticky top-0 z-50 border-b border-navy-200/50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-500">&larr; Dashboard</a>
            <span className="text-navy-300">/</span>
            <span className="text-sm font-medium text-navy-900">{project.name as string}</span>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">{project.status as string}</span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900">{project.name as string}</h1>
        <p className="mt-2 text-navy-600">{(project.description as string) || ""}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-navy-200 bg-white p-5">
            <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Budget</p>
            <p className="mt-1 text-2xl font-bold text-navy-900">
              ${Number(project.budget_total || 0).toLocaleString()}
            </p>
            <p className="text-xs text-navy-400">
              ${Number(project.budget_spent || 0).toLocaleString()} spent
            </p>
          </div>
          <div className="rounded-xl border border-navy-200 bg-white p-5">
            <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Schedule</p>
            <p className="mt-1 text-sm text-navy-600">
              {(project.start_date as string)?.slice(0,10) || "TBD"} — {(project.end_date as string)?.slice(0,10) || "TBD"}
            </p>
          </div>
          <div className="rounded-xl border border-navy-200 bg-white p-5">
            <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Milestones</p>
            <p className="mt-1 text-2xl font-bold text-navy-900">{(data.milestones as any[])?.length || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
