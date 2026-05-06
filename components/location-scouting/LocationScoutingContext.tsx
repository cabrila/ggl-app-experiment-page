"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Location, LocationProject } from "@/types/location-scouting"

type ViewState = "projects" | "upload" | "results"

interface LocationScoutingContextType {
  projects: LocationProject[]
  currentProject: LocationProject | null
  view: ViewState
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

const demoProjects: LocationProject[] = [
  {
    id: "1",
    name: "JURASSIC PARK Script",
    createdAt: new Date("2026-04-29"),
    updatedAt: new Date("2026-04-29"),
    locations: [
      {
        id: "1",
        name: "JUNGLE - HOLDING PEN",
        type: "EXT",
        timeOfDay: "NIGHT",
        description: "A dense, dark jungle clearing on Isla Nublar featuring a massive, San Quentin-style holding pen with a guard tower and electrified fences.",
        scoutingNotes: "Requires a large clearing suitable for heavy machinery and a high-security industrial fence set.",
      },
      {
        id: "2",
        name: "MOUNTAIN - AMBER MINE",
        type: "EXT",
        timeOfDay: "DAY",
        description: "A rocky, manual mining operation on a hillside in the Dominican Republic. Workers use picks and shovels to scrape the rock.",
        scoutingNotes: "Requires a steep, rocky landscape and a nearby water source for the raft scene.",
      },
      {
        id: "3",
        name: "AMBER MINE - CAVE",
        type: "EXT",
        timeOfDay: "DAY",
        description: "A dark, dripping cave within the amber mine where sunlight streams through the mouth.",
        scoutingNotes: "A natural cave or limestone mine with a wide enough opening for sunlight to provide strong backlighting.",
      },
      {
        id: "4",
        name: "THE DIG - MONTANA BADLANDS",
        type: "EXT",
        timeOfDay: "DAY",
        description: "A vast, arid expanse of crumbling limestone with checkered excavation pits.",
        scoutingNotes: "Requires a remote, desert-like terrain with existing or buildable excavation areas.",
      },
      {
        id: "5",
        name: "DIG OFFICE - TRAILER",
        type: "INT",
        timeOfDay: "DAY",
        description: "A dusty mobile home converted into a laboratory and office.",
        scoutingNotes: "A practical trailer or mobile unit that can be dressed as a working paleontology lab.",
      },
    ],
  },
]

export function LocationScoutingProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<LocationProject[]>(demoProjects)
  const [currentProject, setCurrentProject] = useState<LocationProject | null>(null)
  const [view, setView] = useState<ViewState>("projects")

  const addProject = (project: LocationProject) => {
    setProjects((prev) => [...prev, project])
  }

  const updateProject = (project: LocationProject) => {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)))
    if (currentProject?.id === project.id) {
      setCurrentProject(project)
    }
  }

  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
    if (currentProject?.id === projectId) {
      setCurrentProject(null)
      setView("projects")
    }
  }

  const addLocation = (projectId: string, location: Location) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, locations: [...p.locations, location], updatedAt: new Date() }
          : p
      )
    )
    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        locations: [...currentProject.locations, location],
        updatedAt: new Date(),
      })
    }
  }

  const updateLocation = (projectId: string, location: Location) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              locations: p.locations.map((l) => (l.id === location.id ? location : l)),
              updatedAt: new Date(),
            }
          : p
      )
    )
    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        locations: currentProject.locations.map((l) => (l.id === location.id ? location : l)),
        updatedAt: new Date(),
      })
    }
  }

  const deleteLocation = (projectId: string, locationId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              locations: p.locations.filter((l) => l.id !== locationId),
              updatedAt: new Date(),
            }
          : p
      )
    )
    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        locations: currentProject.locations.filter((l) => l.id !== locationId),
        updatedAt: new Date(),
      })
    }
  }

  return (
    <LocationScoutingContext.Provider
      value={{
        projects,
        currentProject,
        view,
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
