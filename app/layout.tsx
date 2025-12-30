import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import Navigation from "@/components/navigation";

export const metadata: Metadata = {
  title: "Evvl - AI Output Evaluation",
  description: "Compare and evaluate AI model outputs side by side",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
