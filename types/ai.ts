// AI Service Types

export interface Attachment {
  uri: string
  mimeType: string
  role: string
}

export type TaskStatus = "received" | "running" | "complete" | "failed"

export interface TaskDocument {
  id: string
  skill: string
  input: Record<string, unknown>
  attachments: Attachment[]
  status: TaskStatus
  result?: unknown
  error?: string
  createdAt: string
  updatedAt: string
}

// Raw scene appearance as returned by the character-extract skill (snake_case)
export interface AISceneAppearance {
  scene_heading: string
  citation: string
}

// Single character as returned by the character-extract skill.
// The skill returns snake_case field names; we normalise to camelCase
// at the call site (UploadView) when mapping to our Character type.
export interface AIExtractedCharacter {
  name: string
  aliases: string[]
  gender: string
  age_range: string
  description: string
  scene_appearances: AISceneAppearance[]
  // The proxy may add an id (UUID) per the skill contract
  id?: string
}

// character-extract result from AI service
export interface CharacterExtractResult {
  characters: AIExtractedCharacter[]
}

// actor-extract result
export interface ActorExtractResult {
  actors: {
    name: string
    age?: number
    playing_age?: string
    phone?: string
    email?: string
    headshot_url?: string
    notes?: string
    agency?: string
  }[]
}

// prop-extract result
export interface PropExtractResult {
  props: {
    name: string
    category?: string
    description?: string
    notes?: string
    scene_appearances?: {
      scene_heading?: string
      handled_by?: string
      citation?: string
    }[]
  }[]
}

// scene-extract result
export interface SceneExtractResult {
  scenes: {
    scene_number?: number
    scene_heading?: string
    location?: string
    time_of_day?: string
    raw_text?: string
  }[]
}

// location-overview result
export interface LocationOverviewResult {
  locations: {
    name: string
    type?: "INT" | "EXT" | "INT/EXT" | "unknown"
    time_of_day?: "DAY" | "NIGHT" | "DAWN" | "DUSK" | "unknown"
    description?: string
    scouting_notes?: string
  }[]
}
