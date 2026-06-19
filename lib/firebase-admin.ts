import { initializeApp, getApps, cert, App, applicationDefault } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

/**
 * Lazily initialise the Firebase Admin SDK on the server.
 *
 * Looks for credentials in the following order:
 *   1. FIREBASE_SERVICE_ACCOUNT_KEY  – full service-account JSON in one env var
 *   2. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 *   3. GOOGLE_APPLICATION_CREDENTIALS (managed runtime / ADC)
 *
 * If no credentials are configured the function still returns an app
 * initialised with just the projectId so verifyIdToken can validate the
 * token signature against Google's public keys.
 */
let cached: App | null = null

function getAdminApp(): App {
  if (cached) return cached
  const existing = getApps()[0]
  if (existing) {
    cached = existing
    return cached
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  // 1. Full JSON in one env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      cached = initializeApp({ credential: cert(sa) })
      return cached
    } catch (err) {
      console.error("[usage] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", err)
    }
  }

  // 2. Split env vars
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    cached = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace literal "\n" sequences that come from .env files.
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    })
    return cached
  }

  // 3. ADC (managed runtime)
  try {
    cached = initializeApp({
      credential: applicationDefault(),
      projectId,
    })
    return cached
  } catch {
    // 4. Last resort: initialise with just projectId. verifyIdToken will
    //    still validate signatures using Google's public keys.
    cached = initializeApp({ projectId })
    return cached
  }
}

export interface VerifiedUser {
  uid: string
  email: string | null
}

/**
 * Verify a Firebase ID token from the `Authorization: Bearer <token>` header.
 * Returns the decoded user, or null if the header is missing/invalid.
 */
export async function verifyIdTokenFromRequest(
  request: Request
): Promise<VerifiedUser | null> {
  const authHeader = request.headers.get("authorization") || ""
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match) return null
  const token = match[1]

  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(token)
    return { uid: decoded.uid, email: decoded.email ?? null }
  } catch (err) {
    console.error("[usage] verifyIdToken failed:", err)
    return null
  }
}

export function isInternalEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase().endsWith("@gogreenlight.ai")
}
