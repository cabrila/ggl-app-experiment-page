export interface CastingCallField {
  id: string
  label: string
  type: "text" | "email" | "phone" | "textarea" | "select" | "file" | "url" | "number" | "image"
  required: boolean
  placeholder?: string
  options?: string[] // For select fields
}

export interface CastingCall {
  id: string
  title: string
  description: string
  projectName: string
  fields: CastingCallField[]
  createdAt: Date
  isActive: boolean
  shareableLink: string
}

export interface CastingSubmission {
  id: string
  castingCallId: string
  castingCallTitle: string
  data: Record<string, string>
  submittedAt: Date
  isNew: boolean
  // Standard actor fields extracted from data
  name: string
  email: string
  phone?: string
  age?: string
  playingAge?: string
  headshot?: string
  notes?: string
  // Grading (1-10 scale)
  grade?: number
}

export interface PublicCastingProject {
  id: string
  name: string
  castingCalls: CastingCall[]
  submissions: CastingSubmission[]
  createdAt: Date
  thumbnailUrl?: string
}
