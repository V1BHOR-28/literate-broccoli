import type { Kpi, KpiHistory, Project } from "@ai-pm/shared";

type MockHistoryPoint = Pick<KpiHistory, "changedAt" | "newValue" | "changedBy" | "changeReason">;

function createHistory(kpiId: string, points: MockHistoryPoint[]): KpiHistory[] {
  return points.map((point, index) => ({
    id: `${kpiId}-history-${index + 1}`,
    kpiId,
    oldValue: index === 0 ? 0 : points[index - 1].newValue,
    newValue: point.newValue,
    changedBy: point.changedBy,
    changeReason: point.changeReason,
    changedAt: point.changedAt
  }));
}

export const mockProjects: Project[] = [
  {
    id: "project-atlas",
    name: "Project Atlas",
    description: "Launch the self-service analytics workspace.",
    createdAt: "2026-06-01T09:00:00Z",
    updatedAt: "2026-07-06T09:00:00Z"
  },
  {
    id: "project-orbit",
    name: "Project Orbit",
    description: "Improve onboarding activation and retention.",
    createdAt: "2026-06-01T09:00:00Z",
    updatedAt: "2026-07-06T09:00:00Z"
  }
];

export const mockKpis: Kpi[] = [
  {
    id: "kpi-atlas-adoption",
    projectId: "project-atlas",
    name: "Weekly active teams",
    currentValue: 73,
    targetValue: 90,
    unit: "teams",
    frequency: "weekly",
    createdAt: "2026-06-15T09:00:00Z",
    updatedAt: "2026-07-06T09:00:00Z",
    history: createHistory("kpi-atlas-adoption", [
      { changedAt: "2026-06-15", newValue: 42, changedBy: "Maya", changeReason: "Initial baseline" },
      { changedAt: "2026-06-22", newValue: 51, changedBy: "Maya", changeReason: "Pilot teams onboarded" },
      { changedAt: "2026-06-29", newValue: 62, changedBy: "Ari", changeReason: "In-product prompts released" },
      { changedAt: "2026-07-06", newValue: 73, changedBy: "Ari", changeReason: "Sales enablement rollout" }
    ])
  },
  {
    id: "kpi-atlas-nps",
    projectId: "project-atlas",
    name: "Pilot NPS",
    currentValue: 48,
    targetValue: 55,
    unit: "points",
    frequency: "weekly",
    createdAt: "2026-06-15T09:00:00Z",
    updatedAt: "2026-07-06T09:00:00Z",
    history: createHistory("kpi-atlas-nps", [
      { changedAt: "2026-06-15", newValue: 36, changedBy: "Maya", changeReason: "Initial survey" },
      { changedAt: "2026-06-29", newValue: 42, changedBy: "Maya", changeReason: "Navigation improvements" },
      { changedAt: "2026-07-06", newValue: 48, changedBy: "Ari", changeReason: "Dashboard performance fix" }
    ])
  },
  {
    id: "kpi-atlas-uptime",
    projectId: "project-atlas",
    name: "Platform uptime",
    currentValue: 99.95,
    targetValue: 99.9,
    unit: "%",
    frequency: "daily",
    createdAt: "2026-06-15T09:00:00Z",
    updatedAt: "2026-07-06T09:00:00Z",
    history: createHistory("kpi-atlas-uptime", [
      { changedAt: "2026-06-15", newValue: 99.7, changedBy: "Devon", changeReason: "Baseline release" },
      { changedAt: "2026-06-29", newValue: 99.9, changedBy: "Devon", changeReason: "Caching enabled" },
      { changedAt: "2026-07-06", newValue: 99.95, changedBy: "Devon", changeReason: "Alert tuning complete" }
    ])
  },
  {
    id: "kpi-orbit-activation",
    projectId: "project-orbit",
    name: "Seven-day activation",
    currentValue: 64,
    targetValue: 70,
    unit: "%",
    frequency: "weekly",
    createdAt: "2026-06-15T09:00:00Z",
    updatedAt: "2026-07-06T09:00:00Z",
    history: createHistory("kpi-orbit-activation", [
      { changedAt: "2026-06-15", newValue: 53, changedBy: "Sam", changeReason: "Baseline cohort" },
      { changedAt: "2026-06-29", newValue: 59, changedBy: "Sam", changeReason: "Checklist redesign" },
      { changedAt: "2026-07-06", newValue: 64, changedBy: "Sam", changeReason: "Welcome email experiment" }
    ])
  },
  {
    id: "kpi-orbit-retention",
    projectId: "project-orbit",
    name: "Month-one retention",
    currentValue: 38,
    targetValue: 45,
    unit: "%",
    frequency: "monthly",
    createdAt: "2026-06-15T09:00:00Z",
    updatedAt: "2026-07-06T09:00:00Z",
    history: createHistory("kpi-orbit-retention", [
      { changedAt: "2026-06-15", newValue: 32, changedBy: "Sam", changeReason: "Baseline cohort" },
      { changedAt: "2026-06-29", newValue: 35, changedBy: "Sam", changeReason: "Lifecycle messages refreshed" },
      { changedAt: "2026-07-06", newValue: 38, changedBy: "Sam", changeReason: "In-app help launch" }
    ])
  }
];
