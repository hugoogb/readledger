"use client";

import { bulkSetRead } from "@/actions/volumes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { useToggleSet } from "@/hooks/use-toggle-set";
import type { Volume } from "@/lib/generated/prisma/browser";
import { BookMarked, Check, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type BulkSetReadModalProps = {
  volumes: Volume[];
};

export function BulkSetReadModal({ volumes }: BulkSetReadModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const unreadVolumes = volumes.filter((v) => v.owned && !v.read);
  const {
    set: selectedIds,
    toggle,
    selectAll,
    clear,
    selectUpTo,
    size: selectedCount,
    has,
  } = useToggleSet<string>();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      clear();
    }
  };

  const handleSelectUpTo = (volumeNumber: number) => {
    selectUpTo(
      unreadVolumes.map((v) => v.id),
      (id) => {
        const vol = unreadVolumes.find((v) => v.id === id);
        return vol ? vol.volumeNumber <= volumeNumber : false;
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsLoading(true);

    try {
      await bulkSetRead(ids);
      toast.success(`${ids.length} volumes marked as read`);
      router.refresh();
      handleOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update volumes",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique volume numbers for quick select
  const quickSelectNumbers = [
    ...new Set(unreadVolumes.map((v) => v.volumeNumber)),
  ]
    .sort((a, b) => a - b)
    .slice(0, 8);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => handleOpenChange(true)}
        disabled={unreadVolumes.length === 0}
        className="gap-2 hover:border-success/50 hover:bg-success/5 hover:text-success"
      >
        <BookMarked className="w-4 h-4" />
        Bulk Set Read
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => handleOpenChange(false)}
        title="Bulk Set as Read"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Volume Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="mb-0">Select Volumes to Mark as Read</Label>
              <div className="flex items-center gap-3">
                <Badge variant="success" size="sm">
                  {selectedCount} selected
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="link"
                    type="button"
                    onClick={() => selectAll(unreadVolumes.map((v) => v.id))}
                    className="h-auto p-0 text-xs font-medium text-success hover:text-success/80"
                  >
                    Select All
                  </Button>
                  <span className="text-foreground-muted/30">|</span>
                  <Button
                    variant="link"
                    type="button"
                    onClick={clear}
                    className="h-auto p-0 text-xs font-medium text-foreground-muted hover:text-foreground"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto border border-border rounded-xl p-3 bg-background-tertiary/50">
              <div className="flex flex-wrap gap-2">
                {unreadVolumes.length > 0 ? (
                  unreadVolumes.map((volume) => (
                    <Button
                      key={volume.id}
                      type="button"
                      variant={has(volume.id) ? "success" : "outline"}
                      onClick={() => toggle(volume.id)}
                      className={`
                        min-w-10 h-10 px-0 rounded-lg text-sm font-semibold
                        ${
                          has(volume.id)
                            ? "ring-2 ring-success ring-offset-2 ring-offset-background-tertiary shadow-lg"
                            : "hover:border-success/50 hover:bg-success/5"
                        }
                      `}
                    >
                      {volume.volumeNumber}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-foreground-muted py-2">
                    All owned volumes are already read!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Select */}
          {quickSelectNumbers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-success" />
                <Label className="mb-0">
                  Quick Select: Read up to volume...
                </Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickSelectNumbers.map((num) => (
                  <Button
                    key={num}
                    type="button"
                    variant="outline"
                    onClick={() => handleSelectUpTo(num)}
                    className="hover:border-success/50 hover:bg-success/5 hover:text-success"
                  >
                    Up to #{num}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={isLoading || selectedCount === 0}
              className="flex-1 gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Mark {selectedCount} as Read
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
