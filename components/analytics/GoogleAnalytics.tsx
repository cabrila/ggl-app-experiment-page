"use client"

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

  useEffect(() => {
    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || []
    
    // Define gtag function if not already defined
    // IMPORTANT: gtag must push the arguments object, not spread args
    if (typeof window.gtag !== 'function') {
      window.gtag = function() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer.push(arguments)
      }
    }
    
    window.gtag('js', new Date())
    window.gtag('config', gaId, {
      page_path: window.location.pathname,
      send_page_view: true
    })

    // Load gtag.js script dynamically
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    script.async = true
    document.head.appendChild(script)

    

    return () => {
      // Cleanup if component unmounts
      const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [gaId])

  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  )
}
