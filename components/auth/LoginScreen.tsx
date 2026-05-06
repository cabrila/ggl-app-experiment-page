"use client"

import { useState } from "react"
import { Mail, Loader2, CheckCircle, Phone, ArrowLeft } from "lucide-react"

type AuthMethod = "email" | "phone"
type LoginState = "idle" | "loading" | "success" | "error" | "verify-code"

interface LoginScreenProps {
  onDemoAccess?: () => void
}

export default function LoginScreen({ onDemoAccess }: LoginScreenProps) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [loginState, setLoginState] = useState<LoginState>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isValidPhoneNumber = (phone: string) => {
    return /^\+[1-9]\d{9,14}$/.test(phone.replace(/\s/g, ""))
  }

  const formatPhoneNumber = (value: string) => {
    return value.replace(/[^\d+]/g, "")
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setErrorMessage("Please enter your email address")
      setLoginState("error")
      return
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address")
      setLoginState("error")
      return
    }

    setLoginState("loading")
    setErrorMessage("")

    // Simulate sending magic link
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setLoginState("success")
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanedPhone = phoneNumber.replace(/\s/g, "")

    if (!isValidPhoneNumber(cleanedPhone)) {
      setErrorMessage("Please enter a valid phone number with country code (e.g., +1234567890)")
      setLoginState("error")
      return
    }

    setLoginState("loading")
    setErrorMessage("")

    // Simulate sending verification code
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setLoginState("verify-code")
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()

    if (verificationCode.length !== 6) {
      setErrorMessage("Please enter the 6-digit verification code")
      setLoginState("error")
      return
    }

    setLoginState("loading")
    setErrorMessage("")

    // Simulate verification - in demo mode, just redirect
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onDemoAccess?.()
  }

  const handleSwitchMethod = (method: AuthMethod) => {
    setAuthMethod(method)
    setLoginState("idle")
    setErrorMessage("")
    setEmail("")
    setPhoneNumber("")
    setVerificationCode("")
  }

  const handleBack = () => {
    setLoginState("idle")
    setErrorMessage("")
    setVerificationCode("")
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{
        background:
          "linear-gradient(180deg, #2d6b3f 0%, #1a4a2a 30%, #0f3520 55%, #0a2618 80%, #061a10 100%)",
      }}
    >
      {/* Demo Access Button */}
      {onDemoAccess && (
        <button
          onClick={onDemoAccess}
          aria-label="Enter demo as John Doe"
          className="absolute top-5 right-5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/35 transition-all duration-200 text-white/60 hover:text-white/90 text-xs font-sans"
        >
          Demo
        </button>
      )}

      {/* Logo */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-white">GoGreenlight</h1>
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
        {loginState === "success" && authMethod === "email" && (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-[#b8e986]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2 font-sans">
              Check your email
            </h2>
            <p className="text-white/70 text-sm leading-relaxed font-sans">
              {"We've sent a magic link to"}
              <br />
              <span className="text-white font-medium">{email}</span>
            </p>
            <button
              onClick={() => {
                setLoginState("idle")
                setEmail("")
              }}
              className="mt-6 text-[#b8e986] hover:text-[#c8f096] text-sm underline underline-offset-2 transition-colors font-sans"
            >
              Use a different email
            </button>
          </div>
        )}

        {/* Verification Code State - Phone */}
        {loginState === "verify-code" && authMethod === "phone" && (
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
                  Enter the 6-digit code sent to
                  <br />
                  <span className="text-white font-medium">{phoneNumber}</span>
                </p>
              </div>

              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setVerificationCode(value)
                  if (loginState === "error") {
                    setLoginState("verify-code")
                    setErrorMessage("")
                  }
                }}
                placeholder="000000"
                className="w-full px-5 py-4 bg-white rounded-2xl text-gray-700 placeholder-gray-400 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#b8e986] transition-shadow font-sans"
                disabled={loginState === "loading"}
                autoComplete="one-time-code"
                inputMode="numeric"
                autoFocus
              />

              {loginState === "error" && errorMessage && (
                <p className="text-red-300 text-sm text-center font-sans">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={loginState === "loading" || verificationCode.length !== 6}
                className="w-full py-4 bg-[#b8e986] hover:bg-[#c8f096] disabled:bg-[#b8e986]/50 disabled:cursor-not-allowed rounded-2xl text-[#2d5a3d] font-semibold text-base transition-colors flex items-center justify-center gap-2 font-sans"
              >
                {loginState === "loading" ? (
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

        {/* Idle/Error States - Show Form */}
        {(loginState === "idle" || loginState === "error" || loginState === "loading") &&
          loginState !== "verify-code" &&
          loginState !== "success" && (
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
                        if (loginState === "error") {
                          setLoginState("idle")
                          setErrorMessage("")
                        }
                      }}
                      placeholder="Enter your email"
                      className="w-full px-5 py-4 bg-white rounded-2xl text-gray-700 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#b8e986] transition-shadow font-sans"
                      disabled={loginState === "loading"}
                      autoComplete="email"
                      autoFocus
                    />
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>

                  {loginState === "error" && errorMessage && (
                    <p className="text-red-300 text-sm text-center font-sans">{errorMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loginState === "loading" || !email.trim()}
                    className="w-full py-4 bg-[#b8e986] hover:bg-[#c8f096] disabled:bg-[#b8e986]/50 disabled:cursor-not-allowed rounded-2xl text-[#2d5a3d] font-semibold text-base transition-colors flex items-center justify-center gap-2 font-sans"
                  >
                    {loginState === "loading" ? (
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
                        if (loginState === "error") {
                          setLoginState("idle")
                          setErrorMessage("")
                        }
                      }}
                      placeholder="+1 234 567 8900"
                      className="w-full px-5 py-4 bg-white rounded-2xl text-gray-700 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#b8e986] transition-shadow font-sans"
                      disabled={loginState === "loading"}
                      autoComplete="tel"
                      autoFocus
                    />
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>

                  <p className="text-white/40 text-xs text-center font-sans">
                    Include your country code (e.g., +1 for US)
                  </p>

                  {loginState === "error" && errorMessage && (
                    <p className="text-red-300 text-sm text-center font-sans">{errorMessage}</p>
                  )}

                  <button
                    id="phone-sign-in-button"
                    type="submit"
                    disabled={loginState === "loading" || !phoneNumber.trim()}
                    className="w-full py-4 bg-[#b8e986] hover:bg-[#c8f096] disabled:bg-[#b8e986]/50 disabled:cursor-not-allowed rounded-2xl text-[#2d5a3d] font-semibold text-base transition-colors flex items-center justify-center gap-2 font-sans"
                  >
                    {loginState === "loading" ? (
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
        2026 GoGreenlight. All rights reserved.
      </p>
    </div>
  )
}
