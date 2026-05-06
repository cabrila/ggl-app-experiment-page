"use client"

import type { Character } from "@/types/casting"
import { useCasting } from "@/components/casting/CastingContext"
import { User, Clock, CheckCircle, TrendingUp } from "lucide-react"
import { openModal } from "@/components/modals/ModalManager"
import type { Actor, ShortList } from "@/types/casting"

interface CharacterHeaderProps {
  character?: Character
}

export default function CharacterHeader({ character }: CharacterHeaderProps) {
  const { state } = useCasting()

  const showCharacterDetails = () => {
    if (character) {
      openModal("characterDetails", { character })
    }
  }

  // Calculate statistics for the character
  const getCharacterStats = () => {
    if (!character || !character.actors) {
      return { totalActors: 0, pendingDecisions: 0, greenlit: 0 }
    }

    // Destructure with sensible fall-backs to prevent “undefined is not an object” errors
    const {
      longList = [],
      audition = [],
      approval = [],
      shortLists = [],
      // any additional dynamic lists remain accessible via the rest operator
      ...restLists
    } = character.actors as Record<string, any>

    const dynamicActors = Object.entries(restLists)
      .filter(([, value]) => Array.isArray(value)) // only arrays, ignore metadata
      .flatMap(([, value]) => value as Actor[])

    const shortlistActors = Array.isArray(shortLists)
      ? (shortLists as ShortList[]).flatMap((sl) => sl.actors ?? [])
      : []

    const allActors: Actor[] = [...longList, ...audition, ...approval, ...shortlistActors, ...dynamicActors]

    const totalActors = allActors.length
    const greenlit = allActors.filter((actor) => actor.isGreenlit || actor.isCast).length

    const pendingDecisions = allActors.filter((actor) => {
      if (actor.isGreenlit || actor.isCast) return false

      const votes = Object.values(actor.userVotes || {})
      const totalUsers = state.users.length

      return (
        votes.length > 0 &&
        (votes.length < totalUsers || !actor.consensusAction || actor.consensusAction.type === "stay")
      )
    }).length

    return { totalActors, pendingDecisions, greenlit }
  }

  const stats = getCharacterStats()

  return (
    <header className="bg-gradient-to-r from-white via-slate-50 to-white border-b border-slate-200/60 shadow-sm">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Casting for:{" "}
                <span
                  className="text-emerald-600 cursor-pointer hover:text-emerald-700 hover:underline transition-all duration-200 decoration-2 underline-offset-2"
                  onClick={showCharacterDetails}
                  title="Click to view detailed character information"
                >
                  {character?.name || "N/A"}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Total Actors */}
            <div className="flex items-center space-x-2 rounded-2xl px-4 py-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Actors</p>
                <p className="text-sm font-bold text-slate-800">{stats.totalActors}</p>
              </div>
            </div>

            {/* Pending Decisions */}
            <div className="flex items-center space-x-2 rounded-2xl px-4 py-2">
              <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                <Clock className="w-3 h-3 text-white" />
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending</p>
                <p className="text-sm font-bold text-slate-800">{stats.pendingDecisions}</p>
              </div>
            </div>

            {/* Greenlit */}
            <div className="flex items-center space-x-2 rounded-2xl px-4 py-2">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Greenlit</p>
                <p className="text-sm font-bold text-slate-800">{stats.greenlit}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
