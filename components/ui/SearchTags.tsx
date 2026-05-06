"use client"

import type React from "react"
import { useState, useRef } from "react"
import { X, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchTag {
  id: string
  text: string
  color?: string
}

interface SavedSearch {
  id: string
  name: string
  tags: SearchTag[]
  searchTerm: string
  createdAt: number
  lastUsed: number
  isGlobal: boolean
}

interface SearchTagsProps {
  tags: SearchTag[]
  onTagsChange: (tags: SearchTag[]) => void
  placeholder?: string
  className?: string
  maxTags?: number
  allowDuplicates?: boolean
  savedSearches?: SavedSearch[]
  onLoadSavedSearch?: (searchId: string) => void
}

export default function SearchTags({
  tags,
  onTagsChange,
  placeholder = "Search and press Enter to create tags...",
  className,
  maxTags = 10,
  allowDuplicates = false,
  savedSearches = [],
  onLoadSavedSearch,
}: SearchTagsProps) {
  const [inputValue, setInputValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [showSavedSearches, setShowSavedSearches] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Generate a random color for new tags
  const generateTagColor = () => {
    const colors = [
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-green-100 text-green-800 border-green-200",
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-orange-100 text-orange-800 border-orange-200",
      "bg-pink-100 text-pink-800 border-pink-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200",
      "bg-teal-100 text-teal-800 border-teal-200",
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Handle input key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault()
      createTag(inputValue.trim())
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(tags[tags.length - 1].id)
    }
  }

  // Create a new tag
  const createTag = (text: string) => {
    if (!text) return

    // Check for duplicates if not allowed
    if (!allowDuplicates && tags.some((tag) => tag.text.toLowerCase() === text.toLowerCase())) {
      setInputValue("")
      return
    }

    // Check max tags limit
    if (tags.length >= maxTags) {
      setInputValue("")
      return
    }

    const newTag: SearchTag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      color: generateTagColor(),
    }

    onTagsChange([...tags, newTag])
    setInputValue("")
  }

  // Remove a tag
  const removeTag = (tagId: string) => {
    onTagsChange(tags.filter((tag) => tag.id !== tagId))
  }

  // Clear all tags
  const clearAllTags = () => {
    onTagsChange([])
  }

  // Focus input when container is clicked
  const handleContainerClick = () => {
    inputRef.current?.focus()
  }

  // Load a saved search
  const handleLoadSavedSearch = (search: SavedSearch) => {
    if (onLoadSavedSearch) {
      onLoadSavedSearch(search.id)
      setShowSavedSearches(false)
      setIsFocused(false)
    }
  }

  // Focus handler to show saved searches dropdown
  const handleFocus = () => {
    setIsFocused(true)
    if (savedSearches.length > 0 && tags.length === 0 && !inputValue) {
      setShowSavedSearches(true)
    }
  }

  // Blur handler to hide dropdown with delay
  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false)
      setShowSavedSearches(false)
    }, 200)
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
    <div className={cn("relative", className)}>
      <div
        onClick={handleContainerClick}
        className={cn(
          "flex flex-wrap items-center gap-2 min-h-[42px] p-2 border border-slate-300 rounded-lg bg-white transition-colors cursor-text",
          isFocused && "ring-2 ring-emerald-500 border-emerald-500",
        )}
      >
        {/* Search Icon */}
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />

        {/* Tags */}
        {tags.map((tag) => (
          <div
            key={tag.id}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border",
              tag.color || "bg-slate-100 text-slate-800 border-slate-200",
            )}
          >
            <span>{tag.text}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag.id)
              }}
              className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
              title={`Remove "${tag.text}" tag`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm placeholder-slate-400"
          disabled={tags.length >= maxTags}
        />

        {/* Clear All Button */}
        {tags.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              clearAllTags()
            }}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            title="Clear all tags"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Saved Searches Dropdown */}
      {showSavedSearches && savedSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
          <div className="p-2 border-b border-slate-200 bg-slate-50">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Search className="w-3 h-3" />
              Saved Searches ({savedSearches.length})
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {savedSearches.map((search) => (
              <button
                key={search.id}
                onClick={() => handleLoadSavedSearch(search)}
                className="w-full p-3 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm text-slate-800 truncate">{search.name}</div>
                  <div className="text-xs text-slate-500 flex-shrink-0 ml-2">{formatDate(search.lastUsed)}</div>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  {search.searchTerm && (
                    <div>
                      <span className="font-medium">Text:</span> "{search.searchTerm}"
                    </div>
                  )}
                  {search.tags.length > 0 && (
                    <div>
                      <span className="font-medium">Tags:</span> {search.tags.map((tag) => tag.text).join(", ")}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Helper Text */}
      {isFocused && !showSavedSearches && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white border border-slate-200 rounded-md shadow-sm text-xs text-slate-600 z-10">
          <div className="space-y-1">
            <div>
              • Type and press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">Enter</kbd> to create a tag
            </div>
            <div>
              • Press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">Backspace</kbd> on empty input to remove
              last tag
            </div>
            <div>
              • Click <X className="w-3 h-3 inline mx-1" /> to remove individual tags
            </div>
            {tags.length > 0 && (
              <div className="pt-1 border-t border-slate-100">
                <strong>Active tags:</strong> {tags.map((tag) => tag.text).join(", ")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Max Tags Warning */}
      {tags.length >= maxTags && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
          Maximum of {maxTags} tags reached. Remove a tag to add more.
        </div>
      )}
    </div>
  )
}

// Export the SearchTag type for use in other components
export type { SearchTag }
