"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

interface ActorGridContextType {
  selectedActorIds: Set<string>
  setSelectedActorIds: (ids: Set<string>) => void
  lastSelectedId: string | null
  setLastSelectedId: (id: string | null) => void
  clearSelection: () => void
}

const ActorGridContext = createContext<ActorGridContextType | undefined>(undefined)

export function ActorGridProvider({ children }: { children: React.ReactNode }) {
  const [selectedActorIds, setSelectedActorIds] = useState<Set<string>>(new Set())
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

  const clearSelection = useCallback(() => {
    setSelectedActorIds(new Set())
    setLastSelectedId(null)
  }, [])

  return (
    <ActorGridContext.Provider
      value={{
        selectedActorIds,
        setSelectedActorIds,
        lastSelectedId,
        setLastSelectedId,
        clearSelection,
      }}
    >
      {children}
    </ActorGridContext.Provider>
  )
}

export function useActorGrid() {
  const context = useContext(ActorGridContext)
  if (context === undefined) {
    throw new Error("useActorGrid must be used within an ActorGridProvider")
  }
  return context
}
