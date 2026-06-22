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
    // The scene-extract skill returns a `summary` of the scene; `raw_text` is
    // kept for backward compatibility with any older payloads.
    summary?: string
    raw_text?: string
  }[]
}

// location-overview result. Mirrors the skill's output.schema.json: `type` is
// the INT/EXT enum (with "Not specified"), and `time_of_day` is a free string
// — a comma-separated union of distinct times across scenes (e.g. "DAY, NIGHT")
// or "Not specified".
export interface LocationOverviewResult {
  locations: {
    name: string
    type?: "INT" | "EXT" | "INT/EXT" | "Not specified"
    time_of_day?: string
    description?: string
    scouting_notes?: string
  }[]
}
