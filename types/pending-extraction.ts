import type { ProjectScript } from "./script"

// The four script-extraction sections that can hand scripts off to each other.
// These IDs match the app navigation identifiers.
export type SectionId = "scene-list" | "prop-list" | "location-overview" | "character-bible"

// Short, human-readable name for each section, used in "From X" source labels.
export const SECTION_LABELS: Record<SectionId, string> = {
  "scene-list": "Scenes",
  "prop-list": "Props",
  "location-overview": "Locations",
  "character-bible": "Characters",
}

// A script that was uploaded on one section and is now queued ("Ready to
// Extract") on another section, waiting for the user to start its extraction.
export interface PendingExtraction {
  id: string
  /** Project/source title, derived from the uploaded filename. */
  name: string
  /** The uploaded script, ready to be re-loaded into the target upload view. */
  script: ProjectScript
  /** The section the script was originally uploaded on. */
  sourceSection: SectionId
  createdAt: number
}
