"use client";

import { bulkSetRead } from "@/actions/volumes";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { useToggleSet } from "@/hooks/use-toggle-set";
import type { Volume } from "@/lib/generated/prisma/browser";
import { BookMarked, Calendar, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { todayInputValue } from "@/utils/date";
import { unwrap } from "@/lib/unwrap";
import { errorMessage } from "@/lib/utils";
import { VolumePicker } from "./volume-picker";

type BulkSetReadModalProps = {
  volumes: Volume[];
};

export function BulkSetReadModal({ volumes }: BulkSetReadModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [readDate, setReadDate] = useState(todayInputValue);

  const unreadVolumes = volumes.filter((v) => v.owned && !v.read);
  const {
    set: selectedIds,
    toggle,
    selectAll,
    clear,
    size: selectedCount,
    has,
  } = useToggleSet<string>();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setReadDate(todayInputValue());
    } else {
      clear();
    }
  };

  const handleSelectUpTo = (volumeNumber: number) =>
    selectAll(unreadVolumes.filter((v) => v.volumeNumber <= volumeNumber).map((v) => v.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsLoading(true);

    try {
      unwrap(await bulkSetRead(ids, readDate ? new Date(readDate) : undefined));
      toast.success(`${ids.length} volumes marked as read`);
      router.refresh();
      handleOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update volumes"));
    } finally {
      setIsLoading(false);
    }
  };

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
          <VolumePicker
            label="Select Volumes to Mark as Read"
            volumes={unreadVolumes}
            isSelected={has}
            selectedCount={selectedCount}
            onToggle={toggle}
            onSelectAll={() => selectAll(unreadVolumes.map((v) => v.id))}
            onClear={clear}
            emptyText="All owned volumes are already read!"
            tone="success"
            maxHeight="max-h-48"
          />

          {quickSelectNumbers.length > 0 && (
            <div>
              <div className="mb-3">
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

          <FormField
            label="Read On"
            htmlFor="bulkReadDate"
          >
            <Input
              id="bulkReadDate"
              type="date"
              value={readDate}
              onChange={(e) => setReadDate(e.target.value)}
              icon={<Calendar className="w-4 h-4" />}
            />
            <p className="text-xs text-foreground-muted mt-1">
              Backdate this if you read them earlier — it keeps your reading
              history accurate.
            </p>
          </FormField>

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
              loading={isLoading}
              disabled={selectedCount === 0}
              className="flex-1 gap-2"
            >
              {!isLoading && <Check className="w-4 h-4" />}
              Mark {selectedCount} as Read
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
