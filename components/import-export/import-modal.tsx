"use client";

import {
  importCollection,
  previewImport,
  type ImportPreview,
} from "@/actions/import-export";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  AlertCircle,
  Check,
  FileUp,
  Loader2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function ImportModal() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileData, setFileData] = useState<{
    content: string;
    format: "csv" | "json";
  } | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const format = file.name.endsWith(".json") ? "json" : "csv";
    const content = await file.text();

    setFileData({ content, format });
    setIsPreviewing(true);

    try {
      const result = await previewImport(content, format);
      setPreview(result);
    } catch {
      toast.error("Failed to parse file");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!fileData) return;

    setIsImporting(true);
    try {
      const result = await importCollection(fileData.content, fileData.format);
      toast.success(
        `Imported ${result.volumeCount} volumes across ${result.seriesCount} series`,
      );
      router.refresh();
      handleClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to import",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreview(null);
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
        <Upload className="w-4 h-4" />
        Import
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Import Collection">
        <div className="space-y-4">
          {/* File Upload */}
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
            <p className="font-medium">
              {fileData ? fileData.format.toUpperCase() + " file loaded" : "Click to upload CSV or JSON"}
            </p>
            <p className="text-sm text-foreground-muted mt-1">
              Accepts .csv and .json files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Preview loading */}
          {isPreviewing && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
              <span className="text-sm text-foreground-muted">Parsing file...</span>
            </div>
          )}

          {/* Preview results */}
          {preview && (
            <div className="space-y-3">
              {/* Stats */}
              <div className="flex gap-3">
                <Badge variant="default" className="gap-1">
                  {preview.seriesCount} series
                </Badge>
                <Badge variant="default" className="gap-1">
                  {preview.volumeCount} volumes
                </Badge>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-error font-medium text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {preview.errors.length} error{preview.errors.length !== 1 ? "s" : ""} found
                  </div>
                  <ul className="text-sm text-foreground-muted space-y-0.5 max-h-32 overflow-y-auto">
                    {preview.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                    {preview.errors.length > 10 && (
                      <li>... and {preview.errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Sample data */}
              {preview.rows.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-border rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-background-tertiary/50">
                        <th className="text-left px-3 py-2 font-medium">Series</th>
                        <th className="text-left px-3 py-2 font-medium">Vol</th>
                        <th className="text-left px-3 py-2 font-medium">Owned</th>
                        <th className="text-left px-3 py-2 font-medium">Read</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-3 py-1.5 truncate max-w-[200px]">
                            {row.seriesTitle}
                          </td>
                          <td className="px-3 py-1.5">{row.volumeNumber}</td>
                          <td className="px-3 py-1.5">{row.owned ? "Yes" : "No"}</td>
                          <td className="px-3 py-1.5">{row.read ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.rows.length > 20 && (
                    <p className="text-xs text-foreground-muted text-center py-2">
                      ... and {preview.rows.length - 20} more rows
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                isImporting ||
                !preview ||
                preview.errors.length > 0 ||
                preview.rows.length === 0
              }
              className="flex-1 gap-2"
            >
              {isImporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Import {preview?.volumeCount || 0} Volumes
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
