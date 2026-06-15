"use client"

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react"
import { User } from "firebase/auth"
import { Actor, ActorGender, ActorListProject, AggregatedActor } from "@/types/actor-list"
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
import { loadDemoData, saveDemoData, DEMO_STORAGE_KEYS } from "@/utils/demoPersistence"
import { getSubmissionIdentities, matchesSubmission } from "@/utils/actorAssociation"

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

// Re-used demo headshot images, split by gender (existing mock data images).
const maleHeadshots = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
]
const femaleHeadshots = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
]

// Helper: build a list of actors from compact tuples, assigning a gender-matched
// re-used headshot image automatically.
// Tuple shape: [name, gender, age, playingAge, phone, email, notes]
const buildActors = (
  key: string,
  rows: [string, ActorGender, number, string, string, string, string][]
): Actor[] => {
  let mi = 0
  let fi = 0
  return rows.map(([name, gender, age, playingAge, phone, email, notes], i) => {
    const headshotUrl =
      gender === "Female"
        ? femaleHeadshots[fi++ % femaleHeadshots.length]
        : maleHeadshots[mi++ % maleHeadshots.length]
    return {
      id: `${key}-actor-${i + 1}`,
      name,
      age,
      gender,
      playingAge,
      phone,
      email,
      headshotUrl,
      notes,
    }
  })
}

const extraActorProjects: ActorListProject[] = [
  {
    id: "demo-actors-drama",
    name: "Crimson_Vale_Drama_Shortlist",
    createdAt: new Date("2026-05-02"),
    updatedAt: new Date("2026-05-02"),
    isDemo: true,
    actors: buildActors("drama", [
      ["Beatrix Lowell", "Female", 34, "30-40", "+1-555-1001", "beatrix.lowell@email.com", "Trained at RADA. Excels in restrained emotional roles. Available from June."],
      ["Desmond Aoki", "Male", 41, "38-48", "+1-555-1002", "desmond.aoki@email.com", "Bilingual (English/Japanese). Strong screen presence for antagonists."],
      ["Cordelia Marsh", "Female", 27, "24-30", "+1-555-1003", "cordelia.marsh@email.com", "Rising stage talent. Comfortable with intense close-up work."],
      ["Roman Ellison", "Male", 52, "48-60", "+1-555-1004", "roman.ellison@email.com", "Veteran character actor. Gravitas for authority figures and patriarchs."],
      ["Saffron Bell", "Female", 38, "35-45", "+1-555-1005", "saffron.bell@email.com", "Award-nominated indie lead. Prefers character-driven scripts."],
      ["Atticus Vaughn", "Male", 30, "28-36", "+1-555-1006", "atticus.vaughn@email.com", "Physical theater background. Great with movement-heavy blocking."],
      ["Lucinda Frost", "Female", 45, "42-52", "+1-555-1007", "lucinda.frost@email.com", "Commanding voice. Frequently cast as judges and executives."],
      ["Bartholomew Vue", "Male", 36, "32-42", "+1-555-1008", "bart.vue@email.com", "Subtle comedic instincts that ground heavy drama. SAG-AFTRA."],
      ["Ophelia Crane", "Female", 29, "25-33", "+1-555-1009", "ophelia.crane@email.com", "Dancer-actor hybrid. Available for relocation shoots."],
      ["Gideon Hawthorne", "Male", 48, "44-55", "+1-555-1010", "gideon.hawthorne@email.com", "Specializes in morally ambiguous leads. Strong improv skills."],
      ["Tamsin Ngata", "Female", 33, "30-40", "+1-555-1011", "tamsin.ngata@email.com", "International credits. Fluent accent work across regions."],
    ]),
  },
  {
    id: "demo-actors-action",
    name: "Steel_Horizon_Action_Pool",
    createdAt: new Date("2026-05-03"),
    updatedAt: new Date("2026-05-03"),
    isDemo: true,
    actors: buildActors("action", [
      ["Cassius Reed", "Male", 35, "30-42", "+1-555-2001", "cassius.reed@email.com", "Certified in stage combat and motorcycle stunts. Does own driving."],
      ["Valentina Cruz", "Female", 31, "27-36", "+1-555-2002", "valentina.cruz@email.com", "Former gymnast. Wire work and fight choreography experience."],
      ["Knox Barret", "Male", 44, "40-50", "+1-555-2003", "knox.barret@email.com", "Ex-military advisor and actor. Authentic tactical movement."],
      ["Sable Knight", "Female", 28, "24-32", "+1-555-2004", "sable.knight@email.com", "Parkour athlete. Comfortable at height with proper rigging."],
      ["Dominic Stahl", "Male", 39, "35-45", "+1-555-2005", "dominic.stahl@email.com", "Heavy/villain types. Trained in MMA for realistic fight scenes."],
      ["Wren Castillo", "Female", 26, "22-30", "+1-555-2006", "wren.castillo@email.com", "Stunt driver and actor. Available for international productions."],
      ["Magnus Thorne", "Male", 50, "46-58", "+1-555-2007", "magnus.thorne@email.com", "Imposing build. Often cast as mercenaries and enforcers."],
      ["Indira Sol", "Female", 37, "33-43", "+1-555-2008", "indira.sol@email.com", "Weapons-handling certified. Calm under pyrotechnics."],
      ["Ezra Vance", "Male", 33, "29-38", "+1-555-2009", "ezra.vance@email.com", "Lead-hero quality with action chops. Excellent stamina for long days."],
      ["Petra Lindqvist", "Female", 42, "38-48", "+1-555-2010", "petra.lindqvist@email.com", "Veteran action actress. Multilingual; strong on improvised reaction."],
    ]),
  },
  {
    id: "demo-actors-comedy",
    name: "Sunny_Side_Comedy_Casting",
    createdAt: new Date("2026-05-04"),
    updatedAt: new Date("2026-05-04"),
    isDemo: true,
    actors: buildActors("comedy", [
      ["Toby Fairchild", "Male", 29, "25-34", "+1-555-3001", "toby.fairchild@email.com", "Improv troupe veteran. Impeccable timing; great for ensemble work."],
      ["Margot Pennywhistle", "Female", 35, "30-42", "+1-555-3002", "margot.penny@email.com", "Sketch comedy background. Strong physical and deadpan range."],
      ["Reggie Salazar", "Male", 47, "42-55", "+1-555-3003", "reggie.salazar@email.com", "Sitcom veteran. Warm everyman dad energy audiences love."],
      ["Bella Quintero", "Female", 24, "20-28", "+1-555-3004", "bella.quintero@email.com", "Fresh comedic lead. Viral short-form following; quick study."],
      ["Hugo Bramble", "Male", 38, "34-44", "+1-555-3005", "hugo.bramble@email.com", "Dry British wit. Excellent at playing exasperated authority."],
      ["Dot Mancini", "Female", 52, "48-60", "+1-555-3006", "dot.mancini@email.com", "Scene-stealing supporting comedienne. Decades of stage farce."],
      ["Pip Calloway", "Male", 26, "22-30", "+1-555-3007", "pip.calloway@email.com", "Goofy charm and elastic face. Strong reactive comedy."],
      ["Florence Vane", "Female", 31, "27-36", "+1-555-3008", "florence.vane@email.com", "Rom-com lead quality. Natural chemistry in chemistry reads."],
      ["Marvin Oduya", "Male", 43, "38-48", "+1-555-3009", "marvin.oduya@email.com", "Stand-up crossover. Confident with live audience and ad-libs."],
      ["Cleo Hartwell", "Female", 28, "24-33", "+1-555-3010", "cleo.hartwell@email.com", "Musical comedy skills. Sings and plays for character bits."],
      ["Sid Brennan", "Male", 34, "30-40", "+1-555-3011", "sid.brennan@email.com", "Straight-man specialist. Anchors chaotic ensemble scenes."],
    ]),
  },
  {
    id: "demo-actors-period",
    name: "Gilded_Era_Period_Longlist",
    createdAt: new Date("2026-05-05"),
    updatedAt: new Date("2026-05-05"),
    isDemo: true,
    actors: buildActors("period", [
      ["Augustus Pemberton", "Male", 55, "50-65", "+1-555-4001", "augustus.pemberton@email.com", "Classical training. Exceptional with period diction and bearing."],
      ["Genevieve Ashford", "Female", 40, "35-48", "+1-555-4002", "genevieve.ashford@email.com", "Corseted-drama veteran. Skilled in period dance and etiquette."],
      ["Percival Crane", "Male", 33, "28-40", "+1-555-4003", "percival.crane@email.com", "Romantic lead for costume drama. Horse-riding certified."],
      ["Arabella Stone", "Female", 26, "22-30", "+1-555-4004", "arabella.stone@email.com", "Ingenue roles. Trained in historical movement and fan work."],
      ["Edmund Hale", "Male", 61, "55-70", "+1-555-4005", "edmund.hale@email.com", "Distinguished elder statesman type. Rich baritone narration voice."],
      ["Constance Vey", "Female", 48, "44-56", "+1-555-4006", "constance.vey@email.com", "Matriarch and dowager specialist. Commanding period presence."],
      ["Theodore Fox", "Male", 37, "32-44", "+1-555-4007", "theodore.fox@email.com", "Plays scheming aristocrats with relish. Fluent in fencing."],
      ["Lavinia Birch", "Female", 30, "26-36", "+1-555-4008", "lavinia.birch@email.com", "Governess and lady's-maid roles. Detailed accent precision."],
      ["Horace Welling", "Male", 44, "40-52", "+1-555-4009", "horace.welling@email.com", "Merchant and tradesman types. Grounded, naturalistic style."],
      ["Millicent Gray", "Female", 35, "30-42", "+1-555-4010", "millicent.gray@email.com", "Strong dramatic period lead. Comfortable in long single takes."],
    ]),
  },
  {
    id: "demo-actors-youth",
    name: "Bright_Futures_Young_Talent",
    createdAt: new Date("2026-05-06"),
    updatedAt: new Date("2026-05-06"),
    isDemo: true,
    actors: buildActors("youth", [
      ["Felix Marlow", "Male", 19, "16-22", "+1-555-5001", "felix.marlow@email.com", "Recent drama-school grad. Eager, coachable, strong emotional access."],
      ["Juniper Vale", "Female", 21, "18-24", "+1-555-5002", "juniper.vale@email.com", "Breakout short-film lead. Natural, unaffected screen quality."],
      ["Caleb Ross", "Male", 23, "19-26", "+1-555-5003", "caleb.ross@email.com", "Athletic young-lead type. Plays both charming and troubled."],
      ["Maya Brennan", "Female", 18, "15-21", "+1-555-5004", "maya.brennan@email.com", "Teen-role specialist. Plays younger; experienced on set."],
      ["Oscar Lin", "Male", 22, "18-25", "+1-555-5005", "oscar.lin@email.com", "Music and acting double threat. Strong with comedic timing."],
      ["Harper Quinn", "Female", 20, "17-23", "+1-555-5006", "harper.quinn@email.com", "Dramatic young actress. Notable indie festival credit last year."],
      ["Elliot Voss", "Male", 24, "20-28", "+1-555-5007", "elliot.voss@email.com", "College-age everyman. Relatable, grounded delivery."],
      ["Sienna Frost", "Female", 19, "16-22", "+1-555-5008", "sienna.frost@email.com", "Dance-trained newcomer. Expressive physicality and presence."],
      ["Jude Castillo", "Male", 21, "18-24", "+1-555-5009", "jude.castillo@email.com", "Rising social-media talent transitioning to scripted roles."],
      ["Nora Ellison", "Female", 23, "19-26", "+1-555-5010", "nora.ellison@email.com", "Versatile young lead. Excellent cold-read and improv ability."],
    ]),
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
  ...extraActorProjects,
]

export function ActorListProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ActorListProject[]>(() =>
    loadDemoData(DEMO_STORAGE_KEYS.actorListProjects, demoProjects)
  )
  const [currentProject, setCurrentProject] = useState<ActorListProject | null>(null)
  const [view, setView] = useState<ActorListView>("list")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [standaloneActors, setStandaloneActors] = useState<Actor[]>(() =>
    loadDemoData(DEMO_STORAGE_KEYS.actorListStandalone, [] as Actor[])
  )
  const [dismissedDuplicates, setDismissedDuplicates] = useState<Set<string>>(new Set())

  // Persist demo-mode data so it survives navigation/remounts when there is no
  // signed-in backend. Skipped while authenticated (Firestore is the source of truth).
  useEffect(() => {
    if (user) return
    saveDemoData(DEMO_STORAGE_KEYS.actorListProjects, projects)
  }, [projects, user])

  useEffect(() => {
    if (user) return
    saveDemoData(DEMO_STORAGE_KEYS.actorListStandalone, standaloneActors)
  }, [standaloneActors, user])

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthStateChanges((authUser) => {
      setUser(authUser)
      if (!authUser) {
        // User logged out (or no backend configured): show persisted demo data.
        setProjects(loadDemoData(DEMO_STORAGE_KEYS.actorListProjects, demoProjects))
        setStandaloneActors(loadDemoData(DEMO_STORAGE_KEYS.actorListStandalone, [] as Actor[]))
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

    // Identities of actors that exist as casting submissions, used to annotate
    // each aggregated actor with its association (Submissions / Actor cards / both / none).
    const submissionIdentities = getSubmissionIdentities()

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
          // Belongs to a My Actors list; "both" if it also matches a submission.
          const inSubmissions = matchesSubmission(submissionIdentities, actor.email, actor.name)
          actorMap.set(key, {
            ...actor,
            sourceListIds: [project.id],
            sourceListNames: [project.name],
            isDuplicate: isDuplicate && !dismissedDuplicates.has(normalizedName),
            duplicateDismissed: dismissedDuplicates.has(normalizedName),
            association: inSubmissions ? "both" : "actor-cards",
          })
        }
      })
    })

    standaloneActors.forEach((actor) => {
      const key = `${actor.name.toLowerCase().trim()}-${actor.email.toLowerCase().trim()}`
      const normalizedName = actor.name.toLowerCase().trim()
      const isDuplicate = (nameCounts.get(normalizedName) || 0) > 1
      if (!actorMap.has(key)) {
        // No My Actors list; "submissions" if it matches a submission, else "none".
        const inSubmissions = matchesSubmission(submissionIdentities, actor.email, actor.name)
        actorMap.set(key, {
          ...actor,
          sourceListIds: [],
          sourceListNames: [],
          isDuplicate: isDuplicate && !dismissedDuplicates.has(normalizedName),
          duplicateDismissed: dismissedDuplicates.has(normalizedName),
          association: inSubmissions ? "submissions" : "none",
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
    videos: actor.videos,
    photos: actor.photos,
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
