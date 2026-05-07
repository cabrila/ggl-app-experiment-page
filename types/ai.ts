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

// character-extract result from AI service
export interface CharacterExtractResult {
  characters: {
    name: string
    type: "lead" | "supporting" | "minor" | "unknown"
    aliases?: string[]
    description?: string
    gender?: "male" | "female" | "non-binary" | "unknown"
    age_range?: string
  }[]
}

// actor-extract result (future)
export interface ActorExtractResult {
  actors: {
    name: string
    role?: string
    agency?: string
  }[]
}

// location-overview result (future)
export interface LocationOverviewResult {
  locations: {
    name: string
    type?: string
    description?: string
  }[]
}
