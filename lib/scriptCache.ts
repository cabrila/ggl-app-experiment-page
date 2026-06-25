import type { ProjectScript } from "@/types/script"

// Uploaded scripts are deliberately NOT written to Firestore — a base64 PDF
// data URL routinely exceeds Firestore's 1MB per-document limit and would fail
// the whole write. Instead we cache the script blob client-side, keyed by the
// project/bible id, and re-attach it whenever the (script-less) records come
// back from the backend subscription. This keeps the "Script" preview button
// working for freshly uploaded scripts and across reloads, without bloating the
// backend documents.

const CACHE_KEY = "gogreenlight-script-cache"

type ScriptCache = Record<string, ProjectScript>

function read(): ScriptCache {
  try {
    if (typeof window === "undefined") return {}
    const raw = window.localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as ScriptCache) : {}
  } catch {
    return {}
  }
}

function write(cache: ScriptCache): void {
  try {
    if (typeof window === "undefined") return
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (err) {
    // Quota exceeded or storage unavailable. The in-memory copy still works for
    // the current session; it just won't survive a reload.
    console.warn("[v0] Failed to cache script:", err)
  }
}

/** Persist a record's original uploaded script locally, keyed by its id. */
export function cacheScript(id: string, script: ProjectScript | undefined | null): void {
  if (!id || !script) return
  const cache = read()
  cache[id] = script
  write(cache)
}

/** Look up a cached script for a given record id. */
export function getCachedScript(id: string): ProjectScript | undefined {
  return read()[id]
}

/** Drop a cached script (e.g. when its project/bible is deleted). */
export function removeCachedScript(id: string): void {
  const cache = read()
  if (id in cache) {
    delete cache[id]
    write(cache)
  }
}

/**
 * Re-attach cached scripts to records that came back from a backend which
 * doesn't store the (large) script blob. Records that already carry a script
 * are left untouched.
 */
export function attachCachedScripts<T extends { id: string; script?: ProjectScript }>(
  items: T[],
): T[] {
  const cache = read()
  let touched = false
  const next = items.map((item) => {
    if (item.script || !cache[item.id]) return item
    touched = true
    return { ...item, script: cache[item.id] }
  })
  return touched ? next : items
}
