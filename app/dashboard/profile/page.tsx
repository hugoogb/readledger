import { signOut } from "@/actions/auth";
import { ExportButton } from "@/components/import-export/export-button";
import { ImportModal } from "@/components/import-export/import-modal";
import { Button } from "@/components/ui/button";
import { Ledger, LedgerRow } from "@/components/ui/ledger";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getCurrentUser } from "@/lib/auth";
import { ChevronRight, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const sectionTitle = "font-serif text-xl font-medium";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const memberSince = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(user.createdAt);

  return (
    <div className="p-4 lg:p-8">
      <div className="mx-auto max-w-[40rem]">
        <header className="flex items-center gap-4">
          {user.avatarUrl && (
            <Image
              width={56}
              height={56}
              src={user.avatarUrl}
              alt=""
              className="size-14 rounded-full object-cover"
            />
          )}
          <div className="min-w-0">
            <h1 className="truncate font-serif text-3xl font-medium leading-tight">
              {user.name || "Your profile"}
            </h1>
            <p className="truncate text-sm text-foreground-muted">{user.email}</p>
          </div>
        </header>

        <Ledger className="mt-6">
          <LedgerRow label="Member since" value={<span className="text-base">{memberSince}</span>} />
        </Ledger>

        <section className="mt-10">
          <h2 className={sectionTitle}>Preferences</h2>
          <div className="mt-3 border-t border-border">
            <Link
              href="/dashboard/settings"
              className="flex min-h-12 items-center justify-between border-b border-border py-3 transition-colors hover:text-accent"
            >
              <span>
                Settings
                <span className="block text-sm text-foreground-muted">
                  Display name, currency, stores and publishers
                </span>
              </span>
              <ChevronRight className="size-5 text-foreground-muted" aria-hidden="true" />
            </Link>
            <div className="flex min-h-12 items-center justify-between gap-4 border-b border-border py-3">
              <span>Appearance</span>
              <ThemeToggle />
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className={sectionTitle}>Your data</h2>
          <p className="mt-1 text-sm text-foreground-muted">Export or import your collection.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ExportButton />
            <ImportModal />
          </div>
        </section>

        <section className="mt-10 border-t border-border pt-6">
          <form action={signOut}>
            <Button variant="outline" type="submit" className="text-error">
              <LogOut />
              Sign out
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
