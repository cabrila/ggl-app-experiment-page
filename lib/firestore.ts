import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore"
import { db } from "./firebase"
import { CharacterBible } from "@/types/character-bible"
import { ActorListProject } from "@/types/actor-list"
import { LocationProject } from "@/types/location-scouting"

// Helper to check if Firestore is properly initialized
function isFirestoreInitialized(): boolean {
  return db && typeof db.type === "string"
}

// Convert Firestore Timestamp to Date
function convertTimestamp(timestamp: Timestamp | Date): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  return timestamp
}

// Convert project data from Firestore format
function convertFromFirestore<T extends { createdAt: Date; updatedAt: Date }>(
  data: Record<string, unknown>,
  id: string
): T {
  return {
    ...data,
    id,
    createdAt: convertTimestamp(data.createdAt as Timestamp | Date),
    updatedAt: convertTimestamp(data.updatedAt as Timestamp | Date),
    isDemo: data.isDemo ?? false,
  } as T
}

// ==================== CHARACTER BIBLES ====================

export function subscribeToCharacterBibles(
  userId: string,
  onData: (bibles: CharacterBible[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!isFirestoreInitialized()) {
    onError(new Error("Firestore not initialized"))
    return () => {}
  }

  const biblesRef = collection(db, `users/${userId}/characterBibles`)
  const q = query(biblesRef, orderBy("updatedAt", "desc"))

  return onSnapshot(
    q,
    (snapshot) => {
      const bibles = snapshot.docs.map((doc) =>
        convertFromFirestore<CharacterBible>(doc.data(), doc.id)
      )
      onData(bibles)
    },
    onError
  )
}

export async function addCharacterBible(
  userId: string,
  bible: Omit<CharacterBible, "id" | "isDemo">
): Promise<string> {
  if (!isFirestoreInitialized()) {
    throw new Error("Firestore not initialized")
  }

  const biblesRef = collection(db, `users/${userId}/characterBibles`)
  const docRef = await addDoc(biblesRef, {
    ...bible,
    isDemo: false,
    createdAt: Timestamp.fromDate(bible.createdAt),
    updatedAt: Timestamp.fromDate(bible.updatedAt),
  })
  return docRef.id
}

export async function updateCharacterBible(
  userId: string,
  bibleId: string,
  updates: Partial<CharacterBible>
): Promise<void> {
  if (!isFirestoreInitialized()) {
    throw new Error("Firestore not initialized")
  }

  const bibleRef = doc(db, `users/${userId}/characterBibles/${bibleId}`)
  const updateData: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() }
  
  if (updates.createdAt) {
    updateData.createdAt = Timestamp.fromDate(updates.createdAt)
  }
  
  // Remove id from updates as it's not a field
  delete updateData.id
  
  await updateDoc(bibleRef, updateData)
}

export async function deleteCharacterBible(
  userId: string,
  bibleId: string
): Promise<void> {
  if (!isFirestoreInitialized()) {
    throw new Error("Firestore not initialized")
  }

  const bibleRef = doc(db, `users/${userId}/characterBibles/${bibleId}`)
  await deleteDoc(bibleRef)
}

// ==================== ACTOR LIST PROJECTS ====================

export function subscribeToActorProjects(
  userId: string,
  onData: (projects: ActorListProject[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!isFirestoreInitialized()) {
    onError(new Error("Firestore not initialized"))
    return () => {}
  }

  const projectsRef = collection(db, `users/${userId}/actorProjects`)
  const q = query(projectsRef, orderBy("updatedAt", "desc"))

  return onSnapshot(
    q,
    (snapshot) => {
      const projects = snapshot.docs.map((doc) =>
        convertFromFirestore<ActorListProject>(doc.data(), doc.id)
      )
      onData(projects)
    },
    onError
  )
}

export async function addActorProject(
  userId: string,
  project: Omit<ActorListProject, "id" | "isDemo">
): Promise<string> {
  if (!isFirestoreInitialized()) {
    throw new Error("Firestore not initialized")
  }

  const projectsRef = collection(db, `users/${userId}/actorProjects`)
  const docRef = await addDoc(projectsRef, {
    ...project,
    isDemo: false,
    createdAt: Timestamp.fromDate(project.createdAt),
    updatedAt: Timestamp.fromDate(project.updatedAt),
  })
  return docRef.id
}

export async function updateActorProject(
  userId: string,
  projectId: string,
  updates: Partial<ActorListProject>
): Promise<void> {
  if (!isFirestoreInitialized()) {
    throw new Error("Firestore not initialized")
  }

  const projectRef = doc(db, `users/${userId}/actorProjects/${projectId}`)
  const updateData: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() }
  
  if (updates.createdAt) {
    updateData.createdAt = Timestamp.fromDate(updates.createdAt)
  }
  
  delete updateData.id
  
  await updateDoc(projectRef, updateData)
}

export async function deleteActorProject(
  userId: string,
  projectId: string
): Promise<void> {
  if (!isFirestoreInitialized()) {
    throw new Error("Firestore not initialized")
  }

  const projectRef = doc(db, `users/${userId}/actorProjects/${projectId}`)
  await deleteDoc(projectRef)
}

// ==================== LOCATION PROJECTS ====================

export function subscribeToLocationProjects(
  userId: string,
  onData: (projects: LocationProject[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!isFirestoreInitialized()) {
    onError(new Error("Firestore not initialized"))
    return () => {}
  }

  const projectsRef = collection(db, `users/${userId}/locationProjects`)
  const q = query(projectsRef, orderBy("updatedAt", "desc"))

  return onSnapshot(
    q,
    (snapshot) => {
      const projects = snapshot.docs.map((doc) =>
        convertFromFirestore<LocationProject>(doc.data(), doc.id)
      )
      onData(projects)
    },
    onError
  )
}

export async function addLocationProject(
  userId: string,
  project: Omit<LocationProject, "id" | "isDemo">
): Promise<string> {
  if (!isFirestoreInitialized()) {
    throw new Error("Firestore not initialized")
  }

  const projectsRef = collection(db, `users/${userId}/locationProjects`)
  const docRef = await addDoc(projectsRef, {
    ...project,
    isDemo: false,
    createdAt: Timestamp.fromDate(project.createdAt),
    updatedAt: Timestamp.fromDate(project.updatedAt),
  })
  return docRef.id
}

export async function updateLocationProject(
  userId: string,
  projectId: string,
  updates: Partial<LocationProject>
): Promise<void> {
  if (!isFirestoreInitialized()) {
    throw new Error("Firestore not initialized")
  }

  const projectRef = doc(db, `users/${userId}/locationProjects/${projectId}`)
  const updateData: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() }
  
  if (updates.createdAt) {
    updateData.createdAt = Timestamp.fromDate(updates.createdAt)
  }
  
  delete updateData.id
  
  await updateDoc(projectRef, updateData)
}

export async function deleteLocationProject(
  userId: string,
  projectId: string
): Promise<void> {
  if (!isFirestoreInitialized()) {
    throw new Error("Firestore not initialized")
  }

  const projectRef = doc(db, `users/${userId}/locationProjects/${projectId}`)
  await deleteDoc(projectRef)
}
