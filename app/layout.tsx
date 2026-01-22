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
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <head>
        {/* Sync dark mode with system preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                }
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                  if (e.matches) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body className="h-screen">
        <main className="h-full">{children}</main>
        {/* Analytics - Web only, not in Tauri desktop app */}
        <WebAnalytics />
      </body>
    </html>
  );
}
