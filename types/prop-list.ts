import type { ProjectScript } from "./script"

export type PropCategory =
  | "weapon"
  | "container"
  | "surveillance_device"
  | "tool"
  | "currency"
  | "contraband"
  | "equipment"
  | "food_or_drink"
  | "vehicle"
  | "wardrobe"
  | "document"
  | "other"

export interface PropSceneAppearance {
  id: string
  sceneHeading: string
  handledBy: string
  citation: string
}

export interface Prop {
  id: string
  name: string
  category: PropCategory
  description: string
  sceneAppearances: PropSceneAppearance[]
  notes?: string
  referenceImageUrl?: string
  /** User-uploaded reference image(s) for the "Prop Image and Sources" field (data URLs). */
  referenceImages?: string[]
  /** External reference/source link, opened in a new tab. */
  referenceLink?: string
}

export interface PropProject {
  id: string
  name: string
  props: Prop[]
  createdAt: Date
  updatedAt: Date
  thumbnailUrl?: string
  isDemo?: boolean
  /** The original script this list was extracted from (if uploaded). */
  script?: ProjectScript
}
