export interface CustomField {
  id: string
  name: string
  value: string
}

export type ActorGender = "Male" | "Female" | "Other" | "Not-specified"

export interface Actor {
  id: string
  name: string
  age: number
  gender?: ActorGender
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
  isDemo?: boolean
}

/**
 * An actor flattened across every list, annotated with which lists it
 * belongs to. Powers the aggregated "All Actors" view.
 */
export interface AggregatedActor extends Actor {
  sourceListIds: string[]
  sourceListNames: string[]
  isDuplicate: boolean
  duplicateDismissed: boolean
}
