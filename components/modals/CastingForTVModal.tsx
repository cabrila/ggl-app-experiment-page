"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal, navigateToModal } from "./ModalManager"
import ModalHeader from "@/components/layout/ModalHeader"
import FloatingSidebar from "@/components/layout/FloatingSidebar"
import EmbeddedCoPilot from "@/components/copilot/EmbeddedCoPilot"
import { isValidImageUrl } from "@/lib/utils"
import {
  X,
  Home,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Star,
  Archive,
  Phone,
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowUpDown,
  ArrowRight,
  Users,
  User,
  Tv,
  Flag,
  Instagram,
  Video,
  FileText,
  BarChart3,
  Inbox,
  CheckCircle,
  AlertTriangle,
  Clock,
  Grid3X3,
  List,
  GripVertical,
  ExternalLink,
  Eye,
  Edit3,
  Trash2,
  Send,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Database,
  Link,
  UserPlus,
  Columns,
  LayoutGrid,
  Settings,
  Shuffle,
  PieChart,
  Paperclip,
  Target,
  Save,
  Play,
  Lock,
  Unlock,
  Scissors,
  Film,
  EyeOff,
  Twitter,
  Youtube,
  Facebook,
  Globe,
  Camera,
  Calendar,
  Tag,
  FolderPlus,
  Check,
  ImagePlus,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ChevronLeft,
  SkipBack,
  SkipForward,
  Heart,
  Mic,
  Zap,
  Fingerprint,
  Target as TargetIcon,
  Gauge,
  MapPin,
  Bell,
} from "lucide-react"

interface CastingForTVModalProps {
  onClose: () => void
}

// Pipeline stage definition
interface PipelineStage {
  id: string
  label: string
  color: string
}

// Cast Mix slot definition
interface CastSlot {
  id: string
  label: string
  color: string
  icon: string
  groupId: string | null
  assignedParticipantId: string | null
}

// Cast Mix group definition
interface CastSlotGroup {
  id: string
  name: string
  allowMultiple: boolean
  color: string
}

// Default pipeline stages for Kanban
const DEFAULT_FUNNEL_STAGES: PipelineStage[] = [
  { id: "inbox", label: "Inbox", color: "bg-slate-100 text-slate-700 border-slate-300" },
  { id: "first-pass", label: "First Pass", color: "bg-blue-50 text-blue-700 border-blue-300" },
  { id: "phone-interview", label: "Phone Interview", color: "bg-cyan-50 text-cyan-700 border-cyan-300" },
  { id: "zoom-audition", label: "Zoom Audition", color: "bg-purple-50 text-purple-700 border-purple-300" },
  { id: "background-check", label: "Background Check", color: "bg-amber-50 text-amber-700 border-amber-300" },
  { id: "psych-eval", label: "Psych Eval", color: "bg-orange-50 text-orange-700 border-orange-300" },
  { id: "final-mix", label: "Final Mix", color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  { id: "locked", label: "Locked", color: "bg-green-100 text-green-800 border-green-400" },
]

// Available colors for new stages
const STAGE_COLORS = [
  "bg-slate-100 text-slate-700 border-slate-300",
  "bg-blue-50 text-blue-700 border-blue-300",
  "bg-cyan-50 text-cyan-700 border-cyan-300",
  "bg-purple-50 text-purple-700 border-purple-300",
  "bg-amber-50 text-amber-700 border-amber-300",
  "bg-orange-50 text-orange-700 border-orange-300",
  "bg-emerald-50 text-emerald-700 border-emerald-300",
  "bg-green-100 text-green-800 border-green-400",
  "bg-pink-50 text-pink-700 border-pink-300",
  "bg-rose-50 text-rose-700 border-rose-300",
  "bg-indigo-50 text-indigo-700 border-indigo-300",
  "bg-teal-50 text-teal-700 border-teal-300",
]

type FunnelStage = string

// Sorting options for lists
type SortOption = "name" | "score" | "date" | "stage" | "custom"

// Cast lists for organization
interface CastList {
  id: string
  name: string
  description?: string
  participantIds: string[]
  color: string
  createdAt: number
  sortBy?: SortOption
  sortDirection?: "asc" | "desc"
}

// Mock participant data for Non-Fiction TV
// Scoring parameters for detailed evaluation
interface ScoringParameter {
  id: string
  name: string
  description: string
  icon: string
}

interface ParticipantScores {
  [parameterId: string]: number
}

const SCORING_PARAMETERS: ScoringParameter[] = [
  { id: "presence", name: "Screen Presence", description: "Charisma and on-camera appeal", icon: "sparkles" },
  { id: "authenticity", name: "Authenticity", description: "Genuine and relatable personality", icon: "heart" },
  { id: "communication", name: "Communication", description: "Articulation and storytelling ability", icon: "mic" },
  { id: "conflict", name: "Conflict Potential", description: "Ability to create compelling drama", icon: "zap" },
  { id: "relatability", name: "Relatability", description: "Appeal to target audience", icon: "users" },
  { id: "uniqueness", name: "Uniqueness", description: "Distinctive qualities and background", icon: "fingerprint" },
]

// Video embed type for participants
interface ParticipantVideo {
  id: string
  url: string
  title: string
  platform: "vimeo" | "youtube" | "other"
  thumbnailUrl?: string
  tags: string[]
  password?: string
  isPasswordProtected: boolean
  crop?: {
    startTime: number
    endTime: number
  }
  addedAt: number
}

// Communication/Message interface for inbox
interface ParticipantMessage {
  id: string
  participantId: string
  direction: "inbound" | "outbound"
  type: "email" | "sms" | "call" | "note"
  subject?: string
  content: string
  timestamp: number
  read: boolean
  attachments?: { name: string; url: string }[]
}

// Audition booking interface
interface AuditionBooking {
  id: string
  participantId: string
  scheduledDate: number
  duration: number // in minutes
  location: string
  type: "in-person" | "virtual" | "self-tape"
  status: "scheduled" | "completed" | "cancelled" | "no-show"
  notes?: string
  meetingLink?: string
  createdAt: number
}

interface Participant {
  id: string
  name: string
  age: number
  location: string
  occupation: string
  photo?: string
  archetype: string[]
  socialHandles: {
    instagram?: string
    tiktok?: string
    twitter?: string
    youtube?: string
    facebook?: string
    website?: string
    followerCount?: number
  }
  stage: FunnelStage
  status: "new" | "contacted" | "on-hold" | "rejected" | "cast"
  starred: boolean
  redFlags?: { type: string; note: string }[]
  score?: number
  appliedDate: number
  lastContact?: number
  notes?: string
  listIds?: string[]
  email?: string
  phone?: string
  videos?: ParticipantVideo[]
  manuallyAdded?: boolean
  addedAt?: number
}

const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: "p1",
    name: "Marcus Chen",
    age: 28,
    location: "Los Angeles, CA",
    occupation: "Personal Trainer",
    archetype: ["The Heartthrob", "The Competitor"],
    socialHandles: { instagram: "@marcusfitlife", followerCount: 45000 },
    stage: "first-pass",
    status: "contacted",
    starred: true,
    score: 8.5,
    appliedDate: Date.now() - 86400000 * 3,
    lastContact: Date.now() - 86400000,
    notes: "Great energy, very photogenic",
  },
  {
    id: "p2",
    name: "Jasmine Williams",
    age: 32,
    location: "Atlanta, GA",
    occupation: "Event Planner",
    archetype: ["The Expert", "The Peacemaker"],
    socialHandles: { instagram: "@jasmineevents", tiktok: "@jasminew", followerCount: 120000 },
    stage: "zoom-audition",
    status: "contacted",
    starred: true,
    score: 9.2,
    appliedDate: Date.now() - 86400000 * 5,
    lastContact: Date.now() - 86400000 * 2,
  },
  {
    id: "p3",
    name: "Derek Thompson",
    age: 41,
    location: "Chicago, IL",
    occupation: "Restaurant Owner",
    archetype: ["The Villain", "The Wild Card"],
    socialHandles: { instagram: "@derekseats" },
    stage: "phone-interview",
    status: "contacted",
    starred: false,
    redFlags: [{ type: "risk", note: "Previous contract breach with competitor network" }],
    score: 7.8,
    appliedDate: Date.now() - 86400000 * 2,
  },
  {
    id: "p4",
    name: "Sophia Rodriguez",
    age: 25,
    location: "Miami, FL",
    occupation: "Influencer",
    archetype: ["The Heartthrob", "The Underdog"],
    socialHandles: { instagram: "@sophiarodri", tiktok: "@sophiamia", followerCount: 890000 },
    stage: "final-mix",
    status: "contacted",
    starred: true,
    score: 9.5,
    appliedDate: Date.now() - 86400000 * 7,
  },
  {
    id: "p5",
    name: "Tyler Jackson",
    age: 29,
    location: "Nashville, TN",
    occupation: "Musician",
    archetype: ["The Artist", "The Romantic"],
    socialHandles: { instagram: "@tylerjmusic", followerCount: 35000 },
    stage: "inbox",
    status: "new",
    starred: false,
    appliedDate: Date.now() - 86400000,
  },
  {
    id: "p6",
    name: "Amanda Foster",
    age: 34,
    location: "Denver, CO",
    occupation: "Firefighter",
    archetype: ["The Hero", "The Fish out of Water"],
    socialHandles: { instagram: "@amandaf_fd" },
    stage: "background-check",
    status: "contacted",
    starred: true,
    score: 8.9,
    appliedDate: Date.now() - 86400000 * 4,
  },
  {
    id: "p7",
    name: "Kevin Park",
    age: 27,
    location: "Seattle, WA",
    occupation: "Software Engineer",
    archetype: ["The Nerd", "The Underdog"],
    socialHandles: { instagram: "@kevinpcodes", followerCount: 8000 },
    stage: "inbox",
    status: "new",
    starred: false,
    appliedDate: Date.now() - 3600000 * 6,
  },
  {
    id: "p8",
    name: "Rachel Green",
    age: 30,
    location: "New York, NY",
    occupation: "Fashion Designer",
    archetype: ["The Expert", "The Diva"],
    socialHandles: { instagram: "@rachelgdesigns", followerCount: 250000 },
    stage: "locked",
    status: "cast",
    starred: true,
    score: 9.8,
    appliedDate: Date.now() - 86400000 * 14,
  },
]

export default function CastingForTVModal({ onClose }: CastingForTVModalProps) {
  const { state } = useCasting()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<"pipeline" | "grid" | "list" | "mix">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [participants, setParticipants] = useState<Participant[]>(MOCK_PARTICIPANTS)
  const [filterArchetype, setFilterArchetype] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [draggedParticipant, setDraggedParticipant] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  // Cast Mix slots and groups state (dynamic)
  const [castSlotGroups, setCastSlotGroups] = useState<CastSlotGroup[]>([
    { id: "leads", name: "Lead Roles", allowMultiple: true, color: "bg-blue-500" },
    { id: "supporting", name: "Supporting Cast", allowMultiple: true, color: "bg-purple-500" },
    { id: "wildcards", name: "Wild Cards", allowMultiple: false, color: "bg-amber-500" },
  ])
  const [castSlots, setCastSlots] = useState<CastSlot[]>([
    { id: "lead-male", label: "Lead Male", color: "bg-blue-500", icon: "user", groupId: "leads", assignedParticipantId: null },
    { id: "lead-female", label: "Lead Female", color: "bg-pink-500", icon: "user", groupId: "leads", assignedParticipantId: null },
    { id: "villain", label: "The Villain", color: "bg-red-500", icon: "target", groupId: "supporting", assignedParticipantId: null },
    { id: "wildcard", label: "Wild Card", color: "bg-purple-500", icon: "sparkles", groupId: "wildcards", assignedParticipantId: null },
    { id: "underdog", label: "The Underdog", color: "bg-amber-500", icon: "star", groupId: "supporting", assignedParticipantId: null },
    { id: "expert", label: "The Expert", color: "bg-emerald-500", icon: "chart", groupId: "supporting", assignedParticipantId: null },
  ])
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [editingSlotLabel, setEditingSlotLabel] = useState("")
  const [showAddSlotForm, setShowAddSlotForm] = useState(false)
  const [newSlotName, setNewSlotName] = useState("")
  const [newSlotGroupId, setNewSlotGroupId] = useState<string | null>(null)
  const [newSlotColor, setNewSlotColor] = useState("bg-cyan-500")
  const [showSlotSettings, setShowSlotSettings] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingGroupName, setEditingGroupName] = useState("")
  const [showAddGroupForm, setShowAddGroupForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  
  // Legacy castMixSlots for backwards compatibility
  const castMixSlots = useMemo(() => {
    const slots: Record<string, string | null> = {}
    castSlots.forEach(slot => {
      slots[slot.id] = slot.assignedParticipantId
    })
    return slots
  }, [castSlots])
  
  const setCastMixSlots = (updater: (prev: Record<string, string | null>) => Record<string, string | null>) => {
    const newSlots = updater(castMixSlots)
    setCastSlots(prev => prev.map(slot => ({
      ...slot,
      assignedParticipantId: newSlots[slot.id] ?? null
    })))
  }
const [lists, setLists] = useState<CastList[]>([
  { id: "list-1", name: "Top Picks", description: "Best candidates for final review", participantIds: ["p1", "p2", "p4"], color: "bg-emerald-500", createdAt: Date.now() - 86400000 * 5, sortBy: "score", sortDirection: "desc" },
  { id: "list-2", name: "Backup Options", description: "Strong alternatives", participantIds: ["p3", "p6"], color: "bg-blue-500", createdAt: Date.now() - 86400000 * 3, sortBy: "name", sortDirection: "asc" },
  { id: "list-3", name: "Social Stars", description: "High follower count", participantIds: ["p2", "p4", "p8"], color: "bg-pink-500", createdAt: Date.now() - 86400000, sortBy: "score", sortDirection: "desc" },
])
const [globalSortBy, setGlobalSortBy] = useState<SortOption>("date")
const [globalSortDirection, setGlobalSortDirection] = useState<"asc" | "desc">("desc")
  const addDropdownRef = useRef<HTMLDivElement>(null)
  
  // Edit participant modal state
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Lists panel state
  const [showListsPanel, setShowListsPanel] = useState(true)
  const [showAddListModal, setShowAddListModal] = useState(false)
  const [showListDropdown, setShowListDropdown] = useState(false)
  
  // Multi-selection state
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set())
  const [showMoveToListMenu, setShowMoveToListMenu] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showBookAuditionModal, setShowBookAuditionModal] = useState(false)
  const [showAdvanceStageModal, setShowAdvanceStageModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null)
  
  // Cast Mix filters
  const [showDemographicFilter, setShowDemographicFilter] = useState(false)
  const [demographicFilters, setDemographicFilters] = useState({
    gender: "all" as "all" | "male" | "female" | "non-binary",
    ageRange: "all" as "all" | "18-25" | "26-35" | "36-45" | "46+",
    stage: "all" as string,
  })
  const [castMixSearchQuery, setCastMixSearchQuery] = useState("")
  
  // Video management state
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<ParticipantVideo | null>(null)
  const [videoForm, setVideoForm] = useState({
    url: "",
    title: "",
    tags: [] as string[],
    tagInput: "",
    password: "",
    isPasswordProtected: false,
    cropStart: 0,
    cropEnd: 0,
    enableCrop: false,
  })
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null)
  const [passwordInput, setPasswordInput] = useState("")
  
  // Detailed scoring state
  const [showScoringPanel, setShowScoringPanel] = useState<string | null>(null) // participant ID
  const [participantDetailedScores, setParticipantDetailedScores] = useState<Record<string, ParticipantScores>>({})
  
  // Player View state
  const [showPlayerView, setShowPlayerView] = useState(false)
  const [playerViewIndex, setPlayerViewIndex] = useState(0)
  const [participantVotes, setParticipantVotes] = useState<Record<string, "yes" | "no" | "maybe" | null>>({})
  const [participantComments, setParticipantComments] = useState<Record<string, Array<{id: string; text: string; timestamp: number}>>>({})
  const [newComment, setNewComment] = useState("")
  const [showMaybeCommentPrompt, setShowMaybeCommentPrompt] = useState(false)
  const [maybeCommentText, setMaybeCommentText] = useState("")
  
  const [newListName, setNewListName] = useState("")
  
  // Contacts & Communications state
  const [showContactsModal, setShowContactsModal] = useState(false)
  const [contactsActiveTab, setContactsActiveTab] = useState<"inbox" | "all">("inbox")
  const [selectedMessageParticipant, setSelectedMessageParticipant] = useState<string | null>(null)
  const [participantMessages, setParticipantMessages] = useState<ParticipantMessage[]>([
    { id: "msg-1", participantId: "p1", direction: "outbound", type: "email", subject: "Casting Call Invitation", content: "Hi Sarah! We loved your application and would like to invite you for an audition.", timestamp: Date.now() - 86400000 * 2, read: true },
    { id: "msg-2", participantId: "p1", direction: "inbound", type: "email", subject: "Re: Casting Call Invitation", content: "Thank you so much! I'm very excited about this opportunity. When would be a good time?", timestamp: Date.now() - 86400000, read: false },
    { id: "msg-3", participantId: "p2", direction: "outbound", type: "email", subject: "Initial Contact", content: "Hi Marcus! We've reviewed your application and think you'd be great for our show.", timestamp: Date.now() - 86400000 * 3, read: true },
    { id: "msg-4", participantId: "p3", direction: "inbound", type: "email", subject: "Question about audition", content: "Hi, I wanted to follow up on my application status. Looking forward to hearing from you!", timestamp: Date.now() - 3600000 * 5, read: false },
  ])
  const [newMessageContent, setNewMessageContent] = useState("")

  // Auditions state
  const [showAuditionsModal, setShowAuditionsModal] = useState(false)
  const [auditionsActiveTab, setAuditionsActiveTab] = useState<"upcoming" | "past" | "all">("upcoming")
  const [auditionBookings, setAuditionBookings] = useState<AuditionBooking[]>([
    { id: "aud-1", participantId: "p1", scheduledDate: Date.now() + 86400000 * 2, duration: 30, location: "Studio A", type: "in-person", status: "scheduled", createdAt: Date.now() - 86400000 },
    { id: "aud-2", participantId: "p2", scheduledDate: Date.now() + 86400000 * 5, duration: 45, location: "Zoom", type: "virtual", status: "scheduled", meetingLink: "https://zoom.us/j/123456", createdAt: Date.now() - 86400000 * 2 },
    { id: "aud-3", participantId: "p3", scheduledDate: Date.now() - 86400000 * 3, duration: 30, location: "Studio B", type: "in-person", status: "completed", createdAt: Date.now() - 86400000 * 5 },
  ])
  const [showBookAuditionForm, setShowBookAuditionForm] = useState(false)
  const [newAuditionForm, setNewAuditionForm] = useState({
    participantId: "",
    date: "",
    time: "",
    duration: 30,
    location: "",
    type: "in-person" as "in-person" | "virtual" | "self-tape",
    notes: "",
    meetingLink: "",
  })

  // Add Participant Modal state
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false)
  const [newParticipantForm, setNewParticipantForm] = useState({
    name: "",
    age: "",
    location: "",
    occupation: "",
    email: "",
    phone: "",
    instagram: "",
    notes: "",
    archetype: [] as string[],
  })
  const [newListDescription, setNewListDescription] = useState("")
  const [newListColor, setNewListColor] = useState("bg-cyan-500")
  
  // Pipeline stages state (dynamic)
  const [funnelStages, setFunnelStages] = useState<PipelineStage[]>(DEFAULT_FUNNEL_STAGES)
  const [editingStageId, setEditingStageId] = useState<string | null>(null)
  const [editingStageLabel, setEditingStageLabel] = useState("")
  const [newStageName, setNewStageName] = useState("")
  const [showAddStageForm, setShowAddStageForm] = useState(false)
  const [stageToRemove, setStageToRemove] = useState<PipelineStage | null>(null)
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)
  
  // Custom archetypes state
  const [customArchetypes, setCustomArchetypes] = useState<string[]>([
    "The Heartthrob", "The Competitor", "The Expert", "The Peacemaker", 
    "The Villain", "The Wild Card", "The Underdog", "The Hero", 
    "The Fish out of Water", "The Nerd", "The Diva", "The Artist", 
    "The Romantic", "The Strategist", "The Comedic Relief"
  ])
  const [showArchetypeDropdown, setShowArchetypeDropdown] = useState(false)
  const [newArchetypeName, setNewArchetypeName] = useState("")
  const [showAddArchetypeInput, setShowAddArchetypeInput] = useState(false)
  
  // Image drag-drop state
  const [dragOverParticipantId, setDragOverParticipantId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const isNonFictionProject = currentProject?.details.type === "Non-Fiction TV"

  // Get unique archetypes
  const allArchetypes = useMemo(() => {
  const archetypes = new Set<string>()
  participants.forEach((p) => p.archetype.forEach((a) => archetypes.add(a)))
  return Array.from(archetypes).sort()
  }, [participants])

  // Available archetypes for selection (combine custom and existing)
  const availableArchetypes = useMemo(() => {
    const combined = new Set([...customArchetypes, ...allArchetypes])
    return Array.from(combined).sort()
  }, [customArchetypes, allArchetypes])

  // Filter participants
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.occupation.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesArchetype = !filterArchetype || p.archetype.includes(filterArchetype)
      return matchesSearch && matchesArchetype
    })
  }, [participants, searchQuery, filterArchetype])

  // Get current sort settings based on selected list or global
  const currentSortBy = selectedListId 
    ? lists.find(l => l.id === selectedListId)?.sortBy || globalSortBy 
    : globalSortBy
  const currentSortDirection = selectedListId 
    ? lists.find(l => l.id === selectedListId)?.sortDirection || globalSortDirection 
    : globalSortDirection

  // Sorted and filtered participants
  const sortedParticipants = useMemo(() => {
    let result = [...filteredParticipants]
    
    // Filter by list if selected
    if (selectedListId) {
      const selectedList = lists.find(l => l.id === selectedListId)
      if (selectedList) {
        result = result.filter(p => selectedList.participantIds.includes(p.id))
      }
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (currentSortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "score":
          comparison = (b.score || 0) - (a.score || 0)
          break
        case "date":
          comparison = b.appliedDate - a.appliedDate
          break
        case "stage":
          comparison = a.stage.localeCompare(b.stage)
          break
        case "custom":
          // For custom sort, use the order in the list's participantIds array
          if (selectedListId) {
            const list = lists.find(l => l.id === selectedListId)
            if (list) {
              const aIndex = list.participantIds.indexOf(a.id)
              const bIndex = list.participantIds.indexOf(b.id)
              comparison = aIndex - bIndex
            }
          }
          break
      }
      return currentSortDirection === "asc" ? comparison : -comparison
    })
    
    return result
  }, [filteredParticipants, selectedListId, lists, currentSortBy, currentSortDirection])

  // Update participant score
  const updateParticipantScore = (participantId: string, score: number) => {
  setParticipants(prev => prev.map(p =>
  p.id === participantId ? { ...p, score: Math.max(0, Math.min(10, score)) } : p
  ))
  }

  // Detailed scoring functions
  const getScoreIcon = (iconName: string) => {
    switch (iconName) {
      case "sparkles": return <Sparkles className="w-4 h-4" />
      case "heart": return <Heart className="w-4 h-4" />
      case "mic": return <Mic className="w-4 h-4" />
      case "zap": return <Zap className="w-4 h-4" />
      case "users": return <Users className="w-4 h-4" />
      case "fingerprint": return <Fingerprint className="w-4 h-4" />
      default: return <TargetIcon className="w-4 h-4" />
    }
  }

  const updateDetailedScore = (participantId: string, parameterId: string, value: number) => {
    setParticipantDetailedScores(prev => ({
      ...prev,
      [participantId]: {
        ...(prev[participantId] || {}),
        [parameterId]: value
      }
    }))
    
    // Calculate and update the overall score
    const newScores = {
      ...(participantDetailedScores[participantId] || {}),
      [parameterId]: value
    }
    const scoredParams = Object.values(newScores).filter(v => v > 0)
    if (scoredParams.length > 0) {
      const avgScore = scoredParams.reduce((a, b) => a + b, 0) / scoredParams.length
      updateParticipantScore(participantId, avgScore)
    }
  }

  const getDetailedScore = (participantId: string, parameterId: string): number => {
    return participantDetailedScores[participantId]?.[parameterId] || 0
  }

  const getAverageDetailedScore = (participantId: string): number | null => {
    const scores = participantDetailedScores[participantId]
    if (!scores) return null
    const values = Object.values(scores).filter(v => v > 0)
    if (values.length === 0) return null
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  const getScoredParameterCount = (participantId: string): number => {
    const scores = participantDetailedScores[participantId]
    if (!scores) return 0
    return Object.values(scores).filter(v => v > 0).length
  }

  // Add participant manually
  const handleAddParticipant = () => {
    if (!newParticipantForm.name.trim()) return
    
    const newParticipant: Participant = {
      id: `participant-${Date.now()}`,
      name: newParticipantForm.name.trim(),
      age: parseInt(newParticipantForm.age) || 25,
      location: newParticipantForm.location.trim() || "Unknown",
      occupation: newParticipantForm.occupation.trim() || "Not specified",
      archetype: newParticipantForm.archetype,
      socialHandles: {
        instagram: newParticipantForm.instagram.trim() || undefined,
      },
      stage: "new",
      status: "new",
      starred: false,
      appliedDate: Date.now(),
      notes: newParticipantForm.notes.trim() || undefined,
      email: newParticipantForm.email.trim() || undefined,
      phone: newParticipantForm.phone.trim() || undefined,
      manuallyAdded: true,
      addedAt: Date.now(),
    }
    
    setParticipants(prev => [newParticipant, ...prev])
    setShowAddParticipantModal(false)
    setNewParticipantForm({
      name: "",
      age: "",
      location: "",
      occupation: "",
      email: "",
      phone: "",
      instagram: "",
      notes: "",
      archetype: [],
    })
  }

  const resetNewParticipantForm = () => {
    setNewParticipantForm({
      name: "",
      age: "",
      location: "",
      occupation: "",
      email: "",
      phone: "",
      instagram: "",
      notes: "",
      archetype: [],
    })
  }

  // Get unread message count
  const getUnreadMessageCount = () => {
    return participantMessages.filter(m => !m.read && m.direction === "inbound").length
  }

  // Get upcoming auditions count
  const getUpcomingAuditionsCount = () => {
    return auditionBookings.filter(a => a.status === "scheduled" && a.scheduledDate > Date.now()).length
  }

  // Get messages for a participant
  const getMessagesForParticipant = (participantId: string) => {
    return participantMessages.filter(m => m.participantId === participantId).sort((a, b) => b.timestamp - a.timestamp)
  }

  // Mark message as read
  const markMessageAsRead = (messageId: string) => {
    setParticipantMessages(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m))
  }

  // Send new message
  const sendMessage = (participantId: string) => {
    if (!newMessageContent.trim()) return
    const newMessage: ParticipantMessage = {
      id: `msg-${Date.now()}`,
      participantId,
      direction: "outbound",
      type: "email",
      content: newMessageContent.trim(),
      timestamp: Date.now(),
      read: true,
    }
    setParticipantMessages(prev => [newMessage, ...prev])
    setNewMessageContent("")
  }

  // Book audition
  const handleBookAudition = () => {
    if (!newAuditionForm.participantId || !newAuditionForm.date || !newAuditionForm.time) return
    
    const scheduledDate = new Date(`${newAuditionForm.date}T${newAuditionForm.time}`).getTime()
    const newAudition: AuditionBooking = {
      id: `aud-${Date.now()}`,
      participantId: newAuditionForm.participantId,
      scheduledDate,
      duration: newAuditionForm.duration,
      location: newAuditionForm.location || (newAuditionForm.type === "virtual" ? "Virtual" : "TBD"),
      type: newAuditionForm.type,
      status: "scheduled",
      notes: newAuditionForm.notes || undefined,
      meetingLink: newAuditionForm.type === "virtual" ? newAuditionForm.meetingLink : undefined,
      createdAt: Date.now(),
    }
    setAuditionBookings(prev => [...prev, newAudition])
    setShowBookAuditionForm(false)
    setNewAuditionForm({
      participantId: "",
      date: "",
      time: "",
      duration: 30,
      location: "",
      type: "in-person",
      notes: "",
      meetingLink: "",
    })
  }

  // Update audition status
  const updateAuditionStatus = (auditionId: string, status: AuditionBooking["status"]) => {
    setAuditionBookings(prev => prev.map(a => a.id === auditionId ? { ...a, status } : a))
  }

  // Cancel audition
  const cancelAudition = (auditionId: string) => {
    if (window.confirm("Are you sure you want to cancel this audition?")) {
      updateAuditionStatus(auditionId, "cancelled")
    }
  }

  // Update list sort settings
  const updateListSort = (listId: string, sortBy: SortOption, sortDirection: "asc" | "desc") => {
    setLists(prev => prev.map(l => 
      l.id === listId ? { ...l, sortBy, sortDirection } : l
    ))
  }

  // Multi-selection functions
  const toggleParticipantSelection = (participantId: string, event?: React.MouseEvent) => {
    event?.stopPropagation()
    setSelectedParticipantIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(participantId)) {
        newSet.delete(participantId)
      } else {
        newSet.add(participantId)
      }
      return newSet
    })
  }

  const selectAllVisible = () => {
    setSelectedParticipantIds(new Set(sortedParticipants.map(p => p.id)))
  }

  const clearSelection = () => {
    setSelectedParticipantIds(new Set())
  }

  const moveSelectedToList = (listId: string) => {
    setLists(prev => prev.map(list => {
      if (list.id === listId) {
        const newParticipantIds = new Set([...list.participantIds, ...selectedParticipantIds])
        return { ...list, participantIds: Array.from(newParticipantIds) }
      }
      return list
    }))
    setShowMoveToListMenu(false)
    clearSelection()
  }

  const removeSelectedFromCurrentList = () => {
    if (!selectedListId) return
    setLists(prev => prev.map(list => {
      if (list.id === selectedListId) {
        return { ...list, participantIds: list.participantIds.filter(id => !selectedParticipantIds.has(id)) }
      }
      return list
    }))
    clearSelection()
  }

  // Video management functions
  const detectVideoPlatform = (url: string): "vimeo" | "youtube" | "other" => {
    if (url.includes("vimeo.com")) return "vimeo"
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
    return "other"
  }

  const openAddVideoModal = () => {
    setEditingVideo(null)
    setVideoForm({
      url: "",
      title: "",
      tags: [],
      tagInput: "",
      password: "",
      isPasswordProtected: false,
      cropStart: 0,
      cropEnd: 0,
      enableCrop: false,
    })
    setShowVideoModal(true)
  }

  const openEditVideoModal = (video: ParticipantVideo) => {
    setEditingVideo(video)
    setVideoForm({
      url: video.url,
      title: video.title,
      tags: video.tags,
      tagInput: "",
      password: video.password || "",
      isPasswordProtected: video.isPasswordProtected,
      cropStart: video.crop?.startTime || 0,
      cropEnd: video.crop?.endTime || 0,
      enableCrop: !!video.crop,
    })
    setShowVideoModal(true)
  }

  const saveVideo = () => {
    if (!selectedParticipant || !videoForm.url || !videoForm.title) return
    
    const newVideo: ParticipantVideo = {
      id: editingVideo?.id || `video-${Date.now()}`,
      url: videoForm.url,
      title: videoForm.title,
      platform: detectVideoPlatform(videoForm.url),
      tags: videoForm.tags,
      password: videoForm.isPasswordProtected ? videoForm.password : undefined,
      isPasswordProtected: videoForm.isPasswordProtected,
      crop: videoForm.enableCrop ? { startTime: videoForm.cropStart, endTime: videoForm.cropEnd } : undefined,
      addedAt: editingVideo?.addedAt || Date.now(),
    }

    setParticipants(prev => prev.map(p => {
      if (p.id === selectedParticipant.id) {
        const videos = p.videos || []
        if (editingVideo) {
          return { ...p, videos: videos.map(v => v.id === editingVideo.id ? newVideo : v) }
        } else {
          return { ...p, videos: [...videos, newVideo] }
        }
      }
      return p
    }))
    
    // Update selectedParticipant
    setSelectedParticipant(prev => {
      if (!prev) return prev
      const videos = prev.videos || []
      if (editingVideo) {
        return { ...prev, videos: videos.map(v => v.id === editingVideo.id ? newVideo : v) }
      } else {
        return { ...prev, videos: [...videos, newVideo] }
      }
    })

    setShowVideoModal(false)
  }

  const deleteVideo = (videoId: string) => {
    if (!selectedParticipant) return
    
    setParticipants(prev => prev.map(p => {
      if (p.id === selectedParticipant.id) {
        return { ...p, videos: (p.videos || []).filter(v => v.id !== videoId) }
      }
      return p
    }))
    
    setSelectedParticipant(prev => {
      if (!prev) return prev
      return { ...prev, videos: (prev.videos || []).filter(v => v.id !== videoId) }
    })
  }

  const addVideoTag = () => {
    if (videoForm.tagInput.trim() && !videoForm.tags.includes(videoForm.tagInput.trim())) {
      setVideoForm(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: "",
      }))
    }
  }

  const removeVideoTag = (tag: string) => {
    setVideoForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  // Player View functions
  const openPlayerView = (startIndex = 0) => {
    setPlayerViewIndex(startIndex)
    setShowPlayerView(true)
  }

  const playerViewParticipants = sortedParticipants
  const currentPlayerParticipant = playerViewParticipants[playerViewIndex]

  const navigatePlayer = (direction: 1 | -1) => {
    const newIndex = playerViewIndex + direction
    if (newIndex >= 0 && newIndex < playerViewParticipants.length) {
      setPlayerViewIndex(newIndex)
      setNewComment("")
    }
  }

  const handleParticipantVote = (vote: "yes" | "no" | "maybe") => {
    if (!currentPlayerParticipant) return
    
    // For maybe vote, require a comment
    if (vote === "maybe" && participantVotes[currentPlayerParticipant.id] !== "maybe") {
      setShowMaybeCommentPrompt(true)
      return
    }
    
    setParticipantVotes(prev => ({
      ...prev,
      [currentPlayerParticipant.id]: prev[currentPlayerParticipant.id] === vote ? null : vote
    }))
    
    // Auto-advance after voting (except for toggling off)
    if (participantVotes[currentPlayerParticipant.id] !== vote) {
      setTimeout(() => {
        if (playerViewIndex < playerViewParticipants.length - 1) {
          navigatePlayer(1)
        }
      }, 500)
    }
  }

  const handleMaybeVoteWithComment = () => {
    if (!currentPlayerParticipant || !maybeCommentText.trim()) return
    
    // Add the comment
    const comment = {
      id: `comment-${Date.now()}`,
      text: maybeCommentText.trim(),
      timestamp: Date.now()
    }
    
    setParticipantComments(prev => ({
      ...prev,
      [currentPlayerParticipant.id]: [...(prev[currentPlayerParticipant.id] || []), comment]
    }))
    
    // Cast the vote
    setParticipantVotes(prev => ({
      ...prev,
      [currentPlayerParticipant.id]: "maybe"
    }))
    
    setShowMaybeCommentPrompt(false)
    setMaybeCommentText("")
    
    // Auto-advance
    setTimeout(() => {
      if (playerViewIndex < playerViewParticipants.length - 1) {
        navigatePlayer(1)
      }
    }, 500)
  }

  const addParticipantComment = () => {
    if (!currentPlayerParticipant || !newComment.trim()) return
    
    const comment = {
      id: `comment-${Date.now()}`,
      text: newComment.trim(),
      timestamp: Date.now()
    }
    
    setParticipantComments(prev => ({
      ...prev,
      [currentPlayerParticipant.id]: [...(prev[currentPlayerParticipant.id] || []), comment]
    }))
    
    setNewComment("")
  }

  const deleteParticipantComment = (participantId: string, commentId: string) => {
    setParticipantComments(prev => ({
      ...prev,
      [participantId]: (prev[participantId] || []).filter(c => c.id !== commentId)
    }))
  }

  // Group by stage for Kanban
  const participantsByStage = useMemo(() => {
    const grouped: Record<string, Participant[]> = {}
    funnelStages.forEach(stage => {
      grouped[stage.id] = []
    })
    filteredParticipants.forEach((p) => {
      if (grouped[p.stage]) {
        grouped[p.stage].push(p)
      } else {
        // If participant's stage no longer exists, put them in inbox
        grouped["inbox"]?.push(p)
      }
    })
    return grouped
  }, [filteredParticipants, funnelStages])

  // Pipeline stage management functions
  const handleAddStage = () => {
    if (!newStageName.trim()) return
    const newId = newStageName.toLowerCase().replace(/\s+/g, "-")
    // Pick a random color that's not already heavily used
    const usedColors = funnelStages.map(s => s.color)
    const availableColors = STAGE_COLORS.filter(c => !usedColors.includes(c))
    const color = availableColors.length > 0 
      ? availableColors[Math.floor(Math.random() * availableColors.length)]
      : STAGE_COLORS[Math.floor(Math.random() * STAGE_COLORS.length)]
    
    setFunnelStages([...funnelStages, { id: newId, label: newStageName.trim(), color }])
    setNewStageName("")
    setShowAddStageForm(false)
  }

  const handleRemoveStage = (stage: PipelineStage) => {
    // Check if there are participants in this stage
    const participantsInStage = participants.filter(p => p.stage === stage.id)
    if (participantsInStage.length > 0) {
      setStageToRemove(stage)
    } else {
      // No participants, remove directly
      setFunnelStages(funnelStages.filter(s => s.id !== stage.id))
    }
  }

  const confirmRemoveStage = () => {
    if (!stageToRemove) return
    // Move all participants from this stage to inbox
    setParticipants(participants.map(p => 
      p.stage === stageToRemove.id ? { ...p, stage: "inbox" } : p
    ))
    // Remove the stage
    setFunnelStages(funnelStages.filter(s => s.id !== stageToRemove.id))
    setStageToRemove(null)
  }

  const handleRenameStage = (stageId: string) => {
    if (!editingStageLabel.trim()) {
      setEditingStageId(null)
      return
    }
    setFunnelStages(funnelStages.map(s => 
      s.id === stageId ? { ...s, label: editingStageLabel.trim() } : s
    ))
    setEditingStageId(null)
    setEditingStageLabel("")
  }

  const handleStageDragStart = (e: React.DragEvent, stageId: string) => {
    e.dataTransfer.effectAllowed = "move"
    setDraggedStageId(stageId)
  }

  const handleStageDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    if (draggedStageId && draggedStageId !== stageId) {
      setDragOverStageId(stageId)
    }
  }

  const handleStageDrop = (targetStageId: string) => {
    if (!draggedStageId || draggedStageId === targetStageId) {
      setDraggedStageId(null)
      setDragOverStageId(null)
      return
    }
    const draggedIndex = funnelStages.findIndex(s => s.id === draggedStageId)
    const targetIndex = funnelStages.findIndex(s => s.id === targetStageId)
    if (draggedIndex === -1 || targetIndex === -1) return
    
    const newStages = [...funnelStages]
    const [removed] = newStages.splice(draggedIndex, 1)
    newStages.splice(targetIndex, 0, removed)
    setFunnelStages(newStages)
    setDraggedStageId(null)
    setDragOverStageId(null)
  }

  const handleDragStart = (participantId: string) => {
    setDraggedParticipant(participantId)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setDragOverStage(stageId)
  }

  const handleDrop = (stageId: FunnelStage) => {
    if (draggedParticipant) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === draggedParticipant ? { ...p, stage: stageId } : p))
      )
    }
    setDraggedParticipant(null)
    setDragOverStage(null)
  }

  const toggleStar = (participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, starred: !p.starred } : p))
    )
  }

  // Add new list
  const handleAddList = () => {
    if (!newListName.trim()) return
    const newList: CastList = {
      id: `list-${Date.now()}`,
      name: newListName.trim(),
      description: newListDescription.trim() || undefined,
      participantIds: [],
      color: newListColor,
      createdAt: Date.now(),
    }
    setLists((prev) => [...prev, newList])
    setNewListName("")
    setNewListDescription("")
    setNewListColor("bg-cyan-500")
    setShowAddListModal(false)
  }

  // Add new archetype
  const handleAddArchetype = () => {
  if (!newArchetypeName.trim()) return
  if (!customArchetypes.includes(newArchetypeName.trim())) {
  setCustomArchetypes((prev) => [...prev, newArchetypeName.trim()])
  }
  setNewArchetypeName("")
  setShowAddArchetypeInput(false)
  }

  // Delete archetype
  const handleDeleteArchetype = (archetype: string) => {
    // Check if any participants have this archetype
    const participantsWithArchetype = participants.filter(p => p.archetype.includes(archetype))
    
    if (participantsWithArchetype.length > 0) {
      // Show confirmation with count
      const confirmed = window.confirm(
        `"${archetype}" is assigned to ${participantsWithArchetype.length} participant(s). Deleting it will remove it from their profiles. Continue?`
      )
      if (!confirmed) return
      
      // Remove archetype from all participants
      setParticipants(prev => prev.map(p => ({
        ...p,
        archetype: p.archetype.filter(a => a !== archetype)
      })))
    }
    
    // Remove from custom archetypes list
    setCustomArchetypes(prev => prev.filter(a => a !== archetype))
    
    // Clear filter if filtering by this archetype
    if (filterArchetype === archetype) {
      setFilterArchetype(null)
    }
  }

  // Update participant
  const handleUpdateParticipant = (updated: Participant) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    )
    setEditingParticipant(null)
    setShowEditModal(false)
    if (selectedParticipant?.id === updated.id) {
      setSelectedParticipant(updated)
    }
  }

  // Add participant to list
  const addParticipantToList = (participantId: string, listId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId && !list.participantIds.includes(participantId)
          ? { ...list, participantIds: [...list.participantIds, participantId] }
          : list
      )
    )
  }

  // Remove participant from list
  const removeParticipantFromList = (participantId: string, listId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, participantIds: list.participantIds.filter((id) => id !== participantId) }
          : list
      )
    )
  }

  // Open edit modal
  const openEditModal = (participant: Participant) => {
    setEditingParticipant({ ...participant })
    setShowEditModal(true)
  }

  // Handle image file to base64
  const handleImageFile = (file: File, participantId: string) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, photo: base64 } : p))
      )
      // Also update editing participant if it's the same
      if (editingParticipant?.id === participantId) {
        setEditingParticipant((prev) => prev ? { ...prev, photo: base64 } : null)
      }
      // Update selected participant if it's the same
      if (selectedParticipant?.id === participantId) {
        setSelectedParticipant((prev) => prev ? { ...prev, photo: base64 } : null)
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle drag over for participant image
  const handleImageDragOver = (e: React.DragEvent, participantId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverParticipantId(participantId)
  }

  // Handle drag leave for participant image
  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverParticipantId(null)
  }

  // Handle drop on participant image
  const handleImageDrop = (e: React.DragEvent, participantId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverParticipantId(null)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageFile(files[0], participantId)
    }
  }

  // Handle file input change for edit modal
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0 && editingParticipant) {
      handleImageFile(files[0], editingParticipant.id)
    }
  }

  // Remove photo
  const removePhoto = (participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, photo: undefined } : p))
    )
    if (editingParticipant?.id === participantId) {
      setEditingParticipant((prev) => prev ? { ...prev, photo: undefined } : null)
    }
    if (selectedParticipant?.id === participantId) {
      setSelectedParticipant((prev) => prev ? { ...prev, photo: undefined } : null)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const formatFollowers = (count?: number) => {
    if (!count) return null
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
    return count.toString()
  }

const renderParticipantCard = (participant: Participant, compact = false) => {
  const isSelected = selectedParticipantIds.has(participant.id)
  return (
  <div
  key={participant.id}
  draggable
  onDragStart={() => handleDragStart(participant.id)}
  onDragEnd={() => { setDraggedParticipant(null); setDragOverStage(null) }}
  onClick={(e) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      toggleParticipantSelection(participant.id, e)
    } else if (selectedParticipantIds.size > 0) {
      toggleParticipantSelection(participant.id, e)
    } else {
      setSelectedParticipant(participant)
    }
  }}
  className={`bg-white rounded-xl border transition-all cursor-pointer group relative ${
  draggedParticipant === participant.id ? "opacity-50 scale-95" : ""
  } ${isSelected ? "ring-2 ring-cyan-500 border-cyan-400 bg-cyan-50/30" : "border-gray-200 hover:border-cyan-300 hover:shadow-md"
  } ${selectedParticipant?.id === participant.id && !isSelected ? "ring-2 ring-cyan-300 border-cyan-300" : ""}`}
  >
  {/* Selection checkbox */}
  <div 
    className={`absolute top-2 left-2 z-10 transition-opacity ${isSelected || selectedParticipantIds.size > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
    onClick={(e) => toggleParticipantSelection(participant.id, e)}
  >
    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
      isSelected ? "bg-cyan-600 border-cyan-600" : "bg-white/90 border-gray-300 hover:border-cyan-400"
    }`}>
      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
    </div>
  </div>
  
  <div className={`p-3 ${compact ? "space-y-2" : "space-y-3"}`}>
  {/* Header with photo and name */}
  <div className="flex items-start gap-3">
  <div className="relative">
  <div
  className={`${compact ? "w-10 h-10" : "w-12 h-12"} rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-sm overflow-hidden cursor-pointer transition-all ${
  dragOverParticipantId === participant.id ? "ring-2 ring-cyan-500 ring-offset-2 scale-105" : ""
  }`}
              onDragOver={(e) => handleImageDragOver(e, participant.id)}
              onDragLeave={handleImageDragLeave}
              onDrop={(e) => handleImageDrop(e, participant.id)}
              title="Drop image to add photo"
            >
              {dragOverParticipantId === participant.id ? (
                <ImagePlus className="w-5 h-5 text-cyan-600 animate-pulse" />
              ) : isValidImageUrl(participant.photo) ? (
                <img src={participant.photo} alt={participant.name} className="w-full h-full object-cover" />
              ) : (
                participant.name.split(" ").map((n) => n[0]).join("")
              )}
            </div>
            {participant.starred && (
              <Star className="absolute -top-1 -right-1 w-4 h-4 text-amber-500 fill-amber-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className={`font-semibold text-gray-900 leading-tight ${compact ? "text-xs" : "text-sm"}`}>
                {participant.name}
              </h4>
              {participant.manuallyAdded && (
                <span className="shrink-0 px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-[9px] font-semibold">
                  Manual
                </span>
              )}
              {participant.redFlags && participant.redFlags.length > 0 && (
                <Flag className="w-3 h-3 text-red-500 shrink-0" />
              )}
            </div>
            <p className={`text-gray-500 ${compact ? "text-[10px]" : "text-xs"}`}>
              {participant.age} • {participant.location}
            </p>
            <p className={`text-gray-600 truncate ${compact ? "text-[10px]" : "text-xs"}`}>
              {participant.occupation}
            </p>
            {/* Video and Comment counters */}
            <div className="flex items-center gap-2 mt-1">
              {participant.videos && participant.videos.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  <Video className="w-3 h-3" />
                  {participant.videos.length}
                </span>
              )}
              {participantComments[participant.id] && participantComments[participant.id].length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  <MessageSquare className="w-3 h-3" />
                  {participantComments[participant.id].length}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const availableLists = lists.filter(l => !l.participantIds.includes(participant.id))
                  if (availableLists.length === 1) {
                    addParticipantToList(participant.id, availableLists[0].id)
                  } else if (availableLists.length > 0) {
                    setSelectedParticipant(participant)
                    setShowListDropdown(true)
                  }
                }}
                className={`p-1 rounded hover:bg-cyan-50 transition-colors ${
                  lists.some(l => l.participantIds.includes(participant.id)) ? "text-cyan-500" : "text-gray-300 hover:text-cyan-600"
                }`}
                title={lists.some(l => l.participantIds.includes(participant.id)) 
                  ? `In ${lists.filter(l => l.participantIds.includes(participant.id)).length} list(s)` 
                  : "Add to list"}
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleStar(participant.id) }}
              className="p-1 rounded hover:bg-amber-50 transition-colors"
            >
              <Star className={`w-4 h-4 ${participant.starred ? "text-amber-500 fill-amber-500" : "text-gray-300 hover:text-amber-500"}`} />
            </button>
          </div>
        </div>

        {/* Archetypes */}
        <div className="flex flex-wrap gap-1">
          {participant.archetype.map((arch) => (
            <span key={arch} className="px-1.5 py-0.5 bg-cyan-50 text-cyan-700 rounded text-[10px] font-medium">
              {arch}
            </span>
          ))}
        </div>

        {/* Social + Score */}
        {!compact && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {participant.socialHandles.instagram && (
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Instagram className="w-3 h-3" />
                  {formatFollowers(participant.socialHandles.followerCount)}
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowScoringPanel(showScoringPanel === participant.id ? null : participant.id) }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                showScoringPanel === participant.id 
                  ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300" 
                  : "hover:bg-emerald-50 text-emerald-600"
              }`}
              title="Open detailed scoring"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{participant.score?.toFixed(1) || "—"}</span>
              {getScoredParameterCount(participant.id) > 0 && (
                <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1 rounded">
                  {getScoredParameterCount(participant.id)}/{SCORING_PARAMETERS.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Applied date */}
        <div className={`flex items-center gap-1 text-gray-400 ${compact ? "text-[9px]" : "text-[10px]"}`}>
          <Clock className="w-3 h-3" />
          Applied {formatDate(participant.appliedDate)}
        </div>
      </div>
    </div>
  )
}

  const renderPipelineView = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Pipeline header with Advanced button */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <Columns className="w-4 h-4 text-cyan-600" />
          <h3 className="text-sm font-semibold text-gray-700">Pipeline Stages</h3>
          <span className="text-xs text-gray-400">({participants.length} total)</span>
        </div>
        <button
          onClick={() => setShowAdvancedSettings(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Advanced
        </button>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 p-4 min-w-max h-full">
{funnelStages.map((stage) => {
        const stageParticipants = participantsByStage[stage.id] || []
          const isOver = dragOverStage === stage.id
          return (
            <div
              key={stage.id}
              className={`w-72 flex flex-col bg-gray-50/50 rounded-xl border transition-all ${
                isOver ? "border-cyan-400 bg-cyan-50/30 ring-2 ring-cyan-200" : "border-gray-200"
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => handleDrop(stage.id as FunnelStage)}
            >
              {/* Stage header */}
              <div className={`px-3 py-2.5 border-b ${stage.color.replace("text-", "border-").split(" ")[2]} rounded-t-xl`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${stage.color}`}>
                      {stageParticipants.length}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-800">{stage.label}</h3>
                  </div>
                  <button className="p-1 rounded hover:bg-white/50 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {stageParticipants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Inbox className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">No participants</p>
                  </div>
                ) : (
                  stageParticipants.map((p) => renderParticipantCard(p, true))
                )}
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )

const renderGridView = () => (
  <div className="flex-1 overflow-y-auto p-4">
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
  {sortedParticipants.map((p) => renderParticipantCard(p))}
  </div>
  </div>
  )

  const renderParticipantDetail = () => {
    if (!selectedParticipant) return null
    const p = selectedParticipant
    const stage = funnelStages.find((s) => s.id === p.stage)

    return (
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Participant Details</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => openEditModal(p)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-cyan-600"
              title="Edit participant"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedParticipant(null)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Profile header */}
          <div className="text-center">
            <div 
              className={`w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-2xl mx-auto mb-3 overflow-hidden cursor-pointer transition-all ${
                dragOverParticipantId === p.id ? "ring-2 ring-cyan-500 ring-offset-2 scale-105" : ""
              }`}
              onDragOver={(e) => handleImageDragOver(e, p.id)}
              onDragLeave={handleImageDragLeave}
              onDrop={(e) => handleImageDrop(e, p.id)}
              title="Drop image to add photo"
            >
              {dragOverParticipantId === p.id ? (
                <ImagePlus className="w-8 h-8 text-cyan-600 animate-pulse" />
              ) : isValidImageUrl(p.photo) ? (
                <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                p.name.split(" ").map((n) => n[0]).join("")
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{p.name}</h2>
            <p className="text-sm text-gray-500">{p.age} years old • {p.location}</p>
            <p className="text-sm text-gray-600">{p.occupation}</p>
          </div>

          {/* Current stage */}
          <div className="flex items-center justify-center">
            <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${stage?.color}`}>
              {stage?.label}
            </span>
          </div>

          {/* Quick actions */}
          <div className="flex justify-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-medium hover:bg-cyan-100 transition-colors">
              <Phone className="w-3.5 h-3.5" /> Call
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
              <Mail className="w-3.5 h-3.5" /> Email
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" /> Note
            </button>
          </div>

          {/* Archetypes */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Archetypes</h4>
            <div className="flex flex-wrap gap-1.5">
              {p.archetype.map((arch) => (
                <span key={arch} className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-medium">
                  {arch}
                </span>
              ))}
            </div>
          </div>

          {/* Lists */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lists</h4>
            <div className="space-y-1.5">
              {lists.filter((list) => list.participantIds.includes(p.id)).map((list) => (
                <div key={list.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${list.color}`} />
                    <span className="text-xs text-gray-700">{list.name}</span>
                  </div>
                  <button
                    onClick={() => removeParticipantFromList(p.id, list.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {/* Add to list dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowListDropdown(!showListDropdown)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:text-cyan-600 hover:border-cyan-300 hover:bg-cyan-50/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FolderPlus className="w-3.5 h-3.5" />
                    Add to list
                  </div>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showListDropdown ? "rotate-180" : ""}`} />
                </button>
                {showListDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowListDropdown(false)} />
                    <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-20 max-h-48 overflow-y-auto">
                      {lists.filter((list) => !list.participantIds.includes(p.id)).length === 0 ? (
                        <div className="px-3 py-4 text-center">
                          <p className="text-xs text-gray-400 mb-2">Already in all lists</p>
                          <button
                            onClick={() => { setShowListDropdown(false); setShowAddListModal(true) }}
                            className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                          >
                            Create new list
                          </button>
                        </div>
                      ) : (
                        <>
                          {lists.filter((list) => !list.participantIds.includes(p.id)).map((list) => (
                            <button
                              key={list.id}
                              onClick={() => { addParticipantToList(p.id, list.id); setShowListDropdown(false) }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 hover:bg-cyan-50 transition-colors"
                            >
                              <div className={`w-2.5 h-2.5 rounded-full ${list.color}`} />
                              <span className="flex-1 text-left">{list.name}</span>
                              <Plus className="w-3 h-3 text-gray-400" />
                            </button>
                          ))}
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              onClick={() => { setShowListDropdown(false); setShowAddListModal(true) }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-cyan-600 hover:bg-cyan-50 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Create new list
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Social Vibe */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Social Media</h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {p.socialHandles.instagram && (
                <div className="flex items-center justify-between">
                  <a href={`https://instagram.com/${p.socialHandles.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-700 hover:text-pink-600">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    {p.socialHandles.instagram}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {p.socialHandles.followerCount && (
                    <span className="text-xs font-semibold text-gray-600">
                      {formatFollowers(p.socialHandles.followerCount)}
                    </span>
                  )}
                </div>
              )}
              {p.socialHandles.tiktok && (
                <a href={`https://tiktok.com/${p.socialHandles.tiktok.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                  <Video className="w-4 h-4 text-gray-800" />
                  {p.socialHandles.tiktok}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {p.socialHandles.twitter && (
                <a href={`https://twitter.com/${p.socialHandles.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-500">
                  <Twitter className="w-4 h-4 text-blue-500" />
                  {p.socialHandles.twitter}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {p.socialHandles.youtube && (
                <a href={p.socialHandles.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-700 hover:text-red-600">
                  <Youtube className="w-4 h-4 text-red-600" />
                  YouTube
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {p.socialHandles.website && (
                <a href={p.socialHandles.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-700 hover:text-cyan-600">
                  <Globe className="w-4 h-4 text-cyan-600" />
                  Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {!p.socialHandles.instagram && !p.socialHandles.tiktok && !p.socialHandles.twitter && !p.socialHandles.youtube && !p.socialHandles.website && (
                <p className="text-xs text-gray-400 italic">No social links added</p>
              )}
            </div>
          </div>

          {/* Score */}
          {p.score && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Scorecard</h4>
              <div className="bg-emerald-50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-emerald-700">Average Score</span>
                <span className="text-2xl font-bold text-emerald-700">{p.score}</span>
              </div>
            </div>
          )}

          {/* Videos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Film className="w-3 h-3" /> Videos
              </h4>
              <button
                onClick={openAddVideoModal}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Video
              </button>
            </div>
            {(!p.videos || p.videos.length === 0) ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Film className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 mb-2">No videos added yet</p>
                <button
                  onClick={openAddVideoModal}
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  Add your first video
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {p.videos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-gray-50 rounded-lg p-3 group hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail placeholder */}
                      <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shrink-0 relative overflow-hidden">
                        <Play className="w-6 h-6 text-gray-500" />
                        {video.isPasswordProtected && (
                          <div className="absolute top-1 right-1 p-0.5 bg-amber-500 rounded">
                            <Lock className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        {video.crop && (
                          <div className="absolute bottom-1 left-1 p-0.5 bg-purple-500 rounded">
                            <Scissors className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-semibold text-gray-900 truncate">{video.title}</h5>
                        <p className="text-[10px] text-gray-400 capitalize">{video.platform}</p>
                        {video.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {video.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded text-[9px]">
                                {tag}
                              </span>
                            ))}
                            {video.tags.length > 3 && (
                              <span className="text-[9px] text-gray-400">+{video.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                        {video.crop && (
                          <p className="text-[9px] text-purple-600 mt-0.5">
                            Cropped: {video.crop.startTime}s - {video.crop.endTime}s
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditVideoModal(video)}
                          className="p-1 rounded hover:bg-white text-gray-400 hover:text-cyan-600"
                          title="Edit video"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteVideo(video.id)}
                          className="p-1 rounded hover:bg-white text-gray-400 hover:text-red-500"
                          title="Delete video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Red Flags */}
          {p.redFlags && p.redFlags.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Flag className="w-3 h-3" /> Red Flags
              </h4>
              <div className="space-y-2">
                {p.redFlags.map((flag, i) => (
                  <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                    {flag.note}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {p.notes && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{p.notes}</p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Timeline</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <Inbox className="w-3.5 h-3.5 text-gray-400" />
                Applied {formatDate(p.appliedDate)}
              </div>
              {p.lastContact && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                  Last contact {formatDate(p.lastContact)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions footer */}
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button 
            onClick={() => { setParticipantToDelete(p); setShowDeleteConfirmModal(true) }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button 
            onClick={() => setShowAdvanceStageModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" /> Advance
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-muted z-50 flex flex-col pl-14">
      {/* Slim Sidebar Strip / Expandable Drawer */}
      <FloatingSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentModal="castingForTV"
      />

      {/* Header */}
      <ModalHeader
        title="Casting for TV"
        titleColor="bg-indigo-600"
        onClose={onClose}
      />

      {/* Toolbar */}
      <div className="bg-background border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search participants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
            />
          </div>

          {/* Archetype filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                filterArchetype ? "border-info-300 bg-info-50 text-info-700" : "border-input text-muted-foreground hover:bg-muted"
              }`}
            >
              <Filter className="w-4 h-4" />
              {filterArchetype || "All Archetypes"}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showFilters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                <div className="absolute top-full left-0 mt-1 w-64 bg-popover rounded-xl shadow-lg border border-border py-1 z-20 max-h-80 overflow-y-auto">
                  <button
                    onClick={() => { setFilterArchetype(null); setShowFilters(false) }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${!filterArchetype ? "text-info-600 font-medium" : "text-popover-foreground"}`}
                  >
                    All Archetypes
                  </button>
                  <div className="border-t border-border my-1" />
                  {customArchetypes.map((arch) => (
                    <div
                      key={arch}
                      className={`group flex items-center justify-between px-3 py-2 hover:bg-muted ${filterArchetype === arch ? "bg-info-50" : ""}`}
                    >
                      <button
                        onClick={() => { setFilterArchetype(arch); setShowFilters(false) }}
                        className={`flex-1 text-left text-sm ${filterArchetype === arch ? "text-info-600 font-medium" : "text-popover-foreground"}`}
                      >
                        {arch}
                      </button>
                      <div className="flex items-center gap-1">
                        {filterArchetype === arch && <Check className="w-4 h-4 text-info-600" />}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteArchetype(arch) }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          title="Delete archetype"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 my-1" />
                  {showAddArchetypeInput ? (
                    <div className="px-3 py-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newArchetypeName}
                          onChange={(e) => setNewArchetypeName(e.target.value)}
                          placeholder="New archetype name..."
                          className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddArchetype()
                            if (e.key === "Escape") setShowAddArchetypeInput(false)
                          }}
                        />
                        <button
                          onClick={handleAddArchetype}
                          className="px-2 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddArchetypeInput(true)}
                      className="w-full px-3 py-2 text-left text-sm text-cyan-600 hover:bg-cyan-50 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Archetype
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Add dropdown */}
          <div className="relative" ref={addDropdownRef}>
            <button
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
              <ChevronDown className="w-3 h-3" />
            </button>
            {showAddDropdown && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowAddDropdown(false)} />
                <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30">
                  <button
                    onClick={() => { setShowAddDropdown(false); setShowAddParticipantModal(true) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 text-cyan-600" />
                    Add Participant
                  </button>
                  <button
                    onClick={() => { setShowAddDropdown(false); openModal("uploadCSV") }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" />
                    Upload File
                  </button>
                  <button
                    onClick={() => { setShowAddDropdown(false); openModal("formManager") }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Link className="w-4 h-4 text-blue-600" />
                    Open Form
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => { setShowAddDropdown(false); openModal("addFromDatabase") }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Database className="w-4 h-4 text-purple-600" />
                    Import from Database
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Player View button */}
          <button
            onClick={() => openPlayerView(0)}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            Player
          </button>

          {/* Contacts button */}
          <button
            onClick={() => setShowContactsModal(true)}
            className="relative flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contacts
            {getUnreadMessageCount() > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                {getUnreadMessageCount()}
              </span>
            )}
          </button>

          {/* Book Auditions button */}
          <button
            onClick={() => setShowAuditionsModal(true)}
            className="relative flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Auditions
            {getUpcomingAuditionsCount() > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-cyan-500 text-white text-[10px] font-bold rounded-full">
                {getUpcomingAuditionsCount()}
              </span>
            )}
          </button>

        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Grid
          </button>
          <button
            onClick={() => setActiveView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
          <button
            onClick={() => setActiveView("pipeline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === "pipeline" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Pipeline
          </button>
          <button
            onClick={() => setActiveView("mix")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === "mix" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
  <Shuffle className="w-3.5 h-3.5" />
  Cast Mix
  </button>
  </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Lists sidebar - hidden on mix view */}
        {activeView !== "mix" && (
        <div className={`border-r border-gray-200 bg-white flex flex-col shrink-0 transition-all duration-200 ${showListsPanel ? "w-56" : "w-12"}`}>
          {/* Panel header */}
          <div className={`p-3 border-b border-gray-100 ${showListsPanel ? "" : "flex items-center justify-center"}`}>
            {showListsPanel ? (
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lists</h3>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setShowAddListModal(true)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-cyan-600"
                    title="Add new list"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setShowListsPanel(false)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    title="Collapse panel"
                  >
                    <ChevronDown className="w-3.5 h-3.5 rotate-90" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowListsPanel(true)}
                className="p-1.5 rounded hover:bg-cyan-50 text-gray-400 hover:text-cyan-600 transition-colors"
                title="Expand lists panel"
              >
                <List className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Panel content */}
          {showListsPanel ? (
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <button
                onClick={() => setSelectedListId(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedListId ? "bg-cyan-50 text-cyan-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Users className="w-4 h-4" />
                All Participants
                <span className="ml-auto text-xs text-gray-400">{participants.length}</span>
              </button>
              {lists.map((list) => (
                <div key={list.id} className="group">
                  <button
                    onClick={() => setSelectedListId(list.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedListId === list.id ? "bg-cyan-50 text-cyan-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${list.color}`} />
                    <span className="truncate flex-1 text-left">{list.name}</span>
                    <span className="text-xs text-gray-400">{list.participantIds.length}</span>
                  </button>
                  {/* Sort indicator for selected list */}
                  {selectedListId === list.id && (
                    <div className="px-3 py-1.5 bg-cyan-50/50 rounded-b-lg -mt-1 border-t border-cyan-100">
                      <div className="flex items-center gap-1.5">
                        <ArrowUpDown className="w-3 h-3 text-cyan-500" />
                        <select
                          value={list.sortBy || "custom"}
                          onChange={(e) => updateListSort(list.id, e.target.value as SortOption, list.sortDirection || "desc")}
                          className="flex-1 text-[10px] bg-white border border-cyan-200 rounded px-1.5 py-0.5 text-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        >
                          <option value="score">By Score</option>
                          <option value="name">By Name</option>
                          <option value="date">By Date</option>
                          <option value="stage">By Stage</option>
                          <option value="custom">Custom Order</option>
                        </select>
                        <button
                          onClick={() => updateListSort(list.id, list.sortBy || "score", list.sortDirection === "asc" ? "desc" : "asc")}
                          className="p-0.5 rounded hover:bg-cyan-100 text-cyan-600"
                          title={list.sortDirection === "asc" ? "Ascending" : "Descending"}
                        >
                          {list.sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Global sort when no list selected */}
              {!selectedListId && (
                <div className="px-2 py-2 border-t border-gray-100 mt-2">
                  <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Sort All</div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={globalSortBy}
                      onChange={(e) => setGlobalSortBy(e.target.value as SortOption)}
                      className="flex-1 text-[10px] bg-white border border-gray-200 rounded px-1.5 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    >
                      <option value="score">By Score</option>
                      <option value="name">By Name</option>
                      <option value="date">By Date</option>
                      <option value="stage">By Stage</option>
                    </select>
                    <button
                      onClick={() => setGlobalSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                      className="p-1 rounded hover:bg-gray-100 text-gray-500"
                      title={globalSortDirection === "asc" ? "Ascending" : "Descending"}
                    >
                      {globalSortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Add new list button at bottom */}
              <button
                onClick={() => setShowAddListModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-cyan-600 hover:bg-cyan-50/50 transition-colors border border-dashed border-gray-200 hover:border-cyan-300 mt-2"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Add New List</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto py-2 flex flex-col items-center gap-1">
              <button
                onClick={() => setSelectedListId(null)}
                className={`p-2 rounded-lg transition-colors ${
                  !selectedListId ? "bg-cyan-50 text-cyan-700" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
                title="All Participants"
              >
                <Users className="w-4 h-4" />
              </button>
              {lists.slice(0, 6).map((list) => (
                <button
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    selectedListId === list.id ? "bg-cyan-50" : "hover:bg-gray-50"
                  }`}
                  title={`${list.name} (${list.participantIds.length})`}
                >
                  <div className={`w-3 h-3 rounded-full ${list.color}`} />
                </button>
              ))}
              {lists.length > 6 && (
                <span className="text-[10px] text-gray-400">+{lists.length - 6}</span>
              )}
              <button
                onClick={() => setShowAddListModal(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors mt-1"
                title="Add new list"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        )}

        {activeView === "pipeline" && renderPipelineView()}
        {activeView === "grid" && renderGridView()}
        {activeView === "list" && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Archetype</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
{sortedParticipants.map((p) => {
                    const stage = funnelStages.find((s) => s.id === p.stage)
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedParticipant(p)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedParticipant?.id === p.id ? "bg-cyan-50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-xs">
                              {p.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-gray-900">{p.name}</span>
                                {p.starred && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                {p.redFlags && p.redFlags.length > 0 && <Flag className="w-3 h-3 text-red-500" />}
                              </div>
                              <span className="text-xs text-gray-500">{p.age} • {p.occupation}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {p.archetype.slice(0, 2).map((arch) => (
                              <span key={arch} className="px-1.5 py-0.5 bg-cyan-50 text-cyan-700 rounded text-[10px] font-medium">{arch}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.location}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stage?.color}`}>{stage?.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          {p.score ? (
                            <span className="text-sm font-semibold text-emerald-700">{p.score}</span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(p.appliedDate)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedParticipant(p) }}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-cyan-600"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); openEditModal(p) }}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-cyan-600"
                              title="Edit participant"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setParticipants((prev) => prev.filter((x) => x.id !== p.id)) }}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"
                              title="Delete participant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeView === "mix" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Cast Mix header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Shuffle className="w-5 h-5 text-cyan-600" />
                    Cast Mix Builder
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">Drag participants into slots to build your ideal cast composition</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowSlotSettings(!showSlotSettings)}
                    className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${
                      showSlotSettings ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Manage Slots
                  </button>
                  <button 
                    onClick={() => setShowDemographicFilter(!showDemographicFilter)}
                    className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${
                      showDemographicFilter ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    {(demographicFilters.gender !== "all" || demographicFilters.ageRange !== "all" || demographicFilters.stage !== "all") && (
                      <span className="ml-1 px-1.5 py-0.5 bg-cyan-600 text-white text-[10px] font-bold rounded-full">
                        {[demographicFilters.gender !== "all", demographicFilters.ageRange !== "all", demographicFilters.stage !== "all"].filter(Boolean).length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Filters Panel */}
              {showDemographicFilter && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Filter Participants</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Gender:</span>
                      <select
                        value={demographicFilters.gender}
                        onChange={(e) => setDemographicFilters(prev => ({ ...prev, gender: e.target.value as typeof prev.gender }))}
                        className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="all">All</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non-binary">Non-binary</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Age Range:</span>
                      <select
                        value={demographicFilters.ageRange}
                        onChange={(e) => setDemographicFilters(prev => ({ ...prev, ageRange: e.target.value as typeof prev.ageRange }))}
                        className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="all">All Ages</option>
                        <option value="18-25">18-25</option>
                        <option value="26-35">26-35</option>
                        <option value="36-45">36-45</option>
                        <option value="46+">46+</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Stage:</span>
                      <select
                        value={demographicFilters.stage}
                        onChange={(e) => setDemographicFilters(prev => ({ ...prev, stage: e.target.value }))}
                        className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="all">All Stages</option>
                        {funnelStages.map(stage => (
                          <option key={stage.id} value={stage.id}>{stage.label}</option>
                        ))}
                      </select>
                    </div>
                    {(demographicFilters.gender !== "all" || demographicFilters.ageRange !== "all" || demographicFilters.stage !== "all") && (
                      <button
                        onClick={() => setDemographicFilters({ gender: "all", ageRange: "all", stage: "all" })}
                        className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Clear filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Split screen layout - Side by Side */}
            <div className="flex-1 flex overflow-hidden">
              {/* Cast Mix Builder - Primary Area (Left) */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
              {/* Slot Settings Panel */}
              {showSlotSettings && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Slot & Group Management</h3>
                    <button onClick={() => setShowSlotSettings(false)} className="p-1 rounded hover:bg-gray-200 text-gray-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Groups */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Groups</span>
                      <button
                        onClick={() => setShowAddGroupForm(true)}
                        className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Group
                      </button>
                    </div>
                    <div className="space-y-2">
                      {castSlotGroups.map((group) => (
                        <div key={group.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                          <div className={`w-3 h-3 rounded-full ${group.color}`} />
                          {editingGroupId === group.id ? (
                            <input
                              type="text"
                              value={editingGroupName}
                              onChange={(e) => setEditingGroupName(e.target.value)}
                              onBlur={() => {
                                if (editingGroupName.trim()) {
                                  setCastSlotGroups(prev => prev.map(g => g.id === group.id ? { ...g, name: editingGroupName.trim() } : g))
                                }
                                setEditingGroupId(null)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (editingGroupName.trim()) {
                                    setCastSlotGroups(prev => prev.map(g => g.id === group.id ? { ...g, name: editingGroupName.trim() } : g))
                                  }
                                  setEditingGroupId(null)
                                }
                                if (e.key === "Escape") setEditingGroupId(null)
                              }}
                              className="flex-1 px-2 py-0.5 text-sm border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              autoFocus
                            />
                          ) : (
                            <span className="flex-1 text-sm text-gray-700">{group.name}</span>
                          )}
                          <span className="text-xs text-gray-400">{castSlots.filter(s => s.groupId === group.id).length} slots</span>
                          <label className="flex items-center gap-1 text-xs text-gray-500">
                            <input
                              type="checkbox"
                              checked={group.allowMultiple}
                              onChange={(e) => setCastSlotGroups(prev => prev.map(g => g.id === group.id ? { ...g, allowMultiple: e.target.checked } : g))}
                              className="w-3 h-3 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            Multi
                          </label>
                          <button
                            onClick={() => { setEditingGroupId(group.id); setEditingGroupName(group.name) }}
                            className="p-1 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              setCastSlots(prev => prev.map(s => s.groupId === group.id ? { ...s, groupId: null } : s))
                              setCastSlotGroups(prev => prev.filter(g => g.id !== group.id))
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {showAddGroupForm && (
                        <div className="flex items-center gap-2 p-2 bg-cyan-50 rounded-lg border border-cyan-200">
                          <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Group name..."
                            className="flex-1 px-2 py-1 text-sm border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newGroupName.trim()) {
                                setCastSlotGroups(prev => [...prev, { id: `group-${Date.now()}`, name: newGroupName.trim(), allowMultiple: false, color: "bg-gray-500" }])
                                setNewGroupName("")
                                setShowAddGroupForm(false)
                              }
                              if (e.key === "Escape") { setShowAddGroupForm(false); setNewGroupName("") }
                            }}
                          />
                          <button
                            onClick={() => {
                              if (newGroupName.trim()) {
                                setCastSlotGroups(prev => [...prev, { id: `group-${Date.now()}`, name: newGroupName.trim(), allowMultiple: false, color: "bg-gray-500" }])
                                setNewGroupName("")
                                setShowAddGroupForm(false)
                              }
                            }}
                            className="px-2 py-1 bg-cyan-600 text-white text-xs font-medium rounded hover:bg-cyan-700"
                          >
                            Add
                          </button>
                          <button onClick={() => { setShowAddGroupForm(false); setNewGroupName("") }} className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Individual Slots */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Individual Slots</span>
                      <button
                        onClick={() => setShowAddSlotForm(true)}
                        className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Slot
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {castSlots.map((slot) => (
                        <div key={slot.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                          <div className={`w-2.5 h-2.5 rounded-full ${slot.color}`} />
                          {editingSlotId === slot.id ? (
                            <input
                              type="text"
                              value={editingSlotLabel}
                              onChange={(e) => setEditingSlotLabel(e.target.value)}
                              onBlur={() => {
                                if (editingSlotLabel.trim()) {
                                  setCastSlots(prev => prev.map(s => s.id === slot.id ? { ...s, label: editingSlotLabel.trim() } : s))
                                }
                                setEditingSlotId(null)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (editingSlotLabel.trim()) {
                                    setCastSlots(prev => prev.map(s => s.id === slot.id ? { ...s, label: editingSlotLabel.trim() } : s))
                                  }
                                  setEditingSlotId(null)
                                }
                                if (e.key === "Escape") setEditingSlotId(null)
                              }}
                              className="flex-1 px-2 py-0.5 text-xs border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              autoFocus
                            />
                          ) : (
                            <span className="flex-1 text-xs text-gray-700 truncate">{slot.label}</span>
                          )}
                          <select
                            value={slot.groupId || ""}
                            onChange={(e) => setCastSlots(prev => prev.map(s => s.id === slot.id ? { ...s, groupId: e.target.value || null } : s))}
                            className="text-[10px] px-1.5 py-0.5 border border-gray-200 rounded bg-gray-50 text-gray-600"
                          >
                            <option value="">No group</option>
                            {castSlotGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                          </select>
                          <button
                            onClick={() => { setEditingSlotId(slot.id); setEditingSlotLabel(slot.label) }}
                            className="p-1 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setCastSlots(prev => prev.filter(s => s.id !== slot.id))}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {showAddSlotForm && (
                        <div className="col-span-2 flex items-center gap-2 p-2 bg-cyan-50 rounded-lg border border-cyan-200">
                          <input
                            type="text"
                            value={newSlotName}
                            onChange={(e) => setNewSlotName(e.target.value)}
                            placeholder="Slot name..."
                            className="flex-1 px-2 py-1 text-sm border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            autoFocus
                          />
                          <select
                            value={newSlotGroupId || ""}
                            onChange={(e) => setNewSlotGroupId(e.target.value || null)}
                            className="text-xs px-2 py-1 border border-cyan-300 rounded bg-white"
                          >
                            <option value="">No group</option>
                            {castSlotGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                          </select>
                          <button
                            onClick={() => {
                              if (newSlotName.trim()) {
                                setCastSlots(prev => [...prev, { 
                                  id: `slot-${Date.now()}`, 
                                  label: newSlotName.trim(), 
                                  color: newSlotColor, 
                                  icon: "user", 
                                  groupId: newSlotGroupId, 
                                  assignedParticipantId: null 
                                }])
                                setNewSlotName("")
                                setNewSlotGroupId(null)
                                setShowAddSlotForm(false)
                              }
                            }}
                            className="px-2 py-1 bg-cyan-600 text-white text-xs font-medium rounded hover:bg-cyan-700"
                          >
                            Add
                          </button>
                          <button onClick={() => { setShowAddSlotForm(false); setNewSlotName(""); setNewSlotGroupId(null) }} className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Cast Mix slots - grouped */}
              <div className="space-y-6 mb-8">
                {/* Grouped slots */}
                {castSlotGroups.map((group) => {
                  const groupSlots = castSlots.filter(s => s.groupId === group.id)
                  if (groupSlots.length === 0) return null
                  return (
                    <div key={group.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${group.color}`} />
                          <h3 className="text-sm font-semibold text-gray-700">{group.name}</h3>
                          <span className="text-xs text-gray-400">({groupSlots.filter(s => s.assignedParticipantId).length}/{groupSlots.length} filled)</span>
                        </div>
                        {group.allowMultiple && (
                          <button
                            onClick={() => {
                              setCastSlots(prev => [...prev, {
                                id: `slot-${Date.now()}`,
                                label: `${group.name} ${groupSlots.length + 1}`,
                                color: group.color,
                                icon: "user",
                                groupId: group.id,
                                assignedParticipantId: null
                              }])
                            }}
                            className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 px-2 py-1 hover:bg-cyan-50 rounded"
                          >
                            <Plus className="w-3 h-3" /> Add Slot
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {groupSlots.map((slot) => {
                          const assignedParticipant = slot.assignedParticipantId ? participants.find((p) => p.id === slot.assignedParticipantId) : null
                          return (
                            <div
                              key={slot.id}
                              className={`group relative rounded-xl border-2 transition-all ${
                                assignedParticipant
                                  ? "border-solid border-gray-200 bg-white"
                                  : "border-dashed border-gray-300 bg-white hover:border-cyan-300 hover:bg-cyan-50/30"
                              }`}
                              onDragOver={(e) => { e.preventDefault(); setDragOverStage(slot.id) }}
                              onDragLeave={() => setDragOverStage(null)}
                              onDrop={() => {
                                if (draggedParticipant) {
                                  setCastSlots(prev => prev.map(s => s.id === slot.id ? { ...s, assignedParticipantId: draggedParticipant } : s))
                                }
                                setDraggedParticipant(null)
                                setDragOverStage(null)
                              }}
                            >
                              {/* Delete slot button */}
                              <button
                                onClick={() => setCastSlots(prev => prev.filter(s => s.id !== slot.id))}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm z-10"
                                title="Delete slot"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <div className={`absolute -top-2.5 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${slot.color}`}>
                                {slot.label}
                              </div>
                              {assignedParticipant ? (
                                <div className="p-3 pt-4">
                                  <div className="flex items-start gap-2">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-sm">
                                      {assignedParticipant.name.split(" ").map((n) => n[0]).join("")}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-xs font-semibold text-gray-900 truncate">{assignedParticipant.name}</h4>
                                      <p className="text-[10px] text-gray-500">{assignedParticipant.age} • {assignedParticipant.location}</p>
                                    </div>
                                    <button
                                      onClick={() => setCastSlots(prev => prev.map(s => s.id === slot.id ? { ...s, assignedParticipantId: null } : s))}
                                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
                                      title="Remove participant"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className={`p-6 pt-7 flex flex-col items-center justify-center text-gray-400 transition-colors ${dragOverStage === slot.id ? "bg-cyan-50 text-cyan-600" : ""}`}>
                                  <User className="w-6 h-6 mb-1 opacity-40" />
                                  <p className="text-[10px] font-medium">Drop here</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Ungrouped slots */}
                {castSlots.filter(s => !s.groupId).length > 0 && (
                  <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-700">Other Slots</h3>
                        <span className="text-xs text-gray-400">({castSlots.filter(s => !s.groupId && s.assignedParticipantId).length}/{castSlots.filter(s => !s.groupId).length} filled)</span>
                      </div>
                      <button
                        onClick={() => {
                          setCastSlots(prev => [...prev, {
                            id: `slot-${Date.now()}`,
                            label: `Slot ${castSlots.filter(s => !s.groupId).length + 1}`,
                            color: "bg-gray-500",
                            icon: "user",
                            groupId: null,
                            assignedParticipantId: null
                          }])
                        }}
                        className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 px-2 py-1 hover:bg-cyan-50 rounded"
                      >
                        <Plus className="w-3 h-3" /> Add Slot
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {castSlots.filter(s => !s.groupId).map((slot) => {
                        const assignedParticipant = slot.assignedParticipantId ? participants.find((p) => p.id === slot.assignedParticipantId) : null
                        return (
                          <div
                            key={slot.id}
                            className={`group relative rounded-xl border-2 transition-all ${
                              assignedParticipant
                                ? "border-solid border-gray-200 bg-white"
                                : "border-dashed border-gray-300 bg-white hover:border-cyan-300 hover:bg-cyan-50/30"
                            }`}
                            onDragOver={(e) => { e.preventDefault(); setDragOverStage(slot.id) }}
                            onDragLeave={() => setDragOverStage(null)}
                            onDrop={() => {
                              if (draggedParticipant) {
                                setCastSlots(prev => prev.map(s => s.id === slot.id ? { ...s, assignedParticipantId: draggedParticipant } : s))
                              }
                              setDraggedParticipant(null)
                              setDragOverStage(null)
                            }}
                          >
                            {/* Delete slot button */}
                            <button
                              onClick={() => setCastSlots(prev => prev.filter(s => s.id !== slot.id))}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm z-10"
                              title="Delete slot"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className={`absolute -top-2.5 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${slot.color}`}>
                              {slot.label}
                            </div>
                            {assignedParticipant ? (
                              <div className="p-3 pt-4">
                                <div className="flex items-start gap-2">
                                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-sm">
                                    {assignedParticipant.name.split(" ").map((n) => n[0]).join("")}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-semibold text-gray-900 truncate">{assignedParticipant.name}</h4>
                                    <p className="text-[10px] text-gray-500">{assignedParticipant.age} • {assignedParticipant.location}</p>
                                  </div>
                                  <button
                                    onClick={() => setCastSlots(prev => prev.map(s => s.id === slot.id ? { ...s, assignedParticipantId: null } : s))}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
                                    title="Remove participant"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={`p-6 pt-7 flex flex-col items-center justify-center text-gray-400 transition-colors ${dragOverStage === slot.id ? "bg-cyan-50 text-cyan-600" : ""}`}>
                                <User className="w-6 h-6 mb-1 opacity-40" />
                                <p className="text-[10px] font-medium">Drop here</p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {/* Quick Add Slot button - always visible */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => {
                      setCastSlots(prev => [...prev, {
                        id: `slot-${Date.now()}`,
                        label: `New Slot ${castSlots.length + 1}`,
                        color: "bg-cyan-500",
                        icon: "user",
                        groupId: null,
                        assignedParticipantId: null
                      }])
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium hover:bg-cyan-50 rounded-lg border border-dashed border-cyan-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Slot
                  </button>
                </div>
              </div>
              </div>
              
              {/* Available Participants - Right Side Panel */}
              <div className="w-72 shrink-0 border-l border-gray-200 bg-white flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      Available
                    </h3>
                    <span className="text-xs text-gray-400">
                      {(() => {
                        const availableParticipants = participants.filter((p) => {
                          if (castSlots.some(s => s.assignedParticipantId === p.id)) return false
                          if (demographicFilters.gender !== "all" && p.gender?.toLowerCase() !== demographicFilters.gender) return false
                          if (demographicFilters.stage !== "all" && p.stage !== demographicFilters.stage) return false
                          if (demographicFilters.ageRange !== "all") {
                            const [min, max] = demographicFilters.ageRange === "46+" ? [46, 999] : demographicFilters.ageRange.split("-").map(Number)
                            if (p.age < min || p.age > max) return false
                          }
                          if (castMixSearchQuery) {
                            const query = castMixSearchQuery.toLowerCase()
                            if (!p.name.toLowerCase().includes(query) && 
                                !p.location.toLowerCase().includes(query) && 
                                !p.occupation.toLowerCase().includes(query) &&
                                !p.archetype.some(a => a.toLowerCase().includes(query))) return false
                          }
                          return true
                        })
                        return availableParticipants.length
                      })()}
                    </span>
                  </div>
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={castMixSearchQuery}
                      onChange={(e) => setCastMixSearchQuery(e.target.value)}
                      placeholder="Search participants..."
                      className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                    />
                    {castMixSearchQuery && (
                      <button
                        onClick={() => setCastMixSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5">Drag cards to slots</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {(() => {
                    const availableParticipants = participants.filter((p) => {
                      if (castSlots.some(s => s.assignedParticipantId === p.id)) return false
                      if (demographicFilters.gender !== "all" && p.gender?.toLowerCase() !== demographicFilters.gender) return false
                      if (demographicFilters.stage !== "all" && p.stage !== demographicFilters.stage) return false
                      if (demographicFilters.ageRange !== "all") {
                        const [min, max] = demographicFilters.ageRange === "46+" ? [46, 999] : demographicFilters.ageRange.split("-").map(Number)
                        if (p.age < min || p.age > max) return false
                      }
                      if (castMixSearchQuery) {
                        const query = castMixSearchQuery.toLowerCase()
                        if (!p.name.toLowerCase().includes(query) && 
                            !p.location.toLowerCase().includes(query) && 
                            !p.occupation.toLowerCase().includes(query) &&
                            !p.archetype.some(a => a.toLowerCase().includes(query))) return false
                      }
                      return true
                    })
                    return availableParticipants.map((p, index) => {
                      const stage = funnelStages.find(s => s.id === p.stage)
                      return (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={() => handleDragStart(p.id)}
                          onDragEnd={() => { setDraggedParticipant(null); setDragOverStage(null) }}
                          onClick={() => setSelectedParticipant(p)}
                          className={`bg-white rounded-xl border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                            draggedParticipant === p.id ? "opacity-50 scale-95" : ""
                          }`}
                        >
                          <div className="p-3">
                            {/* Index and Stage row */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${stage?.color || "bg-gray-100 text-gray-600"}`}>
                                {stage?.label || "Unknown"}
                              </span>
                            </div>
                            {/* Avatar and name */}
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-[10px]">
                                {p.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-gray-900 truncate">{p.name}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-gray-500">{p.age}y</span>
                                  {p.score && (
                                    <>
                                      <span className="text-gray-300">•</span>
                                      <span className="text-[10px] text-emerald-600 font-medium">{p.score.toFixed(1)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                  {participants.filter((p) => {
                    if (castSlots.some(s => s.assignedParticipantId === p.id)) return false
                    if (demographicFilters.gender !== "all" && p.gender?.toLowerCase() !== demographicFilters.gender) return false
                    if (demographicFilters.stage !== "all" && p.stage !== demographicFilters.stage) return false
                    if (demographicFilters.ageRange !== "all") {
                      const [min, max] = demographicFilters.ageRange === "46+" ? [46, 999] : demographicFilters.ageRange.split("-").map(Number)
                      if (p.age < min || p.age > max) return false
                    }
                    if (castMixSearchQuery) {
                      const query = castMixSearchQuery.toLowerCase()
                      if (!p.name.toLowerCase().includes(query) && 
                          !p.location.toLowerCase().includes(query) && 
                          !p.occupation.toLowerCase().includes(query) &&
                          !p.archetype.some(a => a.toLowerCase().includes(query))) return false
                    }
                    return true
                  }).length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                      <Search className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-400">No participants match</p>
                      {(castMixSearchQuery || demographicFilters.gender !== "all" || demographicFilters.ageRange !== "all" || demographicFilters.stage !== "all") && (
                        <button
                          onClick={() => { setCastMixSearchQuery(""); setDemographicFilters({ gender: "all", ageRange: "all", stage: "all" }) }}
                          className="text-xs text-cyan-600 hover:text-cyan-700 mt-1"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedParticipant && renderParticipantDetail()}
      </div>

      {/* Stats footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span><strong className="text-gray-900">{participants.length}</strong> Total Participants</span>
          <span><strong className="text-amber-600">{participants.filter((p) => p.starred).length}</strong> Starred</span>
          <span><strong className="text-emerald-600">{participants.filter((p) => p.stage === "locked").length}</strong> Locked</span>
          <span><strong className="text-red-600">{participants.filter((p) => p.redFlags && p.redFlags.length > 0).length}</strong> Red Flags</span>
        </div>
        <div className="text-xs text-gray-400">
          Drag cards between columns to move through the funnel
        </div>
      </div>

      {/* Advanced Settings Modal */}
      {showAdvancedSettings && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowAdvancedSettings(false)} />
          <div className="fixed inset-y-4 right-4 w-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-600" />
                Advanced Settings
              </h3>
              <button onClick={() => setShowAdvancedSettings(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Funnel Stages */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Pipeline Stages</h4>
                  <button
                    onClick={() => setShowAddStageForm(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Stage
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-3">Drag to reorder. Inbox cannot be deleted.</p>
                <div className="space-y-2">
                  {funnelStages.map((stage) => {
                    const isInbox = stage.id === "inbox"
                    const participantCount = participantsByStage[stage.id]?.length || 0
                    const isEditing = editingStageId === stage.id
                    const isDragOver = dragOverStageId === stage.id
                    
                    return (
                      <div
                        key={stage.id}
                        draggable={!isEditing}
                        onDragStart={(e) => handleStageDragStart(e, stage.id)}
                        onDragOver={(e) => handleStageDragOver(e, stage.id)}
                        onDragLeave={() => setDragOverStageId(null)}
                        onDrop={() => handleStageDrop(stage.id)}
                        className={`flex items-center gap-2 p-2 bg-gray-50 rounded-lg border transition-all cursor-move ${
                          isDragOver ? "border-cyan-400 bg-cyan-50" : "border-transparent"
                        } ${draggedStageId === stage.id ? "opacity-50" : ""}`}
                      >
                        <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                        
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingStageLabel}
                            onChange={(e) => setEditingStageLabel(e.target.value)}
                            onBlur={() => handleRenameStage(stage.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameStage(stage.id)
                              if (e.key === "Escape") setEditingStageId(null)
                            }}
                            className="flex-1 px-2 py-0.5 text-xs font-semibold border border-cyan-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            autoFocus
                          />
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${stage.color}`}>{stage.label}</span>
                        )}
                        
                        <span className="text-xs text-gray-400 ml-auto">{participantCount}</span>
                        
                        {/* Edit button */}
                        <button
                          onClick={() => {
                            setEditingStageId(stage.id)
                            setEditingStageLabel(stage.label)
                          }}
                          className="p-1 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                          title="Rename stage"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        
                        {/* Delete button - not for inbox */}
                        {!isInbox && (
                          <button
                            onClick={() => handleRemoveStage(stage)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove stage"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        
                        {isInbox && (
                          <span className="text-[10px] text-gray-400 italic">Required</span>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Add stage form */}
                {showAddStageForm && (
                  <div className="mt-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                        placeholder="New stage name..."
                        className="flex-1 px-3 py-1.5 text-sm border border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddStage()
                          if (e.key === "Escape") {
                            setShowAddStageForm(false)
                            setNewStageName("")
                          }
                        }}
                      />
                      <button
                        onClick={handleAddStage}
                        disabled={!newStageName.trim()}
                        className="px-3 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddStageForm(false)
                          setNewStageName("")
                        }}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-advance rules */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Auto-Advance Rules</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                    <span className="text-sm text-gray-600">Auto-advance after phone interview complete</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                    <span className="text-sm text-gray-600">Require background check before Final Mix</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" defaultChecked />
                    <span className="text-sm text-gray-600">Flag participants with social media issues</span>
                  </label>
                </div>
              </div>

              {/* Scoring weights */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Scoring Weights</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">On-Camera Presence</span>
                      <span className="text-gray-900 font-medium">30%</span>
                    </div>
                    <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600" defaultValue={30} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Story Potential</span>
                      <span className="text-gray-900 font-medium">25%</span>
                    </div>
                    <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600" defaultValue={25} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Social Following</span>
                      <span className="text-gray-900 font-medium">20%</span>
                    </div>
                    <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600" defaultValue={20} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Archetype Fit</span>
                      <span className="text-gray-900 font-medium">25%</span>
                    </div>
                    <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600" defaultValue={25} />
                  </div>
                </div>
              </div>

              {/* Notification settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" defaultChecked />
                    <span className="text-sm text-gray-600">Email when new applications arrive</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" defaultChecked />
                    <span className="text-sm text-gray-600">Daily digest of pipeline changes</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                    <span className="text-sm text-gray-600">Alert when background check returns</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setShowAdvancedSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAdvancedSettings(false)}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </>
      )}

      {/* Stage Removal Warning Modal */}
      {stageToRemove && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setStageToRemove(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl z-[60]">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Remove Stage?</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>{participants.filter(p => p.stage === stageToRemove.id).length} participant(s)</strong> are currently in the <strong>"{stageToRemove.label}"</strong> stage. They will be moved to <strong>Inbox</strong>.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStageToRemove(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveStage}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Remove Stage
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Multi-Selection Floating Action Bar */}
      {selectedParticipantIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-4">
            {/* Selection count */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-700">
              <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-sm font-bold">
                {selectedParticipantIds.size}
              </div>
              <span className="text-sm font-medium">
                {selectedParticipantIds.size === 1 ? "Participant" : "Participants"} selected
              </span>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Contact */}
              <button
                onClick={() => setShowContactModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                title="Contact selected participants"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">Contact</span>
              </button>
              
              {/* Move to List */}
              <div className="relative">
                <button
                  onClick={() => setShowMoveToListMenu(!showMoveToListMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  title="Add to list"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span className="text-sm">Add to List</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showMoveToListMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMoveToListMenu(false)} />
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-20">
                      <p className="px-3 py-2 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Add to list</p>
                      {lists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() => moveSelectedToList(list.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-cyan-50 transition-colors"
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${list.color}`} />
                          <span className="flex-1 text-left truncate">{list.name}</span>
                          <Plus className="w-3 h-3 text-gray-400" />
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => { setShowMoveToListMenu(false); setShowAddListModal(true) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cyan-600 hover:bg-cyan-50 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Create new list
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Book Audition */}
              <button
                onClick={() => setShowBookAuditionModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                title="Book audition for selected participants"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Book Audition</span>
              </button>
              
              {/* Remove from current list (only if viewing a list) */}
              {selectedListId && (
                <button
                  onClick={removeSelectedFromCurrentList}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-900/50 text-red-400 transition-colors"
                  title="Remove from this list"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Remove</span>
                </button>
              )}
              
              {/* Select All */}
              <button
                onClick={selectAllVisible}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400"
                title="Select all visible"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
            
            {/* Clear selection */}
            <button
              onClick={clearSelection}
              className="ml-2 p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              title="Clear selection"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowContactModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Contact Participants</h3>
                    <p className="text-sm text-gray-500">{selectedParticipantIds.size} recipient(s)</p>
                  </div>
                </div>
                <button onClick={() => setShowContactModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipients</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200 max-h-24 overflow-y-auto">
                  {Array.from(selectedParticipantIds).map(id => {
                    const p = participants.find(p => p.id === id)
                    return p ? (
                      <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700">
                        {p.name}
                        <button onClick={() => toggleParticipantSelection(id)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  placeholder="Enter subject..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea
                  rows={4}
                  placeholder="Write your message..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <Paperclip className="w-4 h-4" />
                  Attach
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowContactModal(false); clearSelection() }}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Book Audition Modal */}
      {showBookAuditionModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowBookAuditionModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Book Audition</h3>
                    <p className="text-sm text-gray-500">{selectedParticipantIds.size} participant(s)</p>
                  </div>
                </div>
                <button onClick={() => setShowBookAuditionModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Audition Type</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option>In-Person Audition</option>
                  <option>Video Call (Zoom)</option>
                  <option>Self-Tape Submission</option>
                  <option>Phone Interview</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location / Link</label>
                <input
                  type="text"
                  placeholder="Enter location or meeting link..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Add any additional notes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  Send calendar invites to participants
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowBookAuditionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowBookAuditionModal(false); clearSelection() }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Book Audition
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Advance Stage Modal */}
      {showAdvanceStageModal && selectedParticipant && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowAdvanceStageModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl z-[60]">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Advance Participant</h3>
                  <p className="text-sm text-gray-500">Move {selectedParticipant.name} to a new stage</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-3">Current stage: <span className="font-medium">{funnelStages.find(s => s.id === selectedParticipant.stage)?.label}</span></p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {funnelStages.filter(s => s.id !== selectedParticipant.stage).map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => {
                      setParticipants(prev => prev.map(p => 
                        p.id === selectedParticipant.id ? { ...p, stage: stage.id } : p
                      ))
                      setSelectedParticipant({ ...selectedParticipant, stage: stage.id })
                      setShowAdvanceStageModal(false)
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left`}
                  >
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${stage.color}`}>{stage.label}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setShowAdvanceStageModal(false)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && participantToDelete && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => { setShowDeleteConfirmModal(false); setParticipantToDelete(null) }} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl z-[60]">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Participant?</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
                <p className="text-sm text-red-800">
                  You are about to permanently delete <strong>{participantToDelete.name}</strong> from the casting pool. All associated data will be removed.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirmModal(false); setParticipantToDelete(null) }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setParticipants(prev => prev.filter(p => p.id !== participantToDelete.id))
                    if (selectedParticipant?.id === participantToDelete.id) {
                      setSelectedParticipant(null)
                    }
                    setShowDeleteConfirmModal(false)
                    setParticipantToDelete(null)
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Delete Participant
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detailed Scoring Panel */}
      {showScoringPanel && (() => {
        const scoringParticipant = participants.find(p => p.id === showScoringPanel)
        if (!scoringParticipant) return null
        return (
          <>
            <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setShowScoringPanel(null)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-2xl shadow-2xl z-[60] max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                      <Gauge className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Score {scoringParticipant.name}</h3>
                      <p className="text-sm text-gray-500">Rate each evaluation parameter</p>
                    </div>
                  </div>
                  <button onClick={() => setShowScoringPanel(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Scoring content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {SCORING_PARAMETERS.map((param) => {
                  const currentScore = getDetailedScore(scoringParticipant.id, param.id)
                  return (
                    <div key={param.id} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-600">{getScoreIcon(param.icon)}</span>
                          <span className="text-sm font-semibold text-gray-800">{param.name}</span>
                        </div>
                        <span className={`text-lg font-bold ${currentScore > 0 ? "text-emerald-600" : "text-gray-300"}`}>
                          {currentScore > 0 ? currentScore.toFixed(0) : "—"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{param.description}</p>
                      
                      {/* Score slider with numbered buttons */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                          <button
                            key={value}
                            onClick={() => updateDetailedScore(scoringParticipant.id, param.id, value)}
                            className={`flex-1 h-8 rounded-md text-xs font-semibold transition-all ${
                              currentScore === value
                                ? "bg-emerald-500 text-white shadow-md scale-105"
                                : currentScore > 0 && value <= currentScore
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                      
                      {/* Progress bar visualization */}
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300 rounded-full"
                          style={{ width: `${currentScore * 10}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Footer with average */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{getScoredParameterCount(scoringParticipant.id)}</span>
                      <span className="text-gray-400"> of {SCORING_PARAMETERS.length} scored</span>
                    </div>
                    {getScoredParameterCount(scoringParticipant.id) > 0 && (
                      <button
                        onClick={() => {
                          setParticipantDetailedScores(prev => {
                            const newScores = { ...prev }
                            delete newScores[scoringParticipant.id]
                            return newScores
                          })
                          updateParticipantScore(scoringParticipant.id, 0)
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Reset all
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Average Score:</span>
                    <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl ${
                      getAverageDetailedScore(scoringParticipant.id) 
                        ? "bg-emerald-100" 
                        : "bg-gray-100"
                    }`}>
                      <BarChart3 className={`w-5 h-5 ${
                        getAverageDetailedScore(scoringParticipant.id) 
                          ? "text-emerald-600" 
                          : "text-gray-400"
                      }`} />
                      <span className={`text-xl font-bold ${
                        getAverageDetailedScore(scoringParticipant.id) 
                          ? "text-emerald-700" 
                          : "text-gray-400"
                      }`}>
                        {getAverageDetailedScore(scoringParticipant.id)?.toFixed(1) || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      })()}

      {/* Player View Modal */}
      {showPlayerView && currentPlayerParticipant && (
        <>
          <div className="fixed inset-0 bg-black/80 z-[70]" onClick={() => setShowPlayerView(false)} />
          <div className="fixed inset-4 z-[70] flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-cyan-50 to-white">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowPlayerView(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Play className="w-5 h-5 text-cyan-600" />
                      Player View
                    </h2>
                    <p className="text-xs text-gray-500">
                      {playerViewIndex + 1} of {playerViewParticipants.length} participants
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Progress indicator */}
                  <div className="flex items-center gap-1">
                    {playerViewParticipants.slice(Math.max(0, playerViewIndex - 2), Math.min(playerViewParticipants.length, playerViewIndex + 3)).map((p, i) => {
                      const actualIndex = Math.max(0, playerViewIndex - 2) + i
                      const vote = participantVotes[p.id]
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPlayerViewIndex(actualIndex)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            actualIndex === playerViewIndex 
                              ? "w-6 bg-cyan-600" 
                              : vote === "yes" ? "bg-emerald-500"
                              : vote === "no" ? "bg-red-500"
                              : vote === "maybe" ? "bg-amber-500"
                              : "bg-gray-300 hover:bg-gray-400"
                          }`}
                        />
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setShowPlayerView(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Main content */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left side - Participant info */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex gap-6">
                      {/* Photo */}
                      <div className="shrink-0">
                        <div className="w-48 h-56 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center overflow-hidden">
                          {currentPlayerParticipant.photo ? (
                            <img src={currentPlayerParticipant.photo} alt={currentPlayerParticipant.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-5xl font-bold text-cyan-600">
                              {currentPlayerParticipant.name.split(" ").map(n => n[0]).join("")}
                            </span>
                          )}
                        </div>
                        {/* Stage badge */}
                        <div className="mt-3">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${funnelStages.find(s => s.id === currentPlayerParticipant.stage)?.color || "bg-gray-100 text-gray-600"}`}>
                            {funnelStages.find(s => s.id === currentPlayerParticipant.stage)?.label || "Unknown"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">{currentPlayerParticipant.name}</h3>
                            <p className="text-gray-500">{currentPlayerParticipant.age} years old • {currentPlayerParticipant.location}</p>
                          </div>
                          {currentPlayerParticipant.score && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 rounded-lg">
                              <BarChart3 className="w-4 h-4 text-emerald-600" />
                              <span className="text-lg font-bold text-emerald-700">{currentPlayerParticipant.score.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">{currentPlayerParticipant.occupation}</p>
                        
                        {/* Archetypes */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {currentPlayerParticipant.archetype.map((arch) => (
                            <span key={arch} className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                              {arch}
                            </span>
                          ))}
                        </div>
                        
                        {/* Social handles */}
                        {currentPlayerParticipant.socialHandles.instagram && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Instagram className="w-4 h-4" />
                            <span>{currentPlayerParticipant.socialHandles.instagram}</span>
                            {currentPlayerParticipant.socialHandles.followerCount && (
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                {(currentPlayerParticipant.socialHandles.followerCount / 1000).toFixed(0)}K followers
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Notes */}
                        {currentPlayerParticipant.notes && (
                          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm text-amber-800">{currentPlayerParticipant.notes}</p>
                          </div>
                        )}
                        
                        {/* Red flags */}
                        {currentPlayerParticipant.redFlags && currentPlayerParticipant.redFlags.length > 0 && (
                          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center gap-2 text-red-700 text-xs font-semibold mb-1">
                              <Flag className="w-3 h-3" />
                              Red Flag
                            </div>
                            <p className="text-sm text-red-700">{currentPlayerParticipant.redFlags[0].note}</p>
                          </div>
                        )}
                        
                        {/* Videos */}
                        {currentPlayerParticipant.videos && currentPlayerParticipant.videos.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Videos</h4>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {currentPlayerParticipant.videos.map((video) => (
                                <div key={video.id} className="shrink-0 w-32 h-20 rounded-lg bg-gray-100 flex items-center justify-center relative group cursor-pointer hover:ring-2 hover:ring-cyan-400">
                                  <Play className="w-6 h-6 text-gray-400" />
                                  {video.isPasswordProtected && (
                                    <div className="absolute top-1 right-1 p-0.5 bg-amber-500 rounded">
                                      <Lock className="w-2.5 h-2.5 text-white" />
                                    </div>
                                  )}
                                  <div className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 bg-black/60 rounded-b-lg">
                                    <p className="text-[9px] text-white truncate">{video.title}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Voting bar */}
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => handleParticipantVote("no")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                          participantVotes[currentPlayerParticipant.id] === "no"
                            ? "bg-red-600 text-white shadow-lg scale-105"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        <ThumbsDown className="w-5 h-5" />
                        No
                      </button>
                      <button
                        onClick={() => handleParticipantVote("maybe")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                          participantVotes[currentPlayerParticipant.id] === "maybe"
                            ? "bg-amber-500 text-white shadow-lg scale-105"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        }`}
                      >
                        <HelpCircle className="w-5 h-5" />
                        Maybe
                      </button>
                      <button
                        onClick={() => handleParticipantVote("yes")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                          participantVotes[currentPlayerParticipant.id] === "yes"
                            ? "bg-emerald-600 text-white shadow-lg scale-105"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                      >
                        <ThumbsUp className="w-5 h-5" />
                        Yes
                      </button>
                    </div>
                    
                    {/* Navigation */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <button
                        onClick={() => setPlayerViewIndex(0)}
                        disabled={playerViewIndex === 0}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <SkipBack className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigatePlayer(-1)}
                        disabled={playerViewIndex === 0}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <span className="text-sm text-gray-400 px-4">
                        {playerViewIndex + 1} / {playerViewParticipants.length}
                      </span>
                      <button
                        onClick={() => navigatePlayer(1)}
                        disabled={playerViewIndex >= playerViewParticipants.length - 1}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPlayerViewIndex(playerViewParticipants.length - 1)}
                        disabled={playerViewIndex >= playerViewParticipants.length - 1}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <SkipForward className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Comments */}
                <div className="w-80 border-l border-gray-200 flex flex-col bg-gray-50">
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      Comments
                      {(participantComments[currentPlayerParticipant.id]?.length || 0) > 0 && (
                        <span className="ml-auto text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">
                          {participantComments[currentPlayerParticipant.id]?.length}
                        </span>
                      )}
                    </h4>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {(!participantComments[currentPlayerParticipant.id] || participantComments[currentPlayerParticipant.id].length === 0) ? (
                      <div className="text-center py-8 text-gray-400">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No comments yet</p>
                        <p className="text-xs">Add a note about this participant</p>
                      </div>
                    ) : (
                      participantComments[currentPlayerParticipant.id].map((comment) => (
                        <div key={comment.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 group">
                          <p className="text-sm text-gray-700">{comment.text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-gray-400">
                              {new Date(comment.timestamp).toLocaleString()}
                            </span>
                            <button
                              onClick={() => deleteParticipantComment(currentPlayerParticipant.id, comment.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addParticipantComment() }}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <button
                        onClick={addParticipantComment}
                        disabled={!newComment.trim()}
                        className="px-3 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Maybe comment prompt */}
          {showMaybeCommentPrompt && (
            <>
              <div className="fixed inset-0 bg-black/30 z-[80]" onClick={() => setShowMaybeCommentPrompt(false)} />
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[80] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Add a Note</h3>
                    <p className="text-sm text-gray-500">Why are you unsure about this participant?</p>
                  </div>
                </div>
                <textarea
                  value={maybeCommentText}
                  onChange={(e) => setMaybeCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none mb-4"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowMaybeCommentPrompt(false); setMaybeCommentText("") }}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMaybeVoteWithComment}
                    disabled={!maybeCommentText.trim()}
                    className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Vote Maybe
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Video Add/Edit Modal */}
      {showVideoModal && (
      <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowVideoModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-[60] max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Film className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {editingVideo ? "Edit Video" : "Add Video"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {editingVideo ? "Update video details" : "Add a video to this participant"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowVideoModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Video URL *</label>
                <input
                  type="url"
                  value={videoForm.url}
                  onChange={(e) => setVideoForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://vimeo.com/... or https://youtube.com/..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {videoForm.url && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Detected platform: <span className="font-medium capitalize">{detectVideoPlatform(videoForm.url)}</span>
                  </p>
                )}
              </div>
              
              {/* Video Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter video title..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoForm.tagInput}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, tagInput: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVideoTag() } }}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={addVideoTag}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {videoForm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {videoForm.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 rounded-lg text-xs">
                        {tag}
                        <button onClick={() => removeVideoTag(tag)} className="text-cyan-500 hover:text-cyan-700">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Crop Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={videoForm.enableCrop}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, enableCrop: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <Scissors className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Enable video cropping</span>
                </label>
                {videoForm.enableCrop && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Start time (seconds)</label>
                      <input
                        type="number"
                        min="0"
                        value={videoForm.cropStart}
                        onChange={(e) => setVideoForm(prev => ({ ...prev, cropStart: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">End time (seconds)</label>
                      <input
                        type="number"
                        min="0"
                        value={videoForm.cropEnd}
                        onChange={(e) => setVideoForm(prev => ({ ...prev, cropEnd: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Password Protection */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={videoForm.isPasswordProtected}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, isPasswordProtected: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-gray-700">Password protection</span>
                </label>
                {videoForm.isPasswordProtected && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Video password</label>
                    <div className="relative">
                      <input
                        type={showPasswordFor === "form" ? "text" : "password"}
                        value={videoForm.password}
                        onChange={(e) => setVideoForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter password for this video"
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordFor(showPasswordFor === "form" ? null : "form")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswordFor === "form" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      This password will be required to view the video
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex gap-2 shrink-0">
              <button
                onClick={() => setShowVideoModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveVideo}
                disabled={!videoForm.url || !videoForm.title}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingVideo ? "Save Changes" : "Add Video"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Contacts Modal */}
      {showContactsModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowContactsModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-2xl shadow-2xl z-[60] max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Inbox className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Contacts & Communications</h3>
                    <p className="text-sm text-gray-500">Manage all participant communications</p>
                  </div>
                </div>
                <button onClick={() => setShowContactsModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-1 mt-4 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setContactsActiveTab("inbox")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    contactsActiveTab === "inbox" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  Inbox
                  {getUnreadMessageCount() > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                      {getUnreadMessageCount()}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setContactsActiveTab("all")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    contactsActiveTab === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  All Contacts
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Participant list */}
              <div className="w-72 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {contactsActiveTab === "inbox" ? (
                    // Show participants with messages
                    [...new Set(participantMessages.map(m => m.participantId))].map((participantId) => {
                      const participant = participants.find(p => p.id === participantId)
                      if (!participant) return null
                      const messages = getMessagesForParticipant(participantId)
                      const unreadCount = messages.filter(m => !m.read && m.direction === "inbound").length
                      const lastMessage = messages[0]
                      
                      return (
                        <button
                          key={participantId}
                          onClick={() => { setSelectedMessageParticipant(participantId); messages.filter(m => !m.read).forEach(m => markMessageAsRead(m.id)) }}
                          className={`w-full p-3 text-left hover:bg-white border-b border-gray-100 transition-colors ${
                            selectedMessageParticipant === participantId ? "bg-white border-l-2 border-l-blue-500" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0">
                              <span className="text-sm font-semibold text-blue-700">
                                {participant.name.split(" ").map(n => n[0]).join("")}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-sm truncate ${unreadCount > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                                  {participant.name}
                                </span>
                                {unreadCount > 0 && (
                                  <span className="w-5 h-5 flex items-center justify-center bg-blue-500 text-white text-[10px] font-bold rounded-full">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>
                              {lastMessage && (
                                <p className={`text-xs truncate mt-0.5 ${unreadCount > 0 ? "text-gray-700" : "text-gray-500"}`}>
                                  {lastMessage.direction === "outbound" ? "You: " : ""}{lastMessage.content.substring(0, 40)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    // Show all participants
                    participants.map((participant) => (
                      <button
                        key={participant.id}
                        onClick={() => setSelectedMessageParticipant(participant.id)}
                        className={`w-full p-3 text-left hover:bg-white border-b border-gray-100 transition-colors ${
                          selectedMessageParticipant === participant.id ? "bg-white border-l-2 border-l-blue-500" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-gray-600">
                              {participant.name.split(" ").map(n => n[0]).join("")}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-700 truncate block">{participant.name}</span>
                            <span className="text-xs text-gray-500">{participant.email || "No email"}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
              
              {/* Message thread */}
              <div className="flex-1 flex flex-col bg-white">
                {selectedMessageParticipant ? (
                  <>
                    {/* Participant header */}
                    {(() => {
                      const participant = participants.find(p => p.id === selectedMessageParticipant)
                      if (!participant) return null
                      return (
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-700">
                                {participant.name.split(" ").map(n => n[0]).join("")}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">{participant.name}</h4>
                              <p className="text-xs text-gray-500">{participant.email || participant.phone || "No contact info"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Call">
                              <Phone className="w-4 h-4" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Email">
                              <Mail className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                    
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {getMessagesForParticipant(selectedMessageParticipant).reverse().map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                              message.direction === "outbound"
                                ? "bg-blue-600 text-white rounded-br-md"
                                : "bg-gray-100 text-gray-900 rounded-bl-md"
                            }`}
                          >
                            {message.subject && (
                              <p className={`text-xs font-semibold mb-1 ${message.direction === "outbound" ? "text-blue-100" : "text-gray-500"}`}>
                                {message.subject}
                              </p>
                            )}
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-[10px] mt-1 ${message.direction === "outbound" ? "text-blue-200" : "text-gray-400"}`}>
                              {new Date(message.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Compose */}
                    <div className="p-4 border-t border-gray-100">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessageContent}
                          onChange={(e) => setNewMessageContent(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && selectedMessageParticipant) sendMessage(selectedMessageParticipant) }}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => selectedMessageParticipant && sendMessage(selectedMessageParticipant)}
                          disabled={!newMessageContent.trim()}
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div>
                      <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">Select a contact</p>
                      <p className="text-sm text-gray-400">Choose a participant to view conversation</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Auditions Modal */}
      {showAuditionsModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowAuditionsModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-2xl shadow-2xl z-[60] max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-white shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Audition Bookings</h3>
                    <p className="text-sm text-gray-500">Schedule and manage participant auditions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBookAuditionForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Book Audition
                  </button>
                  <button onClick={() => setShowAuditionsModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-1 mt-4 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setAuditionsActiveTab("upcoming")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    auditionsActiveTab === "upcoming" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Upcoming
                  <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-[10px] font-bold rounded-full">
                    {getUpcomingAuditionsCount()}
                  </span>
                </button>
                <button
                  onClick={() => setAuditionsActiveTab("past")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    auditionsActiveTab === "past" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Completed
                </button>
                <button
                  onClick={() => setAuditionsActiveTab("all")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    auditionsActiveTab === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List className="w-4 h-4" />
                  All
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {showBookAuditionForm ? (
                // Book audition form
                <div className="max-w-lg mx-auto">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Schedule New Audition</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Participant *</label>
                      <select
                        value={newAuditionForm.participantId}
                        onChange={(e) => setNewAuditionForm(prev => ({ ...prev, participantId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="">Select participant...</option>
                        {participants.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                        <input
                          type="date"
                          value={newAuditionForm.date}
                          onChange={(e) => setNewAuditionForm(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Time *</label>
                        <input
                          type="time"
                          value={newAuditionForm.time}
                          onChange={(e) => setNewAuditionForm(prev => ({ ...prev, time: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes)</label>
                        <select
                          value={newAuditionForm.duration}
                          onChange={(e) => setNewAuditionForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={45}>45 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={90}>1.5 hours</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                        <select
                          value={newAuditionForm.type}
                          onChange={(e) => setNewAuditionForm(prev => ({ ...prev, type: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="in-person">In-Person</option>
                          <option value="virtual">Virtual</option>
                          <option value="self-tape">Self-Tape</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                      <input
                        type="text"
                        value={newAuditionForm.location}
                        onChange={(e) => setNewAuditionForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder={newAuditionForm.type === "virtual" ? "Zoom, Google Meet, etc." : "Studio name, address..."}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    
                    {newAuditionForm.type === "virtual" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Meeting Link</label>
                        <input
                          type="url"
                          value={newAuditionForm.meetingLink}
                          onChange={(e) => setNewAuditionForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                          placeholder="https://zoom.us/j/..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                      <textarea
                        value={newAuditionForm.notes}
                        onChange={(e) => setNewAuditionForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any special instructions or notes..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setShowBookAuditionForm(false)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBookAudition}
                        disabled={!newAuditionForm.participantId || !newAuditionForm.date || !newAuditionForm.time}
                        className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Book Audition
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Audition list
                <div className="space-y-3">
                  {auditionBookings
                    .filter(a => {
                      if (auditionsActiveTab === "upcoming") return a.status === "scheduled" && a.scheduledDate > Date.now()
                      if (auditionsActiveTab === "past") return a.status === "completed" || a.scheduledDate < Date.now()
                      return true
                    })
                    .sort((a, b) => auditionsActiveTab === "past" ? b.scheduledDate - a.scheduledDate : a.scheduledDate - b.scheduledDate)
                    .map((audition) => {
                      const participant = participants.find(p => p.id === audition.participantId)
                      if (!participant) return null
                      
                      return (
                        <div
                          key={audition.id}
                          className={`p-4 rounded-xl border ${
                            audition.status === "cancelled" ? "bg-gray-50 border-gray-200 opacity-60" :
                            audition.status === "completed" ? "bg-emerald-50 border-emerald-200" :
                            audition.status === "no-show" ? "bg-red-50 border-red-200" :
                            "bg-white border-gray-200 hover:border-cyan-200"
                          } transition-colors`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-cyan-700">
                                  {participant.name.split(" ").map(n => n[0]).join("")}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">{participant.name}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(audition.scheduledDate).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {new Date(audition.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {audition.location}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    audition.type === "in-person" ? "bg-purple-100 text-purple-700" :
                                    audition.type === "virtual" ? "bg-blue-100 text-blue-700" :
                                    "bg-amber-100 text-amber-700"
                                  }`}>
                                    {audition.type === "in-person" ? "In-Person" : audition.type === "virtual" ? "Virtual" : "Self-Tape"}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    audition.status === "scheduled" ? "bg-cyan-100 text-cyan-700" :
                                    audition.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                                    audition.status === "cancelled" ? "bg-gray-100 text-gray-600" :
                                    "bg-red-100 text-red-700"
                                  }`}>
                                    {audition.status.charAt(0).toUpperCase() + audition.status.slice(1)}
                                  </span>
                                  <span className="text-[10px] text-gray-400">{audition.duration} min</span>
                                </div>
                              </div>
                            </div>
                            
                            {audition.status === "scheduled" && (
                              <div className="flex items-center gap-1">
                                {audition.meetingLink && (
                                  <a
                                    href={audition.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                                    title="Join meeting"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                                <button
                                  onClick={() => updateAuditionStatus(audition.id, "completed")}
                                  className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600"
                                  title="Mark as completed"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => cancelAudition(audition.id)}
                                  className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                                  title="Cancel audition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  
                  {auditionBookings.filter(a => {
                    if (auditionsActiveTab === "upcoming") return a.status === "scheduled" && a.scheduledDate > Date.now()
                    if (auditionsActiveTab === "past") return a.status === "completed" || a.scheduledDate < Date.now()
                    return true
                  }).length === 0 && (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No auditions found</p>
                      <p className="text-sm text-gray-400">
                        {auditionsActiveTab === "upcoming" ? "Schedule a new audition to get started" : "No auditions in this category"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Participant Modal */}
      {showAddParticipantModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => { setShowAddParticipantModal(false); resetNewParticipantForm() }} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-[60] max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 shrink-0 bg-gradient-to-r from-cyan-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Add Participant</h3>
                    <p className="text-sm text-gray-500">Manually add to Casting for TV</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowAddParticipantModal(false); resetNewParticipantForm() }} 
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Name - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newParticipantForm.name}
                  onChange={(e) => setNewParticipantForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter participant's name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  autoFocus
                />
              </div>
              
              {/* Age and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
                  <input
                    type="number"
                    value={newParticipantForm.age}
                    onChange={(e) => setNewParticipantForm(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="25"
                    min="18"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={newParticipantForm.location}
                    onChange={(e) => setNewParticipantForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, State"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              
              {/* Occupation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Occupation / Role</label>
                <input
                  type="text"
                  value={newParticipantForm.occupation}
                  onChange={(e) => setNewParticipantForm(prev => ({ ...prev, occupation: e.target.value }))}
                  placeholder="What do they do?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              {/* Contact Info */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={newParticipantForm.email}
                      onChange={(e) => setNewParticipantForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={newParticipantForm.phone}
                      onChange={(e) => setNewParticipantForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Social */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram Handle</label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={newParticipantForm.instagram}
                    onChange={(e) => setNewParticipantForm(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="@username"
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              
              {/* Archetypes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Archetypes</label>
                <div className="flex flex-wrap gap-2">
                  {availableArchetypes.map((arch) => (
                    <button
                      key={arch}
                      type="button"
                      onClick={() => {
                        setNewParticipantForm(prev => ({
                          ...prev,
                          archetype: prev.archetype.includes(arch)
                            ? prev.archetype.filter(a => a !== arch)
                            : [...prev.archetype, arch]
                        }))
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        newParticipantForm.archetype.includes(arch)
                          ? "bg-cyan-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-cyan-50 hover:text-cyan-700"
                      }`}
                    >
                      {arch}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={newParticipantForm.notes}
                  onChange={(e) => setNewParticipantForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes about this participant..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                Will be marked as manually added
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddParticipantModal(false); resetNewParticipantForm() }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddParticipant}
                  disabled={!newParticipantForm.name.trim()}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Participant
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add New List Modal */}
      {showAddListModal && (
      <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowAddListModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyan-600" />
                Create New List
              </h3>
              <button onClick={() => setShowAddListModal(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Final Candidates"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Brief description of this list..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {["bg-cyan-500", "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-amber-500", "bg-red-500", "bg-gray-500"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewListColor(color)}
                      className={`w-8 h-8 rounded-full ${color} transition-transform ${newListColor === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setShowAddListModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddList}
                disabled={!newListName.trim()}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create List
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Participant Modal */}
      {showEditModal && editingParticipant && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowEditModal(false)} />
          <div className="fixed inset-y-4 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[calc(100vh-2rem)]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-600" />
                Edit Participant
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Photo Upload */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Photo
                </h4>
                <div className="flex items-start gap-4">
                  <div 
                    className={`w-24 h-24 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-2xl overflow-hidden cursor-pointer transition-all border-2 border-dashed ${
                      dragOverParticipantId === editingParticipant.id 
                        ? "border-cyan-500 ring-2 ring-cyan-500 ring-offset-2 scale-105" 
                        : "border-transparent hover:border-cyan-300"
                    }`}
                    onDragOver={(e) => handleImageDragOver(e, editingParticipant.id)}
                    onDragLeave={handleImageDragLeave}
                    onDrop={(e) => handleImageDrop(e, editingParticipant.id)}
                    onClick={() => fileInputRef.current?.click()}
                    title="Click or drop image to add photo"
                  >
                    {dragOverParticipantId === editingParticipant.id ? (
                      <ImagePlus className="w-8 h-8 text-cyan-600 animate-pulse" />
                    ) : isValidImageUrl(editingParticipant.photo) ? (
                      <img src={editingParticipant.photo} alt={editingParticipant.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <ImagePlus className="w-6 h-6 mx-auto mb-1 text-cyan-400" />
                        <span className="text-xs text-cyan-500">Add Photo</span>
                      </div>
                    )}
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileInputChange}
                    className="hidden" 
                  />
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-gray-500">
                      Drag and drop an image or click the photo area to upload.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
                      >
                        Choose File
                      </button>
                      {editingParticipant.photo && (
                        <button
                          type="button"
                          onClick={() => removePhoto(editingParticipant.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingParticipant.name}
                    onChange={(e) => setEditingParticipant({ ...editingParticipant, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={editingParticipant.age}
                    onChange={(e) => setEditingParticipant({ ...editingParticipant, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editingParticipant.location}
                    onChange={(e) => setEditingParticipant({ ...editingParticipant, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={editingParticipant.occupation}
                    onChange={(e) => setEditingParticipant({ ...editingParticipant, occupation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={editingParticipant.email || ""}
                      onChange={(e) => setEditingParticipant({ ...editingParticipant, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editingParticipant.phone || ""}
                      onChange={(e) => setEditingParticipant({ ...editingParticipant, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Archetypes */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Archetypes
                </h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editingParticipant.archetype.map((arch) => (
                    <span
                      key={arch}
                      className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-medium flex items-center gap-1"
                    >
                      {arch}
                      <button
                        onClick={() => setEditingParticipant({
                          ...editingParticipant,
                          archetype: editingParticipant.archetype.filter((a) => a !== arch)
                        })}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !editingParticipant.archetype.includes(e.target.value)) {
                      setEditingParticipant({
                        ...editingParticipant,
                        archetype: [...editingParticipant.archetype, e.target.value]
                      })
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Add archetype...</option>
                  {customArchetypes.filter((a) => !editingParticipant.archetype.includes(a)).map((arch) => (
                    <option key={arch} value={arch}>{arch}</option>
                  ))}
                </select>
              </div>

              {/* Social Media Links */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Social Media Links
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                    <input
                      type="text"
                      value={editingParticipant.socialHandles.instagram || ""}
                      onChange={(e) => setEditingParticipant({
                        ...editingParticipant,
                        socialHandles: { ...editingParticipant.socialHandles, instagram: e.target.value }
                      })}
                      placeholder="@username"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-gray-800 shrink-0" />
                    <input
                      type="text"
                      value={editingParticipant.socialHandles.tiktok || ""}
                      onChange={(e) => setEditingParticipant({
                        ...editingParticipant,
                        socialHandles: { ...editingParticipant.socialHandles, tiktok: e.target.value }
                      })}
                      placeholder="@username"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-blue-500 shrink-0" />
                    <input
                      type="text"
                      value={editingParticipant.socialHandles.twitter || ""}
                      onChange={(e) => setEditingParticipant({
                        ...editingParticipant,
                        socialHandles: { ...editingParticipant.socialHandles, twitter: e.target.value }
                      })}
                      placeholder="@username"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-600 shrink-0" />
                    <input
                      type="text"
                      value={editingParticipant.socialHandles.youtube || ""}
                      onChange={(e) => setEditingParticipant({
                        ...editingParticipant,
                        socialHandles: { ...editingParticipant.socialHandles, youtube: e.target.value }
                      })}
                      placeholder="https://youtube.com/..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-600 shrink-0" />
                    <input
                      type="text"
                      value={editingParticipant.socialHandles.website || ""}
                      onChange={(e) => setEditingParticipant({
                        ...editingParticipant,
                        socialHandles: { ...editingParticipant.socialHandles, website: e.target.value }
                      })}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500 shrink-0" />
                    <input
                      type="number"
                      value={editingParticipant.socialHandles.followerCount || ""}
                      onChange={(e) => setEditingParticipant({
                        ...editingParticipant,
                        socialHandles: { ...editingParticipant.socialHandles, followerCount: parseInt(e.target.value) || undefined }
                      })}
                      placeholder="Total follower count"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editingParticipant.notes || ""}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, notes: e.target.value })}
                  placeholder="Additional notes about this participant..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2 shrink-0">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateParticipant(editingParticipant)}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </>
      )}

      {/* Embedded CoPilot - Fixed position in lower right corner */}
      <div className="fixed bottom-6 right-6 z-40">
        <EmbeddedCoPilot context="tv-casting" />
      </div>
    </div>
  )
}
