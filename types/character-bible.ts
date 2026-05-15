// Citation entry - a single source line
export interface CitationEntry {
  id: string              // "c0", "c1", "c2", ...
  text: string            // verbatim source line
}

// Field citation - maps a field path to a citation id
export interface FieldCitation {
  field: string           // "entity" | "identifier" | "name" | dotted profile path
  citationId: string      // must reference an id in citations[]
}

// Character identifier following OMC spec
export interface CharacterIdentifier {
  identifierScope: string   // always "gogreenlightai"
  identifierValue: string
}

// Gender profile
export interface GenderProfile {
  gender?: string
  genderPronoun?: string
}

// Physical characteristics
export interface PhysicalCharacteristics {
  species?: string
  hairColor?: string
  hairLength?: string
  eyeColor?: string
  weight?: string
  height?: string
}

// Casting profile with age range
export interface CastingProfile {
  ageRange?: { playingAge?: string }
}

// Character profile containing all nested data
export interface CharacterProfile {
  gender?: GenderProfile
  physicalCharacteristics?: PhysicalCharacteristics
  background?: string
  castingProfile?: CastingProfile
  ethnicity?: string
  castingNotes?: string
}

// Main Character interface following GGO/OMC spec with new citation shape
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
  identifier: CharacterIdentifier
  name: string
  alternateNames?: string[]

  // Profile (optional - sparse entries are valid)
  profile?: CharacterProfile

  // NEW citation shape (arrays, not maps)
  citations: CitationEntry[]
  fieldCitations: FieldCitation[]
}

export interface CharacterBible {
  id: string
  name: string
  characters: Character[]
  createdAt: Date
  updatedAt: Date
  thumbnailUrl?: string
  isDemo?: boolean
}

export type CharacterBibleView = "list" | "upload" | "results"

// Helper function: get citation text for a field path
export function getFieldCitation(character: Character, fieldPath: string): string | undefined {
  // Step 1: Find the fieldCitations entry for this field
  const fieldCitation = character.fieldCitations?.find(fc => fc.field === fieldPath)
  if (!fieldCitation) return undefined

  // Step 2: Look up the citation text by matching citationId to citations[].id
  const citation = character.citations?.find(c => c.id === fieldCitation.citationId)
  return citation?.text
}

// Convenience: get entity-level citation
export function getEntityCitation(character: Character): string | undefined {
  return getFieldCitation(character, "entity")
}
