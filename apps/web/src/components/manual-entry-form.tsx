"use client";

import { useState } from "react";
import { createProject, createKpi } from "@/lib/api";
import type { Project } from "@ai-pm/shared";

interface ManualEntryFormProps {
  projects: Project[];
  onCreated: () => void;
}

export function ManualEntryForm({ projects, onCreated }: ManualEntryFormProps) {
  const [loading, setLoading] = useState(false);
  
  // Project State
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  
  // KPI State
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "");
  const [kpiName, setKpiName] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [unit, setUnit] = useState("");

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;
    setLoading(true);
    try {
      await createProject({ name: newProjectName, description: newProjectDesc });
      setNewProjectName("");
      setNewProjectDesc("");
      onCreated();
    } catch (err) {
      alert("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !kpiName || !targetValue || !currentValue) return;
    setLoading(true);
    try {
      await createKpi(selectedProjectId, {
        name: kpiName,
        targetValue: Number(targetValue),
        currentValue: Number(currentValue),
        unit: unit || undefined,
        frequency: "monthly",
      });
      setKpiName("");
      setTargetValue("");
      setCurrentValue("");
      setUnit("");
      onCreated();
    } catch (err) {
      alert("Failed to create KPI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Create Project */}
      <form onSubmit={handleCreateProject} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">Manual Entry: Project</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700">Project Name</label>
            <input
              type="text"
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">Description</label>
            <textarea
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              rows={2}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Create Project
          </button>
        </div>
      </form>

      {/* Create KPI */}
      <form onSubmit={handleCreateKpi} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4">Manual Entry: KPI</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700">Select Project</label>
            <select
              required
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            >
              <option value="" disabled>Select a project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">KPI Name</label>
            <input
              type="text"
              required
              value={kpiName}
              onChange={(e) => setKpiName(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">Target Value</label>
              <input
                type="number"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Current Value</label>
              <input
                type="number"
                required
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">Unit (optional)</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="e.g. $, %, users"
            />
          </div>
          <button
            type="submit"
            disabled={loading || projects.length === 0}
            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Create KPI
          </button>
        </div>
      </form>
    </div>
  );
}
