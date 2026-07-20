"use client";

import { useCallback, useEffect, useState } from "react";
import type { Kpi, Project } from "@ai-pm/shared";

import { getProjectKpis, getProjects, updateKpiValue } from "@/lib/api";

interface DashboardDataState {
  projects: Project[];
  kpis: Kpi[];
  loading: boolean;
  error: string | null;
  /** Refresh projects + the first project's KPIs. */
  refresh: () => void;
  /**
   * Update a KPI's current value and append the resulting history row.
   * Throws on failure so the caller can surface the message.
   */
  updateKpi: (
    kpiId: string,
    currentValue: number,
    changeReason: string
  ) => Promise<void>;
}

/**
 * Loads projects and the first project's KPIs for the dashboard, and exposes
 * `updateKpi` which performs the PATCH and merges the response into local
 * state WITHOUT replacing any KPI wholesale.
 *
 * The backend PATCH response contains only the single newly-created history
 * row in `history`. To preserve the chart's full series we:
 *   - copy `currentValue` and `updatedAt` from the response, and
 *   - append `response.history[0]` to the KPI's existing history array.
 */
export function useDashboardData(): DashboardDataState {
  const [projects, setProjects] = useState<Project[]>([]);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects);
      if (fetchedProjects.length > 0) {
        const fetchedKpis = await getProjectKpis(fetchedProjects[0].id);
        setKpis(fetchedKpis);
      } else {
        setKpis([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateKpi = useCallback(
    async (kpiId: string, currentValue: number, changeReason: string) => {
      // TODO(auth): replace with the authenticated user once auth exists.
      const updated = await updateKpiValue(kpiId, {
        currentValue,
        changedBy: "web-user",
        changeReason
      });

      const newRow = updated.history?.[0];
      setKpis((prev) =>
        prev.map((kpi) =>
          kpi.id === kpiId
            ? {
                ...kpi,
                currentValue: updated.currentValue,
                updatedAt: updated.updatedAt,
                history: newRow
                  ? [...(kpi.history ?? []), newRow]
                  : (kpi.history ?? [])
              }
            : kpi
        )
      );
    },
    []
  );

  return { projects, kpis, loading, error, refresh: load, updateKpi };
}
