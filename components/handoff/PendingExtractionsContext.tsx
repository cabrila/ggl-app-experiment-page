"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { PendingExtraction, SectionId } from "@/types/pending-extraction"
import type { ProjectScript } from "@/types/script"

const STORAGE_KEY = "gogreenlight-pending-extractions"

const ALL_SECTIONS: SectionId[] = ["scene-list", "prop-list", "location-overview", "character-bible"]

type PendingMap = Record<SectionId, PendingExtraction[]>

const EMPTY_MAP: PendingMap = {
  "scene-list": [],
  "prop-list": [],
  "location-overview": [],
  "character-bible": [],
}

interface PendingExtractionsContextType {
  /** Queue a "Ready to Extract" entry on every section except the source. */
  addForOtherSections: (source: SectionId, name: string, script: ProjectScript) => void
  /** Pending entries queued for a given section. */
  getForSection: (section: SectionId) => PendingExtraction[]
  /** Remove a pending entry (after it's started, or when dismissed). */
  remove: (section: SectionId, id: string) => void
}

const PendingExtractionsContext = createContext<PendingExtractionsContextType | undefined>(undefined)

function loadInitial(): PendingMap {
  try {
    if (typeof window === "undefined") return EMPTY_MAP
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_MAP
    const parsed = JSON.parse(raw) as Partial<PendingMap>
    return { ...EMPTY_MAP, ...parsed }
  } catch (error) {
    console.warn("[v0] Failed to load pending extractions:", error)
    return EMPTY_MAP
  }
}

export function PendingExtractionsProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingMap>(loadInitial)

  // Persist like demo data so entries survive reloads / sign-out.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pending))
    } catch (error) {
      console.warn("[v0] Failed to save pending extractions:", error)
    }
  }, [pending])

  const addForOtherSections = useCallback(
    (source: SectionId, name: string, script: ProjectScript) => {
      setPending((prev) => {
        const next: PendingMap = { ...prev }
        for (const section of ALL_SECTIONS) {
          if (section === source) continue
          const existing = next[section] ?? []
          // Dedupe: don't queue the same source+name twice on a section.
          const isDuplicate = existing.some(
            (e) => e.sourceSection === source && e.name === name,
          )
          if (isDuplicate) continue
          const entry: PendingExtraction = {
            id: `${source}-${name}-${section}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            script,
            sourceSection: source,
            createdAt: Date.now(),
          }
          next[section] = [...existing, entry]
        }
        return next
      })
    },
    [],
  )

  const getForSection = useCallback(
    (section: SectionId) => pending[section] ?? [],
    [pending],
  )

  const remove = useCallback((section: SectionId, id: string) => {
    setPending((prev) => ({
      ...prev,
      [section]: (prev[section] ?? []).filter((e) => e.id !== id),
    }))
  }, [])

  return (
    <PendingExtractionsContext.Provider value={{ addForOtherSections, getForSection, remove }}>
      {children}
    </PendingExtractionsContext.Provider>
  )
}

export function usePendingExtractions() {
  const ctx = useContext(PendingExtractionsContext)
  if (!ctx) {
    throw new Error("usePendingExtractions must be used within a PendingExtractionsProvider")
  }
  return ctx
}
