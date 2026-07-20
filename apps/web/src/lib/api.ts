import type {
  CreateKpiRequest,
  CreateProjectRequest,
  Kpi,
  Project,
  UpdateKpiValueRequest
} from "@ai-pm/shared";

const API_BASE_URL = "https://backend-jarvis-2bpk.onrender.com";

const JSON_HEADERS = {
  Accept: "application/json"
} as const;

async function assertOk(response: Response): Promise<void> {
  if (response.ok) return;
  let detail = "";
  try {
    detail = await response.text();
  } catch {
    detail = "";
  }
  const trimmed = detail.trim();
  const message = trimmed
    ? `Request failed (${response.status}): ${trimmed}`
    : `Request failed (${response.status})`;
  throw new Error(message);
}

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    headers: JSON_HEADERS,
    cache: "no-store"
  });
  await assertOk(res);
  return (await res.json()) as Project[];
}

export async function createProject(
  body: CreateProjectRequest
): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: { ...JSON_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  await assertOk(res);
  return (await res.json()) as Project;
}

export async function getProjectKpis(projectId: string): Promise<Kpi[]> {
  const res = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/kpis`,
    { headers: JSON_HEADERS, cache: "no-store" }
  );
  await assertOk(res);
  return (await res.json()) as Kpi[];
}

export async function createKpi(
  projectId: string,
  body: CreateKpiRequest
): Promise<Kpi> {
  const res = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/kpis`,
    {
      method: "POST",
      headers: { ...JSON_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );
  await assertOk(res);
  return (await res.json()) as Kpi;
}

export async function updateKpiValue(
  kpiId: string,
  body: UpdateKpiValueRequest
): Promise<Kpi> {
  const res = await fetch(
    `${API_BASE_URL}/kpis/${encodeURIComponent(kpiId)}/value`,
    {
      method: "PATCH",
      headers: { ...JSON_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );
  await assertOk(res);
  return (await res.json()) as Kpi;
}