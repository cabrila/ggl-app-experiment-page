"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { User } from "firebase/auth"
import { Location, LocationProject } from "@/types/location-scouting"
import { subscribeToAuthStateChanges } from "@/lib/auth"
import {
  subscribeToLocationProjects,
  addLocationProject,
  updateLocationProject as updateLocationProjectInFirestore,
  deleteLocationProject as deleteLocationProjectFromFirestore,
} from "@/lib/firestore"

type ViewState = "projects" | "upload" | "results"

interface LocationScoutingContextType {
  projects: LocationProject[]
  currentProject: LocationProject | null
  view: ViewState
  isLoading: boolean
  setView: (view: ViewState) => void
  setCurrentProject: (project: LocationProject | null) => void
  addProject: (project: LocationProject) => void
  updateProject: (project: LocationProject) => void
  deleteProject: (projectId: string) => void
  addLocation: (projectId: string, location: Location) => void
  updateLocation: (projectId: string, location: Location) => void
  deleteLocation: (projectId: string, locationId: string) => void
}

const LocationScoutingContext = createContext<LocationScoutingContextType | null>(null)

// Demo data - shown when user is not logged in
const demoProjects: LocationProject[] = [
  {
    id: "demo-1",
    name: "JURASSIC PARK Script",
    createdAt: new Date("2026-04-29"),
    updatedAt: new Date("2026-04-29"),
    isDemo: true,
    locations: [
      {
        id: "1",
        name: "JUNGLE - HOLDING PEN",
        type: "EXT",
        timeOfDay: "NIGHT",
        description: "A dense, dark jungle clearing on Isla Nublar featuring a massive, San Quentin-style holding pen with a guard tower and electrified fences. A large crate is shoved into a slot in the pen using a bulldozer while riflemen and workers stand by.",
        scoutingNotes: "Requires a large clearing suitable for heavy machinery and a high-security industrial fence set. Must accommodate a large crate and searchlights.",
      },
      {
        id: "2",
        name: "MOUNTAIN - AMBER MINE",
        type: "EXT",
        timeOfDay: "DAY",
        description: "A rocky, manual mining operation on a hillside in the Dominican Republic. Workers use picks and shovels to scrape the rock, and visitors arrive via a raft pulled across a river.",
        scoutingNotes: "Requires a steep, rocky landscape and a nearby water source for the raft scene. Look for active or historical manual excavation sites.",
      },
      {
        id: "3",
        name: "AMBER MINE - CAVE",
        type: "EXT",
        timeOfDay: "DAY",
        description: "A dark, dripping cave within the amber mine where sunlight streams through the mouth. The interior is cramped and filled with workers examining finds.",
        scoutingNotes: "A natural cave or limestone mine with a wide enough opening for sunlight to provide strong backlighting for translucent objects.",
      },
      {
        id: "4",
        name: "THE DIG - MONTANA BADLANDS",
        type: "EXT",
        timeOfDay: "DAY",
        description: "A vast, arid expanse of crumbling limestone with checkered excavation pits. The site includes a base camp with teepees, a mess tent, and various dig equipment.",
        scoutingNotes: "Requires a remote, desert-like terrain with existing or buildable excavation areas. Access for crew and equipment trucks essential.",
      },
      {
        id: "5",
        name: "DIG OFFICE - TRAILER",
        type: "INT",
        timeOfDay: "DAY",
        description: "A dusty mobile home converted into a laboratory and office. Every surface is covered with bone specimens, ceramic dishes, and labeling tags.",
        scoutingNotes: "A practical trailer or mobile unit that can be dressed as a working paleontology lab with adequate power for computers and lighting.",
      },
      {
        id: "6",
        name: "SAN JOSE - CAFE",
        type: "EXT",
        timeOfDay: "DAY",
        description: "A public outdoor cafe in Costa Rica where patrons sit at small tables. The atmosphere is tropical and casual.",
        scoutingNotes: "An outdoor cafe with tropical vegetation, preferably with ocean or jungle views. Need space for extras and equipment.",
      },
    ],
  },
]

export function LocationScoutingProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<LocationProject[]>(demoProjects)
  const [currentProject, setCurrentProject] = useState<LocationProject | null>(null)
  const [view, setView] = useState<ViewState>("projects")
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
        setView("projects")
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Subscribe to Firestore when user is authenticated
  useEffect(() => {
    if (!user) return

    setIsLoading(true)
    const unsubscribe = subscribeToLocationProjects(
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
        console.error("[v0] Error subscribing to location projects:", error)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const addProject = async (project: LocationProject) => {
    if (user) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, isDemo, ...projectData } = project
        const newId = await addLocationProject(user.uid, projectData)
        // Firestore subscription will update the state
        setCurrentProject({ ...project, id: newId, isDemo: false })
      } catch (error) {
        console.error("[v0] Error adding location project:", error)
      }
    } else {
      // Demo mode
      setProjects((prev) => [...prev, project])
    }
  }

  const updateProject = async (project: LocationProject) => {
    const existingProject = projects.find((p) => p.id === project.id)
    if (!existingProject) return

    if (user && !existingProject.isDemo) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, isDemo, ...projectData } = project
        await updateLocationProjectInFirestore(user.uid, project.id, projectData)
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error updating location project:", error)
      }
    } else {
      // Demo mode
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)))
      if (currentProject?.id === project.id) {
        setCurrentProject(project)
      }
    }
  }

  const deleteProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    if (user && !project.isDemo) {
      try {
        await deleteLocationProjectFromFirestore(user.uid, projectId)
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error deleting location project:", error)
      }
    } else {
      // Demo mode
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
    }

    if (currentProject?.id === projectId) {
      setCurrentProject(null)
      setView("projects")
    }
  }

  const addLocation = async (projectId: string, location: Location) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const updatedLocations = [...project.locations, location]
    const updatedProject = { ...project, locations: updatedLocations, updatedAt: new Date() }

    if (user && !project.isDemo) {
      try {
        await updateLocationProjectInFirestore(user.uid, projectId, {
          locations: updatedLocations,
        })
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error adding location:", error)
      }
    } else {
      // Demo mode
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)))
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
    }
  }

  const updateLocation = async (projectId: string, location: Location) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const updatedLocations = project.locations.map((l) =>
      l.id === location.id ? location : l
    )
    const updatedProject = { ...project, locations: updatedLocations, updatedAt: new Date() }

    if (user && !project.isDemo) {
      try {
        await updateLocationProjectInFirestore(user.uid, projectId, {
          locations: updatedLocations,
        })
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error updating location:", error)
      }
    } else {
      // Demo mode
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)))
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
    }
  }

  const deleteLocation = async (projectId: string, locationId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const updatedLocations = project.locations.filter((l) => l.id !== locationId)
    const updatedProject = { ...project, locations: updatedLocations, updatedAt: new Date() }

    if (user && !project.isDemo) {
      try {
        await updateLocationProjectInFirestore(user.uid, projectId, {
          locations: updatedLocations,
        })
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error deleting location:", error)
      }
    } else {
      // Demo mode
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)))
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
    }
  }

  return (
    <LocationScoutingContext.Provider
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
        addLocation,
        updateLocation,
        deleteLocation,
      }}
    >
      {children}
    </LocationScoutingContext.Provider>
  )
}

export function useLocationScouting() {
  const context = useContext(LocationScoutingContext)
  if (!context) {
    throw new Error("useLocationScouting must be used within a LocationScoutingProvider")
  }
  return context
}
