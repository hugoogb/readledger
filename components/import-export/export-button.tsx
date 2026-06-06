"use client";

import { exportCollection } from "@/actions/import-export";
import { Button } from "@/components/ui/button";
import { FileJson, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ExportButton() {
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

  const handleExport = async (format: "csv" | "json") => {
    setExporting(format);
    try {
      const data = await exportCollection(format);
      const blob = new Blob([data], {
        type: format === "json" ? "application/json" : "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `readledger-export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Collection exported as ${format.toUpperCase()}`);
    } catch {
      toast.error("Failed to export collection");
    } finally {
      setExporting(null);
    }
  };

  const busy = exporting !== null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => handleExport("csv")}
        disabled={busy}
        loading={exporting === "csv"}
        className="gap-2"
      >
        {exporting !== "csv" && <FileSpreadsheet className="w-4 h-4" />}
        Export CSV
      </Button>
      <Button
        variant="outline"
        onClick={() => handleExport("json")}
        disabled={busy}
        loading={exporting === "json"}
        className="gap-2"
      >
        {exporting !== "json" && <FileJson className="w-4 h-4" />}
        Export JSON
      </Button>
    </div>
  );
}
