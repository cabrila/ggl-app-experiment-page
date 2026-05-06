"use client"

import { useState, useRef, useEffect } from "react"
import { Home, X, Bell, LogOut, Settings, HelpCircle, CheckCircle, Save } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal, navigateToModal } from "@/components/modals/ModalManager"
import { Button } from "@/components/ui/button"

interface ModalHeaderProps {
  title: string
  titleColor?: string
  onClose: () => void
  onHome?: () => void
  showProjectName?: boolean
  showCloseConfirmation?: boolean
  children?: React.ReactNode
}

export default function ModalHeader({
  title,
  titleColor = "bg-teal-600",
  onClose,
  onHome,
  showProjectName = true,
  showCloseConfirmation = true,
  children,
}: ModalHeaderProps) {
  const { state } = useCasting()
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const unreadNotifications = state.notifications.filter((n) => !n.read).length
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleHome = () => {
    if (onHome) {
      onHome()
    } else {
      // Use navigateToModal for smooth transition without flicker
      navigateToModal("splashScreen")
    }
  }

  const handleNotifications = () => {
    openModal("notifications")
  }

  const handleCloseClick = () => {
    if (showCloseConfirmation && currentProject) {
      setShowConfirmClose(true)
    } else {
      onClose()
      navigateToModal("splashScreen")
    }
  }

  const handleConfirmClose = () => {
    setShowConfirmClose(false)
    onClose()
    navigateToModal("splashScreen")
  }

  const handleCancelClose = () => {
    setShowConfirmClose(false)
  }

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isUserMenuOpen])

  // Close confirmation modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showConfirmClose) {
        setShowConfirmClose(false)
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [showConfirmClose])

  return (
    <>
      <header className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200 shrink-0">
        {/* Left Section: Logo, Title Badge, Project Name */}
        <div className="flex items-center gap-3">
          <img
            src="/images/gogreenlight-logo.png"
            alt="GoGreenlight"
            className="h-7 w-auto"
          />
          <div className="w-px h-5 bg-gray-200" />
          <div
            className={`inline-flex items-center ${titleColor} text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded`}
          >
            {title}
          </div>
          {showProjectName && currentProject && (
            <span className="hidden sm:inline text-sm text-gray-500 font-medium">
              {currentProject.name}
            </span>
          )}
          {children}
        </div>

        {/* Right Section: Home, Notifications, User Avatar, Close */}
        <div className="flex items-center gap-1">
          {/* Home Button */}
          <button
            onClick={handleHome}
            className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Home"
            aria-label="Go to Home"
          >
            <Home className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button
            onClick={handleNotifications}
            className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Notifications"
            aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ""}`}
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <div className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[8px] font-bold min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center shadow-sm">
                {unreadNotifications}
              </div>
            )}
          </button>

          {/* User Avatar */}
          {state.currentUser && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:ring-2 hover:ring-emerald-200 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${state.currentUser.bgColor}, ${state.currentUser.bgColor}dd)`,
                  color: state.currentUser.color,
                }}
                title={state.currentUser.name}
                aria-label={`User menu for ${state.currentUser.name}`}
              >
                {state.currentUser.initials}
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-[100]">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{state.currentUser.name}</p>
                    <p className="text-xs text-gray-500">{state.currentUser.role}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        openModal("userPermissions")
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        openModal("helpWizard")
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                      Help & Support
                    </button>
                  </div>
                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Close Button */}
          <button
            onClick={handleCloseClick}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Close Confirmation Modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCancelClose}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 pb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Return to Main Menu?</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Your progress is automatically saved
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-5">
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <Save className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-emerald-800">
                  All changes to{" "}
                  <span className="font-semibold">
                    {currentProject?.name || "this project"}
                  </span>{" "}
                  are saved automatically. You can return anytime to continue where you left off.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handleCancelClose}
                className="px-5"
              >
                Stay Here
              </Button>
              <Button
                onClick={handleConfirmClose}
                className="px-5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Go to Main Menu
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
