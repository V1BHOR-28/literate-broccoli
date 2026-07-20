import { KpiHistoryChart } from "@/components/kpi-history-chart";
import { mockKpis, mockProjects } from "@/data/mock";

export default function DashboardPage() {
  const primaryProject = mockProjects[0];
  const projectKpis = mockKpis.filter((kpi) => kpi.projectId === primaryProject.id);
  const featuredKpi = projectKpis[0];

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Portfolio overview</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        </div>
        <p className="text-sm text-slate-500">Every KPI movement retains its author and reason.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockProjects.map((project) => (
          <article key={project.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">{project.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{project.description}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-5">
            <p className="text-sm font-medium text-indigo-600">{primaryProject.name}</p>
            <h2 className="text-xl font-bold text-slate-900">{featuredKpi.name}</h2>
          </div>
          <KpiHistoryChart data={featuredKpi.history ?? []} />
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Current KPIs</h2>
          <div className="mt-4 space-y-4">
            {projectKpis.map((kpi) => (
              <div key={kpi.id} className="border-b border-slate-100 pb-4 last:border-0">
                <p className="text-sm text-slate-600">{kpi.name}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {kpi.currentValue} {kpi.unit}
                </p>
                <p className="text-xs text-slate-500">Target: {kpi.targetValue} {kpi.unit}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
