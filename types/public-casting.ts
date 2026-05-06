export interface CastingCallField {
  id: string
  label: string
  type: "text" | "email" | "phone" | "textarea" | "select" | "file" | "url" | "number" | "image"
  required: boolean
  placeholder?: string
  options?: string[]
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
  name: string
  email: string
  phone?: string
  age?: string
  playingAge?: string
  headshot?: string
  notes?: string
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
