"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { Kpi } from "@ai-pm/shared";

export function KpiHistoryChart({ kpi, onValueUpdated }: { kpi: Kpi; onValueUpdated: () => void }) {
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Format data for Recharts (oldest first)
  const data = [...kpi.history].reverse().map((h) => ({
    time: new Date(h.changedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: h.newValue
  }));

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://backend-jarvis-2bpk.onrender.com/kpis/${kpi.id}/value`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newValue: Number(newValue),
          changedBy: "web-ui-user",
          changeReason: reason || "Manual update"
        })
      });
      if (!res.ok) throw new Error("Failed to update");
      setNewValue("");
      setReason("");
      setEditing(false);
      onValueUpdated();
    } catch (err) {
      console.error(err);
      alert("Failed to update KPI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background/40 p-4 border border-border/40 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="font-semibold text-foreground">{kpi.name}</h4>
          <div className="flex gap-2 text-xs mt-1">
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
              Target: {kpi.targetValue}{kpi.unit}
            </span>
            <span className="bg-muted text-mutedForeground px-2 py-0.5 rounded-full capitalize">
              {kpi.frequency}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            {kpi.currentValue}<span className="text-sm font-normal text-mutedForeground">{kpi.unit}</span>
          </div>
        </div>
      </div>
      
      <div className="h-32 mb-4 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#0f172a', stroke: '#3b82f6', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#0f172a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-mutedForeground/50 bg-muted/20 rounded-lg">
            Not enough data points
          </div>
        )}
      </div>

      {!editing ? (
        <button 
          onClick={() => setEditing(true)}
          className="w-full py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
        >
          Update Value
        </button>
      ) : (
        <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-border/50 animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="number"
              placeholder={`New Value (${kpi.unit || ''})`}
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              className="w-full bg-background/50 border border-border/60 rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-mutedForeground/50"
            />
            <input 
              type="text"
              placeholder="Reason for change"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-background/50 border border-border/60 rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-mutedForeground/50"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleUpdate}
              disabled={loading || !newValue}
              className="flex-1 bg-primary text-white text-sm font-medium py-1.5 rounded-md hover:bg-primaryHover disabled:opacity-50 transition-colors"
            >
              {loading ? "..." : "Save"}
            </button>
            <button 
              onClick={() => setEditing(false)}
              className="px-3 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
