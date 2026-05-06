"use client"

import { useState, useMemo } from "react"
import {
  X,
  Plus,
  AlertTriangle,
  Calendar,
  Users,
  MapPin,
  Clock,
  FileText,
  Home,
  Mountain,
  Package,
  Trash2,
  Search,
  UserPlus,
  Edit2,
  Palette,
  LayoutGrid,
  Rows3,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal } from "./ModalManager"
import ModalHeader from "@/components/layout/ModalHeader"
import FloatingSidebar from "@/components/layout/FloatingSidebar"
import EmbeddedCoPilot from "@/components/copilot/EmbeddedCoPilot"
import type { ScheduleEntry, RedFlag, ProductionPhase } from "@/types/schedule"
import type { Actor } from "@/types/casting"
import StripboardView from "@/components/schedule/StripboardView"

interface ScheduleModalProps {
  onClose: () => void
}

export default function ScheduleModal({ onClose }: ScheduleModalProps) {
  const { state, dispatch } = useCasting()
  const [selectedPhase, setSelectedPhase] = useState<string>("principal")
  const [checkConflicts, setCheckConflicts] = useState(true)
  const [showNewDayForm, setShowNewDayForm] = useState(false)
  const [showEditDayForm, setShowEditDayForm] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [showActorSelector, setShowActorSelector] = useState(false)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [actorSearchQuery, setActorSearchQuery] = useState("")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showPhaseForm, setShowPhaseForm] = useState(false)
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"card" | "stripboard">("card")
  const [phaseFormData, setPhaseFormData] = useState({
    name: "",
    startDate: "",
    bgColor: "bg-blue-500",
  })
  const [newDayData, setNewDayData] = useState({
    title: "",
    date: "",
    startTime: "06:00",
    location: "",
    sceneType: "INT",
    sceneNotes: "",
    props: "",
  })

  const colorOptions = [
    { bg: "bg-blue-500", text: "text-blue-700", label: "Blue" },
    { bg: "bg-orange-500", text: "text-orange-700", label: "Orange" },
    { bg: "bg-lime-500", text: "text-lime-700", label: "Lime" },
    { bg: "bg-yellow-500", text: "text-yellow-700", label: "Yellow" },
    { bg: "bg-purple-500", text: "text-purple-700", label: "Purple" },
    { bg: "bg-pink-500", text: "text-pink-700", label: "Pink" },
    { bg: "bg-emerald-500", text: "text-emerald-700", label: "Emerald" },
    { bg: "bg-red-500", text: "text-red-700", label: "Red" },
    { bg: "bg-indigo-500", text: "text-indigo-700", label: "Indigo" },
    { bg: "bg-teal-500", text: "text-teal-700", label: "Teal" },
  ]

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)

  const allActors: Actor[] = useMemo(() => {
    if (!currentProject) return []
    const actors: Actor[] = []
    currentProject.characters.forEach((char) => {
      actors.push(
        ...char.actors.longList,
        ...char.actors.audition,
        ...char.actors.approval,
        ...(char.actors.shortLists?.flatMap((sl) => sl.actors) || []),
      )
    })
    return Array.from(new Map(actors.map((a) => [a.id, a])).values())
  }, [currentProject])

  const filteredActors = useMemo(() => {
    if (!actorSearchQuery.trim()) return allActors
    const query = actorSearchQuery.toLowerCase()
    return allActors.filter(
      (actor) =>
        actor.name.toLowerCase().includes(query) ||
        actor.contactEmail?.toLowerCase().includes(query) ||
        actor.contactPhone?.toLowerCase().includes(query),
    )
  }, [allActors, actorSearchQuery])

  const phaseEntries = useMemo(() => {
    return state.scheduleEntries
      .filter((entry) => {
        if (entry.phaseId) {
          return entry.phaseId === selectedPhase
        }
        return entry.title.toLowerCase().includes(selectedPhase.toLowerCase())
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [state.scheduleEntries, selectedPhase])

  const detectConflicts = (entry: ScheduleEntry): RedFlag[] => {
    if (!checkConflicts) return entry.redFlags

    const conflicts: RedFlag[] = [...entry.redFlags]
    const sameDayEntries = state.scheduleEntries.filter((e) => e.id !== entry.id && e.date === entry.date)

    entry.actorIds.forEach((actorId) => {
      const actor = allActors.find((a) => a.id === actorId)
      if (!actor) return

      sameDayEntries.forEach((otherEntry) => {
        if (otherEntry.actorIds.includes(actorId)) {
          conflicts.push({
            id: `conflict-${entry.id}-${actorId}`,
            type: "conflict",
            message: `Already scheduled for "${otherEntry.title}"`,
            color: "bg-red-100 text-red-800",
            actorId,
          })
        }
      })

      if (actor.availabilityDates) {
        const availability = actor.availabilityDates.find((d) => d.date === entry.date)
        if (availability?.status === "unavailable") {
          conflicts.push({
            id: `unavailable-${entry.id}-${actorId}`,
            type: "warning",
            message: "Marked unavailable",
            color: "bg-yellow-100 text-yellow-800",
            actorId,
          })
        }
      }
    })

    return conflicts
  }

  const handleOpenPhaseForm = (phase?: ProductionPhase) => {
    if (phase) {
      setEditingPhaseId(phase.id)
      setPhaseFormData({
        name: phase.name,
        startDate: phase.startDate,
        bgColor: phase.bgColor,
      })
    } else {
      setEditingPhaseId(null)
      setPhaseFormData({
        name: "",
        startDate: "",
        bgColor: "bg-blue-500",
      })
    }
    setShowPhaseForm(true)
  }

  const handleSavePhase = () => {
    if (!phaseFormData.name.trim() || !phaseFormData.startDate.trim()) {
      alert("Please fill in name and start date")
      return
    }

    const colorOption = colorOptions.find((c) => c.bg === phaseFormData.bgColor)
    if (!colorOption) return

    if (editingPhaseId) {
      // Update existing phase
      dispatch({
        type: "UPDATE_PRODUCTION_PHASE",
        payload: {
          id: editingPhaseId,
          updates: {
            name: phaseFormData.name.trim(),
            startDate: phaseFormData.startDate.trim(),
            bgColor: colorOption.bg,
            color: colorOption.text,
          },
        },
      })
      setSuccessMessage(`Phase "${phaseFormData.name}" updated successfully!`)
    } else {
      // Create new phase
      const newPhase: ProductionPhase = {
        id: `phase-${Date.now()}`,
        name: phaseFormData.name.trim(),
        startDate: phaseFormData.startDate.trim(),
        bgColor: colorOption.bg,
        color: colorOption.text,
      }
      dispatch({ type: "ADD_PRODUCTION_PHASE", payload: newPhase })
      setSuccessMessage(`Phase "${newPhase.name}" created successfully!`)
      setSelectedPhase(newPhase.id)
    }

    setTimeout(() => setSuccessMessage(null), 3000)
    setShowPhaseForm(false)
    setEditingPhaseId(null)
  }

  const handleDeletePhase = (phaseId: string) => {
    const phase = state.productionPhases.find((p) => p.id === phaseId)
    if (!phase) return

    const phaseEntryCount = state.scheduleEntries.filter((e) => e.phaseId === phaseId).length

    if (
      confirm(
        `Are you sure you want to delete "${phase.name}"?${phaseEntryCount > 0 ? `\n\nThis will also delete ${phaseEntryCount} shoot day(s) associated with this phase.` : ""}`,
      )
    ) {
      dispatch({ type: "DELETE_PRODUCTION_PHASE", payload: phaseId })
      if (selectedPhase === phaseId && state.productionPhases.length > 1) {
        const remainingPhases = state.productionPhases.filter((p) => p.id !== phaseId)
        setSelectedPhase(remainingPhases[0].id)
      }
      setSuccessMessage(`Phase "${phase.name}" deleted successfully!`)
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleCreateShootDay = () => {
    if (!newDayData.title.trim() || !newDayData.date.trim()) {
      alert("Please fill in title and date")
      return
    }

    const newEntry: ScheduleEntry = {
      id: `schedule-${Date.now()}`,
      title: newDayData.title.trim(),
      date: newDayData.date.trim(),
      phaseId: selectedPhase,
      startTime: newDayData.startTime,
      endTime: "",
      location: newDayData.location.trim(),
      sceneType: newDayData.sceneType,
      sceneNotes: newDayData.sceneNotes.trim(),
      props: newDayData.props.trim() ? newDayData.props.split(",").map((p) => p.trim()) : [],
      actorIds: [],
      crewMembers: [],
      redFlags: [],
      notes: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    dispatch({ type: "ADD_SCHEDULE_ENTRY", payload: newEntry })

    setSuccessMessage(`Shoot day "${newEntry.title}" created successfully!`)
    setTimeout(() => setSuccessMessage(null), 3000)

    setShowNewDayForm(false)
    setNewDayData({
      title: "",
      date: "",
      startTime: "06:00",
      location: "",
      sceneType: "INT",
      sceneNotes: "",
      props: "",
    })
  }

  const handleOpenEditForm = (entry: ScheduleEntry) => {
    setEditingEntryId(entry.id)
    setNewDayData({
      title: entry.title,
      date: entry.date,
      startTime: entry.startTime || "06:00",
      location: entry.location || "",
      sceneType: entry.sceneType || "INT",
      sceneNotes: entry.sceneNotes || "",
      props: entry.props ? entry.props.join(", ") : "",
    })
    setShowEditDayForm(true)
  }

  const handleSaveEditedShootDay = () => {
    if (!editingEntryId || !newDayData.title.trim() || !newDayData.date.trim()) {
      alert("Please fill in title and date")
      return
    }

    const updates: Partial<ScheduleEntry> = {
      title: newDayData.title.trim(),
      date: newDayData.date.trim(),
      startTime: newDayData.startTime,
      location: newDayData.location.trim(),
      sceneType: newDayData.sceneType,
      sceneNotes: newDayData.sceneNotes.trim(),
      props: newDayData.props.trim() ? newDayData.props.split(",").map((p) => p.trim()) : [],
      updatedAt: Date.now(),
    }

    dispatch({
      type: "UPDATE_SCHEDULE_ENTRY",
      payload: { id: editingEntryId, updates },
    })

    setSuccessMessage(`Shoot day "${newDayData.title}" updated successfully!`)
    setTimeout(() => setSuccessMessage(null), 3000)

    setShowEditDayForm(false)
    setEditingEntryId(null)
    setNewDayData({
      title: "",
      date: "",
      startTime: "06:00",
      location: "",
      sceneType: "INT",
      sceneNotes: "",
      props: "",
    })
  }

  const handleAssignActor = (entryId: string, actorId: string) => {
    const entry = state.scheduleEntries.find((e) => e.id === entryId)
    if (!entry) return

    const isAssigned = entry.actorIds.includes(actorId)
    const updatedActorIds = isAssigned ? entry.actorIds.filter((id) => id !== actorId) : [...entry.actorIds, actorId]

    dispatch({
      type: "UPDATE_SCHEDULE_ENTRY",
      payload: { id: entryId, updates: { actorIds: updatedActorIds } },
    })
  }

  const handleDeleteShootDay = (entryId: string) => {
    if (confirm("Are you sure you want to delete this shoot day?")) {
      dispatch({ type: "DELETE_SCHEDULE_ENTRY", payload: entryId })
    }
  }

  const handleUpdateEntry = (entryId: string, updates: Partial<ScheduleEntry>) => {
    dispatch({
      type: "UPDATE_SCHEDULE_ENTRY",
      payload: { id: entryId, updates },
    })
  }

  const handleOpenActorSelector = (entryId: string) => {
    setSelectedEntryId(entryId)
    setShowActorSelector(true)
    setActorSearchQuery("")
  }

const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
  <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col pl-14">
  {/* Slim Sidebar Strip / Expandable Drawer */}
  <FloatingSidebar
    isOpen={isSidebarOpen}
    onClose={() => setIsSidebarOpen(false)}
    onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
    currentModal="schedule"
  />

  {/* Header */}
  <ModalHeader
    title="Schedule"
    titleColor="bg-blue-600"
    onClose={onClose}
  />

      {successMessage && (
        <div className="bg-emerald-500 text-white px-6 py-3 flex items-center justify-between shadow-md animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-emerald-500 font-bold">✓</span>
            </div>
            <span className="font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-white hover:text-emerald-100">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Production Phases */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Select a Production Phase:</h3>
              <button
                onClick={() => handleOpenPhaseForm()}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                title="Add new phase"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {state.productionPhases.map((phase) => (
                <div key={phase.id} className="relative group">
                  <button
                    onClick={() => setSelectedPhase(phase.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedPhase === phase.id
                        ? `${phase.bgColor} text-white`
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <div className="font-semibold">{phase.name}</div>
                    <div className={`text-sm mt-1 ${selectedPhase === phase.id ? "text-white" : "text-gray-500"}`}>
                      Start: {new Date(phase.startDate).toLocaleDateString()}
                    </div>
                  </button>
                  <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenPhaseForm(phase)
                      }}
                      className="p-1 bg-white rounded shadow-sm hover:bg-gray-100 transition-colors"
                      title="Edit phase"
                    >
                      <Edit2 className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePhase(phase.id)
                      }}
                      className="p-1 bg-white rounded shadow-sm hover:bg-red-50 transition-colors"
                      title="Delete phase"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Quick Guide</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Click + to add a new production phase</li>
                <li>• Hover over phases to edit or delete</li>
                <li>• Click "Create Shoot Day" to add days</li>
                <li>• Use "Assign Actors" to add cast members</li>
                <li>• Red flags indicate scheduling conflicts</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content - Shooting Days */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Controls */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="check-conflicts"
                  checked={checkConflicts}
                  onChange={(e) => setCheckConflicts(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-emerald-500 rounded"
                />
                <label htmlFor="check-conflicts" className="text-sm text-gray-700">
                  Check for Conflicts
                </label>
              </div>

              <div className="flex items-center bg-gray-100 rounded-lg p-1 shadow-inner">
                <button
                  onClick={() => setViewMode("card")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${
                    viewMode === "card" ? "bg-white text-emerald-600 shadow-md" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Card View
                </button>
                <button
                  onClick={() => setViewMode("stripboard")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${
                    viewMode === "stripboard"
                      ? "bg-white text-emerald-600 shadow-md"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Rows3 className="w-4 h-4" />
                  Stripboard View
                </button>
              </div>

              <div className="text-sm font-semibold text-blue-600">
                {state.productionPhases.find((p) => p.id === selectedPhase)?.name} - Shoot Days
              </div>
              <div className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                {phaseEntries.length} {phaseEntries.length === 1 ? "day" : "days"}
              </div>
            </div>
            <button
              onClick={() => setShowNewDayForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Create Shoot Day
            </button>
          </div>

          {/* Shooting Days List */}
          <div className="flex-1 overflow-auto p-6">
            {viewMode === "stripboard" ? (
              <StripboardView
                phaseEntries={phaseEntries}
                allActors={allActors}
                detectConflicts={detectConflicts}
                onUpdateEntry={handleUpdateEntry}
                onDeleteShootDay={handleDeleteShootDay}
                onOpenActorSelector={handleOpenActorSelector}
                onEditShootDay={handleOpenEditForm}
              />
            ) : (
              <>
                {showNewDayForm && (
                  <div className="bg-white border-2 border-emerald-500 rounded-lg p-6 mb-6 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      Create New Shoot Day
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newDayData.title}
                          onChange={(e) => setNewDayData({ ...newDayData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g., Scene 1 - Kitchen"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={newDayData.date}
                          onChange={(e) => setNewDayData({ ...newDayData, date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Call Time</label>
                        <input
                          type="time"
                          value={newDayData.startTime}
                          onChange={(e) => setNewDayData({ ...newDayData, startTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          value={newDayData.location}
                          onChange={(e) => setNewDayData({ ...newDayData, location: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g., Studio A"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scene Type</label>
                        <select
                          value={newDayData.sceneType}
                          onChange={(e) =>
                            setNewDayData({ ...newDayData, sceneType: e.target.value as "INT" | "EXT" | "INT/EXT" })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="INT">Interior (INT)</option>
                          <option value="EXT">Exterior (EXT)</option>
                          <option value="INT/EXT">Interior/Exterior (INT/EXT)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Props (comma-separated)</label>
                        <input
                          type="text"
                          value={newDayData.props}
                          onChange={(e) => setNewDayData({ ...newDayData, props: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g., Coffee mug, Laptop"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scene Notes</label>
                        <textarea
                          value={newDayData.sceneNotes}
                          onChange={(e) => setNewDayData({ ...newDayData, sceneNotes: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          rows={2}
                          placeholder="Additional notes about this scene..."
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleCreateShootDay}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-medium"
                      >
                        Create Shoot Day
                      </button>
                      <button
                        onClick={() => setShowNewDayForm(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {phaseEntries.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Shoot Days Yet</h3>
                    <p className="mb-4">Get started by creating your first shoot day for this production phase</p>
                    <button
                      onClick={() => setShowNewDayForm(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm hover:shadow-md"
                    >
                      <Plus className="w-5 h-5" />
                      Create Your First Shoot Day
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {phaseEntries.map((entry, index) => {
                      const conflicts = detectConflicts(entry)
                      const assignedActors = allActors.filter((a) => entry.actorIds.includes(a.id))
                      const totalConflicts = conflicts.length
                      const dayScenes = state.scenes
                        .filter((scene) => scene.shootDayId === entry.id)
                        .sort((a, b) => a.order - b.order)

                      return (
                        <div
                          key={entry.id}
                          className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Shoot Day Header */}
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 text-white font-bold rounded-full">
                                    {index + 1}
                                  </span>
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-900">{entry.title}</h3>
                                    <p className="text-sm text-gray-600">
                                      {new Date(entry.date).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <input
                                      type="time"
                                      value={entry.startTime || "06:00"}
                                      onChange={(e) => handleUpdateEntry(entry.id, { startTime: e.target.value })}
                                      className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    {entry.endTime && (
                                      <>
                                        <span className="text-gray-400">-</span>
                                        <span className="text-sm font-medium">{entry.endTime}</span>
                                      </>
                                    )}
                                  </div>
                                  {entry.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      <span>{entry.location}</span>
                                    </div>
                                  )}
                                  {entry.sceneType && (
                                    <div className="flex items-center gap-1">
                                      {entry.sceneType === "INT" ? (
                                        <Home className="w-4 h-4" />
                                      ) : (
                                        <Mountain className="w-4 h-4" />
                                      )}
                                      <span className="font-semibold">{entry.sceneType}</span>
                                    </div>
                                  )}
                                  {entry.props && entry.props.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Package className="w-4 h-4" />
                                      <span>{entry.props.length} props</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {totalConflicts > 0 && (
                                  <div className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-full shadow-md animate-pulse">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="text-sm font-bold">
                                      {totalConflicts} Alert{totalConflicts > 1 ? "s" : ""}
                                    </span>
                                  </div>
                                )}
                                <button
                                  onClick={() => handleOpenEditForm(entry)}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit shoot day"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteShootDay(entry.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete shoot day"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Red Flags / Alerts */}
                          {conflicts.length > 0 && (
                            <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                              <div className="space-y-1.5">
                                {conflicts.map((flag) => (
                                  <div key={flag.id} className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                                    <span className="text-red-800">{flag.message}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Scene Details */}
                          {(entry.sceneNotes || (entry.props && entry.props.length > 0)) && (
                            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                              {entry.sceneNotes && (
                                <div className="flex items-start gap-2 text-sm text-gray-700 mb-2">
                                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <span>{entry.sceneNotes}</span>
                                </div>
                              )}
                              {entry.props && entry.props.length > 0 && (
                                <div className="flex items-start gap-2 text-sm text-gray-700">
                                  <Package className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <div className="flex flex-wrap gap-1">
                                    {entry.props.map((prop, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs"
                                      >
                                        {prop}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {entry.notes && (
                                <div className="flex items-start gap-2 text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                                  <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <span className="italic">{entry.notes}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {dayScenes.length > 0 && (
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Scenes ({dayScenes.length})
                              </h4>
                              <div className="space-y-2">
                                {dayScenes.map((scene) => {
                                  // Color coding for scene badges
                                  const getSceneBadgeColor = () => {
                                    if (scene.intExt === "EXT" && scene.dayNight === "Day")
                                      return "bg-red-100 text-red-800 border-red-300"
                                    if (scene.intExt === "EXT" && scene.dayNight === "Night")
                                      return "bg-green-800 text-white border-green-900"
                                    if (scene.intExt === "INT" && scene.dayNight === "Day")
                                      return "bg-white text-gray-900 border-gray-400"
                                    if (scene.intExt === "INT" && scene.dayNight === "Night")
                                      return "bg-green-600 text-white border-green-700"
                                    return "bg-yellow-100 text-yellow-900 border-yellow-300"
                                  }

                                  return (
                                    <div
                                      key={scene.id}
                                      className={`p-3 rounded-lg border-2 ${getSceneBadgeColor()}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 min-w-[120px]">
                                          <span className="font-bold text-sm">Scene {scene.sceneNumber}</span>
                                          <span className="text-xs opacity-75">({scene.pages} pgs)</span>
                                        </div>
                                        <div className="flex items-center gap-2 min-w-[80px]">
                                          <span className="text-xs font-semibold">{scene.intExt}</span>
                                          <span className="text-xs opacity-75">{'\u2022'}</span>
                                          <span className="text-xs">{scene.dayNight}</span>
                                        </div>
                                        <div className="flex-1 text-sm truncate">{scene.location}</div>
                                        {scene.cast.length > 0 && (
                                          <div className="text-xs opacity-75">{scene.cast.length} cast</div>
                                        )}
                                      </div>
                                      {(scene.description || scene.cast.length > 0) && (
                                        <div className="mt-1.5 flex items-center gap-3">
                                          {scene.description && (
                                            <span className="text-xs italic opacity-80 flex-1 truncate">{scene.description}</span>
                                          )}
                                          {scene.cast.length > 0 && (
                                            <span className="text-xs opacity-70 flex-shrink-0">{scene.cast.join(", ")}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Crew Members */}
                          {entry.crewMembers && entry.crewMembers.length > 0 && (
                            <div className="px-6 py-3 border-b border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Crew ({entry.crewMembers.length})</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {entry.crewMembers.map((crew, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs text-gray-600">
                                    {crew}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actor Assignments */}
                          <div className="px-6 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Assigned Actors ({assignedActors.length})
                              </h4>
                              <button
                                onClick={() => handleOpenActorSelector(entry.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md"
                              >
                                <UserPlus className="w-4 h-4" />
                                Assign Actors
                              </button>
                            </div>

                            {assignedActors.length === 0 ? (
                              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-500 mb-2">No actors assigned yet</p>
                                <button
                                  onClick={() => handleOpenActorSelector(entry.id)}
                                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                                >
                                  Click "Assign Actors" to add cast members
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {assignedActors.map((actor) => {
                                  const actorConflicts = conflicts.filter((c) => c.actorId === actor.id)
                                  const hasConflict = actorConflicts.length > 0

                                  return (
                                    <div
                                      key={actor.id}
                                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                        hasConflict
                                          ? "bg-red-50 border-2 border-red-400 shadow-md"
                                          : "bg-emerald-50 border border-emerald-300"
                                      }`}
                                    >
                                      {hasConflict && (
                                        <div className="relative group">
                                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                            <AlertTriangle className="w-4 h-4 text-white" />
                                          </div>
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                            <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg">
                                              {actorConflicts.map((c) => c.message).join(", ")}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      <span className={hasConflict ? "text-red-800 font-medium" : "text-emerald-800"}>
                                        {actor.name}
                                      </span>
                                      <button
                                        onClick={() => handleAssignActor(entry.id, actor.id)}
                                        className={`${hasConflict ? "text-red-600 hover:text-red-800" : "text-emerald-600 hover:text-emerald-800"}`}
                                        title="Remove actor"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showPhaseForm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPhaseId ? "Edit Production Phase" : "Add Production Phase"}
              </h2>
              <button
                onClick={() => {
                  setShowPhaseForm(false)
                  setEditingPhaseId(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phase Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={phaseFormData.name}
                  onChange={(e) => setPhaseFormData({ ...phaseFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Principal Photography"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={phaseFormData.startDate}
                  onChange={(e) => setPhaseFormData({ ...phaseFormData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Color Theme
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.bg}
                      onClick={() => setPhaseFormData({ ...phaseFormData, bgColor: option.bg })}
                      className={`h-12 rounded-lg ${option.bg} hover:opacity-80 transition-opacity relative ${
                        phaseFormData.bgColor === option.bg ? "ring-2 ring-gray-900 ring-offset-2" : ""
                      }`}
                      title={option.label}
                    >
                      {phaseFormData.bgColor === option.bg && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <span className="text-gray-900 font-bold">✓</span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPhaseForm(false)
                  setEditingPhaseId(null)
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePhase}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                {editingPhaseId ? "Update Phase" : "Create Phase"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditDayForm && editingEntryId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Edit Shoot Day
              </h2>
              <button
                onClick={() => {
                  setShowEditDayForm(false)
                  setEditingEntryId(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDayData.title}
                    onChange={(e) => setNewDayData({ ...newDayData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Scene 1 - Kitchen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newDayData.date}
                    onChange={(e) => setNewDayData({ ...newDayData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Call Time</label>
                  <input
                    type="time"
                    value={newDayData.startTime}
                    onChange={(e) => setNewDayData({ ...newDayData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newDayData.location}
                    onChange={(e) => setNewDayData({ ...newDayData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Studio A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scene Type</label>
                  <select
                    value={newDayData.sceneType}
                    onChange={(e) =>
                      setNewDayData({ ...newDayData, sceneType: e.target.value as "INT" | "EXT" | "INT/EXT" })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INT">Interior (INT)</option>
                    <option value="EXT">Exterior (EXT)</option>
                    <option value="INT/EXT">Interior/Exterior (INT/EXT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Props (comma-separated)</label>
                  <input
                    type="text"
                    value={newDayData.props}
                    onChange={(e) => setNewDayData({ ...newDayData, props: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Coffee mug, Laptop"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scene Notes</label>
                  <textarea
                    value={newDayData.sceneNotes}
                    onChange={(e) => setNewDayData({ ...newDayData, sceneNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Additional notes about this scene..."
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setShowEditDayForm(false)
                  setEditingEntryId(null)
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedShootDay}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CoPilot - Fixed position in lower right corner */}
      <div className="fixed bottom-6 right-6 z-40">
        <EmbeddedCoPilot context="schedule" />
      </div>

      {showActorSelector && selectedEntryId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Select Actors to Assign</h2>
              <button
                onClick={() => {
                  setShowActorSelector(false)
                  setSelectedEntryId(null)
                  setActorSearchQuery("")
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={actorSearchQuery}
                  onChange={(e) => setActorSearchQuery(e.target.value)}
                  placeholder="Search actors by name, email, or phone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredActors.map((actor) => {
                  const entry = state.scheduleEntries.find((e) => e.id === selectedEntryId)
                  const isAssigned = entry?.actorIds.includes(actor.id) || false
                  const actorConflicts = entry ? detectConflicts(entry).filter((c) => c.actorId === actor.id) : []
                  const hasConflict = actorConflicts.length > 0

                  return (
                    <button
                      key={actor.id}
                      onClick={() => handleAssignActor(selectedEntryId, actor.id)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        isAssigned
                          ? hasConflict
                            ? "border-red-400 bg-red-50"
                            : "border-emerald-400 bg-emerald-50"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          {actor.headshots?.[0] ? (
                            <img
                              src={actor.headshots[0]}
                              alt={actor.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                              {actor.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                          )}
                          {isAssigned && hasConflict && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4 text-white" />
                            </div>
                          )}
                          {isAssigned && !hasConflict && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{actor.name}</h3>
                          <p className="text-xs text-gray-500 truncate">
                            {actor.age && `${actor.age} years`}
                            {actor.age && actor.gender && " • "}
                            {actor.gender}
                          </p>
                          {actor.contactEmail && (
                            <p className="text-xs text-gray-500 truncate mt-1">{actor.contactEmail}</p>
                          )}
                          {hasConflict && (
                            <p className="text-xs text-red-600 font-medium mt-1">{actorConflicts[0].message}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {filteredActors.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No actors found matching your search</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowActorSelector(false)
                  setSelectedEntryId(null)
                  setActorSearchQuery("")
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
