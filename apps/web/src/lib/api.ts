import type {
  CreateKpiRequest,
  CreateProjectRequest,
  Kpi,
  Project,
  UpdateKpiValueRequest
} from "@ai-pm/shared";

/**
 * Base URL of the FastAPI backend. Override in production via the
 * `NEXT_PUBLIC_API_BASE_URL` env var; defaults to the local dev server.
 */
const API_BASE_URL =
 const API_BASE_URL = "https://backend-jarvis-2bpk.onrender.com";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json"
} as const;

/**
 * Wrap a non-2xx fetch response in a typed Error whose message includes the
 * status and any text the server returned, so callers can surface a useful
 * message to the user.
 */
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

/**
 * GET /projects — list all projects.
 */
export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    headers: JSON_HEADERS,
    cache: "no-store"
  });
  await assertOk(res);
  return (await res.json()) as Project[];
}

/**
 * POST /projects — create a project.
 */
export async function createProject(
  body: CreateProjectRequest
): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body)
  });
  await assertOk(res);
  return (await res.json()) as Project;
}

/**
 * GET /projects/{id}/kpis — list KPIs for a project (each with its history).
 */
export async function getProjectKpis(projectId: string): Promise<Kpi[]> {
  const res = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/kpis`,
    { headers: JSON_HEADERS, cache: "no-store" }
  );
  await assertOk(res);
  return (await res.json()) as Kpi[];
}

/**
 * POST /projects/{id}/kpis — create a KPI under a project.
 */
export async function createKpi(
  projectId: string,
  body: CreateKpiRequest
): Promise<Kpi> {
  const res = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/kpis`,
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body)
    }
  );
  await assertOk(res);
  return (await res.json()) as Kpi;
}

/**
 * PATCH /kpis/{id}/value — update a KPI's current value.
 *
 * NOTE: the backend response carries ONLY the newly-created history row in
 * `history` (not the full series). Callers must merge the response into their
 * local state — take `currentValue`/`updatedAt` and append `history[0]` to
 * the existing history array. Replacing the KPI wholesale collapses the chart
 * to a single point.
 */
export async function updateKpiValue(
  kpiId: string,
  body: UpdateKpiValueRequest
): Promise<Kpi> {
  const res = await fetch(
    `${API_BASE_URL}/kpis/${encodeURIComponent(kpiId)}/value`,
    {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(body)
    }
  );
  await assertOk(res);
  return (await res.json()) as Kpi;
}
