"use client"

import type React from "react"

import { useCasting } from "@/components/casting/CastingContext"
import type { Actor, Character } from "@/types/casting"
import { useState, useRef, useCallback, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  MessageSquare,
  GripVertical,
  X,
  Star,
  Heart,
  Plus,
  Edit2,
  Trash2,
  Save,
  User,
  MapPin,
  Calendar,
  MoreHorizontal,
  Tag,
  CheckCircle,
  Clock,
  ImageIcon,
  Play,
  Check,
  FolderPlus,
} from "lucide-react"
import { openModal } from "@/components/modals/ModalManager"
import type { Note } from "@/types/casting"

interface ActorCardProps {
  actor: Actor
  character: Character
  viewMode: string
  isDragging?: boolean
  isDropTarget?: boolean
  isSelected?: boolean
  dropPosition?: "before" | "after" | null
  onSelect?: (actorId: string, e: React.MouseEvent) => void
  onDragStart?: (e: React.DragEvent, actor: Actor) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent, actor: Actor) => void
  onDrop?: (e: React.DragEvent, actor: Actor) => void
}

const formatTimestamp = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

// Helper function to get video count from all video sources
const getVideoCount = (actor: Actor) => {
  let totalVideos = 0

  // Count submission videos (YouTube/Vimeo)
  if (actor.submissionVideos && Array.isArray(actor.submissionVideos)) {
    const validSubmissionVideos = actor.submissionVideos.filter(
      (video) =>
        video &&
        video.url &&
        (video.platform === "youtube" ||
          video.platform === "vimeo" ||
          video.url.includes("youtube.com") ||
          video.url.includes("youtu.be") ||
          video.url.includes("vimeo.com")),
    )
    totalVideos += validSubmissionVideos.length
  }

  // Count Vimeo videos
  if (actor.vimeoVideos && Array.isArray(actor.vimeoVideos)) {
    totalVideos += actor.vimeoVideos.length
  }

  // Count showreels that are video URLs
  if (actor.showreels && Array.isArray(actor.showreels)) {
    const videoShowreels = actor.showreels.filter(
      (reel) =>
        reel &&
        reel.url &&
        (reel.url.includes("youtube.com") || reel.url.includes("youtu.be") || reel.url.includes("vimeo.com")),
    )
    totalVideos += videoShowreels.length
  }

  // Count audition tapes that are video URLs
  if (actor.auditionTapes && Array.isArray(actor.auditionTapes)) {
    const videoAuditionTapes = actor.auditionTapes.filter(
      (tape) =>
        tape &&
        tape.url &&
        (tape.url.includes("youtube.com") || tape.url.includes("youtu.be") || tape.url.includes("vimeo.com")),
    )
    totalVideos += videoAuditionTapes.length
  }

  return totalVideos
}

export default function ActorCard({
  actor,
  character,
  viewMode,
  isDragging = false,
  isDropTarget = false,
  isSelected = false,
  dropPosition = null,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: ActorCardProps) {
  const { state, dispatch } = useCasting()
  const [currentHeadshotIndex, setCurrentHeadshotIndex] = useState(actor.currentCardHeadshotIndex || 0)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [imageLoading, setImageLoading] = useState<Set<number>>(new Set())
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Enhanced drag state management
  const [localDragState, setLocalDragState] = useState({
    isDragging: false,
    dragStartTime: 0,
  })
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Note functionality state
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [newNoteText, setNewNoteText] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Enhanced drag state cleanup
  const cleanupLocalDragState = useCallback(() => {
    console.log("🧹 ActorCard: Cleaning up local drag state for", actor.name)

    setLocalDragState({
      isDragging: false,
      dragStartTime: 0,
    })

    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
      dragTimeoutRef.current = null
    }
  }, [actor.name])

  // Effect to handle prop changes and cleanup
  useEffect(() => {
    if (!isDragging && localDragState.isDragging) {
      // Parent says we're not dragging anymore, clean up local state
      cleanupLocalDragState()
    }
  }, [isDragging, localDragState.isDragging, cleanupLocalDragState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
      }
    }
  }, [])

  const getActualHeadshotUrl = (index = 0) => {
    const headshots = actor.headshots || []

    if (headshots.length === 0) {
      return generatePlaceholderUrl()
    }

    const headshot = headshots[index]
    if (!headshot || typeof headshot !== "string") {
      return generatePlaceholderUrl()
    }

    if (headshot.startsWith("data:image/")) {
      return headshot
    }

    if (headshot.startsWith("http://") || headshot.startsWith("https://")) {
      return headshot
    }

    if (headshot.startsWith("/")) {
      return headshot
    }

    return generatePlaceholderUrl(headshot)
  }

  const generatePlaceholderUrl = (seed?: string) => {
    const placeholderSeed =
      seed ||
      actor.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()

    const size = viewMode === "list-view" ? "48x48" : viewMode === "simple" ? "120x120" : "200x240"
    return ""
  }

  const handleImageLoad = (index: number) => {
    setImageLoading((prev) => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
    setImageErrors((prev) => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }

  const handleImageError = (index: number) => {
    setImageLoading((prev) => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
    setImageErrors((prev) => {
      const newSet = new Set(prev)
      newSet.add(index)
      return newSet
    })
  }

  const handleImageLoadStart = (index: number) => {
    setImageLoading((prev) => {
      const newSet = new Set(prev)
      newSet.add(index)
      return newSet
    })
  }

  const getCurrentImageUrl = () => {
    const headshots = actor.headshots || []
    const validIndex = Math.min(currentHeadshotIndex, headshots.length - 1)

    if (imageErrors.has(validIndex)) {
      return generatePlaceholderUrl()
    }

    return getActualHeadshotUrl(validIndex)
  }

  // Contact status helper function
  const getContactStatus = () => {
    // Check if actor has any contact-related statuses
    const contactStatuses =
      actor.statuses?.filter(
        (status) =>
          status.category === "contact" ||
          status.label?.toLowerCase().includes("contact") ||
          status.label?.toLowerCase().includes("reached") ||
          status.label?.toLowerCase().includes("responded") ||
          status.label?.toLowerCase().includes("callback") ||
          status.label?.toLowerCase().includes("audition") ||
          status.label?.toLowerCase().includes("invite") ||
          status.label?.toLowerCase().includes("sent"),
      ) || []

    if (contactStatuses.length === 0) {
      return { status: "not-contacted", label: "Not Contacted", icon: Clock, color: "text-slate-400" }
    }

    // If any contact-related status exists, show as "Contacted"
    return { status: "contacted", label: "Contacted", icon: CheckCircle, color: "text-info-600" }
  }

  // Helper function to open Player View for this specific actor
  const handleOpenPlayerView = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Find the current list and actor index
    const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
    const currentCharacter = currentProject?.characters.find((c) => c.id === state.currentFocus.characterId)

    if (!currentCharacter) return

    const { activeTabKey } = state.currentFocus
    let currentList: any[] = []

    if (activeTabKey === "shortLists") {
      currentList = currentCharacter.actors.shortLists.flatMap((sl) => sl.actors).filter((a) => !a.isGreenlit)
    } else {
      const actors = currentCharacter.actors[activeTabKey as keyof typeof currentCharacter.actors]
      currentList = Array.isArray(actors) ? actors.filter((a) => !a.isGreenlit) : []
    }

    // Find the index of this actor in the current list
    const actorIndex = currentList.findIndex((a) => a.id === actor.id)

    if (actorIndex !== -1) {
      // Open Player View at this actor's index
      dispatch({
        type: "OPEN_PLAYER_VIEW",
        payload: { actorIndex },
      })
    }
  }

  // Utility function to check if drag contains image files
  const hasImageFiles = (dataTransfer: DataTransfer): boolean => {
    if (dataTransfer.files && dataTransfer.files.length > 0) {
      return Array.from(dataTransfer.files).some((file) => file.type.startsWith("image/"))
    }

    const types = Array.from(dataTransfer.types)
    return types.some((type) => type.includes("image") || type === "Files" || type === "application/x-moz-file")
  }

  // Enhanced image drag and drop handlers
  const handleImageDragEnter = (e: React.DragEvent) => {
    if (!hasImageFiles(e.dataTransfer)) {
      return
    }

    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleImageDragLeave = (e: React.DragEvent) => {
    if (!isDragOver) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false)
    }
  }

  const handleImageDragOver = (e: React.DragEvent) => {
    if (!hasImageFiles(e.dataTransfer)) {
      return
    }

    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "copy"
  }

  const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: "Please upload a valid image file (JPEG, PNG, GIF, or WebP)" }
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { isValid: false, error: "Image file size must be less than 10MB" }
    }

    return { isValid: true }
  }

  const processAndUploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          if (!ctx) {
            reject(new Error("Failed to create canvas context"))
            return
          }

          const maxWidth = 800
          const maxHeight = 1000
          let { width, height } = img

          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height
            if (width > height) {
              width = maxWidth
              height = width / aspectRatio
            } else {
              height = maxHeight
              width = height * aspectRatio
            }
          }

          canvas.width = width
          canvas.height = height

          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = () => reject(new Error("Failed to process image"))
                reader.readAsDataURL(blob)
              } else {
                reject(new Error("Failed to compress image"))
              }
            },
            "image/jpeg",
            0.85,
          )
        }

        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = e.target?.result as string
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })
  }

  const handleImageDrop = async (e: React.DragEvent) => {
    if (!hasImageFiles(e.dataTransfer)) {
      return
    }

    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setUploadError(null)

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))
    if (files.length === 0) {
      return
    }

    const file = files[0]
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      setUploadError(validation.error || "Invalid file")
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const processedImageUrl = await processAndUploadImage(file)

      clearInterval(progressInterval)
      setUploadProgress(100)

      const currentHeadshots = actor.headshots || []
      const updatedHeadshots = [processedImageUrl, ...currentHeadshots]

      dispatch({
        type: "UPDATE_ACTOR",
        payload: {
          actorId: actor.id,
          characterId: character.id,
          updates: {
            headshots: updatedHeadshots,
            currentCardHeadshotIndex: 0,
          },
        },
      })

      setCurrentHeadshotIndex(0)

      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed")
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Note functionality
  const handleAddNote = () => {
    if (!newNoteText.trim() || !state.currentUser) return

    const note: Note = {
      id: `note-${Date.now()}-${Math.random()}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      timestamp: Date.now(),
      text: newNoteText.trim(),
    }

    dispatch({
      type: "ADD_NOTE",
      payload: {
        actorId: actor.id,
        characterId: character.id,
        note,
      },
    })

    setNewNoteText("")
    setShowNoteForm(false)
  }

  const handleEditNote = (noteId: string, currentText: string) => {
    setEditingNoteId(noteId)
    setEditingText(currentText)
  }

  const handleSaveEdit = () => {
    if (!editingText.trim() || !editingNoteId) return

    dispatch({
      type: "UPDATE_NOTE",
      payload: {
        actorId: actor.id,
        characterId: character.id,
        noteId: editingNoteId,
        text: editingText.trim(),
      },
    })

    setEditingNoteId(null)
    setEditingText("")
  }

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      dispatch({
        type: "DELETE_NOTE",
        payload: {
          actorId: actor.id,
          characterId: character.id,
          noteId,
        },
      })
    }
  }

  const handleVote = (vote: "yes" | "no" | "maybe") => {
    if (!state.currentUser) return

    dispatch({
      type: "CAST_VOTE",
      payload: {
        actorId: actor.id,
        characterId: character.id,
        vote,
        userId: state.currentUser.id,
      },
    })
  }

  const navigateHeadshot = (direction: number) => {
    const headshots = actor.headshots || []
    if (headshots.length <= 1) return

    let newIndex = currentHeadshotIndex + direction
    if (newIndex < 0) newIndex = headshots.length - 1
    if (newIndex >= headshots.length) newIndex = 0

    setCurrentHeadshotIndex(newIndex)
  }

  // Click handlers
  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    openModal("editActor", { actor, characterId: character.id })
  }

  const handleMoreActions = (e: React.MouseEvent) => {
    e.stopPropagation()
    openModal("moreActions", { actor, characterId: character.id })
  }

  const handleManageStatuses = (e: React.MouseEvent) => {
    e.stopPropagation()
    openModal("manageStatuses", { actor, characterId: character.id })
  }

  const handleQuickAssignToProject = (e: React.MouseEvent) => {
    e.stopPropagation()
    openModal("assignToProject", { actor, sourceCharacterId: character.id })
  }

  const handleQuickStatusAssign = (status: any) => {
    const isAlreadyAssigned = actor.statuses?.some((s) => s.id === status.id)

    let updatedStatuses
    if (isAlreadyAssigned) {
      updatedStatuses = actor.statuses?.filter((s) => s.id !== status.id) || []
    } else {
      updatedStatuses = [...(actor.statuses || []), status]
    }

    dispatch({
      type: "UPDATE_ACTOR",
      payload: {
        actorId: actor.id,
        characterId: character.id,
        updates: { statuses: updatedStatuses },
      },
    })
  }

  const handleDeleteStatus = (statusId: string, statusLabel: string) => {
    if (window.confirm(`Are you sure you want to remove the "${statusLabel}" status?`)) {
      const updatedStatuses = actor.statuses?.filter((s) => s.id !== statusId) || []
      dispatch({
        type: "UPDATE_ACTOR",
        payload: {
          actorId: actor.id,
          characterId: character.id,
          updates: { statuses: updatedStatuses },
        },
      })
    }
  }

  // Enhanced Status Component with proper status display
  const StatusDisplay = ({ compact = false }: { compact?: boolean }) => {
    if (!actor.statuses || actor.statuses.length === 0) {
      return (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 italic">No status assigned</span>
        </div>
      )
    }

    // Sort statuses by priority (contact statuses first)
    const sortedStatuses = [...actor.statuses].sort((a, b) => {
      if (a.category === "contact" && b.category !== "contact") return -1
      if (a.category !== "contact" && b.category === "contact") return 1
      return 0
    })

    const maxStatuses = compact ? 2 : 3
    const displayStatuses = sortedStatuses.slice(0, maxStatuses)
    const hasMore = actor.statuses.length > displayStatuses.length

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {displayStatuses.map((status) => (
            <span
              key={status.id}
              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${status.bgColor} ${status.textColor} border border-current break-words max-w-full`}
            >
              <span className="truncate">{status.label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteStatus(status.id, status.label)
                }}
                className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 transition-colors flex-shrink-0"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          {hasMore && (
            <button
              onClick={handleManageStatuses}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex-shrink-0"
            >
              +{actor.statuses.length - displayStatuses.length} more
            </button>
          )}
        </div>
      </div>
    )
  }

  // Enhanced Notes Display Component - Show only one note
  const NotesDisplay = ({ compact = false }: { compact?: boolean }) => {
    if (!actor.notes || actor.notes.length === 0) {
      return null
    }

    // Show only the most recent note
    const sortedNotes = [...actor.notes].sort((a, b) => b.timestamp - a.timestamp)
    const latestNote = sortedNotes[0]
    const noteUser = state.users.find((u) => u.id === latestNote.userId)
    const isEditing = editingNoteId === latestNote.id

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
            <MessageSquare className="w-3 h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">
              Latest Note {actor.notes.length > 1 && `(${actor.notes.length} total)`}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowNoteForm(!showNoteForm)
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-success-600 hover:text-success-700 hover:bg-success-50 rounded-lg transition-colors flex-shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span className="whitespace-nowrap">Add</span>
          </button>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{
                  backgroundColor: noteUser?.bgColor || "#6B7280",
                  color: noteUser?.color || "#FFFFFF",
                }}
              >
                {noteUser?.initials || latestNote.userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-700 truncate">
                {noteUser?.name || latestNote.userName}
              </span>
              <span className="text-xs text-slate-500 whitespace-nowrap">{formatTimestamp(latestNote.timestamp)}</span>
            </div>
            {state.currentUser?.id === latestNote.userId && !isEditing && (
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditNote(latestNote.id, latestNote.text)
                  }}
                  className="p-1 text-slate-400 hover:text-info-600 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteNote(latestNote.id)
                  }}
                  className="p-1 text-slate-400 hover:text-error-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded resize-none focus:ring-2 focus:ring-info-500 focus:border-transparent"
                rows={2}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSaveEdit()
                  }}
                  className="flex items-center space-x-1 px-2 py-1 bg-info-600 text-white rounded text-xs hover:bg-info-700"
                >
                  <Save className="w-3 h-3" />
                  <span>Save</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingNoteId(null)
                    setEditingText("")
                  }}
                  className="px-2 py-1 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-700 leading-relaxed break-words hyphens-auto">
              {compact && latestNote.text.length > 80 ? `${latestNote.text.substring(0, 80)}...` : latestNote.text}
            </p>
          )}
        </div>

        {/* Add Note Form */}
        {showNoteForm && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <textarea
              ref={textareaRef}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Add a note about this actor..."
              className="w-full p-2 text-sm border border-slate-300 rounded resize-none focus:ring-2 focus:ring-success-500 focus:border-transparent"
              rows={2}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowNoteForm(false)
                  setNewNoteText("")
                }}
                className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddNote()
                }}
                disabled={!newNoteText.trim()}
                className="flex items-center gap-1 px-3 py-1 bg-success-600 text-white rounded text-sm hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-3 h-3" />
                Save Note
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Calculate vote statistics
  const getVoteStats = () => {
    const totalUsers = state.users.length
    const votes = actor.userVotes || {}
    const votedUsers = Object.keys(votes).length

    const yesVotes = Object.values(votes).filter((v) => v === "yes").length
    const noVotes = Object.values(votes).filter((v) => v === "no").length
    const maybeVotes = Object.values(votes).filter((v) => v === "maybe").length

    return { totalUsers, votedUsers, yesVotes, noVotes, maybeVotes }
  }

  const voteStats = getVoteStats()
  const currentUserVote = state.currentUser ? actor.userVotes[state.currentUser.id] : null
  const contactStatus = getContactStatus()

  // Handle card click for selection
  const handleCardClick = (e: React.MouseEvent) => {
    if (onSelect) {
      onSelect(actor.id, e)
    }
  }

  // Enhanced drag event handlers with better state management
  const handleDragStart = (e: React.DragEvent) => {
    console.log("🎯 ActorCard: Drag start for", actor.name)

    // Set local drag state immediately
    setLocalDragState({
      isDragging: true,
      dragStartTime: Date.now(),
    })

    if (onDragStart) {
      onDragStart(e, actor)
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    console.log("🏁 ActorCard: Drag end for", actor.name)

    // Schedule cleanup with a small delay to ensure all operations complete
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }

    dragTimeoutRef.current = setTimeout(() => {
      cleanupLocalDragState()
    }, 100)

    if (onDragEnd) {
      onDragEnd(e)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (onDragOver) {
      onDragOver(e, actor)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    if (onDrop) {
      onDrop(e, actor)
    }
  }

  // Determine if this card should appear as dragging
  const shouldShowDragging = isDragging || localDragState.isDragging

  const SelectionCheckbox = () => (
    <div
      className="absolute top-2 left-2 z-20 transition-all duration-200"
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        if (onSelect) {
          const syntheticEvent = {
            ...e,
            ctrlKey: true, // Force independent toggle
            preventDefault: () => e.preventDefault(),
            stopPropagation: () => e.stopPropagation(),
          } as React.MouseEvent
          onSelect(actor.id, syntheticEvent)
        }
      }}
    >
      <div
        className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all duration-200 backdrop-blur-sm ${
          isSelected
            ? "bg-success-500 border-success-600 shadow-lg scale-110"
            : "bg-white/95 border-slate-400 hover:border-success-500 hover:bg-success-50 hover:scale-110 shadow-md"
        }`}
      >
        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
      </div>
    </div>
  )

  // Render different views based on viewMode
  if (viewMode === "list-view") {
    return (
      <div
        className={`group relative flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer w-full min-w-[325px] ${
          isSelected ? "ring-2 ring-success-500 bg-success-50" : ""
        } ${shouldShowDragging ? "opacity-50 scale-95 rotate-1" : ""} ${isDropTarget ? "ring-2 ring-info-400" : ""}`}
        onClick={handleCardClick}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <SelectionCheckbox />

        {/* Drop Position Indicator */}
        {dropPosition === "before" && <div className="absolute -top-1 left-0 right-0 h-0.5 bg-info-400 rounded" />}
        {dropPosition === "after" && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-info-400 rounded" />}

        {/* Drag Handle */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>

        {/* Actor Image */}
        <div className="relative w-16 h-16 flex-shrink-0">
          {getCurrentImageUrl() ? (
            <img
              src={getCurrentImageUrl()}
              alt={actor.name}
              className="w-full h-full object-cover rounded-lg"
              onLoad={() => handleImageLoad(currentHeadshotIndex)}
              onError={() => handleImageError(currentHeadshotIndex)}
              onLoadStart={() => handleImageLoadStart(currentHeadshotIndex)}
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 text-xl font-bold">
              {actor.name.charAt(0).toUpperCase()}
            </div>
          )}
          {actor.headshots && actor.headshots.length > 1 && (
            <div className="absolute -bottom-1 -right-1 bg-slate-600 text-white text-xs px-1 rounded">
              {currentHeadshotIndex + 1}/{actor.headshots.length}
            </div>
          )}
          {actor.isCast && (
            <div className="absolute inset-0 bg-success-500 bg-opacity-20 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-success-600" />
            </div>
          )}
        </div>

        {/* Actor Info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleNameClick}
              className="font-semibold text-slate-900 hover:text-success-600 transition-colors truncate text-left"
            >
              {actor.name}
            </button>
            {actor.isCast && <Crown className="w-4 h-4 text-success-600 flex-shrink-0" />}
            {!actor.isCast && actor.isGreenlit && (
              <span className="bg-success-100 text-success-700 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 whitespace-nowrap">
                Greenlit
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2 text-xs text-slate-600 flex-wrap">
            {actor.age && <span className="bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">{actor.age}</span>}
            {actor.gender && (
              <span className="bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">{actor.gender}</span>
            )}
            {actor.ethnicity && (
              <span className="bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap truncate max-w-[120px]">
                {actor.ethnicity}
              </span>
            )}
            {actor.location && (
              <span className="bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap truncate max-w-[100px]">
                {actor.location}
              </span>
            )}
          </div>

          {/* Status Display */}
          <div className="overflow-hidden">
            <StatusDisplay compact={true} />
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === "simple") {
    return (
      <div
        className={`group relative bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer w-full min-w-[285px] max-w-[285px] ${
          isSelected ? "ring-2 ring-success-500" : ""
        } ${shouldShowDragging ? "opacity-50 scale-95 rotate-1" : ""} ${isDropTarget ? "ring-2 ring-info-400" : ""}`}
        onClick={handleCardClick}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <SelectionCheckbox />

        {/* Drop Position Indicators */}
        {dropPosition === "before" && <div className="absolute -top-1 left-0 right-0 h-0.5 bg-info-400 rounded z-10" />}
        {dropPosition === "after" && (
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-info-400 rounded z-10" />
        )}

        {/* More Actions Button - Upper Right Corner */}
        <button
          onClick={handleMoreActions}
          className="absolute top-3 right-3 bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-600 hover:text-slate-800 rounded-lg p-2 shadow-sm hover:shadow-md transition-all z-20"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {/* Main Content - Horizontal Layout */}
        <div className="flex h-48">
          {/* Left Side - Image Container */}
          <div
            className={`relative bg-slate-100 w-36 flex-shrink-0 ${isDragOver ? "bg-info-100 border-2 border-dashed border-info-400" : ""}`}
            onDragEnter={handleImageDragEnter}
            onDragLeave={handleImageDragLeave}
            onDragOver={handleImageDragOver}
            onDrop={handleImageDrop}
          >
            <img
              src={getCurrentImageUrl() || undefined}
              alt={actor.name}
              className="w-full h-full object-cover transition-opacity duration-200"
              onLoad={() => handleImageLoad(currentHeadshotIndex)}
              onError={() => handleImageError(currentHeadshotIndex)}
              onLoadStart={() => handleImageLoadStart(currentHeadshotIndex)}
            />

            {/* Upload Overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-info-500 bg-opacity-20 flex items-center justify-center">
                <div className="text-info-700 text-xs font-semibold">Drop image</div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-2 text-center">
                  <div className="text-xs font-semibold mb-1">Uploading...</div>
                  <div className="w-16 bg-slate-200 rounded-full h-1">
                    <div
                      className="bg-info-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cast/Greenlit Overlay */}
            {actor.isCast && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 flex items-center justify-center">
                <div className="bg-success-600 text-white px-2 py-1 rounded-lg flex items-center space-x-1 shadow-lg">
                  <Crown className="w-3 h-3" />
                  <span className="text-xs font-bold">CAST</span>
                </div>
              </div>
            )}

            {!actor.isCast && actor.isGreenlit && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
                <div className="bg-success-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                  GREENLIT
                </div>
              </div>
            )}

            {/* Headshot Navigation */}
            {actor.headshots && actor.headshots.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateHeadshot(-1)
                  }}
                  className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-0.5 hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateHeadshot(1)
                  }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-0.5 hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                  {currentHeadshotIndex + 1}/{actor.headshots.length}
                </div>
              </>
            )}

            {/* Drag Handle */}
            <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3" />
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
            {/* Actor Name - Centered */}
            <div className="mb-3 text-center">
              <button
                onClick={handleNameClick}
                className="font-semibold text-slate-900 hover:text-success-600 transition-colors text-sm leading-tight"
              >
                {actor.name}
              </button>
            </div>

            {/* Age and Status - Centered below name */}
            <div className="mb-3 space-y-2 text-center">
              {actor.age && <div className="text-xs text-slate-500">Age: {actor.age}</div>}
              {actor.statuses && actor.statuses.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {actor.statuses.slice(0, 2).map((status) => (
                    <span
                      key={status.id}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${status.bgColor} ${status.textColor} border border-current`}
                    >
                      <span className="truncate max-w-[60px]">{status.label}</span>
                    </span>
                  ))}
                  {actor.statuses.length > 2 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                      +{actor.statuses.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Vote Indicators - At bottom */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-1 overflow-hidden">
                {state.users.map((user) => {
                  const userVote = actor.userVotes[user.id]
                  let bgColor = "bg-slate-200"
                  let textColor = "text-slate-600"

                  if (userVote === "yes") {
                    bgColor = "bg-success-500"
                    textColor = "text-white"
                  } else if (userVote === "no") {
                    bgColor = "bg-error-500"
                    textColor = "text-white"
                  } else if (userVote === "maybe") {
                    bgColor = "bg-info-500"
                    textColor = "text-white"
                  }

                  return (
                    <div
                      key={user.id}
                      className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${bgColor} ${textColor} shadow-sm flex-shrink-0`}
                      title={user.name}
                    >
                      {user.initials}
                    </div>
                  )
                })}
              </div>
              <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                {voteStats.votedUsers}/{voteStats.totalUsers}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default detailed view with new layout
  if (viewMode !== "list-view" && viewMode !== "simple") {
    return (
      <div
        className={`group relative bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer w-full min-w-[325px] max-w-[350px] ${
          isSelected ? "ring-2 ring-success-500" : ""
        } ${shouldShowDragging ? "opacity-50 scale-95 rotate-1" : ""} ${isDropTarget ? "ring-2 ring-info-400" : ""}`}
        onClick={handleCardClick}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <SelectionCheckbox />

        {/* Drop Position Indicators */}
        {dropPosition === "before" && <div className="absolute -top-1 left-0 right-0 h-0.5 bg-info-400 rounded z-10" />}
        {dropPosition === "after" && (
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-info-400 rounded z-10" />
        )}

        <button
          onClick={handleQuickAssignToProject}
          className="absolute top-3 left-3 bg-indigo-500 bg-opacity-90 hover:bg-opacity-100 text-white rounded-lg p-2 shadow-sm hover:shadow-md transition-all z-10 opacity-0 group-hover:opacity-100"
          title="Assign to Project"
        >
          <FolderPlus className="w-4 h-4" />
        </button>

        {/* More Actions Button - Upper Right Corner of Card */}
        <button
          onClick={handleMoreActions}
          className="absolute top-3 right-3 bg-white bg-opacity-90 hover:bg-opacity-100 text-slate-600 hover:text-slate-800 rounded-lg p-2 shadow-sm hover:shadow-md transition-all z-10"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-5 overflow-hidden">
          {/* Top Section: Image + Actor Info */}
          <div className="flex gap-4 mb-4">
            {/* Image Container - Fixed size 100x120 */}
            <div
              className={`relative bg-slate-100 flex-shrink-0 w-[130px] h-[145px] rounded-lg overflow-hidden ${
                isDragOver ? "bg-info-100 border-2 border-dashed border-info-400" : ""
              }`}
              onDragEnter={handleImageDragEnter}
              onDragLeave={handleImageDragLeave}
              onDragOver={handleImageDragOver}
              onDrop={handleImageDrop}
            >
              <img
                src={getCurrentImageUrl() || undefined}
                alt={actor.name}
                className="w-full h-full object-cover transition-opacity duration-200"
                onLoad={() => handleImageLoad(currentHeadshotIndex)}
                onError={() => handleImageError(currentHeadshotIndex)}
                onLoadStart={() => handleImageLoadStart(currentHeadshotIndex)}
              />

              {/* Upload Overlay */}
              {isDragOver && (
                <div className="absolute inset-0 bg-info-500 bg-opacity-20 flex items-center justify-center">
                  <div className="text-info-700 text-xs font-semibold text-center">Drop image</div>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-2 text-center">
                    <div className="text-xs font-semibold mb-1">Uploading...</div>
                    <div className="w-16 bg-slate-200 rounded-full h-1">
                      <div
                        className="bg-info-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="absolute inset-0 bg-error-500 bg-opacity-20 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-2 text-center">
                    <div className="text-error-600 text-xs font-semibold mb-1">Upload Failed</div>
                    <button onClick={() => setUploadError(null)} className="text-xs text-error-600 hover:text-error-800">
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Cast/Greenlit Overlay */}
              {actor.isCast && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 flex items-center justify-center">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-2 py-1 rounded-lg flex items-center space-x-1 shadow-lg">
                    <Crown className="w-3 h-3" />
                    <span className="text-xs font-bold">CAST</span>
                  </div>
                </div>
              )}

              {!actor.isCast && actor.isGreenlit && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                    GREENLIT
                  </div>
                </div>
              )}

              {/* Headshot Navigation */}
              {actor.headshots && actor.headshots.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateHeadshot(-1)
                    }}
                    className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateHeadshot(1)
                    }}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                    {currentHeadshotIndex + 1}/{actor.headshots.length}
                  </div>
                </>
              )}

              {/* Drag Handle */}
              <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3" />
              </div>
            </div>

            {/* Actor Info Section */}
            <div className="flex-1 min-w-0 overflow-hidden">
              {/* Actor Name */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={handleNameClick}
                    className="font-bold text-lg text-slate-900 hover:text-success-600 transition-colors break-words text-left"
                  >
                    {actor.name}
                  </button>
                  {actor.isCast && (
                    <div className="flex items-center space-x-1">
                      <Crown className="w-4 h-4 text-success-600" />
                      <span className="text-xs text-success-600 font-semibold truncate">Cast as {character.name}</span>
                    </div>
                  )}
                </div>

                {/* Basic Info - Stacked Layout */}
                <div className="space-y-1 text-xs text-slate-400 overflow-hidden">
                  {state.cardViewSettings.age && actor.age && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-400">Age: {actor.age}</span>
                    </div>
                  )}
                  {state.cardViewSettings.playingAge && actor.playingAge && (
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-400">Playing: {actor.playingAge}</span>
                    </div>
                  )}
                  {state.cardViewSettings.location && actor.location && (
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-medium text-slate-400">{actor.location}</span>
                    </div>
                  )}
                  {state.cardViewSettings.agent && actor.agent && (
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-medium text-slate-400">{actor.agent}</span>
                    </div>
                  )}
                  {state.cardViewSettings.imdbUrl && actor.imdbUrl && (
                    <a
                      href={actor.imdbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-info-600 hover:text-info-800 transition-colors"
                    >
                      <span className="text-xs font-medium underline">IMDB Profile</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status and Counters Row */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              {/* Contact Status Indicator */}
              <div className="flex items-center gap-1 flex-shrink-0" title={contactStatus.label}>
                <contactStatus.icon className={`w-3 h-3 ${contactStatus.color}`} />
                <span className={`text-xs font-medium ${contactStatus.color}`}>{contactStatus.label}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Notes Count - Clickable */}
                {actor.notes && actor.notes.length > 0 && (
                  <button
                    onClick={handleOpenPlayerView}
                    className="flex items-center gap-1 text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg flex-shrink-0 transition-colors cursor-pointer"
                    title={`Click to view ${actor.notes.length} note${actor.notes.length !== 1 ? "s" : ""} in Player View`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span className="text-xs font-medium">{actor.notes.length}</span>
                  </button>
                )}

                {/* Video Count - Clickable */}
                {(() => {
                  const videoCount = getVideoCount(actor)
                  if (videoCount > 0) {
                    return (
                      <button
                        onClick={handleOpenPlayerView}
                        className="flex items-center gap-1 text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg flex-shrink-0 transition-colors cursor-pointer"
                        title={`Click to view ${videoCount} video${videoCount !== 1 ? "s" : ""} in Player View`}
                      >
                        <Play className="w-3 h-3" />
                        <span className="text-xs font-medium">{videoCount}</span>
                      </button>
                    )
                  }
                  return null
                })()}

                {/* Media Files Count - Clickable */}
                {actor.headshots && actor.headshots.length > 0 && (
                  <button
                    onClick={handleOpenPlayerView}
                    className="flex items-center gap-1 text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg flex-shrink-0 transition-colors cursor-pointer"
                    title={`Click to view ${actor.headshots.length} photo${actor.headshots.length !== 1 ? "s" : ""} in Player View`}
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span className="text-xs font-medium">{actor.headshots.length}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Manage Status Button - Aligned to the right */}
            <button
              onClick={handleManageStatuses}
              className="flex items-center gap-1 px-2 py-1 text-xs text-success-600 hover:text-success-700 hover:bg-success-50 rounded-lg transition-colors flex-shrink-0"
            >
              <Tag className="w-3 h-3" />
              <span className="whitespace-nowrap">Manage Status</span>
            </button>
          </div>

          {/* Status Display */}
          <div className="mb-4 overflow-hidden">
            <StatusDisplay />
          </div>

          {/* Skills Section */}
          {state.cardViewSettings.skills && actor.skills && actor.skills.length > 0 && (
            <div className="mb-4 overflow-hidden">
              <div className="flex items-center gap-1 text-xs font-medium text-slate-600 mb-2">
                <Star className="w-3 h-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Skills & Abilities</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {actor.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-info-100 text-info-700 border border-info-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {state.cardViewSettings.notes && (
            <div className="mb-4 overflow-hidden">
              <NotesDisplay />
            </div>
          )}

          {/* Vote Section */}
          {state.cardViewSettings.showVotes && (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex space-x-2 overflow-hidden">
                  {state.users.map((user) => {
                    const userVote = actor.userVotes[user.id]
                    let bgGradient = "bg-gradient-to-br from-slate-200 to-slate-300"
                    let textColor = "text-slate-600"

                    if (userVote === "yes") {
                      bgGradient = "bg-gradient-to-br from-emerald-500 to-emerald-600"
                      textColor = "text-white"
                    } else if (userVote === "no") {
                      bgGradient = "bg-gradient-to-br from-red-500 to-red-600"
                      textColor = "text-white"
                    } else if (userVote === "maybe") {
                      bgGradient = "bg-gradient-to-br from-blue-500 to-blue-600"
                      textColor = "text-white"
                    }

                    return (
                      <div
                        key={user.id}
                        className={`w-6 h-6 rounded-xl flex items-center justify-center text-[10px] font-bold ${bgGradient} ${textColor} shadow-sm flex-shrink-0`}
                        title={user.name}
                      >
                        {user.initials}
                      </div>
                    )
                  })}
                </div>
                <span className="text-sm text-slate-500 font-medium flex-shrink-0 whitespace-nowrap">
                  {voteStats.votedUsers}/{voteStats.totalUsers} voted
                </span>
              </div>

              {/* Special message for Approval list */}
              {actor.currentListKey === "approval" &&
                voteStats.yesVotes === voteStats.totalUsers &&
                voteStats.totalUsers > 0 && (
                  <div className="mb-3 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-success-200 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Crown className="w-4 h-4 text-success-600" />
                      <span className="text-sm text-success-700 font-semibold break-words">
                        🎉 Unanimous approval! This actor is now cast in the role.
                      </span>
                    </div>
                  </div>
                )}

              {/* Action Buttons - Hide for cast actors */}
              {!actor.isCast && state.currentUser && state.cardViewSettings.showActionButtons && (
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleVote("yes") }}
                    className={`px-1.5 py-1 text-[10px] font-semibold rounded-full text-center transition-all duration-200 active:scale-95 ${
                      currentUserVote === "yes"
                        ? "bg-[#b5c9a8] text-[#4a5b3f] ring-2 ring-[#8fa67e]"
                        : "bg-[#d5dece] text-[#6b7a5e] hover:bg-[#c8d4bf]"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleVote("maybe") }}
                    className={`px-1.5 py-1 text-[10px] font-semibold rounded-full text-center transition-all duration-200 active:scale-95 ${
                      currentUserVote === "maybe"
                        ? "bg-[#f0d9b5] text-[#7a6a3a] ring-2 ring-[#d4b88a]"
                        : "bg-[#f5e6d0] text-[#9b8a5e] hover:bg-[#eddbbd]"
                    }`}
                  >
                    Maybe
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleVote("no") }}
                    className={`px-1.5 py-1 text-[10px] font-semibold rounded-full text-center transition-all duration-200 active:scale-95 ${
                      currentUserVote === "no"
                        ? "bg-[#e8b4b8] text-[#8b4c4f] ring-2 ring-[#d49396]"
                        : "bg-[#f0cdd0] text-[#a06b6e] hover:bg-[#e8bfc3]"
                    }`}
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return null // Should not reach here if all viewModes are handled
}
