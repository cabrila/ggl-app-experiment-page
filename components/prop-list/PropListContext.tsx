"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { User } from "firebase/auth"
import { Prop, PropProject } from "@/types/prop-list"
import { subscribeToAuthStateChanges } from "@/lib/auth"
import {
  subscribeToPropProjects,
  addPropProject,
  updatePropProject as updatePropProjectInFirestore,
  deletePropProject as deletePropProjectFromFirestore,
} from "@/lib/firestore"
import { loadDemoData, saveDemoData, DEMO_STORAGE_KEYS } from "@/utils/demoPersistence"

type ViewState = "projects" | "upload" | "results"

interface PropListContextType {
  projects: PropProject[]
  currentProject: PropProject | null
  view: ViewState
  isLoading: boolean
  setView: (view: ViewState) => void
  setCurrentProject: (project: PropProject | null) => void
  addProject: (project: PropProject) => void
  updateProject: (project: PropProject) => void
  deleteProject: (projectId: string) => void
  addProp: (projectId: string, prop: Prop | Prop[]) => void
  updateProp: (projectId: string, prop: Prop) => void
  deleteProp: (projectId: string, propId: string) => void
}

const PropListContext = createContext<PropListContextType | null>(null)

const demoProjects: PropProject[] = [
  {
    id: "demo-1",
    name: "NO COUNTRY FOR OLD MEN",
    createdAt: new Date("2026-04-29"),
    updatedAt: new Date("2026-04-29"),
    isDemo: true,
    props: [
      {
        id: "1",
        name: "Pneumatic Cattle Gun",
        category: "weapon",
        description:
          "A device resembling an oxygen tank for emphysema, with a petcock at the top and tubing running off it into a sleeve. Fires a hard pneumatic bolt. Chigurh's signature weapon.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "INT. SHERIFF LAMAR'S OFFICE - DAY",
            handledBy: "THE DEPUTY",
            citation:
              "Sheriff he had some sort of a thing on him like one of them oxygen tanks for emphysema...",
          },
          {
            id: "a2",
            sceneHeading: "EXT. ROAD - LATE DAY",
            handledBy: "CHIGURH",
            citation:
              "The prisoner -- his name is Anton Chigurh -- gets out of the police car and slings the tank over his shoulder.",
          },
        ],
      },
      {
        id: "2",
        name: "Document Case",
        category: "container",
        description:
          "A boxy leather document case found at the drug deal massacre site, filled with bank-wrapped hundred-dollar packets. The central MacGuffin of the film.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "EXT. ROCK SHELF - MINUTES LATER",
            handledBy: "MOSS",
            citation: "Next to the body is a boxy leather document case.",
          },
          {
            id: "a2",
            sceneHeading: "INT. HOTEL ROOM - NIGHT",
            handledBy: "MOSS",
            citation:
              "Moss swings the document case onto the bed and unclasps it and upends the money onto the bed.",
          },
        ],
      },
      {
        id: "3",
        name: "Transponder / Sending Unit",
        category: "surveillance_device",
        description:
          "A sending unit the size of a Zippo lighter, hidden inside a hollowed-out packet of bills. Broadcasts a tracking signal Chigurh detects with his receiver.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "INT. HOTEL ROOM - NIGHT",
            handledBy: "MOSS",
            citation:
              "In the hollow is a sending unit the size of a Zippo lighter. He holds the sender, staring at it.",
          },
        ],
      },
      {
        id: "4",
        name: "Heavy-Barreled Hunting Rifle",
        category: "weapon",
        description:
          "Moss's hunting rifle with a magnified scope and calibrated range dial, used to stalk and wound an antelope on the arid plain.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "EXT. ARID PLAIN - DAY",
            handledBy: "MOSS",
            citation:
              "A heavy-barreled rifle is slung across his back... He lowers the binoculars, slowly unslings the rifle and looks through its sight.",
          },
        ],
      },
      {
        id: "5",
        name: "Bank-Wrapped Hundreds",
        category: "currency",
        description:
          "Stacks of hundred-dollar bills in bank-issue paper bands, each packet stamped '$10,000,' filling the document case to roughly two million dollars total.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "EXT. ROCK SHELF - MINUTES LATER",
            handledBy: "MOSS",
            citation: "Bank-wrapped hundreds fill it. Each packet is stamped '$10,000.'",
          },
        ],
      },
      {
        id: "6",
        name: "Binoculars",
        category: "tool",
        description:
          "A pair of binoculars worn around Moss's neck on a strap. Used to survey the arid plain, locate the massacre site, and watch for threats.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "EXT. ARID PLAIN - DAY",
            handledBy: "MOSS",
            citation:
              "a pair of binoculars... He lowers the binoculars, slowly unslings the rifle and looks through its sight.",
          },
        ],
      },
    ],
  },
  {
    id: "demo-2",
    name: "THE HARBOR LIGHT",
    createdAt: new Date("2026-04-18"),
    updatedAt: new Date("2026-04-18"),
    isDemo: true,
    props: [
      {
        id: "1",
        name: "Brass Lantern",
        category: "tool",
        description:
          "A weathered brass lantern carried by Maren up the lighthouse stairs. Its warm glow lights the cramped spiral passage.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "EXT. LIGHTHOUSE - DAWN",
            handledBy: "MAREN",
            citation: "Maren climbs the spiral stairs, a lantern swinging in her grip.",
          },
        ],
      },
      {
        id: "2",
        name: "Nautical Charts",
        category: "document",
        description:
          "A stack of yellowed sea charts marked with reefs and currents, pinned around the keeper's cottage walls.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "INT. KEEPER'S COTTAGE - MORNING",
            handledBy: "MAREN",
            citation: "A cramped room lined with charts and brass instruments.",
          },
        ],
      },
      {
        id: "3",
        name: "Foghorn",
        category: "tool",
        description:
          "The lighthouse foghorn lever, pulled to warn ships off the reef during the storm.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "INT. LANTERN ROOM - NIGHT",
            handledBy: "MAREN",
            citation: "Maren spots a ship listing dangerously close to the reef and lunges for the foghorn.",
          },
        ],
      },
      {
        id: "4",
        name: "Dinghy",
        category: "vehicle",
        description:
          "A small wooden rowing dinghy Maren uses to reach the foundering vessel through heavy swells.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "EXT. REEF - NIGHT",
            handledBy: "MAREN",
            citation: "Maren rows a small dinghy through the swells toward the wreck.",
          },
        ],
      },
    ],
  },
  {
    id: "demo-3",
    name: "CITY OF ASH",
    createdAt: new Date("2026-03-30"),
    updatedAt: new Date("2026-03-30"),
    isDemo: true,
    props: [
      {
        id: "1",
        name: "Scavenger's Pack",
        category: "container",
        description:
          "A patched canvas rucksack stuffed with salvaged tools and tins, carried through the ruined skyline.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "EXT. RUINED SKYLINE - DUSK",
            handledBy: "SURVIVOR",
            citation: "A lone figure picks through rubble, scavenging for supplies.",
          },
        ],
      },
      {
        id: "2",
        name: "Hand-Crank Flashlight",
        category: "tool",
        description:
          "A battered hand-crank flashlight whose beam cuts through the subway dark.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "INT. SUBWAY TUNNEL - CONTINUOUS",
            handledBy: "SURVIVORS",
            citation: "Flashlight beams cut through the dark.",
          },
        ],
      },
      {
        id: "3",
        name: "Ration Tins",
        category: "food_or_drink",
        description:
          "A dwindling cache of dented ration tins, divided carefully by Elena at the shelter.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "INT. SHELTER - NIGHT",
            handledBy: "ELENA",
            citation: "Elena divides the last of the rations while the others sleep.",
          },
        ],
      },
      {
        id: "4",
        name: "Sentry Rifle",
        category: "weapon",
        description:
          "A worn service rifle slung by the checkpoint sentries guarding the barricaded street.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "EXT. CHECKPOINT - DAY",
            handledBy: "SENTRY",
            citation: "Armed sentries guard a barricaded street.",
          },
        ],
      },
    ],
  },
  {
    id: "demo-4",
    name: "TIDES OF SUMMER",
    createdAt: new Date("2026-03-12"),
    updatedAt: new Date("2026-03-12"),
    isDemo: true,
    props: [
      {
        id: "1",
        name: "Old Photograph",
        category: "document",
        description:
          "A creased snapshot of two children on the boardwalk that Nora and Theo pore over, laughing.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "EXT. BOARDWALK - DAY",
            handledBy: "NORA",
            citation: "Nora and Theo share a bench, laughing over an old photograph.",
          },
        ],
      },
      {
        id: "2",
        name: "Travel Bags",
        category: "container",
        description:
          "A pair of canvas travel bags Nora hauls up the beach-house steps at the start of the season.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "EXT. BEACH HOUSE - MORNING",
            handledBy: "NORA",
            citation: "Nora carries her bags up the steps as gulls wheel overhead.",
          },
        ],
      },
      {
        id: "3",
        name: "Diner Jukebox",
        category: "other",
        description:
          "A chrome tabletop jukebox glowing in the diner booth as Theo shares his news.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "INT. DINER - EVENING",
            handledBy: "THEO",
            citation: "Neon hums above red vinyl booths.",
          },
        ],
      },
    ],
  },
  {
    id: "demo-5",
    name: "THE LONG WINTER",
    createdAt: new Date("2026-02-20"),
    updatedAt: new Date("2026-02-20"),
    isDemo: true,
    props: [
      {
        id: "1",
        name: "Walking Staff",
        category: "tool",
        description:
          "A long wooden staff Anders uses to test the ice as the party crosses the frozen lake.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "EXT. FROZEN LAKE - DAY",
            handledBy: "ANDERS",
            citation: "Anders tests each step with a long staff as the others wait at the shoreline.",
          },
        ],
      },
      {
        id: "2",
        name: "Pack Horses' Harness",
        category: "equipment",
        description:
          "Heavy leather harnesses on the convoy horses straining up the snowbound mountain pass.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "EXT. MOUNTAIN PASS - DAY",
            handledBy: "CONVOY",
            citation: "A convoy of horses struggles upward against a biting wind.",
          },
        ],
      },
      {
        id: "3",
        name: "Iron Lantern",
        category: "tool",
        description:
          "A black iron lantern hung by the lodge hearth, casting flickering light over the gathered travelers.",
        sceneAppearances: [
          {
            id: "a1",
            sceneHeading: "INT. LODGE - NIGHT",
            handledBy: "TRAVELERS",
            citation: "A fire roars in a stone hearth. Travelers huddle close.",
          },
        ],
      },
    ],
  },
]

export function PropListProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<PropProject[]>(() =>
    loadDemoData(DEMO_STORAGE_KEYS.propProjects, demoProjects)
  )
  const [currentProject, setCurrentProject] = useState<PropProject | null>(null)
  const [view, setView] = useState<ViewState>("projects")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Latest currentProject for the Firestore subscription callback (set up with
  // [user] deps), so manual adds/edits refresh the open list when signed in.
  const currentProjectRef = useRef<PropProject | null>(null)
  useEffect(() => {
    currentProjectRef.current = currentProject
  }, [currentProject])

  // Persist demo-mode data so it survives navigation/remounts when no backend is signed in.
  useEffect(() => {
    if (user) return
    saveDemoData(DEMO_STORAGE_KEYS.propProjects, projects)
  }, [projects, user])

  useEffect(() => {
    const unsubscribe = subscribeToAuthStateChanges((authUser) => {
      setUser(authUser)
      if (!authUser) {
        setProjects(loadDemoData(DEMO_STORAGE_KEYS.propProjects, demoProjects))
        setCurrentProject(null)
        setView("projects")
        setIsLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    setIsLoading(true)
    const unsubscribe = subscribeToPropProjects(
      user.uid,
      (firestoreProjects) => {
        setProjects(firestoreProjects)
        const current = currentProjectRef.current
        if (current) {
          const updated = firestoreProjects.find((p) => p.id === current.id)
          if (updated) setCurrentProject(updated)
        }
        setIsLoading(false)
      },
      (error) => {
        console.error("[v0] Error subscribing to prop projects:", error)
        setIsLoading(false)
      }
    )
    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const addProject = async (project: PropProject) => {
    if (user) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, isDemo, script, ...projectData } = project
        const newId = await addPropProject(user.uid, projectData)
        setCurrentProject({ ...project, id: newId, isDemo: false })
      } catch (error) {
        console.error("[v0] Error adding prop project:", error)
      }
    } else {
      setProjects((prev) => [...prev, project])
    }
  }

  const updateProject = async (project: PropProject) => {
    const existingProject = projects.find((p) => p.id === project.id)
    if (!existingProject) return

    if (user && !existingProject.isDemo) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, isDemo, script, ...projectData } = project
        await updatePropProjectInFirestore(user.uid, project.id, projectData)
      } catch (error) {
        console.error("[v0] Error updating prop project:", error)
      }
    } else {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)))
      if (currentProject?.id === project.id) setCurrentProject(project)
    }
  }

  const deleteProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    if (user && !project.isDemo) {
      try {
        await deletePropProjectFromFirestore(user.uid, projectId)
      } catch (error) {
        console.error("[v0] Error deleting prop project:", error)
      }
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
    }

    if (currentProject?.id === projectId) {
      setCurrentProject(null)
      setView("projects")
    }
  }

  const addProp = async (projectId: string, prop: Prop | Prop[]) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    const newProps = Array.isArray(prop) ? prop : [prop]
    const updatedProps = [...project.props, ...newProps]
    const updatedProject = { ...project, props: updatedProps, updatedAt: new Date() }

    if (user && !project.isDemo) {
      try {
        await updatePropProjectInFirestore(user.uid, projectId, { props: updatedProps })
      } catch (error) {
        console.error("[v0] Error adding prop:", error)
      }
    } else {
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)))
      if (currentProject?.id === projectId) setCurrentProject(updatedProject)
    }
  }

  const updateProp = async (projectId: string, prop: Prop) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    const updatedProps = project.props.map((p) => (p.id === prop.id ? prop : p))
    const updatedProject = { ...project, props: updatedProps, updatedAt: new Date() }

    if (user && !project.isDemo) {
      try {
        await updatePropProjectInFirestore(user.uid, projectId, { props: updatedProps })
      } catch (error) {
        console.error("[v0] Error updating prop:", error)
      }
    } else {
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)))
      if (currentProject?.id === projectId) setCurrentProject(updatedProject)
    }
  }

  const deleteProp = async (projectId: string, propId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    const updatedProps = project.props.filter((p) => p.id !== propId)
    const updatedProject = { ...project, props: updatedProps, updatedAt: new Date() }

    if (user && !project.isDemo) {
      try {
        await updatePropProjectInFirestore(user.uid, projectId, { props: updatedProps })
      } catch (error) {
        console.error("[v0] Error deleting prop:", error)
      }
    } else {
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)))
      if (currentProject?.id === projectId) setCurrentProject(updatedProject)
    }
  }

  return (
    <PropListContext.Provider
      value={{
        projects,
        currentProject,
        view,
        isLoading,
        setView,
        setCurrentProject,
        addProject,
        updateProject,
        deleteProject,
        addProp,
        updateProp,
        deleteProp,
      }}
    >
      {children}
    </PropListContext.Provider>
  )
}

export function usePropList() {
  const context = useContext(PropListContext)
  if (!context) {
    throw new Error("usePropList must be used within a PropListProvider")
  }
  return context
}
