"use client";

import { useState } from "react";
import { createStore, updateStore, deleteStore } from "@/actions/stores";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Store = { id: string; name: string };

type StoreListProps = {
  stores: Store[];
};

export function StoreList({ stores }: StoreListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setLoading("create");
    try {
      await createStore(trimmed);
      setNewName("");
      toast.success("Store created");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create store",
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
      await updateStore(id, trimmed);
      setEditingId(null);
      toast.success("Store updated");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update store",
      );
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(deleteTarget.id);
    try {
      await deleteStore(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Store deleted");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete store",
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
    <ConfirmDialog
      isOpen={!!deleteTarget}
      onClose={() => setDeleteTarget(null)}
      onConfirm={handleDelete}
      title="Delete store"
      description={`Delete "${deleteTarget?.name}"? Volumes using this store will lose the association.`}
      confirmLabel="Delete"
      isLoading={!!loading}
    />
    <div className="space-y-3">
      {stores.length === 0 && (
        <p className="text-sm text-foreground-muted py-2">
          No stores yet. Add one below.
        </p>
      )}

      {stores.map((store) => (
        <div
          key={store.id}
          className="flex items-center gap-2 p-3 rounded-xl bg-background-tertiary border border-border/50"
        >
          {editingId === store.id ? (
            <>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUpdate(store.id);
                  }
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="h-9 flex-1"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleUpdate(store.id)}
                disabled={loading === store.id}
                aria-label="Save changes"
              >
                {loading === store.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingId(null)}
                aria-label="Cancel editing"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm font-medium">{store.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingId(store.id);
                  setEditName(store.name);
                }}
                aria-label={`Edit ${store.name}`}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget({ id: store.id, name: store.name })}
                disabled={loading === store.id}
                className="text-foreground-muted hover:text-error hover:bg-error/10"
                aria-label={`Delete ${store.name}`}
              >
                {loading === store.id ? (
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
          placeholder="New store name..."
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
    </>
  );
}
