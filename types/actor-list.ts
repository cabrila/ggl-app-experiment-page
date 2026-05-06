export interface CustomField {
  id: string
  name: string
  value: string
}

export interface Actor {
  id: string
  name: string
  age: number
  playingAge: string
  phone: string
  email: string
  headshotUrl: string
  notes: string
  mediaMaterial?: string
  customFields?: CustomField[]
}

export interface ActorListProject {
  id: string
  name: string
  actors: Actor[]
  createdAt: Date
  updatedAt: Date
  thumbnailUrl?: string
}
