"use client"

import { X, User, Calendar, MapPin, Users, FileText, Star, Clock, CheckCircle, TrendingUp, Edit } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import type { Character } from "@/types/casting"
import { openModal } from "@/components/modals/ModalManager"

interface CharacterDetailsModalProps {
  onClose: () => void
  character: Character
}

export default function CharacterDetailsModal({ onClose, character }: CharacterDetailsModalProps) {
  const { state } = useCasting()

  // Calculate character statistics
  const getCharacterStats = () => {
    const allActors = [
      ...character.actors.longList,
      ...character.actors.audition,
      ...character.actors.approval,
      ...character.actors.shortLists.flatMap((sl) => sl.actors),
      ...Object.entries(character.actors)
        .filter(([key]) => !["longList", "audition", "approval", "shortLists"].includes(key))
        .flatMap(([, actors]) => (Array.isArray(actors) ? actors : [])),
    ]

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

  // Get character relationships
  const getCharacterRelationships = () => {
    return (
      state.relationships?.filter((rel) => rel.character1Id === character.id || rel.character2Id === character.id) || []
    )
  }

  const relationships = getCharacterRelationships()

  // Get related characters
  const getRelatedCharacters = () => {
    return relationships
      .map((rel) => {
        const relatedCharacterId = rel.character1Id === character.id ? rel.character2Id : rel.character1Id
        const relatedCharacter = state.characters?.find((c) => c.id === relatedCharacterId)
        return {
          character: relatedCharacter,
          relationship: rel.description,
        }
      })
      .filter((item) => item.character)
  }

  const relatedCharacters = getRelatedCharacters()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{character.name}</h2>
              <p className="text-emerald-100 text-sm">Character Details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-emerald-600" />
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Age:</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {character.age || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Gender:</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {character.gender || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Ethnicity:</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {character.ethnicity || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Description</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {character.description || "No description provided."}
                </p>
              </div>

              {/* Casting Notes */}
              {character.castingNotes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Casting Notes
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">{character.castingNotes}</p>
                </div>
              )}
            </div>

            {/* Statistics and Relationships */}
            <div className="space-y-6">
              {/* Casting Statistics */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                  Casting Statistics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stats.totalActors}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Actors</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stats.pendingDecisions}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stats.greenlit}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Greenlit</p>
                  </div>
                </div>
              </div>

              {/* Character Relationships */}
              {relatedCharacters.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-emerald-600" />
                    Character Relationships
                  </h3>
                  <div className="space-y-3">
                    {relatedCharacters.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500"
                      >
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{item.character?.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{item.relationship}</p>
                        </div>
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actor Distribution by Stage */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Actor Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Long List</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {character.actors.longList.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Audition</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {character.actors.audition.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Approval</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {character.actors.approval.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Short Lists</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {character.actors.shortLists.reduce((total, sl) => total + sl.actors.length, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-700 px-6 py-4 border-t border-slate-200 dark:border-slate-600">
          <div className="flex justify-between">
            <button
              onClick={() => openModal("editCharacter", { character })}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Character</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
