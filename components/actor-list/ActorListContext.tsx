"use client"

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react"
import { User } from "firebase/auth"
import { Actor, ActorListProject, AggregatedActor } from "@/types/actor-list"
import { subscribeToAuthStateChanges } from "@/lib/auth"
import {
  subscribeToActorProjects,
  addActorProject,
  updateActorProject as updateActorProjectInFirestore,
  deleteActorProject as deleteActorProjectFromFirestore,
  subscribeToStandaloneActors,
  saveStandaloneActor,
  deleteStandaloneActor,
} from "@/lib/firestore"

type ActorListView = "list" | "upload" | "results" | "all-actors"

interface ActorListContextType {
  projects: ActorListProject[]
  currentProject: ActorListProject | null
  view: ActorListView
  isLoading: boolean
  setView: (view: ActorListView) => void
  createProject: (name: string, actors: Actor[]) => void
  selectProject: (id: string) => void
  updateProject: (id: string, updates: Partial<ActorListProject>) => void
  deleteProject: (id: string) => void
  addActor: (actor: Actor) => void
  updateActor: (actor: Actor) => void
  deleteActor: (id: string) => void
  goBack: () => void
  // Aggregated "All Actors" view
  allActors: AggregatedActor[]
  addActorToList: (actorId: string, projectId: string) => void
  addNewActorToProject: (actor: Actor, projectId: string) => void
  updateActorGlobally: (actor: Actor) => void
  deleteActorGlobally: (actorId: string) => void
  dismissDuplicate: (actorName: string) => void
  dismissedDuplicates: Set<string>
  // Standalone actors (not attached to any list)
  standaloneActors: Actor[]
  addStandaloneActor: (actor: Actor) => void
}

const ActorListContext = createContext<ActorListContextType | null>(null)

// Demo data - shown when user is not logged in
const demoActors: Actor[] = [
  {
    id: "1",
    name: "Jason Tyrone",
    age: 37,
    gender: "Male",
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
    gender: "Male",
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
    gender: "Male",
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
    gender: "Male",
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
    gender: "Male",
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
    gender: "Male",
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
  const [view, setView] = useState<ActorListView>("list")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [standaloneActors, setStandaloneActors] = useState<Actor[]>([])
  const [dismissedDuplicates, setDismissedDuplicates] = useState<Set<string>>(new Set())

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthStateChanges((authUser) => {
      setUser(authUser)
      if (!authUser) {
        // User logged out, show demo data
        setProjects(demoProjects)
        setStandaloneActors([])
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

  // Subscribe to standalone actors (actors not attached to any list)
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToStandaloneActors(
      user.uid,
      (actors) => setStandaloneActors(actors),
      (error) => console.error("[v0] Error subscribing to standalone actors:", error)
    )

    return () => unsubscribe()
  }, [user])

  // Aggregate every actor across all lists + standalone, with duplicate detection.
  const allActors = useMemo<AggregatedActor[]>(() => {
    const actorMap = new Map<string, AggregatedActor>()
    const nameCounts = new Map<string, number>()

    const countName = (name: string) => {
      const n = name.toLowerCase().trim()
      nameCounts.set(n, (nameCounts.get(n) || 0) + 1)
    }
    projects.forEach((p) => p.actors.forEach((a) => countName(a.name)))
    standaloneActors.forEach((a) => countName(a.name))

    projects.forEach((project) => {
      project.actors.forEach((actor) => {
        const key = `${actor.name.toLowerCase().trim()}-${actor.email.toLowerCase().trim()}`
        const normalizedName = actor.name.toLowerCase().trim()
        const isDuplicate = (nameCounts.get(normalizedName) || 0) > 1

        const existing = actorMap.get(key)
        if (existing) {
          if (!existing.sourceListIds.includes(project.id)) {
            existing.sourceListIds.push(project.id)
            existing.sourceListNames.push(project.name)
          }
        } else {
          actorMap.set(key, {
            ...actor,
            sourceListIds: [project.id],
            sourceListNames: [project.name],
            isDuplicate: isDuplicate && !dismissedDuplicates.has(normalizedName),
            duplicateDismissed: dismissedDuplicates.has(normalizedName),
          })
        }
      })
    })

    standaloneActors.forEach((actor) => {
      const key = `${actor.name.toLowerCase().trim()}-${actor.email.toLowerCase().trim()}`
      const normalizedName = actor.name.toLowerCase().trim()
      const isDuplicate = (nameCounts.get(normalizedName) || 0) > 1
      if (!actorMap.has(key)) {
        actorMap.set(key, {
          ...actor,
          sourceListIds: [],
          sourceListNames: [],
          isDuplicate: isDuplicate && !dismissedDuplicates.has(normalizedName),
          duplicateDismissed: dismissedDuplicates.has(normalizedName),
        })
      }
    })

    return Array.from(actorMap.values())
  }, [projects, standaloneActors, dismissedDuplicates])

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
    if (view === "results" || view === "all-actors") {
      setCurrentProject(null)
      setView("list")
    } else if (view === "upload") {
      setView("list")
    }
  }

  // --- Aggregated "All Actors" operations -------------------------------

  // Strip the aggregation-only fields back to a plain Actor before persisting.
  const toPlainActor = (actor: Actor): Actor => ({
    id: actor.id,
    name: actor.name,
    age: actor.age,
    gender: actor.gender,
    playingAge: actor.playingAge,
    phone: actor.phone,
    email: actor.email,
    headshotUrl: actor.headshotUrl,
    notes: actor.notes,
    mediaMaterial: actor.mediaMaterial,
    customFields: actor.customFields,
  })

  // Persist a project's new actor array (Firestore when signed in, else local).
  const persistProjectActors = async (project: ActorListProject, actors: Actor[]) => {
    if (user && !project.isDemo) {
      await updateActorProjectInFirestore(user.uid, project.id, { actors })
      // Firestore subscription refreshes state.
    } else {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, actors, updatedAt: new Date() } : p))
      )
      if (currentProject?.id === project.id) {
        setCurrentProject({ ...project, actors, updatedAt: new Date() })
      }
    }
  }

  const addActorToList = async (actorId: string, projectId: string) => {
    const actor = allActors.find((a) => a.id === actorId)
    const project = projects.find((p) => p.id === projectId)
    if (!actor || !project) return
    if (project.actors.some((a) => a.id === actorId)) return
    try {
      await persistProjectActors(project, [...project.actors, toPlainActor(actor)])
    } catch (error) {
      console.error("[v0] Error adding actor to list:", error)
    }
  }

  const addNewActorToProject = async (actor: Actor, projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    try {
      await persistProjectActors(project, [...project.actors, actor])
    } catch (error) {
      console.error("[v0] Error adding new actor to project:", error)
    }
  }

  const updateActorGlobally = async (updatedActor: Actor) => {
    const affected = projects.filter((p) => p.actors.some((a) => a.id === updatedActor.id))
    try {
      await Promise.all(
        affected.map((project) =>
          persistProjectActors(
            project,
            project.actors.map((a) => (a.id === updatedActor.id ? updatedActor : a))
          )
        )
      )
      // Standalone copy, if any.
      if (standaloneActors.some((a) => a.id === updatedActor.id)) {
        if (user) await saveStandaloneActor(user.uid, toPlainActor(updatedActor))
        else setStandaloneActors((prev) => prev.map((a) => (a.id === updatedActor.id ? updatedActor : a)))
      }
    } catch (error) {
      console.error("[v0] Error updating actor globally:", error)
    }
  }

  const deleteActorGlobally = async (actorId: string) => {
    const affected = projects.filter((p) => p.actors.some((a) => a.id === actorId))
    try {
      await Promise.all(
        affected.map((project) =>
          persistProjectActors(
            project,
            project.actors.filter((a) => a.id !== actorId)
          )
        )
      )
      if (standaloneActors.some((a) => a.id === actorId)) {
        if (user) await deleteStandaloneActor(user.uid, actorId)
        else setStandaloneActors((prev) => prev.filter((a) => a.id !== actorId))
      }
    } catch (error) {
      console.error("[v0] Error deleting actor globally:", error)
    }
  }

  const addStandaloneActor = async (actor: Actor) => {
    if (user) {
      try {
        await saveStandaloneActor(user.uid, toPlainActor(actor))
      } catch (error) {
        console.error("[v0] Error adding standalone actor:", error)
      }
    } else {
      setStandaloneActors((prev) => [...prev, actor])
    }
  }

  const dismissDuplicate = (actorName: string) => {
    const normalizedName = actorName.toLowerCase().trim()
    setDismissedDuplicates((prev) => new Set([...prev, normalizedName]))
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
        allActors,
        addActorToList,
        addNewActorToProject,
        updateActorGlobally,
        deleteActorGlobally,
        dismissDuplicate,
        dismissedDuplicates,
        standaloneActors,
        addStandaloneActor,
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

// Safe variant for cross-feature consumers (e.g. Public Casting) that may
// render outside an ActorListProvider — returns null instead of throwing.
export function useActorListSafe() {
  return useContext(ActorListContext)
}
