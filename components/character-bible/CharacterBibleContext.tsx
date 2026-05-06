"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Character, CharacterBible, CharacterBibleView } from "@/types/character-bible"

interface CharacterBibleContextType {
  bibles: CharacterBible[]
  currentBible: CharacterBible | null
  view: CharacterBibleView
  setView: (view: CharacterBibleView) => void
  setCurrentBible: (bible: CharacterBible | null) => void
  addBible: (bible: CharacterBible) => void
  updateBible: (id: string, updates: Partial<CharacterBible>) => void
  deleteBible: (id: string) => void
  addCharacter: (bibleId: string, character: Character) => void
  updateCharacter: (bibleId: string, characterId: string, updates: Partial<Character>) => void
  deleteCharacter: (bibleId: string, characterId: string) => void
}

const CharacterBibleContext = createContext<CharacterBibleContextType | undefined>(undefined)

// Demo data
const demoBibles: CharacterBible[] = [
  {
    id: "1",
    name: "Bluff Final",
    characters: Array.from({ length: 21 }, (_, i) => ({
      id: `char-${i + 1}`,
      name: `Character ${i + 1}`,
      age: "30s",
      gender: i % 2 === 0 ? "Male" : "Female",
      ethnicity: "Not specified",
      scenes: Math.floor(Math.random() * 20) + 1,
      castingNotes: "A complex character with depth and nuance.",
    })),
    createdAt: new Date("2026-04-28"),
    updatedAt: new Date("2026-04-28"),
  },
  {
    id: "2",
    name: "QuantumVeilScript",
    characters: [],
    createdAt: new Date("2026-04-28"),
    updatedAt: new Date("2026-04-28"),
  },
]

export function CharacterBibleProvider({ children }: { children: ReactNode }) {
  const [bibles, setBibles] = useState<CharacterBible[]>(demoBibles)
  const [currentBible, setCurrentBible] = useState<CharacterBible | null>(null)
  const [view, setView] = useState<CharacterBibleView>("list")

  const addBible = (bible: CharacterBible) => {
    setBibles((prev) => [...prev, bible])
  }

  const updateBible = (id: string, updates: Partial<CharacterBible>) => {
    setBibles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b))
    )
    if (currentBible?.id === id) {
      setCurrentBible({ ...currentBible, ...updates, updatedAt: new Date() })
    }
  }

  const deleteBible = (id: string) => {
    setBibles((prev) => prev.filter((b) => b.id !== id))
    if (currentBible?.id === id) {
      setCurrentBible(null)
      setView("list")
    }
  }

  const addCharacter = (bibleId: string, character: Character) => {
    setBibles((prev) =>
      prev.map((b) =>
        b.id === bibleId
          ? { ...b, characters: [...b.characters, character], updatedAt: new Date() }
          : b
      )
    )
    if (currentBible?.id === bibleId) {
      setCurrentBible({
        ...currentBible,
        characters: [...currentBible.characters, character],
        updatedAt: new Date(),
      })
    }
  }

  const updateCharacter = (bibleId: string, characterId: string, updates: Partial<Character>) => {
    setBibles((prev) =>
      prev.map((b) =>
        b.id === bibleId
          ? {
              ...b,
              characters: b.characters.map((c) =>
                c.id === characterId ? { ...c, ...updates } : c
              ),
              updatedAt: new Date(),
            }
          : b
      )
    )
    if (currentBible?.id === bibleId) {
      setCurrentBible({
        ...currentBible,
        characters: currentBible.characters.map((c) =>
          c.id === characterId ? { ...c, ...updates } : c
        ),
        updatedAt: new Date(),
      })
    }
  }

  const deleteCharacter = (bibleId: string, characterId: string) => {
    setBibles((prev) =>
      prev.map((b) =>
        b.id === bibleId
          ? {
              ...b,
              characters: b.characters.filter((c) => c.id !== characterId),
              updatedAt: new Date(),
            }
          : b
      )
    )
    if (currentBible?.id === bibleId) {
      setCurrentBible({
        ...currentBible,
        characters: currentBible.characters.filter((c) => c.id !== characterId),
        updatedAt: new Date(),
      })
    }
  }

  return (
    <CharacterBibleContext.Provider
      value={{
        bibles,
        currentBible,
        view,
        setView,
        setCurrentBible,
        addBible,
        updateBible,
        deleteBible,
        addCharacter,
        updateCharacter,
        deleteCharacter,
      }}
    >
      {children}
    </CharacterBibleContext.Provider>
  )
}

export function useCharacterBible() {
  const context = useContext(CharacterBibleContext)
  if (!context) {
    throw new Error("useCharacterBible must be used within a CharacterBibleProvider")
  }
  return context
}
