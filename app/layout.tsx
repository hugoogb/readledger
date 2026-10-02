import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | ReadLedger",
    default: "ReadLedger - Manga Collection Tracker",
  },
  description:
    "Track your manga collection, reading progress, and spending with beautiful insights.",
  keywords: [
    "manga",
    "collection",
    "tracker",
    "tracker tool",
    "reading progress",
    "manga spending",
  ],
  authors: [{ name: "hugoogb.dev" }],
  openGraph: {
    title: "ReadLedger - Manga Collection Tracker",
    description: "Track your manga collection, reading progress, and spending",
    type: "website",
    siteName: "ReadLedger",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReadLedger - Manga Collection Tracker",
    description: "Track your manga collection, reading progress, and spending",
  },
  icons: {
    icon: "/readledger-logo.webp",
  },
  appleWebApp: {
    title: "ReadLedger",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  // Matches --background in globals.css, so the browser chrome blends in.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
