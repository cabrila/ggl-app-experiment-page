/**
 * Google Analytics 4 utility functions
 * 
 * User tracking approach:
 * - We set the Firebase user ID as the GA4 user_id
 * - To identify most active users, cross-reference GA4 user_id with your Firebase/database
 * - This complies with Google's ToS (no PII sent directly to GA4)
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/**
 * Check if analytics is available and ensure gtag is ready
 */
export function isAnalyticsAvailable(): boolean {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) {
    return false
  }
  
  // Ensure dataLayer and gtag are initialized
  if (!window.dataLayer) {
    window.dataLayer = []
  }
  
  if (typeof window.gtag !== "function") {
    // gtag must push the arguments object, not an array of args
    window.gtag = function() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments)
    }
  }
  
  return true
}

/**
 * Track a page view
 */
export function trackPageView(url: string, title?: string) {
  if (!isAnalyticsAvailable()) return

  window.gtag("config", GA_MEASUREMENT_ID!, {
    page_path: url,
    page_title: title,
  })
}

/**
 * Track a custom event
 */
export function trackEvent(
  action: string,
  category?: string,
  label?: string,
  value?: number
) {
  if (!isAnalyticsAvailable()) return

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

/**
 * Set the user ID for cross-device tracking and user identification
 * Call this when user logs in
 */
export function setUserId(userId: string) {
  if (!isAnalyticsAvailable()) return

  window.gtag("config", GA_MEASUREMENT_ID!, {
    user_id: userId,
  })

  // Also set as user property for reporting
  window.gtag("set", "user_properties", {
    user_id: userId,
  })
}

/**
 * Clear the user ID (call on logout)
 */
export function clearUserId() {
  if (!isAnalyticsAvailable()) return

  window.gtag("config", GA_MEASUREMENT_ID!, {
    user_id: undefined,
  })
}

/**
 * Track user login
 */
export function trackLogin(method: "email" | "phone") {
  if (!isAnalyticsAvailable()) return

  window.gtag("event", "login", {
    method: method,
  })
}

/**
 * Track user sign up (first login)
 */
export function trackSignUp(method: "email" | "phone") {
  if (!isAnalyticsAvailable()) return

  window.gtag("event", "sign_up", {
    method: method,
  })
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(featureName: string, details?: Record<string, unknown>) {
  if (!isAnalyticsAvailable()) return

  window.gtag("event", "feature_usage", {
    feature_name: featureName,
    ...details,
  })
}

/**
 * Track file upload
 */
export function trackFileUpload(fileType: string, feature: string) {
  if (!isAnalyticsAvailable()) return

  window.gtag("event", "file_upload", {
    file_type: fileType,
    feature: feature,
  })
}

/**
 * Track AI extraction completed
 */
export function trackAIExtraction(skill: string, itemCount: number) {
  if (!isAnalyticsAvailable()) return

  window.gtag("event", "ai_extraction_complete", {
    skill: skill,
    item_count: itemCount,
  })
}

// ============================================
// Feature-specific tracking events
// ============================================

export type FeatureName = "character-bible" | "location-overview" | "actor-list" | "public-casting"

/**
 * Track when user clicks on a feature in the sidebar
 */
export function trackFeatureClick(feature: FeatureName) {
  console.log("[v0] trackFeatureClick called:", feature)
  if (!isAnalyticsAvailable()) {
    console.log("[v0] Analytics not available")
    return
  }

  console.log("[v0] Sending feature_click event")
  window.gtag("event", "feature_click", {
    feature_name: feature,
  })
}

/**
 * Track when user creates a new list/project
 */
export function trackListCreated(feature: FeatureName) {
  if (!isAnalyticsAvailable()) return

  window.gtag("event", "list_created", {
    feature_name: feature,
  })
}

/**
 * Track when user clicks "Extract..." button to start extraction
 */
export function trackExtractClick(feature: FeatureName, fileType: string) {
  if (!isAnalyticsAvailable()) return

  window.gtag("event", "extract_click", {
    feature_name: feature,
    file_type: fileType,
  })
}

/**
 * Track when extraction completes successfully
 */
export function trackExtractComplete(feature: FeatureName, itemCount: number) {
  if (!isAnalyticsAvailable()) return

  window.gtag("event", "extract_complete", {
    feature_name: feature,
    item_count: itemCount,
  })
}

/**
 * Track when user adds a new item (character, actor, location)
 */
export function trackAddItem(feature: FeatureName, itemType: string) {
  if (!isAnalyticsAvailable()) return

  window.gtag("event", "add_item", {
    feature_name: feature,
    item_type: itemType,
  })
}

/**
 * Track export actions (JSON, Excel, PDF)
 */
export function trackExport(feature: FeatureName, exportFormat: "json" | "excel" | "pdf") {
  // Debug: Log immediately to verify function is being called
  if (typeof window !== "undefined") {
    console.log("[v0] trackExport CALLED - feature:", feature, "format:", exportFormat)
  }
  
  if (!isAnalyticsAvailable()) {
    console.log("[v0] Analytics not available for export")
    return
  }

  console.log("[v0] Sending export event to GA")
  window.gtag("event", "export", {
    feature_name: feature,
    export_format: exportFormat,
  })
}

/**
 * Track delete actions
 */
export function trackDelete(feature: FeatureName, deleteType: "item" | "list") {
  if (!isAnalyticsAvailable()) return

  window.gtag("event", "delete", {
    feature_name: feature,
    delete_type: deleteType,
  })
}
