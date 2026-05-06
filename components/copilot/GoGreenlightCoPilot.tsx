"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { 
  Send, X, Loader2, Mic, MicOff, Sparkles, MessageCircle, Lightbulb, 
  Users, Film, Calendar, Search, ArrowRight, User, Clapperboard,
  ChevronRight, ExternalLink, CheckCircle2, ListChecks, BarChart3,
  MapPin, Palette, Shirt, Package, Tv, FileText
} from "lucide-react"
import { Z_INDEX } from "@/utils/zIndex"

// Context types for different modals
type ModalContext = 
  | "default" 
  | "locations" 
  | "props" 
  | "costumes" 
  | "productionDesign" 
  | "castingForTV" 
  | "schedule"
  | "characters"
  | "script"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: number
  actions?: ActionButton[]
  queryType?: QueryType
}

type QueryType = "actors" | "characters" | "auditions" | "project" | "general" | "locations" | "props" | "costumes" | "production" | "schedule"

interface ActionButton {
  label: string
  icon: IconType
  action: string
}

type IconType = "actors" | "characters" | "auditions" | "search" | "navigate" | "confirm" | "locations" | "props" | "costumes" | "production" | "schedule"

interface ContextConfig {
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  prompts: { text: string; icon: IconType }[]
  responses: Record<string, { content: string; queryType: QueryType; actions?: ActionButton[] }>
}

const QUERY_ICONS: Record<IconType, React.ComponentType<{ className?: string }>> = {
  actors: Users,
  characters: Film,
  auditions: Calendar,
  project: Clapperboard,
  general: Sparkles,
  search: Search,
  navigate: ArrowRight,
  confirm: CheckCircle2,
  locations: MapPin,
  props: Package,
  costumes: Shirt,
  production: Palette,
  schedule: Calendar,
}

// Context-specific configurations
const CONTEXT_CONFIGS: Record<ModalContext, ContextConfig> = {
  default: {
    title: "GoGreenlight CoPilot",
    subtitle: "AI Casting Assistant",
    icon: Sparkles,
    prompts: [
      { text: "What characters need casting?", icon: "characters" },
      { text: "Show me actors tagged as 'Lead Potential'", icon: "actors" },
      { text: "How many actors are in the project?", icon: "actors" },
      { text: "What's the status of auditions?", icon: "auditions" },
    ],
    responses: {}
  },
  locations: {
    title: "Location Assistant",
    subtitle: "Scouting & Management",
    icon: MapPin,
    prompts: [
      { text: "Which locations are confirmed?", icon: "locations" },
      { text: "Show me outdoor locations", icon: "search" },
      { text: "What locations need permits?", icon: "locations" },
      { text: "Find alternative locations for Scene 12", icon: "search" },
    ],
    responses: {
      "confirmed": {
        content: "**3 locations** are currently confirmed:\n\n1. **Hero House Exterior** - 123 Oak Street, Pasadena\n   - Permit: Approved\n   - Shoot dates: March 15-17\n\n2. **Downtown Alley** - Arts District, DTLA\n   - Night shoots only\n   - Permit: Pending final approval\n\n3. **City Park** - Griffith Park\n   - Day permits secured",
        queryType: "locations",
        actions: [
          { label: "View on Map", icon: "locations", action: "viewMap" },
          { label: "Export List", icon: "navigate", action: "exportLocations" },
        ]
      },
      "outdoor": {
        content: "Found **5 outdoor locations** in the database:\n\n1. City Park - Large open spaces\n2. Beach Cove - Sunset scenes\n3. Mountain Trail - Episode 4 hiking\n4. Suburban Street - Neighborhood shots\n5. Rooftop Garden - Downtown skyline view",
        queryType: "locations",
        actions: [
          { label: "Filter Further", icon: "search", action: "filterLocations" },
          { label: "Add Location", icon: "confirm", action: "addLocation" },
        ]
      },
      "permits": {
        content: "**Locations requiring permits:**\n\n- Downtown Alley - Street closure needed\n- City Park - Filming permit (pending)\n- Beach Cove - Parks Dept. approval needed\n\n**Tip:** Submit permit applications at least 2 weeks in advance.",
        queryType: "locations",
        actions: [
          { label: "View Permits", icon: "navigate", action: "viewPermits" },
          { label: "Contact Permitting", icon: "confirm", action: "contactPermit" },
        ]
      }
    }
  },
  props: {
    title: "Props Assistant",
    subtitle: "Inventory & Tracking",
    icon: Package,
    prompts: [
      { text: "What props are needed for Scene 5?", icon: "props" },
      { text: "Show me props that need to be sourced", icon: "search" },
      { text: "Which props are on set today?", icon: "props" },
      { text: "Track the vintage telephone prop", icon: "search" },
    ],
    responses: {
      "scene": {
        content: "**Props for Scene 5 (Kitchen Confrontation):**\n\n- Butcher knife (rubber stunt prop)\n- Coffee mug with studio logo\n- Newspaper (dated March 1998)\n- Fruit bowl with apples\n- Wall phone (period accurate)\n\n**Status:** 4/5 sourced, knife pending approval",
        queryType: "props",
        actions: [
          { label: "View Scene Breakdown", icon: "navigate", action: "viewScene" },
          { label: "Update Status", icon: "confirm", action: "updateStatus" },
        ]
      },
      "sourced": {
        content: "**Props needing to be sourced (12 items):**\n\n**High Priority:**\n- Vintage typewriter (1960s)\n- Period-accurate briefcase\n- Custom trophy with engraving\n\n**Standard:**\n- Hospital bed props (3)\n- Office supplies kit\n- Restaurant menus (custom)",
        queryType: "props",
        actions: [
          { label: "Assign to Team", icon: "actors", action: "assignProps" },
          { label: "Find Vendors", icon: "search", action: "findVendors" },
        ]
      }
    }
  },
  costumes: {
    title: "Costume Assistant",
    subtitle: "Wardrobe Management",
    icon: Shirt,
    prompts: [
      { text: "What's the costume status for the lead?", icon: "costumes" },
      { text: "Show me costumes needing alterations", icon: "search" },
      { text: "Which characters need fitting appointments?", icon: "costumes" },
      { text: "Track the red dress from Episode 2", icon: "search" },
    ],
    responses: {
      "lead": {
        content: "**Lead Character (Sarah) Costume Status:**\n\n**Complete:**\n- Business suit (navy) - Scene 1, 4, 7\n- Casual outfit - Scene 2, 8\n- Evening gown (burgundy) - Scene 12\n\n**In Progress:**\n- Distressed version of suit (stunt)\n\n**Fittings:** Next Tuesday, 2 PM",
        queryType: "costumes",
        actions: [
          { label: "View Lookbook", icon: "navigate", action: "viewLookbook" },
          { label: "Schedule Fitting", icon: "schedule", action: "scheduleFitting" },
        ]
      },
      "alterations": {
        content: "**Costumes requiring alterations (7 items):**\n\n1. Marcus's leather jacket - Take in shoulders\n2. Sarah's evening gown - Hem adjustment\n3. Dr. Chen's lab coat - Add custom patches\n4. Young Tommy's school uniform - Let out seams\n5. Period dress #3 - Repair tear on sleeve",
        queryType: "costumes",
        actions: [
          { label: "Assign to Tailor", icon: "actors", action: "assignTailor" },
          { label: "Priority Order", icon: "navigate", action: "priorityOrder" },
        ]
      }
    }
  },
  productionDesign: {
    title: "Production Design",
    subtitle: "Sets & Art Direction",
    icon: Palette,
    prompts: [
      { text: "What sets are under construction?", icon: "production" },
      { text: "Show me the concept art for Episode 3", icon: "search" },
      { text: "Which sets need dressing before Monday?", icon: "production" },
      { text: "Track the budget for the hospital set", icon: "search" },
    ],
    responses: {
      "construction": {
        content: "**Sets Under Construction:**\n\n1. **Hospital Emergency Room**\n   - Progress: 75% complete\n   - Est. completion: Friday\n   - Budget: On track\n\n2. **1950s Diner Interior**\n   - Progress: 40% complete\n   - Note: Awaiting booth cushions\n\n3. **Apartment Living Room**\n   - Progress: 90% complete\n   - Final dressing scheduled",
        queryType: "production",
        actions: [
          { label: "View Timeline", icon: "schedule", action: "viewTimeline" },
          { label: "Photo Updates", icon: "navigate", action: "photoUpdates" },
        ]
      },
      "concept": {
        content: "**Episode 3 Concept Art Available:**\n\n- Underground bunker (3 variations)\n- Abandoned warehouse exterior\n- Secret laboratory\n- Chase scene storyboards\n\n**Approved:** Bunker v2, Warehouse\n**Pending:** Laboratory design",
        queryType: "production",
        actions: [
          { label: "View Gallery", icon: "navigate", action: "viewGallery" },
          { label: "Add Notes", icon: "confirm", action: "addNotes" },
        ]
      }
    }
  },
  castingForTV: {
    title: "TV Casting Assistant",
    subtitle: "Non-Fiction & Reality",
    icon: Tv,
    prompts: [
      { text: "How many participants are shortlisted?", icon: "actors" },
      { text: "Show me participants from LA", icon: "search" },
      { text: "Who has confirmed availability?", icon: "actors" },
      { text: "What's the diversity breakdown?", icon: "search" },
    ],
    responses: {
      "shortlisted": {
        content: "**Participant Shortlist Status:**\n\n**Final Picks:** 8 participants\n**Under Review:** 12 participants\n**Callbacks Scheduled:** 5 participants\n**Awaiting Response:** 3 participants\n\n**Target:** 10 final selections needed",
        queryType: "actors",
        actions: [
          { label: "View Shortlist", icon: "actors", action: "viewShortlist" },
          { label: "Export for Network", icon: "navigate", action: "exportNetwork" },
        ]
      },
      "availability": {
        content: "**Confirmed Availability (for shoot dates):**\n\n**All Dates Clear:** 6 participants\n- Marcus J., Emma R., Sofia L., James T., Chen W., Rosa M.\n\n**Partial Availability:** 4 participants\n**Conflicts:** 2 participants need schedule adjustment",
        queryType: "actors",
        actions: [
          { label: "View Calendar", icon: "schedule", action: "viewCalendar" },
          { label: "Send Reminders", icon: "confirm", action: "sendReminders" },
        ]
      }
    }
  },
  schedule: {
    title: "Schedule Assistant",
    subtitle: "Production Calendar",
    icon: Calendar,
    prompts: [
      { text: "What's on the schedule for this week?", icon: "schedule" },
      { text: "Show me upcoming audition slots", icon: "auditions" },
      { text: "Are there any scheduling conflicts?", icon: "search" },
      { text: "When is the next callback session?", icon: "schedule" },
    ],
    responses: {
      "week": {
        content: "**This Week's Schedule:**\n\n**Monday:** 3 auditions (10am-2pm)\n**Tuesday:** Callbacks - Lead role (all day)\n**Wednesday:** Chemistry reads (afternoon)\n**Thursday:** Network presentation prep\n**Friday:** Final selections meeting\n\n**Total Sessions:** 12",
        queryType: "schedule",
        actions: [
          { label: "View Full Calendar", icon: "schedule", action: "viewCalendar" },
          { label: "Add Session", icon: "confirm", action: "addSession" },
        ]
      },
      "conflicts": {
        content: "**Scheduling Conflicts Detected:**\n\n1. **Tuesday 2PM** - Room double-booked\n   - Callback session vs. Network call\n\n2. **Thursday** - Actor unavailable\n   - Marcus J. has prior commitment\n\n**Recommendation:** Move Network call to 11AM",
        queryType: "schedule",
        actions: [
          { label: "Resolve Conflicts", icon: "navigate", action: "resolveConflicts" },
          { label: "Contact Team", icon: "confirm", action: "contactTeam" },
        ]
      }
    }
  },
  characters: {
    title: "Characters Assistant",
    subtitle: "Role Management",
    icon: Film,
    prompts: [
      { text: "Which characters need casting?", icon: "characters" },
      { text: "Show me lead roles", icon: "search" },
      { text: "What's the status of recurring characters?", icon: "characters" },
      { text: "Add a new character to the breakdown", icon: "confirm" },
    ],
    responses: {}
  },
  script: {
    title: "Script Assistant",
    subtitle: "Breakdown & Analysis",
    icon: FileText,
    prompts: [
      { text: "What scenes are in Episode 1?", icon: "search" },
      { text: "Show me scenes with the lead character", icon: "characters" },
      { text: "Which scenes need the most extras?", icon: "actors" },
      { text: "Analyze character screen time", icon: "search" },
    ],
    responses: {}
  }
}

// Hook to detect current modal context
function useModalContext(): ModalContext {
  const [context, setContext] = useState<ModalContext>("default")

  useEffect(() => {
    // Check for active modals by looking at DOM
    const checkContext = () => {
      // Check for specific modal containers
      if (document.querySelector('[data-modal="locations"]')) return setContext("locations")
      if (document.querySelector('[data-modal="props"]')) return setContext("props")
      if (document.querySelector('[data-modal="costumes"]')) return setContext("costumes")
      if (document.querySelector('[data-modal="productionDesign"]')) return setContext("productionDesign")
      if (document.querySelector('[data-modal="castingForTV"]')) return setContext("castingForTV")
      if (document.querySelector('[data-modal="schedule"]')) return setContext("schedule")
      if (document.querySelector('[data-modal="characters"]')) return setContext("characters")
      if (document.querySelector('[data-modal="script"]')) return setContext("script")
      
      // Fallback: check by class or visible elements
      const modalTexts = document.body.innerText.toLowerCase()
      if (document.querySelector('.locations-modal-open')) return setContext("locations")
      
      setContext("default")
    }

    // Initial check
    checkContext()

    // Set up observer for DOM changes
    const observer = new MutationObserver(checkContext)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return context
}

export default function GoGreenlightCoPilot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const modalContext = useModalContext()
  const contextConfig = CONTEXT_CONFIGS[modalContext]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Reset suggestions when context changes
  useEffect(() => {
    if (messages.length === 0) {
      setShowSuggestions(true)
    }
  }, [modalContext, messages.length])

  const detectQueryType = useCallback((message: string): QueryType => {
    const lower = message.toLowerCase()
    if (lower.includes("location") || lower.includes("venue") || lower.includes("permit")) return "locations"
    if (lower.includes("prop") || lower.includes("item") || lower.includes("object")) return "props"
    if (lower.includes("costume") || lower.includes("wardrobe") || lower.includes("outfit") || lower.includes("fitting")) return "costumes"
    if (lower.includes("set") || lower.includes("production design") || lower.includes("art direction") || lower.includes("concept")) return "production"
    if (lower.includes("schedule") || lower.includes("calendar") || lower.includes("session") || lower.includes("week")) return "schedule"
    if (lower.includes("actor") || lower.includes("cast") || lower.includes("talent") || lower.includes("participant")) return "actors"
    if (lower.includes("character") || lower.includes("role")) return "characters"
    if (lower.includes("audition") || lower.includes("callback")) return "auditions"
    if (lower.includes("project") || lower.includes("status") || lower.includes("progress")) return "project"
    return "general"
  }, [])

  const generateMockResponse = useCallback((userMessage: string): { content: string; actions?: ActionButton[]; queryType: QueryType } => {
    const lowerMessage = userMessage.toLowerCase()
    const queryType = detectQueryType(userMessage)
    
    // Check context-specific responses first
    const contextResponses = contextConfig.responses
    for (const [key, response] of Object.entries(contextResponses)) {
      if (lowerMessage.includes(key)) {
        return response
      }
    }

    // Default responses based on query type
    if (queryType === "locations") {
      return {
        content: "I can help you with location management. Try asking about confirmed locations, permits, or finding alternatives for specific scenes.",
        queryType: "locations",
        actions: [
          { label: "View All Locations", icon: "locations", action: "viewLocations" },
          { label: "Add Location", icon: "confirm", action: "addLocation" },
        ]
      }
    }

    if (queryType === "props") {
      return {
        content: "I can help track props across your production. Ask about props for specific scenes, sourcing status, or inventory management.",
        queryType: "props",
        actions: [
          { label: "View Inventory", icon: "props", action: "viewInventory" },
          { label: "Add Prop", icon: "confirm", action: "addProp" },
        ]
      }
    }

    if (queryType === "costumes") {
      return {
        content: "I can assist with wardrobe management. Ask about costume status for specific characters, fittings, or alterations needed.",
        queryType: "costumes",
        actions: [
          { label: "View Lookbook", icon: "costumes", action: "viewLookbook" },
          { label: "Schedule Fitting", icon: "schedule", action: "scheduleFitting" },
        ]
      }
    }

    if (queryType === "production") {
      return {
        content: "I can help with production design tracking. Ask about set construction status, concept art, or budget tracking.",
        queryType: "production",
        actions: [
          { label: "View Sets", icon: "production", action: "viewSets" },
          { label: "Budget Report", icon: "navigate", action: "budgetReport" },
        ]
      }
    }

    if (queryType === "schedule") {
      return {
        content: "I can help manage your production calendar. Ask about weekly schedules, conflicts, or upcoming sessions.",
        queryType: "schedule",
        actions: [
          { label: "View Calendar", icon: "schedule", action: "viewCalendar" },
          { label: "Add Session", icon: "confirm", action: "addSession" },
        ]
      }
    }

    // Casting-related responses
    if (lowerMessage.includes("character") && (lowerMessage.includes("need") || lowerMessage.includes("casting"))) {
      return {
        content: "I found **5 characters** that still need casting:\n\n1. **Detective Sarah** - Lead role, dramatic presence required\n2. **Dr. Marcus** - Supporting, medical professional\n3. **Young Tommy** - Child actor, ages 8-12\n4. **Mayor Chen** - Recurring, authority figure\n5. **Mysterious Stranger** - Guest role, Episode 3",
        queryType: "characters",
        actions: [
          { label: "View Characters", icon: "characters", action: "openCharacters" },
          { label: "Find Matching Actors", icon: "search", action: "searchActors" },
        ]
      }
    }

    if (lowerMessage.includes("actor") && (lowerMessage.includes("how many") || lowerMessage.includes("count"))) {
      return {
        content: "The current project has **47 actors** in the database:\n\n- 12 marked as 'Lead Potential'\n- 18 in 'Under Consideration'\n- 8 with confirmed audition slots\n- 9 in the general pool",
        queryType: "actors",
        actions: [
          { label: "View All Actors", icon: "actors", action: "openActors" },
          { label: "Filter by Status", icon: "search", action: "filterActors" },
        ]
      }
    }

    if (lowerMessage.includes("help") || lowerMessage.includes("what can you do")) {
      return {
        content: `I'm your ${contextConfig.title}! I can help with:\n\n${
          modalContext === "default" 
            ? "**Casting**\n- Find and filter actors\n- Manage character roles\n- Track casting progress\n\n**Scheduling**\n- View audition calendar\n- Check session status"
            : `**${contextConfig.subtitle}**\n- Answer questions about your current workspace\n- Help track items and status\n- Provide quick navigation`
        }`,
        queryType: "general",
        actions: contextConfig.prompts.slice(0, 2).map((p, i) => ({
          label: p.text.slice(0, 20) + "...",
          icon: p.icon,
          action: `prompt-${i}`
        }))
      }
    }

    return {
      content: `I understand you're asking about: "${userMessage}"\n\nI can help with ${contextConfig.subtitle.toLowerCase()}. Could you provide more details or try one of the suggested prompts?`,
      queryType: "general",
      actions: [
        { label: "Show Options", icon: "search", action: "showOptions" },
      ]
    }
  }, [modalContext, contextConfig, detectQueryType])

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim()
    if (!text || isProcessing) return

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      type: "user",
      content: text,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsProcessing(true)
    setShowSuggestions(false)

    setTimeout(() => {
      const response = generateMockResponse(text)
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        type: "assistant",
        content: response.content,
        timestamp: Date.now(),
        actions: response.actions,
        queryType: response.queryType,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsProcessing(false)
    }, 600 + Math.random() * 600)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleVoiceInput = () => {
    setIsListening(!isListening)
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false)
        const samplePrompt = contextConfig.prompts[0]?.text || "Show me the current status"
        setInputValue(samplePrompt)
      }, 2000)
    }
  }

  const handleActionClick = (action: string) => {
    // Handle prompt shortcuts
    if (action.startsWith("prompt-")) {
      const index = parseInt(action.split("-")[1])
      const prompt = contextConfig.prompts[index]
      if (prompt) handleSendMessage(prompt.text)
      return
    }
    // In real app, dispatch to app state or open modals
  }

  const QueryIcon = ({ type }: { type: IconType }) => {
    const Icon = QUERY_ICONS[type] || Sparkles
    return <Icon className="w-3.5 h-3.5" />
  }

  const ActionButtonComponent = ({ action }: { action: ActionButton }) => {
    const Icon = QUERY_ICONS[action.icon] || ArrowRight
    return (
      <button
        onClick={() => handleActionClick(action.action)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-success-100 text-success-700 rounded-lg hover:bg-success-200 transition-colors"
      >
        <Icon className="w-3 h-3" />
        {action.label}
        <ChevronRight className="w-3 h-3 opacity-60" />
      </button>
    )
  }

  const ContextIcon = contextConfig.icon

  return (
    <>
      {/* Floating CoPilot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isOpen
            ? "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
            : "bg-success-600 text-white hover:bg-success-500 hover:scale-110 hover:shadow-xl"
        }`}
        style={{ zIndex: Z_INDEX.COPILOT }}
        title={isOpen ? "Close CoPilot" : `Open ${contextConfig.title}`}
        aria-label={isOpen ? "Close CoPilot" : `Open ${contextConfig.title}`}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <ContextIcon className="w-6 h-6" />
        )}
      </button>

      {/* CoPilot Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-[380px] max-h-[560px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ zIndex: Z_INDEX.COPILOT }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-success-600 to-success-500 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <ContextIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{contextConfig.title}</h3>
                <p className="text-xs text-white/70">{contextConfig.subtitle}</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setShowSuggestions(true) }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                title="Clear chat"
              >
                <ListChecks className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[280px] max-h-[360px] bg-muted/20">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-2">
                <div className="w-14 h-14 rounded-full bg-success-100 flex items-center justify-center mb-3">
                  <MessageCircle className="w-7 h-7 text-success-600" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">How can I help?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {modalContext === "default" 
                    ? "Ask about actors, characters, or auditions"
                    : `Ask about ${contextConfig.subtitle.toLowerCase()}`
                  }
                </p>
                
                {showSuggestions && (
                  <div className="w-full space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center mb-2">
                      <Lightbulb className="w-3 h-3" />
                      Try asking:
                    </p>
                    {contextConfig.prompts.map((prompt, index) => {
                      const Icon = QUERY_ICONS[prompt.icon] || Sparkles
                      return (
                        <button
                          key={index}
                          onClick={() => handleSendMessage(prompt.text)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm bg-background border border-border rounded-xl hover:bg-muted hover:border-success-300 transition-colors text-foreground text-left group"
                        >
                          <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-success-100 transition-colors">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-success-600" />
                          </span>
                          <span className="flex-1">{prompt.text}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[88%] ${message.type === "assistant" ? "space-y-2" : ""}`}>
                      {/* Query type indicator */}
                      {message.type === "assistant" && message.queryType && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-5 h-5 rounded bg-success-100 flex items-center justify-center">
                            <QueryIcon type={message.queryType as IconType} />
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-medium text-success-600">
                            {message.queryType}
                          </span>
                        </div>
                      )}
                      
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 ${
                          message.type === "user"
                            ? "bg-success-600 text-white rounded-br-md"
                            : "bg-background border border-border text-foreground rounded-bl-md shadow-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
                            }
                            return part
                          })}
                        </p>
                        <p
                          className={`text-[10px] mt-1.5 ${
                            message.type === "user" ? "text-white/60" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Action buttons */}
                      {message.type === "assistant" && message.actions && message.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pl-1">
                          {message.actions.map((action, idx) => (
                            <ActionButtonComponent key={idx} action={action} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-background border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-success-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-success-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-success-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-3 bg-background shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-xl transition-all ${
                  isListening
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-muted text-muted-foreground hover:bg-success-100 hover:text-success-600"
                }`}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Listening..." : `Ask ${contextConfig.title.split(" ")[0]}...`}
                  disabled={isProcessing || isListening}
                  className="w-full px-4 py-2.5 bg-muted border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-success-500 text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                />
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isProcessing}
                className={`p-2.5 rounded-xl transition-all ${
                  !inputValue.trim() || isProcessing
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-success-600 text-white hover:bg-success-500 shadow-md"
                }`}
                title="Send message"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <BarChart3 className="w-3 h-3 text-success-500" />
              <p className="text-[10px] text-muted-foreground">
                Context: <span className="font-medium text-success-600">{contextConfig.subtitle}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
