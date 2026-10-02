"use client";

import { updateDisplayName } from "@/actions/user-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { unwrap } from "@/lib/unwrap";

/** Shown once to users who have never set a name (e.g. right after sign-up). */
export function NamePrompt() {
  const [name, setName] = useState("");
  const [pendingAction, setPendingAction] = useState<"save" | "skip" | null>(null);
  const [, startTransition] = useTransition();

  function submit(value: string, action: "save" | "skip") {
    setPendingAction(action);
    startTransition(async () => {
      try {
        // Saving "" records that the user skipped, so the prompt won't return.
        unwrap(await updateDisplayName(value));
        if (action === "save") toast.success(`Nice to meet you, ${value.trim()}!`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save name");
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className="px-4 pt-4 sm:px-8 sm:pt-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) submit(name, "save");
        }}
        className="glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div className="flex items-center gap-3 sm:flex-1 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold">What should we call you?</p>
            <p className="text-sm text-foreground-muted">
              You can change it any time in Settings.
            </p>
          </div>
        </div>
        <div className="flex gap-2 sm:w-80">
          <Input
            aria-label="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoComplete="name"
            placeholder="Your name"
          />
          <Button
            type="submit"
            loading={pendingAction === "save"}
            disabled={!name.trim() || pendingAction !== null}
            className="h-12 shrink-0"
          >
            Save
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={pendingAction === "skip"}
          disabled={pendingAction !== null}
          onClick={() => submit("", "skip")}
          className="self-end sm:self-auto"
        >
          Skip
        </Button>
      </form>
    </div>
  );
}
