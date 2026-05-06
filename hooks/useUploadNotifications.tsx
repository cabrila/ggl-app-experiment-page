"use client"

import { useState, useCallback, createContext, useContext, type ReactNode } from "react"
import UploadNotificationComponent from "@/components/ui/upload-notification"

interface UploadNotificationType {
  id: string
  type: "success" | "error" | "uploading" | "warning"
  message: string
  details?: string
  progress?: number
  timestamp: number
}

interface UploadNotificationContextType {
  notifications: UploadNotificationType[]
  addNotification: (
    type: UploadNotificationType["type"],
    message: string,
    details?: string,
    progress?: number,
  ) => string
  updateNotification: (id: string, updates: Partial<UploadNotificationType>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
  showSuccess: (message: string, details?: string) => string
  showError: (message: string, details?: string) => string
  showUploading: (message: string, progress?: number) => string
  showWarning: (message: string, details?: string) => string
}

const UploadNotificationContext = createContext<UploadNotificationContextType | undefined>(undefined)

export function UploadNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<UploadNotificationType[]>([])

  const addNotification = useCallback(
    (type: UploadNotificationType["type"], message: string, details?: string, progress?: number) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const notification: UploadNotificationType = {
        id,
        type,
        message,
        details,
        progress,
        timestamp: Date.now(),
      }

      setNotifications((prev) => [notification, ...prev.slice(0, 4)]) // Keep max 5 notifications
      return id
    },
    [],
  )

  const updateNotification = useCallback((id: string, updates: Partial<UploadNotificationType>) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, ...updates } : notification)),
    )
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const showSuccess = useCallback(
    (message: string, details?: string) => {
      return addNotification("success", message, details)
    },
    [addNotification],
  )

  const showError = useCallback(
    (message: string, details?: string) => {
      return addNotification("error", message, details)
    },
    [addNotification],
  )

  const showUploading = useCallback(
    (message: string, progress = 0) => {
      return addNotification("uploading", message, undefined, progress)
    },
    [addNotification],
  )

  const showWarning = useCallback(
    (message: string, details?: string) => {
      return addNotification("warning", message, details)
    },
    [addNotification],
  )

  const value = {
    notifications,
    addNotification,
    updateNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showUploading,
    showWarning,
  }

  return (
    <UploadNotificationContext.Provider value={value}>
      {children}
      {/* Render notifications */}
      {notifications.map((notification) => (
        <UploadNotificationComponent
          key={notification.id}
          type={notification.type}
          message={notification.message}
          details={notification.details}
          progress={notification.progress}
          onDismiss={() => removeNotification(notification.id)}
        />
      ))}
    </UploadNotificationContext.Provider>
  )
}

export function useUploadNotifications() {
  const context = useContext(UploadNotificationContext)
  if (context === undefined) {
    throw new Error("useUploadNotifications must be used within an UploadNotificationProvider")
  }
  return context
}
