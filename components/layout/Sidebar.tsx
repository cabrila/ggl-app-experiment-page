"use client"

import type React from "react"
import { Calendar } from "lucide-react"

import { useCasting } from "@/components/casting/CastingContext"
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  Eye,
  Database,
  HelpCircle,
  Sparkles,
  Home,
  Folder,
  FileText,
  Users,
  Bell,
  UserCircle,
  Package,
  MapPin,
  Scissors,
  ScrollText,
  ChevronDown,
  Paintbrush,
  Tv,
} from "lucide-react"
import { openModal } from "@/components/modals/ModalManager"
import { useState, useEffect, useRef } from "react"
import { mockData } from "@/lib/mockData"
import UserMenu from "./UserMenu"

export default function Sidebar() {
  const { state, dispatch } = useCasting()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [castingToolsOpen, setCastingToolsOpen] = useState(false)
  const userAvatarRef = useRef<HTMLDivElement>(null)

  const [collapsedSections, setCollapsedSections] = useState<{
    currentUser: boolean
    cardDisplay: boolean
    dataTools: boolean
  }>({
    currentUser: true,
    cardDisplay: true,
    dataTools: true,
  })

  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean
    x: number
    y: number
    userId: string | null
  }>({
    isVisible: false,
    x: 0,
    y: 0,
    userId: null,
  })

  const contextMenuRef = useRef<{
    isVisible: boolean
    x: number
    y: number
    userId: string | null
  }>({
    isVisible: false,
    x: 0,
    y: 0,
    userId: null,
  })

  const handleClickOutsideRef = useRef<(e: MouseEvent) => void>(() => {})

  const handleCloseContextMenu = () => {
    setContextMenu({
      isVisible: false,
      x: 0,
      y: 0,
      userId: null,
    })
    contextMenuRef.current = {
      isVisible: false,
      x: 0,
      y: 0,
      userId: null,
    }
  }

  useEffect(() => {
    handleClickOutsideRef.current = (e: MouseEvent) => {
      if (contextMenuRef.current.isVisible) {
        handleCloseContextMenu()
      }
    }

    document.addEventListener("click", handleClickOutsideRef.current)

    return () => {
      document.removeEventListener("click", handleClickOutsideRef.current)
    }
  }, [])

  // Load collapsed sections state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed-sections")
    if (savedState) {
      try {
        setCollapsedSections(JSON.parse(savedState))
      } catch (error) {
        console.error("Error loading collapsed sections state:", error)
      }
    }
  }, [])

  // Save collapsed sections state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed-sections", JSON.stringify(collapsedSections))
  }, [collapsedSections])

  if (!state) {
    return <div className="w-72 bg-white shadow-lg hidden md:flex">Loading...</div>
  }

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const unreadNotifications = state.notifications.filter((n) => !n.read).length

  const handleUserChange = (userId: string) => {
    const user = state.users.find((u) => u.id === userId)
    if (user) {
      dispatch({ type: "SET_CURRENT_USER", payload: user })
    }
  }

  const handleCardSettingChange = (field: string, value: boolean) => {
    dispatch({
      type: "UPDATE_CARD_SETTINGS",
      payload: { field, value },
    })
  }

  const handleClearCache = () => {
    // Set flag to show splash screen after cache clear
    if (typeof window !== "undefined") {
      localStorage.setItem("gogreenlight-cache-cleared", "true")
    }
    openModal("clearCache")
  }

  const handleLoadDemoData = async () => {
    setIsLoadingDemo(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      dispatch({ type: "LOAD_DEMO_DATA", payload: mockData })
      console.log("Demo data loaded successfully")
    } catch (error) {
      console.error("Error loading demo data:", error)
    } finally {
      setIsLoadingDemo(false)
    }
  }

  const handleOpenHelpWizard = () => {
    openModal("helpWizard")
  }

  const handleOpenSplashScreen = () => {
    openModal("splashScreen")
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleRightClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault()
    setContextMenu({
      isVisible: true,
      x: e.clientX,
      y: e.clientY,
      userId,
    })
    contextMenuRef.current = {
      isVisible: true,
      x: e.clientX,
      y: e.clientY,
      userId,
    }
  }

  const handleRenameUser = () => {
    if (!contextMenu.userId) return

    const user = state.users.find((u) => u.id === contextMenu.userId)
    if (!user) return

    const newName = prompt(`Rename user "${user.name}":`, user.name)
    if (newName && newName.trim() && newName.trim() !== user.name) {
      const nameParts = newName.trim().split(" ")
      const newInitials =
        nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : newName.trim().substring(0, 2).toUpperCase()

      dispatch({
        type: "UPDATE_USER",
        payload: {
          userId: contextMenu.userId,
          updates: {
            name: newName.trim(),
            initials: newInitials,
          },
        },
      })
    }
    handleCloseContextMenu()
  }

  const toggleSection = (section: "currentUser" | "cardDisplay" | "dataTools") => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div
      className={`bg-gradient-to-b from-white via-slate-50 to-white shadow-[4px_0px_8px_-1px_rgba(0,0,0,0.05)] hidden md:flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out border-r border-slate-200/60 z-10 ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Logo + Notifications header */}
      <div className="p-4 border-b border-slate-200/60">
        {/* Expanded: logo row with bell to the right */}
        <div
          className={`flex items-center justify-between transition-all duration-300 ease-in-out ${
            isCollapsed ? "opacity-0 scale-95 max-h-0 pointer-events-none" : "opacity-100 scale-100 max-h-14"
          }`}
        >
          <img src="/images/gogreenlight-logo.png" alt="GoGreenlight" className="h-9 w-auto" />
          <button
            onClick={() => openModal("notifications")}
            className="relative p-1.5 text-slate-500 hover:text-success-600 rounded-lg hover:bg-slate-100 transition-all duration-200"
            title="Notifications"
            aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ""}`}
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <div className="absolute -top-0.5 -right-0.5 bg-error-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-sm notification-badge-pulse">
                {unreadNotifications}
              </div>
            )}
          </button>
        </div>
        {/* Collapsed: centered mini logo */}
        <div
          className={`flex justify-center transition-all duration-300 ease-in-out ${
            isCollapsed ? "opacity-100 scale-100 max-h-14" : "opacity-0 scale-95 max-h-0 pointer-events-none"
          }`}
        >
          <img src="/images/logo-mini.png" alt="GoGreenlight" className="h-10 w-10 rounded-lg" />
        </div>
      </div>

      {/* Collapsed: bell + toggle row between logo and menu */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b border-slate-200/60 transition-all duration-300 ${
          isCollapsed ? "max-h-16 opacity-100" : "max-h-0 opacity-0 overflow-hidden py-0 border-b-0"
        }`}
      >
        <button
          onClick={() => openModal("notifications")}
          className="relative p-2 text-slate-700 hover:text-success-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
          title="Notifications"
          aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ""}`}
          tabIndex={isCollapsed ? 0 : -1}
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <div className="absolute -top-1 -right-1 bg-error-500 text-white text-xs font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shadow-lg notification-badge-pulse">
              {unreadNotifications}
            </div>
          )}
        </button>
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 group"
          aria-label="Expand sidebar"
          tabIndex={isCollapsed ? 0 : -1}
        >
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-success-600 transition-colors" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Project Selector and Top Menu Items */}
        <div className="p-4 space-y-2 border-b border-slate-200/60">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal("projectManager")}
                  className="flex-1 min-w-0 flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-success-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
                >
                  <Folder className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Project: {currentProject?.name || "N/A"}</span>
                </button>
                <button
                  onClick={toggleSidebar}
                  className="flex-shrink-0 p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 group border border-slate-200/50"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-success-600 transition-colors" />
                </button>
              </div>

              <button
                onClick={() => openModal("script")}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-amber-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              >
                <ScrollText className="w-4 h-4" />
                <span>Script</span>
              </button>

              <button
                onClick={() => openModal("characters")}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-success-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              >
                <UserCircle className="w-4 h-4" />
                <span>Characters</span>
              </button>

              {/* Casting Tools accordion */}
              <div className="rounded-xl border border-slate-200/50 bg-white/60 overflow-hidden">
                <button
                  onClick={() => setCastingToolsOpen(!castingToolsOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white transition-all duration-200"
                >
                  <span className="flex items-center space-x-3">
                    <Sparkles className="w-4 h-4" />
                    <span>Casting Tools</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${castingToolsOpen ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-200 ${castingToolsOpen ? "max-h-40" : "max-h-0"}`}>
                  <div className="px-2 pb-2 space-y-1">
                    <button
                      onClick={() => openModal("castingBreakdown")}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-info-600 hover:bg-info-50 rounded-lg transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Casting Breakdown</span>
                    </button>
                    <button
                      onClick={() => openModal("teamSuggestions")}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Team Suggestions</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openModal("props")}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-amber-700 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              >
                <Package className="w-4 h-4" />
                <span>Props</span>
              </button>

              <button
                onClick={() => openModal("costumes")}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-pink-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              >
                <Scissors className="w-4 h-4" />
                <span>Costumes & Makeup</span>
              </button>

              <button
                onClick={() => openModal("locations")}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-teal-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              >
                <MapPin className="w-4 h-4" />
                <span>Locations</span>
              </button>

              <button
                onClick={() => openModal("productionDesign")}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              >
                <Paintbrush className="w-4 h-4" />
                <span>Production Design</span>
              </button>

              <button
                onClick={() => openModal("schedule")}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-indigo-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule</span>
              </button>

              <button
                onClick={() => openModal("castingForTV")}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-cyan-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              >
                <Tv className="w-4 h-4" />
                <span>Casting for TV</span>
              </button>

              <button
                onClick={() => openModal("userPermissions")}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-orange-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              >
                <Settings className="w-4 h-4" />
                <span>Permissions</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openModal("projectManager")}
                className="w-full flex justify-center p-3 text-slate-700 hover:text-success-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
                title={`Project: ${currentProject?.name || "N/A"}`}
              >
                <Folder className="w-5 h-5" />
              </button>

              <button
                onClick={() => openModal("script")}
                className="w-full flex justify-center p-3 text-slate-700 hover:text-amber-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
                title="Script"
              >
                <ScrollText className="w-5 h-5" />
              </button>

              <button
                onClick={() => openModal("characters")}
                className="w-full flex justify-center p-3 text-slate-700 hover:text-success-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
                title="Characters"
              >
                <UserCircle className="w-5 h-5" />
              </button>

              {/* Casting Tools collapsed group */}
              <div className="relative group/casting">
                <button
                  onClick={() => setCastingToolsOpen(!castingToolsOpen)}
                  className={`w-full flex justify-center p-3 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50 ${castingToolsOpen ? "text-info-600" : "text-slate-700 hover:text-info-600"}`}
                  title="Casting Tools"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
                {castingToolsOpen && (
                  <div className="absolute left-full top-0 ml-2 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 min-w-[170px]">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Casting Tools</p>
                    <button
                      onClick={() => { openModal("castingBreakdown"); setCastingToolsOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-info-600 hover:bg-info-50 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Casting Breakdown
                    </button>
                    <button
                      onClick={() => { openModal("teamSuggestions"); setCastingToolsOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Team Suggestions
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => openModal("props")}
                className="w-full flex justify-center p-3 text-slate-700 hover:text-amber-700 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
                title="Props"
              >
                <Package className="w-5 h-5" />
              </button>

              <button
                onClick={() => openModal("costumes")}
                className="w-full flex justify-center p-3 text-slate-700 hover:text-pink-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
                title="Costumes & Makeup"
              >
                <Scissors className="w-5 h-5" />
              </button>

              <button
                onClick={() => openModal("locations")}
                className="w-full flex justify-center p-3 text-slate-700 hover:text-teal-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
                title="Locations"
              >
                <MapPin className="w-5 h-5" />
              </button>

              <button
                onClick={() => openModal("productionDesign")}
                className="w-full flex justify-center p-3 text-slate-700 hover:text-slate-900 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
                title="Production Design"
              >
                <Paintbrush className="w-5 h-5" />
              </button>

              <button
                onClick={() => openModal("schedule")}
                className="w-full flex justify-center p-3 text-slate-700 hover:text-indigo-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
                title="Schedule"
              >
                <Calendar className="w-5 h-5" />
              </button>

              <button
                onClick={() => openModal("castingForTV")}
                className="w-full flex justify-center p-3 text-slate-700 hover:text-cyan-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
                title="Casting for TV"
              >
                <Tv className="w-5 h-5" />
              </button>

              <button
                onClick={() => openModal("userPermissions")}
                className="w-full flex justify-center p-3 text-slate-700 hover:text-orange-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
                title="Permissions"
              >
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Current User Section */}
        <div className="p-4 space-y-2 border-b border-slate-200/60">
          {!isCollapsed ? (
            <>
              <button
                onClick={() => toggleSection("currentUser")}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-purple-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              >
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4" />
                  <span>Current User</span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-200 ${
                    collapsedSections.currentUser ? "" : "rotate-90"
                  }`}
                />
              </button>

              {!collapsedSections.currentUser && (
                <div className="space-y-2 pl-2 pt-2">
                  {state.users.map((user) => (
                    <div key={user.id} onContextMenu={(e) => handleRightClick(e, user.id)}>
                      <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-xl hover:bg-slate-100 transition-colors">
                        <input
                          type="radio"
                          name="currentUser"
                          value={user.id}
                          checked={state.currentUser?.id === user.id}
                          onChange={() => handleUserChange(user.id)}
                          className="form-radio h-4 w-4 text-success-500 focus:ring-success-500"
                        />
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${user.bgColor}, ${user.bgColor}dd)`,
                            color: user.color,
                          }}
                        >
                          {user.initials}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{user.name}</span>
                      </label>
                    </div>
                  ))}
                  {state.currentUser && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60">
                      <div
                        ref={userAvatarRef}
                        className="relative w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold cursor-pointer p-2 rounded-xl hover:bg-slate-100 transition-colors"
                        style={{
                          background: `linear-gradient(135deg, ${state.currentUser.bgColor}, ${state.currentUser.bgColor}dd)`,
                          color: state.currentUser.color,
                        }}
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      >
                        {state.currentUser.initials}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-success-400 to-success-500 rounded-full border-2 border-background shadow-sm"></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full flex justify-center p-3 text-slate-700 hover:text-purple-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              title="Current User"
            >
              <User className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Card View Settings Section */}
        <div className="p-4 space-y-2 border-b border-slate-200/60">
          {!isCollapsed ? (
            <>
              <button
                onClick={() => toggleSection("cardDisplay")}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-indigo-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              >
                <div className="flex items-center space-x-3">
                  <Eye className="w-4 h-4" />
                  <span>Card Display</span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-200 ${
                    collapsedSections.cardDisplay ? "" : "rotate-90"
                  }`}
                />
              </button>

              {!collapsedSections.cardDisplay && (
                <div className="space-y-2 pl-2 pt-2">
                  {Object.entries(state.cardViewSettings || {}).map(([field, value]) => {
                    if (["showProgress", "showTags", "showReels", "auditionTapes"].includes(field)) {
                      return null
                    }
                    return (
                      <div key={field}>
                        <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-xl hover:bg-slate-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleCardSettingChange(field, e.target.checked)}
                            className="form-checkbox h-4 w-4 rounded text-success-500 focus:ring-success-500"
                          />
                          <span className="text-sm text-slate-700 capitalize">
                            {field === "imdb"
                              ? "IMDB"
                              : field === "imdbUrl"
                                ? "IMDB"
                                : field === "mediaAndNotes"
                                  ? "Media & Notes"
                                  : field.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full flex justify-center p-3 text-slate-700 hover:text-indigo-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              title="Card Display"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Data Management Section */}
        <div className="p-4 space-y-2 border-b border-slate-200/60">
          {!isCollapsed ? (
            <>
              <button
                onClick={() => toggleSection("dataTools")}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-orange-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/60"
              >
                <div className="flex items-center space-x-3">
                  <Database className="w-4 h-4" />
                  <span>Data Tools</span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-200 ${
                    collapsedSections.dataTools ? "" : "rotate-90"
                  }`}
                />
              </button>

              {!collapsedSections.dataTools && (
                <div className="space-y-2 pl-2 pt-2">
                  <button
                    onClick={handleClearCache}
                    className="flex items-center space-x-3 w-full text-sm text-destructive hover:text-error-700 hover:bg-error-100 px-3 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    title="Clear all cached data and reset application"
                  >
                    <Trash2 size={16} />
                    <span>Clear Cache</span>
                  </button>

                  <button
                    onClick={handleLoadDemoData}
                    disabled={isLoadingDemo}
                    className="flex items-center space-x-3 w-full text-sm text-info-600 hover:text-info-700 hover:bg-info-100 px-3 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    title="Load demo data and reset to initial state"
                  >
                    {isLoadingDemo ? (
                      <div className="w-4 h-4 border-2 border-info-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Database size={16} />
                    )}
                    <span>{isLoadingDemo ? "Loading..." : "Load Demo Data"}</span>
                  </button>

                  <button
                    onClick={handleOpenSplashScreen}
                    className="flex items-center space-x-3 w-full text-sm text-success-600 hover:text-success-700 hover:bg-success-100 px-3 py-2 rounded-xl transition-all duration-200 font-medium"
                    title="Open splash screen"
                  >
                    <Sparkles size={16} />
                    <span>Splash Screen</span>
                  </button>

                  <button
                    onClick={handleOpenHelpWizard}
                    className="flex items-center space-x-3 w-full text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-xl transition-all duration-200 font-medium"
                    title="Open help wizard"
                  >
                    <HelpCircle size={16} />
                    <span>Help & Support</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full flex justify-center p-3 text-slate-700 hover:text-orange-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
              title="Data Tools"
            >
              <Database className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Back to Menu Section - Fixed at bottom */}
      <div className="p-4 border-t border-slate-200/60 mt-auto">
        <button
          onClick={handleOpenSplashScreen}
          className={`w-full flex items-center text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md border border-slate-200 ${
            isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-2.5"
          }`}
          title="Back to Menu"
          aria-label="Back to Menu"
        >
          <Home className={`flex-shrink-0 transition-all duration-300 ${isCollapsed ? "w-5 h-5" : "w-4 h-4"}`} />
          <span
            className={`whitespace-nowrap transition-all duration-300 ${
              isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
            }`}
          >
            Back to Menu
          </span>
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu.isVisible && (
        <div
          className="fixed z-50 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 min-w-[140px] backdrop-blur-md"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleRenameUser}
            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-3 transition-colors rounded-xl"
          >
            <User className="w-4 h-4 text-slate-500" />
            <span>Rename User</span>
          </button>
        </div>
      )}

      {/* User Menu */}
      <UserMenu isOpen={isUserMenuOpen} onClose={() => setIsUserMenuOpen(false)} anchorRef={userAvatarRef} />
    </div>
  )
}
