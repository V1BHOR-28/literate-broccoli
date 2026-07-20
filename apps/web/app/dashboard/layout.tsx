import type { ReactNode } from "react";

const navigation = ["Overview", "Projects", "KPI history", "Memory"];

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="w-full border-b border-slate-200 bg-slate-950 p-6 text-slate-100 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <p className="text-lg font-bold tracking-tight">Signalboard</p>
        <p className="mt-1 text-sm text-slate-400">AI project management</p>
        <nav className="mt-10 flex gap-2 md:block">
          {navigation.map((item) => (
            <span key={item} className="mb-2 block rounded-lg px-3 py-2 text-sm text-slate-300 first:bg-indigo-600 first:text-white">
              {item}
            </span>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
