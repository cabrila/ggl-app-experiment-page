import type { ProjectScript } from "./script"

// A single scene appearance for a character (camelCase normalised at the call site)
export interface CharacterSceneAppearance {
  sceneHeading: string  // verbatim slugline, e.g. "INT. CABIN - NIGHT (1946)"
  citation: string      // verbatim line from the script proving presence
}

// Character shape matching the new character-extract skill output.
// The skill returns snake_case (name, aliases, gender, age_range,
// description, scene_appearances). We normalise to camelCase here so the
// UI never reaches into both naming conventions in different files.
export interface Character {
  // Server-managed fields
  id: string
  projectId?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  isDuplicate?: boolean
  source?: "ai" | "manual" | "spreadsheet"

  // Character data
  name: string
  aliases: string[]                              // empty array if none
  gender: string                                 // free-text from script, or "unknown"
  ageRange: string                               // e.g. "40s", "25-35", or "unknown"
  description: string                            // 1-3 sentence prose summary
  sceneAppearances: CharacterSceneAppearance[]   // empty array if none
}

export interface CharacterBible {
  id: string
  name: string
  characters: Character[]
  createdAt: Date
  updatedAt: Date
  thumbnailUrl?: string
  isDemo?: boolean
  /** The original script this bible was extracted from (if uploaded). */
  script?: ProjectScript
}

export type CharacterBibleView = "list" | "upload" | "results"
