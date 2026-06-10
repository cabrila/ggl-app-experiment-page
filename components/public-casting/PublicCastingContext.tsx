"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react"
import { CastingCall, CastingCallField, CastingSubmission, PublicCastingProject } from "@/types/public-casting"
import { loadDemoData, saveDemoData, DEMO_STORAGE_KEYS } from "@/utils/demoPersistence"

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
  createCastingCall: (projectId: string, title: string, description: string, projectName: string, fields: CastingCallField[], headerImageUrl?: string, consent?: { talentPoolConsentEnabled?: boolean; talentPoolConsentText?: string }) => CastingCall
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

  // ---- Additional demo casting calls + submissions ----
  const headshotPool = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop",
  ]

  // Build a submission with both nested data and flattened top-level fields.
  const buildSubmission = (
    key: string,
    index: number,
    castingCallId: string,
    castingCallTitle: string,
    data: Record<string, string>,
    hoursAgo: number,
    isNew: boolean,
  ): CastingSubmission => ({
    id: `${key}-sub-${index}`,
    castingCallId,
    castingCallTitle,
    data,
    submittedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
    isNew,
    ...data,
    name: data.name ?? "",
    email: data.email ?? "",
  })

  const extraCastingCalls: CastingCall[] = [
    {
      id: "cc-3",
      title: "Antagonist - The Collector",
      description: "Seeking a charismatic and menacing actor to play the central antagonist in our psychological thriller.",
      projectName: "Midnight Echo",
      fields: [
        { id: "f1", label: "Full Name", type: "text", required: true, placeholder: "Enter your full name" },
        { id: "f2", label: "Email", type: "email", required: true, placeholder: "your@email.com" },
        { id: "f3", label: "Phone", type: "phone", required: true, placeholder: "+1-555-0000" },
        { id: "f4", label: "Age", type: "number", required: true, placeholder: "Your age" },
        { id: "f5", label: "Playing Age Range", type: "text", required: false, placeholder: "e.g., 40-55" },
        { id: "f6", label: "Headshot URL", type: "url", required: false, placeholder: "Link to your headshot" },
        { id: "f7", label: "Reel URL", type: "url", required: false, placeholder: "Link to your demo reel" },
        { id: "f8", label: "Additional Notes", type: "textarea", required: false, placeholder: "Tell us about yourself..." },
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isActive: true,
      shareableLink: "https://gogreenlight.ai/cast/ghi789",
      talentPoolConsentEnabled: true,
      talentPoolConsentText: "I consent to being added to the talent pool to be considered for future projects.",
    },
    {
      id: "cc-4",
      title: "Young Lead - Riley",
      description: "Looking for a fresh, energetic performer for the youthful co-lead. Recent grads encouraged to apply.",
      projectName: "Midnight Echo",
      fields: [
        { id: "f1", label: "Full Name", type: "text", required: true, placeholder: "Enter your full name" },
        { id: "f2", label: "Email", type: "email", required: true, placeholder: "your@email.com" },
        { id: "f3", label: "Age", type: "number", required: true, placeholder: "Your age" },
        { id: "f4", label: "Playing Age Range", type: "text", required: false, placeholder: "e.g., 18-24" },
        { id: "f5", label: "Headshot URL", type: "url", required: false, placeholder: "Link to your headshot" },
        { id: "f6", label: "Training / Experience", type: "textarea", required: true, placeholder: "Describe your training" },
      ],
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      isActive: true,
      shareableLink: "https://gogreenlight.ai/cast/jkl012",
    },
    {
      id: "cc-5",
      title: "Featured Extra - Nightclub Patrons",
      description: "Casting featured background performers for an upscale nightclub sequence. Multiple roles available.",
      projectName: "Midnight Echo",
      fields: [
        { id: "f1", label: "Full Name", type: "text", required: true, placeholder: "Enter your full name" },
        { id: "f2", label: "Email", type: "email", required: true, placeholder: "your@email.com" },
        { id: "f3", label: "Phone", type: "phone", required: true, placeholder: "+1-555-0000" },
        { id: "f4", label: "Headshot URL", type: "url", required: false, placeholder: "Link to your headshot" },
      ],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      isActive: true,
      shareableLink: "https://gogreenlight.ai/cast/mno345",
    },
    {
      id: "cc-6",
      title: "Narrator Voice - Pilot",
      description: "Completed search for a distinctive narrator voice for the series pilot. Role now cast.",
      projectName: "Midnight Echo",
      fields: [
        { id: "f1", label: "Full Name", type: "text", required: true, placeholder: "Enter your full name" },
        { id: "f2", label: "Email", type: "email", required: true, placeholder: "your@email.com" },
        { id: "f3", label: "Voice Sample URL", type: "url", required: true, placeholder: "Link to a voice sample" },
        { id: "f4", label: "Additional Notes", type: "textarea", required: false, placeholder: "Tell us about your voice work" },
      ],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      isActive: false,
      isCompleted: true,
      shareableLink: "https://gogreenlight.ai/cast/pqr678",
    },
    {
      id: "cc-7",
      title: "Stunt Double - Action Sequence",
      description: "Closed casting for a stunt double for the rooftop chase. Position has been filled.",
      projectName: "Midnight Echo",
      fields: [
        { id: "f1", label: "Full Name", type: "text", required: true, placeholder: "Enter your full name" },
        { id: "f2", label: "Email", type: "email", required: true, placeholder: "your@email.com" },
        { id: "f3", label: "Phone", type: "phone", required: true, placeholder: "+1-555-0000" },
        { id: "f4", label: "Height", type: "text", required: true, placeholder: "e.g., 5'10\"" },
        { id: "f5", label: "Certifications", type: "textarea", required: true, placeholder: "List your stunt certifications" },
      ],
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      isActive: false,
      isCompleted: true,
      shareableLink: "https://gogreenlight.ai/cast/stu901",
    },
  ]

  const cc1Names = [
    "Isabella Moreno", "Chloe Bennett", "Ava Richardson", "Mia Castellano", "Sophia Lang",
    "Amelia Hart", "Charlotte Vega", "Layla Brooks", "Ruby Ellison", "Scarlett Nolan", "Penelope Shaw",
  ]
  const cc2Names = [
    "Frank Delgado", "Marcus Boone", "Trevor Nash", "Hank Whitmore", "Carl Petersen",
    "Roland Estes", "Bruno Salas", "Dwight Carver", "Lou Ferraro", "Sid Halloran", "Mickey Doyle",
  ]
  const cc3Names = [
    "Vincent Marlowe", "Adrian Cole", "Theo Sandoval", "Damien Hart", "Lucas Renn",
    "Sebastian Vance", "Marcus Webb", "Julian Frost", "Gideon Pierce", "Nathaniel Stone", "Felix Drake",
    "Roman Vasquez", "Caleb Mercer", "Dominic Vale", "Ezra Lockwood", "Silas Crane",
    "Victor Hale", "Maxim Orlov", "Ronan Briggs", "Cassius Dunn", "Leon Pratt",
    "Ambrose Kent", "Magnus Reyes", "Dorian Slade", "Hugo Vance", "Tobias Quint",
  ]
  const cc4Names = [
    "Riley Quinn", "Maya Brennan", "Jasmine Lee", "Cody Alvarez", "Harper Quinn",
    "Devon Park", "Sienna Ross", "Eli Carter", "Nora Bell", "Tate Sullivan",
  ]
  const cc5Names = [
    "Olivia Grant", "Priya Nair", "Sofia Ruiz", "Hannah Cole", "Grace Lin",
    "Bianca Ferro", "Naomi Reed", "Chloe Banks", "Aria Mendez", "Lila Cross", "Zoe Hart", "Maddie Vaughn",
    "Elena Sorka", "Tessa Vaughn", "Nadia Khan", "Camila Ortiz", "Freya Bishop",
    "Daria Volkov", "Selena Cruz", "Wren Halloway", "Iris Caldwell", "Mira Solano",
    "Talia Reyes", "Eden Marsh", "Juno Castellanos", "Vera Lindqvist",
  ]
  const cc6Names = [
    "Gregory Pike", "Rosalind Vane", "Desmond Clay", "Imogen Frost", "Walter Boyd",
    "Cassandra Lowe", "Edmund Hale", "Patricia Nash", "Lionel Crane", "Vera Mott",
  ]
  const cc7Names = [
    "Brock Hayes", "Tanya Voss", "Reed Calloway", "Kira Sloane", "Dax Romero",
    "Mara Quinn", "Cole Bishop", "Nyla Frost", "Garrett Lyne", "Sasha Petrov",
  ]

  const extraSubmissions: CastingSubmission[] = [
    ...cc1Names.map((name, i) =>
      buildSubmission("cc1", i + 1, "cc-1", "Lead Role - Sarah", {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@email.com`,
        phone: `+1-555-1${String(100 + i).padStart(3, "0")}`,
        age: String(25 + (i % 10)),
        playingAge: `${24 + (i % 4)}-${33 + (i % 4)}`,
        headshot: headshotPool[i % headshotPool.length],
        notes: i % 2 === 0 ? "Lead experience in indie features and theater." : "Strong dramatic range; available for callbacks.",
      }, 4 + i * 5, i < 3),
    ),
    ...cc2Names.map((name, i) =>
      buildSubmission("cc2", i + 1, "cc-2", "Supporting Role - Detective", {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@email.com`,
        phone: `+1-555-2${String(100 + i).padStart(3, "0")}`,
        experience: i % 2 === 0 ? "Years of procedural and crime-drama credits." : "Character actor with stage and screen background.",
      }, 5 + i * 6, i < 2),
    ),
    ...cc3Names.map((name, i) =>
      buildSubmission("cc3", i + 1, "cc-3", "Antagonist - The Collector", {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@email.com`,
        phone: `+1-555-3${String(100 + i).padStart(3, "0")}`,
        age: String(42 + (i % 12)),
        playingAge: `${40 + (i % 5)}-${52 + (i % 5)}`,
        headshot: headshotPool[(i + 1) % headshotPool.length],
        reel: `https://reels.example.com/${name.toLowerCase().replace(/\s+/g, "-")}`,
        notes: i % 2 === 0 ? "Extensive villain credits in stage and screen." : "Trained in classical theater; commanding presence.",
      }, 3 + i * 5, i < 3),
    ),
    ...cc4Names.map((name, i) =>
      buildSubmission("cc4", i + 1, "cc-4", "Young Lead - Riley", {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@email.com`,
        age: String(19 + (i % 6)),
        playingAge: `${18 + (i % 3)}-${24 + (i % 3)}`,
        headshot: headshotPool[i % headshotPool.length],
        experience: i % 2 === 0 ? "Recent BFA graduate with festival short-film credits." : "Conservatory-trained; strong improv and movement work.",
      }, 6 + i * 4, i < 2),
    ),
    ...cc5Names.map((name, i) =>
      buildSubmission("cc5", i + 1, "cc-5", "Featured Extra - Nightclub Patrons", {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@email.com`,
        phone: `+1-555-5${String(100 + i).padStart(3, "0")}`,
        headshot: headshotPool[(i + 2) % headshotPool.length],
      }, 2 + i * 3, i < 4),
    ),
    ...cc6Names.map((name, i) =>
      buildSubmission("cc6", i + 1, "cc-6", "Narrator Voice - Pilot", {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@email.com`,
        voiceSample: `https://voices.example.com/${name.toLowerCase().replace(/\s+/g, "-")}`,
        notes: i % 2 === 0 ? "Warm baritone; extensive audiobook narration." : "Versatile range; commercial and documentary work.",
      }, 480 + i * 6, false),
    ),
    ...cc7Names.map((name, i) =>
      buildSubmission("cc7", i + 1, "cc-7", "Stunt Double - Action Sequence", {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@email.com`,
        phone: `+1-555-7${String(100 + i).padStart(3, "0")}`,
        height: `${5 + (i % 2)}'${8 + (i % 4)}"`,
        certifications: i % 2 === 0 ? "High-fall, wirework, and tactical driving certified." : "Stage combat, parkour, and motorcycle stunt certified.",
        headshot: headshotPool[(i + 3) % headshotPool.length],
      }, 600 + i * 6, false),
    ),
  ]

  // Each casting call form is its own entry/card on the My Casting Calls page.
  // Split every casting call into its own project, carrying the submissions
  // that belong to it (matched by castingCallId).
  const allCastingCalls = [...demoCastingCalls, ...extraCastingCalls]
  const allSubmissions = [...demoSubmissions, ...extraSubmissions]

  return allCastingCalls.map((castingCall) => ({
    id: `proj-${castingCall.id}`,
    name: castingCall.projectName || castingCall.title,
    castingCalls: [castingCall],
    submissions: allSubmissions.filter((s) => s.castingCallId === castingCall.id),
    createdAt: castingCall.createdAt,
  }))
}

export function PublicCastingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PublicCastingState>(() => {
    const demo = createDemoData()
    const persisted = loadDemoData<{ projects: PublicCastingProject[]; newSubmissionsCount: number } | null>(
      DEMO_STORAGE_KEYS.publicCasting,
      null
    )
    return {
      projects: persisted?.projects ?? demo,
      currentProject: null,
      currentCastingCall: null,
      newSubmissionsCount: persisted?.newSubmissionsCount ?? 16, // From demo data
    }
  })

  // Persist projects/submissions so they survive navigation/remounts when no backend is signed in.
  useEffect(() => {
    saveDemoData(DEMO_STORAGE_KEYS.publicCasting, {
      projects: state.projects,
      newSubmissionsCount: state.newSubmissionsCount,
    })
  }, [state.projects, state.newSubmissionsCount])

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
    (projectId: string, title: string, description: string, projectName: string, fields: CastingCallField[], headerImageUrl?: string, consent?: { talentPoolConsentEnabled?: boolean; talentPoolConsentText?: string }): CastingCall => {
      const newCastingCall: CastingCall = {
        id: `cc-${Date.now()}`,
        title,
        description,
        projectName,
        fields,
        createdAt: new Date(),
        isActive: true,
        shareableLink: `https://gogreenlight.ai/cast/${Math.random().toString(36).substring(2, 8)}`,
        headerImageUrl,
        talentPoolConsentEnabled: consent?.talentPoolConsentEnabled,
        talentPoolConsentText: consent?.talentPoolConsentText,
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
