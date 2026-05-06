"use client"

import { useState } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { X, Users, TrendingUp, MessageSquare, Star, Clock, AlertTriangle, CheckCircle, Lightbulb, Target, BarChart3, UserCheck } from 'lucide-react'

interface TeamSuggestionsModalProps {
  onClose: () => void
}

export default function TeamSuggestionsModal({ onClose }: TeamSuggestionsModalProps) {
  const { state, dispatch } = useCasting()
  const [activeTab, setActiveTab] = useState<"insights" | "recommendations" | "collaboration" | "workflow">("insights")

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)

  if (!currentProject) {
    return (
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Team Suggestions</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600">No project selected</p>
        </div>
      </div>
    )
  }

  // Calculate team insights
  const getTeamInsights = () => {
    const totalVotes = currentProject.characters.reduce((sum, char) => {
      return (
        sum +
        [
          ...char.actors.longList,
          ...char.actors.shortLists.flatMap((sl) => sl.actors),
          ...char.actors.audition,
          ...char.actors.approval,
        ].reduce((voteSum, actor) => voteSum + Object.keys(actor.userVotes).length, 0)
      )
    }, 0)

    const userActivity = state.users.map((user) => {
      const userVotes = currentProject.characters.reduce((sum, char) => {
        return (
          sum +
          [
            ...char.actors.longList,
            ...char.actors.shortLists.flatMap((sl) => sl.actors),
            ...char.actors.audition,
            ...char.actors.approval,
          ].filter((actor) => actor.userVotes[user.id]).length
        )
      }, 0)

      const userNotes = currentProject.characters.reduce((sum, char) => {
        return (
          sum +
          [
            ...char.actors.longList,
            ...char.actors.shortLists.flatMap((sl) => sl.actors),
            ...char.actors.audition,
            ...char.actors.approval,
          ].reduce((noteSum, actor) => noteSum + actor.notes.filter((note) => note.userId === user.id).length, 0)
        )
      }, 0)

      return {
        user,
        votes: userVotes,
        notes: userNotes,
        activity: userVotes + userNotes,
        participation: totalVotes > 0 ? Math.round((userVotes / totalVotes) * 100) : 0,
      }
    })

    const consensusRate =
      currentProject.characters.reduce((sum, char) => {
        const actorsWithConsensus = [
          ...char.actors.longList,
          ...char.actors.shortLists.flatMap((sl) => sl.actors),
          ...char.actors.audition,
          ...char.actors.approval,
        ].filter((actor) => actor.consensusAction).length

        const totalActors =
          char.actors.longList.length +
          char.actors.shortLists.reduce((slSum, sl) => slSum + sl.actors.length, 0) +
          char.actors.audition.length +
          char.actors.approval.length

        return sum + (totalActors > 0 ? actorsWithConsensus / totalActors : 0)
      }, 0) / Math.max(currentProject.characters.length, 1)

    return {
      totalVotes,
      userActivity,
      consensusRate: Math.round(consensusRate * 100),
      mostActiveUser: userActivity.reduce((prev, current) => (prev.activity > current.activity ? prev : current)),
      leastActiveUser: userActivity.reduce((prev, current) => (prev.activity < current.activity ? prev : current)),
    }
  }

  // Generate AI-powered recommendations
  const getRecommendations = () => {
    const insights = getTeamInsights()
    const recommendations = []

    // Activity-based recommendations
    if (insights.leastActiveUser.activity < insights.mostActiveUser.activity * 0.3) {
      recommendations.push({
        type: "engagement",
        priority: "high",
        title: "Low Team Engagement Detected",
        description: `${insights.leastActiveUser.user.name} has significantly lower participation. Consider assigning them specific characters or scheduling a check-in.`,
        action: "Schedule 1:1 meeting",
        icon: AlertTriangle,
        color: "text-red-600 bg-red-50",
      })
    }

    // Consensus recommendations
    if (insights.consensusRate < 60) {
      recommendations.push({
        type: "consensus",
        priority: "medium",
        title: "Improve Decision Making",
        description: `Only ${insights.consensusRate}% of actors have team consensus. Consider setting voting deadlines or discussion sessions.`,
        action: "Set voting guidelines",
        icon: Target,
        color: "text-yellow-600 bg-yellow-50",
      })
    }

    // Workflow recommendations
    const charactersWithoutActors = currentProject.characters.filter(
      (char) =>
        char.actors.longList.length === 0 &&
        char.actors.shortLists.length === 0 &&
        char.actors.audition.length === 0 &&
        char.actors.approval.length === 0,
    )

    if (charactersWithoutActors.length > 0) {
      recommendations.push({
        type: "workflow",
        priority: "high",
        title: "Characters Need Attention",
        description: `${charactersWithoutActors.length} character(s) have no actors assigned: ${charactersWithoutActors.map((c) => c.name).join(", ")}.`,
        action: "Assign casting priorities",
        icon: Clock,
        color: "text-orange-600 bg-orange-50",
      })
    }

    // Success recommendations
    const greenlitCharacters = currentProject.characters.filter((char) =>
      [
        ...char.actors.longList,
        ...char.actors.shortLists.flatMap((sl) => sl.actors),
        ...char.actors.audition,
        ...char.actors.approval,
      ].some((actor) => actor.isGreenlit),
    )

    if (greenlitCharacters.length > 0) {
      recommendations.push({
        type: "success",
        priority: "low",
        title: "Great Progress!",
        description: `${greenlitCharacters.length} character(s) have been successfully cast. The team is making excellent decisions.`,
        action: "Celebrate milestone",
        icon: CheckCircle,
        color: "text-green-600 bg-green-50",
      })
    }

    // Collaboration recommendations
    if (insights.totalVotes > 50 && insights.consensusRate > 80) {
      recommendations.push({
        type: "collaboration",
        priority: "low",
        title: "Excellent Team Collaboration",
        description:
          "High voting activity and consensus rate indicate strong team alignment. Consider this workflow for future projects.",
        action: "Document best practices",
        icon: Star,
        color: "text-blue-600 bg-blue-50",
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // Get collaboration insights
  const getCollaborationInsights = () => {
    const insights = getTeamInsights()

    const votingPatterns = state.users.map((user) => {
      const votes = currentProject.characters.reduce(
        (acc, char) => {
          const votes = [
            ...char.actors.longList,
            ...char.actors.shortLists.flatMap((sl) => sl.actors),
            ...char.actors.audition,
            ...char.actors.approval,
          ].filter((actor) => actor.userVotes[user.id])

          return {
            yes: acc.yes + votes.filter((actor) => actor.userVotes[user.id] === "yes").length,
            no: acc.no + votes.filter((actor) => actor.userVotes[user.id] === "no").length,
            maybe: acc.maybe + votes.filter((actor) => actor.userVotes[user.id] === "maybe").length,
          }
        },
        { yes: 0, no: 0, maybe: 0 },
      )

      const total = votes.yes + votes.no + votes.maybe
      return {
        user,
        votes,
        total,
        positivity: total > 0 ? Math.round((votes.yes / total) * 100) : 0,
        decisiveness: total > 0 ? Math.round(((votes.yes + votes.no) / total) * 100) : 0,
      }
    })

    const teamAgreement =
      currentProject.characters.reduce((sum, char) => {
        const actorsWithMultipleVotes = [
          ...char.actors.longList,
          ...char.actors.shortLists.flatMap((sl) => sl.actors),
          ...char.actors.audition,
          ...char.actors.approval,
        ].filter((actor) => Object.keys(actor.userVotes).length > 1)

        const agreementCount = actorsWithMultipleVotes.filter((actor) => {
          const votes = Object.values(actor.userVotes)
          const uniqueVotes = new Set(votes)
          return uniqueVotes.size === 1 // All votes are the same
        }).length

        return sum + (actorsWithMultipleVotes.length > 0 ? agreementCount / actorsWithMultipleVotes.length : 0)
      }, 0) / Math.max(currentProject.characters.length, 1)

    return {
      votingPatterns,
      teamAgreement: Math.round(teamAgreement * 100),
      mostPositive: votingPatterns.reduce((prev, current) => (prev.positivity > current.positivity ? prev : current)),
      mostDecisive: votingPatterns.reduce((prev, current) =>
        prev.decisiveness > current.decisiveness ? prev : current,
      ),
    }
  }

  const renderInsightsTab = () => {
    const insights = getTeamInsights()

    return (
      <div className="space-y-6">
        {/* Team Activity Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Votes</p>
                <p className="text-2xl font-bold text-blue-900">{insights.totalVotes}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Consensus Rate</p>
                <p className="text-2xl font-bold text-green-900">{insights.consensusRate}%</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Team Members</p>
                <p className="text-2xl font-bold text-purple-900">{state.users.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Individual Team Member Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Team Member Activity</h3>
          <div className="space-y-4">
            {insights.userActivity.map((userStats) => (
              <div key={userStats.user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ backgroundColor: userStats.user.bgColor, color: userStats.user.color }}
                  >
                    {userStats.user.initials}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{userStats.user.name}</h4>
                    <p className="text-sm text-gray-600">{userStats.user.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex space-x-4 text-sm">
                    <div>
                      <span className="font-medium">{userStats.votes}</span>
                      <span className="text-gray-500 ml-1">votes</span>
                    </div>
                    <div>
                      <span className="font-medium">{userStats.notes}</span>
                      <span className="text-gray-500 ml-1">notes</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{userStats.participation}% participation</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-semibold text-emerald-800">Most Active</h3>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{
                  backgroundColor: insights.mostActiveUser.user.bgColor,
                  color: insights.mostActiveUser.user.color,
                }}
              >
                {insights.mostActiveUser.user.initials}
              </div>
              <div>
                <p className="font-semibold text-emerald-800">{insights.mostActiveUser.user.name}</p>
                <p className="text-sm text-emerald-600">{insights.mostActiveUser.activity} total actions</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Clock className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-800">Needs Engagement</h3>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{
                  backgroundColor: insights.leastActiveUser.user.bgColor,
                  color: insights.leastActiveUser.user.color,
                }}
              >
                {insights.leastActiveUser.user.initials}
              </div>
              <div>
                <p className="font-semibold text-orange-800">{insights.leastActiveUser.user.name}</p>
                <p className="text-sm text-orange-600">{insights.leastActiveUser.activity} total actions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderRecommendationsTab = () => {
    const recommendations = getRecommendations()

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-6">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold">AI-Powered Recommendations</h3>
        </div>

        {recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`border rounded-lg p-6 ${rec.color.includes("red") ? "border-red-200" : rec.color.includes("yellow") ? "border-yellow-200" : rec.color.includes("orange") ? "border-orange-200" : rec.color.includes("green") ? "border-green-200" : "border-blue-200"}`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${rec.color}`}>
                    <rec.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{rec.title}</h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : rec.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{rec.description}</p>
                    <button className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 text-sm">
                      {rec.action}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Everything looks great!</h3>
            <p className="text-gray-600">Your team is working efficiently with no immediate recommendations.</p>
          </div>
        )}
      </div>
    )
  }

  const renderCollaborationTab = () => {
    const collaboration = getCollaborationInsights()

    return (
      <div className="space-y-6">
        {/* Team Agreement Overview */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Team Agreement Rate</h3>
            <span
              className={`text-2xl font-bold ${collaboration.teamAgreement > 70 ? "text-green-600" : collaboration.teamAgreement > 50 ? "text-yellow-600" : "text-red-600"}`}
            >
              {collaboration.teamAgreement}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-300 ${collaboration.teamAgreement > 70 ? "bg-green-500" : collaboration.teamAgreement > 50 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${collaboration.teamAgreement}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Percentage of actors where all team members voted the same way</p>
        </div>

        {/* Voting Patterns */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Individual Voting Patterns</h3>
          <div className="space-y-4">
            {collaboration.votingPatterns.map((pattern) => (
              <div key={pattern.user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ backgroundColor: pattern.user.bgColor, color: pattern.user.color }}
                  >
                    {pattern.user.initials}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{pattern.user.name}</h4>
                    <div className="flex space-x-4 text-xs text-gray-600">
                      <span className="text-green-600">{pattern.votes.yes} Yes</span>
                      <span className="text-red-600">{pattern.votes.no} No</span>
                      <span className="text-blue-600">{pattern.votes.maybe} Maybe</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    <div className="font-medium">{pattern.positivity}% Positive</div>
                    <div className="text-gray-500">{pattern.decisiveness}% Decisive</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collaboration Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Star className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Most Positive</h3>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{
                  backgroundColor: collaboration.mostPositive.user.bgColor,
                  color: collaboration.mostPositive.user.color,
                }}
              >
                {collaboration.mostPositive.user.initials}
              </div>
              <div>
                <p className="font-semibold text-green-800">{collaboration.mostPositive.user.name}</p>
                <p className="text-sm text-green-600">{collaboration.mostPositive.positivity}% positive votes</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <UserCheck className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Most Decisive</h3>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{
                  backgroundColor: collaboration.mostDecisive.user.bgColor,
                  color: collaboration.mostDecisive.user.color,
                }}
              >
                {collaboration.mostDecisive.user.initials}
              </div>
              <div>
                <p className="font-semibold text-blue-800">{collaboration.mostDecisive.user.name}</p>
                <p className="text-sm text-blue-600">{collaboration.mostDecisive.decisiveness}% decisive votes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderWorkflowTab = () => {
    const insights = getTeamInsights()

    // Calculate workflow metrics
    const characterProgress = currentProject.characters.map((char) => {
      const stats = {
        longList: char.actors.longList.length,
        shortLists: char.actors.shortLists.reduce((sum, sl) => sum + sl.actors.length, 0),
        audition: char.actors.audition.length,
        approval: char.actors.approval.length,
      }

      const total = stats.longList + stats.shortLists + stats.audition + stats.approval
      const greenlit = [
        ...char.actors.longList,
        ...char.actors.shortLists.flatMap((sl) => sl.actors),
        ...char.actors.audition,
        ...char.actors.approval,
      ].filter((actor) => actor.isGreenlit).length

      const stage =
        greenlit > 0
          ? "cast"
          : stats.approval > 0
            ? "approval"
            : stats.audition > 0
              ? "audition"
              : stats.shortLists > 0
                ? "shortlist"
                : stats.longList > 0
                  ? "longlist"
                  : "empty"

      return {
        character: char,
        stats,
        total,
        greenlit,
        stage,
        progress: total > 0 ? Math.round((greenlit / total) * 100) : 0,
      }
    })

    const stageDistribution = {
      empty: characterProgress.filter((cp) => cp.stage === "empty").length,
      longlist: characterProgress.filter((cp) => cp.stage === "longlist").length,
      shortlist: characterProgress.filter((cp) => cp.stage === "shortlist").length,
      audition: characterProgress.filter((cp) => cp.stage === "audition").length,
      approval: characterProgress.filter((cp) => cp.stage === "approval").length,
      cast: characterProgress.filter((cp) => cp.stage === "cast").length,
    }

    return (
      <div className="space-y-6">
        {/* Workflow Pipeline Overview */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Casting Pipeline</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { key: "empty", label: "Not Started", color: "bg-gray-100 text-gray-700", icon: AlertTriangle },
              { key: "longlist", label: "Long List", color: "bg-blue-100 text-blue-700", icon: Users },
              { key: "shortlist", label: "Shortlist", color: "bg-purple-100 text-purple-700", icon: Star },
              { key: "audition", label: "Audition", color: "bg-yellow-100 text-yellow-700", icon: MessageSquare },
              { key: "approval", label: "Approval", color: "bg-orange-100 text-orange-700", icon: Clock },
              { key: "cast", label: "GoGreenlight", color: "bg-green-100 text-green-700", icon: CheckCircle },
            ].map((stage) => (
              <div key={stage.key} className={`p-4 rounded-lg ${stage.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <stage.icon className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stageDistribution[stage.key]}</span>
                </div>
                <p className="text-sm font-medium">{stage.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Character Progress Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Character Progress</h3>
          <div className="space-y-3">
            {characterProgress.map((cp) => (
              <div key={cp.character.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{cp.character.name}</h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cp.stage === "cast"
                          ? "bg-green-100 text-green-700"
                          : cp.stage === "approval"
                            ? "bg-orange-100 text-orange-700"
                            : cp.stage === "audition"
                              ? "bg-yellow-100 text-yellow-700"
                              : cp.stage === "shortlist"
                                ? "bg-purple-100 text-purple-700"
                                : cp.stage === "longlist"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {cp.stage === "cast"
                        ? "GoGreenlight"
                        : cp.stage === "approval"
                          ? "In Approval"
                          : cp.stage === "audition"
                            ? "Auditioning"
                            : cp.stage === "shortlist"
                              ? "Shortlisted"
                              : cp.stage === "longlist"
                                ? "Long List"
                                : "Not Started"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        cp.progress === 100 ? "bg-green-500" : cp.progress > 0 ? "bg-blue-500" : "bg-gray-400"
                      }`}
                      style={{ width: `${Math.max(cp.progress, 5)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{cp.total} actors total</span>
                    <span>{cp.greenlit} cast</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Lightbulb className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">Workflow Optimization</h3>
          </div>
          <div className="space-y-3">
            {stageDistribution.empty > 0 && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-700">
                  <strong>{stageDistribution.empty}</strong> character(s) need initial actor assignments
                </span>
                <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                  Prioritize
                </button>
              </div>
            )}
            {stageDistribution.approval > 0 && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-700">
                  <strong>{stageDistribution.approval}</strong> character(s) ready for final approval
                </span>
                <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">Review</button>
              </div>
            )}
            {insights.consensusRate < 70 && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-700">Low consensus rate - consider team alignment session</span>
                <button className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600">
                  Schedule
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold">Team Suggestions</h2>
          <p className="text-sm text-gray-600">{currentProject.name}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { key: "insights", label: "Team Insights", icon: BarChart3 },
            { key: "recommendations", label: "AI Recommendations", icon: Lightbulb },
            { key: "collaboration", label: "Collaboration", icon: MessageSquare },
            { key: "workflow", label: "Workflow", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.key
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "insights" && renderInsightsTab()}
        {activeTab === "recommendations" && renderRecommendationsTab()}
        {activeTab === "collaboration" && renderCollaborationTab()}
        {activeTab === "workflow" && renderWorkflowTab()}
      </div>
    </div>
  )
}
