"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { User } from "firebase/auth"
import { Scene, SceneProject } from "@/types/scene-list"
import { subscribeToAuthStateChanges } from "@/lib/auth"
import {
  subscribeToSceneProjects,
  addSceneProject,
  updateSceneProject as updateSceneProjectInFirestore,
  deleteSceneProject as deleteSceneProjectFromFirestore,
} from "@/lib/firestore"
import { loadDemoData, saveDemoData, DEMO_STORAGE_KEYS } from "@/utils/demoPersistence"
import { ensureDemoScript } from "@/lib/scriptFile"

type ViewState = "projects" | "upload" | "results"

interface SceneListContextType {
  projects: SceneProject[]
  currentProject: SceneProject | null
  view: ViewState
  isLoading: boolean
  setView: (view: ViewState) => void
  setCurrentProject: (project: SceneProject | null) => void
  addProject: (project: SceneProject) => void
  updateProject: (project: SceneProject) => void
  deleteProject: (projectId: string) => void
  addScene: (projectId: string, scene: Scene | Scene[]) => void
  updateScene: (projectId: string, scene: Scene) => void
  deleteScene: (projectId: string, sceneId: string) => void
}

const SceneListContext = createContext<SceneListContextType | null>(null)

const demoProjects: SceneProject[] = [
  {
    id: "demo-1",
    name: "NO COUNTRY FOR OLD MEN",
    createdAt: new Date("2026-04-29"),
    updatedAt: new Date("2026-04-29"),
    isDemo: true,
    scenes: [
      {
        id: "1",
        sceneNumber: 1,
        sceneHeading: "INT. SHERIFF LAMAR'S OFFICE - DAY",
        location: "SHERIFF LAMAR'S OFFICE",
        timeOfDay: "DAY",
        rawText:
          "Sheriff Lamar leans back in his chair behind a battered oak desk. The Deputy stands in the doorway, hat in hand.",
      },
      {
        id: "2",
        sceneNumber: 2,
        sceneHeading: "EXT. ROAD - LATE DAY",
        location: "ROAD",
        timeOfDay: "LATE DAY",
        rawText:
          "Chigurh, his hands cuffed behind his back, gets out of the prowler. He slings the tank over his shoulder and walks calmly down the empty highway.",
      },
      {
        id: "3",
        sceneNumber: 3,
        sceneHeading: "EXT. ARID PLAIN - DAY",
        location: "ARID PLAIN",
        timeOfDay: "DAY",
        rawText:
          "Llewelyn Moss surveys the wide, dusty plain through binoculars. A heavy-barreled rifle is slung across his back.",
      },
      {
        id: "4",
        sceneNumber: 4,
        sceneHeading: "EXT. ROCK SHELF - MINUTES LATER",
        location: "ROCK SHELF",
        timeOfDay: "DAY",
        rawText:
          "Bodies, trucks, and spent shells litter a shelf of rock. Next to the body is a boxy leather document case.",
      },
      {
        id: "5",
        sceneNumber: 5,
        sceneHeading: "INT. HOTEL ROOM - NIGHT",
        location: "HOTEL ROOM",
        timeOfDay: "NIGHT",
        rawText:
          "Moss swings the document case onto the bed and unclasps it and upends the money onto the bed. Bank-wrapped hundreds spill out.",
      },
      {
        id: "6",
        sceneNumber: 6,
        sceneHeading: "EXT. DESERT - NIGHT",
        location: "DESERT",
        timeOfDay: "NIGHT",
        rawText:
          "Moss crosses the empty desert under a starlit sky, the wind whipping at his jacket. A dog barks in the distance.",
      },
    ],
  },
  {
    id: "demo-2",
    name: "THE HARBOR LIGHT",
    createdAt: new Date("2026-04-18"),
    updatedAt: new Date("2026-04-18"),
    isDemo: true,
    scenes: [
      {
        id: "1",
        sceneNumber: 1,
        sceneHeading: "EXT. LIGHTHOUSE - DAWN",
        location: "LIGHTHOUSE",
        timeOfDay: "DAWN",
        rawText:
          "Waves crash against the rocks below an aging lighthouse. Maren climbs the spiral stairs, a lantern swinging in her grip.",
      },
      {
        id: "2",
        sceneNumber: 2,
        sceneHeading: "INT. KEEPER'S COTTAGE - MORNING",
        location: "KEEPER'S COTTAGE",
        timeOfDay: "MORNING",
        rawText:
          "A cramped room lined with charts and brass instruments. Maren brews coffee while a radio crackles a storm warning.",
      },
      {
        id: "3",
        sceneNumber: 3,
        sceneHeading: "EXT. DOCKS - DAY",
        location: "DOCKS",
        timeOfDay: "DAY",
        rawText:
          "Fishermen haul nets under a gray sky. A stranger in a long coat watches the lighthouse from the end of the pier.",
      },
      {
        id: "4",
        sceneNumber: 4,
        sceneHeading: "INT. LANTERN ROOM - NIGHT",
        location: "LANTERN ROOM",
        timeOfDay: "NIGHT",
        rawText:
          "The great lamp rotates slowly. Maren spots a ship listing dangerously close to the reef and lunges for the foghorn.",
      },
      {
        id: "5",
        sceneNumber: 5,
        sceneHeading: "EXT. REEF - NIGHT",
        location: "REEF",
        timeOfDay: "NIGHT",
        rawText:
          "Rain lashes the foundering vessel. Maren rows a small dinghy through the swells toward the wreck.",
      },
    ],
  },
  {
    id: "demo-3",
    name: "CITY OF ASH",
    createdAt: new Date("2026-03-30"),
    updatedAt: new Date("2026-03-30"),
    isDemo: true,
    scenes: [
      {
        id: "1",
        sceneNumber: 1,
        sceneHeading: "EXT. RUINED SKYLINE - DUSK",
        location: "RUINED SKYLINE",
        timeOfDay: "DUSK",
        rawText:
          "Smoke drifts over the skeletal remains of a metropolis. A lone figure picks through rubble, scavenging for supplies.",
      },
      {
        id: "2",
        sceneNumber: 2,
        sceneHeading: "INT. SUBWAY TUNNEL - CONTINUOUS",
        location: "SUBWAY TUNNEL",
        timeOfDay: "NIGHT",
        rawText:
          "Flashlight beams cut through the dark. A small band of survivors moves quietly past a derailed train car.",
      },
      {
        id: "3",
        sceneNumber: 3,
        sceneHeading: "INT. SHELTER - NIGHT",
        location: "SHELTER",
        timeOfDay: "NIGHT",
        rawText:
          "Candles flicker around a makeshift camp. Elena divides the last of the rations while the others sleep.",
      },
      {
        id: "4",
        sceneNumber: 4,
        sceneHeading: "EXT. CHECKPOINT - DAY",
        location: "CHECKPOINT",
        timeOfDay: "DAY",
        rawText:
          "Armed sentries guard a barricaded street. Elena negotiates passage, her hands raised and steady.",
      },
    ],
  },
  {
    id: "demo-4",
    name: "TIDES OF SUMMER",
    createdAt: new Date("2026-03-12"),
    updatedAt: new Date("2026-03-12"),
    isDemo: true,
    scenes: [
      {
        id: "1",
        sceneNumber: 1,
        sceneHeading: "EXT. BEACH HOUSE - MORNING",
        location: "BEACH HOUSE",
        timeOfDay: "MORNING",
        rawText:
          "Sunlight spills across a weathered porch. Nora carries her bags up the steps as gulls wheel overhead.",
      },
      {
        id: "2",
        sceneNumber: 2,
        sceneHeading: "EXT. BOARDWALK - DAY",
        location: "BOARDWALK",
        timeOfDay: "DAY",
        rawText:
          "Crowds drift past arcades and ice cream stands. Nora and Theo share a bench, laughing over an old photograph.",
      },
      {
        id: "3",
        sceneNumber: 3,
        sceneHeading: "INT. DINER - EVENING",
        location: "DINER",
        timeOfDay: "EVENING",
        rawText:
          "Neon hums above red vinyl booths. Theo confesses he is leaving at the end of the season.",
      },
      {
        id: "4",
        sceneNumber: 4,
        sceneHeading: "EXT. PIER - NIGHT",
        location: "PIER",
        timeOfDay: "NIGHT",
        rawText:
          "Fireworks bloom over the water. Nora watches alone, then turns as footsteps approach behind her.",
      },
    ],
  },
  {
    id: "demo-5",
    name: "THE LONG WINTER",
    createdAt: new Date("2026-02-20"),
    updatedAt: new Date("2026-02-20"),
    isDemo: true,
    scenes: [
      {
        id: "1",
        sceneNumber: 1,
        sceneHeading: "EXT. MOUNTAIN PASS - DAY",
        location: "MOUNTAIN PASS",
        timeOfDay: "DAY",
        rawText:
          "Snow blankets a treacherous ridge. A convoy of horses struggles upward against a biting wind.",
      },
      {
        id: "2",
        sceneNumber: 2,
        sceneHeading: "INT. LODGE - NIGHT",
        location: "LODGE",
        timeOfDay: "NIGHT",
        rawText:
          "A fire roars in a stone hearth. Travelers huddle close, trading stories while the storm howls outside.",
      },
      {
        id: "3",
        sceneNumber: 3,
        sceneHeading: "EXT. FROZEN LAKE - DAY",
        location: "FROZEN LAKE",
        timeOfDay: "DAY",
        rawText:
          "Ice groans underfoot. Anders tests each step with a long staff as the others wait at the shoreline.",
      },
    ],
  },
]

export function SceneListProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<SceneProject[]>(() =>
    ensureDemoScript(loadDemoData(DEMO_STORAGE_KEYS.sceneProjects, demoProjects))
  )
  const [currentProject, setCurrentProject] = useState<SceneProject | null>(null)
  const [view, setView] = useState<ViewState>("projects")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Latest currentProject for the Firestore subscription callback (set up with
  // [user] deps), so manual adds/edits refresh the open list when signed in.
  const currentProjectRef = useRef<SceneProject | null>(null)
  useEffect(() => {
    currentProjectRef.current = currentProject
  }, [currentProject])

  // Persist demo-mode data so it survives navigation/remounts when no backend is signed in.
  useEffect(() => {
    if (user) return
    saveDemoData(DEMO_STORAGE_KEYS.sceneProjects, projects)
  }, [projects, user])

  useEffect(() => {
    const unsubscribe = subscribeToAuthStateChanges((authUser) => {
      setUser(authUser)
      if (!authUser) {
        setProjects(ensureDemoScript(loadDemoData(DEMO_STORAGE_KEYS.sceneProjects, demoProjects)))
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
    const unsubscribe = subscribeToSceneProjects(
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
        console.error("[v0] Error subscribing to scene projects:", error)
        setIsLoading(false)
      }
    )
    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const addProject = async (project: SceneProject) => {
    if (user) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, isDemo, script, ...projectData } = project
        const newId = await addSceneProject(user.uid, projectData)
        setCurrentProject({ ...project, id: newId, isDemo: false })
      } catch (error) {
        console.error("[v0] Error adding scene project:", error)
      }
    } else {
      setProjects((prev) => [...prev, project])
    }
  }

  const updateProject = async (project: SceneProject) => {
    const existing = projects.find((p) => p.id === project.id)
    if (!existing) return

    if (user && !existing.isDemo) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, isDemo, script, ...projectData } = project
        await updateSceneProjectInFirestore(user.uid, project.id, projectData)
      } catch (error) {
        console.error("[v0] Error updating scene project:", error)
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
        await deleteSceneProjectFromFirestore(user.uid, projectId)
      } catch (error) {
        console.error("[v0] Error deleting scene project:", error)
      }
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
    }

    if (currentProject?.id === projectId) {
      setCurrentProject(null)
      setView("projects")
    }
  }

  const addScene = async (projectId: string, scene: Scene | Scene[]) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    const newScenes = Array.isArray(scene) ? scene : [scene]
    const updatedScenes = [...project.scenes, ...newScenes]
    const updatedProject = { ...project, scenes: updatedScenes, updatedAt: new Date() }

    if (user && !project.isDemo) {
      try {
        await updateSceneProjectInFirestore(user.uid, projectId, { scenes: updatedScenes })
      } catch (error) {
        console.error("[v0] Error adding scene:", error)
      }
    } else {
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)))
      if (currentProject?.id === projectId) setCurrentProject(updatedProject)
    }
  }

  const updateScene = async (projectId: string, scene: Scene) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    const updatedScenes = project.scenes.map((s) => (s.id === scene.id ? scene : s))
    const updatedProject = { ...project, scenes: updatedScenes, updatedAt: new Date() }

    if (user && !project.isDemo) {
      try {
        await updateSceneProjectInFirestore(user.uid, projectId, { scenes: updatedScenes })
      } catch (error) {
        console.error("[v0] Error updating scene:", error)
      }
    } else {
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)))
      if (currentProject?.id === projectId) setCurrentProject(updatedProject)
    }
  }

  const deleteScene = async (projectId: string, sceneId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    const updatedScenes = project.scenes.filter((s) => s.id !== sceneId)
    const updatedProject = { ...project, scenes: updatedScenes, updatedAt: new Date() }

    if (user && !project.isDemo) {
      try {
        await updateSceneProjectInFirestore(user.uid, projectId, { scenes: updatedScenes })
      } catch (error) {
        console.error("[v0] Error deleting scene:", error)
      }
    } else {
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)))
      if (currentProject?.id === projectId) setCurrentProject(updatedProject)
    }
  }

  return (
    <SceneListContext.Provider
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
        addScene,
        updateScene,
        deleteScene,
      }}
    >
      {children}
    </SceneListContext.Provider>
  )
}

export function useSceneList() {
  const context = useContext(SceneListContext)
  if (!context) throw new Error("useSceneList must be used within a SceneListProvider")
  return context
}
