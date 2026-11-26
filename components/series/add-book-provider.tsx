"use client";

import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { getAddBookOptions } from "@/actions/series";
import { Button, type ButtonProps } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { errorMessage } from "@/lib/utils";
import { AddSeriesModal } from "./add-series-modal";

type Publisher = { id: string; name: string };
type AddBookOptions = { publishers: Publisher[]; booksFirst: boolean };

const AddBookContext = createContext<{ open: () => void } | null>(null);

export function AddBookProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const isOpen = openOn === pathname;
  const [options, setOptions] = useState<AddBookOptions>({ publishers: [], booksFirst: true });

  const open = () => {
    setOpenOn(pathname);
    getAddBookOptions()
      .then(setOptions)
      .catch((error: unknown) =>
        logger.warn("Add-book options unavailable; keeping the last known ones", { error: errorMessage(error) }),
      );
  };

  return (
    <AddBookContext.Provider value={{ open }}>
      {children}
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

export function AddBookButton({ className, size, label = "Add a book" }: Pick<ButtonProps, "className" | "size"> & { label?: string }) {
  const { open } = useAddBook();
  return (
    <Button onClick={open} className={className} size={size}>
      <Plus />
      {label}
    </Button>
  );
}
