"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import type { BulkImportItem, KpiFrequency } from "@ai-pm/shared";

interface ExcelUploaderProps {
  onImport: (items: BulkImportItem[]) => Promise<void>;
}

export function ExcelUploader({ onImport }: ExcelUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet);

      const items: BulkImportItem[] = [];

      for (const row of rows) {
        // Normalize keys by lowercasing and trimming
        const getVal = (keyNames: string[]) => {
          const foundKey = Object.keys(row).find((k) =>
            keyNames.includes(k.toLowerCase().trim())
          );
          return foundKey ? row[foundKey] : undefined;
        };

        const projectName = getVal(["project", "project name"]);
        const kpiName = getVal(["kpi", "kpi name", "metric"]);
        const targetValue = Number(getVal(["target", "target value"]));
        const currentValue = Number(getVal(["current", "current value", "value"]));
        const unit = getVal(["unit", "metric unit"]);
        let frequency = getVal(["frequency", "freq"])?.toLowerCase() as KpiFrequency;

        if (!["daily", "weekly", "monthly"].includes(frequency)) {
          frequency = "monthly";
        }

        if (projectName && kpiName && !isNaN(targetValue) && !isNaN(currentValue)) {
          items.push({
            projectName: String(projectName).trim(),
            projectDescription: getVal(["project description", "description"]),
            kpiName: String(kpiName).trim(),
            targetValue,
            currentValue,
            unit: unit ? String(unit).trim() : undefined,
            frequency,
          });
        }
      }

      if (items.length === 0) {
        alert("No valid rows found. Please ensure columns include: Project Name, KPI Name, Target Value, Current Value.");
        return;
      }

      await onImport(items);
    } catch (err) {
      alert("Failed to process Excel file. " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        isDragging
          ? "border-indigo-500 bg-indigo-50"
          : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            void handleProcessFile(e.target.files[0]);
          }
        }}
        className="hidden"
        accept=".xlsx, .xls, .csv"
      />
      {loading ? (
        <p className="text-sm font-medium text-slate-600">Processing file...</p>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-900">
            Click to upload or drag and drop
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Excel or CSV (Must include Project Name, KPI Name, Target Value, Current Value)
          </p>
        </>
      )}
    </div>
  );
}
