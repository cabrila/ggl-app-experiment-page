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

// Citation types matching new shape
export interface AICitationEntry {
  id: string
  text: string
}

export interface AIFieldCitation {
  field: string
  citationId: string
}

// character-extract result from AI service (new array-based citation shape)
export interface CharacterExtractResult {
  characters: AICharacter[]
}

// Single character from AI service with new citation shape
export interface AICharacter {
  entityType: "omc:Character"
  identifier: {
    identifierScope: string
    identifierValue: string
  }
  name: string
  alternateNames?: string[]

  profile?: {
    gender?: {
      gender?: string
      genderPronoun?: string
    }
    physicalCharacteristics?: {
      species?: string
      hairColor?: string
      hairLength?: string
      eyeColor?: string
      weight?: string
      height?: string
    }
    background?: string
    castingProfile?: {
      ageRange?: { playingAge?: string }
    }
    ethnicity?: string
    castingNotes?: string
  }

  // NEW citation shape (arrays, not maps)
  citations: AICitationEntry[]
  fieldCitations: AIFieldCitation[]
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
