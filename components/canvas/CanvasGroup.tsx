"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

interface CanvasGroupProps {
  group: {
    id: string
    name: string
    color: string
    actorIds: string[]
    x: number
    y: number
    width: number
    height: number
  }
  onNameChange: (id: string, newName: string) => void
  onDelete: (id: string) => void
  onDragGroup: (id: string, deltaX: number, deltaY: number) => void
  onContextMenu?: (e: React.MouseEvent, groupId: string) => void
}

export default function CanvasGroup({ group, onNameChange, onDelete, onDragGroup, onContextMenu }: CanvasGroupProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(group.name)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleNameClick = () => {
    setIsEditing(true)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value)
  }

  const handleNameBlur = () => {
    setIsEditing(false)
    onNameChange(group.id, editValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false)
      onNameChange(group.id, editValue)
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(group.name)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking on input or delete button
    if ((e.target as HTMLElement).closest("input") || (e.target as HTMLElement).closest("button")) {
      return
    }

    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    e.stopPropagation()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      onDragGroup(group.id, deltaX, deltaY)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle document-level mouse events for dragging
  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        onDragGroup(group.id, deltaX, deltaY)
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }

    const handleDocumentMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleDocumentMouseMove)
      document.addEventListener("mouseup", handleDocumentMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleDocumentMouseMove)
      document.removeEventListener("mouseup", handleDocumentMouseUp)
    }
  }, [isDragging, dragStart, group.id, onDragGroup])

  const groupColor = group.color || "border-gray-400 bg-gray-50"

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onContextMenu) {
      onContextMenu(e, group.id)
    }
  }

  return (
    <div
      className={`absolute rounded-lg border-4 border-dotted border-${group.color}-500 pointer-events-none`}
      style={{
        left: group.x - 10,
        top: group.y - 30,
        width: group.width + 20,
        height: group.height + 40,
        opacity: isDragging ? 0.7 : 1,
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Group Header */}
      <div
        className={`absolute -top-6 left-2 px-2 py-1 rounded-t-lg bg-${group.color}-500 pointer-events-auto flex items-center gap-2 cursor-grab ${isDragging ? "cursor-grabbing" : ""}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        title="Right-click to transfer all actors to a list"
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleKeyDown}
            className="bg-white text-sm px-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <span className="text-sm font-medium text-white" onClick={handleNameClick}>
              {group.name || "Group"} ({group.actorIds.length})
            </span>
            <button
              onClick={() => onDelete(group.id)}
              className="text-white hover:text-red-200 transition-colors"
              title="Delete Group"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
