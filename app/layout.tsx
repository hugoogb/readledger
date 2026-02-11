import { ThemeProvider } from "@/components/providers/theme-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
    apple: "/readledger-logo.webp",
  },
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
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
