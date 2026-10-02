"use client";

import { Button } from "@/components/ui/button";
import type { GoalProgress } from "@/lib/reading-stats";
import { CheckCircle, Pencil, Target } from "lucide-react";
import { useState } from "react";
import { GoalModal } from "./goal-modal";

type GoalCardProps = {
  year: number;
  /** Dated reads in `year` — shown even without a goal. */
  readCount: number;
  progress: GoalProgress | null;
};

function ProgressRing({ value }: { value: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 1);

  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-background-tertiary)" strokeWidth="10" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="var(--color-success)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped)}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}

function paceText(progress: GoalProgress) {
  if (progress.completed) return null;
  if (progress.paceDelta === undefined) return null;
  if (progress.paceDelta > 0) return `${progress.paceDelta} ahead of pace`;
  if (progress.paceDelta < 0) return `${-progress.paceDelta} behind pace`;
  return "On pace";
}

export function GoalCard({ year, readCount, progress }: GoalCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pace = progress ? paceText(progress) : null;

  return (
    <section className="glass rounded-2xl p-4 sm:p-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-success" />
          {year} goal
        </h2>
        {progress && (
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} className="gap-1.5">
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
        )}
      </div>

      {progress ? (
        <div className="flex items-center gap-5">
          <div className="relative">
            <ProgressRing value={progress.read / progress.target} />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {Math.round((progress.read / progress.target) * 100)}%
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-3xl font-bold">
              {progress.read}
              <span className="text-lg text-foreground-muted font-medium"> / {progress.target}</span>
            </p>
            {progress.completed ? (
              <p className="text-sm text-success font-medium flex items-center gap-1.5 mt-1">
                <CheckCircle className="w-4 h-4" />
                Goal reached
              </p>
            ) : (
              <p className="text-sm text-foreground-muted mt-1">
                {pace ?? `${progress.target - progress.read} short of the goal`}
              </p>
            )}
            {progress.expected !== undefined && !progress.completed && (
              <p className="text-xs text-foreground-muted mt-0.5">
                {progress.expected} expected by today
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-foreground-muted">
            {readCount} volume{readCount !== 1 ? "s" : ""} read in {year}. Set a target to track your pace.
          </p>
          <Button onClick={() => setIsOpen(true)} variant="success" className="gap-2 shrink-0">
            <Target className="w-4 h-4" />
            Set a goal
          </Button>
        </div>
      )}

      {isOpen && (
        <GoalModal
          year={year}
          currentTarget={progress?.target ?? null}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </section>
  );
}
