import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Badge, Button, Card, CardHeader, CardTitle, CardContent, ProgressBar, PrismLogo } from "~/components";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectDetail,
});

type Milestone = {
  id: string;
  title: string;
  planned_start: string;
  planned_end: string;
  progress_pct: number;
  status: string;
};

type BudgetLine = {
  id: string;
  category: string;
  description: string;
  allocated: number;
  spent: number;
  committed: number;
};

type RiskFlag = {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget_total: number;
  budget_spent: number;
};

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [risks, setRisks] = useState<RiskFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Fetch project
        const pRes = await fetch(`/api/projects`);
        const pData = await pRes.json();
        const found = (pData.projects || []).find((p: Project) => p.id === projectId);
        if (!found) {
          setError("Project not found");
          return;
        }
        setProject(found);

        // Fetch milestones
        const mRes = await fetch(`/api/projects/${projectId}/schedule`);
        const mData = await mRes.json();
        setMilestones(mData.milestones || []);

        // Fetch budget
        const bRes = await fetch(`/api/projects/${projectId}/budget`);
        const bData = await bRes.json();
        setBudgetLines(bData.budgetLines || []);

        // Fetch risks (try the risks endpoint)
        try {
          const rRes = await fetch(`/api/projects/${projectId}/risks`);
          const rData = await rRes.json();
          setRisks(rData.risks || []);
        } catch {
          // Risks endpoint might not exist, that's ok
        }
      } catch (e) {
        setError("Failed to load project data");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-navy-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-navy-900">{error || "Project not found"}</h1>
        <Link to="/dashboard" className="mt-4 text-indigo-600 hover:underline inline-block">Back to dashboard</Link>
      </div>
    );
  }

  const budgetPct = project.budget_total > 0 ? Math.round((project.budget_spent / project.budget_total) * 100) : 0;
  const totalCommitted = budgetLines.reduce((s, l) => s + l.committed, 0);
  const remainingBudget = project.budget_total - project.budget_spent - totalCommitted;
  const completedMiles = milestones.filter(m => m.progress_pct >= 100).length;
  const activeRisks = risks.filter(r => r.status === "open").length;

  // Helper to extract month from date string
  const getMonth = (d: string) => {
    const dt = new Date(d);
    return dt.getMonth() + dt.getFullYear() * 12;
  };

  return (
    <div className="min-h-dvh bg-navy-50">
      <header className="glass sticky top-0 z-50 border-b border-navy-200/50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-500">&larr; Projects</Link>
            <span className="text-navy-300">/</span>
            <span className="text-sm font-medium text-navy-900 truncate max-w-[200px]">{project.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={
              project.status === "active" ? "success" :
              project.status === "planning" ? "info" :
              project.status === "completed" ? "default" : "warning"
            }>
              {project.status === "active" ? "Active" : project.status}
            </Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Project header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-navy-900">{project.name}</h1>
          <p className="mt-2 text-navy-600">{project.description}</p>
        </div>

        {/* KPI cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Budget</p>
            <p className="mt-1 text-2xl font-bold text-navy-900">${(project.budget_total / 1000000).toFixed(1)}M</p>
            <div className="mt-2">
              <ProgressBar value={budgetPct} showValue={true} variant={budgetPct > 85 ? "danger" : budgetPct > 65 ? "warning" : "default"} />
            </div>
          </div>
          <div className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Schedule</p>
            <p className="mt-1 text-lg font-bold text-navy-900">
              {project.start_date?.slice(0, 10) || "TBD"}
            </p>
            <p className="text-sm text-navy-500">
              → {project.end_date?.slice(0, 10) || "TBD"}
            </p>
          </div>
          <div className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Milestones</p>
            <p className="mt-1 text-2xl font-bold text-navy-900">{completedMiles}/{milestones.length}</p>
            <p className="text-sm text-navy-500">completed</p>
          </div>
          <div className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-navy-500 uppercase tracking-wider">Risk Flags</p>
            <p className={`mt-1 text-2xl font-bold ${activeRisks > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {activeRisks > 0 ? `${activeRisks} active` : "Clear"}
            </p>
            <p className="text-sm text-navy-500">{risks.length} total tracked</p>
          </div>
        </div>

        {/* Budget Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <span className="text-sm text-navy-400">
              ${(project.budget_spent / 1000000).toFixed(1)}M spent of ${(project.budget_total / 1000000).toFixed(1)}M
              {remainingBudget >= 0 ? ` · $${(remainingBudget / 1000).toFixed(0)}K remaining` : ` · $${(Math.abs(remainingBudget) / 1000).toFixed(0)}K over budget`}
            </span>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-200 text-left">
                    <th className="pb-3 font-medium text-navy-500">Category</th>
                    <th className="pb-3 font-medium text-navy-500">Allocated</th>
                    <th className="pb-3 font-medium text-navy-500">Spent</th>
                    <th className="pb-3 font-medium text-navy-500">Committed</th>
                    <th className="pb-3 font-medium text-navy-500">Remaining</th>
                    <th className="pb-3 font-medium text-navy-500">% Used</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetLines.map((line) => {
                    const used = Math.round(((line.spent + line.committed) / line.allocated) * 100);
                    const rem = line.allocated - line.spent - line.committed;
                    return (
                      <tr key={line.id} className="border-b border-navy-100 last:border-0">
                        <td className="py-3 font-medium capitalize text-navy-900">{line.category}</td>
                        <td className="py-3 text-navy-600">${(line.allocated / 1000).toFixed(0)}K</td>
                        <td className="py-3 text-navy-600">${(line.spent / 1000).toFixed(0)}K</td>
                        <td className="py-3 text-navy-600">${(line.committed / 1000).toFixed(0)}K</td>
                        <td className={`py-3 font-medium ${rem < 0 ? "text-red-500" : "text-navy-700"}`}>
                          {rem < 0 ? "-$" : "$"}{(Math.abs(rem) / 1000).toFixed(0)}K
                        </td>
                        <td className="py-3 min-w-[80px]">
                          <ProgressBar value={used} showValue={true} variant={used > 90 ? "danger" : used > 75 ? "warning" : "default"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Schedule Milestones</CardTitle>
            <span className="text-sm text-navy-400">{milestones.length} milestones · {completedMiles} completed</span>
          </CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <p className="text-sm text-navy-400 py-4 text-center">No milestones yet</p>
            ) : (
              <div className="space-y-2">
                {milestones.sort((a, b) => a.sort_order - b.sort_order).map((ms) => (
                  <div key={ms.id} className="flex items-center gap-4 rounded-lg border border-navy-100 px-4 py-3">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      ms.progress_pct >= 100 ? "bg-emerald-100 text-emerald-700" :
                      ms.status === "in_progress" ? "bg-indigo-100 text-indigo-700" :
                      ms.status === "delayed" ? "bg-amber-100 text-amber-700" :
                      "bg-navy-100 text-navy-500"
                    }`}>
                      {ms.progress_pct >= 100 ? "✓" : ms.sort_order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-900">{ms.title}</p>
                      <p className="text-xs text-navy-500">
                        {ms.planned_start?.slice(0, 10)} — {ms.planned_end?.slice(0, 10)}
                      </p>
                    </div>
                    <div className="w-32">
                      <ProgressBar value={ms.progress_pct} showValue={true} variant={
                        ms.progress_pct >= 100 ? "default" :
                        ms.progress_pct > 0 ? "warning" : "default"
                      } />
                    </div>
                    <Badge variant={
                      ms.progress_pct >= 100 ? "success" :
                      ms.status === "in_progress" ? "info" :
                      ms.status === "delayed" ? "danger" : "default"
                    } size="sm">
                      {ms.progress_pct >= 100 ? "Complete" :
                       ms.status === "in_progress" ? "In Progress" :
                       ms.status === "delayed" ? "Delayed" : "Planned"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Flags */}
        {risks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Risk Flags</CardTitle>
              <Badge variant={activeRisks > 0 ? "warning" : "success"}>{activeRisks} active</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {risks.map((risk) => (
                  <div key={risk.id} className="flex items-start gap-3 rounded-lg border border-navy-100 px-4 py-3">
                    <span className={`flex-shrink-0 mt-0.5 h-2.5 w-2.5 rounded-full ${
                      risk.severity === "critical" ? "bg-red-500" :
                      risk.severity === "high" ? "bg-amber-500" :
                      risk.severity === "medium" ? "bg-yellow-400" : "bg-blue-400"
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-navy-900">{risk.title}</p>
                        <Badge variant={
                          risk.severity === "critical" ? "danger" :
                          risk.severity === "high" ? "warning" :
                          risk.severity === "medium" ? "info" : "default"
                        } size="sm">{risk.severity}</Badge>
                        <Badge variant={risk.status === "open" ? "warning" : "success"} size="sm">{risk.status}</Badge>
                      </div>
                      <p className="text-xs text-navy-600 mt-1">{risk.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}