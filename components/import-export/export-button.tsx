"use client";

import { exportCollection } from "@/actions/import-export";
import { Button } from "@/components/ui/button";
import { FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true);
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
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => handleExport("csv")}
        disabled={isExporting}
        className="gap-2"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        Export CSV
      </Button>
      <Button
        variant="outline"
        onClick={() => handleExport("json")}
        disabled={isExporting}
        className="gap-2"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileJson className="w-4 h-4" />
        )}
        Export JSON
      </Button>
    </div>
  );
}
