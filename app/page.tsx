"use client"

import { useState, useEffect } from "react"
import { User } from "firebase/auth"
import { subscribeToAuthStateChanges, isMagicLinkCallback, completeMagicLinkSignIn, signOut } from "@/lib/auth"
import LoginScreen from "@/components/auth/LoginScreen"
import SplashScreen from "@/components/home/SplashScreen"
import CharacterBibleScreen from "@/components/character-bible/CharacterBibleScreen"
import LocationScoutingScreen from "@/components/location-scouting/LocationScoutingScreen"
import ActorListScreen from "@/components/actor-list/ActorListScreen"
import PublicCastingScreen from "@/components/public-casting/PublicCastingScreen"
import PropListScreen from "@/components/prop-list/PropListScreen"
import SceneListScreen from "@/components/scene-list/SceneListScreen"
import { CastingProvider } from "@/components/casting/CastingContext"

export default function App() {
  const [view, setView] = useState<"login" | "splash" | "character-bible" | "location-overview" | "actor-database" | "public-casting" | "prop-list" | "scene-list">("login")
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Dev-only bypass: when true, the auth reconcile effect is disabled so the
  // user can navigate the app without being signed in. Reset on sign-out.
  const [bypassAuth, setBypassAuth] = useState(false)

  useEffect(() => {
    let mounted = true

    // Check if this is a magic link callback
    if (typeof window !== "undefined" && isMagicLinkCallback()) {
      completeMagicLinkSignIn()
        .then(() => {
          // Auth state change handled by subscription
        })
        .catch((err) => {
          if (mounted) {
            setError(err instanceof Error ? err.message : "Failed to verify magic link")
          }
        })
    }

    // Subscribe to authentication state changes. We ONLY update `user` here —
    // the routing reconciliation happens in a separate effect below so it
    // works no matter which path (subscription or explicit onSignedIn) wins.
    const unsubscribe = subscribeToAuthStateChanges((authUser) => {
      console.log("[v0] page: auth state changed, uid:", authUser?.uid ?? null)
      if (!mounted) return
      setUser(authUser)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  // Reconcile view with auth state. This is the single source of truth for
  // routing transitions. Whether the user signs in via the auth subscription
  // OR the explicit onSignedIn callback, this effect deterministically moves
  // them to splash (and back to login on sign-out).
  useEffect(() => {
    // Dev-only "Bypass login" suspends the reconcile so an unauthenticated
    // user can explore the app. As soon as they actually sign in or sign out
    // via real auth, the bypass turns off and normal routing resumes.
    if (bypassAuth && !user) return
    if (user && view === "login") {
      setView("splash")
    } else if (!user && view !== "login") {
      setView("login")
    }
  }, [user, view, bypassAuth])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error("[v0] signOut failed:", err)
    }
    // The auth subscription + reconcile effect will route to login,
    // but set it explicitly here too for immediate feedback.
    setBypassAuth(false)
    setUser(null)
    setView("login")
  }

  const handleDemoAccess = () => {
    console.log("[v0] handleDemoAccess called, setting bypassAuth=true and view=splash")
    setBypassAuth(true)
    setView("splash")
  }

  const handleNavigate = (feature: string) => {
    if (
      feature === "character-bible" ||
      feature === "location-overview" ||
      feature === "actor-database" ||
      feature === "public-casting" ||
      feature === "prop-list" ||
      feature === "scene-list"
    ) {
      setView(feature)
    }
  }

  const renderView = () => {
    switch (view) {
      case "login":
        return <LoginScreen onDemoAccess={handleDemoAccess} onSignedIn={() => setView("splash")} />
      case "splash":
        return (
          <CastingProvider>
            <SplashScreen onSignOut={handleSignOut} onNavigate={handleNavigate} />
          </CastingProvider>
        )
      case "character-bible":
        return (
          <CastingProvider>
            <CharacterBibleScreen onBack={() => setView("splash")} onSignOut={handleSignOut} activeView="character-bible" onNavigate={handleNavigate} />
          </CastingProvider>
        )
      case "location-overview":
        return (
          <CastingProvider>
            <LocationScoutingScreen onBack={() => setView("splash")} onSignOut={handleSignOut} activeView="location-overview" onNavigate={handleNavigate} />
          </CastingProvider>
        )
      case "actor-database":
        return (
          <CastingProvider>
            <ActorListScreen onBack={() => setView("splash")} onSignOut={handleSignOut} activeView="actor-database" onNavigate={handleNavigate} />
          </CastingProvider>
        )
      case "public-casting":
        return (
          <CastingProvider>
            <PublicCastingScreen onBack={() => setView("splash")} onSignOut={handleSignOut} activeView="public-casting" onNavigate={handleNavigate} />
          </CastingProvider>
        )
      case "prop-list":
        return (
          <CastingProvider>
            <PropListScreen onBack={() => setView("splash")} onSignOut={handleSignOut} activeView="prop-list" onNavigate={handleNavigate} />
          </CastingProvider>
        )
      case "scene-list":
        return (
          <CastingProvider>
            <SceneListScreen onBack={() => setView("splash")} onSignOut={handleSignOut} activeView="scene-list" onNavigate={handleNavigate} />
          </CastingProvider>
        )
      default:
        return <LoginScreen onDemoAccess={handleDemoAccess} onSignedIn={() => setView("splash")} />
    }
  }

  return (
    <div className="h-screen">
      {renderView()}
      
      {error && (
        <div className="fixed bottom-4 right-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-300 font-sans">{error}</p>
        </div>
      )}
    </div>
  )
}
