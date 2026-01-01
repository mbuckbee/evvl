import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Evvl - AI Output Evaluation",
  description: "Compare and evaluate AI model outputs side by side",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <html lang="en" className={GeistSans.className}>
      <body className="h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 overflow-hidden">{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />

        {/* Privacy-friendly analytics by Plausible - Production only */}
        {isProduction && (
          <>
            <Script
              src="https://plausible.io/js/pa-_obU0K7gpnnNMGqGmG74x.js"
              strategy="afterInteractive"
              async
            />
            <Script id="plausible-init" strategy="afterInteractive">
              {`
                window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
                plausible.init()
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
