"use client";

import { deleteReadingGoal, setReadingGoal } from "@/actions/reading";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { readingGoalSchema } from "@/lib/validations";
import { Target, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type GoalModalProps = {
  year: number;
  currentTarget: number | null;
  isOpen: boolean;
  onClose: () => void;
};

export function GoalModal({ year, currentTarget, isOpen, onClose }: GoalModalProps) {
  const router = useRouter();
  const [value, setValue] = useState(currentTarget?.toString() ?? "");
  const [error, setError] = useState<string>();
  const [isSaving, startSave] = useTransition();
  const [isRemoving, startRemove] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = readingGoalSchema.shape.target.safeParse(Number(value));
    if (!value || !parsed.success) {
      setError(parsed.error?.issues[0]?.message ?? "Enter a goal");
      return;
    }
    setError(undefined);

    startSave(async () => {
      try {
        await setReadingGoal(year, parsed.data);
        toast.success(`Goal for ${year} set to ${parsed.data} volumes`);
        router.refresh();
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save goal");
      }
    });
  };

  const handleRemove = () => {
    startRemove(async () => {
      try {
        await deleteReadingGoal(year);
        toast.success(`Goal for ${year} removed`);
        router.refresh();
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove goal");
      }
    });
  };

  const busy = isSaving || isRemoving;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reading goal for ${year}`} maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Volumes to read" htmlFor="goalTarget" error={error} required>
          <Input
            id="goalTarget"
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="60"
            icon={<Target className="w-4 h-4" />}
            error={!!error}
            autoFocus
          />
        </FormField>

        <div className="flex gap-3">
          {currentTarget !== null && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              loading={isRemoving}
              disabled={isSaving}
              className="px-3"
              aria-label="Remove goal"
            >
              {!isRemoving && <Trash2 className="w-5 h-5" />}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose} disabled={busy} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={isSaving} disabled={isRemoving} className="flex-1">
            Save goal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
