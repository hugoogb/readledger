"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Loader2, BookMarked, Check, Sparkles } from "lucide-react";
import { Volume } from "@/lib/generated/prisma/client";
import { updateVolume } from "@/actions/volumes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type BulkSetReadModalProps = {
  volumes: Volume[];
};

export function BulkSetReadModal({ volumes }: BulkSetReadModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadVolumes = volumes.filter((v) => v.owned && !v.read);

  const [selectedVolumeIds, setSelectedVolumeIds] = useState<Set<string>>(
    new Set(),
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedVolumeIds(new Set());
      setError(null);
    }
  };

  const toggleVolume = (volumeId: string) => {
    const newSet = new Set(selectedVolumeIds);
    if (newSet.has(volumeId)) {
      newSet.delete(volumeId);
    } else {
      newSet.add(volumeId);
    }
    setSelectedVolumeIds(newSet);
  };

  const selectAll = () => {
    setSelectedVolumeIds(new Set(unreadVolumes.map((v) => v.id)));
  };

  const deselectAll = () => {
    setSelectedVolumeIds(new Set());
  };

  const selectUpTo = (volumeNumber: number) => {
    const volumesToSelect = unreadVolumes
      .filter((v) => v.volumeNumber <= volumeNumber)
      .map((v) => v.id);
    setSelectedVolumeIds(new Set(volumesToSelect));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVolumeIds.size === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const promises = Array.from(selectedVolumeIds).map((volumeId) =>
        updateVolume(volumeId, {
          read: true,
          readDate: new Date(),
        }),
      );

      await Promise.all(promises);
      router.refresh();
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update volumes");
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
              <Label className="mb-0">
                Select Volumes to Mark as Read
              </Label>
              <div className="flex items-center gap-3">
                <Badge variant="success" size="sm">
                  {selectedVolumeIds.size} selected
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="link"
                    type="button"
                    onClick={selectAll}
                    className="h-auto p-0 text-xs font-medium text-success hover:text-success/80"
                  >
                    Select All
                  </Button>
                  <span className="text-foreground-muted/30">|</span>
                  <Button
                    variant="link"
                    type="button"
                    onClick={deselectAll}
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
                      variant={selectedVolumeIds.has(volume.id) ? "success" : "outline"}
                      onClick={() => toggleVolume(volume.id)}
                      className={`
                        min-w-[40px] h-10 px-0 rounded-lg text-sm font-semibold
                        ${selectedVolumeIds.has(volume.id)
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
                    📚 All owned volumes are already read!
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
                    onClick={() => selectUpTo(num)}
                    className="hover:border-success/50 hover:bg-success/5 hover:text-success"
                  >
                    Up to #{num}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
              <span>⚠️</span>
              {error}
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
              disabled={isLoading || selectedVolumeIds.size === 0}
              className="flex-1 gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Mark {selectedVolumeIds.size} as Read
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
