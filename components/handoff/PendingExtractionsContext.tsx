"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { PendingExtraction, SectionId } from "@/types/pending-extraction"
import type { ProjectScript } from "@/types/script"
import { DEMO_SCRIPT } from "@/lib/scriptFile"

const STORAGE_KEY = "gogreenlight-pending-extractions"
// Tracks demo handoff entries the user has started or dismissed, so they aren't
// re-seeded on the next load (the demo entries otherwise always merge in).
const DISMISSED_DEMO_KEY = "gogreenlight-pending-demo-dismissed"

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
// Stable ids (prefixed with DEMO_ID_PREFIX) keep this deterministic and let us
// detect demo entries when the user dismisses or starts them.
const DEMO_ID_PREFIX = "demo-pending-velvet-court-"
const DEMO_SOURCE: SectionId = "character-bible"
const DEMO_NAME = "The Velvet Court"
// Which sections get a demo handoff (every section except the source).
const DEMO_TARGET_SECTIONS: SectionId[] = ["scene-list", "prop-list", "location-overview"]

function buildDemoEntry(section: SectionId): PendingExtraction {
  return {
    id: `${DEMO_ID_PREFIX}${section}`,
    name: DEMO_NAME,
    script: DEMO_SCRIPT,
    sourceSection: DEMO_SOURCE,
    createdAt: new Date("2026-05-06").getTime(),
  }
}

function loadDismissedDemoIds(): Set<string> {
  try {
    if (typeof window === "undefined") return new Set()
    const raw = window.localStorage.getItem(DISMISSED_DEMO_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function rememberDismissedDemoId(id: string) {
  try {
    if (typeof window === "undefined") return
    const ids = loadDismissedDemoIds()
    ids.add(id)
    window.localStorage.setItem(DISMISSED_DEMO_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore persistence errors
  }
}

// Merge the demo handoff entries into a map, skipping any the user already
// dismissed/started and any section that already has that exact demo id.
function withDemoSeed(map: PendingMap): PendingMap {
  const dismissed = loadDismissedDemoIds()
  const next: PendingMap = { ...map }
  for (const section of DEMO_TARGET_SECTIONS) {
    const entry = buildDemoEntry(section)
    if (dismissed.has(entry.id)) continue
    const existing = next[section] ?? []
    if (existing.some((e) => e.id === entry.id)) continue
    next[section] = [...existing, entry]
  }
  return next
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
    const stored = raw ? ({ ...EMPTY_MAP, ...(JSON.parse(raw) as Partial<PendingMap>) }) : EMPTY_MAP
    // Always merge the demo handoff so it shows for existing users too, unless
    // they've dismissed/started it.
    return withDemoSeed(stored)
  } catch (error) {
    console.warn("[v0] Failed to load pending extractions:", error)
    return withDemoSeed(EMPTY_MAP)
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
    // If a demo handoff is started/dismissed, remember it so it isn't re-seeded.
    if (id.startsWith(DEMO_ID_PREFIX)) {
      rememberDismissedDemoId(id)
    }
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
