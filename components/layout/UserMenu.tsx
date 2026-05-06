"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { User, Settings, Bell, Moon, Sun, LogOut, ChevronDown, Palette, Shield, HelpCircle } from "lucide-react"
import { useTheme } from "next-themes"

interface UserMenuProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLDivElement>
  userStatus?: "available" | "busy" | "away"
  onStatusChange?: (status: "available" | "busy" | "away") => void
}

export default function UserMenu({
  isOpen,
  onClose,
  anchorRef,
  userStatus = "available",
  onStatusChange,
}: UserMenuProps) {
  const { state, dispatch } = useCasting()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const { theme, setTheme, resolvedTheme } = useTheme() // Use resolvedTheme for current actual theme
  const menuRef = useRef<HTMLDivElement>(null)

  const currentUser = state.currentUser

  // Update local status when prop changes
  const [localUserStatus, setLocalUserStatus] = useState(userStatus)

  useEffect(() => {
    setLocalUserStatus(userStatus)
  }, [userStatus])

  const handleStatusChange = (newStatus: "available" | "busy" | "away") => {
    setLocalUserStatus(newStatus)
    onStatusChange?.(newStatus)
  }

  // Ensure component re-renders when theme changes if not already
  useEffect(() => {
    // This effect can be useful if other parts of the menu need to react to theme changes
    // but for the toggle itself, resolvedTheme and setTheme are usually sufficient.
  }, [resolvedTheme])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose, anchorRef])

  if (!isOpen || !currentUser) return null

  const statusOptions = [
    { value: "available", label: "Available", color: "bg-green-500", description: "Ready to collaborate" },
    { value: "busy", label: "Busy", color: "bg-red-500", description: "In a meeting or focused work" },
    { value: "away", label: "Away", color: "bg-yellow-500", description: "Temporarily unavailable" },
  ] as const

  const otherUsers = state.users.filter((user) => user.id !== currentUser.id)

  const handleSwitchUser = (userId: string) => {
    const newUser = state.users.find((u) => u.id === userId)
    if (newUser) {
      dispatch({ type: "SET_CURRENT_USER", payload: newUser })
      onClose()
    }
  }

  const handleSignOut = () => {
    alert("Sign out functionality would be implemented here")
    onClose()
  }

  const getMenuPosition = () => {
    if (!anchorRef.current) return { top: 0, right: 0 }
    const rect = anchorRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    }
  }

  const position = getMenuPosition()

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
      }}
    >
      {/* User Header */}
      <div className="p-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
              style={{
                backgroundColor: currentUser.bgColor,
                color: currentUser.color,
              }}
            >
              {currentUser.initials}
            </div>
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                statusOptions.find((s) => s.value === localUserStatus)?.color
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100 truncate">{currentUser.name}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{currentUser.email}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">{currentUser.role}</p>
          </div>
        </div>
      </div>

      {/* Enhanced Status Section */}
      <div className="p-3 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Status</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-slate-400">
              {statusOptions.find((s) => s.value === localUserStatus)?.icon}
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400">
              {statusOptions.find((s) => s.value === localUserStatus)?.label}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => {
                handleStatusChange(status.value)
                // Dispatch status change to parent component
                window.dispatchEvent(
                  new CustomEvent("userStatusChange", {
                    detail: { status: status.value },
                  }),
                )
              }}
              className={`p-2 rounded-md text-xs font-medium transition-all duration-200 ${
                localUserStatus === status.value
                  ? "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100 ring-2 ring-emerald-500"
                  : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/[0.5]"
              }`}
              title={status.description}
            >
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${status.color}`} />
                <span>{status.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Status Description */}
        <div className="text-xs text-gray-500 dark:text-slate-400 text-center">
          {statusOptions.find((s) => s.value === localUserStatus)?.description}
        </div>
      </div>

      {/* User Profile Actions */}
      <div className="p-3 border-b border-gray-100 dark:border-slate-700">
        <button
          onClick={() => {
            // Dispatch initials change event to parent component
            window.dispatchEvent(new CustomEvent("changeInitials"))
            onClose()
          }}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700 rounded-md transition-colors"
        >
          <User className="w-4 h-4" />
          <span>Change Initials</span>
        </button>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        {/* Account Settings */}
        <button
          onClick={() => setActiveSection(activeSection === "settings" ? null : "settings")}
          className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <div className="flex items-center space-x-3">
            <Settings className="w-4 h-4" />
            <span>Account Settings</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${activeSection === "settings" ? "rotate-180" : ""}`} />
        </button>

        {activeSection === "settings" && (
          <div className="bg-gray-50 dark:bg-slate-700/[0.3] py-2">
            <button className="w-full flex items-center space-x-3 px-8 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100">
              <User className="w-4 h-4" />
              <span>Profile Settings</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-8 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100">
              <Bell className="w-4 h-4" />
              <span>Notification Preferences</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-8 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100">
              <Shield className="w-4 h-4" />
              <span>Privacy & Security</span>
            </button>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        >
          <div className="flex items-center space-x-3">
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-500" />
            )}
            <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </div>
          <div
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${resolvedTheme === "dark" ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-600"}`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
                resolvedTheme === "dark" ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </button>

        {/* Switch User */}
        {otherUsers.length > 0 && (
          <>
            <button
              onClick={() => setActiveSection(activeSection === "users" ? null : "users")}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <div className="flex items-center space-x-3">
                <Palette className="w-4 h-4" />
                <span>Switch User</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${activeSection === "users" ? "rotate-180" : ""}`}
              />
            </button>

            {activeSection === "users" && (
              <div className="bg-gray-50 dark:bg-slate-700/[0.3] py-2 max-h-40 overflow-y-auto">
                {otherUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSwitchUser(user.id)}
                    className="w-full flex items-center space-x-3 px-8 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-600"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{
                        backgroundColor: user.bgColor,
                        color: user.color,
                      }}
                    >
                      {user.initials}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-500">{user.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Help & Support */}
        <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700">
          <HelpCircle className="w-4 h-4" />
          <span>Help & Support</span>
        </button>
      </div>

      {/* Sign Out */}
      <div className="border-t border-gray-100 dark:border-slate-700 p-2">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/[0.1] dark:text-red-400 rounded-md"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
