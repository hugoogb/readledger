"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

type CreatableSelectProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onCreate: (name: string) => Promise<{ id: string; name: string }>;
  placeholder?: string;
  createLabel?: string;
  error?: boolean;
  id?: string;
};

export function CreatableSelect({
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Select...",
  createLabel = "Add new...",
  error,
  id,
}: CreatableSelectProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) {
      inputRef.current?.focus();
    }
  }, [isCreating]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await onCreate(trimmed);
      onChange(created.id);
      setNewName("");
      setIsCreating(false);
    } catch {
      // error handling is done by the caller via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCreating) {
    return (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
              if (e.key === "Escape") {
                setIsCreating(false);
                setNewName("");
              }
            }}
            placeholder="Enter name..."
            disabled={isSubmitting}
            className={cn(
              "flex h-12 w-full rounded-xl border border-accent bg-background-tertiary px-4 py-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            )}
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={!newName.trim() || isSubmitting}
          className="h-12 w-12 rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setIsCreating(false);
            setNewName("");
          }}
          className="h-12 w-12 rounded-xl border border-border bg-background-tertiary hover:bg-background-tertiary/80 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative group/select">
      <select
        id={id}
        value={value}
        onChange={(e) => {
          if (e.target.value === "__create__") {
            setIsCreating(true);
          } else {
            onChange(e.target.value);
          }
        }}
        className={cn(
          "flex h-12 w-full rounded-xl border border-border bg-background-tertiary px-4 py-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors appearance-none cursor-pointer pr-10 hover:border-border-hover",
          error && "border-error focus-visible:ring-error",
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        <option value="__create__">{createLabel}</option>
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground-muted group-hover/select:text-foreground transition-colors">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
}
