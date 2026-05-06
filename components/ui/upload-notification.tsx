"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Upload, AlertCircle } from "lucide-react"

interface UploadNotificationProps {
  type: "success" | "error" | "uploading" | "warning"
  message: string
  details?: string
  progress?: number
  onDismiss?: () => void
  autoHide?: boolean
  duration?: number
}

export default function UploadNotification({
  type,
  message,
  details,
  progress = 0,
  onDismiss,
  autoHide = true,
  duration = 5000,
}: UploadNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoHide && type !== "uploading" && type !== "error") {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onDismiss?.(), 300) // Allow fade out animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoHide, type, duration, onDismiss])

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />
      case "uploading":
        return <Upload className="w-5 h-5 text-blue-600 animate-pulse" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200"
      case "error":
        return "bg-red-50 border-red-200"
      case "uploading":
        return "bg-blue-50 border-blue-200"
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-800"
      case "error":
        return "text-red-800"
      case "uploading":
        return "text-blue-800"
      case "warning":
        return "text-yellow-800"
      default:
        return "text-gray-800"
    }
  }

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        ${getBackgroundColor()}
        border rounded-lg shadow-lg p-4
        transform transition-all duration-300 ease-in-out
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${getTextColor()}`}>{message}</p>

          {details && <p className={`text-xs mt-1 ${getTextColor()} opacity-75`}>{details}</p>}

          {type === "uploading" && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-blue-600 mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {onDismiss && type !== "uploading" && (
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => onDismiss(), 300)
            }}
            className={`flex-shrink-0 ${getTextColor()} opacity-50 hover:opacity-75 transition-opacity`}
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
