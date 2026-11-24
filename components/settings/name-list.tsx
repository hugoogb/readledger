"use client";

import { useState } from "react";
import { createPublisher, deletePublisher, updatePublisher } from "@/actions/publishers";
import { createStore, deleteStore, updateStore } from "@/actions/stores";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { unwrap } from "@/lib/unwrap";
import { errorMessage } from "@/lib/utils";

type Item = { id: string; name: string };

// Stores and publishers are the same kind of per-user name list.
const KINDS = {
  store: {
    noun: "store",
    Noun: "Store",
    create: createStore,
    update: updateStore,
    remove: deleteStore,
    usedBy: "Volumes",
  },
  publisher: {
    noun: "publisher",
    Noun: "Publisher",
    create: createPublisher,
    update: updatePublisher,
    remove: deletePublisher,
    usedBy: "Series",
  },
} as const;

export function StoreList({ stores }: { stores: Item[] }) {
  return <NameList kind="store" items={stores} />;
}

export function PublisherList({ publishers }: { publishers: Item[] }) {
  return <NameList kind="publisher" items={publishers} />;
}

function NameList({ kind, items }: { kind: keyof typeof KINDS; items: Item[] }) {
  const { noun, Noun, create, update, remove, usedBy } = KINDS[kind];
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
      unwrap(await create(trimmed));
      setNewName("");
      toast.success(`${Noun} created`);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, `Failed to create ${noun}`));
    } finally {
      setLoading(null);
    }
  };

  const handleUpdate = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    setLoading(id);
    try {
      unwrap(await update(id, trimmed));
      setEditingId(null);
      toast.success(`${Noun} updated`);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, `Failed to update ${noun}`));
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(deleteTarget.id);
    try {
      unwrap(await remove(deleteTarget.id));
      setDeleteTarget(null);
      toast.success(`${Noun} deleted`);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, `Failed to delete ${noun}`));
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
      title={`Delete ${noun}`}
      description={`Delete "${deleteTarget?.name}"? ${usedBy} using this ${noun} will lose the association.`}
      confirmLabel="Delete"
      isLoading={!!loading}
    />
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-foreground-muted py-2">
          No {noun}s yet. Add one below.
        </p>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 p-3 rounded-md bg-background-tertiary border border-border/50"
        >
          {editingId === item.id ? (
            <>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUpdate(item.id);
                  }
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="flex-1"
                aria-label={`${Noun} name`}
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleUpdate(item.id)}
                disabled={loading === item.id}
                aria-label="Save changes"
              >
                {loading === item.id ? (
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
              <span className="flex-1 text-sm font-medium">{item.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingId(item.id);
                  setEditName(item.name);
                }}
                aria-label={`Edit ${item.name}`}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                disabled={loading === item.id}
                className="text-foreground-muted hover:text-error hover:bg-error/10"
                aria-label={`Delete ${item.name}`}
              >
                {loading === item.id ? (
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
          placeholder={`New ${noun} name...`}
          aria-label={`New ${noun} name`}
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
