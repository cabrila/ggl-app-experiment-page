"use client"

import { useState, useRef, useEffect, type ReactNode } from "react"
import { Search, Filter, SlidersHorizontal, ChevronDown, X } from "lucide-react"

export type SortOption = { value: string; label: string }
export type ToolbarAccent = "emerald" | "rose" | "amber" | "teal" | "sky"

// Per-section accent classes. Tailwind needs static class strings, so each
// accent is spelled out explicitly rather than interpolated.
const ACCENTS: Record<
  ToolbarAccent,
  {
    searchFocus: string
    filterActive: string
    badge: string
    optionActive: string
  }
> = {
  emerald: {
    searchFocus: "focus:border-emerald-500/50",
    filterActive: "bg-emerald-500/20 border-emerald-500/40 text-emerald-200",
    badge: "bg-emerald-500",
    optionActive: "bg-emerald-500/20 text-emerald-300",
  },
  rose: {
    searchFocus: "focus:border-rose-500/50",
    filterActive: "bg-rose-500/20 border-rose-500/40 text-rose-200",
    badge: "bg-rose-500",
    optionActive: "bg-rose-500/20 text-rose-300",
  },
  amber: {
    searchFocus: "focus:border-amber-500/50",
    filterActive: "bg-amber-500/20 border-amber-500/40 text-amber-200",
    badge: "bg-amber-500",
    optionActive: "bg-amber-500/20 text-amber-300",
  },
  teal: {
    searchFocus: "focus:border-teal-500/50",
    filterActive: "bg-teal-500/20 border-teal-500/40 text-teal-200",
    badge: "bg-teal-500",
    optionActive: "bg-teal-500/20 text-teal-300",
  },
  sky: {
    searchFocus: "focus:border-sky-500/50",
    filterActive: "bg-sky-500/20 border-sky-500/40 text-sky-300",
    badge: "bg-sky-500",
    optionActive: "bg-sky-500/20 text-sky-300",
  },
}

interface ListToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  sortOptions: SortOption[]
  sortValue: string
  onSortChange: (value: string) => void
  /** Number of currently-active advanced filters (drives the badge + active styling). */
  filterCount?: number
  onClearFilters?: () => void
  /** Filter fields rendered inside the advanced-filters grid. Omit to hide the Filters button. */
  children?: ReactNode
  /** Extra content rendered full-width below the filter grid (e.g. a checkbox). */
  panelFooter?: ReactNode
  accent?: ToolbarAccent
  className?: string
}

/**
 * Shared search + filter + sort toolbar used across the My Actors, My Props,
 * My Characters, My Locations and My Scenes entry lists so they share one
 * consistent look. Accent color is configurable per section.
 */
export default function ListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  sortOptions,
  sortValue,
  onSortChange,
  filterCount = 0,
  onClearFilters,
  children,
  panelFooter,
  accent = "emerald",
  className = "",
}: ListToolbarProps) {
  const [showSort, setShowSort] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  // Close the sort dropdown when clicking outside of it.
  useEffect(() => {
    if (!showSort) return
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSort(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showSort])

  const a = ACCENTS[accent]
  const hasFilters = Boolean(children)
  const activeSortLabel = sortOptions.find((o) => o.value === sortValue)?.label ?? "Sort"

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            autoComplete="off"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className={`w-full pl-10 pr-9 py-2.5 bg-[#13261c] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none ${a.searchFocus} font-sans text-sm`}
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        {hasFilters && (
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-sans transition-colors ${
              showFilters || filterCount > 0
                ? a.filterActive
                : "bg-[#13261c] border-white/10 text-white hover:border-white/20"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {filterCount > 0 && (
              <span
                className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold rounded-full ${a.badge}`}
              >
                {filterCount}
              </span>
            )}
          </button>
        )}

        {/* Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setShowSort((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#13261c] border border-white/10 rounded-xl text-white text-sm hover:border-white/20 transition-colors font-sans min-w-[180px]"
          >
            <SlidersHorizontal className="w-4 h-4 text-white/60" />
            <span className="truncate">{activeSortLabel}</span>
            <ChevronDown className="w-4 h-4 text-white/40 ml-auto flex-shrink-0" />
          </button>

          {showSort && (
            <div className="absolute top-full mt-1 right-0 w-full min-w-[200px] bg-[#13261c] border border-white/10 rounded-xl overflow-hidden shadow-xl z-20">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value)
                    setShowSort(false)
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-sans transition-colors ${
                    sortValue === option.value
                      ? a.optionActive
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {hasFilters && showFilters && (
        <div className="mt-3 rounded-xl border border-white/10 bg-[#13261c] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white font-sans">Advanced Filters</h3>
            {filterCount > 0 && onClearFilters && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-1 text-xs text-white/50 hover:text-white font-sans transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">{children}</div>
          {panelFooter}
        </div>
      )}
    </div>
  )
}
