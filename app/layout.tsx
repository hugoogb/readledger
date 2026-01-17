import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

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
  authors: [{ name: "ReadLedger Team" }],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="bottom-right" richColors theme="dark" />
      </body>
    </html>
  );
}
