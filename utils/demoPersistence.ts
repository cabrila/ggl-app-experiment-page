// Lightweight localStorage persistence for the "demo mode" used when no
// authenticated backend (Firebase) is configured. Without this, every feature
// context kept its data only in React state, so navigating away (which unmounts
// the feature's Provider) discarded anything the user just created. These
// helpers let each context rehydrate its data on mount and persist it on change.

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/

// Recursively revive ISO date strings back into Date objects. JSON.stringify
// turns the Date fields (createdAt, updatedAt, submittedAt, ...) into strings,
// and much of the UI relies on them being real Dates.
function reviveDates<T>(value: T): T {
  if (typeof value === "string") {
    return (ISO_DATE_RE.test(value) ? new Date(value) : value) as unknown as T
  }
  if (Array.isArray(value)) {
    return value.map((v) => reviveDates(v)) as unknown as T
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = reviveDates(v)
    }
    return out as unknown as T
  }
  return value
}

export function loadDemoData<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (parsed === null || parsed === undefined) return fallback
    return reviveDates(parsed) as T
  } catch (error) {
    console.warn(`[v0] Failed to load demo data for "${key}":`, error)
    return fallback
  }
}

export function saveDemoData<T>(key: string, data: T): void {
  try {
    if (typeof window === "undefined") return
    window.localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.warn(`[v0] Failed to save demo data for "${key}":`, error)
  }
}

// Storage keys, one per feature context.
export const DEMO_STORAGE_KEYS = {
  actorListProjects: "gogreenlight-demo-actor-list-projects",
  actorListStandalone: "gogreenlight-demo-actor-list-standalone",
  publicCasting: "gogreenlight-demo-public-casting-projects",
  locationProjects: "gogreenlight-demo-location-projects",
  propProjects: "gogreenlight-demo-prop-projects",
  sceneProjects: "gogreenlight-demo-scene-projects",
} as const
