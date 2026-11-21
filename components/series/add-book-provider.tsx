"use client";

import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { AddSeriesModal } from "./add-series-modal";

const AddBookContext = createContext<{ open: () => void } | null>(null);

/**
 * Mounts the add-a-book flow once for the whole dashboard, so the tab bar's +
 * and the sidebar's button can open it from any page.
 */
export function AddBookProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Open only on the page it was opened from, so a back swipe or any
  // navigation closes the sheet instead of leaving it over the next page.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const isOpen = openOn === pathname;

  return (
    <AddBookContext.Provider value={{ open: () => setOpenOn(pathname) }}>
      {children}
      {/* Keyed so each opening starts fresh, even after a navigation closed it mid-form. */}
      <AddSeriesModal
        key={openOn ?? "closed"}
        open={isOpen}
        onOpenChange={(open) => setOpenOn(open ? pathname : null)}
      />
    </AddBookContext.Provider>
  );
}

export function useAddBook() {
  const context = useContext(AddBookContext);
  if (!context) throw new Error("useAddBook must be used inside AddBookProvider");
  return context;
}

/** "Add a book" button that opens the shared add flow. */
export function AddBookButton({ className, size, label = "Add a book" }: Pick<ButtonProps, "className" | "size"> & { label?: string }) {
  const { open } = useAddBook();
  return (
    <Button onClick={open} className={className} size={size}>
      <Plus />
      {label}
    </Button>
  );
}
