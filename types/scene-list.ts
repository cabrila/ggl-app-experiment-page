import type { ProjectScript } from "./script"

export interface Scene {
  id: string
  sceneNumber: number
  sceneHeading: string
  location: string
  timeOfDay: string
  rawText: string
  notes?: string
}

export interface SceneProject {
  id: string
  name: string
  scenes: Scene[]
  createdAt: Date
  updatedAt: Date
  thumbnailUrl?: string
  isDemo?: boolean
  /** The original script this list was extracted from (if uploaded). */
  script?: ProjectScript
}
