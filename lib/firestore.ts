import {
  collection,
  doc,
  addDoc,
  setDoc,
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
import { ActorListProject, Actor } from "@/types/actor-list"
import { LocationProject } from "@/types/location-scouting"
import { PropProject } from "@/types/prop-list"
import { SceneProject } from "@/types/scene-list"

// Helper to check if Firestore is properly initialized
function isFirestoreInitialized(): boolean {
  return db && typeof db.type === "string"
}

/**
 * Firestore rejects documents that contain `undefined` values at any depth.
 * The AI extraction produces Character objects whose optional fields
 * (alternateNames, nested profile fields, etc.) are often `undefined`, which
 * caused addDoc/updateDoc to throw. This helper deep-clones the input and
 * removes any `undefined` values, leaving `null`s, arrays, Dates, and
 * Firestore Timestamps intact.
 */
function stripUndefined<T>(value: T): T {
  if (value === undefined) {
    return undefined as unknown as T
  }
  if (value === null) return value
  if (value instanceof Date) return value
  if (value instanceof Timestamp) return value
  if (Array.isArray(value)) {
    return value
      .filter((v) => v !== undefined)
      .map((v) => stripUndefined(v)) as unknown as T
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue
      const cleaned = stripUndefined(v)
      if (cleaned !== undefined) out[k] = cleaned
    }
    return out as unknown as T
  }
  return value
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
  const docRef = await addDoc(
    biblesRef,
    stripUndefined({
      ...bible,
      isDemo: false,
      createdAt: Timestamp.fromDate(bible.createdAt),
      updatedAt: Timestamp.fromDate(bible.updatedAt),
    })
  )
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

  await updateDoc(bibleRef, stripUndefined(updateData))
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
  const docRef = await addDoc(
    projectsRef,
    stripUndefined({
      ...project,
      isDemo: false,
      createdAt: Timestamp.fromDate(project.createdAt),
      updatedAt: Timestamp.fromDate(project.updatedAt),
    })
  )
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

  await updateDoc(projectRef, stripUndefined(updateData))
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

// ==================== STANDALONE ACTORS ====================
// Actors that don't belong to any list. Stored one doc per actor, keyed by the
// actor's own id, under users/{userId}/standaloneActors. Unlike projects, an
// Actor has no createdAt/updatedAt, so we persist it as-is.

export function subscribeToStandaloneActors(
  userId: string,
  onData: (actors: Actor[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!isFirestoreInitialized()) {
    onError(new Error("Firestore not initialized"))
    return () => {}
  }

  const actorsRef = collection(db, `users/${userId}/standaloneActors`)

  return onSnapshot(
    actorsRef,
    (snapshot) => {
      const actors = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Actor))
      onData(actors)
    },
    onError
  )
}

export async function saveStandaloneActor(userId: string, actor: Actor): Promise<void> {
  if (!isFirestoreInitialized()) throw new Error("Firestore not initialized")
  const actorRef = doc(db, `users/${userId}/standaloneActors/${actor.id}`)
  await setDoc(actorRef, stripUndefined(actor))
}

export async function deleteStandaloneActor(userId: string, actorId: string): Promise<void> {
  if (!isFirestoreInitialized()) throw new Error("Firestore not initialized")
  const actorRef = doc(db, `users/${userId}/standaloneActors/${actorId}`)
  await deleteDoc(actorRef)
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
  const docRef = await addDoc(
    projectsRef,
    stripUndefined({
      ...project,
      isDemo: false,
      createdAt: Timestamp.fromDate(project.createdAt),
      updatedAt: Timestamp.fromDate(project.updatedAt),
    })
  )
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

  await updateDoc(projectRef, stripUndefined(updateData))
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

// ==================== PROP PROJECTS ====================

export function subscribeToPropProjects(
  userId: string,
  onData: (projects: PropProject[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!isFirestoreInitialized()) {
    onError(new Error("Firestore not initialized"))
    return () => {}
  }

  const projectsRef = collection(db, `users/${userId}/propProjects`)
  const q = query(projectsRef, orderBy("updatedAt", "desc"))

  return onSnapshot(
    q,
    (snapshot) => {
      const projects = snapshot.docs.map((doc) =>
        convertFromFirestore<PropProject>(doc.data(), doc.id)
      )
      onData(projects)
    },
    onError
  )
}

export async function addPropProject(
  userId: string,
  project: Omit<PropProject, "id" | "isDemo">
): Promise<string> {
  if (!isFirestoreInitialized()) throw new Error("Firestore not initialized")
  const projectsRef = collection(db, `users/${userId}/propProjects`)
  const docRef = await addDoc(
    projectsRef,
    stripUndefined({
      ...project,
      isDemo: false,
      createdAt: Timestamp.fromDate(project.createdAt),
      updatedAt: Timestamp.fromDate(project.updatedAt),
    })
  )
  return docRef.id
}

export async function updatePropProject(
  userId: string,
  projectId: string,
  updates: Partial<PropProject>
): Promise<void> {
  if (!isFirestoreInitialized()) throw new Error("Firestore not initialized")
  const projectRef = doc(db, `users/${userId}/propProjects/${projectId}`)
  const updateData: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() }
  if (updates.createdAt) {
    updateData.createdAt = Timestamp.fromDate(updates.createdAt)
  }
  delete updateData.id
  await updateDoc(projectRef, stripUndefined(updateData))
}

export async function deletePropProject(
  userId: string,
  projectId: string
): Promise<void> {
  if (!isFirestoreInitialized()) throw new Error("Firestore not initialized")
  const projectRef = doc(db, `users/${userId}/propProjects/${projectId}`)
  await deleteDoc(projectRef)
}

// ==================== SCENE PROJECTS ====================

export function subscribeToSceneProjects(
  userId: string,
  onData: (projects: SceneProject[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!isFirestoreInitialized()) {
    onError(new Error("Firestore not initialized"))
    return () => {}
  }

  const projectsRef = collection(db, `users/${userId}/sceneProjects`)
  const q = query(projectsRef, orderBy("updatedAt", "desc"))

  return onSnapshot(
    q,
    (snapshot) => {
      const projects = snapshot.docs.map((doc) =>
        convertFromFirestore<SceneProject>(doc.data(), doc.id)
      )
      onData(projects)
    },
    onError
  )
}

export async function addSceneProject(
  userId: string,
  project: Omit<SceneProject, "id" | "isDemo">
): Promise<string> {
  if (!isFirestoreInitialized()) throw new Error("Firestore not initialized")
  const projectsRef = collection(db, `users/${userId}/sceneProjects`)
  const docRef = await addDoc(
    projectsRef,
    stripUndefined({
      ...project,
      isDemo: false,
      createdAt: Timestamp.fromDate(project.createdAt),
      updatedAt: Timestamp.fromDate(project.updatedAt),
    })
  )
  return docRef.id
}

export async function updateSceneProject(
  userId: string,
  projectId: string,
  updates: Partial<SceneProject>
): Promise<void> {
  if (!isFirestoreInitialized()) throw new Error("Firestore not initialized")
  const projectRef = doc(db, `users/${userId}/sceneProjects/${projectId}`)
  const updateData: Record<string, unknown> = { ...updates, updatedAt: Timestamp.now() }
  if (updates.createdAt) {
    updateData.createdAt = Timestamp.fromDate(updates.createdAt)
  }
  delete updateData.id
  await updateDoc(projectRef, stripUndefined(updateData))
}

export async function deleteSceneProject(
  userId: string,
  projectId: string
): Promise<void> {
  if (!isFirestoreInitialized()) throw new Error("Firestore not initialized")
  const projectRef = doc(db, `users/${userId}/sceneProjects/${projectId}`)
  await deleteDoc(projectRef)
}
