// AI: `type` mirrors the location-overview skill's enum — a location used both
// inside and outside merges to "INT/EXT". `timeOfDay` is a free string because
// the skill returns a comma-separated union across scenes (e.g. "DAY, NIGHT")
// and values beyond the four canonical ones (SUNRISE, MORNING, …). Matches the
// scene-list convention where timeOfDay is also a string.
import type { ProjectScript } from "./script"

export type LocationType = "INT" | "EXT" | "INT/EXT" | "Not specified"

export interface Location {
  id: string
  name: string
  type: LocationType
  timeOfDay: string
  description: string
  scoutingNotes: string
  locationIdeaMapUrl?: string
  locationIdeaLink?: string
  /** User-uploaded location idea images (data URLs), browsable in a carousel. */
  locationIdeaImages?: string[]
}

export interface LocationProject {
  id: string
  name: string
  locations: Location[]
  createdAt: Date
  updatedAt: Date
  thumbnailUrl?: string
  isDemo?: boolean
  /** The original script this list was extracted from (if uploaded). */
  script?: ProjectScript
}
