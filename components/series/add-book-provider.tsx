"use client";

import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { getAddBookOptions } from "@/actions/series";
import { Button, type ButtonProps } from "@/components/ui/button";
import { AddSeriesModal } from "./add-series-modal";

type Publisher = { id: string; name: string };
type AddBookOptions = { publishers: Publisher[]; booksFirst: boolean };

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
  // Fetched on each opening, not on page load. Kept between openings, so the
  // search order is already right when the sheet reopens; until the first
  // load it shows books first with no publishers.
  const [options, setOptions] = useState<AddBookOptions>({ publishers: [], booksFirst: true });

  const open = () => {
    setOpenOn(pathname);
    getAddBookOptions()
      .then(setOptions)
      // Non-essential: the flow still works with the last known options.
      .catch(() => {});
  };

  return (
    <AddBookContext.Provider value={{ open }}>
      {children}
      {/* Keyed so each opening starts fresh, even after a navigation closed it mid-form. */}
      <AddSeriesModal
        key={openOn ?? "closed"}
        open={isOpen}
        onOpenChange={(next) => setOpenOn(next ? pathname : null)}
        publishers={options.publishers}
        booksFirst={options.booksFirst}
        onPublisherCreated={(pub) =>
          setOptions((o) => ({
            ...o,
            publishers: [...o.publishers, pub].sort((a, b) => a.name.localeCompare(b.name)),
          }))
        }
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
