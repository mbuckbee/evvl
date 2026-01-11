import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import WebAnalytics from "@/components/WebAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evvl - AI Model Testing & Evaluation",
  description: "Test, compare, and organize AI model evaluations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="h-screen">
        <main className="h-full">{children}</main>
        {/* Analytics - Web only, not in Tauri desktop app */}
        <WebAnalytics />
      </body>
    </html>
  );
}
