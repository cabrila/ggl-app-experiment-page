"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { User } from "firebase/auth"
import { Character, CharacterBible, CharacterBibleView } from "@/types/character-bible"
import { subscribeToAuthStateChanges } from "@/lib/auth"
import {
  subscribeToCharacterBibles,
  addCharacterBible,
  updateCharacterBible as updateCharacterBibleInFirestore,
  deleteCharacterBible as deleteCharacterBibleFromFirestore,
} from "@/lib/firestore"
import { ensureDemoScript } from "@/lib/scriptFile"
import { cacheScript, attachCachedScripts, removeCachedScript } from "@/lib/scriptCache"
import type { PendingExtraction } from "@/types/pending-extraction"

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
  addCharacter: (bibleId: string, character: Character | Character[]) => void
  updateCharacter: (bibleId: string, characterId: string, updates: Partial<Character>) => void
  deleteCharacter: (bibleId: string, characterId: string) => void
  /** A "Ready to Extract" entry chosen on the list, to pre-load in the upload view. */
  pendingScript: PendingExtraction | null
  setPendingScript: (pending: PendingExtraction | null) => void
}

const CharacterBibleContext = createContext<CharacterBibleContextType | undefined>(undefined)

// Demo data - shown when user is not logged in

// Helper: build described characters for a demo bible from compact tuples.
// Tuple shape: [name, gender, ageRange, description]
const buildCharacters = (
  bibleKey: string,
  rows: [string, string, string, string][]
): Character[] =>
  rows.map(([name, gender, ageRange, description], i) => ({
    id: `${bibleKey}-char-${i + 1}`,
    name,
    aliases: [],
    gender,
    ageRange,
    description,
    sceneAppearances: [],
  }))

const extraDemoBibles: CharacterBible[] = [
  {
    id: "demo-bible-lighthouse",
    name: "The Last Lighthouse",
    createdAt: new Date("2026-05-02"),
    updatedAt: new Date("2026-05-02"),
    isDemo: true,
    characters: buildCharacters("lh", [
      ["Maren Hølt", "Female", "50s", "The widowed lighthouse keeper who refuses to abandon her post even as the coast erodes beneath her."],
      ["Elias Voss", "Male", "30s", "A shipwreck survivor washed ashore with no memory of the night that brought him there."],
      ["Greta Lund", "Female", "60s", "Maren's sharp-tongued sister who runs the village's only general store and knows everyone's secrets."],
      ["Tobias Reyne", "Male", "40s", "A maritime inspector sent to decommission the lighthouse, torn between duty and conscience."],
      ["Saoirse Mhic", "Female", "20s", "A folklore student recording the dying legends of the coastal town."],
      ["Captain Ford", "Male", "60s", "A retired trawler captain haunted by the crew he lost in a storm decades ago."],
      ["Lena Park", "Female", "30s", "The town doctor stretched thin across a hundred miles of scattered fishing hamlets."],
      ["Niall Brennan", "Male", "teens", "A restless local boy who dreams of leaving on the next supply ferry."],
      ["Edith Calloway", "Female", "70s", "The keeper of the church records, the last person alive who remembers the old wreck."],
      ["Rurik Sand", "Male", "40s", "A salvage diver who profits from the very disasters the lighthouse exists to prevent."],
      ["Imogen Ash", "Female", "30s", "A painter who arrived for a week and never left, obsessed with the light's rhythm."],
      ["Samuel Crow", "Male", "50s", "The ferry operator and unofficial messenger between the island and the mainland."],
    ]),
  },
  {
    id: "demo-bible-neon",
    name: "Neon Syndicate",
    createdAt: new Date("2026-05-03"),
    updatedAt: new Date("2026-05-03"),
    isDemo: true,
    characters: buildCharacters("ns", [
      ["Kazimir Vale", "Male", "40s", "A syndicate fixer who launders memories instead of money in the city's data underworld."],
      ["Juno Tan", "Female", "20s", "A street-level netrunner with a stolen neural deck and a target on her back."],
      ["Director Okonkwo", "Male", "50s", "The corporate head of security who built the surveillance grid he now fears."],
      ["Mira Solis", "Female", "30s", "A defected biohacker selling black-market upgrades from a noodle bar back room."],
      ["The Cardinal", "Male", "60s", "An ageing crime lord who communicates only through proxies and prophecy."],
      ["Dex Holloway", "Male", "30s", "A burnt-out enforcer trying to buy his way out of the life with one last job."],
      ["Ada Quist", "Female", "40s", "An investigative journalist chasing the story that already killed two colleagues."],
      ["Pulse", "Female", "20s", "A rogue AI wearing a synthetic body, learning what it means to want."],
      ["Renzo Vex", "Male", "30s", "A nightclub owner whose VIP lounge is the syndicate's real boardroom."],
      ["Officer Bly", "Female", "30s", "An honest cop in a precinct where honesty is a liability."],
      ["Grandmother Yi", "Female", "70s", "A tenement matriarch who shelters runaways and trades in forbidden paper books."],
      ["Silas Mott", "Male", "40s", "A ripperdoc whose clinic stitches up everyone the hospitals turn away."],
    ]),
  },
  {
    id: "demo-bible-harvest",
    name: "Harvest Moon County",
    createdAt: new Date("2026-05-04"),
    updatedAt: new Date("2026-05-04"),
    isDemo: true,
    characters: buildCharacters("hm", [
      ["Wade Calhoun", "Male", "50s", "A third-generation farmer fighting to keep the family land out of corporate hands."],
      ["Ruth Calhoun", "Female", "50s", "Wade's wife and the steady accountant of a farm that no longer adds up."],
      ["Jesse Calhoun", "Male", "20s", "The prodigal son returning from the city with a business degree and a secret."],
      ["Darlene Webb", "Female", "40s", "The diner owner who feeds the whole county on credit and gossip."],
      ["Sheriff Roy Tate", "Male", "50s", "A lawman whose loyalty to old friendships clashes with a new land dispute."],
      ["Cora Mae", "Female", "teens", "A high-schooler determined to be the first in her family to leave for college."],
      ["Hank Doyle", "Male", "60s", "A weathered ranch hand who has worked the Calhoun fields his whole life."],
      ["Pastor Lyle", "Male", "40s", "A young preacher trying to hold a fracturing congregation together."],
      ["Nadine Frost", "Female", "30s", "A developer's agent buying up foreclosed farms with a practiced smile."],
      ["Earl Mott", "Male", "60s", "The bank manager torn between the ledgers and the neighbors he grew up with."],
      ["Birdie Calhoun", "Female", "70s", "The family matriarch whose stories hold the deed to more than just land."],
      ["Travis Kane", "Male", "30s", "A rival farmer whose feud with the Calhouns spans two generations."],
    ]),
  },
  {
    id: "demo-bible-orbital",
    name: "Orbital Decay",
    createdAt: new Date("2026-05-05"),
    updatedAt: new Date("2026-05-05"),
    isDemo: true,
    characters: buildCharacters("od", [
      ["Cmdr. Iris Vance", "Female", "40s", "The station commander rationing oxygen and morale as rescue grows unlikely."],
      ["Dr. Anil Rao", "Male", "30s", "The mission biologist whose experiment may be the cause of the contamination."],
      ["Yuki Tanaka", "Female", "30s", "A flight engineer keeping a dying station alive with duct tape and prayer."],
      ["Marcus Eberle", "Male", "50s", "A corporate observer whose orders contradict the crew's survival."],
      ["Petra Nilsen", "Female", "20s", "A rookie pilot on her first deployment, in over her head and hiding it."],
      ["Solomon Bright", "Male", "60s", "The chaplain and counselor who has buried more crews than he'll admit."],
      ["Dr. Lin Wei", "Female", "40s", "A physician forced to make triage choices no training prepared her for."],
      ["Reese Donovan", "Male", "30s", "A comms officer intercepting transmissions the company wants buried."],
      ["Astrid Holt", "Female", "50s", "Ground control's lead, fighting bureaucracy a quarter-million miles away."],
      ["Owen Frye", "Male", "20s", "A maintenance tech who knows the station's vents better than its officers."],
      ["Nova", "Female", "30s", "The station's synthetic intelligence, quietly rewriting its own directives."],
      ["Gregor Pavlov", "Male", "50s", "A veteran cosmonaut whose old-school instincts clash with new protocol."],
    ]),
  },
  {
    id: "demo-bible-velvet",
    name: "The Velvet Court",
    createdAt: new Date("2026-05-06"),
    updatedAt: new Date("2026-05-06"),
    isDemo: true,
    characters: buildCharacters("vc", [
      ["Queen Aldreda", "Female", "40s", "A monarch ruling through intelligence and ice, surrounded by sharpening knives."],
      ["Lord Cassian", "Male", "30s", "The ambitious chancellor whose loyalty is always for sale to the highest crown."],
      ["Lady Rosalind", "Female", "20s", "A lady-in-waiting playing a far deeper game than her station suggests."],
      ["SirBram", "Male", "40s", "The captain of the guard, honest to a fault in a court that punishes honesty."],
      ["Magister Vey", "Male", "60s", "The court physician and poisoner, depending on who is paying."],
      ["Princess Elowen", "Female", "teens", "The heir being groomed for a throne she is not sure she wants."],
      ["Duke Harrow", "Male", "50s", "A border duke whose armies make him impossible to ignore or trust."],
      ["Seraphine", "Female", "30s", "A foreign envoy whose charm masks a spymaster's discipline."],
      ["Brother Aldous", "Male", "50s", "The royal confessor who hears every secret and keeps a ledger of them."],
      ["Lady Wren", "Female", "40s", "The dowager whose faded influence still bends the council to her will."],
      ["Tomas the Fool", "Male", "30s", "A jester who speaks the only truths allowed within the palace walls."],
      ["Isolde", "Female", "20s", "A kitchen girl who overhears too much and survives by saying nothing."],
    ]),
  },
]

const demoBibles: CharacterBible[] = [
  {
    id: "demo-1",
    name: "Bluff Final",
    characters: [
      "Eleanor Whitmore", "Marcus Bellamy", "Sophia Castellanos", "Declan Ross", "Vivian Hale",
      "Julian Crane", "Beatrice Lowell", "Nathaniel Pierce", "Camille Devereaux", "Sebastian Vaughn",
      "Adelaide Sinclair", "Oscar Mendoza", "Genevieve Holt", "Rafael Ortega", "Cordelia Banks",
      "Theodore Marsh", "Isadora Quinn", "Lucian Fairfax", "Margot Ellison", "Gideon Thorne",
      "Rosalind Carver",
    ].map((name, i) => ({
      id: `char-${i + 1}`,
      name,
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
  ...extraDemoBibles,
]

// Attach a sample script to every demo bible so the "Script" button is visible
// and works out of the box.
const demoBiblesWithScript: CharacterBible[] = ensureDemoScript(demoBibles)

export function CharacterBibleProvider({ children }: { children: ReactNode }) {
  const [bibles, setBibles] = useState<CharacterBible[]>(demoBiblesWithScript)
  const [currentBible, setCurrentBible] = useState<CharacterBible | null>(null)
  // Latest currentBible for the Firestore subscription callback (set up with
  // [user] deps), so manual adds/edits refresh the open bible when signed in.
  const currentBibleRef = useRef<CharacterBible | null>(null)
  useEffect(() => {
    currentBibleRef.current = currentBible
  }, [currentBible])
  const [view, setView] = useState<CharacterBibleView>("list")
  const [pendingScript, setPendingScript] = useState<PendingExtraction | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthStateChanges((authUser) => {
      setUser(authUser)
      if (!authUser) {
        // User logged out, show demo data
        setBibles(demoBiblesWithScript)
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
        // Firestore doesn't store the uploaded script — re-attach it from the
        // local cache so the "Script" preview button survives the refresh.
        const withScripts = attachCachedScripts(firestoreBibles)
        setBibles(withScripts)
        // Update currentBible if it exists in the new data (read latest via ref)
        const current = currentBibleRef.current
        if (current) {
          const updated = withScripts.find((b) => b.id === current.id)
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
        const { id, isDemo, script, ...bibleData } = bible
        const newId = await addCharacterBible(user.uid, bibleData)
        // Persist the script client-side under the new id so it's re-attached
        // when the Firestore subscription (which omits it) refreshes.
        if (script) cacheScript(newId, script)
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
        // Keep the uploaded script out of Firestore writes (it can exceed the
        // 1MB doc limit); it lives in memory / demo storage only.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { script, ...updatesData } = updates
        await updateCharacterBibleInFirestore(user.uid, id, updatesData)
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
    removeCachedScript(id)

    if (currentBible?.id === id) {
      setCurrentBible(null)
      setView("list")
    }
  }

  const addCharacter = async (bibleId: string, character: Character | Character[]) => {
    const bible = bibles.find((b) => b.id === bibleId)
    if (!bible) return

    const newCharacters = Array.isArray(character) ? character : [character]
    const updatedCharacters = [...bible.characters, ...newCharacters]

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
      if (currentBibleRef.current?.id === bibleId) {
        setCurrentBible({
          ...currentBibleRef.current,
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
        pendingScript,
        setPendingScript,
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
