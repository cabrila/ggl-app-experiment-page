"use client"

import { useState, useRef, useEffect } from "react"
import { LogOut, MessageSquarePlus, BookUser, MapPin, Users, Megaphone, ArrowRight } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import FeedbackModal from "@/components/modals/FeedbackModal"

const featureButtons = [
  {
    id: "character-bible",
    title: "Character Bible",
    description: "Generate comprehensive lists and detailed descriptions of characters based on your script.",
    icon: BookUser,
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    id: "location-overview",
    title: "Location Overview",
    description: "Produce lists and descriptions of locations inspired by your script for efficient scouting.",
    icon: MapPin,
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    id: "actor-database",
    title: "Actor List",
    description: "Create and manage an easily navigable list of actors for your production.",
    icon: Users,
    iconBg: "bg-sky-500/20",
    iconColor: "text-sky-400",
  },
  {
    id: "public-casting",
    title: "Public Casting",
    description: "Share a simple casting form for actors to submit themselves for roles in your project.",
    icon: Megaphone,
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
  },
]

interface SplashScreenProps {
  onSignOut?: () => void
  onNavigate?: (feature: string) => void
}

export default function SplashScreen({ onSignOut, onNavigate }: SplashScreenProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const userButtonRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { state } = useCasting()

  const handleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen)

  const handleSignOut = () => {
    setIsUserMenuOpen(false)
    onSignOut?.()
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isUserMenuOpen])

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #2d6b3f 0%, #1a4a2a 30%, #0f3520 55%, #0a2618 80%, #061a10 100%)",
      }}
    >
      {/* Top Navigation Bar - Only Logo and User Avatar */}
      <header className="relative flex justify-between items-center px-6 py-3 border-b border-white/10 shrink-0 z-20">
        <div className="flex items-center">
          <img
            src="/images/gogreenlight-logo.png"
            alt="GoGreenlight"
            className="h-9 w-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Feedback & Requests Button */}
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
            title="Feedback & Requests"
            aria-label="Open feedback form"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span className="text-sm font-medium font-sans hidden sm:inline">Feedback</span>
          </button>

          {/* User Avatar */}
          <div className="relative" ref={userButtonRef}>
            <button
              onClick={handleUserMenu}
              className="relative p-1 rounded-lg hover:bg-white/10 transition-all duration-200"
              title={state.currentUser?.name || "User"}
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: state.currentUser?.bgColor || "#6B7280",
                  color: state.currentUser?.color || "#FFFFFF",
                }}
              >
                {state.currentUser?.initials || "??"}
              </div>
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-2 w-48 bg-[#1a3a25] border border-white/15 rounded-lg shadow-xl overflow-hidden z-50"
              >
                {/* User Info */}
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-medium text-white truncate">
                    {state.currentUser?.name || "User"}
                  </p>
                  <p className="text-xs text-white/50 truncate">
                    {state.currentUser?.email || ""}
                  </p>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Hero and Feature Buttons */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 overflow-y-auto py-8">
        <div className="text-center px-6 max-w-2xl mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance leading-tight">
            Every creative asset.{" "}
            <span className="text-emerald-300">One platform.</span>
          </h1>
          <p className="text-white/50 text-base md:text-lg leading-relaxed text-pretty max-w-xl mx-auto">
            Organize characters, actors, locations and casting calls in one streamlined and efficient workflow.
          </p>
        </div>

        {/* Feature Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 w-full max-w-3xl">
          {featureButtons.map((feature) => {
            const IconComponent = feature.icon
            return (
              <button
                key={feature.id}
                onClick={() => {
                  onNavigate?.(feature.id)
                }}
                className="group flex items-start gap-4 p-5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 rounded-xl text-left transition-all duration-200"
              >
                {/* Icon */}
                <div className={`shrink-0 w-12 h-12 rounded-lg ${feature.iconBg} flex items-center justify-center`}>
                  <IconComponent className={`w-6 h-6 ${feature.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-white font-sans">
                      {feature.title}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed font-sans">
                    {feature.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </main>

      {/* Bottom tagline */}
      <footer className="text-center py-6 shrink-0">
        <p className="text-[11px] text-white/20 tracking-wide">
          © 2026 GoGreenlight. All rights reserved.
        </p>
      </footer>

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <FeedbackModal onClose={() => setIsFeedbackModalOpen(false)} />
      )}
    </div>
  )
}
