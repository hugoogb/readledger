"use client";

import { useEffect, useState, useId, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useFocusTrap } from "@/hooks/use-focus-trap";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
};

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "lg",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const focusTrapRef = useFocusTrap(isOpen && mounted);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      ref={focusTrapRef}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal — full-width bottom sheet on mobile, centered card on sm+.
          Flex column: fixed header + single vertically-scrolling body. The
          panel clips its own overflow so neither axis can spawn a scrollbar
          on the panel itself (`overflow-y-auto` alone would force
          `overflow-x: auto`, producing a stray horizontal scrollbar). */}
      <div
        className={`relative flex w-full ${maxWidthClasses[maxWidth]} flex-col bg-background-secondary border border-border max-h-[92dvh] sm:max-h-[90dvh] overflow-hidden rounded-t-2xl sm:rounded-2xl animate-slide-up sm:animate-scale-in`}
      >
        {/* Header (with mobile drag-handle affordance) */}
        <div className="shrink-0 bg-background-secondary border-b border-border/60">
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <span
              className="h-1.5 w-10 rounded-full bg-border-hover"
              aria-hidden="true"
            />
          </div>
          <div className="flex items-center justify-between gap-4 px-6 pt-3 sm:pt-5 pb-4">
            <h2
              id={titleId}
              className="text-lg sm:text-xl font-semibold truncate"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="shrink-0 cursor-pointer p-2 -mr-2 hover:bg-background-tertiary rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Scrollable body — vertical only; horizontal overflow is clipped so
            wide children never produce a horizontal scrollbar. */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
