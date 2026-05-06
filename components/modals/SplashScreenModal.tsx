"use client"
import {
  X, Plus, FolderOpen, Database, Bell, Settings, HelpCircle, Users, Film,
  BarChart3, ArrowRight, Calendar, Search, FileText, Shirt, MapPin, Paintbrush,
  Clapperboard, Package, Sparkles
} from 'lucide-react'
import { openModal, replaceModal } from "./ModalManager"
import { useState, useEffect, useRef } from "react"
import UserMenu from "../layout/UserMenu"
import { useCasting } from "@/components/casting/CastingContext"

interface SplashScreenModalProps {
  onClose: () => void
}

export default function SplashScreenModal({ onClose }: SplashScreenModalProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const onCloseRef = useRef(onClose)
  const userButtonRef = useRef<HTMLDivElement>(null)
  const { state, dispatch } = useCasting()

  const [userStatus, setUserStatus] = useState<"available" | "busy" | "away">("available")
  const [showInitialsEditor, setShowInitialsEditor] = useState(false)
  const [tempInitials, setTempInitials] = useState("")

  const statusOptions = [
    { value: "available", label: "Available", color: "bg-green-500", description: "Ready to collaborate" },
    { value: "busy", label: "Busy", color: "bg-red-500", description: "In a meeting or focused work" },
    { value: "away", label: "Away", color: "bg-yellow-500", description: "Temporarily unavailable" },
  ] as const

  const getStatusColor = (status: string) => statusOptions.find((s) => s.value === status)?.color || "bg-gray-500"
  const getStatusLabel = (status: string) => statusOptions.find((s) => s.value === status)?.label || "Unknown"

  const handleInitialsChange = () => {
    if (!state.currentUser) return
    setTempInitials(state.currentUser.initials)
    setShowInitialsEditor(true)
  }

  const handleSaveInitials = () => {
    if (!state.currentUser || !tempInitials.trim()) return
    const newInitials = tempInitials.trim().toUpperCase().substring(0, 2)
    dispatch({ type: "UPDATE_USER", payload: { userId: state.currentUser.id, updates: { initials: newInitials } } })
    setShowInitialsEditor(false)
    setTempInitials("")
  }

  const handleCancelInitials = () => {
    setShowInitialsEditor(false)
    setTempInitials("")
  }

  useEffect(() => {
    let activityTimer: NodeJS.Timeout
    let awayTimer: NodeJS.Timeout
    const resetActivityTimer = () => {
      clearTimeout(activityTimer)
      clearTimeout(awayTimer)
      if (userStatus === "away") setUserStatus("available")
      awayTimer = setTimeout(() => { if (userStatus !== "busy") setUserStatus("away") }, 5 * 60 * 1000)
    }
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]
    activityEvents.forEach((event) => document.addEventListener(event, resetActivityTimer, true))
    resetActivityTimer()
    return () => {
      clearTimeout(activityTimer)
      clearTimeout(awayTimer)
      activityEvents.forEach((event) => document.removeEventListener(event, resetActivityTimer, true))
    }
  }, [userStatus])

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    const handleStatusChange = (event: CustomEvent) => setUserStatus(event.detail.status)
    const handleInitialsChangeEvt = () => {
      if (!state.currentUser) return
      setTempInitials(state.currentUser.initials)
      setShowInitialsEditor(true)
    }
    window.addEventListener("userStatusChange", handleStatusChange as EventListener)
    window.addEventListener("changeInitials", handleInitialsChangeEvt)
    return () => {
      window.removeEventListener("userStatusChange", handleStatusChange as EventListener)
      window.removeEventListener("changeInitials", handleInitialsChangeEvt)
    }
  }, [state.currentUser])

  const startTimer = () => {
    if (isTimerActive) return
    setIsTimerActive(true)
    timerRef.current = setTimeout(() => {
      // Use replaceModal for smooth transition
      replaceModal("projectManager")
      setIsTimerActive(false)
    }, 3000)
  }

  const handleNewProject = () => replaceModal("projectManager")
  const handleOpenProject = () => replaceModal("projectManager")
  const handleDatabase = () => replaceModal("database")
  const handleNotifications = () => openModal("notifications")
  const handleSettings = () => openModal("userPermissions")
  const handleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen)
  const handleCloseUserMenu = () => setIsUserMenuOpen(false)

  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current) } }, [])

  const unreadNotifications = state.notifications.filter((n) => !n.read).length
  const projectCount = state.projects.length
  const totalActors = state.projects.reduce((sum, p) => sum + p.characters.reduce((cSum, c) => cSum + (c.longList?.length || 0) + (c.auditionList?.length || 0) + (c.approvalList?.length || 0), 0), 0)
  const totalCharacters = state.projects.reduce((sum, p) => sum + p.characters.length, 0)

  const features = [
    {
      icon: FileText,
      title: "Script Management",
      desc: "Upload scripts, auto-extract character breakdowns, and manage scene-by-scene analysis for your production.",
      modal: "script" as const,
      accentFrom: "from-emerald-400/20",
      accentTo: "to-emerald-400/5",
      iconBg: "bg-emerald-400/20",
      iconColor: "text-emerald-300",
    },
    {
      icon: Users,
      title: "Casting",
      desc: "Manage Long Lists, Audition Lists, and Approval Lists. Track actors across characters and projects.",
      modal: "characters" as const,
      accentFrom: "from-sky-400/20",
      accentTo: "to-sky-400/5",
      iconBg: "bg-sky-400/20",
      iconColor: "text-sky-300",
    },
    {
      icon: Package,
      title: "Props",
      desc: "Full prop inventory with categories, scene assignments, purchase tracking, and armory supervision flags.",
      modal: "props" as const,
      accentFrom: "from-amber-400/20",
      accentTo: "to-amber-400/5",
      iconBg: "bg-amber-400/20",
      iconColor: "text-amber-300",
    },
    {
      icon: Shirt,
      title: "Costumes & Makeup",
      desc: "Organize wardrobe, track fittings, manage continuity notes, and coordinate looks per character and scene.",
      modal: "costumes" as const,
      accentFrom: "from-pink-400/20",
      accentTo: "to-pink-400/5",
      iconBg: "bg-pink-400/20",
      iconColor: "text-pink-300",
    },
    {
      icon: MapPin,
      title: "Locations",
      desc: "Scout, catalog, and manage shooting locations with permits, availability windows, and logistical notes.",
      modal: "locations" as const,
      accentFrom: "from-violet-400/20",
      accentTo: "to-violet-400/5",
      iconBg: "bg-violet-400/20",
      iconColor: "text-violet-300",
    },
    {
      icon: Paintbrush,
      title: "Production Design",
      desc: "Centralize set designs, color palettes, mood boards, and visual references for your creative vision.",
      modal: "productionDesign" as const,
      accentFrom: "from-orange-400/20",
      accentTo: "to-orange-400/5",
      iconBg: "bg-orange-400/20",
      iconColor: "text-orange-300",
    },
  ]

  return (
    <div className="fixed inset-0 flex flex-col z-50 overflow-hidden" style={{ background: "linear-gradient(180deg, #2d6b3f 0%, #1a4a2a 30%, #0f3520 55%, #0a2618 80%, #061a10 100%)" }}>


      {/* Timer indicator */}
      {isTimerActive && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-white/15 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 border border-white/20">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Loading project...
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="relative flex justify-between items-center px-6 py-3 border-b border-white/10 shrink-0 z-20">
        <div className="flex items-center">
          <img src="/images/gogreenlight-logo.png" alt="GoGreenlight" className="h-9 w-auto" />
        </div>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button onClick={handleNotifications} className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            {unreadNotifications > 0 && (
              <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">{unreadNotifications}</span>
              </div>
            )}
          </div>
          <button onClick={handleSettings} className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button onClick={() => openModal("helpWizard")} className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          <div className="w-px h-8 bg-white/15 mx-1.5" />
          <div className="relative" ref={userButtonRef}>
            <button onClick={handleUserMenu} className="relative p-1 rounded-lg hover:bg-white/10 transition-all duration-200" title={`${state.currentUser?.name} - ${userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}`}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: state.currentUser?.bgColor || "#6B7280", color: state.currentUser?.color || "#FFFFFF" }}>
                {state.currentUser?.initials || "??"}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center">
                <div className={`w-3.5 h-3.5 rounded-full border-2 border-[#1a4a2a] transition-all duration-200 ${getStatusColor(userStatus)}`} title={getStatusLabel(userStatus)} />
                {userStatus === "available" && <div className="absolute w-3.5 h-3.5 bg-green-400 rounded-full animate-ping opacity-75" />}
              </div>
            </button>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Scrollable Main Content */}
      <main className="flex-1 min-h-0 overflow-y-auto relative z-10">
        <div className="flex flex-col items-center px-6 py-10 md:py-14">

          {/* Hero Section */}
          <div className="text-center mb-10 md:mb-14 max-w-2xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance leading-tight">
              Every creative asset.{" "}
              <span className="text-emerald-300">One platform.</span>
            </h1>
            <p className="text-white/50 text-base md:text-lg leading-relaxed text-pretty max-w-xl mx-auto">
              GoGreenlight centralizes your entire production workflow -- scripts, casting, props, costumes, locations, and design -- so nothing falls through the cracks.
            </p>
          </div>

          {/* Quick Stats Bar */}
          {(projectCount > 0 || totalActors > 0) && (
            <div className="flex flex-wrap items-center justify-center gap-5 md:gap-6 mb-10 md:mb-14">
              <div className="flex items-center gap-2 text-sm">
                <Film className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-semibold">{projectCount}</span>
                <span className="text-white/40">{projectCount === 1 ? "Project" : "Projects"}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-semibold">{totalCharacters}</span>
                <span className="text-white/40">{totalCharacters === 1 ? "Character" : "Characters"}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-semibold">{totalActors}</span>
                <span className="text-white/40">{totalActors === 1 ? "Actor" : "Actors"}</span>
              </div>
            </div>
          )}

          {/* Primary Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-w-4xl w-full mb-14 md:mb-16">
            {/* New Project */}
            <button
              onClick={handleNewProject}
              disabled={isTimerActive}
              className="group relative overflow-hidden rounded-2xl bg-emerald-400 hover:bg-emerald-300 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-left shadow-lg shadow-emerald-900/30 hover:shadow-xl hover:shadow-emerald-900/40"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.25)_0%,_transparent_60%)]" />
              <div className="relative p-6 md:p-7 flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-white/25 rounded-xl backdrop-blur-sm">
                    <Plus className="w-6 h-6 text-emerald-950" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-emerald-950/30 group-hover:text-emerald-950/70 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-emerald-950 mb-1.5">New Project</h3>
                  <p className="text-emerald-950/60 text-sm leading-relaxed">Start a new production from scratch</p>
                </div>
              </div>
            </button>

            {/* Open Project */}
            <button
              onClick={handleOpenProject}
              disabled={isTimerActive}
              className="group relative overflow-hidden rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] hover:border-white/20 backdrop-blur-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-left"
            >
              <div className="relative p-6 md:p-7 flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <FolderOpen className="w-6 h-6 text-white/80" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1.5">Open Project</h3>
                  <p className="text-white/40 text-sm leading-relaxed">Browse and manage existing productions</p>
                </div>
              </div>
            </button>

            {/* Actor Database */}
            <button
              onClick={handleDatabase}
              disabled={isTimerActive}
              className="group relative overflow-hidden rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] hover:border-white/20 backdrop-blur-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-left"
            >
              <div className="relative p-6 md:p-7 flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Database className="w-6 h-6 text-white/80" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1.5">Actor Database</h3>
                  <p className="text-white/40 text-sm leading-relaxed">Search and discover actors across projects</p>
                </div>
              </div>
            </button>
          </div>

          {/* Feature Highlights Section */}
          <div className="max-w-5xl w-full mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-white/10" />
              <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">Centralized Production Management</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => (
                <button
                  key={feature.title}
onClick={() => {
  if (feature.modal) {
  // Use replaceModal for smooth transition without flicker
  replaceModal(feature.modal)
  }
  }}
                  disabled={!feature.modal}
                  className="group relative text-left rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 overflow-hidden disabled:cursor-default"
                >
                  {/* Accent gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.accentFrom} ${feature.accentTo} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl ${feature.iconBg} shrink-0`}>
                        <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                          {feature.modal && (
                            <ArrowRight className="w-3.5 h-3.5 text-white/0 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-white/35 leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom tagline */}
          <div className="text-center py-6">
            <p className="text-[11px] text-white/20 tracking-wide">
              GoGreenlight -- All your creative assets, one dashboard, zero silos.
            </p>
          </div>
        </div>
      </main>

      {/* User Menu */}
      <UserMenu isOpen={isUserMenuOpen} onClose={handleCloseUserMenu} anchorRef={userButtonRef} userStatus={userStatus} onStatusChange={setUserStatus} />

      {/* Initials Editor Modal */}
      {showInitialsEditor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-[#1a3a25] border border-white/15 rounded-xl p-6 w-80 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Change Initials</h3>
            <div className="mb-5">
              <label className="block text-sm font-medium text-white/60 mb-2">New Initials (max 2 characters)</label>
              <input
                type="text"
                value={tempInitials}
                onChange={(e) => setTempInitials(e.target.value)}
                maxLength={2}
                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-center text-lg font-bold uppercase placeholder-white/30"
                placeholder="AB"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSaveInitials} disabled={!tempInitials.trim()} className="flex-1 bg-emerald-500 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm">
                Save
              </button>
              <button onClick={handleCancelInitials} className="flex-1 bg-white/10 text-white/80 py-2.5 px-4 rounded-lg hover:bg-white/15 transition-colors font-medium text-sm border border-white/15">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
