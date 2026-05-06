"use client"

import { useState, useEffect } from "react"
import { User } from "firebase/auth"
import { subscribeToAuthStateChanges, isMagicLinkCallback, completeMagicLinkSignIn } from "@/lib/auth"
import LoginScreen from "@/components/auth/LoginScreen"
import SplashScreen from "@/components/home/SplashScreen"
import CharacterBibleScreen from "@/components/character-bible/CharacterBibleScreen"
import LocationScoutingScreen from "@/components/location-scouting/LocationScoutingScreen"
import ActorListScreen from "@/components/actor-list/ActorListScreen"
import PublicCastingScreen from "@/components/public-casting/PublicCastingScreen"
import { CastingProvider } from "@/components/casting/CastingContext"

export default function App() {
  const [view, setView] = useState<"login" | "splash" | "character-bible" | "location-overview" | "actor-database" | "public-casting">("login")
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

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

    // Subscribe to authentication state changes
    const unsubscribe = subscribeToAuthStateChanges((authUser) => {
      if (!mounted) return
      setUser(authUser)
      if (authUser) {
        setView("splash")
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const handleSignOut = () => {
    setView("login")
  }

  const handleDemoAccess = () => {
    setView("splash")
  }

  const handleNavigate = (feature: string) => {
    if (feature === "character-bible" || feature === "location-overview" || feature === "actor-database" || feature === "public-casting") {
      setView(feature)
    }
  }

  const renderView = () => {
    switch (view) {
      case "login":
        return <LoginScreen onDemoAccess={handleDemoAccess} />
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
      default:
        return <LoginScreen onDemoAccess={handleDemoAccess} />
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
