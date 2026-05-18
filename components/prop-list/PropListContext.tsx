"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { User } from "firebase/auth"
import { Prop, PropProject } from "@/types/prop-list"
import { subscribeToAuthStateChanges } from "@/lib/auth"
import {
  subscribeToPropProjects,
  addPropProject,
  updatePropProject as updatePropProjectInFirestore,
  deletePropProject as deletePropProjectFromFirestore,
} from "@/lib/firestore"

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
  addProp: (projectId: string, prop: Prop) => void
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
]

export function PropListProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<PropProject[]>(demoProjects)
  const [currentProject, setCurrentProject] = useState<PropProject | null>(null)
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
    const unsubscribe = subscribeToPropProjects(
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
        const { id, isDemo, ...projectData } = project
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
        const { id, isDemo, ...projectData } = project
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

  const addProp = async (projectId: string, prop: Prop) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    const updatedProps = [...project.props, prop]
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
