"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { PendingExtraction, SectionId } from "@/types/pending-extraction"
import type { ProjectScript } from "@/types/script"
import { DEMO_SCRIPT } from "@/lib/scriptFile"

const STORAGE_KEY = "gogreenlight-pending-extractions"

const ALL_SECTIONS: SectionId[] = ["scene-list", "prop-list", "location-overview", "character-bible"]

type PendingMap = Record<SectionId, PendingExtraction[]>

const EMPTY_MAP: PendingMap = {
  "scene-list": [],
  "prop-list": [],
  "location-overview": [],
  "character-bible": [],
}

// Demo seed: "The Velvet Court" was uploaded under My Characters, so the other
// three pages get a "Ready to Extract" handoff entry to showcase the feature.
// Stable ids keep this deterministic across reloads. Used only when nothing is
// persisted yet (like demo data) — once a user starts or dismisses an entry,
// their stored state wins.
const DEMO_SOURCE: SectionId = "character-bible"
const DEMO_NAME = "The Velvet Court"

function buildDemoEntry(section: SectionId): PendingExtraction {
  return {
    id: `demo-pending-${section}-velvet-court`,
    name: DEMO_NAME,
    script: DEMO_SCRIPT,
    sourceSection: DEMO_SOURCE,
    createdAt: new Date("2026-05-06").getTime(),
  }
}

const DEMO_MAP: PendingMap = {
  "scene-list": [buildDemoEntry("scene-list")],
  "prop-list": [buildDemoEntry("prop-list")],
  "location-overview": [buildDemoEntry("location-overview")],
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
    // No stored state yet: seed the demo handoff so the feature is visible.
    if (!raw) return DEMO_MAP
    const parsed = JSON.parse(raw) as Partial<PendingMap>
    return { ...EMPTY_MAP, ...parsed }
  } catch (error) {
    console.warn("[v0] Failed to load pending extractions:", error)
    return DEMO_MAP
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
