import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth"
import { auth } from "./firebase"

// Store the confirmation result for phone auth verification
let confirmationResult: ConfirmationResult | null = null

// Store the reCAPTCHA verifier instance
let recaptchaVerifier: RecaptchaVerifier | null = null

const actionCodeSettings = {
  url: `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/auth/callback`,
  handleCodeInApp: true,
}

/**
 * Send a magic link to the user's email
 */
export async function sendMagicLink(email: string): Promise<void> {
  const settings = {
    url: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
    handleCodeInApp: true,
  }
  
  try {
    await sendSignInLinkToEmail(auth, email, settings)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("emailForSignIn", email)
    }
  } catch (error: unknown) {
    console.error("Error sending magic link:", error)
    throw error
  }
}

/**
 * Check if the current URL is a magic link callback
 */
export function isMagicLinkCallback(): boolean {
  if (typeof window === "undefined") return false
  // Check if auth is properly initialized
  if (!auth || typeof auth.onIdTokenChanged !== "function") return false
  
  try {
    return isSignInWithEmailLink(auth, window.location.href)
  } catch {
    return false
  }
}

/**
 * Complete the magic link sign-in process
 */
export async function completeMagicLinkSignIn(email?: string): Promise<User> {
  try {
    const storedEmail = typeof window !== "undefined" ? window.localStorage.getItem("emailForSignIn") : null
    const emailToUse = email || storedEmail

    if (!emailToUse) {
      throw new Error("No email found for sign-in. Please enter your email again.")
    }
    
    const result = await signInWithEmailLink(auth, emailToUse, window.location.href)

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("emailForSignIn")
    }

    return result.user
  } catch (error: unknown) {
    console.error("Error completing magic link sign-in:", error)
    throw error
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

/**
 * Subscribe to authentication state changes
 */
export function subscribeToAuthStateChanges(callback: (user: User | null) => void): () => void {
  // Guard against SSR - auth is a placeholder object on server
  if (typeof window === "undefined") {
    return () => {}
  }
  
  // Check if auth is properly initialized
  if (!auth || typeof auth.onIdTokenChanged !== "function") {
    // Firebase not properly initialized, call callback with null immediately
    setTimeout(() => callback(null), 0)
    return () => {}
  }
  
  try {
    return onAuthStateChanged(auth, callback)
  } catch {
    // If subscription fails, call callback with null
    setTimeout(() => callback(null), 0)
    return () => {}
  }
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser
}

/**
 * Initialize the invisible reCAPTCHA verifier for phone auth
 * Must be called before sendPhoneVerificationCode
 */
export function initRecaptchaVerifier(buttonId: string): RecaptchaVerifier | null {
  // Check if auth is properly initialized
  if (!auth || typeof auth.onIdTokenChanged !== "function") {
    console.warn("Firebase auth not initialized, skipping reCAPTCHA setup")
    return null
  }

  // Clean up existing verifier if present
  if (recaptchaVerifier) {
    recaptchaVerifier.clear()
    recaptchaVerifier = null
  }

  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved - allow sign-in
      },
      "expired-callback": () => {
        // reCAPTCHA expired - reset
      },
    })

    return recaptchaVerifier
  } catch (error) {
    console.warn("Failed to initialize reCAPTCHA:", error)
    return null
  }
}

/**
 * Send a verification code to the user's phone number
 */
export async function sendPhoneVerificationCode(phoneNumber: string): Promise<void> {
  if (!recaptchaVerifier) {
    throw new Error("reCAPTCHA verifier not initialized. Call initRecaptchaVerifier first.")
  }

  try {
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
  } catch (error: unknown) {
    console.error("Error sending phone verification code:", error)
    if (recaptchaVerifier) {
      recaptchaVerifier.clear()
      recaptchaVerifier = null
    }
    throw error
  }
}

/**
 * Verify the phone verification code and complete sign-in
 */
export async function verifyPhoneCode(code: string): Promise<User> {
  if (!confirmationResult) {
    throw new Error("No verification in progress. Please request a new code.")
  }

  try {
    const result = await confirmationResult.confirm(code)
    confirmationResult = null
    return result.user
  } catch (error) {
    console.error("Error verifying phone code:", error)
    throw error
  }
}

/**
 * Clear the phone auth state (useful for starting over)
 */
export function clearPhoneAuthState(): void {
  confirmationResult = null
  if (recaptchaVerifier) {
    recaptchaVerifier.clear()
    recaptchaVerifier = null
  }
}
