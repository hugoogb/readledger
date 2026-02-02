"use client";

import { useState } from "react";
import { Menu, X, BookOpen } from "lucide-react";
import Link from "next/link";
import { SidebarNav, SidebarFooter } from "./sidebar";
import { useFocusTrap } from "@/hooks/use-focus-trap";

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useFocusTrap(isOpen);

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-background-secondary border-b border-border flex items-center justify-between px-4 z-50 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-accent" />
          </div>
          <span className="text-lg font-bold">ReadLedger</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-background-tertiary transition-colors cursor-pointer"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      {isOpen && (
        <div
          ref={drawerRef}
          className="fixed left-0 top-0 h-screen w-64 bg-background-secondary border-r border-border flex flex-col z-50 lg:hidden animate-slide-in-from-left"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div onClick={() => setIsOpen(false)}>
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
