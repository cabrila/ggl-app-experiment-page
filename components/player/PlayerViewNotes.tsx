"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { MessageSquare, Plus, Edit2, Trash2, Save, X } from "lucide-react"
import type { Actor, Note } from "@/types/casting"

interface PlayerViewNotesProps {
  actor: Actor
  characterId: string
}

const formatTimestamp = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export default function PlayerViewNotes({ actor, characterId }: PlayerViewNotesProps) {
  const { state, dispatch } = useCasting()
  const [newNoteText, setNewNoteText] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea with max height constraint and prevent parent growth
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    // Store the current parent height to prevent growth
    const parentElement = textarea.closest(".flex-1")
    const originalParentHeight = parentElement?.getBoundingClientRect().height

    textarea.style.height = "auto"
    const maxHeight = 180 // Increased from 120 to 180 pixels (50% increase)
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = newHeight + "px"

    // Ensure parent container doesn't grow beyond its original constraints
    if (parentElement && originalParentHeight) {
      const currentParentHeight = parentElement.getBoundingClientRect().height
      if (currentParentHeight > originalParentHeight + 75) {
        // Increased buffer from 50 to 75
        textarea.style.height = Math.min(newHeight, maxHeight - 30) + "px" // Adjusted from 20 to 30
      }
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      autoResizeTextarea(textareaRef.current)
    }
  }, [newNoteText])

  useEffect(() => {
    if (editTextareaRef.current) {
      autoResizeTextarea(editTextareaRef.current)
    }
  }, [editingText])

  const handleAddNote = () => {
    if (!newNoteText.trim() || !state.currentUser) return

    const note: Note = {
      id: `note-${Date.now()}-${Math.random()}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      timestamp: Date.now(),
      text: newNoteText.trim(),
    }

    dispatch({
      type: "ADD_NOTE",
      payload: {
        actorId: actor.id,
        characterId,
        note,
      },
    })

    setNewNoteText("")
    setIsAddingNote(false)
  }

  const handleEditNote = (noteId: string, currentText: string) => {
    setEditingNoteId(noteId)
    setEditingText(currentText)
  }

  const handleSaveEdit = () => {
    if (!editingText.trim() || !editingNoteId) return

    dispatch({
      type: "UPDATE_NOTE",
      payload: {
        actorId: actor.id,
        characterId,
        noteId: editingNoteId,
        text: editingText.trim(),
      },
    })

    setEditingNoteId(null)
    setEditingText("")
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setEditingText("")
  }

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      dispatch({
        type: "DELETE_NOTE",
        payload: {
          actorId: actor.id,
          characterId,
          noteId,
        },
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      action()
    }
  }

  const sortedNotes = actor.notes ? [...actor.notes].sort((a, b) => b.timestamp - a.timestamp) : []

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-h-full">
      {/* Compact Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notes {sortedNotes.length > 0 && <span className="text-gray-500">({sortedNotes.length})</span>}
            </h3>
          </div>
          {!isAddingNote && (
            <button
              onClick={() => setIsAddingNote(true)}
              className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
              title="Add Note"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Notes Content */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: "calc(100% - 60px)" }}>
        <div className="p-3 space-y-3">
          {/* Add Note Form - Compact */}
          {isAddingNote && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      backgroundColor: state.currentUser?.bgColor || "#6B7280",
                      color: state.currentUser?.color || "#FFFFFF",
                    }}
                  >
                    {state.currentUser?.initials || "?"}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <textarea
                    ref={textareaRef}
                    value={newNoteText}
                    onChange={(e) => {
                      setNewNoteText(e.target.value)
                      // Debounce the auto-resize to prevent excessive calls
                      clearTimeout(window.textareaResizeTimeout)
                      window.textareaResizeTimeout = setTimeout(() => {
                        autoResizeTextarea(e.target)
                      }, 100)
                    }}
                    onKeyDown={(e) => handleKeyDown(e, handleAddNote)}
                    placeholder="Add a note..."
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 min-h-[48px] max-h-[180px]"
                    rows={2}
                    autoFocus
                    style={{ height: "48px" }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">Cmd/Ctrl + Enter to save</span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setIsAddingNote(false)
                          setNewNoteText("")
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleAddNote}
                        disabled={!newNoteText.trim()}
                        className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Existing Notes - Compact */}
          {sortedNotes.length === 0 && !isAddingNote ? (
            <div className="text-center py-6">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">No notes yet</p>
              <button
                onClick={() => setIsAddingNote(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="w-3 h-3" />
                <span>Add Note</span>
              </button>
            </div>
          ) : (
            sortedNotes.map((note) => {
              const noteUser = state.users.find((u) => u.id === note.userId)
              const isEditing = editingNoteId === note.id

              return (
                <div
                  key={note.id}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 group hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{
                          backgroundColor: noteUser?.bgColor || "#6B7280",
                          color: noteUser?.color || "#FFFFFF",
                        }}
                      >
                        {noteUser?.initials || note.userName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                            {noteUser?.name || note.userName}
                          </span>
                          <span className="text-xs text-gray-500">{formatTimestamp(note.timestamp)}</span>
                        </div>
                        {state.currentUser?.id === note.userId && !isEditing && (
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditNote(note.id, note.text)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit note"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div>
                          <textarea
                            ref={editTextareaRef}
                            value={editingText}
                            onChange={(e) => {
                              setEditingText(e.target.value)
                              // Debounced auto-resize
                              clearTimeout(window.editTextareaResizeTimeout)
                              window.editTextareaResizeTimeout = setTimeout(() => {
                                autoResizeTextarea(e.target)
                              }, 100)
                            }}
                            onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 min-h-[48px] max-h-[180px]"
                            rows={2}
                            autoFocus
                            style={{ height: "48px" }}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">Cmd/Ctrl + Enter to save</span>
                            <div className="flex space-x-1">
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                disabled={!editingText.trim()}
                                className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                          {note.text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
