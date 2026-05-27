"use client"

import { useState, useRef, useEffect } from "react"
import { LogOut, MessageSquarePlus, BookUser, MapPin, Users, Megaphone, ArrowRight, Package, Film, DollarSign, Download } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import FeedbackModal from "@/components/modals/FeedbackModal"
import { trackFeatureClick, type FeatureName } from "@/lib/analytics"
import { useFirebaseUser } from "@/hooks/useFirebaseUser"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  // Hidden for now — restore by uncommenting when Public Casting is ready.
  // {
  //   id: "public-casting",
  //   title: "Public Casting",
  //   description: "Share a simple casting form for actors to submit themselves for roles in your project.",
  //   icon: Megaphone,
  //   iconBg: "bg-violet-500/20",
  //   iconColor: "text-violet-400",
  // },
  {
    id: "prop-list",
    title: "Prop List",
    description: "Extract every prop and set dressing item from your script with scene-by-scene appearances.",
    icon: Package,
    iconBg: "bg-rose-500/20",
    iconColor: "text-rose-400",
  },
  {
    id: "scene-list",
    title: "Scene List",
    description: "Generate a structured scene-by-scene breakdown of your script for production planning.",
    icon: Film,
    iconBg: "bg-teal-500/20",
    iconColor: "text-teal-400",
  },
  {
    id: "download-screenplay",
    title: "Download Screenplay",
    description: "You can test the tools with this screenplay. The material is not copyrighted and free to use.",
    icon: Download,
    iconBg: "bg-indigo-500/20",
    iconColor: "text-indigo-400",
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
  const fbUser = useFirebaseUser()
  void state // legacy CastingContext kept for other home features

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
        <div className="flex items-center gap-3">
          <img
            src="/images/gogreenlight-logo.png"
            alt="GoGreenlight"
            className="h-9 w-auto"
          />
          <span className="text-xl font-semibold text-white tracking-tight">Tools</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wide">Beta</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Internal-only Usage & Cost button. Visibility-only gate; the
              /api/usage handler enforces the real access control. */}
          {fbUser.isInternal && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="/usage"
                    className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                    aria-label="Usage and cost"
                  >
                    <DollarSign className="w-5 h-5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  This button is only visible for users who have logged in with a @gogreenlight.ai email address
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

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
              title={fbUser.displayName}
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-emerald-600 text-white"
              >
                {fbUser.initials}
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
                    {fbUser.displayName}
                  </p>
                  <p className="text-xs text-white/50 truncate">
                    {fbUser.email}
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
      <main className="flex-1 relative z-10 overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center py-8">
          <div className="text-center px-6 max-w-2xl mb-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance leading-tight">
              Every creative asset.{" "}
              <span className="text-emerald-300">One platform.</span>
            </h1>
            <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto text-pretty">
              Upload your script. Get detailed breakdowns, cast actors, and manage
              your production — all in one place.
            </p>
          </div>

          {/* Feature Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full px-4">
            {featureButtons.map((feature) => {
              const IconComponent = feature.icon
              return (
                <button
                  key={feature.id}
                  onClick={() => {
                    trackFeatureClick(feature.id as FeatureName)
                    if (feature.id === "download-screenplay") {
                      // Trigger download of the screenplay PDF
                      const link = document.createElement("a")
                      link.href = "/screenplays/A_Dinner_Party_screenplay.pdf"
                      link.download = "A_Dinner_Party_screenplay.pdf"
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    } else {
                      onNavigate?.(feature.id)
                    }
                  }}
                  className="group relative flex flex-col items-start p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 text-left"
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${feature.iconBg} flex items-center justify-center mb-3`}
                  >
                    <IconComponent className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                    {feature.title}
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-emerald-400" />
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {feature.description}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Feedback callout */}
          <div className="mt-10 px-6 text-center max-w-2xl">
            <p className="text-base md:text-lg font-medium text-white/70 leading-relaxed">
              We&apos;re offering these tools for free because your feedback helps us build something great. 
              Found a bug or have an idea? Hit the{" "}
              <button
                onClick={() => setIsFeedbackModalOpen(true)}
                className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
              >
                Feedback
              </button>
              {" "}button in the top right corner.
            </p>
          </div>
        </div>
      </main>

      {/* Bottom tagline */}
      <footer className="py-8 px-6 shrink-0 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Left side - CTA */}
          <div className="text-center md:text-left">
            <a 
              href="https://www.gogreenlight.ai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg transition-colors"
            >
              Try GoGreenlight Casting Platform
              <ArrowRight className="w-4 h-4" />
            </a>
            <p className="text-sm text-white/50 mt-3">
              No credit card needed — your feedback is welcome in this Beta.
            </p>
          </div>

          {/* Right side - Legal Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">Legal</h4>
            <ul className="space-y-1">
              <li>
                <a href="https://www.gogreenlight.ai/legalstack" target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-white/80 transition-colors">
                  Legal Stack
                </a>
              </li>
              <li>
                <a href="https://www.gogreenlight.ai/privacypolicy" target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-white/80 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://www.gogreenlight.ai/terms" target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-white/80 transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-[11px] text-white/20 tracking-wide mt-8 text-center">
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
