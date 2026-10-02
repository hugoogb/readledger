"use client";

import { useFocusTrap } from "@/hooks/use-focus-trap";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarFooter, SidebarNav } from "./sidebar";

export function MobileHeader() {
  const pathname = usePathname();
  // The drawer is open for the page it was opened on, so any navigation
  // (nav links, Settings/Profile in the footer, back button) closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const isOpen = openOn === pathname;
  const close = () => setOpenOn(null);
  const drawerRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenOn(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-background-secondary border-b border-border flex items-center justify-between px-4 z-50 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/readledger-logo.webp"
            alt="ReadLedger logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-bold">ReadLedger</span>
        </Link>
        <button
          onClick={() => setOpenOn(isOpen ? null : pathname)}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg hover:bg-background-tertiary transition-colors cursor-pointer"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      {isOpen && (
        <div
          ref={drawerRef}
          className="fixed left-0 top-0 h-dvh w-64 max-w-[85vw] overflow-y-auto overscroll-contain bg-background-secondary border-r border-border flex flex-col z-50 lg:hidden animate-slide-in-from-left"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Also close when tapping the link for the current page. */}
          <div onClick={close}>
            <SidebarNav />
          </div>
          <div className="mt-auto">
            <SidebarFooter />
          </div>
        </div>
      )}
    </>
  );
}
