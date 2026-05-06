"use client"

import { useState, useRef, useEffect } from "react"
import { Home, LogOut, MessageSquarePlus, BookUser, MapPin, Users, Megaphone } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import FeedbackModal from "@/components/modals/FeedbackModal"

type ActiveView = "character-bible" | "location-overview" | "actor-database" | "public-casting"

const sidebarItems = [
  {
    id: "character-bible" as ActiveView,
    title: "Character Bible",
    icon: BookUser,
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    activeBg: "bg-emerald-500/30",
    activeBorder: "border-emerald-400",
  },
  {
    id: "location-overview" as ActiveView,
    title: "Location Scouting",
    icon: MapPin,
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    activeBg: "bg-amber-500/30",
    activeBorder: "border-amber-400",
  },
  {
    id: "actor-database" as ActiveView,
    title: "Actor List",
    icon: Users,
    iconBg: "bg-sky-500/20",
    iconColor: "text-sky-400",
    activeBg: "bg-sky-500/30",
    activeBorder: "border-sky-400",
  },
  {
    id: "public-casting" as ActiveView,
    title: "Public Casting",
    icon: Megaphone,
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    activeBg: "bg-violet-500/30",
    activeBorder: "border-violet-400",
  },
]

interface FeatureLayoutProps {
  children: React.ReactNode
  onBack: () => void
  onSignOut?: () => void
  activeView?: ActiveView
  onNavigate?: (view: ActiveView) => void
}

export default function FeatureLayout({ children, onBack, onSignOut, activeView, onNavigate }: FeatureLayoutProps) {
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
      {/* Top Navigation Bar - Logo, Back Button, Feedback, and User Avatar */}
      <header className="relative flex justify-between items-center px-6 py-3 border-b border-white/10 shrink-0 z-20">
        {/* Left side - Logo and Home Button */}
        <div className="flex items-center gap-3">
          <img
            src="/images/gogreenlight-logo.png"
            alt="GoGreenlight"
            className="h-9 w-auto"
          />
          <div className="h-6 w-px bg-white/20" />
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Go to Home"
            aria-label="Go to Home"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

        {/* Right side - Feedback and User Avatar */}
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

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Hidden on mobile */}
        <aside className="hidden md:flex flex-col w-16 border-r border-white/10 py-4 shrink-0">
          <nav className="flex flex-col items-center gap-2">
            {sidebarItems.map((item) => {
              const IconComponent = item.icon
              const isActive = activeView === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`
                    relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200
                    ${isActive 
                      ? `${item.activeBg} border-2 ${item.activeBorder}` 
                      : `${item.iconBg} border border-transparent hover:border-white/20 hover:bg-white/10`
                    }
                  `}
                  title={item.title}
                  aria-label={item.title}
                  aria-current={isActive ? "page" : undefined}
                >
                  <IconComponent className={`w-5 h-5 ${item.iconColor}`} />
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[1px] w-1 h-6 bg-current rounded-r-full" style={{ color: item.iconColor.includes('emerald') ? '#34d399' : item.iconColor.includes('amber') ? '#fbbf24' : item.iconColor.includes('sky') ? '#38bdf8' : '#a78bfa' }} />
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <FeedbackModal onClose={() => setIsFeedbackModalOpen(false)} />
      )}
    </div>
  )
}
