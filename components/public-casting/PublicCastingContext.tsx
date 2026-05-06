"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from "react"
import { CastingCall, CastingCallField, CastingSubmission, PublicCastingProject } from "@/types/public-casting"

interface PublicCastingState {
  projects: PublicCastingProject[]
  currentProject: PublicCastingProject | null
  currentCastingCall: CastingCall | null
  newSubmissionsCount: number
}

interface PublicCastingContextType {
  state: PublicCastingState
  createProject: (name: string) => PublicCastingProject
  selectProject: (id: string) => void
  updateProject: (id: string, updates: Partial<PublicCastingProject>) => void
  deleteProject: (id: string) => void
  createCastingCall: (projectId: string, title: string, description: string, projectName: string, fields: CastingCallField[]) => CastingCall
  updateCastingCall: (projectId: string, castingCallId: string, updates: Partial<CastingCall>) => void
  deleteCastingCall: (projectId: string, castingCallId: string) => void
  selectCastingCall: (id: string) => void
  addSubmission: (castingCallId: string, data: Record<string, string>) => void
  updateSubmission: (submissionId: string, updates: Partial<CastingSubmission>) => void
  deleteSubmission: (submissionId: string) => void
  markSubmissionsAsRead: (projectId: string) => void
  getSubmissionsForProject: (projectId: string) => CastingSubmission[]
  getTotalSubmissions: () => number
  getNewSubmissionsCount: () => number
}

const PublicCastingContext = createContext<PublicCastingContextType | null>(null)

// Demo data
const createDemoData = (): PublicCastingProject[] => {
  const demoSubmissions: CastingSubmission[] = [
    {
      id: "sub-1",
      castingCallId: "cc-1",
      castingCallTitle: "Lead Role - Sarah",
      data: {
        name: "Emma Thompson",
        email: "emma@email.com",
        phone: "+1-555-0101",
        age: "28",
        playingAge: "25-32",
        headshot: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
        notes: "Experienced in drama and action. Available immediately.",
      },
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isNew: true,
      name: "Emma Thompson",
      email: "emma@email.com",
      phone: "+1-555-0101",
      age: "28",
      playingAge: "25-32",
      headshot: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      notes: "Experienced in drama and action. Available immediately.",
    },
    {
      id: "sub-2",
      castingCallId: "cc-1",
      castingCallTitle: "Lead Role - Sarah",
      data: {
        name: "Michael Chen",
        email: "michael@email.com",
        phone: "+1-555-0102",
        age: "35",
        playingAge: "30-40",
        headshot: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
        notes: "10 years of theater experience. SAG-AFTRA member.",
      },
      submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      isNew: false,
      name: "Michael Chen",
      email: "michael@email.com",
      phone: "+1-555-0102",
      age: "35",
      playingAge: "30-40",
      headshot: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      notes: "10 years of theater experience. SAG-AFTRA member.",
    },
    {
      id: "sub-3",
      castingCallId: "cc-2",
      castingCallTitle: "Supporting Role - Detective",
      data: {
        name: "Sarah Williams",
        email: "sarah.w@email.com",
        phone: "+1-555-0103",
        age: "42",
        playingAge: "38-48",
        headshot: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
        notes: "Specialized in crime dramas. Own prop badge collection.",
      },
      submittedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      isNew: true,
      name: "Sarah Williams",
      email: "sarah.w@email.com",
      phone: "+1-555-0103",
      age: "42",
      playingAge: "38-48",
      headshot: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
      notes: "Specialized in crime dramas. Own prop badge collection.",
    },
  ]

  const demoCastingCalls: CastingCall[] = [
    {
      id: "cc-1",
      title: "Lead Role - Sarah",
      description: "Seeking a dynamic actress for the lead role of Sarah in our upcoming thriller.",
      projectName: "Midnight Echo",
      fields: [
        { id: "f1", label: "Full Name", type: "text", required: true, placeholder: "Enter your full name" },
        { id: "f2", label: "Email", type: "email", required: true, placeholder: "your@email.com" },
        { id: "f3", label: "Phone", type: "phone", required: true, placeholder: "+1-555-0000" },
        { id: "f4", label: "Age", type: "number", required: true, placeholder: "Your age" },
        { id: "f5", label: "Playing Age Range", type: "text", required: false, placeholder: "e.g., 25-35" },
        { id: "f6", label: "Headshot URL", type: "url", required: false, placeholder: "Link to your headshot" },
        { id: "f7", label: "Additional Notes", type: "textarea", required: false, placeholder: "Tell us about yourself..." },
      ],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      shareableLink: "https://gogreenlight.ai/cast/abc123",
    },
    {
      id: "cc-2",
      title: "Supporting Role - Detective",
      description: "Looking for an experienced actor for a recurring detective role.",
      projectName: "Midnight Echo",
      fields: [
        { id: "f1", label: "Full Name", type: "text", required: true, placeholder: "Enter your full name" },
        { id: "f2", label: "Email", type: "email", required: true, placeholder: "your@email.com" },
        { id: "f3", label: "Phone", type: "phone", required: false, placeholder: "+1-555-0000" },
        { id: "f4", label: "Experience", type: "textarea", required: true, placeholder: "Describe your relevant experience" },
      ],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isActive: true,
      shareableLink: "https://gogreenlight.ai/cast/def456",
    },
  ]

  return [
    {
      id: "proj-1",
      name: "Midnight Echo",
      castingCalls: demoCastingCalls,
      submissions: demoSubmissions,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  ]
}

export function PublicCastingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PublicCastingState>({
    projects: createDemoData(),
    currentProject: null,
    currentCastingCall: null,
    newSubmissionsCount: 2, // From demo data
  })

  const createProject = useCallback((name: string): PublicCastingProject => {
    const newProject: PublicCastingProject = {
      id: `proj-${Date.now()}`,
      name,
      castingCalls: [],
      submissions: [],
      createdAt: new Date(),
    }
    setState((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
      currentProject: newProject,
    }))
    return newProject
  }, [])

  const selectProject = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      currentProject: prev.projects.find((p) => p.id === id) || null,
      currentCastingCall: null,
    }))
  }, [])

  const updateProject = useCallback((id: string, updates: Partial<PublicCastingProject>) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      currentProject: prev.currentProject?.id === id ? { ...prev.currentProject, ...updates } : prev.currentProject,
    }))
  }, [])

  const deleteProject = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
      currentProject: prev.currentProject?.id === id ? null : prev.currentProject,
    }))
  }, [])

  const createCastingCall = useCallback(
    (projectId: string, title: string, description: string, projectName: string, fields: CastingCallField[]): CastingCall => {
      const newCastingCall: CastingCall = {
        id: `cc-${Date.now()}`,
        title,
        description,
        projectName,
        fields,
        createdAt: new Date(),
        isActive: true,
        shareableLink: `https://gogreenlight.ai/cast/${Math.random().toString(36).substring(2, 8)}`,
      }
      setState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, castingCalls: [...p.castingCalls, newCastingCall] } : p
        ),
        currentProject:
          prev.currentProject?.id === projectId
            ? { ...prev.currentProject, castingCalls: [...prev.currentProject.castingCalls, newCastingCall] }
            : prev.currentProject,
      }))
      return newCastingCall
    },
    []
  )

  const updateCastingCall = useCallback((projectId: string, castingCallId: string, updates: Partial<CastingCall>) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              castingCalls: p.castingCalls.map((cc) => (cc.id === castingCallId ? { ...cc, ...updates } : cc)),
            }
          : p
      ),
    }))
  }, [])

  const deleteCastingCall = useCallback((projectId: string, castingCallId: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? { ...p, castingCalls: p.castingCalls.filter((cc) => cc.id !== castingCallId) } : p
      ),
    }))
  }, [])

  const selectCastingCall = useCallback((id: string) => {
    setState((prev) => {
      const castingCall = prev.currentProject?.castingCalls.find((cc) => cc.id === id) || null
      return { ...prev, currentCastingCall: castingCall }
    })
  }, [])

  const addSubmission = useCallback((castingCallId: string, data: Record<string, string>) => {
    setState((prev) => {
      const project = prev.projects.find((p) => p.castingCalls.some((cc) => cc.id === castingCallId))
      if (!project) return prev

      const castingCall = project.castingCalls.find((cc) => cc.id === castingCallId)
      if (!castingCall) return prev

      const newSubmission: CastingSubmission = {
        id: `sub-${Date.now()}`,
        castingCallId,
        castingCallTitle: castingCall.title,
        data,
        submittedAt: new Date(),
        isNew: true,
        name: data.name || data["Full Name"] || "Unknown",
        email: data.email || data["Email"] || "",
        phone: data.phone || data["Phone"],
        age: data.age || data["Age"],
        playingAge: data.playingAge || data["Playing Age Range"],
        headshot: data.headshot || data["Headshot URL"],
        notes: data.notes || data["Additional Notes"],
      }

      return {
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project.id ? { ...p, submissions: [...p.submissions, newSubmission] } : p
        ),
        newSubmissionsCount: prev.newSubmissionsCount + 1,
      }
    })
  }, [])

  const updateSubmission = useCallback((submissionId: string, updates: Partial<CastingSubmission>) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => ({
        ...p,
        submissions: p.submissions.map((s) =>
          s.id === submissionId ? { ...s, ...updates } : s
        ),
      })),
    }))
  }, [])

  const deleteSubmission = useCallback((submissionId: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => ({
        ...p,
        submissions: p.submissions.filter((s) => s.id !== submissionId),
      })),
    }))
  }, [])

  const markSubmissionsAsRead = useCallback((projectId: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? { ...p, submissions: p.submissions.map((s) => ({ ...s, isNew: false })) }
          : p
      ),
      newSubmissionsCount: 0,
    }))
  }, [])

  const getSubmissionsForProject = useCallback(
    (projectId: string): CastingSubmission[] => {
      const project = state.projects.find((p) => p.id === projectId)
      return project?.submissions || []
    },
    [state.projects]
  )

  const getTotalSubmissions = useCallback((): number => {
    return state.projects.reduce((total, p) => total + p.submissions.length, 0)
  }, [state.projects])

  const getNewSubmissionsCount = useCallback((): number => {
    return state.projects.reduce(
      (total, p) => total + p.submissions.filter((s) => s.isNew).length,
      0
    )
  }, [state.projects])

  return (
    <PublicCastingContext.Provider
      value={{
        state,
        createProject,
        selectProject,
        updateProject,
        deleteProject,
        createCastingCall,
        updateCastingCall,
        deleteCastingCall,
        selectCastingCall,
        addSubmission,
        updateSubmission,
        deleteSubmission,
        markSubmissionsAsRead,
        getSubmissionsForProject,
        getTotalSubmissions,
        getNewSubmissionsCount,
      }}
    >
      {children}
    </PublicCastingContext.Provider>
  )
}

export function usePublicCasting() {
  const context = useContext(PublicCastingContext)
  if (!context) {
    throw new Error("usePublicCasting must be used within a PublicCastingProvider")
  }
  return context
}
