"use client";

import { useMemo, useState } from "react";

import { KpiHistoryChart } from "@/components/kpi-history-chart";
import { Spinner } from "@/components/spinner";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { Kpi } from "@ai-pm/shared";

export default function DashboardPage() {
  const { projects, kpis, loading, error, refresh, updateKpi } =
    useDashboardData();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const primaryProject = projects[0];
  const projectKpis = useMemo(
    () =>
      primaryProject
        ? kpis.filter((kpi) => kpi.projectId === primaryProject.id)
        : [],
    [kpis, primaryProject]
  );
  const featuredKpi = projectKpis[0];

  async function handleUpdate(kpi: Kpi) {
    const valueInput = window.prompt(
      `New value for "${kpi.name}"? (current: ${kpi.currentValue})`
    );
    if (valueInput === null) return;
    const next = Number(valueInput);
    if (!Number.isFinite(next)) {
      window.alert("Please enter a numeric value.");
      return;
    }
    const reason = window.prompt(`Reason for changing "${kpi.name}" to ${next}?`);
    if (reason === null) return;
    const trimmed = reason.trim();
    if (trimmed === "") {
      window.alert("A change reason is required.");
      return;
    }

    setUpdatingId(kpi.id);
    try {
      await updateKpi(kpi.id, next, trimmed);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to update KPI value."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <section className="mx-auto max-w-6xl">
        <div
          role="alert"
          className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-sm text-indigo-900"
        >
          <p className="font-semibold">Couldn’t load the dashboard.</p>
          <p className="mt-1 text-indigo-700">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-4 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section className="mx-auto max-w-6xl">
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
          No projects yet. Create one via <code>POST /projects</code> to get
          started.
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Portfolio overview</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Every KPI movement retains its author and reason.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="font-semibold text-slate-900">{project.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {project.description}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-5">
            <p className="text-sm font-medium text-indigo-600">
              {primaryProject.name}
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              {featuredKpi ? featuredKpi.name : "No KPIs yet"}
            </h2>
          </div>
          {featuredKpi ? (
            <KpiHistoryChart data={featuredKpi.history ?? []} />
          ) : (
            <p className="text-sm text-slate-500">
              Add a KPI to see its history chart here.
            </p>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Current KPIs</h2>
          <div className="mt-4 space-y-4">
            {projectKpis.length === 0 ? (
              <p className="text-sm text-slate-500">
                No KPIs for {primaryProject.name} yet.
              </p>
            ) : (
              projectKpis.map((kpi) => (
                <KpiRow
                  key={kpi.id}
                  kpi={kpi}
                  saving={updatingId === kpi.id}
                  onUpdate={() => void handleUpdate(kpi)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

interface KpiRowProps {
  kpi: Kpi;
  saving: boolean;
  onUpdate: () => void;
}

function KpiRow({ kpi, saving, onUpdate }: KpiRowProps) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-600">{kpi.name}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {kpi.currentValue} {kpi.unit}
          </p>
          <p className="text-xs text-slate-500">
            Target: {kpi.targetValue} {kpi.unit}
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={onUpdate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Spinner className="h-3.5 w-3.5" />}
          {saving ? "Saving…" : "Update value"}
        </button>
      </div>
    </div>
  );
}

/** Skeleton placeholder shown while dashboard data is loading. */
function DashboardSkeleton() {
  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-8 space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
          />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    </section>
  );
}
