import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"
import { getFirestore, Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check if Firebase config is valid
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId

// Initialize Firebase only on client side or if not already initialized
let app: FirebaseApp
let auth: Auth
let db: Firestore

if (typeof window !== "undefined" && isConfigValid) {
  // Client-side initialization with valid config
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
    auth = getAuth(app)
    db = getFirestore(app, "app-experiment-firestore")
  } catch (error) {
    console.error("[v0] Firebase initialization error:", error)
    app = {} as FirebaseApp
    auth = {} as Auth
    db = {} as Firestore
  }
} else {
  // Server-side or missing config: create a placeholder
  app = {} as FirebaseApp
  auth = {} as Auth
  db = {} as Firestore
}

// Promise that resolves when auth is ready
let authReadyResolve: () => void
const authReadyPromise = new Promise<void>((resolve) => {
  authReadyResolve = resolve
})

// Check if auth is initialized and resolve the promise
if (typeof window !== "undefined" && isConfigValid && auth && typeof auth.onIdTokenChanged === "function") {
  authReadyResolve!()
}

export function waitForAuth(): Promise<void> {
  return authReadyPromise
}

export { auth, db }
export default app
