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
 * Check if analytics is available
 */
export function isAnalyticsAvailable(): boolean {
  return typeof window !== "undefined" && !!GA_MEASUREMENT_ID && typeof window.gtag === "function"
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
