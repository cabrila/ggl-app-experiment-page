// Character identifier following OMC spec
export interface CharacterIdentifier {
  identifierScope: string
  identifierValue: string
  _cite: string
}

// Gender profile with citation support
export interface GenderProfile {
  gender?: string
  genderPronoun?: string
  _cite_gender?: string
  _cite_genderPronoun?: string
}

// Physical characteristics with citation support
export interface PhysicalCharacteristics {
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

// Casting profile with age range
export interface CastingProfile {
  ageRange?: { playingAge?: string }
  _cite_playingAge?: string
}

// Character profile containing all nested data
export interface CharacterProfile {
  gender?: GenderProfile
  physicalCharacteristics?: PhysicalCharacteristics
  background?: string
  _cite_background?: string
  castingProfile?: CastingProfile
  ethnicity?: string
  _cite_ethnicity?: string
  castingNotes?: string
  _cite_castingNotes?: string
}

// Citations map type
export type Citations = Record<`c${number}`, string>

// Main Character interface following GGO/OMC spec
export interface Character {
  // Server-managed fields
  id: string
  projectId?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  isDuplicate?: boolean
  source?: "ai" | "manual" | "spreadsheet"

  // GGO/OMC payload
  entityType: "omc:Character"
  _cite: string
  identifier: CharacterIdentifier
  name: string
  _cite_name: string
  alternateNames?: string[]

  // Profile (optional - sparse entries are valid)
  profile?: CharacterProfile

  // Citations map
  _citations: Citations
}

export interface CharacterBible {
  id: string
  name: string
  characters: Character[]
  createdAt: Date
  updatedAt: Date
  thumbnailUrl?: string
}

export type CharacterBibleView = "list" | "upload" | "results"
