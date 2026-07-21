export type KpiFrequency = "daily" | "weekly" | "monthly";
export type MemorySourceType = "project" | "kpi" | "kpi_history" | "chat" | "summary";
export type ChatRole = "user" | "assistant" | "system";

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

export interface ChatCitation {
  memoryId: string;
  sourceType: MemorySourceType;
  sourceId: string;
  kind: string;
  excerpt: string;
}

export interface LiveKpiSnapshot {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  unit: string | null;
  frequency: KpiFrequency;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  projectId: string;
  role: ChatRole;
  contentText: string;
  citations: ChatCitation[];
  createdAt: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  user?: string;
}

export interface ChatResponse {
  sessionId: string;
  messageId: string;
  answer: string;
  citations: ChatCitation[];
  liveKpis: LiveKpiSnapshot[];
}

export interface BulkImportItem {
  projectName: string;
  projectDescription?: string;
  kpiName: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  frequency: KpiFrequency;
}

export interface BulkImportRequest {
  items: BulkImportItem[];
}

export interface ApiRoutes {
  "GET /projects": { response: Project[] };
  "POST /projects": { body: CreateProjectRequest; response: Project };
  "POST /projects/bulk-import": { body: BulkImportRequest; response: { importedCount: number } };
  "GET /projects/{id}/kpis": { response: Kpi[] };
  "POST /projects/{id}/kpis": { body: CreateKpiRequest; response: Kpi };
  "PATCH /kpis/{id}/value": { body: UpdateKpiValueRequest; response: Kpi };
  "POST /projects/{id}/chat": { body: ChatRequest; response: ChatResponse };
}
