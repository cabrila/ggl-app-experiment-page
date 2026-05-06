"use client"

import { Search, X } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Search...",
  className = ""
}: SearchBarProps) {
  return (
    <div className={`relative max-w-md ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 font-sans text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
        aria-label={placeholder}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-white/40 hover:text-white/70 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
