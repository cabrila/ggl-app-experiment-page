"use client"

import type React from "react"
import { useState } from "react"
import { Save, Search, Trash2, Clock, Globe, User, X } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import type { SavedSearch } from "@/types/casting"

interface SavedSearchesManagerProps {
  onClose?: () => void
  className?: string
}

export default function SavedSearchesManager({ onClose, className }: SavedSearchesManagerProps) {
  const { state, dispatch } = useCasting()
  const { savedSearches, searchTags, searchTerm } = state.currentFocus

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newSearchName, setNewSearchName] = useState("")
  const [isGlobal, setIsGlobal] = useState(false)

  // Check if current search has content to save
  const hasSearchContent = searchTags.length > 0 || searchTerm.trim().length > 0

  // Sort saved searches by last used (most recent first)
  const sortedSavedSearches = [...savedSearches].sort((a, b) => b.lastUsed - a.lastUsed)

  const handleSaveCurrentSearch = () => {
    if (!hasSearchContent || !newSearchName.trim()) return

    console.log("[v0] Saving search:", {
      name: newSearchName.trim(),
      isGlobal,
      searchTags: searchTags.length,
      searchTerm: searchTerm.length,
    })

    dispatch({
      type: "SAVE_CURRENT_SEARCH",
      payload: {
        name: newSearchName.trim(),
        isGlobal,
      },
    })

    console.log("[v0] Search save dispatched successfully")

    setNewSearchName("")
    setIsGlobal(false)
    setShowSaveDialog(false)
  }

  const handleLoadSearch = (searchId: string) => {
    dispatch({
      type: "LOAD_SAVED_SEARCH",
      payload: searchId,
    })
    onClose?.()
  }

  const handleDeleteSearch = (searchId: string) => {
    dispatch({
      type: "DELETE_SAVED_SEARCH",
      payload: searchId,
    })
  }

  const handleUpdateSearchName = (searchId: string, newName: string) => {
    dispatch({
      type: "UPDATE_SAVED_SEARCH",
      payload: {
        id: searchId,
        updates: { name: newName },
      },
    })
  }

  const formatDate = (timestamp: number) => {
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

  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Saved Searches</h3>
          {savedSearches.length > 0 && (
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">{savedSearches.length}</span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Save Current Search Section */}
      {hasSearchContent && (
        <div className="p-4 bg-emerald-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-emerald-800">Current Search</div>
            <button
              onClick={() => setShowSaveDialog(!showSaveDialog)}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white text-xs rounded-md hover:bg-emerald-700 transition-colors"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
          </div>

          <div className="text-xs text-emerald-700 space-y-1">
            {searchTerm && (
              <div>
                <span className="font-medium">Text:</span> "{searchTerm}"
              </div>
            )}
            {searchTags.length > 0 && (
              <div>
                <span className="font-medium">Tags:</span> {searchTags.map((tag) => tag.text).join(", ")}
              </div>
            )}
          </div>

          {/* Save Dialog */}
          {showSaveDialog && (
            <div className="mt-3 p-3 bg-white border border-emerald-200 rounded-md">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Search Name</label>
                  <input
                    type="text"
                    value={newSearchName}
                    onChange={(e) => setNewSearchName(e.target.value)}
                    placeholder="Enter a name for this search..."
                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isGlobal"
                    checked={isGlobal}
                    onChange={(e) => setIsGlobal(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isGlobal" className="text-xs text-slate-600">
                    Make available across all tabs and characters
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCurrentSearch}
                    disabled={!newSearchName.trim()}
                    className="flex-1 px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Save Search
                  </button>
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="px-3 py-1 bg-slate-200 text-slate-600 text-xs rounded hover:bg-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Searches List */}
      <div className="max-h-80 overflow-y-auto">
        {sortedSavedSearches.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <div className="text-sm font-medium mb-1">No saved searches</div>
            <div className="text-xs">Create search tags or enter search terms, then save them for quick access</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedSavedSearches.map((search) => (
              <SavedSearchItem
                key={search.id}
                search={search}
                onLoad={() => handleLoadSearch(search.id)}
                onDelete={() => handleDeleteSearch(search.id)}
                onUpdateName={(newName) => handleUpdateSearchName(search.id, newName)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {savedSearches.length > 0 && (
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500 text-center">
            Click a search to load it • Double-click name to edit
          </div>
        </div>
      )}
    </div>
  )
}

interface SavedSearchItemProps {
  search: SavedSearch
  onLoad: () => void
  onDelete: () => void
  onUpdateName: (newName: string) => void
  formatDate: (timestamp: number) => string
}

function SavedSearchItem({ search, onLoad, onDelete, onUpdateName, formatDate }: SavedSearchItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(search.name)

  const handleSaveName = () => {
    if (editName.trim() && editName.trim() !== search.name) {
      onUpdateName(editName.trim())
    }
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName()
    } else if (e.key === "Escape") {
      setEditName(search.name)
      setIsEditing(false)
    }
  }

  return (
    <div className="p-3 hover:bg-slate-50 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onLoad}>
          <div className="flex items-center gap-2 mb-1">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleKeyPress}
                className="flex-1 px-2 py-1 text-sm font-medium border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className="flex-1 text-sm font-medium text-slate-800 truncate"
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
              >
                {search.name}
              </div>
            )}

            <div className="flex items-center gap-1 flex-shrink-0">
              {search.isGlobal ? (
                <Globe className="w-3 h-3 text-blue-500" title="Global search" />
              ) : (
                <User className="w-3 h-3 text-slate-400" title="Local search" />
              )}
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500">{formatDate(search.lastUsed)}</span>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            {search.searchTerm && (
              <div>
                <span className="font-medium">Text:</span> "{search.searchTerm}"
              </div>
            )}
            {search.tags.length > 0 && (
              <div>
                <span className="font-medium">Tags:</span>{" "}
                <span className="inline-flex flex-wrap gap-1">
                  {search.tags.map((tag, index) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-700"
                    >
                      {tag.text}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLoad()
            }}
            className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
            title="Load this search"
          >
            <Search className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
            title="Delete this search"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
