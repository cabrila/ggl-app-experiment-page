"use client"

import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import { GA_MEASUREMENT_ID, trackPageView } from "@/lib/analytics"

function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname && GA_MEASUREMENT_ID) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")
      trackPageView(url)
    }
  }, [pathname, searchParams])

  return null
}

export default function GoogleAnalytics() {
  // Only render if GA_MEASUREMENT_ID is defined and valid
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.trim() === "") {
    return null
  }

  const gaId = GA_MEASUREMENT_ID

  return (
    <>
      {/* Initialize dataLayer and gtag function FIRST (inline, runs immediately) */}
      <Script
        id="google-analytics-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          `,
        }}
      />
      {/* Load gtag.js and configure after it loads */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
        onLoad={() => {
          window.gtag('config', gaId, {
            page_path: window.location.pathname,
            send_page_view: true
          });
          console.log("[v0] Google Analytics loaded and configured");
        }}
      />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}
