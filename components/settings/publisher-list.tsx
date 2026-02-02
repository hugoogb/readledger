"use client";

import { useState } from "react";
import {
  createPublisher,
  updatePublisher,
  deletePublisher,
} from "@/actions/publishers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Publisher = { id: string; name: string };

type PublisherListProps = {
  publishers: Publisher[];
};

export function PublisherList({ publishers }: PublisherListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setLoading("create");
    try {
      await createPublisher(trimmed);
      setNewName("");
      toast.success("Publisher created");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create publisher",
      );
    } finally {
      setLoading(null);
    }
  };

  const handleUpdate = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    setLoading(id);
    try {
      await updatePublisher(id, trimmed);
      setEditingId(null);
      toast.success("Publisher updated");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update publisher",
      );
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Delete "${name}"? Series using this publisher will lose the association.`,
      )
    )
      return;

    setLoading(id);
    try {
      await deletePublisher(id);
      toast.success("Publisher deleted");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete publisher",
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {publishers.length === 0 && (
        <p className="text-sm text-foreground-muted py-2">
          No publishers yet. Add one below.
        </p>
      )}

      {publishers.map((pub) => (
        <div
          key={pub.id}
          className="flex items-center gap-2 p-3 rounded-xl bg-background-tertiary border border-border/50"
        >
          {editingId === pub.id ? (
            <>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUpdate(pub.id);
                  }
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="h-9 flex-1"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleUpdate(pub.id)}
                disabled={loading === pub.id}
              >
                {loading === pub.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingId(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm font-medium">{pub.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingId(pub.id);
                  setEditName(pub.name);
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(pub.id, pub.name)}
                disabled={loading === pub.id}
                className="text-foreground-muted hover:text-error hover:bg-error/10"
              >
                {loading === pub.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </>
          )}
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreate();
            }
          }}
          placeholder="New publisher name..."
          className="flex-1"
        />
        <Button
          onClick={handleCreate}
          disabled={!newName.trim() || loading === "create"}
          className="gap-2"
        >
          {loading === "create" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add
        </Button>
      </div>
    </div>
  );
}
