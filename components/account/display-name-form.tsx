"use client";

import { updateDisplayName } from "@/actions/user-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { unwrap } from "@/lib/unwrap";

export function DisplayNameForm({ initialName }: { initialName: string | null }) {
  const [name, setName] = useState(initialName ?? "");
  const [saved, setSaved] = useState(initialName ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        unwrap(await updateDisplayName(name));
        setSaved(name.trim());
        toast.success("Name updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update name");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Label htmlFor="display-name">Display name</Label>
      <div className="flex gap-2">
        <Input
          id="display-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          autoComplete="name"
          placeholder="Your name"
          icon={<User className="w-5 h-5" />}
        />
        <Button
          type="submit"
          loading={isPending}
          disabled={name.trim() === saved}
          className="h-12 shrink-0"
        >
          Save
        </Button>
      </div>
    </form>
  );
}
