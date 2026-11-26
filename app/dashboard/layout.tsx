import { NamePrompt } from "@/components/account/name-prompt";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { MobileHeader } from "@/components/ui/mobile-header";
import { AddBookProvider } from "@/components/series/add-book-provider";
import { BottomTabBar } from "@/components/ui/bottom-tab-bar";
import { Sidebar } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const avatarUser = user && { id: user.id, avatarUrl: user.avatarUrl };

  return (
    <CurrencyProvider currency={user?.currency ?? "EUR"}>
      <AddBookProvider>
        <div className="min-h-screen bg-background">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[10000] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
          >
            Skip to main content
          </a>

          <MobileHeader user={avatarUser} />
          <aside
            aria-label="Main sidebar"
            className="fixed top-0 left-0 hidden h-screen w-60 border-r border-border bg-background-secondary lg:block"
          >
            <Sidebar user={avatarUser} />
          </aside>

          <main
            id="main-content"
            className="min-h-screen pt-14 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:ml-60 lg:pt-0 lg:pb-0"
          >
            {user?.name === null && <NamePrompt />}
            {children}
          </main>
          <BottomTabBar />
        </div>
      </AddBookProvider>
    </CurrencyProvider>
  );
}
