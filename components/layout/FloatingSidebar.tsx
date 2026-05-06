"use client"

import { useState, useEffect } from "react"
import {
  X,
  Folder,
  ScrollText,
  UserCircle,
  Sparkles,
  FileText,
  Users,
  Package,
  Scissors,
  MapPin,
  Paintbrush,
  Calendar,
  Tv,
  Settings,
  ChevronDown,
  ChevronRight,
  Database,
  HelpCircle,
  Trash2,
  Film,
  Home,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal, closeModal, navigateToModal } from "@/components/modals/ModalManager"

interface FloatingSidebarProps {
  isOpen: boolean
  onClose: () => void
  onToggle: () => void
  currentModal?: string
}

export default function FloatingSidebar({ isOpen, onClose, onToggle, currentModal }: FloatingSidebarProps) {
  const { state, dispatch } = useCasting()
  const [castingToolsOpen, setCastingToolsOpen] = useState(false)
  const [dataToolsOpen, setDataToolsOpen] = useState(false)
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)

  const handleNavigation = (modalName: string) => {
    onClose()
    // Use navigateToModal for smooth transition without flicker
    navigateToModal(modalName)
  }

  const handleGoHome = () => {
    onClose()
    // Navigate to splash screen smoothly
    navigateToModal("splashScreen")
  }

  const handleLoadDemoData = async () => {
    setIsLoadingDemo(true)
    try {
      const { mockData } = await import("@/lib/mockData")
      await new Promise((resolve) => setTimeout(resolve, 500))
      dispatch({ type: "LOAD_DEMO_DATA", payload: mockData })
    } catch (error) {
      console.error("Error loading demo data:", error)
    } finally {
      setIsLoadingDemo(false)
    }
  }

  const handleClearCache = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gogreenlight-cache-cleared", "true")
    }
    onClose()
    openModal("clearCache")
  }

  const handleOpenHelpWizard = () => {
    onClose()
    openModal("helpWizard")
  }

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  // Navigation items for the slim strip
  // Order: Project, Script, Characters, Casting, then other items, with Casting Tools at bottom
  const navItems = [
    { icon: Home, label: "Project", action: handleGoHome, color: "hover:text-emerald-600 hover:bg-emerald-50" },
    { icon: ScrollText, label: "Script", modal: "script", color: "hover:text-amber-600 hover:bg-amber-50" },
    { icon: UserCircle, label: "Characters", modal: "characters", color: "hover:text-purple-600 hover:bg-purple-50" },
    { icon: Film, label: "Casting", modal: "casting", color: "hover:text-emerald-600 hover:bg-emerald-50" },
    { icon: Package, label: "Props", modal: "props", color: "hover:text-amber-700 hover:bg-amber-50" },
    { icon: Scissors, label: "Costumes", modal: "costumes", color: "hover:text-pink-600 hover:bg-pink-50" },
    { icon: MapPin, label: "Locations", modal: "locations", color: "hover:text-teal-600 hover:bg-teal-50" },
    { icon: Paintbrush, label: "Production", modal: "productionDesign", color: "hover:text-slate-700 hover:bg-slate-100" },
    { icon: Calendar, label: "Schedule", modal: "schedule", color: "hover:text-blue-600 hover:bg-blue-50" },
    { icon: Tv, label: "Casting Tools", modal: "castingForTV", color: "hover:text-indigo-600 hover:bg-indigo-50" },
  ]

  return (
    <>
      {/* Backdrop - only when expanded */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[65] transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slim Vertical Strip - Always visible */}
      <div
        className={`fixed left-0 top-0 bottom-0 z-[70] flex transition-all duration-300 ease-out ${
          isOpen ? "w-80" : "w-14"
        }`}
      >
        {/* Collapsed Strip */}
        <div
          className={`flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 border-r border-slate-200 shadow-sm transition-all duration-300 overflow-x-hidden ${
            isOpen ? "w-0 opacity-0 overflow-hidden" : "w-14 opacity-100"
          }`}
        >
          {/* Logo */}
          <div className="h-14 flex items-center justify-center border-b border-slate-200">
            <button
              onClick={onToggle}
              className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-colors border border-emerald-200/50"
              title="Expand navigation"
            >
              <img src="/images/logo-mini.png" alt="GoGreenlight" className="w-6 h-6 object-contain" />
            </button>
          </div>

          {/* Navigation Icons */}
          <div className="flex-1 py-3 flex flex-col items-center space-y-1 overflow-y-auto overflow-x-hidden">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = item.modal === currentModal
              return (
                <button
                  key={index}
                  onClick={() => item.action ? item.action() : item.modal && handleNavigation(item.modal)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${
                    isActive
                      ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                      : `text-slate-500 ${item.color}`
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                  {/* Tooltip */}
                  <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[80] shadow-lg">
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Expand Button */}
          <div className="p-2 border-t border-slate-200">
            <button
              onClick={onToggle}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expanded Sidebar */}
        <div
          className={`flex flex-col bg-gradient-to-b from-white via-slate-50 to-white shadow-2xl transition-all duration-300 overflow-hidden ${
            isOpen ? "w-80 opacity-100" : "w-0 opacity-0"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200/60 shrink-0">
            <img src="/images/gogreenlight-logo.png" alt="GoGreenlight" className="h-9 w-auto" />
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* Home Button */}
            <button
              onClick={handleGoHome}
              className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-emerald-200/50"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            {/* Project Selector */}
            <button
              onClick={() => handleNavigation("projectManager")}
              className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
            >
              <Folder className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Project: {currentProject?.name || "N/A"}</span>
            </button>

            {/* Casting */}
            <button
              onClick={() => handleNavigation("casting")}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border ${
                currentModal === "casting"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "text-slate-700 hover:text-emerald-600 bg-white/60 hover:bg-white border-slate-200/50"
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Casting</span>
            </button>

            {/* Script */}
            <button
              onClick={() => handleNavigation("script")}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border ${
                currentModal === "script"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "text-slate-700 hover:text-amber-600 bg-white/60 hover:bg-white border-slate-200/50"
              }`}
            >
              <ScrollText className="w-4 h-4" />
              <span>Script</span>
            </button>

            {/* Characters */}
            <button
              onClick={() => handleNavigation("characters")}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border ${
                currentModal === "characters"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "text-slate-700 hover:text-emerald-600 bg-white/60 hover:bg-white border-slate-200/50"
              }`}
            >
              <UserCircle className="w-4 h-4" />
              <span>Characters</span>
            </button>

            {/* Casting Tools Accordion */}
            <div className="rounded-xl border border-slate-200/50 bg-white/60 overflow-hidden">
              <button
                onClick={() => setCastingToolsOpen(!castingToolsOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white transition-all duration-200"
              >
                <span className="flex items-center space-x-3">
                  <Sparkles className="w-4 h-4" />
                  <span>Casting Tools</span>
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    castingToolsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  castingToolsOpen ? "max-h-40" : "max-h-0"
                }`}
              >
                <div className="px-2 pb-2 space-y-1">
                  <button
                    onClick={() => handleNavigation("castingBreakdown")}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Casting Breakdown</span>
                  </button>
                  <button
                    onClick={() => handleNavigation("teamSuggestions")}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Team Suggestions</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Props */}
            <button
              onClick={() => handleNavigation("props")}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border ${
                currentModal === "props"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "text-slate-700 hover:text-amber-700 bg-white/60 hover:bg-white border-slate-200/50"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Props</span>
            </button>

            {/* Costumes & Makeup */}
            <button
              onClick={() => handleNavigation("costumes")}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border ${
                currentModal === "costumes"
                  ? "bg-pink-50 text-pink-700 border-pink-200"
                  : "text-slate-700 hover:text-pink-600 bg-white/60 hover:bg-white border-slate-200/50"
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Costumes & Makeup</span>
            </button>

            {/* Locations */}
            <button
              onClick={() => handleNavigation("locations")}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border ${
                currentModal === "locations"
                  ? "bg-teal-50 text-teal-700 border-teal-200"
                  : "text-slate-700 hover:text-teal-600 bg-white/60 hover:bg-white border-slate-200/50"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Locations</span>
            </button>

            {/* Production Design */}
            <button
              onClick={() => handleNavigation("productionDesign")}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border ${
                currentModal === "productionDesign"
                  ? "bg-slate-100 text-slate-800 border-slate-300"
                  : "text-slate-700 hover:text-slate-900 bg-white/60 hover:bg-white border-slate-200/50"
              }`}
            >
              <Paintbrush className="w-4 h-4" />
              <span>Production Design</span>
            </button>

            {/* Schedule */}
            <button
              onClick={() => handleNavigation("schedule")}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border ${
                currentModal === "schedule"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "text-slate-700 hover:text-blue-600 bg-white/60 hover:bg-white border-slate-200/50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </button>

            {/* Casting for TV */}
            <button
              onClick={() => handleNavigation("castingForTV")}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border ${
                currentModal === "castingForTV"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "text-slate-700 hover:text-indigo-600 bg-white/60 hover:bg-white border-slate-200/50"
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Casting for TV</span>
            </button>

            {/* Permissions */}
            <button
              onClick={() => handleNavigation("userPermissions")}
              className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-orange-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
            >
              <Settings className="w-4 h-4" />
              <span>Permissions</span>
            </button>

            {/* Data Tools Accordion */}
            <div className="rounded-xl border border-slate-200/50 bg-white/60 overflow-hidden mt-4">
              <button
                onClick={() => setDataToolsOpen(!dataToolsOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white transition-all duration-200"
              >
                <span className="flex items-center space-x-3">
                  <Database className="w-4 h-4" />
                  <span>Data & Settings</span>
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    dataToolsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  dataToolsOpen ? "max-h-40" : "max-h-0"
                }`}
              >
                <div className="px-2 pb-2 space-y-1">
                  <button
                    onClick={handleLoadDemoData}
                    disabled={isLoadingDemo}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{isLoadingDemo ? "Loading..." : "Load Demo Data"}</span>
                  </button>
                  <button
                    onClick={handleClearCache}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cache</span>
                  </button>
                  <button
                    onClick={handleOpenHelpWizard}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Help</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

</div>
      </div>
    </>
  )
}
