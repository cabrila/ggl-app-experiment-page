"use client"

import { useState, useEffect, useRef } from "react"
import { Mail, Loader2, CheckCircle, Phone, ArrowLeft } from "lucide-react"
import {
  sendMagicLink,
  initRecaptchaVerifierAsync,
  sendPhoneVerificationCode,
  verifyPhoneCode,
  clearPhoneAuthState,
} from "@/lib/auth"

type AuthMethod = "email" | "phone"
// Single source of truth: which screen are we showing
type Screen = "enter-credential" | "verify-code" | "success"

interface LoginScreenProps {
  onDemoAccess?: () => void
  onSignedIn?: () => void
}

export default function LoginScreen({ onDemoAccess, onSignedIn }: LoginScreenProps) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [screen, setScreen] = useState<Screen>("enter-credential")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const recaptchaInitialized = useRef(false)

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isValidPhoneNumber = (phone: string) => {
    // Basic validation: starts with + and has at least 10 digits
    return /^\+[1-9]\d{9,14}$/.test(phone.replace(/\s/g, ""))
  }

  const formatPhoneNumber = (value: string) => {
    // Allow only + and digits
    return value.replace(/[^\d+]/g, "")
  }

  // Initialize reCAPTCHA when switching to phone auth
  useEffect(() => {
    let cancelled = false
    
    if (authMethod === "phone" && !recaptchaInitialized.current && typeof window !== "undefined") {
      // Use async version that waits for auth to be ready
      const initAsync = async () => {
        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100))
        if (cancelled) return
        
        const verifier = await initRecaptchaVerifierAsync("phone-sign-in-button")
        if (verifier && !cancelled) {
          recaptchaInitialized.current = true
        }
      }
      initAsync()
    }
    
    return () => {
      cancelled = true
    }
  }, [authMethod])

  // Clean up only on full unmount (component leaves the tree)
  useEffect(() => {
    return () => {
      clearPhoneAuthState()
      recaptchaInitialized.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanedPhone = phoneNumber.replace(/\s/g, "")

    if (!isValidPhoneNumber(cleanedPhone)) {
      setErrorMessage("Please enter a valid phone number with country code (e.g., +1234567890)")
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    // Ensure reCAPTCHA is initialized before attempting to send code
    if (!recaptchaInitialized.current) {
      const verifier = await initRecaptchaVerifierAsync("phone-sign-in-button")
      if (verifier) {
        recaptchaInitialized.current = true
      } else {
        setErrorMessage("Failed to initialize verification. Please refresh and try again.")
        setIsLoading(false)
        return
      }
    }

    try {
      await sendPhoneVerificationCode(cleanedPhone)
      setScreen("verify-code")
    } catch (error) {
      let errorMsg = "Failed to send verification code. Please try again."
      if (error && typeof error === "object" && "code" in error) {
        const code = (error as { code: string }).code
        const message = (error as { message?: string }).message
        if (code === "auth/too-many-requests") {
          errorMsg = "Too many attempts from this number. Firebase has temporarily blocked SMS to this phone. Wait a few hours or use a different number."
        } else if (code === "auth/invalid-phone-number") {
          errorMsg = "Invalid phone number format. Use +countrycode followed by the number."
        } else if (code === "auth/quota-exceeded") {
          errorMsg = "SMS quota exceeded on this Firebase project. Check Firebase Console billing/quota."
        } else if (code === "auth/captcha-check-failed") {
          errorMsg = "reCAPTCHA check failed. Refresh the page and try again."
        } else if (code === "auth/operation-not-allowed") {
          errorMsg = "Phone sign-in not enabled in Firebase Console → Authentication → Sign-in method."
        } else {
          errorMsg = `${code}${message ? ": " + message : ""}`
        }
      } else if (error instanceof Error) {
        errorMsg = error.message
      }
      setErrorMessage(errorMsg)
      recaptchaInitialized.current = false
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()

    if (verificationCode.length !== 6) {
      setErrorMessage("Please enter the 6-digit verification code")
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    try {
      console.log("[v0] LoginScreen: calling verifyPhoneCode...")
      const verifiedUser = await verifyPhoneCode(verificationCode)
      console.log("[v0] LoginScreen: verifyPhoneCode resolved, uid:", verifiedUser.uid, "— invoking onSignedIn:", typeof onSignedIn)
      setIsLoading(false)
      // Explicitly notify parent that sign-in succeeded. The parent reconciles
      // routing via a useEffect on `user`, so this is a redundant safety net.
      onSignedIn?.()
    } catch (error) {
      console.error("[v0] LoginScreen: verifyPhoneCode threw:", error)
      setIsLoading(false)
      let errorMsg = "Invalid verification code. Please try again."
      if (error && typeof error === "object" && "code" in error) {
        const code = (error as { code: string }).code
        if (code === "auth/invalid-verification-code") {
          errorMsg = "Invalid code. Please check the digits and try again."
        } else if (code === "auth/code-expired") {
          errorMsg = "Code expired. Go back and request a new one."
        } else {
          const message = (error as { message?: string }).message
          errorMsg = `${code}${message ? ": " + message : ""}`
        }
      } else if (error instanceof Error) {
        errorMsg = error.message
      }
      setErrorMessage(errorMsg)
      setIsLoading(false)
    }
  }

  const handleSwitchMethod = (method: AuthMethod) => {
    setAuthMethod(method)
    setScreen("enter-credential")
    setIsLoading(false)
    setErrorMessage("")
    setEmail("")
    setPhoneNumber("")
    setVerificationCode("")
    clearPhoneAuthState()
    recaptchaInitialized.current = false
  }

  const handleBack = () => {
    setScreen("enter-credential")
    setIsLoading(false)
    setErrorMessage("")
    setVerificationCode("")
    clearPhoneAuthState()
    recaptchaInitialized.current = false
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
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

      {/* Welcome Text */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 font-sans">
          Welcome!
        </h1>
        <p className="text-white/70 text-base md:text-lg font-sans max-w-md">
          A creative tool for film and television creators to organize and manage their creative assets.
        </p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md">
        {/* Success State - Email */}
        {screen === "success" && authMethod === "email" && (
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
        )}

        {/* Verification Code Screen - Phone */}
        {screen === "verify-code" && authMethod === "phone" && (
          <div>
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-white/60 hover:text-white/90 text-sm mb-6 transition-colors font-sans"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="text-center mb-4">
                <p className="text-white/70 text-sm font-sans">
                  Enter the 6-digit code sent to<br />
                  <span className="text-white font-medium">{phoneNumber}</span>
                </p>
              </div>

              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setVerificationCode(value)
                  if (errorMessage) setErrorMessage("")
                }}
                placeholder="000000"
                className="w-full px-5 py-4 bg-white rounded-2xl text-gray-700 placeholder-gray-400 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#b8e986] transition-shadow font-sans"
                disabled={isLoading}
                autoComplete="one-time-code"
                inputMode="numeric"
                autoFocus
              />

              {errorMessage && (
                <p className="text-red-300 text-sm text-center font-sans">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full py-4 bg-[#b8e986] hover:bg-[#c8f096] disabled:bg-[#b8e986]/50 disabled:cursor-not-allowed rounded-2xl text-[#2d5a3d] font-semibold text-base transition-colors flex items-center justify-center gap-2 font-sans"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify code"
                )}
              </button>
            </form>
          </div>
        )}

        {/* Credential Entry Screen */}
        {screen === "enter-credential" && (
            <div>
              {/* Auth Method Tabs */}
              <div className="flex mb-6 bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => handleSwitchMethod("email")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all font-sans ${
                    authMethod === "email"
                      ? "bg-white/15 text-white"
                      : "text-white/50 hover:text-white/70"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button
                  onClick={() => handleSwitchMethod("phone")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all font-sans ${
                    authMethod === "phone"
                      ? "bg-white/15 text-white"
                      : "text-white/50 hover:text-white/70"
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  Phone
                </button>
              </div>

              {/* Email Form */}
              {authMethod === "email" && (
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

              {/* Phone Form */}
              {authMethod === "phone" && (
                <form onSubmit={handlePhoneSubmit} className="space-y-5">
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(formatPhoneNumber(e.target.value))
                        if (errorMessage) setErrorMessage("")
                      }}
                      placeholder="+1 234 567 8900"
                      className="w-full px-5 py-4 bg-white rounded-2xl text-gray-700 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#b8e986] transition-shadow font-sans"
                      disabled={isLoading}
                      autoComplete="tel"
                      autoFocus
                    />
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>

                  <p className="text-white/40 text-xs text-center font-sans">
                    Include your country code (e.g., +1 for US)
                  </p>

                  {errorMessage && (
                    <p className="text-red-300 text-sm text-center font-sans">{errorMessage}</p>
                  )}

                  <button
                    id="phone-sign-in-button"
                    type="submit"
                    disabled={isLoading || !phoneNumber.trim()}
                    className="w-full py-4 bg-[#b8e986] hover:bg-[#c8f096] disabled:bg-[#b8e986]/50 disabled:cursor-not-allowed rounded-2xl text-[#2d5a3d] font-semibold text-base transition-colors flex items-center justify-center gap-2 font-sans"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      "Send verification code"
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
      </div>

      {/* Footer */}
      <p className="mt-12 text-[11px] text-white/30 text-center font-sans">
        © 2026 GoGreenlight. All rights reserved.
      </p>
    </div>
  )
}
