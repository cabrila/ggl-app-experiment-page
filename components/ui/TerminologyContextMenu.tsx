"use client"

import { useState, useRef, useEffect } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { X, Check } from "lucide-react"

interface TerminologyContextMenuProps {
  show: boolean
  x: number
  y: number
  type: "actor" | "character"
  form: "singular" | "plural"
  currentValue: string
  onClose: () => void
}

export default function TerminologyContextMenu({
  show,
  x,
  y,
  type,
  form,
  currentValue,
  onClose,
}: TerminologyContextMenuProps) {
  const { state, dispatch } = useCasting()
  const [isEditing, setIsEditing] = useState(false)
  const [newValue, setNewValue] = useState(currentValue)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (show) {
      // Small delay to prevent immediate closing from the same click that opened the menu
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside)
      }, 100)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [show, onClose])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isEditing) {
          setIsEditing(false)
          setNewValue(currentValue)
        } else {
          onClose()
        }
      } else if (event.key === "Enter" && isEditing) {
        handleSave()
      }
    }

    if (show) {
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [show, isEditing, currentValue])

  // Calculate position to keep menu within viewport
  const getMenuPosition = () => {
    const menuWidth = 200
    const menuHeight = 120
    const padding = 10

    let adjustedX = x
    let adjustedY = y

    // Adjust horizontal position
    if (x + menuWidth > window.innerWidth - padding) {
      adjustedX = window.innerWidth - menuWidth - padding
    }
    if (adjustedX < padding) {
      adjustedX = padding
    }

    // Adjust vertical position
    if (y + menuHeight > window.innerHeight - padding) {
      adjustedY = y - menuHeight
    }
    if (adjustedY < padding) {
      adjustedY = padding
    }

    return { x: adjustedX, y: adjustedY }
  }

  const handleRename = () => {
    setIsEditing(true)
    setNewValue(currentValue)
  }

  const handleSave = () => {
    const trimmedValue = newValue.trim()
    if (trimmedValue && trimmedValue !== currentValue) {
      // Use project-specific terminology update
      dispatch({
        type: "UPDATE_PROJECT_TERMINOLOGY",
        payload: {
          type,
          form,
          value: trimmedValue,
        },
      })
    }
    setIsEditing(false)
    onClose()
  }

  const handleCancel = () => {
    setIsEditing(false)
    setNewValue(currentValue)
  }

  const handleResetToDefault = () => {
    const defaultValues = {
      actor: { singular: "Actor", plural: "Actors" },
      character: { singular: "Character", plural: "Characters" },
    }

    const defaultValue = defaultValues[type][form]

    dispatch({
      type: "UPDATE_PROJECT_TERMINOLOGY",
      payload: {
        type,
        form,
        value: defaultValue,
      },
    })

    onClose()
  }

  if (!show) return null

  const position = getMenuPosition()

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[1000] min-w-[200px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3">
        <div className="text-xs text-gray-500 mb-2">
          Rename {type} ({form})
        </div>

        {!isEditing ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900 mb-3">Current: "{currentValue}"</div>

            <button
              onClick={handleRename}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Rename
            </button>

            <button
              onClick={handleResetToDefault}
              className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
            >
              Reset to Default
            </button>

            <div className="border-t pt-2">
              <button
                onClick={onClose}
                className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={`Enter new ${form} form`}
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="flex items-center px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!newValue.trim() || newValue.trim() === currentValue}
                className="flex items-center px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-3 h-3 mr-1" />
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
