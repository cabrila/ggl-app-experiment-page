"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { User } from "firebase/auth"
import { Actor, ActorListProject } from "@/types/actor-list"
import { subscribeToAuthStateChanges } from "@/lib/auth"
import {
  subscribeToActorProjects,
  addActorProject,
  updateActorProject as updateActorProjectInFirestore,
  deleteActorProject as deleteActorProjectFromFirestore,
} from "@/lib/firestore"

interface ActorListContextType {
  projects: ActorListProject[]
  currentProject: ActorListProject | null
  view: "list" | "upload" | "results"
  isLoading: boolean
  setView: (view: "list" | "upload" | "results") => void
  createProject: (name: string, actors: Actor[]) => void
  selectProject: (id: string) => void
  updateProject: (id: string, updates: Partial<ActorListProject>) => void
  deleteProject: (id: string) => void
  addActor: (actor: Actor) => void
  updateActor: (actor: Actor) => void
  deleteActor: (id: string) => void
  goBack: () => void
}

const ActorListContext = createContext<ActorListContextType | null>(null)

// Demo data - shown when user is not logged in
const demoActors: Actor[] = [
  {
    id: "1",
    name: "Jason Tyrone",
    age: 37,
    playingAge: "30-50",
    phone: "+1-555-0123",
    email: "jason.tyrone@email.com",
    headshotUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    notes: "Shoe size: 43, Nakedness preference: None, Red flags: I have never heard anything positive",
  },
  {
    id: "2",
    name: "Eliot Prime",
    age: 43,
    playingAge: "30-45",
    phone: "+1-555-0124",
    email: "eliot.prime@email.com",
    headshotUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    notes: "Shoe size: 41, Nakedness preference: Partial, Red flags: Hates Noah Twinly",
  },
  {
    id: "3",
    name: "Jens Huego",
    age: 50,
    playingAge: "40-60",
    phone: "+1-555-0125",
    email: "jens.huego@email.com",
    headshotUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    notes: "Shoe size: 45, Nakedness preference: Full, Red flags: None",
  },
  {
    id: "4",
    name: "Max Mellion",
    age: 49,
    playingAge: "35-55",
    phone: "+1-555-0126",
    email: "max.mellion@email.com",
    headshotUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    notes: "Experienced stage actor, comfortable with physical roles",
  },
  {
    id: "5",
    name: "John Hubert Adam",
    age: 33,
    playingAge: "30-45",
    phone: "+1-555-0127",
    email: "john.adam@email.com",
    headshotUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
    notes: "Great with comedic timing, available for travel",
  },
  {
    id: "6",
    name: "Mikkel Johnson",
    age: 58,
    playingAge: "45-60",
    phone: "+1-555-0128",
    email: "mikkel.j@email.com",
    headshotUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
    notes: "Distinguished look, perfect for authority figures",
  },
]

const demoProjects: ActorListProject[] = [
  {
    id: "demo-1",
    name: "Allan_Grant_Longlist",
    actors: demoActors,
    createdAt: new Date("2026-04-29"),
    updatedAt: new Date("2026-04-29"),
    isDemo: true,
  },
]

export function ActorListProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ActorListProject[]>(demoProjects)
  const [currentProject, setCurrentProject] = useState<ActorListProject | null>(null)
  const [view, setView] = useState<"list" | "upload" | "results">("list")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthStateChanges((authUser) => {
      setUser(authUser)
      if (!authUser) {
        // User logged out, show demo data
        setProjects(demoProjects)
        setCurrentProject(null)
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
    const unsubscribe = subscribeToActorProjects(
      user.uid,
      (firestoreProjects) => {
        setProjects(firestoreProjects)
        // Update currentProject if it exists in the new data
        if (currentProject) {
          const updated = firestoreProjects.find((p) => p.id === currentProject.id)
          if (updated) {
            setCurrentProject(updated)
          }
        }
        setIsLoading(false)
      },
      (error) => {
        console.error("[v0] Error subscribing to actor projects:", error)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const createProject = async (name: string, actors: Actor[]) => {
    const newProject: ActorListProject = {
      id: Date.now().toString(),
      name,
      actors,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDemo: false,
    }

    if (user) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, isDemo, ...projectData } = newProject
        const newId = await addActorProject(user.uid, projectData)
        // Firestore subscription will update the state
        setCurrentProject({ ...newProject, id: newId })
        setView("results")
      } catch (error) {
        console.error("[v0] Error creating actor project:", error)
      }
    } else {
      // Demo mode
      setProjects([...projects, newProject])
      setCurrentProject(newProject)
      setView("results")
    }
  }

  const selectProject = (id: string) => {
    const project = projects.find((p) => p.id === id)
    if (project) {
      setCurrentProject(project)
      setView("results")
    }
  }

  const updateProject = async (id: string, updates: Partial<ActorListProject>) => {
    const project = projects.find((p) => p.id === id)
    if (!project) return

    if (user && !project.isDemo) {
      try {
        await updateActorProjectInFirestore(user.uid, id, updates)
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error updating actor project:", error)
      }
    } else {
      // Demo mode
      setProjects(projects.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p)))
      if (currentProject?.id === id) {
        setCurrentProject({ ...currentProject, ...updates, updatedAt: new Date() })
      }
    }
  }

  const deleteProject = async (id: string) => {
    const project = projects.find((p) => p.id === id)
    if (!project) return

    if (user && !project.isDemo) {
      try {
        await deleteActorProjectFromFirestore(user.uid, id)
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error deleting actor project:", error)
      }
    } else {
      // Demo mode
      setProjects(projects.filter((p) => p.id !== id))
    }

    if (currentProject?.id === id) {
      setCurrentProject(null)
      setView("list")
    }
  }

  const addActor = async (actor: Actor) => {
    if (!currentProject) return

    const updatedActors = [...currentProject.actors, actor]
    const updatedProject = {
      ...currentProject,
      actors: updatedActors,
      updatedAt: new Date(),
    }

    if (user && !currentProject.isDemo) {
      try {
        await updateActorProjectInFirestore(user.uid, currentProject.id, {
          actors: updatedActors,
        })
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error adding actor:", error)
      }
    } else {
      // Demo mode
      setCurrentProject(updatedProject)
      setProjects(projects.map((p) => (p.id === currentProject.id ? updatedProject : p)))
    }
  }

  const updateActor = async (actor: Actor) => {
    if (!currentProject) return

    const updatedActors = currentProject.actors.map((a) => (a.id === actor.id ? actor : a))
    const updatedProject = {
      ...currentProject,
      actors: updatedActors,
      updatedAt: new Date(),
    }

    if (user && !currentProject.isDemo) {
      try {
        await updateActorProjectInFirestore(user.uid, currentProject.id, {
          actors: updatedActors,
        })
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error updating actor:", error)
      }
    } else {
      // Demo mode
      setCurrentProject(updatedProject)
      setProjects(projects.map((p) => (p.id === currentProject.id ? updatedProject : p)))
    }
  }

  const deleteActor = async (id: string) => {
    if (!currentProject) return

    const updatedActors = currentProject.actors.filter((a) => a.id !== id)
    const updatedProject = {
      ...currentProject,
      actors: updatedActors,
      updatedAt: new Date(),
    }

    if (user && !currentProject.isDemo) {
      try {
        await updateActorProjectInFirestore(user.uid, currentProject.id, {
          actors: updatedActors,
        })
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error deleting actor:", error)
      }
    } else {
      // Demo mode
      setCurrentProject(updatedProject)
      setProjects(projects.map((p) => (p.id === currentProject.id ? updatedProject : p)))
    }
  }

  const goBack = () => {
    if (view === "results") {
      setCurrentProject(null)
      setView("list")
    } else if (view === "upload") {
      setView("list")
    }
  }

  return (
    <ActorListContext.Provider
      value={{
        projects,
        currentProject,
        view,
        isLoading,
        setView,
        createProject,
        selectProject,
        updateProject,
        deleteProject,
        addActor,
        updateActor,
        deleteActor,
        goBack,
      }}
    >
      {children}
    </ActorListContext.Provider>
  )
}

export function useActorList() {
  const context = useContext(ActorListContext)
  if (!context) {
    throw new Error("useActorList must be used within an ActorListProvider")
  }
  return context
}
