export interface Character {
  id: string
  name: string
  age: string
  gender: string
  ethnicity: string
  scenes: number
  castingNotes: string
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
