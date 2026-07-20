export type KpiFrequency = "daily" | "weekly" | "monthly";
export type MemorySourceType = "project" | "kpi" | "chat";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Kpi {
  id: string;
  projectId: string;
  name: string;
  targetValue: number;
  currentValue: number;
  unit: string | null;
  frequency: KpiFrequency;
  createdAt: string;
  updatedAt: string;
  history?: KpiHistory[];
}

export interface KpiHistory {
  id: string;
  kpiId: string;
  oldValue: number;
  newValue: number;
  changedBy: string;
  changeReason: string;
  changedAt: string;
}

export interface MemoryVector {
  id: string;
  sourceType: MemorySourceType;
  sourceId: string;
  contentText: string;
  embedding: number[];
  createdAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface CreateKpiRequest {
  name: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  frequency: KpiFrequency;
}

export interface UpdateKpiValueRequest {
  currentValue: number;
  changedBy: string;
  changeReason: string;
}

export interface ApiRoutes {
  "GET /projects": { response: Project[] };
  "POST /projects": { body: CreateProjectRequest; response: Project };
  "GET /projects/{id}/kpis": { response: Kpi[] };
  "POST /projects/{id}/kpis": { body: CreateKpiRequest; response: Kpi };
  "PATCH /kpis/{id}/value": { body: UpdateKpiValueRequest; response: Kpi };
}
