"use client";

import { useState } from "react";
import { KpiHistoryChart } from "@/components/kpi-history-chart";
import { Spinner } from "@/components/spinner";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { ManualEntryForm } from "@/components/manual-entry-form";
import { ExcelUploader } from "@/components/excel-uploader";
import { FolderKanban, Activity, UploadCloud, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { projects, loading, error, refresh } = useDashboardData();
  const [activeTab, setActiveTab] = useState<"manual" | "import">("manual");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FolderKanban className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Signalboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-mutedForeground">v0.4 Beta</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto p-4 md:p-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">Dashboard</h2>
            <p className="text-mutedForeground">Monitor your AI projects and KPIs in real-time.</p>
          </div>
          
          {/* Animated Tabs */}
          <div className="inline-flex items-center justify-center p-1 bg-card border border-border/50 rounded-xl shadow-sm backdrop-blur-sm">
            <button
              onClick={() => setActiveTab("manual")}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-lg",
                activeTab === "manual" 
                  ? "bg-primary text-white shadow-md" 
                  : "text-mutedForeground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <PlusCircle className="w-4 h-4" />
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-lg",
                activeTab === "import" 
                  ? "bg-primary text-white shadow-md" 
                  : "text-mutedForeground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <UploadCloud className="w-4 h-4" />
              Import Data
            </button>
          </div>
        </div>

        {/* Input Section - Glassmorphic Card */}
        <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-xl shadow-black/5 mb-10 animate-slide-up">
          {activeTab === "manual" ? (
            <ManualEntryForm onCreated={refresh} projects={projects} />
          ) : (
            <ExcelUploader onUploadComplete={refresh} />
          )}
        </div>

        {/* Projects Section */}
        <div className="mb-6">
          <h3 className="text-2xl font-semibold flex items-center gap-2 mb-6">
            <Activity className="text-primary w-6 h-6" />
            Active Projects
          </h3>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
              Failed to load projects: {error}
            </div>
          )}
          {loading && <Spinner />}
          {!loading && !error && projects.length === 0 && (
            <div className="text-center p-12 bg-card/30 rounded-2xl border border-dashed border-border text-mutedForeground">
              <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No projects found. Create one above to get started.</p>
            </div>
          )}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {projects.map((p) => (
            <div 
              key={p.id} 
              className="group bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-lg shadow-black/5 hover:border-primary/50 hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="p-6 border-b border-border/30 bg-card/40">
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{p.name}</h3>
                <p className="text-mutedForeground text-sm mt-1">{p.description || "No description"}</p>
              </div>
              <div className="p-6">
                {p.kpis?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {p.kpis.map((kpi) => (
                      <KpiHistoryChart key={kpi.id} kpi={kpi} onValueUpdated={refresh} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-mutedForeground/70 italic text-center py-4">No KPIs tracked yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
