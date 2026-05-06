import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"

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

if (typeof window !== "undefined" && isConfigValid) {
  // Client-side initialization with valid config
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
    auth = getAuth(app)
  } catch (error) {
    console.error("[v0] Firebase initialization error:", error)
    app = {} as FirebaseApp
    auth = {} as Auth
  }
} else {
  // Server-side or missing config: create a placeholder
  app = {} as FirebaseApp
  auth = {} as Auth
}

export { auth }
export default app
