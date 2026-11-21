"use client";

import { Plus } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { AddSeriesModal } from "./add-series-modal";

const AddBookContext = createContext<{ open: () => void } | null>(null);

/**
 * Mounts the add-a-book flow once for the whole dashboard, so the tab bar's +
 * and the sidebar's button can open it from any page.
 */
export function AddBookProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AddBookContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <AddSeriesModal open={isOpen} onOpenChange={setIsOpen} />
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
