"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { User } from "firebase/auth"
import { Character, CharacterBible, CharacterBibleView } from "@/types/character-bible"
import { subscribeToAuthStateChanges } from "@/lib/auth"
import {
  subscribeToCharacterBibles,
  addCharacterBible,
  updateCharacterBible as updateCharacterBibleInFirestore,
  deleteCharacterBible as deleteCharacterBibleFromFirestore,
} from "@/lib/firestore"

interface CharacterBibleContextType {
  bibles: CharacterBible[]
  currentBible: CharacterBible | null
  view: CharacterBibleView
  isLoading: boolean
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

// Demo data - shown when user is not logged in
const demoBibles: CharacterBible[] = [
  {
    id: "demo-1",
    name: "Bluff Final",
    characters: Array.from({ length: 21 }, (_, i) => ({
      id: `char-${i + 1}`,
      name: `Character ${i + 1}`,
      aliases: [],
      gender: i % 2 === 0 ? "Male" : "Female",
      ageRange: "30s",
      description: "",
      sceneAppearances: [],
    })),
    createdAt: new Date("2026-04-28"),
    updatedAt: new Date("2026-04-28"),
    isDemo: true,
  },
  {
    id: "demo-2",
    name: "QuantumVeilScript",
    characters: [],
    createdAt: new Date("2026-04-28"),
    updatedAt: new Date("2026-04-28"),
    isDemo: true,
  },
]

export function CharacterBibleProvider({ children }: { children: ReactNode }) {
  const [bibles, setBibles] = useState<CharacterBible[]>(demoBibles)
  const [currentBible, setCurrentBible] = useState<CharacterBible | null>(null)
  const [view, setView] = useState<CharacterBibleView>("list")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthStateChanges((authUser) => {
      setUser(authUser)
      if (!authUser) {
        // User logged out, show demo data
        setBibles(demoBibles)
        setCurrentBible(null)
        setView("list")
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Subscribe to Firestore when user is authenticated
  useEffect(() => {
    if (!user) return

    setIsLoading(true)
    const unsubscribe = subscribeToCharacterBibles(
      user.uid,
      (firestoreBibles) => {
        setBibles(firestoreBibles)
        // Update currentBible if it exists in the new data
        if (currentBible) {
          const updated = firestoreBibles.find((b) => b.id === currentBible.id)
          if (updated) {
            setCurrentBible(updated)
          }
        }
        setIsLoading(false)
      },
      (error) => {
        console.error("[v0] Error subscribing to character bibles:", error)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const addBible = async (bible: CharacterBible) => {
    if (user) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, isDemo, ...bibleData } = bible
        const newId = await addCharacterBible(user.uid, bibleData)
        // Firestore subscription will update the state
        // Set the new bible as current with the Firestore ID
        setCurrentBible({ ...bible, id: newId, isDemo: false })
      } catch (error) {
        console.error("[v0] Error adding character bible to Firestore:", error)
        if (error && typeof error === "object" && "code" in error) {
          console.error("[v0] Firestore error code:", (error as { code: string }).code)
        }
        // Fallback so the user still sees the bible locally for this session.
        setBibles((prev) => [...prev, bible])
        setCurrentBible(bible)
      }
    } else {
      // Not logged in, just add to local state (demo mode)
      setBibles((prev) => [...prev, bible])
    }
  }

  const updateBible = async (id: string, updates: Partial<CharacterBible>) => {
    const bible = bibles.find((b) => b.id === id)
    if (!bible) return

    if (user && !bible.isDemo) {
      try {
        await updateCharacterBibleInFirestore(user.uid, id, updates)
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error updating character bible:", error)
      }
    } else {
      // Demo mode - update local state
      setBibles((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b))
      )
      if (currentBible?.id === id) {
        setCurrentBible({ ...currentBible, ...updates, updatedAt: new Date() })
      }
    }
  }

  const deleteBible = async (id: string) => {
    const bible = bibles.find((b) => b.id === id)
    if (!bible) return

    if (user && !bible.isDemo) {
      try {
        await deleteCharacterBibleFromFirestore(user.uid, id)
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error deleting character bible:", error)
      }
    } else {
      // Demo mode - update local state
      setBibles((prev) => prev.filter((b) => b.id !== id))
    }

    if (currentBible?.id === id) {
      setCurrentBible(null)
      setView("list")
    }
  }

  const addCharacter = async (bibleId: string, character: Character) => {
    const bible = bibles.find((b) => b.id === bibleId)
    if (!bible) return

    const updatedCharacters = [...bible.characters, character]

    if (user && !bible.isDemo) {
      try {
        await updateCharacterBibleInFirestore(user.uid, bibleId, {
          characters: updatedCharacters,
        })
      } catch (error) {
        console.error("[v0] Error adding character:", error)
      }
    } else {
      setBibles((prev) =>
        prev.map((b) =>
          b.id === bibleId
            ? { ...b, characters: updatedCharacters, updatedAt: new Date() }
            : b
        )
      )
      if (currentBible?.id === bibleId) {
        setCurrentBible({
          ...currentBible,
          characters: updatedCharacters,
          updatedAt: new Date(),
        })
      }
    }
  }

  const updateCharacter = async (
    bibleId: string,
    characterId: string,
    updates: Partial<Character>
  ) => {
    const bible = bibles.find((b) => b.id === bibleId)
    if (!bible) return

    const updatedCharacters = bible.characters.map((c) =>
      c.id === characterId ? { ...c, ...updates } : c
    )

    if (user && !bible.isDemo) {
      try {
        await updateCharacterBibleInFirestore(user.uid, bibleId, {
          characters: updatedCharacters,
        })
      } catch (error) {
        console.error("[v0] Error updating character:", error)
      }
    } else {
      setBibles((prev) =>
        prev.map((b) =>
          b.id === bibleId
            ? { ...b, characters: updatedCharacters, updatedAt: new Date() }
            : b
        )
      )
      if (currentBible?.id === bibleId) {
        setCurrentBible({
          ...currentBible,
          characters: updatedCharacters,
          updatedAt: new Date(),
        })
      }
    }
  }

  const deleteCharacter = async (bibleId: string, characterId: string) => {
    const bible = bibles.find((b) => b.id === bibleId)
    if (!bible) return

    const updatedCharacters = bible.characters.filter((c) => c.id !== characterId)

    if (user && !bible.isDemo) {
      try {
        await updateCharacterBibleInFirestore(user.uid, bibleId, {
          characters: updatedCharacters,
        })
      } catch (error) {
        console.error("[v0] Error deleting character:", error)
      }
    } else {
      setBibles((prev) =>
        prev.map((b) =>
          b.id === bibleId
            ? { ...b, characters: updatedCharacters, updatedAt: new Date() }
            : b
        )
      )
      if (currentBible?.id === bibleId) {
        setCurrentBible({
          ...currentBible,
          characters: updatedCharacters,
          updatedAt: new Date(),
        })
      }
    }
  }

  return (
    <CharacterBibleContext.Provider
      value={{
        bibles,
        currentBible,
        view,
        isLoading,
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
