"use client"

import { useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { subscribeToAuthStateChanges } from "@/lib/auth"

export interface FirebaseUserInfo {
  user: User | null
  /** True when an email ends with @gogreenlight.ai (case-insensitive). */
  isInternal: boolean
  /** Display name preferring displayName, then email local-part, then "User". */
  displayName: string
  /** Email or empty string. */
  email: string
  /** 1–2 character uppercase initials derived from displayName/email. */
  initials: string
}

function deriveDisplayName(u: User | null): string {
  if (!u) return "User"
  if (u.displayName && u.displayName.trim().length > 0) return u.displayName.trim()
  if (u.email) {
    const local = u.email.split("@")[0]
    // turn "first.last" / "first_last" / "first-last" into "First Last"
    return local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || local
  }
  return "User"
}

function deriveInitials(name: string, email: string): string {
  const source = name && name !== "User" ? name : email.split("@")[0] || ""
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return ":)"
}

/**
 * Subscribes to the Firebase auth state and exposes display fields used by
 * the app header (avatar / dropdown) and gating for internal-only UI.
 *
 * Dev-only fallback: when running in development AND no Firebase user is
 * signed in, we pretend `john@gogreenlight.ai` is the current user so the
 * internal-only Usage button is reachable for local testing without going
 * through the magic-link flow. This branch is unreachable in production
 * (`process.env.NODE_ENV !== "development"`).
 */
export function useFirebaseUser(): FirebaseUserInfo {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsub = subscribeToAuthStateChanges((u) => setUser(u))
    return () => unsub()
  }, [])

  if (!user && process.env.NODE_ENV === "development") {
    return {
      user: null,
      isInternal: true,
      displayName: "John GoGreenlight",
      email: "john@gogreenlight.ai",
      initials: "JG",
    }
  }

  const email = user?.email ?? ""
  const displayName = deriveDisplayName(user)
  const initials = deriveInitials(displayName, email)
  const isInternal = email.toLowerCase().endsWith("@gogreenlight.ai")

  return { user, isInternal, displayName, email, initials }
}
