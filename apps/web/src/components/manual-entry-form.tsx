"use client";

import { useState } from "react";
import { Plus, Target, CheckCircle2 } from "lucide-react";
import type { Project } from "@shared/types/api";

export function ManualEntryForm({
  onCreated,
  projects
}: {
  onCreated: () => void;
  projects: Project[];
}) {
  const [projectMode, setProjectMode] = useState<"new" | "existing">("new");
  
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectId, setProjectId] = useState("");
  
  const [kpiName, setKpiName] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [unit, setUnit] = useState("");
  const [freq, setFreq] = useState<"daily" | "weekly" | "monthly">("weekly");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setProjectName("");
    setProjectDesc("");
    setKpiName("");
    setTargetValue("");
    setCurrentValue("");
    setUnit("");
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let finalProjectId = projectId;

      if (projectMode === "new") {
        if (!projectName) throw new Error("Project name required");
        const res = await fetch("https://backend-jarvis-2bpk.onrender.com/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: projectName, description: projectDesc })
        });
        if (!res.ok) throw new Error("Failed to create project");
        const p = await res.json();
        finalProjectId = p.id;
      }

      if (kpiName) {
        if (!finalProjectId) throw new Error("Select a project first");
        const kpiRes = await fetch(`https://backend-jarvis-2bpk.onrender.com/projects/${finalProjectId}/kpis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: kpiName,
            targetValue: Number(targetValue),
            currentValue: Number(currentValue),
            unit,
            frequency: freq
          })
        });
        if (!kpiRes.ok) throw new Error("Failed to create KPI");
      }

      setSuccess("Created successfully!");
      resetForm();
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Plus className="text-primary w-5 h-5" />
          Add Data Manually
        </h3>
        <div className="flex gap-2 p-1 bg-muted/30 rounded-lg">
          <button 
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${projectMode === "new" ? "bg-primary text-white shadow" : "text-mutedForeground hover:bg-muted/50"}`}
            onClick={() => setProjectMode("new")}
          >
            New Project
          </button>
          <button 
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${projectMode === "existing" ? "bg-primary text-white shadow" : "text-mutedForeground hover:bg-muted/50"}`}
            onClick={() => setProjectMode("existing")}
          >
            Existing Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Project Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">1</div>
            <h4 className="font-semibold text-lg text-foreground">Project Info</h4>
          </div>
          
          {projectMode === "new" ? (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-mutedForeground">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jarvis Alpha"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-background/50 border border-border/60 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-mutedForeground/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-mutedForeground">Description (optional)</label>
                <textarea
                  placeholder="What is this project about?"
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full bg-background/50 border border-border/60 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none h-24 placeholder:text-mutedForeground/50"
                />
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <label className="text-sm font-medium text-mutedForeground">Select Project</label>
              <select 
                value={projectId} 
                onChange={e => setProjectId(e.target.value)}
                className="w-full bg-background/50 border border-border/60 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled className="text-mutedForeground">-- Choose a project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* KPI Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">2</div>
            <h4 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Initial KPI (Optional)
            </h4>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-mutedForeground">KPI Name</label>
            <input
              type="text"
              placeholder="e.g. Server Uptime"
              value={kpiName}
              onChange={(e) => setKpiName(e.target.value)}
              className="w-full bg-background/50 border border-border/60 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-mutedForeground/50"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-mutedForeground">Target Value</label>
              <input
                type="number"
                placeholder="e.g. 99.9"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full bg-background/50 border border-border/60 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-mutedForeground/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-mutedForeground">Current Value</label>
              <input
                type="number"
                placeholder="e.g. 95.0"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full bg-background/50 border border-border/60 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-mutedForeground/50"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-mutedForeground">Unit</label>
              <input
                type="text"
                placeholder="e.g. %"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-background/50 border border-border/60 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-mutedForeground/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-mutedForeground">Frequency</label>
              <select
                value={freq}
                onChange={(e) => setFreq(e.target.value as any)}
                className="w-full bg-background/50 border border-border/60 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          {error && <p className="text-red-400 text-sm bg-red-400/10 px-3 py-1.5 rounded-md border border-red-400/20 inline-block">{error}</p>}
          {success && <p className="text-green-400 text-sm bg-green-400/10 px-3 py-1.5 rounded-md border border-green-400/20 flex items-center gap-2 inline-flex"><CheckCircle2 className="w-4 h-4"/>{success}</p>}
        </div>
        <button 
          onClick={handleCreate}
          disabled={loading || (projectMode === "new" && !projectName) || (projectMode === "existing" && !projectId)}
          className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primaryHover text-white font-semibold rounded-lg transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>Create Entry</>
          )}
        </button>
      </div>
    </div>
  );
}
