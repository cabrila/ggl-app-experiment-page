"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { User } from "firebase/auth"
import { Scene, SceneProject } from "@/types/scene-list"
import { subscribeToAuthStateChanges } from "@/lib/auth"
import {
  subscribeToSceneProjects,
  addSceneProject,
  updateSceneProject as updateSceneProjectInFirestore,
  deleteSceneProject as deleteSceneProjectFromFirestore,
} from "@/lib/firestore"

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
  addScene: (projectId: string, scene: Scene) => void
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
]

export function SceneListProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<SceneProject[]>(demoProjects)
  const [currentProject, setCurrentProject] = useState<SceneProject | null>(null)
  const [view, setView] = useState<ViewState>("projects")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuthStateChanges((authUser) => {
      setUser(authUser)
      if (!authUser) {
        setProjects(demoProjects)
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
        if (currentProject) {
          const updated = firestoreProjects.find((p) => p.id === currentProject.id)
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
        const { id, isDemo, ...projectData } = project
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
        const { id, isDemo, ...projectData } = project
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

  const addScene = async (projectId: string, scene: Scene) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    const updatedScenes = [...project.scenes, scene]
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
