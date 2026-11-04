import type { Metadata } from "next";

// The login page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to ReadLedger with a code sent to your email.",
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
