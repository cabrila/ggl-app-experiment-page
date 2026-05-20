"use client"

import { Home } from "lucide-react"

interface UsageHeaderProps {
  onHome: () => void
}

export default function UsageHeader({ onHome }: UsageHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-6 py-3 border-b border-white/10">
      <img
        src="/images/gogreenlight-logo.png"
        alt="GoGreenlight"
        className="h-9 w-auto"
      />
      <div className="h-6 w-px bg-white/20" />
      <button
        onClick={onHome}
        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
        title="Go to Home"
        aria-label="Go to Home"
      >
        <Home className="w-5 h-5" />
      </button>
    </header>
  )
}
