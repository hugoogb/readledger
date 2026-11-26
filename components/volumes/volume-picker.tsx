"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type PickerVolume = { id: string; volumeNumber: number };

const TONES = {
  accent: {
    badge: "default",
    selected: "default",
    selectAll: "text-accent hover:text-accent-hover",
    ring: "ring-2 ring-accent ring-offset-2 ring-offset-background-tertiary shadow-lg",
    hover: "hover:border-accent/50 hover:bg-accent/5",
  },
  success: {
    badge: "success",
    selected: "success",
    selectAll: "text-success hover:text-success/80",
    ring: "ring-2 ring-success ring-offset-2 ring-offset-background-tertiary shadow-lg",
    hover: "hover:border-success/50 hover:bg-success/5",
  },
} as const;

type VolumePickerProps = {
  label: string;
  volumes: PickerVolume[];
  isSelected: (id: string) => boolean;
  selectedCount: number;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  emptyText: string;
  tone: keyof typeof TONES;
  maxHeight?: string;
};

export function VolumePicker({
  label,
  volumes,
  isSelected,
  selectedCount,
  onToggle,
  onSelectAll,
  onClear,
  emptyText,
  tone,
  maxHeight = "max-h-40",
}: VolumePickerProps) {
  const t = TONES[tone];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Label className="mb-0">{label}</Label>
        <div className="flex items-center gap-3">
          <Badge variant={t.badge} size="sm">
            <span className="text-nowrap">{selectedCount} selected</span>
          </Badge>
          <div className="flex gap-2">
            <Button
              variant="link"
              type="button"
              onClick={onSelectAll}
              className={`h-auto p-0 text-xs font-medium ${t.selectAll}`}
            >
              Select All
            </Button>
            <span className="text-foreground-muted/30">|</span>
            <Button
              variant="link"
              type="button"
              onClick={onClear}
              className="h-auto p-0 text-xs font-medium text-foreground-muted hover:text-foreground"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
      <div className={`${maxHeight} overflow-y-auto border border-border rounded-md p-3 bg-background-tertiary/50`}>
        <div className="flex flex-wrap gap-2">
          {volumes.length > 0 ? (
            volumes.map((volume) => {
              const selected = isSelected(volume.id);
              return (
                <Button
                  key={volume.id}
                  type="button"
                  variant={selected ? t.selected : "outline"}
                  onClick={() => onToggle(volume.id)}
                  className={`min-w-10 h-10 px-0 rounded-lg text-sm font-semibold ${selected ? t.ring : t.hover}`}
                >
                  {volume.volumeNumber}
                </Button>
              );
            })
          ) : (
            <p className="text-sm text-foreground-muted py-2">{emptyText}</p>
          )}
        </div>
      </div>
    </div>
  );
}
