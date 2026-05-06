"use client"

import { useState, useEffect } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { X, Plus, Edit, Trash2, Check, Filter } from "lucide-react"
import type { Actor, Status } from "@/types/casting"

interface ManageStatusesModalProps {
  onClose: () => void
  actor: Actor
  characterId: string
}

const predefinedColors = [
  { bg: "bg-blue-200", text: "text-blue-700", name: "Blue" },
  { bg: "bg-green-200", text: "text-green-700", name: "Green" },
  { bg: "bg-yellow-200", text: "text-yellow-700", name: "Yellow" },
  { bg: "bg-red-200", text: "text-red-700", name: "Red" },
  { bg: "bg-purple-200", text: "text-purple-700", name: "Purple" },
  { bg: "bg-pink-200", text: "text-pink-700", name: "Pink" },
  { bg: "bg-indigo-200", text: "text-indigo-700", name: "Indigo" },
  { bg: "bg-orange-200", text: "text-orange-700", name: "Orange" },
  { bg: "bg-teal-200", text: "text-teal-700", name: "Teal" },
  { bg: "bg-gray-200", text: "text-gray-700", name: "Gray" },
]

// Update the component to support multi-selection
export default function ManageStatusesModal({ onClose, actor, characterId }: ManageStatusesModalProps) {
  const { state, dispatch } = useCasting()
  const [activeTab, setActiveTab] = useState<"assign" | "create" | "manage">("assign")
  const [newStatus, setNewStatus] = useState({
    label: "",
    bgColor: "bg-blue-200",
    textColor: "text-blue-700",
  })
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const allStatuses = [...state.predefinedStatuses]
  const actorStatuses = actor.statuses || []

  // Group statuses by category for filtering
  const statusCategories = ["all", ...Array.from(new Set(allStatuses.map((s) => s.category || "other")))]

  // Filter statuses based on selected category
  const filteredStatuses = statusFilter === "all" ? allStatuses : allStatuses.filter((s) => s.category === statusFilter)

  // Initialize selected statuses with current actor statuses
  useEffect(() => {
    setSelectedStatuses(actorStatuses.map((s) => s.id))
  }, [actorStatuses])

  const handleAssignStatus = (status: Status) => {
    const isAlreadyAssigned = actorStatuses.some((s) => s.id === status.id)

    let updatedStatuses
    if (isAlreadyAssigned) {
      updatedStatuses = actorStatuses.filter((s) => s.id !== status.id)
    } else {
      updatedStatuses = [...actorStatuses, status]
    }

    dispatch({
      type: "UPDATE_ACTOR",
      payload: {
        actorId: actor.id,
        characterId,
        updates: { statuses: updatedStatuses },
      },
    })
  }

  const handleToggleStatusSelection = (statusId: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(statusId) ? prev.filter((id) => id !== statusId) : [...prev, statusId],
    )
  }

  const handleApplySelectedStatuses = () => {
    // Get all selected statuses objects
    const statusesToApply = allStatuses.filter((status) => selectedStatuses.includes(status.id))

    dispatch({
      type: "UPDATE_ACTOR",
      payload: {
        actorId: actor.id,
        characterId,
        updates: { statuses: statusesToApply },
      },
    })
  }

  const handleCreateStatus = () => {
    if (!newStatus.label.trim()) {
      alert("Status label is required.")
      return
    }

    const status: Status = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      label: newStatus.label.trim(),
      bgColor: newStatus.bgColor,
      textColor: newStatus.textColor,
      isCustom: true,
    }

    // Add to global predefined statuses (in a real app, this would be saved to backend)
    // For now, we'll just assign it to the actor
    handleAssignStatus(status)

    setNewStatus({
      label: "",
      bgColor: "bg-blue-200",
      textColor: "text-blue-700",
    })
    setActiveTab("assign")
  }

  const handleEditStatus = (status: Status) => {
    setEditingStatus(status)
    setNewStatus({
      label: status.label,
      bgColor: status.bgColor,
      textColor: status.textColor,
    })
    setActiveTab("create")
  }

  const handleUpdateStatus = () => {
    if (!editingStatus || !newStatus.label.trim()) return

    const updatedStatus: Status = {
      ...editingStatus,
      label: newStatus.label.trim(),
      bgColor: newStatus.bgColor,
      textColor: newStatus.textColor,
    }

    // Update actor's statuses
    const updatedStatuses = actorStatuses.map((s) => (s.id === editingStatus.id ? updatedStatus : s))

    dispatch({
      type: "UPDATE_ACTOR",
      payload: {
        actorId: actor.id,
        characterId,
        updates: { statuses: updatedStatuses },
      },
    })

    setEditingStatus(null)
    setNewStatus({
      label: "",
      bgColor: "bg-blue-200",
      textColor: "text-blue-700",
    })
    setActiveTab("assign")
  }

  const handleDeleteStatus = (statusId: string) => {
    const updatedStatuses = actorStatuses.filter((s) => s.id !== statusId)

    // Also remove from selected statuses
    setSelectedStatuses((prev) => prev.filter((id) => id !== statusId))

    dispatch({
      type: "UPDATE_ACTOR",
      payload: {
        actorId: actor.id,
        characterId,
        updates: { statuses: updatedStatuses },
      },
    })
  }

  const handleSelectAll = () => {
    if (selectedStatuses.length === filteredStatuses.length) {
      // If all are selected, deselect all
      setSelectedStatuses([])
    } else {
      // Otherwise select all filtered statuses
      setSelectedStatuses(filteredStatuses.map((s) => s.id))
    }
  }

  const renderAssignTab = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Current Statuses</h3>
        {actorStatuses.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {actorStatuses.map((status) => (
              <div
                key={status.id}
                className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${status.bgColor || "bg-gray-200"} ${status.textColor || "text-gray-700"}`}
              >
                <span>{status.label}</span>
                <button
                  onClick={() => handleDeleteStatus(status.id)}
                  className="ml-2 text-current opacity-70 hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm mb-4">No statuses assigned</p>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Available Statuses</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-md p-1"
              >
                {statusCategories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={handleSelectAll} className="text-sm text-blue-600 hover:text-blue-800">
              {selectedStatuses.length === filteredStatuses.length ? "Deselect All" : "Select All"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4">
          {filteredStatuses.map((status) => {
            const isSelected = selectedStatuses.includes(status.id)
            const isAssigned = actorStatuses.some((s) => s.id === status.id)

            return (
              <div
                key={status.id}
                onClick={() => handleToggleStatusSelection(status.id)}
                className={`flex items-center justify-between p-3 border rounded-lg text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor || "bg-gray-200"} ${status.textColor || "text-gray-700"}`}
                  >
                    {status.label}
                  </span>
                  {status.isCustom && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Custom</span>
                  )}
                  {status.category && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
                      {status.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {isAssigned && <span className="text-xs text-emerald-600">Applied</span>}
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? "bg-emerald-500 border-emerald-600" : "border-gray-300"}`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleApplySelectedStatuses}
            className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedStatuses.length === 0}
          >
            Apply Selected ({selectedStatuses.length})
          </button>
        </div>
      </div>
    </div>
  )

  const renderCreateTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{editingStatus ? "Edit Status" : "Create New Status"}</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Status Label</label>
        <input
          type="text"
          value={newStatus.label}
          onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="e.g. Callback Scheduled"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={editingStatus?.category || "other"}
          onChange={(e) => {
            if (editingStatus) {
              setEditingStatus({ ...editingStatus, category: e.target.value })
            }
          }}
        >
          {statusCategories
            .filter((c) => c !== "all")
            .map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
        <div className="grid grid-cols-5 gap-2">
          {predefinedColors.map((color) => (
            <button
              key={color.name}
              onClick={() =>
                setNewStatus({
                  ...newStatus,
                  bgColor: color.bg,
                  textColor: color.text,
                })
              }
              className={`p-3 rounded-lg border-2 transition-colors ${
                newStatus.bgColor === color.bg ? "border-emerald-500" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-full h-6 rounded ${color.bg} flex items-center justify-center`}>
                <span className={`text-xs font-medium ${color.text}`}>{color.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <span
            className={`inline-block px-3 py-2 rounded-full text-sm font-medium ${newStatus.bgColor} ${newStatus.textColor}`}
          >
            {newStatus.label || "Status Preview"}
          </span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={editingStatus ? handleUpdateStatus : handleCreateStatus}
          disabled={!newStatus.label.trim()}
          className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {editingStatus ? "Update Status" : "Create & Assign"}
        </button>
        {editingStatus && (
          <button
            onClick={() => {
              setEditingStatus(null)
              setNewStatus({
                label: "",
                bgColor: "bg-blue-200",
                textColor: "text-blue-700",
              })
              setActiveTab("assign")
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )

  const renderManageTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Manage Actor Statuses</h3>

      {actorStatuses.length > 0 ? (
        <div className="space-y-2">
          {actorStatuses.map((status) => (
            <div key={status.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor || "bg-gray-200"} ${status.textColor || "text-gray-700"}`}
                >
                  {status.label}
                </span>
                {status.isCustom && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Custom</span>}
                {status.category && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
                    {status.category}
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {status.isCustom && (
                  <button
                    onClick={() => handleEditStatus(status)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Edit Status"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteStatus(status.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Remove Status"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No statuses assigned to this actor</p>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-2">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("assign")}
            className="px-3 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 text-sm"
          >
            Assign Status
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
          >
            Create New Status
          </button>
          <button
            onClick={() => {
              dispatch({
                type: "UPDATE_ACTOR",
                payload: {
                  actorId: actor.id,
                  characterId,
                  updates: { statuses: [] },
                },
              })
              setSelectedStatuses([])
            }}
            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
          >
            Clear All Statuses
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b">
        <div>
          <h2 className="text-xl font-bold">Manage Statuses</h2>
          <p className="text-sm text-gray-600">{actor.name}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { key: "assign", label: "Assign", icon: Check },
            { key: "create", label: "Create", icon: Plus },
            { key: "manage", label: "Manage", icon: Edit },
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
        {activeTab === "assign" && renderAssignTab()}
        {activeTab === "create" && renderCreateTab()}
        {activeTab === "manage" && renderManageTab()}
      </div>
    </div>
  )
}
