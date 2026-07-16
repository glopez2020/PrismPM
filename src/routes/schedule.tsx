import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Badge, PrismLogo
} from "~/components";

export const Route = createFileRoute("/schedule")({
  component: SchedulePage,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEAR = 2026;
const MONTH_WIDTH = 80;
const MONTHS_SHOWN = 12;

type Milestone = {
  id: string;
  title: string;
  planned_start: string;
  planned_end: string;
  progress_pct: number;
  status: string;
  sort_order: number;
};

type ProjectData = {
  id: string;
  name: string;
  status: string;
  budget_total: number;
};

function SchedulePage() {
  const [projectSchedules, setProjectSchedules] = useState<{ project: ProjectData; milestones: Milestone[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch projects first
        const projRes = await fetch("/api/projects");
        const projData = await projRes.json();
        const projects: ProjectData[] = (projData.projects || []).filter(
          (p: ProjectData) => p.name !== "Test" && p.name !== "Test Project"
        );

        // Fetch schedules for each project
        const schedules = await Promise.all(
          projects.map(async (p) => {
            const schedRes = await fetch(`/api/projects/${p.id}/schedule`);
            const schedData = await schedRes.json();
            return { project: p, milestones: schedData.milestones || [] };
          })
        );

        setProjectSchedules(schedules);
      } catch (e) {
        console.error("Failed to load schedules:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-dvh bg-navy-50">
      <header className="glass sticky top-0 z-50 border-b border-navy-200/50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-navy-500 hover:text-navy-700 transition-colors">
              <PrismLogo className="h-6 w-6" />
            </Link>
            <span className="text-navy-300">/</span>
            <span className="text-sm font-medium text-navy-900">Schedule</span>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline">Export</Button>
            <Button size="sm" variant="primary">Adjust schedule</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-navy-900">Master Schedule</h1>
            <p className="mt-1 text-navy-600">Q1 2026 — Q4 2027 · Real-time milestone tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-navy-500">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-navy-500">
              <span className="h-2.5 w-2.5 rounded bg-indigo-500" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-navy-500">
              <span className="h-2.5 w-2.5 rounded bg-amber-500" />
              <span>At Risk</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-navy-500">
              <span className="h-2.5 w-2.5 rounded bg-navy-300" />
              <span>Planned</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-200 border-t-indigo-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {projectSchedules.map(({ project, milestones }) => {
              const progress = milestones.length > 0
                ? Math.round(milestones.reduce((s, m) => s + m.progress_pct, 0) / milestones.length)
                : 0;
              const atRiskCount = milestones.filter(m => m.status === "delayed").length;
              const completedCount = milestones.filter(m => m.progress_pct >= 100).length;
              
              let overallStatus: "on-track" | "at-risk" | "behind" = "on-track";
              if (atRiskCount > 0) overallStatus = "at-risk";
              if (atRiskCount > 1) overallStatus = "behind";

              return (
                <ProjectScheduleCard
                  key={project.id}
                  projectId={project.id}
                  name={project.name}
                  status={overallStatus}
                  progress={progress}
                  milestones={milestones}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectScheduleCard({
  projectId, name, status, progress, milestones
}: {
  projectId: string;
  name: string;
  status: "on-track" | "at-risk" | "behind";
  progress: number;
  milestones: Milestone[];
}) {
  const startMonth = 0;
  const totalMonths = 24; // 2 years

  const getBarStyle = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const startMonthIdx = (start.getFullYear() - YEAR) * 12 + start.getMonth();
    const endMonthIdx = (end.getFullYear() - YEAR) * 12 + end.getMonth();
    const durationMonths = endMonthIdx - startMonthIdx + (end.getDate() - start.getDate()) / 30;
    
    const left = ((startMonthIdx - startMonth) / totalMonths) * 100;
    const width = (Math.max(durationMonths, 0.5) / totalMonths) * 100;
    return { left: `${Math.max(left, 0)}%`, width: `${Math.max(width, 2)}%` };
  };

  const statusColor = (ms: Milestone) => {
    if (ms.progress_pct >= 100) return "bg-emerald-500";
    if (ms.status === "in_progress") return "bg-indigo-500";
    if (ms.status === "delayed") return "bg-amber-500";
    return "bg-navy-300";
  };

  const statusLabel = (ms: Milestone) => {
    if (ms.progress_pct >= 100) return "completed";
    if (ms.status === "in_progress") return "in-progress";
    if (ms.status === "delayed") return "at-risk";
    return "planned";
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>{name}</CardTitle>
          <Badge variant={
            status === "on-track" ? "success" :
            status === "at-risk" ? "warning" : "danger"
          } size="sm">
            {status === "on-track" ? "On Track" :
             status === "at-risk" ? "At Risk" : "Behind"}
          </Badge>
          <span className="text-xs text-navy-400">{progress}% avg progress</span>
        </div>
        <Link to="/projects/$projectId" params={{ projectId }}>
          <Button size="sm" variant="ghost">Open project</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex border-b border-navy-100 pb-2 mb-2" style={{ marginLeft: "140px" }}>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="text-xs font-medium text-navy-400 flex-shrink-0" style={{ width: `${MONTH_WIDTH * 0.5}px` }}>
              {MONTHS[i % 12]}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {milestones.map((ms) => (
            <div key={ms.id} className="flex items-center gap-3">
              <span className="w-[130px] flex-shrink-0 text-xs font-medium text-navy-700 truncate text-right">
                {ms.title}
              </span>
              <div className="relative flex-1 h-6">
                {Array.from({ length: totalMonths }, (_, mi) => (
                  <div key={mi} className="absolute top-0 h-full border-l border-navy-100" style={{ left: `${(mi / totalMonths) * 100}%` }} />
                ))}
                <div
                  className={`absolute top-1 h-4 rounded ${statusColor(ms)} opacity-80 transition-all`}
                  style={getBarStyle(ms.planned_start, ms.planned_end)}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}