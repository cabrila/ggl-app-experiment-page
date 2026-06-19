"use client"

import { useEffect } from "react"
import { subscribeToAuthStateChanges } from "@/lib/auth"
import { setUserId, clearUserId, trackLogin } from "@/lib/analytics"

/**
 * Analytics Provider that sets user ID when authenticated
 * This enables tracking individual users across sessions
 * 
 * To find most active users:
 * 1. Go to GA4 > Explore > create a report with user_id dimension
 * 2. Add metrics like engagement_time, session_count, event_count
 * 3. Cross-reference user_id with your Firebase database to get email/phone
 */
export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthStateChanges((user) => {
      if (user) {
        // User is signed in - set their Firebase UID as the GA user_id
        setUserId(user.uid)
        
        // Track login event with method
        const method = user.email ? "email" : "phone"
        trackLogin(method)
      } else {
        // User is signed out - clear the user_id
        clearUserId()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return <>{children}</>
}
