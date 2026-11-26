import { UserRound } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { UserAvatar, type AvatarUser } from "@/components/ui/user-avatar";

export function MobileHeader({ user }: { user: AvatarUser | null }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background-secondary px-4 lg:hidden">
      <Link href="/dashboard" aria-label="ReadLedger home">
        <Logo size={26} />
      </Link>
      <Link
        href="/dashboard/profile"
        aria-label="Profile and settings"
        className="-mr-2 flex size-11 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-background-tertiary hover:text-foreground"
      >
        {user ? (
          <UserAvatar user={user} size={28} className="size-7" />
        ) : (
          <UserRound className="size-5" aria-hidden="true" />
        )}
      </Link>
    </header>
  );
}
