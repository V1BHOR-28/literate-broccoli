export type KpiFrequency = "daily" | "weekly" | "monthly";
export type MemorySourceType = "project" | "kpi" | "chat";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Kpi {
  id: string;
  project_id: string;
  name: string;
  target_value: number;
  current_value: number;
  unit: string | null;
  frequency: KpiFrequency;
  created_at: string;
  updated_at: string;
}

export interface KpiHistory {
  id: string;
  kpi_id: string;
  old_value: number;
  new_value: number;
  changed_by: string;
  change_reason: string;
  changed_at: string;
}

export interface MemoryVector {
  id: string;
  source_type: MemorySourceType;
  source_id: string;
  content_text: string;
  embedding: number[];
  created_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface CreateKpiRequest {
  name: string;
  target_value: number;
  current_value: number;
  unit?: string;
  frequency: KpiFrequency;
}

export interface UpdateKpiValueRequest {
  current_value: number;
  changed_by: string;
  change_reason: string;
}

export interface ApiRoutes {
  "GET /projects": { response: Project[] };
  "POST /projects": { body: CreateProjectRequest; response: Project };
  "GET /projects/{id}/kpis": { response: Kpi[] };
  "POST /projects/{id}/kpis": { body: CreateKpiRequest; response: Kpi };
  "PATCH /kpis/{id}/value": { body: UpdateKpiValueRequest; response: Kpi };
}
