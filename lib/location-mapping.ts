import type { Location, LocationType } from "@/types/location-scouting"
import type { LocationOverviewResult } from "@/types/ai"

// AI: Single source of truth for turning a location-overview skill result into
// our Location model. Previously this logic was duplicated (and stale) in the
// upload view and the "add via upload" modal — both checked for "unknown",
// which the skill never emits (it emits "Not specified"), and both collapsed
// "INT/EXT" down to "INT", discarding the merge the backend computes.

type AiLocation = LocationOverviewResult["locations"][number]

const KNOWN_TYPES: LocationType[] = ["INT", "EXT", "INT/EXT", "Not specified"]

/** Normalize the skill's `type` onto our enum, defaulting to "Not specified". */
export function normalizeLocationType(raw: unknown): LocationType {
  const t = String(raw ?? "").trim().toUpperCase()
  if (t === "INT/EXT") return "INT/EXT"
  if (t === "INT") return "INT"
  if (t === "EXT") return "EXT"
  // AI: "unknown" is a legacy value some older payloads used; fold it in too.
  return KNOWN_TYPES.find((k) => k.toUpperCase() === t) ?? "Not specified"
}

/** Normalize the skill's free-string `time_of_day`, defaulting to "Not specified". */
export function normalizeTimeOfDay(raw: unknown): string {
  const t = String(raw ?? "").trim()
  if (!t || t.toLowerCase() === "unknown") return "Not specified"
  return t
}

/** Map one skill location to a Location. `id` is generated if not supplied. */
export function aiLocationToLocation(loc: AiLocation, id: string): Location {
  return {
    id,
    name: loc.name,
    type: normalizeLocationType(loc.type),
    timeOfDay: normalizeTimeOfDay(loc.time_of_day),
    description: loc.description || "",
    scoutingNotes: loc.scouting_notes || "",
  }
}
