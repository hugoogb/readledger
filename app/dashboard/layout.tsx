import { MobileHeader } from "@/components/ui/mobile-header";
import { SidebarFooter, SidebarNav } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <MobileHeader />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-background-secondary border-r border-border flex-col">
        <SidebarNav />
        <SidebarFooter />
      </aside>

      {/* Main content */}
      <main className="pt-14 lg:pt-0 lg:ml-64 min-h-screen">{children}</main>
    </div>
  );
}
