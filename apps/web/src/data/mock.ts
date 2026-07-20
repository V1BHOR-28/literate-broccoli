export interface MockProject {
  id: string;
  name: string;
  description: string;
}

export interface MockKpiHistoryPoint {
  date: string;
  value: number;
  changedBy: string;
  changeReason: string;
}

export interface MockKpi {
  id: string;
  projectId: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  history: MockKpiHistoryPoint[];
}

export const mockProjects: MockProject[] = [
  {
    id: "project-atlas",
    name: "Project Atlas",
    description: "Launch the self-service analytics workspace."
  },
  {
    id: "project-orbit",
    name: "Project Orbit",
    description: "Improve onboarding activation and retention."
  }
];

export const mockKpis: MockKpi[] = [
  {
    id: "kpi-atlas-adoption",
    projectId: "project-atlas",
    name: "Weekly active teams",
    currentValue: 73,
    targetValue: 90,
    unit: "teams",
    history: [
      { date: "2026-06-15", value: 42, changedBy: "Maya", changeReason: "Initial baseline" },
      { date: "2026-06-22", value: 51, changedBy: "Maya", changeReason: "Pilot teams onboarded" },
      { date: "2026-06-29", value: 62, changedBy: "Ari", changeReason: "In-product prompts released" },
      { date: "2026-07-06", value: 73, changedBy: "Ari", changeReason: "Sales enablement rollout" }
    ]
  },
  {
    id: "kpi-atlas-nps",
    projectId: "project-atlas",
    name: "Pilot NPS",
    currentValue: 48,
    targetValue: 55,
    unit: "points",
    history: [
      { date: "2026-06-15", value: 36, changedBy: "Maya", changeReason: "Initial survey" },
      { date: "2026-06-29", value: 42, changedBy: "Maya", changeReason: "Navigation improvements" },
      { date: "2026-07-06", value: 48, changedBy: "Ari", changeReason: "Dashboard performance fix" }
    ]
  },
  {
    id: "kpi-atlas-uptime",
    projectId: "project-atlas",
    name: "Platform uptime",
    currentValue: 99.95,
    targetValue: 99.9,
    unit: "%",
    history: [
      { date: "2026-06-15", value: 99.7, changedBy: "Devon", changeReason: "Baseline release" },
      { date: "2026-06-29", value: 99.9, changedBy: "Devon", changeReason: "Caching enabled" },
      { date: "2026-07-06", value: 99.95, changedBy: "Devon", changeReason: "Alert tuning complete" }
    ]
  },
  {
    id: "kpi-orbit-activation",
    projectId: "project-orbit",
    name: "Seven-day activation",
    currentValue: 64,
    targetValue: 70,
    unit: "%",
    history: [
      { date: "2026-06-15", value: 53, changedBy: "Sam", changeReason: "Baseline cohort" },
      { date: "2026-06-29", value: 59, changedBy: "Sam", changeReason: "Checklist redesign" },
      { date: "2026-07-06", value: 64, changedBy: "Sam", changeReason: "Welcome email experiment" }
    ]
  },
  {
    id: "kpi-orbit-retention",
    projectId: "project-orbit",
    name: "Month-one retention",
    currentValue: 38,
    targetValue: 45,
    unit: "%",
    history: [
      { date: "2026-06-15", value: 32, changedBy: "Sam", changeReason: "Baseline cohort" },
      { date: "2026-06-29", value: 35, changedBy: "Sam", changeReason: "Lifecycle messages refreshed" },
      { date: "2026-07-06", value: 38, changedBy: "Sam", changeReason: "In-app help launch" }
    ]
  }
];
