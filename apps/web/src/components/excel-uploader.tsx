"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2, FileSpreadsheet, Loader2 } from "lucide-react";

export function ExcelUploader({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpload = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("https://backend-jarvis-2bpk.onrender.com/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "text/tab-separated-values" },
        body: data
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Import failed");
      }
      setSuccess("Excel data imported successfully!");
      setData("");
      onUploadComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <UploadCloud className="text-primary w-5 h-5" />
        <h3 className="text-xl font-bold text-foreground">Import from Excel</h3>
      </div>
      
      <p className="text-mutedForeground text-sm">
        Copy your rows from Excel or Google Sheets and paste them below. 
        Expected columns: <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs">ProjectName</code>, <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs">ProjectDesc</code>, <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs">KPIName</code>, <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs">Target</code>, <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs">Current</code>, <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs">Unit</code>, <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs">Frequency</code>.
      </p>
      
      <div className="relative group">
        <textarea
          placeholder="Paste TSV data here..."
          value={data}
          onChange={e => setData(e.target.value)}
          className="w-full h-48 bg-background/50 border-2 border-dashed border-border/60 hover:border-primary/50 focus:border-primary/50 rounded-xl p-4 text-foreground text-sm font-mono focus:outline-none transition-all placeholder:text-mutedForeground/40 resize-none shadow-inner shadow-black/10"
        />
        {!data && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-mutedForeground/50">
            <FileSpreadsheet className="w-10 h-10 mb-2 opacity-30 group-hover:text-primary group-hover:opacity-100 transition-colors" />
            <span>Paste your rows here</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          {error && <p className="text-red-400 text-sm bg-red-400/10 px-3 py-1.5 rounded-md border border-red-400/20 inline-block">{error}</p>}
          {success && <p className="text-green-400 text-sm bg-green-400/10 px-3 py-1.5 rounded-md border border-green-400/20 flex items-center gap-2 inline-flex"><CheckCircle2 className="w-4 h-4"/>{success}</p>}
        </div>
        <button 
          onClick={handleUpload}
          disabled={loading || !data.trim()}
          className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primaryHover text-white font-semibold rounded-lg transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              Process Import
            </>
          )}
        </button>
      </div>
    </div>
  );
}
