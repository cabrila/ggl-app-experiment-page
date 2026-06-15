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
  /** Embedded video/link URLs (e.g. YouTube/Vimeo), carried over from form submissions. */
  videos?: string[]
  /** Uploaded image URLs beyond the main headshot, carried over from form submissions. */
  photos?: string[]
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
 * Indicates which collections an aggregated actor is associated with:
 * - "submissions": exists as a casting submission but is not in a My Actors list
 * - "actor-cards": belongs to one or more My Actors → Actor cards lists
 * - "both": is in a My Actors list and also matches a casting submission
 * - "none": a standalone actor with no list and no matching submission
 */
export type ActorAssociation = "submissions" | "actor-cards" | "both" | "none"

/**
 * An actor flattened across every list, annotated with which lists it
 * belongs to. Powers the aggregated "All Actors" view.
 */
export interface AggregatedActor extends Actor {
  sourceListIds: string[]
  sourceListNames: string[]
  isDuplicate: boolean
  duplicateDismissed: boolean
  /** Which collections this actor is associated with (Submissions, Actor cards, both, or none). */
  association: ActorAssociation
}
