"use client"

import { useCasting } from "@/components/casting/CastingContext"
import { Bell, Folder, FileText, Users, Settings } from "lucide-react"
import { openModal } from "@/components/modals/ModalManager"
import UserMenu from "./UserMenu"
import { useState, useRef } from "react"

export default function TopMenuBar() {
  const { state } = useCasting()
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const unreadNotifications = state.notifications.filter((n) => !n.read).length

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userAvatarRef = useRef<HTMLDivElement>(null)

  return (
    <header className="bg-gradient-to-r from-white via-slate-50 to-white border-b border-slate-200/60 sticky top-0 z-50 backdrop-blur-md shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img src="/images/gogreenlight-logo.png" alt="GoGreenlight" className="h-9 w-auto" />
          </div>

          {/* Center Menu */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => openModal("projectManager")}
              className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-success-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50 backdrop-blur-sm group"
            >
              <Folder className="w-4 h-4 group-hover:text-success-500 transition-colors" />
              <span>Project: {currentProject?.name || "N/A"}</span>
            </button>

            <button
              onClick={() => openModal("castingBreakdown")}
              className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-info-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50 backdrop-blur-sm group"
            >
              <FileText className="w-4 h-4 group-hover:text-info-500 transition-colors" />
              <span>Casting Breakdown</span>
            </button>

            <button
              onClick={() => openModal("teamSuggestions")}
              className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-purple-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50 backdrop-blur-sm group"
            >
              <Users className="w-4 h-4 group-hover:text-purple-500 transition-colors" />
              <span>Team Suggestions</span>
            </button>

            <button
              onClick={() => openModal("userPermissions")}
              className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-orange-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50 backdrop-blur-sm group"
            >
              <Settings className="w-4 h-4 group-hover:text-orange-500 transition-colors" />
              <span>Permissions</span>
            </button>
          </div>

          {/* Right Menu */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => openModal("notifications")}
              className="relative p-3 text-slate-600 hover:text-success-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50 backdrop-blur-sm group"
            >
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {unreadNotifications > 0 && (
                <div className="absolute -top-1 -right-1 bg-error-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg notification-badge-pulse">
                  {unreadNotifications}
                </div>
              )}
            </button>

            {state.currentUser && (
              <div className="relative">
                <div
                  ref={userAvatarRef}
                  className="relative w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-white"
                  style={{
                    background: `linear-gradient(135deg, ${state.currentUser.bgColor}, ${state.currentUser.bgColor}dd)`,
                    color: state.currentUser.color,
                  }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  {state.currentUser.initials}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <UserMenu isOpen={isUserMenuOpen} onClose={() => setIsUserMenuOpen(false)} anchorRef={userAvatarRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
