"use client"

import { useState } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import {
  X,
  Users,
  Shield,
  Settings,
  Plus,
  Edit,
  Trash2,
  Check,
  AlertTriangle,
  Crown,
  Eye,
  UserPlus,
  Mail,
  Key,
  Lock,
  Film,
} from "lucide-react"

interface UserPermissionsModalProps {
  onClose: () => void
}

interface InviteUser {
  email: string
  name: string
  role: string
  permissionLevel: string
}

export default function UserPermissionsModal({ onClose }: UserPermissionsModalProps) {
  const { state, dispatch } = useCasting()
  const [activeTab, setActiveTab] = useState<"overview" | "manage" | "roles" | "invite" | "settings">("overview")
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [newPermissionLevel, setNewPermissionLevel] = useState("")
  const [inviteForm, setInviteForm] = useState<InviteUser>({
    email: "",
    name: "",
    role: "",
    permissionLevel: "viewer",
  })
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [editForm, setEditForm] = useState<{
    name: string
    email: string
  }>({
    name: "",
    email: "",
  })

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)

  if (!currentProject) {
    return (
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">User Permissions</h2>
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

  // Get project team members with their permissions
  const getProjectTeamMembers = () => {
    return currentProject.projectUsers
      .map((projectUser) => {
        const user = state.users.find((u) => u.id === projectUser.userId)
        const permissionLevel = state.permissionLevels.find((p) => p.id === projectUser.permissionLevel)
        return {
          user,
          projectUser,
          permissionLevel,
        }
      })
      .filter((member) => member.user) // Filter out any missing users
  }

  // Permission capabilities matrix
  const getPermissionCapabilities = (permissionLevelId: string) => {
    const capabilities = {
      admin: {
        viewProject: true,
        editProject: true,
        deleteProject: true,
        manageUsers: true,
        addActors: true,
        editActors: true,
        deleteActors: true,
        vote: true,
        addNotes: true,
        manageCharacters: true,
        viewReports: true,
        exportData: true,
        managePermissions: true,
      },
      casting_director: {
        viewProject: true,
        editProject: false,
        deleteProject: false,
        manageUsers: false,
        addActors: true,
        editActors: true,
        deleteActors: true,
        vote: true,
        addNotes: true,
        manageCharacters: true,
        viewReports: true,
        exportData: true,
        managePermissions: false,
      },
      producer: {
        viewProject: true,
        editProject: false,
        deleteProject: false,
        manageUsers: false,
        addActors: false,
        editActors: false,
        deleteActors: false,
        vote: true,
        addNotes: true,
        manageCharacters: false,
        viewReports: true,
        exportData: true,
        managePermissions: false,
      },
      viewer: {
        viewProject: true,
        editProject: false,
        deleteProject: false,
        manageUsers: false,
        addActors: false,
        editActors: false,
        deleteActors: false,
        vote: false,
        addNotes: true,
        manageCharacters: false,
        viewReports: true,
        exportData: false,
        managePermissions: false,
      },
    }

    return capabilities[permissionLevelId] || capabilities.viewer
  }

  const handleUpdateUserPermission = (userId: string, newPermissionLevel: string) => {
    // In a real app, this would call an API
    alert(`Would update ${userId} to ${newPermissionLevel} permission level`)
    setEditingUser(null)
    setNewPermissionLevel("")
  }

  const handleRemoveUser = (userId: string, userName: string) => {
    // In a real app, this would call an API
    if (confirm(`Are you sure you want to remove ${userName} from this project?`)) {
      alert(`Would remove ${userName} from project`)
    }
  }

  const handleInviteUser = () => {
    if (!inviteForm.email || !inviteForm.name) {
      alert("Email and name are required")
      return
    }

    // In a real app, this would send an invitation email
    alert(`Would send invitation to ${inviteForm.email} as ${inviteForm.permissionLevel}`)
    setInviteForm({
      email: "",
      name: "",
      role: "",
      permissionLevel: "viewer",
    })
    setShowInviteForm(false)
  }

  const renderOverviewTab = () => {
    const teamMembers = getProjectTeamMembers()
    const permissionDistribution = state.permissionLevels.map((level) => ({
      level,
      count: teamMembers.filter((member) => member.projectUser.permissionLevel === level.id).length,
    }))

    return (
      <div className="space-y-6">
        {/* Permission Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {permissionDistribution.map((dist) => (
            <div
              key={dist.level.id}
              className={`p-4 rounded-lg border-2 ${
                dist.level.id === "admin"
                  ? "border-red-200 bg-red-50"
                  : dist.level.id === "casting_director"
                    ? "border-blue-200 bg-blue-50"
                    : dist.level.id === "producer"
                      ? "border-purple-200 bg-purple-50"
                      : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-2 rounded-lg ${
                    dist.level.id === "admin"
                      ? "bg-red-100 text-red-600"
                      : dist.level.id === "casting_director"
                        ? "bg-blue-100 text-blue-600"
                        : dist.level.id === "producer"
                          ? "bg-purple-100 text-purple-600"
                          : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {dist.level.id === "admin" ? (
                    <Crown className="w-5 h-5" />
                  ) : dist.level.id === "casting_director" ? (
                    <Users className="w-5 h-5" />
                  ) : dist.level.id === "producer" ? (
                    <Film className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </div>
                <span className="text-2xl font-bold text-gray-800">{dist.count}</span>
              </div>
              <h3 className="font-semibold text-gray-800">{dist.level.label}</h3>
              <p className="text-xs text-gray-600 mt-1">{dist.level.description}</p>
            </div>
          ))}
        </div>

        {/* Current Team Members */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Current Team Members</h3>
            <span className="text-sm text-gray-500">{teamMembers.length} members</span>
          </div>
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ backgroundColor: member.user.bgColor, color: member.user.color }}
                  >
                    {member.user.initials}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{member.user.name}</h4>
                    <p className="text-sm text-gray-600">{member.user.email}</p>
                    <p className="text-xs text-gray-500">{member.user.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      member.permissionLevel.id === "admin"
                        ? "bg-red-100 text-red-700"
                        : member.permissionLevel.id === "casting_director"
                          ? "bg-blue-100 text-blue-700"
                          : member.permissionLevel.id === "producer"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {member.permissionLevel.label}
                  </span>
                  {member.user.id === state.currentUser?.id && <p className="text-xs text-emerald-600 mt-1">You</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab("invite")}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
          >
            <UserPlus className="w-6 h-6 text-gray-400 mr-2" />
            <span className="text-gray-600">Invite New Member</span>
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <Shield className="w-6 h-6 text-gray-400 mr-2" />
            <span className="text-gray-600">Manage Roles</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <Settings className="w-6 h-6 text-gray-400 mr-2" />
            <span className="text-gray-600">Project Settings</span>
          </button>
        </div>
      </div>
    )
  }

  const renderManageTab = () => {
    const handleStartEdit = (user: any) => {
      setEditingUser(user.id)
      setEditForm({
        name: user.name,
        email: user.email,
      })
    }

    const handleSaveEdit = () => {
      if (!editingUser || !editForm.name.trim() || !editForm.email.trim()) {
        alert("Name and email are required")
        return
      }

      // Generate new initials from the new name
      const nameParts = editForm.name.trim().split(" ")
      const newInitials =
        nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : editForm.name.trim().substring(0, 2).toUpperCase()

      dispatch({
        type: "UPDATE_USER",
        payload: {
          userId: editingUser,
          updates: {
            name: editForm.name.trim(),
            email: editForm.email.trim(),
            initials: newInitials,
          },
        },
      })

      setEditingUser(null)
      setEditForm({ name: "", email: "" })
    }

    const handleCancelEdit = () => {
      setEditingUser(null)
      setEditForm({ name: "", email: "" })
    }

    const teamMembers = getProjectTeamMembers()

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Manage Team Permissions</h3>
          <button
            onClick={() => setShowInviteForm(true)}
            className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </button>
        </div>

        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div key={member.user.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ backgroundColor: member.user.bgColor, color: member.user.color }}
                  >
                    {member.user.initials}
                  </div>
                  <div className="flex-1">
                    {editingUser === member.user.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Full Name"
                        />
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Email Address"
                        />
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-semibold text-gray-800">{member.user.name}</h4>
                        <p className="text-sm text-gray-600">{member.user.email}</p>
                        <p className="text-xs text-gray-500">{member.user.role}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {editingUser === member.user.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="p-2 text-green-600 hover:text-green-800"
                        title="Save Changes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(member.user)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                        title="Edit User Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {member.user.id !== state.currentUser?.id && (
                        <>
                          <button
                            onClick={() => {
                              setEditingUser(member.user.id)
                              setNewPermissionLevel(member.projectUser.permissionLevel)
                            }}
                            className="p-2 text-gray-400 hover:text-purple-600"
                            title="Edit Permissions"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveUser(member.user.id, member.user.name)}
                            className="p-2 text-gray-400 hover:text-red-600"
                            title="Remove from Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {editingUser === member.user.id && member.user.id !== state.currentUser?.id ? (
                // Permission editing section (keep existing code)
                <div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">Update Permission Level</label>
                    <select
                      value={newPermissionLevel}
                      onChange={(e) => setNewPermissionLevel(e.target.value)}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      {state.permissionLevels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setEditingUser(null)
                        setNewPermissionLevel("")
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateUserPermission(member.user.id, newPermissionLevel)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
                    >
                      Update Permission
                    </button>
                  </div>
                </div>
              ) : editingUser !== member.user.id ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-700">Current Permission Level:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        member.permissionLevel.id === "admin"
                          ? "bg-red-100 text-red-700"
                          : member.permissionLevel.id === "casting_director"
                            ? "bg-blue-100 text-blue-700"
                            : member.permissionLevel.id === "producer"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {member.permissionLevel.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{member.permissionLevel.description}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderRolesTab = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Permission Roles & Capabilities</h3>

        <div className="space-y-6">
          {state.permissionLevels.map((level) => {
            const capabilities = getPermissionCapabilities(level.id)

            return (
              <div key={level.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-3 rounded-lg ${
                        level.id === "admin"
                          ? "bg-red-100 text-red-600"
                          : level.id === "casting_director"
                            ? "bg-blue-100 text-blue-600"
                            : level.id === "producer"
                              ? "bg-purple-100 text-purple-600"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {level.id === "admin" ? (
                        <Crown className="w-6 h-6" />
                      ) : level.id === "casting_director" ? (
                        <Users className="w-6 h-6" />
                      ) : level.id === "producer" ? (
                        <Film className="w-6 h-6" />
                      ) : (
                        <Eye className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{level.label}</h4>
                      <p className="text-sm text-gray-600">{level.description}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(capabilities).map(([capability, hasAccess]) => (
                    <div key={capability} className="flex items-center space-x-2">
                      {hasAccess ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm ${hasAccess ? "text-gray-800" : "text-gray-400"}`}>
                        {capability
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())
                          .trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Permission Guidelines</h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Producer users have full control over the project and can manage all permissions</li>
                <li>• Casting Directors can manage actors and characters but cannot modify project settings</li>
                <li>• Directors can vote and view reports but have limited editing capabilities</li>
                <li>• Viewers have read-only access and can only add notes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderInviteTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Mail className="w-6 h-6 text-emerald-600" />
          <h3 className="text-lg font-semibold">Invite Team Members</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleInviteUser()
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role/Title</label>
                <input
                  type="text"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Assistant Director"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permission Level *</label>
                <select
                  value={inviteForm.permissionLevel}
                  onChange={(e) => setInviteForm({ ...inviteForm, permissionLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {state.permissionLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Selected Permission Level</h4>
              {(() => {
                const selectedLevel = state.permissionLevels.find((l) => l.id === inviteForm.permissionLevel)
                return selectedLevel ? <p className="text-sm text-gray-600">{selectedLevel.description}</p> : null
              })()}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
              >
                Send Invitation
              </button>
              <button
                type="button"
                onClick={() =>
                  setInviteForm({
                    email: "",
                    name: "",
                    role: "",
                    permissionLevel: "viewer",
                  })
                }
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Invitation Process</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Invited users will receive an email with a secure invitation link</li>
                <li>• They can create an account or sign in with existing credentials</li>
                <li>• Access is granted immediately upon accepting the invitation</li>
                <li>• You can modify permissions at any time after they join</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderSettingsTab = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Project Permission Settings</h3>

        {/* Project Access Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-800 mb-4">Project Access Control</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-800">Public Project</h5>
                <p className="text-sm text-gray-600">Allow anyone with the link to view this project</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-800">Require Approval for New Members</h5>
                <p className="text-sm text-gray-600">
                  Admin approval required before new members can access the project
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-800">Allow Guest Comments</h5>
                <p className="text-sm text-gray-600">Let non-members add comments when shared a direct link</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Data Access Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-800 mb-4">Data Access & Export</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-800">Allow Data Export</h5>
                <p className="text-sm text-gray-600">
                  Members can export project data (based on their permission level)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-800">Audit Log</h5>
                <p className="text-sm text-gray-600">Track all user actions and permission changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-800 mb-4">Security Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-gray-600" />
                <div>
                  <h5 className="font-medium text-gray-800">Two-Factor Authentication</h5>
                  <p className="text-sm text-gray-600">Require 2FA for all admin users</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
                Configure
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Key className="w-5 h-5 text-gray-600" />
                <div>
                  <h5 className="font-medium text-gray-800">Session Timeout</h5>
                  <p className="text-sm text-gray-600">Automatically log out inactive users after 8 hours</p>
                </div>
              </div>
              <select className="px-3 py-2 border border-gray-300 rounded-md text-sm" defaultValue="8 hours">
                <option>2 hours</option>
                <option>4 hours</option>
                <option>8 hours</option>
                <option>24 hours</option>
                <option>Never</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <div>
                  <h5 className="font-medium text-gray-800">IP Restrictions</h5>
                  <p className="text-sm text-gray-600">Limit access to specific IP addresses or ranges</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">
                Configure
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h4 className="font-semibold text-red-800 mb-4">Danger Zone</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
              <div>
                <h5 className="font-medium text-red-800">Transfer Project Ownership</h5>
                <p className="text-sm text-red-600">Transfer this project to another admin user</p>
              </div>
              <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">Transfer</button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
              <div>
                <h5 className="font-medium text-red-800">Archive Project</h5>
                <p className="text-sm text-red-600">Archive this project and revoke all access</p>
              </div>
              <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">Archive</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold">Settings & Permissions</h2>
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
            { key: "overview", label: "Overview", icon: Users },
            { key: "manage", label: "Manage Users", icon: Settings },
            { key: "roles", label: "Roles & Permissions", icon: Shield },
            { key: "invite", label: "Invite Members", icon: UserPlus },
            { key: "settings", label: "Project Settings", icon: Lock },
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
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "manage" && renderManageTab()}
        {activeTab === "roles" && renderRolesTab()}
        {activeTab === "invite" && renderInviteTab()}
        {activeTab === "settings" && renderSettingsTab()}
      </div>
    </div>
  )
}
