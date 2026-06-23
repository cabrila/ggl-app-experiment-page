"use client"

import { useState } from "react"
import { Mail, Loader2, CheckCircle } from "lucide-react"
import { sendMagicLink } from "@/lib/auth"

// Single source of truth: which screen are we showing
type Screen = "enter-credential" | "success"

// AI: The internal tools are limited to @gogreenlight.ai accounts on the
// Preview (staging) environment. NEXT_PUBLIC_VERCEL_ENV is auto-exposed by
// Vercel ("production" | "preview" | "development"); surface the restriction
// on Preview only so Production never advertises it.
const RESTRICTED_DOMAIN = "gogreenlight.ai"
const RESTRICT_TO_DOMAIN = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"

interface LoginScreenProps {
  onDemoAccess?: () => void
  onSignedIn?: () => void
}

export default function LoginScreen({ onDemoAccess }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [screen, setScreen] = useState<Screen>("enter-credential")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setErrorMessage("Please enter your email address")
      return
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address")
      return
    }

    // AI: Preview-only gate — make the @gogreenlight.ai restriction explicit
    // here instead of letting it fall through to the generic "Failed to send"
    // error. Production is unaffected (RESTRICT_TO_DOMAIN is false there).
    if (RESTRICT_TO_DOMAIN && !email.trim().toLowerCase().endsWith(`@${RESTRICTED_DOMAIN}`)) {
      setErrorMessage(`Access is limited to @${RESTRICTED_DOMAIN} accounts. Please sign in with your GoGreenlight email.`)
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    try {
      await sendMagicLink(email)
      setScreen("success")
    } catch (error: unknown) {
      let errorMsg = "Failed to send magic link. Please try again."
      if (error && typeof error === "object" && "code" in error) {
        const code = (error as { code: string }).code
        if (code === "auth/invalid-email") {
          errorMsg = "Invalid email address."
        } else if (code === "auth/missing-continue-uri") {
          errorMsg = "Configuration error. Please contact support."
        } else if (code === "auth/unauthorized-continue-uri") {
          errorMsg = "Domain not authorized. Please contact support."
        }
      }
      setErrorMessage(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{
        background:
          "linear-gradient(180deg, #2d6b3f 0%, #1a4a2a 30%, #0f3520 55%, #0a2618 80%, #061a10 100%)",
      }}
    >
      {/* Demo user access: routes to the Demo account with demo data available immediately */}
      {onDemoAccess && (
        <button
          onClick={onDemoAccess}
          aria-label="Demo User"
          className="absolute top-5 right-5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/35 transition-all duration-200 text-white/60 hover:text-white/90 text-xs font-sans"
        >
          Demo User
        </button>
      )}

      {/* Logo */}
      <div className="mb-12">
        <img
          src="/gogreenlight-logo.png"
          alt="GoGreenlight"
          className="h-16 w-auto"
        />
      </div>

      {/* Welcome Text */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 font-sans text-balance leading-tight">
          Every creative
          <br />
          asset. <span className="text-emerald-300">One platform.</span>
        </h1>
        <p className="text-white/70 text-base md:text-lg font-sans max-w-md">
          A creative tool for film and television creators to organize and manage their creative assets.
        </p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md">
        {/* Success State */}
        {screen === "success" ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-[#b8e986]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2 font-sans">
              Check your email
            </h2>
            <p className="text-white/70 text-sm leading-relaxed font-sans">
              We&apos;ve sent a magic link to<br />
              <span className="text-white font-medium">{email}</span>
            </p>
            <button
              onClick={() => {
                setScreen("enter-credential")
                setEmail("")
              }}
              className="mt-6 text-[#b8e986] hover:text-[#c8f096] text-sm underline underline-offset-2 transition-colors font-sans"
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* Credential Entry Screen — email magic link */
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errorMessage) setErrorMessage("")
                }}
                placeholder="Enter your email"
                className="w-full px-5 py-4 bg-white rounded-2xl text-gray-700 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#b8e986] transition-shadow font-sans"
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {errorMessage && (
              <p className="text-red-300 text-sm text-center font-sans">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-4 bg-[#b8e986] hover:bg-[#c8f096] disabled:bg-[#b8e986]/50 disabled:cursor-not-allowed rounded-2xl text-[#2d5a3d] font-semibold text-base transition-colors flex items-center justify-center gap-2 font-sans"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending magic link...
                </>
              ) : (
                "Send magic link"
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="mt-12 text-[11px] text-white/30 text-center font-sans">
        © 2026 GoGreenlight. All rights reserved.
      </p>
    </div>
  )
}
