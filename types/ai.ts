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

// character-extract result from AI service (new GGO/OMC shape)
export interface CharacterExtractResult {
  characters: AICharacter[]
}

// Single character from AI service
export interface AICharacter {
  entityType: "omc:Character"
  _cite: string
  identifier: {
    identifierScope: string
    identifierValue: string
    _cite: string
  }
  name: string
  _cite_name: string
  alternateNames?: string[]

  profile?: {
    gender?: {
      gender?: string
      genderPronoun?: string
      _cite_gender?: string
      _cite_genderPronoun?: string
    }
    physicalCharacteristics?: {
      species?: string
      hairColor?: string
      hairLength?: string
      eyeColor?: string
      weight?: string
      height?: string
      _cite_species?: string
      _cite_hairColor?: string
      _cite_hairLength?: string
      _cite_eyeColor?: string
      _cite_weight?: string
      _cite_height?: string
    }
    background?: string
    _cite_background?: string
    castingProfile?: {
      ageRange?: { playingAge?: string }
      _cite_playingAge?: string
    }
    ethnicity?: string
    _cite_ethnicity?: string
    castingNotes?: string
    _cite_castingNotes?: string
  }

  _citations: Record<`c${number}`, string>
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
