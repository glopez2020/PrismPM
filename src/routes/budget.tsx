import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Badge, ProgressBar, Tabs, PrismLogo
} from "~/components";

export const Route = createFileRoute("/budget")({
  component: BudgetPage,
});

type ProjectData = {
  id: string;
  name: string;
  budget_total: number;
  budget_spent: number;
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

function BudgetPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [budgetLines, setBudgetLines] = useState<Record<string, BudgetLine[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const projRes = await fetch("/api/projects");
        const projData = await projRes.json();
        const filtered: ProjectData[] = (projData.projects || []).filter(
          (p: ProjectData) => p.name !== "Test" && p.name !== "Test Project"
        );
        setProjects(filtered);

        const lines: Record<string, BudgetLine[]> = {};
        await Promise.all(
          filtered.map(async (p) => {
            const bRes = await fetch(`/api/projects/${p.id}/budget`);
            const bData = await bRes.json();
            lines[p.id] = bData.budgetLines || [];
          })
        );
        setBudgetLines(lines);
      } catch (e) {
        console.error("Failed to load budgets:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalAllocated = projects.reduce((s, p) => s + p.budget_total, 0);
  const totalSpent = projects.reduce((s, p) => s + p.budget_spent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const allLines = Object.values(budgetLines).flat();
  const totalCommitted = allLines.reduce((s, l) => s + l.committed, 0);
  const atRiskLines = allLines.filter(l => (l.spent + l.committed) > l.allocated * 0.9);
  const riskAmount = atRiskLines.reduce((s, l) => s + (l.spent + l.committed - l.allocated), 0);

  return (
    <div className="min-h-dvh bg-navy-50">
      <header className="glass sticky top-0 z-50 border-b border-navy-200/50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-navy-500 hover:text-navy-700 transition-colors">
              <PrismLogo className="h-6 w-6" />
            </Link>
            <span className="text-navy-300">/</span>
            <span className="text-sm font-medium text-navy-900">Budget</span>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline">Export report</Button>
            <Button size="sm" variant="primary">Re-allocate funds</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-navy-900">Budget Overview</h1>
          <p className="mt-1 text-navy-600">All projects · Q3 2026 — AI-analyzed cost trends</p>
        </div>

        {/* Summary KPIs */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total Allocated" value={`$${(totalAllocated / 1000000).toFixed(1)}M`} change={`${projects.length} projects`} positive={true} />
          <SummaryCard label="Total Spent" value={`$${(totalSpent / 1000000).toFixed(1)}M`} change={`${Math.round((totalSpent / totalAllocated) * 100)}% of budget consumed`} positive={totalSpent / totalAllocated < 0.75} />
          <SummaryCard label="Remaining" value={`$${(totalRemaining / 1000000).toFixed(1)}M`} change={`${Math.round((totalRemaining / totalAllocated) * 100)}% remaining`} positive={true} />
          <SummaryCard label="AI Risk Alert" value={`$${Math.max(riskAmount, 0).toLocaleString()}`} change={`${atRiskLines.length} lines trending over`} positive={false} sub={`across ${projects.length} projects`} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-indigo-600" />
          </div>
        ) : (
          <Tabs
            className="mb-8"
            tabs={[
              {
                id: "all",
                label: "All Projects",
                badge: String(projects.length),
                content: <AllProjectsBudget projects={projects} budgetLines={budgetLines} />,
              },
              ...projects.map((p) => ({
                id: p.id,
                label: p.name.split(" — ")[0],
                content: <ProjectBudget projectName={p.name} lines={budgetLines[p.id] || []} />,
              })),
            ]}
          />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, change, positive, sub }: {
  label: string; value: string; change: string; positive: boolean; sub?: string;
}) {
  return (
    <div className="rounded-xl border border-navy-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-navy-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-navy-900">{value}</p>
      <p className={`mt-1 text-sm font-medium ${positive ? "text-emerald-600" : "text-red-500"}`}>
        {positive ? "↑" : "↓"} {change}
      </p>
      {sub && <p className="text-xs text-navy-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function AllProjectsBudget({ projects, budgetLines }: { projects: ProjectData[]; budgetLines: Record<string, BudgetLine[]> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget by Project</CardTitle>
        <span className="text-sm text-navy-400">
          ${(projects.reduce((s, p) => s + p.budget_spent, 0) / 1000000).toFixed(1)}M of ${(projects.reduce((s, p) => s + p.budget_total, 0) / 1000000).toFixed(1)}M spent
        </span>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-200 text-left">
                <th className="pb-3 font-medium text-navy-500">Project</th>
                <th className="pb-3 font-medium text-navy-500">Allocated</th>
                <th className="pb-3 font-medium text-navy-500">Spent</th>
                <th className="pb-3 font-medium text-navy-500">Committed</th>
                <th className="pb-3 font-medium text-navy-500">Remaining</th>
                <th className="pb-3 font-medium text-navy-500">Burn Rate</th>
                <th className="pb-3 font-medium text-navy-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const lines = budgetLines[p.id] || [];
                const committed = lines.reduce((s, l) => s + l.committed, 0);
                const spent = p.budget_spent;
                const allocated = p.budget_total;
                const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
                const remaining = allocated - spent - committed;
                return (
                  <tr key={p.id} className="border-b border-navy-100">
                    <td className="py-3 font-medium text-navy-900">{p.name}</td>
                    <td className="py-3 text-navy-600">${(allocated / 1000000).toFixed(1)}M</td>
                    <td className="py-3 text-navy-600">${(spent / 1000000).toFixed(1)}M</td>
                    <td className="py-3 text-navy-600">${(committed / 1000000).toFixed(1)}M</td>
                    <td className={`py-3 font-medium ${remaining < 0 ? "text-red-500" : "text-emerald-600"}`}>
                      {remaining < 0 ? "-$" : "$"}{(Math.abs(remaining) / 1000000).toFixed(1)}M
                    </td>
                    <td className="py-3 min-w-[100px]">
                      <ProgressBar value={pct} showValue={false} variant={pct > 85 ? "danger" : pct > 65 ? "warning" : "default"} />
                    </td>
                    <td className="py-3">
                      <Badge variant={pct > 85 ? "danger" : pct > 65 ? "warning" : "success"} size="sm">
                        {pct > 85 ? "Over Budget" : pct > 65 ? "At Risk" : "On Track"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectBudget({ projectName, lines }: { projectName: string; lines: BudgetLine[] }) {
  const totalAllocated = lines.reduce((s, l) => s + l.allocated, 0);
  const totalSpent = lines.reduce((s, l) => s + l.spent, 0);
  const totalCommitted = lines.reduce((s, l) => s + l.committed, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Line Items — {projectName}</CardTitle>
          <Badge variant="info">AI analyzed</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-200 text-left">
                  <th className="pb-3 font-medium text-navy-500">Category</th>
                  <th className="pb-3 font-medium text-navy-500">Description</th>
                  <th className="pb-3 font-medium text-navy-500">Allocated</th>
                  <th className="pb-3 font-medium text-navy-500">Spent</th>
                  <th className="pb-3 font-medium text-navy-500">Committed</th>
                  <th className="pb-3 font-medium text-navy-500">Remaining</th>
                  <th className="pb-3 font-medium text-navy-500">% Used</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const used = Math.round(((line.spent + line.committed) / line.allocated) * 100);
                  const remaining = line.allocated - line.spent - line.committed;
                  return (
                    <tr key={line.id} className="border-b border-navy-100 last:border-0">
                      <td className="py-3 font-medium text-navy-900 capitalize">{line.category}</td>
                      <td className="py-3 text-navy-600 text-xs max-w-[180px] truncate">{line.description}</td>
                      <td className="py-3 text-navy-600">${(line.allocated / 1000).toFixed(0)}K</td>
                      <td className="py-3 text-navy-600">${(line.spent / 1000).toFixed(0)}K</td>
                      <td className="py-3 text-navy-600">${(line.committed / 1000).toFixed(0)}K</td>
                      <td className={`py-3 font-medium ${remaining < 0 ? "text-red-500" : "text-navy-700"}`}>
                        ${(remaining / 1000).toFixed(0)}K
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

      {/* AI Insights */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>AI Budget Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lines.filter(l => (l.spent + l.committed) > l.allocated * 0.85).length > 0 ? (
              lines.filter(l => (l.spent + l.committed) > l.allocated * 0.85).slice(0, 3).map((l) => (
                <div key={l.id} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">!</span>
                    <div>
                      <p className="text-sm font-medium text-navy-900">{l.category} trending over budget</p>
                      <p className="mt-1 text-xs text-navy-600">{l.description} — {Math.round(((l.spent + l.committed) / l.allocated) * 100)}% used</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <div>
                    <p className="text-sm font-medium text-navy-900">All categories on track</p>
                    <p className="mt-1 text-xs text-navy-600">No significant budget risks detected for this project.</p>
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-lg border border-navy-200 bg-white p-3">
              <div className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">i</span>
                <div>
                  <p className="text-sm font-medium text-navy-900">Budget summary</p>
                  <p className="mt-1 text-xs text-navy-600">${(totalCommitted / 1000).toFixed(0)}K committed. ${((totalAllocated - totalSpent - totalCommitted) / 1000).toFixed(0)}K available.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}