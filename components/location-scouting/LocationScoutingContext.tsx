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

// Demo data
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

  const addProject = (project: LocationProject) => {
    setProjects((prev) => [...prev, project])
  }

  const updateProject = (project: LocationProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? project : p))
    )
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
              locations: p.locations.map((l) =>
                l.id === location.id ? location : l
              ),
              updatedAt: new Date(),
            }
          : p
      )
    )
    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        locations: currentProject.locations.map((l) =>
          l.id === location.id ? location : l
        ),
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
