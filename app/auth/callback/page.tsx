"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react"
import { isMagicLinkCallback, completeMagicLinkSignIn } from "@/lib/auth"

type CallbackState = "verifying" | "need-email" | "success" | "error"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [state, setState] = useState<CallbackState>("verifying")
  const [email, setEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    console.log("[v0] Auth callback page loaded")
    console.log("[v0] Current URL:", window.location.href)
    
    const isValidLink = isMagicLinkCallback()
    console.log("[v0] Is valid magic link:", isValidLink)

    if (!isValidLink) {
      console.log("[v0] Not a valid magic link, redirecting to home")
      router.push("/")
      return
    }

    // Check if we have stored email
    const storedEmail = window.localStorage.getItem("emailForSignIn")
    console.log("[v0] Stored email:", storedEmail)

    if (!storedEmail) {
      // Need user to re-enter email
      console.log("[v0] No stored email, asking user to enter email")
      setState("need-email")
      return
    }

    // Attempt to complete sign-in
    handleSignIn(storedEmail)
  }, [router])

  const handleSignIn = async (emailToUse: string) => {
    console.log("[v0] Attempting sign-in with email:", emailToUse)
    console.log("[v0] Full URL for verification:", window.location.href)
    
    try {
      const user = await completeMagicLinkSignIn(emailToUse)
      console.log("[v0] Sign-in successful! User:", user.email)
      setState("success")
      
      // Redirect to home after short delay - auth state will show splash screen
      setTimeout(() => {
        // Clear the URL parameters by replacing the history state
        window.history.replaceState({}, document.title, "/")
        router.push("/")
      }, 1500)
    } catch (error: unknown) {
      console.error("[v0] Sign-in failed:", error)
      
      let message = "Failed to verify magic link. Please try again."
      if (error && typeof error === "object" && "code" in error) {
        const code = (error as { code: string }).code
        console.error("[v0] Firebase error code:", code)
        
        if (code === "auth/invalid-action-code") {
          message = "This magic link has expired or already been used. Please request a new one."
        } else if (code === "auth/invalid-email") {
          message = "Invalid email address. Please try again."
        }
      }
      
      setErrorMessage(message)
      setState("error")
    }
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    handleSignIn(email)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background:
          "linear-gradient(180deg, #2d6b3f 0%, #1a4a2a 30%, #0f3520 55%, #0a2618 80%, #061a10 100%)",
      }}
    >
      {/* Logo */}
      <div className="mb-12">
        <img
          src="/gogreenlight-logo.png"
          alt="GoGreenlight"
          className="h-16 w-auto"
        />
      </div>

      {/* Verifying State */}
      {state === "verifying" && (
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#b8e986] animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2 font-sans">
            Verifying your magic link...
          </h2>
          <p className="text-white/60 text-sm font-sans">
            Please wait while we sign you in.
          </p>
        </div>
      )}

      {/* Need Email State */}
      {state === "need-email" && (
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <Mail className="w-12 h-12 text-[#b8e986] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2 font-sans">
              Confirm your email
            </h2>
            <p className="text-white/60 text-sm font-sans">
              Please enter the email address you used to request the magic link.
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-5 py-4 bg-white rounded-2xl text-gray-700 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#b8e986] transition-shadow font-sans"
              autoComplete="email"
              autoFocus
            />
            <button
              type="submit"
              disabled={!email.trim()}
              className="w-full py-4 bg-[#b8e986] hover:bg-[#c8f096] disabled:bg-[#b8e986]/50 disabled:cursor-not-allowed rounded-2xl text-[#2d5a3d] font-semibold text-base transition-colors font-sans"
            >
              Continue
            </button>
          </form>
        </div>
      )}

      {/* Success State */}
      {state === "success" && (
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-[#b8e986] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2 font-sans">
            You&apos;re signed in!
          </h2>
          <p className="text-white/60 text-sm font-sans">
            Redirecting you to the app...
          </p>
        </div>
      )}

      {/* Error State */}
      {state === "error" && (
        <div className="text-center w-full max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2 font-sans">
            Verification failed
          </h2>
          <p className="text-red-300 text-sm mb-6 font-sans">
            {errorMessage}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-medium transition-colors font-sans"
          >
            Back to login
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="mt-12 text-[11px] text-white/30 text-center font-sans">
        © 2026 GoGreenlight. All rights reserved.
      </p>
    </div>
  )
}
