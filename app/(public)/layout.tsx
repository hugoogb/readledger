import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-5 sm:px-6 pt-6 pb-20">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
