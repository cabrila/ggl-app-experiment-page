"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import {
  X,
  Plus,
  Trash2,
  Edit3,
  FolderOpen,
  Building,
  User,
  Settings,
  Users,
  Theater,
  Home,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
} from "lucide-react"
import { openModal, replaceModal, navigateToModal } from "./ModalManager"
import type { Project } from "@/types/casting"

interface ProjectManagerModalProps {
  onClose: () => void
}

export default function ProjectManagerModal({ onClose }: ProjectManagerModalProps) {
  const { state, dispatch } = useCasting()
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "team" | "settings">("overview")
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | "loading" | null
    message: string
  }>({ type: null, message: "" })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getProjectStats = (project: Project) => {
    const totalCharacters = project.characters.length
    const totalActors = project.characters.reduce((sum, char) => {
      return (
        sum +
        char.actors.longList.length +
        char.actors.audition.length +
        char.actors.approval.length +
        char.actors.shortLists.reduce((slSum, sl) => slSum + sl.actors.length, 0)
      )
    }, 0)

    const greenlitActors = project.characters.reduce((sum, char) => {
      return (
        sum +
        char.actors.longList.filter((a) => a.isGreenlit).length +
        char.actors.audition.filter((a) => a.isGreenlit).length +
        char.actors.approval.filter((a) => a.isGreenlit).length +
        char.actors.shortLists.reduce((slSum, sl) => slSum + sl.actors.filter((a) => a.isGreenlit).length, 0)
      )
    }, 0)

    return { totalCharacters, totalActors, greenlitActors }
  }

  const handleUpdateProject = (updatedProject: Project) => {
    dispatch({
      type: "UPDATE_PROJECT",
      payload: updatedProject,
    })
    setEditingProject(null)
  }

  const handleCreateProject = (newProject: Project) => {
    dispatch({
      type: "CREATE_PROJECT",
      payload: newProject,
    })
    setShowCreateForm(false)
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Current Project Summary */}
      {currentProject && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold text-success-800">{currentProject.name}</h3>
              <p className="text-sm text-success-600">{currentProject.details.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
dispatch({ type: "SELECT_PROJECT", payload: currentProject.id })
  replaceModal("characters")
  }}
                className="p-2 text-success-600 hover:text-success-800 hover:bg-success-100 rounded-lg transition-colors"
                title="View Characters"
              >
                <Theater className="w-5 h-5" />
              </button>
              <span className="bg-success-100 text-success-700 px-2 py-1 rounded-full text-xs font-medium">
                Current Project
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-success-600 font-medium">Characters:</span>
              <span className="ml-1">{getProjectStats(currentProject).totalCharacters}</span>
            </div>
            <div>
              <span className="text-success-600 font-medium">Total Actors:</span>
              <span className="ml-1">{getProjectStats(currentProject).totalActors}</span>
            </div>
            <div>
              <span className="text-success-600 font-medium">Greenlit:</span>
              <span className="ml-1">{getProjectStats(currentProject).greenlitActors}</span>
            </div>
          </div>
        </div>
      )}

      {/* All Projects List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">All Projects</h3>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-3 py-2 bg-success-500 text-white rounded-md hover:bg-success-600 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {state.projects.map((project) => {
            const stats = getProjectStats(project)
            const isActive = project.id === state.currentFocus.currentProjectId

            return (
              <div
                key={project.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                  isActive ? "border-success-300 bg-success-50" : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 truncate">{project.name}</h4>
                    <p className="text-sm text-gray-600">{project.details.type}</p>
                    <p className="text-xs text-gray-500 mt-1">Created: {formatDate(project.createdDate)}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
dispatch({ type: "SELECT_PROJECT", payload: project.id })
  replaceModal("characters")
  }}
                      className="p-1.5 text-gray-400 hover:text-success-600 hover:bg-success-50 rounded-md transition-colors"
                      title="View Characters"
                    >
                      <Theater className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingProject(project)}
                      className="p-1.5 text-gray-400 hover:text-info-600 hover:bg-info-50 rounded-md transition-colors"
                      title="Edit Project"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project)}
                      className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-md transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1 text-gray-400" />
                    <span className="text-xs">{stats.totalCharacters}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1 text-gray-400" />
                    <span className="text-xs">{stats.totalActors}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-1"></span>
                    <span className="text-xs">{stats.greenlitActors}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 truncate max-w-[120px]">
                    <Building className="w-3 h-3 inline mr-1" />
                    {project.details.productionCompany}
                  </div>
                  {!isActive && (
                    <button
                      onClick={() => {
                        // Select project and stay in project manager (don't close)
                        dispatch({ type: "SELECT_PROJECT", payload: project.id })
                      }}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                    >
                      Switch
                    </button>
                  )}
                  {isActive && (
                    <span className="px-2 py-1 bg-success-100 text-success-700 rounded text-xs">Active</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderDetailsTab = () => {
    if (!currentProject) {
      return <div className="text-center text-gray-500 py-8">No project selected</div>
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Project Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Name</label>
                <p className="mt-1 text-sm text-gray-900">{currentProject.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <p className="mt-1 text-sm text-gray-900">{currentProject.details.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Production Company</label>
                <p className="mt-1 text-sm text-gray-900">{currentProject.details.productionCompany}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Director</label>
                <p className="mt-1 text-sm text-gray-900">{currentProject.details.director}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Producer</label>
                <p className="mt-1 text-sm text-gray-900">{currentProject.details.producer}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Project Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{currentProject.details.description}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Script Link</label>
                <a
                  href={currentProject.details.scriptLink}
                  className="mt-1 text-sm text-emerald-600 hover:text-emerald-800"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {currentProject.details.scriptLink}
                </a>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(currentProject.createdDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Modified</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(currentProject.modifiedDate)}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Characters Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentProject.characters.map((character) => {
              const characterStats = {
                longList: character.actors.longList.length,
                shortLists: character.actors.shortLists.reduce((sum, sl) => sum + sl.actors.length, 0),
                audition: character.actors.audition.length,
                approval: character.actors.approval.length,
              }

              return (
                <div key={character.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">{character.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{character.description}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Long List:</span>
                      <span>{characterStats.longList}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shortlists:</span>
                      <span>{characterStats.shortLists}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Audition:</span>
                      <span>{characterStats.audition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approval:</span>
                      <span>{characterStats.approval}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderTeamTab = () => {
    if (!currentProject) {
      return <div className="text-center text-gray-500 py-8">No project selected</div>
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Team Members</h3>
          <button
            onClick={() => alert("Add team member functionality coming soon!")}
            className="flex items-center px-3 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Member
          </button>
        </div>

        <div className="space-y-3">
          {currentProject.projectUsers.map((projectUser) => {
            const user = state.users.find((u) => u.id === projectUser.userId)
            if (!user) return null

            const permissionLevel = state.permissionLevels.find((p) => p.id === projectUser.permissionLevel)

            return (
              <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ backgroundColor: user.bgColor, color: user.color }}
                  >
                    {user.initials}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{user.name}</h4>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {permissionLevel?.label || projectUser.permissionLevel}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{permissionLevel?.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-2">Permission Levels</h4>
          <div className="space-y-2">
            {state.permissionLevels.map((level) => (
              <div key={level.id} className="flex justify-between items-center text-sm">
                <span className="font-medium">{level.label}:</span>
                <span className="text-gray-600">{level.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handleExportProject = (project: Project) => {
    try {
      // Create comprehensive export data including all modules
      const exportData = {
        version: "3.0",
        exportDate: new Date().toISOString(),
        exportedBy: state.currentUser?.name || "Unknown User",
        project: {
          ...project,
          // Include additional metadata for validation
          exportMetadata: {
            totalCharacters: project.characters.length,
            totalActors: project.characters.reduce((sum, char) => {
              return (
                sum +
                char.actors.longList.length +
                char.actors.audition.length +
                char.actors.approval.length +
                char.actors.shortLists.reduce((slSum, sl) => slSum + sl.actors.length, 0) +
                Object.entries(char.actors)
                  .filter(([key]) => !["longList", "audition", "approval", "shortLists"].includes(key))
                  .reduce((customSum, [, actors]) => customSum + (Array.isArray(actors) ? actors.length : 0), 0)
              )
            }, 0),
            exportTimestamp: Date.now(),
            hasCustomTabs: state.tabDefinitions.some((tab) => tab.isCustom),
            hasRenamedTabs: Object.keys(state.tabDisplayNames).length > 0,
            customTabsCount: state.tabDefinitions.filter((tab) => tab.isCustom).length,
            // Module coverage summary
            hasScript: !!(project as any).script?.blocks?.length,
            hasProps: !!((project as any).props?.length || (project as any).propInventory?.length),
            hasLocations: !!((project as any).locations?.length || (project as any).locationInventory?.length),
            hasCostumes: !!(project as any).costumes?.inventory?.length,
            hasSchedule: state.scheduleEntries.length > 0,
            hasScenes: state.scenes.length > 0,
          },
        },
        // Schedule data (lives on global state, not the project)
        schedule: {
          entries: state.scheduleEntries,
          scenes: state.scenes,
          productionPhases: state.productionPhases,
        },
        // Tab structure and display names
        tabStructure: {
          definitions: state.tabDefinitions,
          displayNames: state.tabDisplayNames,
          order: state.tabDefinitions.map((tab) => tab.key),
        },
        // Related data for full restoration
        relatedData: {
          users: state.users.filter((user) => project.projectUsers.some((pu) => pu.userId === user.id)),
          permissionLevels: state.permissionLevels,
          predefinedStatuses: state.predefinedStatuses,
          terminology: project.terminology || state.terminology,
        },
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${project.name.replace(/\s+/g, "_")}_complete_export_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Show success message
      setImportStatus({
        type: "success",
        message: `Project "${project.name}" exported successfully!`,
      })
      setTimeout(() => setImportStatus({ type: null, message: "" }), 3000)
    } catch (error) {
      console.error("Export failed:", error)
      setImportStatus({
        type: "error",
        message: "Failed to export project. Please try again.",
      })
      setTimeout(() => setImportStatus({ type: null, message: "" }), 5000)
    }
  }

  const handleImportProject = async (file: File) => {
    setImportStatus({ type: "loading", message: "Importing project..." })

    try {
      const fileContent = await file.text()
      let importData: any

      try {
        importData = JSON.parse(fileContent)
      } catch (parseError) {
        throw new Error("Invalid JSON file format. Please ensure the file is a valid JSON export.")
      }

      console.log("Import data structure:", importData)
      console.log("Import data keys:", Object.keys(importData))

      let projectData: any
      let tabStructure: any = null
      let isNewFormat = false
      let isEnhancedFormat = false

      // Check if this is the enhanced export format (v2.0+)
      if (
        importData.version &&
        Number.parseFloat(importData.version) >= 2.0 &&
        importData.project &&
        importData.tabStructure
      ) {
        // Enhanced format with tab structure
        isEnhancedFormat = true
        isNewFormat = true
        console.log("Detected enhanced format with version:", importData.version)

        if (!["2.0", "3.0"].includes(importData.version)) {
          throw new Error(
            `Unsupported enhanced file version: ${importData.version}. Please use a file exported from a compatible version of the application.`,
          )
        }

        projectData = importData.project
        tabStructure = importData.tabStructure
      }
      // Check if this is the standard new format (v1.0)
      else if (importData.version && importData.project) {
        // Standard new format with metadata wrapper
        isNewFormat = true
        console.log("Detected standard new format with version:", importData.version)

        if (importData.version !== "1.0") {
          throw new Error(
            `Unsupported file version: ${importData.version}. Please use a file exported from this version of the application.`,
          )
        }

        projectData = importData.project
      }
      // Check if this looks like direct project data
      else if (importData.name && (importData.characters || importData.details)) {
        // Direct project data format
        projectData = importData
        console.log("Detected direct project format")
      }
      // Check if this might be an array of projects
      else if (Array.isArray(importData) && importData.length > 0) {
        // Array format - take the first project
        const firstItem = importData[0]
        if (firstItem.name && (firstItem.characters || firstItem.details)) {
          projectData = firstItem
          console.log("Detected array format, using first project")
        } else {
          throw new Error("Array format detected but items don't appear to be valid projects")
        }
      }
      // Try to find project data in nested structure
      else {
        console.log("Trying nested search...")
        const possibleProject = findProjectInData(importData)
        if (possibleProject) {
          projectData = possibleProject
          console.log("Found project data in nested structure")
        } else {
          // Show more detailed error with what we actually found
          const dataInfo = {
            type: typeof importData,
            isArray: Array.isArray(importData),
            keys: typeof importData === "object" && importData !== null ? Object.keys(importData) : [],
            hasName: importData?.name !== undefined,
            hasCharacters: importData?.characters !== undefined,
            hasDetails: importData?.details !== undefined,
            hasProject: importData?.project !== undefined,
            hasVersion: importData?.version !== undefined,
          }

          console.log("Data analysis:", dataInfo)

          throw new Error(
            `Invalid project file format. The file does not contain recognizable project data.

File analysis:
- Type: ${dataInfo.type}
- Is Array: ${dataInfo.isArray}
- Keys found: ${dataInfo.keys.join(", ")}
- Has name: ${dataInfo.hasName}
- Has characters: ${dataInfo.hasCharacters}
- Has details: ${dataInfo.hasDetails}

Please ensure you're importing a file exported from this application, or check the console for more details.`,
          )
        }
      }

      console.log("Project data to import:", projectData)

      // More flexible validation of essential project fields
      if (!projectData.name || typeof projectData.name !== "string" || projectData.name.trim() === "") {
        // Try to create a default name if missing
        projectData.name = `Imported Project ${new Date().toLocaleDateString()}`
        console.log("Created default project name:", projectData.name)
      }

      // Ensure characters array exists (can be empty)
      if (!projectData.characters) {
        projectData.characters = []
        console.log("Created empty characters array")
      } else if (!Array.isArray(projectData.characters)) {
        console.log("Characters is not an array, converting:", typeof projectData.characters)
        projectData.characters = []
      }

      // Validate and fix project details structure
      if (!projectData.details || typeof projectData.details !== "object") {
        projectData.details = {
          type: "Feature Film",
          productionCompany: "",
          director: "",
          producer: "",
          scriptLink: "",
          description: "",
        }
        console.log("Created default project details")
      } else {
        // Ensure all required detail fields exist
        const defaultDetails = {
          type: "Feature Film",
          productionCompany: "",
          director: "",
          producer: "",
          scriptLink: "",
          description: "",
        }
        projectData.details = { ...defaultDetails, ...projectData.details }
      }

      // Ensure projectUsers exists
      if (!projectData.projectUsers || !Array.isArray(projectData.projectUsers)) {
        projectData.projectUsers = []
        console.log("Created default project users array")
      }

      // Ensure timestamps exist
      if (!projectData.createdDate || typeof projectData.createdDate !== "number") {
        projectData.createdDate = Date.now()
      }

      // Handle tab structure restoration for enhanced format
      let updatedTabDefinitions = state.tabDefinitions
      let updatedTabDisplayNames = state.tabDisplayNames

      if (isEnhancedFormat && tabStructure) {
        console.log("🔧 Restoring tab structure from enhanced export")

        // Validate tab structure
        if (tabStructure.definitions && Array.isArray(tabStructure.definitions)) {
          // Merge imported tab definitions with existing ones, preserving system tabs
          const systemTabs = state.tabDefinitions.filter((tab) => !tab.isCustom)
          const importedCustomTabs = tabStructure.definitions.filter((tab: any) => tab.isCustom)

          // Create new tab definitions maintaining order from import
          const orderedTabs = []

          // Add system tabs first in their original order
          systemTabs.forEach((systemTab) => {
            const importedTab = tabStructure.definitions.find((t: any) => t.key === systemTab.key)
            if (importedTab) {
              // Use imported tab data but preserve system status
              orderedTabs.push({ ...importedTab, isCustom: false })
            } else {
              // Keep original system tab
              orderedTabs.push(systemTab)
            }
          })

          // Add custom tabs in the order they appear in the import
          if (tabStructure.order && Array.isArray(tabStructure.order)) {
            tabStructure.order.forEach((tabKey: string) => {
              const customTab = importedCustomTabs.find((t: any) => t.key === tabKey)
              if (customTab && !orderedTabs.some((t) => t.key === tabKey)) {
                orderedTabs.push(customTab)
              }
            })
          } else {
            // Fallback: add custom tabs in definition order
            importedCustomTabs.forEach((customTab: any) => {
              if (!orderedTabs.some((t) => t.key === customTab.key)) {
                orderedTabs.push(customTab)
              }
            })
          }

          updatedTabDefinitions = orderedTabs
          console.log(
            "✅ Tab definitions restored:",
            updatedTabDefinitions.map((t) => `${t.name} (${t.key})`),
          )
        }

        // Restore display names
        if (tabStructure.displayNames && typeof tabStructure.displayNames === "object") {
          updatedTabDisplayNames = { ...state.tabDisplayNames, ...tabStructure.displayNames }
          console.log("✅ Tab display names restored:", Object.keys(updatedTabDisplayNames))
        }
      }

      // Check if project with same name already exists
      const existingProject = state.projects.find((p) => p.name === projectData.name)
      if (existingProject) {
        const shouldOverwrite = window.confirm(
          `A project named "${projectData.name}" already exists. Do you want to overwrite it?`,
        )
        if (!shouldOverwrite) {
          setImportStatus({ type: null, message: "" })
          return
        }
      }

      // Generate new IDs to avoid conflicts
      const newProjectId = `proj_${Date.now()}_imported`
      const importedProject: Project = {
        id: newProjectId,
        name: projectData.name,
        details: projectData.details,
        createdDate: projectData.createdDate,
        modifiedDate: Date.now(),
        // Update project users to include current user if not already included
        projectUsers: [
          ...projectData.projectUsers,
          ...(projectData.projectUsers.some((pu: any) => pu.userId === state.currentUser?.id)
            ? []
            : [{ userId: state.currentUser?.id || "", permissionLevel: "admin" }]),
        ],
        // Preserve module data from the export
        ...(projectData.script ? { script: projectData.script } : {}),
        ...(projectData.props ? { props: projectData.props } : {}),
        ...(projectData.propInventory ? { propInventory: projectData.propInventory } : {}),
        ...(projectData.locations ? { locations: projectData.locations } : {}),
        ...(projectData.locationInventory ? { locationInventory: projectData.locationInventory } : {}),
        ...(projectData.costumes ? { costumes: projectData.costumes } : {}),
        ...(projectData.canvasActors ? { canvasActors: projectData.canvasActors } : {}),
        ...(projectData.terminology ? { terminology: projectData.terminology } : {}),
        // Process characters with more robust error handling
        characters: projectData.characters.map((character: any, charIndex: number) => {
          const newCharId = `char_${Date.now()}_${charIndex}_${Math.random().toString(36).substr(2, 9)}`

          // Ensure character has required structure
          const processedCharacter = {
            id: newCharId,
            name: character?.name || `Character ${charIndex + 1}`,
            description: character?.description || "",
            actors: {
              longList: [],
              audition: [],
              approval: [],
              shortLists: [],
            },
          }

          // Process actors if they exist
          if (character?.actors && typeof character.actors === "object") {
            // Process standard lists
            ;["longList", "audition", "approval"].forEach((listKey) => {
              if (Array.isArray(character.actors[listKey])) {
                processedCharacter.actors[listKey] = character.actors[listKey].map(
                  (actor: any, actorIndex: number) => ({
                    id: `actor_${Date.now()}_${charIndex}_${listKey}_${actorIndex}_${Math.random().toString(36).substr(2, 9)}`,
                    name: actor?.name || `Actor ${actorIndex + 1}`,
                    currentListKey: listKey, // Ensure actor knows its current location
                    // Preserve all other actor properties
                    ...actor,
                  }),
                )
              }
            })

            // Process shortlists
            if (Array.isArray(character.actors.shortLists)) {
              processedCharacter.actors.shortLists = character.actors.shortLists.map(
                (shortlist: any, slIndex: number) => ({
                  id: `sl_${Date.now()}_${charIndex}_${slIndex}_${Math.random().toString(36).substr(2, 9)}`,
                  name: shortlist?.name || `Shortlist ${slIndex + 1}`,
                  actors: Array.isArray(shortlist?.actors)
                    ? shortlist.actors.map((actor: any, actorIndex: number) => ({
                        id: `actor_${Date.now()}_${charIndex}_sl${slIndex}_${actorIndex}_${Math.random().toString(36).substr(2, 9)}`,
                        name: actor?.name || `Actor ${actorIndex + 1}`,
                        currentListKey: "shortLists",
                        currentShortlistId: `sl_${Date.now()}_${charIndex}_${slIndex}_${Math.random().toString(36).substr(2, 9)}`,
                        ...actor,
                      }))
                    : [],
                  // Preserve other shortlist properties
                  ...shortlist,
                }),
              )
            }

            // Process custom tabs - preserve all custom tabs from the import
            Object.entries(character.actors).forEach(([key, actors]) => {
              if (!["longList", "audition", "approval", "shortLists"].includes(key)) {
                if (Array.isArray(actors)) {
                  processedCharacter.actors[key] = actors.map((actor: any, actorIndex: number) => ({
                    id: `actor_${Date.now()}_${charIndex}_${key}_${actorIndex}_${Math.random().toString(36).substr(2, 9)}`,
                    name: actor?.name || `Actor ${actorIndex + 1}`,
                    currentListKey: key, // Ensure actor knows its current location
                    ...actor,
                  }))
                } else {
                  // Handle non-array custom properties
                  processedCharacter.actors[key] = actors
                }
              }
            })

            // If enhanced format, ensure all imported custom tabs exist in character structure
            if (isEnhancedFormat && tabStructure?.definitions) {
              tabStructure.definitions.forEach((tabDef: any) => {
                if (tabDef.isCustom && !processedCharacter.actors[tabDef.key]) {
                  // Create empty array for custom tabs that don't exist in this character
                  processedCharacter.actors[tabDef.key] = []
                  console.log(`Created empty custom tab "${tabDef.key}" for character "${processedCharacter.name}"`)
                }
              })
            }
          }

          return processedCharacter
        }),
      }

      console.log("Final imported project:", importedProject)

      // Update global tab structure if enhanced format was imported
      if (isEnhancedFormat && tabStructure) {
        // First update tab definitions
        dispatch({
          type: "UPDATE_TAB_DEFINITIONS",
          payload: updatedTabDefinitions,
        })

        // Then update display names
        Object.entries(updatedTabDisplayNames).forEach(([tabKey, displayName]) => {
          if (displayName && displayName !== state.tabDefinitions.find((t) => t.key === tabKey)?.name) {
            dispatch({
              type: "UPDATE_TAB_DISPLAY_NAME",
              payload: { tabKey, displayName },
            })
          }
        })

        console.log("✅ Global tab structure updated")
      }

      // If overwriting, remove the existing project first
      if (existingProject) {
        dispatch({
          type: "DELETE_PROJECT",
          payload: existingProject.id,
        })
      }

      // Add the imported project
      dispatch({
        type: "CREATE_PROJECT",
        payload: importedProject,
      })

      // Switch to the imported project
      dispatch({
        type: "SELECT_PROJECT",
        payload: newProjectId,
      })

      // Restore schedule data if present (v3.0+)
      let scheduleRestored = false
      if (importData.schedule && typeof importData.schedule === "object") {
        if (Array.isArray(importData.schedule.entries) && importData.schedule.entries.length > 0) {
          dispatch({ type: "SET_SCHEDULE_ENTRIES", payload: importData.schedule.entries })
        }
        if (Array.isArray(importData.schedule.scenes) && importData.schedule.scenes.length > 0) {
          dispatch({ type: "SET_SCENES", payload: importData.schedule.scenes })
        }
        if (Array.isArray(importData.schedule.productionPhases) && importData.schedule.productionPhases.length > 0) {
          dispatch({ type: "SET_PRODUCTION_PHASES", payload: importData.schedule.productionPhases })
        }
        scheduleRestored = true
        console.log("Schedule data restored:", {
          entries: importData.schedule.entries?.length || 0,
          scenes: importData.schedule.scenes?.length || 0,
          phases: importData.schedule.productionPhases?.length || 0,
        })
      }

      const totalActors = importedProject.characters.reduce((sum, char) => {
        return (
          sum +
          char.actors.longList.length +
          char.actors.audition.length +
          char.actors.approval.length +
          char.actors.shortLists.reduce((slSum, sl) => slSum + sl.actors.length, 0)
        )
      }, 0)

      // Build descriptive success message
      const modulesSummary: string[] = []
      if ((importedProject as any).script?.blocks?.length) modulesSummary.push("Script")
      if ((importedProject as any).props?.length || (importedProject as any).propInventory?.length) modulesSummary.push("Props")
      if ((importedProject as any).locations?.length || (importedProject as any).locationInventory?.length) modulesSummary.push("Locations")
      if ((importedProject as any).costumes?.inventory?.length) modulesSummary.push("Costumes")
      if (scheduleRestored) modulesSummary.push("Schedule")

      const modulesText = modulesSummary.length > 0 ? ` Modules restored: ${modulesSummary.join(", ")}.` : ""

      setImportStatus({
        type: "success",
        message: `Project "${projectData.name}" imported successfully! ${importedProject.characters.length} characters and ${totalActors} actors restored.${modulesText}${isEnhancedFormat ? " Tab structure preserved." : isNewFormat ? "" : " (Legacy format converted)"}`,
      })
      setTimeout(() => setImportStatus({ type: null, message: "" }), 5000)
    } catch (error) {
      console.error("Import failed:", error)
      setImportStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to import project. Please check the file format and try again.",
      })
      setTimeout(() => setImportStatus({ type: null, message: "" }), 8000)
    }
  }

  // Helper function to find project data in nested structures
  const findProjectInData = (data: any, depth = 0): any => {
    if (!data || typeof data !== "object" || depth > 5) return null

    console.log(`Searching at depth ${depth}:`, typeof data, Array.isArray(data))

    // Check if current object looks like a project
    if (data.name && typeof data.name === "string") {
      // More flexible project detection
      if (data.characters || data.details || data.projectUsers) {
        console.log("Found potential project at depth", depth, "with name:", data.name)
        return data
      }
    }

    // Search in nested objects and arrays
    for (const key in data) {
      if (data.hasOwnProperty(key) && typeof data[key] === "object" && data[key] !== null) {
        const found = findProjectInData(data[key], depth + 1)
        if (found) return found
      }
    }

    // If it's an array, check each item
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const found = findProjectInData(data[i], depth + 1)
        if (found) return found
      }
    }

    return null
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        setImportStatus({
          type: "error",
          message: "Please select a valid JSON file.",
        })
        setTimeout(() => setImportStatus({ type: null, message: "" }), 3000)
        return
      }
      handleImportProject(file)
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleAlternativeExport = (project: Project) => {
    try {
      // Create a comprehensive summary export data structure
      const exportData = {
        projectName: project.name,
        projectType: project.details.type,
        characterCount: project.characters.length,
        actorCount: project.characters.reduce((sum, char) => {
          return (
            sum +
            char.actors.longList.length +
            char.actors.audition.length +
            char.actors.approval.length +
            char.actors.shortLists.reduce((slSum, sl) => slSum + sl.actors.length, 0) +
            // Include custom tabs in count
            Object.entries(char.actors)
              .filter(([key]) => !["longList", "audition", "approval", "shortLists"].includes(key))
              .reduce((customSum, [, actors]) => customSum + (Array.isArray(actors) ? actors.length : 0), 0)
          )
        }, 0),
        exportDate: new Date().toISOString(),
        tabStructure: {
          totalTabs: state.tabDefinitions.length,
          customTabs: state.tabDefinitions.filter((tab) => tab.isCustom).length,
          renamedTabs: Object.keys(state.tabDisplayNames).length,
          tabNames: state.tabDefinitions.map((tab) => ({
            key: tab.key,
            name: tab.name,
            displayName: state.tabDisplayNames[tab.key] || tab.name,
            isCustom: tab.isCustom,
          })),
        },
        characterBreakdown: project.characters.map((char) => ({
          name: char.name,
          totalActors:
            Object.entries(char.actors)
              .filter(([key]) => key !== "shortLists")
              .reduce((sum, [, actors]) => sum + (Array.isArray(actors) ? actors.length : 0), 0) +
            char.actors.shortLists.reduce((sum, sl) => sum + sl.actors.length, 0),
          actorsByTab: {
            ...Object.fromEntries(
              Object.entries(char.actors)
                .filter(([key]) => key !== "shortLists")
                .map(([key, actors]) => [key, Array.isArray(actors) ? actors.length : 0]),
            ),
            shortLists:
              char.actors.shortLists.length > 0
                ? char.actors.shortLists.reduce((sum, sl) => sum + sl.actors.length, 0)
                : 0,
          },
        })),
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${project.name.replace(/\s+/g, "_")}_summary_export_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Show success message
      setImportStatus({
        type: "success",
        message: `Project summary for "${project.name}" exported successfully!`,
      })
      setTimeout(() => setImportStatus({ type: null, message: "" }), 3000)
    } catch (error) {
      console.error("Export failed:", error)
      setImportStatus({
        type: "error",
        message: "Failed to export project summary. Please try again.",
      })
      setTimeout(() => setImportStatus({ type: null, message: "" }), 5000)
    }
  }

  const renderSettingsTab = () => {
    return (
      <div className="space-y-6">
        {/* Data Management - Always Available */}

        <div>
          <h3 className="text-lg font-semibold mb-4">Data Management</h3>

          {/* Import/Export Status Messages */}
          {importStatus.type && (
            <div
              className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
                importStatus.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : importStatus.type === "error"
                    ? "bg-red-50 border border-red-200"
                    : "bg-blue-50 border border-blue-200"
              }`}
            >
              {importStatus.type === "success" && <CheckCircle className="w-5 h-5 text-green-600" />}
              {importStatus.type === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
              {importStatus.type === "loading" && (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              )}
              <span
                className={`text-sm ${
                  importStatus.type === "success"
                    ? "text-green-800"
                    : importStatus.type === "error"
                      ? "text-red-800"
                      : "text-blue-800"
                }`}
              >
                {importStatus.message}
              </span>
            </div>
          )}

          <div className="space-y-4">
            {/* Export Project - Always Available */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 flex items-center mb-2">
                    <Download className="w-4 h-4 mr-2" />
                    Export Project Data
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Download complete project data including all characters, actors, notes, votes, and settings
                  </p>

                  {/* Project Selection for Export */}
                  {state.projects.length > 0 ? (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Project to Export:</label>
                      <select
                        id="export-project-select"
                        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        defaultValue={currentProject?.id || ""}
                      >
                        {state.projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name} ({project.details.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        No projects available to export. Create a project first to use this feature.
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Exports all project data -- Script, Props, Locations, Costumes & Makeup, Schedule, characters, and tab structure -- into a single portable JSON file
                  </p>
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      const selectElement = document.getElementById("export-project-select") as HTMLSelectElement
                      const selectedProjectId = selectElement?.value || currentProject?.id
                      const projectToExport = state.projects.find((p) => p.id === selectedProjectId)
                      if (projectToExport) {
                        handleExportProject(projectToExport)
                      } else {
                        setImportStatus({
                          type: "error",
                          message: "No project selected for export.",
                        })
                        setTimeout(() => setImportStatus({ type: null, message: "" }), 3000)
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={importStatus.type === "loading" || state.projects.length === 0}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </button>

                  <button
                    onClick={() => {
                      const selectElement = document.getElementById("export-project-select") as HTMLSelectElement
                      const selectedProjectId = selectElement?.value || currentProject?.id
                      const projectToExport = state.projects.find((p) => p.id === selectedProjectId)
                      if (projectToExport) {
                        handleAlternativeExport(projectToExport)
                      } else {
                        setImportStatus({
                          type: "error",
                          message: "No project selected for export.",
                        })
                        setTimeout(() => setImportStatus({ type: null, message: "" }), 3000)
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={importStatus.type === "loading" || state.projects.length === 0}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Alt Export
                  </button>
                </div>
              </div>
            </div>

            {/* Import Project - Always Available */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Project Data
                </h4>
                <p className="text-sm text-gray-600 mt-1">Restore a project from a previously exported file</p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports JSON files exported from this application. If a project with the same name exists, you'll be
                  asked to confirm overwriting it.
                </p>
              </div>
              <div className="ml-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={importStatus.type === "loading"}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 text-sm"
                  disabled={importStatus.type === "loading"}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Project-Specific Settings - Only when project is selected */}
        {currentProject ? (
          <div>
            <h3 className="text-lg font-semibold mb-4">Project-Specific Settings</h3>
            <p className="text-sm text-gray-600 mb-4">
              Settings for: <span className="font-semibold">{currentProject.name}</span>
            </p>

            <div className="space-y-4">
              {/* Archive Project */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">Archive Project</h4>
                  <p className="text-sm text-gray-600">Move project to archived state</p>
                </div>
                <button
                  onClick={() => alert("Archive functionality coming soon!")}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
                  disabled={importStatus.type === "loading"}
                >
                  Archive
                </button>
              </div>

              {/* Delete Project */}
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h4 className="font-medium text-red-800">Delete Project</h4>
                  <p className="text-sm text-red-600">Permanently delete this project and all data</p>
                  <p className="text-xs text-red-500 mt-1">
                    This action cannot be undone. Consider exporting the project first
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteProject(currentProject)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                  disabled={importStatus.type === "loading"}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Project-Specific Settings</h3>
            <p className="text-gray-600 mb-4">
              Select a project from the Overview tab to access project-specific settings like archiving and deletion.
            </p>
            <button
              onClick={() => setActiveTab("overview")}
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 text-sm"
            >
              Go to Overview
            </button>
          </div>
        )}

        {/* Backup & Recovery - Always Available */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Backup & Recovery</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Automatic Backups</h4>
              <p className="text-sm text-gray-600 mb-3">Data is automatically saved to your browser's local storage</p>
              <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                Configure Backups
              </button>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Data Retention</h4>
              <p className="text-sm text-gray-600 mb-3">Keep deleted items for 30 days</p>
              <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                View Trash
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleDeleteProject = (project: Project) => {
    openModal("confirmDelete", {
      title: "Delete Project",
      message: `Are you sure you want to delete "${project.name}"? This will permanently delete all characters, actors, and casting data. This cannot be undone.`,
      onConfirm: () => {
        dispatch({
          type: "DELETE_PROJECT",
          payload: project.id,
        })
      },
    })
  }

  const renderCreateProjectForm = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Create New Project</h3>
        <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          const newProject: Project = {
            id: `proj_${Date.now()}`,
            name: formData.get("name") as string,
            details: {
              type: formData.get("type") as string,
              productionCompany: formData.get("productionCompany") as string,
              director: formData.get("director") as string,
              producer: formData.get("producer") as string,
              scriptLink: formData.get("scriptLink") as string,
              description: formData.get("description") as string,
            },
            createdDate: Date.now(),
            modifiedDate: Date.now(),
            characters: [],
            projectUsers: [
              {
                userId: state.currentUser?.id || "",
                permissionLevel: "admin",
              },
            ],
          }
          handleCreateProject(newProject)
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Jurassic Park - Remake"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              name="type"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select type...</option>
              <option value="Feature Film">Feature Film</option>
              <option value="TV Series">TV Series</option>
              <option value="Non-Fiction TV">Non-Fiction TV</option>
              <option value="Short Film">Short Film</option>
              <option value="Commercial">Commercial</option>
              <option value="Theater">Theater</option>
              <option value="Web Series">Web Series</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Production Company</label>
            <input
              type="text"
              name="productionCompany"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Amblin Entertainment"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Director</label>
            <input
              type="text"
              name="director"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Steven Spielberg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producer</label>
            <input
              type="text"
              name="producer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Kathleen Kennedy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Script Link</label>
            <input
              type="url"
              name="scriptLink"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="https://..."
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Brief description of the project..."
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600">
            Create Project
          </button>
        </div>
      </form>
    </div>
  )

  const renderEditProjectForm = () => {
    if (!editingProject) return null

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Edit Project: {editingProject.name}</h3>
          <button onClick={() => setEditingProject(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const updatedProject = {
              ...editingProject,
              name: formData.get("name") as string,
              details: {
                ...editingProject.details,
                type: formData.get("type") as string,
                productionCompany: formData.get("productionCompany") as string,
                director: formData.get("director") as string,
                producer: formData.get("producer") as string,
                scriptLink: formData.get("scriptLink") as string,
                description: formData.get("description") as string,
              },
              modifiedDate: Date.now(),
            }
            handleUpdateProject(updatedProject)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <input
                type="text"
                name="name"
                defaultValue={editingProject.name}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                name="type"
                defaultValue={editingProject.details.type}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Feature Film">Feature Film</option>
                <option value="TV Series">TV Series</option>
                <option value="Non-Fiction TV">Non-Fiction TV</option>
                <option value="Short Film">Short Film</option>
                <option value="Commercial">Commercial</option>
                <option value="Theater">Theater</option>
                <option value="Web Series">Web Series</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Production Company</label>
              <input
                type="text"
                name="productionCompany"
                defaultValue={editingProject.details.productionCompany}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Director</label>
              <input
                type="text"
                name="director"
                defaultValue={editingProject.details.director}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Producer</label>
              <input
                type="text"
                name="producer"
                defaultValue={editingProject.details.producer}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Script Link</label>
              <input
                type="url"
                name="scriptLink"
                defaultValue={editingProject.details.scriptLink}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={editingProject.details.description}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setEditingProject(null)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    )
  }

  // REMOVE THIS BLOCK
  // if (showCreateForm) {
  //   return (
  //     <div className="fixed inset-0 bg-background flex flex-col z-50">
  //       <div className="flex-1 overflow-y-auto p-6">
  //         <div className="max-w-4xl mx-auto">{renderCreateProjectForm()}</div>
  //       </div>
  //     </div>
  //   )
  // }

  // if (editingProject) {
  //   return (
  //     <div className="fixed inset-0 bg-background flex flex-col z-50">
  //       <div className="flex-1 overflow-y-auto p-6">
  //         <div className="max-w-4xl mx-auto">{renderEditProjectForm()}</div>
  //       </div>
  //     </div>
  //   )
  // }

  // MERGE POINT: The header and tab navigation need to be adjusted to accommodate the new sticky header
  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50">
      {/* Header - sticky at top */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-success-600 to-success-700 rounded-lg">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Project Manager</h2>
              <p className="text-sm text-gray-500">{state.projects.length} projects</p>
            </div>
          </div>
          {/* Header actions */}
          <div className="flex items-center gap-2">
            <button
onClick={() => navigateToModal("splashScreen")}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Main Menu"
            >
              <Home className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Main Menu</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b bg-card sticky top-20 z-10 bg-white">
        {" "}
        {/* Added sticky here */}
        <nav className="flex space-x-8 px-6">
          {[
            { key: "overview", label: "Overview", icon: FolderOpen },
            { key: "details", label: "Details", icon: Building },
            { key: "team", label: "Team", icon: Users },
            { key: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.key
                  ? "border-success-500 text-success-600"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Render create/edit forms if active */}
          {showCreateForm && renderCreateProjectForm()}
          {editingProject && renderEditProjectForm()}

          {/* Render tab content only if not showing forms */}
          {!showCreateForm && !editingProject && (
            <>
              {activeTab === "overview" && renderOverviewTab()}
              {activeTab === "details" && renderDetailsTab()}
              {activeTab === "team" && renderTeamTab()}
              {activeTab === "settings" && renderSettingsTab()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
