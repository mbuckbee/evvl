"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

declare global {
  interface Window {
    __TAURI__?: unknown;
    plausible?: unknown;
  }
}

export default function WebAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [shouldLoadPlausible, setShouldLoadPlausible] = useState(false);

  useEffect(() => {
    // Only load analytics in web browser, not in Tauri desktop app
    const isTauri = typeof window !== "undefined" && !!window.__TAURI__;
    const isProduction = process.env.NODE_ENV === "production";

    if (!isTauri) {
      setShouldLoad(true);
      if (isProduction) {
        setShouldLoadPlausible(true);
      }
    }
  }, []);

  if (!shouldLoad) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
      {shouldLoadPlausible && (
        <>
          <Script
            src="https://plausible.io/js/pa-cSp3b1xHvm1LHpsgjn6rM.js"
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
    </>
  );
}
