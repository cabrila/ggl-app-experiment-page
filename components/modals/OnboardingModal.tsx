"use client"

import { useState, useEffect } from "react"
import {
  X,
  ArrowLeft,
  ArrowRight,
  BookUser,
  MapPin,
  Package,
  Film,
  Users,
  Megaphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

interface OnboardingModalProps {
  onClose: () => void
}

interface Step {
  icon: LucideIcon
  title: string
  tagline: string
  description: string
  iconBg: string
  iconColor: string
  accent: string
}

// Friendly, non-technical walkthrough of the six major feature pages.
// Written for someone who has never used the app and doesn't yet know why each tool matters.
const steps: Step[] = [
  {
    icon: Sparkles,
    title: "Welcome to GoGreenlight",
    tagline: "Your whole production, organized in one place",
    description:
      "Making a film or video means juggling a lot of moving pieces. GoGreenlight turns your script into clear, easy-to-manage lists so nothing slips through the cracks. Let's take a quick tour of the six tools you'll use.",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    accent: "bg-emerald-500",
  },
  {
    icon: BookUser,
    title: "Character Bible",
    tagline: "Get to know everyone in your story",
    description:
      "This is your cast of characters. For each person in your script, you can keep notes on who they are, what they look like, and how they fit into the story. It's the go-to reference so everyone on your team pictures each character the same way.",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    accent: "bg-emerald-500",
  },
  {
    icon: MapPin,
    title: "Location Scouting",
    tagline: "Keep track of every place your story unfolds",
    description:
      "Every scene happens somewhere - a kitchen, a park, a busy street. Here you collect all the places your shoot needs, with details and photos in one spot. No more hunting through emails to remember where you planned to film.",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    accent: "bg-amber-500",
  },
  {
    icon: Package,
    title: "Prop List",
    tagline: "Never forget the things your scenes need",
    description:
      "Props are the objects your characters use - a coffee mug, a phone, a vintage car. This list makes sure every item is accounted for before the cameras roll, so you're never scrambling to find something on shoot day.",
    iconBg: "bg-rose-500/20",
    iconColor: "text-rose-400",
    accent: "bg-rose-500",
  },
  {
    icon: Film,
    title: "Scene List",
    tagline: "Break your script into bite-sized pieces",
    description:
      "Your script is split into individual scenes here, so you can see your whole story at a glance. It's the backbone that ties everything together - characters, locations, and props all connect back to the scenes they appear in.",
    iconBg: "bg-teal-500/20",
    iconColor: "text-teal-400",
    accent: "bg-teal-500",
  },
  {
    icon: Users,
    title: "Actor List",
    tagline: "Build your personal roster of talent",
    description:
      "Keep all the actors you're considering in one organized place. Save their details, sort through your options, and stay on top of who you want for each role - your own private little black book of talent.",
    iconBg: "bg-sky-500/20",
    iconColor: "text-sky-400",
    accent: "bg-sky-500",
  },
  {
    icon: Megaphone,
    title: "Public Casting",
    tagline: "Find new faces and collect auditions",
    description:
      "Need to discover fresh talent? Post a casting call and let actors submit themselves directly to you. Their submissions land neatly in your Actor List, so you can review everyone in the same place. You're all set - explore each tool whenever you're ready!",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    accent: "bg-violet-500",
  },
]

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = steps[stepIndex]
  const Icon = step.icon
  const isFirst = stepIndex === 0
  const isLast = stepIndex === steps.length - 1

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const goNext = () => {
    if (isLast) {
      onClose()
    } else {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1))
    }
  }

  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        className="relative w-full max-w-md bg-[#1a3a25] border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="text-xs font-medium text-white/50 font-sans uppercase tracking-wide">
            {isFirst ? "Getting Started" : `Step ${stepIndex} of ${steps.length - 1}`}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-7 flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-2xl ${step.iconBg} flex items-center justify-center mb-5`}>
            <Icon className={`w-8 h-8 ${step.iconColor}`} />
          </div>

          <h2 id="onboarding-title" className="text-xl font-bold text-white font-sans text-balance">
            {step.title}
          </h2>
          <p className={`mt-1 text-sm font-semibold ${step.iconColor} font-sans text-pretty`}>
            {step.tagline}
          </p>
          <p className="mt-4 text-sm text-white/70 leading-relaxed font-sans text-pretty">
            {step.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pb-5">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setStepIndex(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === stepIndex ? `w-6 ${s.accent}` : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-white/10">
          <button
            onClick={goBack}
            disabled={isFirst}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-0 disabled:pointer-events-none transition-all font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={isFirst ? onClose : undefined}
            className={`text-sm font-medium text-white/40 hover:text-white/70 transition-colors font-sans ${
              isFirst ? "" : "hidden"
            }`}
          >
            Skip tour
          </button>

          <button
            onClick={goNext}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-semibold text-white transition-colors font-sans"
          >
            <span>{isFirst ? "Start tour" : isLast ? "Got it" : "Next"}</span>
            {!isLast && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
