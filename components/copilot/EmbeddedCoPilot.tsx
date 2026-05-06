"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { 
  Send, Loader2, Sparkles, MessageCircle, X,
  Users, Film, Calendar, Search, ArrowRight, 
  ChevronRight, CheckCircle2, ChevronDown, ChevronUp,
  MapPin, Palette, Shirt, Package, Tv, FileText,
  Bell, AlertCircle, TrendingUp, Clock, Star
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Context types for different modals
export type CoPilotContext = 
  | "splash"
  | "casting" 
  | "characters"
  | "script"
  | "locations" 
  | "props" 
  | "costumes" 
  | "productionDesign" 
  | "castingForTV" 
  | "schedule"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: number
  actions?: ActionButton[]
}

interface ActionButton {
  label: string
  icon: string
  action: string
}

interface QuickPrompt {
  text: string
  icon: React.ReactNode
}

interface ContextConfig {
  title: string
  subtitle: string
  icon: React.ReactNode
  welcomeMessage: string
  prompts: QuickPrompt[]
  notifications?: { type: "info" | "warning" | "success"; message: string }[]
}

// Context-specific configurations with rich demo data
const CONTEXT_CONFIGS: Record<CoPilotContext, ContextConfig> = {
  splash: {
    title: "Project Overview",
    subtitle: "Your daily briefing",
    icon: <Sparkles className="w-4 h-4" />,
    welcomeMessage: "Welcome back! Here's what needs your attention today.",
    notifications: [
      { type: "warning", message: "3 characters still need casting decisions" },
      { type: "info", message: "5 new actor submissions received overnight" },
      { type: "success", message: "Location permits approved for Downtown scenes" },
    ],
    prompts: [
      { text: "What decisions are pending?", icon: <AlertCircle className="w-4 h-4" /> },
      { text: "Show me today's priorities", icon: <TrendingUp className="w-4 h-4" /> },
      { text: "Any new submissions?", icon: <Bell className="w-4 h-4" /> },
      { text: "Project status summary", icon: <Star className="w-4 h-4" /> },
    ],
  },
  casting: {
    title: "Casting Assistant",
    subtitle: "Actor & audition insights",
    icon: <Film className="w-4 h-4" />,
    welcomeMessage: "I can help you find the perfect actors for your characters.",
    notifications: [
      { type: "info", message: "8 actors awaiting review for Detective Morgan" },
      { type: "warning", message: "Callback deadline tomorrow for lead roles" },
    ],
    prompts: [
      { text: "Who's up for audition today?", icon: <Users className="w-4 h-4" /> },
      { text: "Compare top candidates for Sarah", icon: <Search className="w-4 h-4" /> },
      { text: "Which characters need more actors?", icon: <Film className="w-4 h-4" /> },
      { text: "Show me greenlit actors", icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
  },
  characters: {
    title: "Character Bible",
    subtitle: "Role & breakdown assistant",
    icon: <Film className="w-4 h-4" />,
    welcomeMessage: "Let me help you manage your character breakdowns.",
    notifications: [
      { type: "warning", message: "5 characters have incomplete descriptions" },
      { type: "info", message: "New character added: Mysterious Stranger" },
    ],
    prompts: [
      { text: "Which characters need casting?", icon: <Users className="w-4 h-4" /> },
      { text: "Show me lead roles", icon: <Star className="w-4 h-4" /> },
      { text: "Characters with most screen time", icon: <Clock className="w-4 h-4" /> },
      { text: "Update character description", icon: <FileText className="w-4 h-4" /> },
    ],
  },
  script: {
    title: "Script Analysis",
    subtitle: "Dialogue & scene insights",
    icon: <FileText className="w-4 h-4" />,
    welcomeMessage: "I can analyze your script for casting insights.",
    notifications: [
      { type: "info", message: "Script updated: 3 new scenes added" },
      { type: "warning", message: "Scene 12 has unassigned speaking roles" },
    ],
    prompts: [
      { text: "Dialogue count by character", icon: <Users className="w-4 h-4" /> },
      { text: "Which scenes need the most extras?", icon: <Search className="w-4 h-4" /> },
      { text: "Show me scenes with Sarah", icon: <Film className="w-4 h-4" /> },
      { text: "Recent script changes", icon: <Clock className="w-4 h-4" /> },
    ],
  },
  locations: {
    title: "Location Scout",
    subtitle: "Venues & permits",
    icon: <MapPin className="w-4 h-4" />,
    welcomeMessage: "I'll help you manage locations and permits.",
    notifications: [
      { type: "success", message: "Downtown Alley permit approved" },
      { type: "warning", message: "Beach Cove booking expires in 3 days" },
    ],
    prompts: [
      { text: "Which locations are confirmed?", icon: <CheckCircle2 className="w-4 h-4" /> },
      { text: "Permits pending approval", icon: <Clock className="w-4 h-4" /> },
      { text: "Find outdoor locations", icon: <Search className="w-4 h-4" /> },
      { text: "Location availability this week", icon: <Calendar className="w-4 h-4" /> },
    ],
  },
  props: {
    title: "Props Inventory",
    subtitle: "Tracking & sourcing",
    icon: <Package className="w-4 h-4" />,
    welcomeMessage: "Let me help you track props across your production.",
    notifications: [
      { type: "warning", message: "Vintage typewriter still needs sourcing" },
      { type: "info", message: "12 props checked out for tomorrow's shoot" },
    ],
    prompts: [
      { text: "Props needed for Scene 5", icon: <Search className="w-4 h-4" /> },
      { text: "What needs to be sourced?", icon: <AlertCircle className="w-4 h-4" /> },
      { text: "Props on set today", icon: <CheckCircle2 className="w-4 h-4" /> },
      { text: "Track a specific prop", icon: <Package className="w-4 h-4" /> },
    ],
  },
  costumes: {
    title: "Wardrobe Manager",
    subtitle: "Costumes & fittings",
    icon: <Shirt className="w-4 h-4" />,
    welcomeMessage: "I can help manage costumes and fittings.",
    notifications: [
      { type: "info", message: "3 fittings scheduled for tomorrow" },
      { type: "warning", message: "Lead costume needs final alterations" },
    ],
    prompts: [
      { text: "Costume status for the lead", icon: <Star className="w-4 h-4" /> },
      { text: "Costumes needing alterations", icon: <AlertCircle className="w-4 h-4" /> },
      { text: "Upcoming fitting appointments", icon: <Calendar className="w-4 h-4" /> },
      { text: "View character lookbooks", icon: <Search className="w-4 h-4" /> },
    ],
  },
  productionDesign: {
    title: "Production Design",
    subtitle: "Sets & art direction",
    icon: <Palette className="w-4 h-4" />,
    welcomeMessage: "I'll help you track sets and art direction.",
    notifications: [
      { type: "info", message: "Hospital set 75% complete" },
      { type: "success", message: "Concept art approved for Episode 3" },
    ],
    prompts: [
      { text: "Sets under construction", icon: <Clock className="w-4 h-4" /> },
      { text: "View concept art gallery", icon: <Search className="w-4 h-4" /> },
      { text: "Sets needing dressing", icon: <AlertCircle className="w-4 h-4" /> },
      { text: "Budget status by set", icon: <TrendingUp className="w-4 h-4" /> },
    ],
  },
  castingForTV: {
    title: "TV Casting",
    subtitle: "Non-fiction & reality",
    icon: <Tv className="w-4 h-4" />,
    welcomeMessage: "I can help manage participant casting.",
    notifications: [
      { type: "info", message: "8 participants shortlisted for final review" },
      { type: "warning", message: "Network presentation deadline: Friday" },
    ],
    prompts: [
      { text: "Shortlisted participants", icon: <Users className="w-4 h-4" /> },
      { text: "Participants from LA", icon: <MapPin className="w-4 h-4" /> },
      { text: "Confirmed availability", icon: <CheckCircle2 className="w-4 h-4" /> },
      { text: "Diversity breakdown", icon: <TrendingUp className="w-4 h-4" /> },
    ],
  },
  schedule: {
    title: "Schedule Manager",
    subtitle: "Production calendar",
    icon: <Calendar className="w-4 h-4" />,
    welcomeMessage: "I can help you manage the production schedule.",
    notifications: [
      { type: "warning", message: "Room conflict detected for Tuesday 2PM" },
      { type: "info", message: "3 auditions scheduled for Monday" },
    ],
    prompts: [
      { text: "This week's schedule", icon: <Calendar className="w-4 h-4" /> },
      { text: "Upcoming audition slots", icon: <Clock className="w-4 h-4" /> },
      { text: "Scheduling conflicts", icon: <AlertCircle className="w-4 h-4" /> },
      { text: "Next callback session", icon: <Search className="w-4 h-4" /> },
    ],
  },
}

// Demo responses for each context
const DEMO_RESPONSES: Record<CoPilotContext, Record<string, string>> = {
  splash: {
    "pending": "**Pending Decisions:**\n\n1. **Detective Morgan** - 3 actors in final consideration\n2. **Location approval** - Beach Cove needs confirmation\n3. **Costume budget** - Awaiting sign-off for Episode 3\n4. **Callback scheduling** - 5 actors need slots assigned\n\n*Tip: Start with casting decisions to keep the production on track.*",
    "priorities": "**Today's Priorities:**\n\n1. Review 5 new actor submissions for Lead Role\n2. Confirm Downtown Alley shoot dates\n3. Final costume fitting for Sarah - 2 PM\n4. Budget review meeting - 4 PM\n\n*You have 3 items requiring immediate attention.*",
    "submissions": "**New Submissions (Last 24 hours):**\n\n- **8 actors** submitted for Detective Morgan\n- **3 actors** submitted for Dr. Marcus\n- **2 self-tape** links received\n\n*5 submissions match your specified criteria for lead roles.*",
    "status": "**Project Status Summary:**\n\n- **Characters:** 12 total, 7 cast, 5 pending\n- **Actors:** 127 in database, 24 shortlisted\n- **Locations:** 8 confirmed, 2 pending permits\n- **Schedule:** 85% complete for Episodes 1-3\n\n*Overall progress: On track for pre-production deadline.*",
  },
  casting: {
    "audition": "**Today's Auditions:**\n\n**10:00 AM - Detective Morgan:**\n- Jennifer Ashworth (Callback #2)\n- Catherine Holloway (New)\n\n**2:00 PM - Dr. Marcus:**\n- Jonathan Whitmore\n- Richard Thornton\n\n*4 actors scheduled across 2 sessions.*",
    "compare": "**Top Candidates for Sarah:**\n\n| Candidate | Chemistry | Range | Availability |\n|-----------|-----------|-------|--------------|\n| Emma R. | 9/10 | Excellent | Full |\n| Sofia L. | 8/10 | Good | Partial |\n| Chen W. | 9/10 | Excellent | Full |\n\n*Recommendation: Schedule chemistry read with Emma R. and Chen W.*",
    "characters": "**Characters Needing More Actors:**\n\n1. **Young Tommy** - Only 2 candidates, need 5+\n2. **Mysterious Stranger** - No submissions yet\n3. **Mayor Chen** - 3 candidates, need diversity options\n\n*Consider expanding age range for Young Tommy.*",
    "greenlit": "**Greenlit Actors:**\n\n- **Sarah (Lead):** Emma Rodriguez - Confirmed\n- **Marcus:** Jonathan Whitmore - Pending contract\n- **Nurse #1:** Victoria Blackwood - Confirmed\n\n*3 roles filled, 9 pending final decisions.*",
  },
  characters: {
    "casting": "**Characters Needing Casting:**\n\n1. **Detective Morgan** - Lead, 35-45, dramatic presence\n2. **Young Tommy** - Child actor, 8-12\n3. **Mysterious Stranger** - Guest role, Episode 3\n4. **Mayor Chen** - Recurring, authority figure\n5. **Dr. Marcus** - Supporting, medical professional\n\n*5 of 12 characters still need casting.*",
    "lead": "**Lead Roles:**\n\n- **Sarah Chen** - Protagonist, appears in all episodes\n  - Screen time: 45% of total\n  - Status: CAST (Emma Rodriguez)\n\n- **Detective Morgan** - Co-lead, Episodes 1-8\n  - Screen time: 30% of total\n  - Status: In final callbacks\n\n*2 lead roles identified.*",
    "screen": "**Characters by Screen Time:**\n\n1. Sarah Chen - 847 lines (45%)\n2. Detective Morgan - 562 lines (30%)\n3. Dr. Marcus - 234 lines (12%)\n4. Mayor Chen - 156 lines (8%)\n5. Others - 98 lines (5%)\n\n*Sarah has the most dialogue in Episodes 1-3.*",
    "update": "I can help you update character descriptions. Which character would you like to modify?\n\n**Quick actions:**\n- Edit casting notes\n- Update age range\n- Add character traits\n- Modify appearance description",
  },
  script: {
    "dialogue": "**Dialogue Count by Character:**\n\n| Character | Lines | % of Total |\n|-----------|-------|------------|\n| Sarah | 847 | 35% |\n| Morgan | 562 | 23% |\n| Marcus | 234 | 10% |\n| Tommy | 156 | 6% |\n| Others | 623 | 26% |\n\n*Total: 2,422 lines across 45 scenes.*",
    "extras": "**Scenes Requiring Most Extras:**\n\n1. **Scene 23** - Hospital waiting room (25 extras)\n2. **Scene 31** - Town hall meeting (40 extras)\n3. **Scene 8** - Restaurant scene (15 extras)\n4. **Scene 45** - Finale crowd (50+ extras)\n\n*Total extras needed: 130+ across all scenes.*",
    "sarah": "**Scenes with Sarah:**\n\n- **Episode 1:** Scenes 1, 3, 5, 8, 12, 15\n- **Episode 2:** Scenes 2, 4, 7, 11, 14\n- **Episode 3:** Scenes 1, 6, 9, 13, 16, 18\n\n*Sarah appears in 18 scenes total (40% of screenplay).*",
    "changes": "**Recent Script Changes:**\n\n- **Today:** Scene 12 dialogue revised (Marcus)\n- **Yesterday:** New scene added - Episode 3, Scene 18\n- **3 days ago:** Scene 5 location changed to exterior\n\n*3 changes in the last week affecting casting.*",
  },
  locations: {
    "confirmed": "**Confirmed Locations:**\n\n1. **Hero House Exterior** - 123 Oak Street\n2. **Downtown Alley** - Arts District, DTLA\n3. **City Park** - Griffith Park\n\n*3 of 8 locations fully confirmed.*",
    "permits": "**Permits Pending:**\n\n- Beach Cove - Parks Dept (3 days)\n- Hospital Exterior - City permit (1 week)\n\n*2 permits awaiting approval.*",
    "outdoor": "**Outdoor Locations:**\n\n1. City Park - Open spaces, day scenes\n2. Beach Cove - Sunset sequences\n3. Mountain Trail - Episode 4\n4. Rooftop Garden - Skyline shots\n\n*4 outdoor locations available.*",
    "availability": "**Location Availability This Week:**\n\n- Mon: Hero House, Downtown Alley\n- Tue: City Park (AM only)\n- Wed: All locations available\n- Thu: Beach Cove (tide dependent)\n- Fri: Downtown Alley (night)\n\n*Best day for full access: Wednesday.*",
  },
  props: {
    "scene": "**Props for Scene 5:**\n\n- Butcher knife (rubber stunt)\n- Coffee mug with logo\n- Newspaper (March 1998)\n- Fruit bowl\n- Wall phone (period)\n\n*4/5 sourced, knife pending.*",
    "sourced": "**Props Needing Sourcing:**\n\n**High Priority:**\n- Vintage typewriter (1960s)\n- Period briefcase\n- Custom trophy\n\n**Standard:**\n- Hospital bed props (3)\n- Office supplies\n\n*12 items total.*",
    "today": "**Props On Set Today:**\n\n- Scene 8: Restaurant menus, wine glasses\n- Scene 12: Medical equipment, charts\n\n*23 props checked out, 2 returns pending.*",
    "track": "Which prop would you like to track? I can show you:\n- Current location\n- Condition status\n- Usage history\n- Next scheduled use",
  },
  costumes: {
    "lead": "**Lead Costume Status (Sarah):**\n\n**Complete:**\n- Business suit (navy)\n- Casual outfit\n- Evening gown (burgundy)\n\n**In Progress:**\n- Distressed suit (stunt)\n\n*Next fitting: Tuesday 2 PM.*",
    "alterations": "**Costumes Needing Alterations:**\n\n1. Marcus's leather jacket - Shoulders\n2. Sarah's evening gown - Hem\n3. Dr. Chen's lab coat - Patches\n4. Young Tommy's uniform - Seams\n\n*7 items total with tailor.*",
    "fittings": "**Upcoming Fittings:**\n\n- **Tomorrow 10 AM:** Marcus - Final\n- **Tomorrow 2 PM:** Sarah - Stunt double\n- **Thursday 11 AM:** Tommy - School uniform\n\n*3 fittings scheduled this week.*",
    "lookbook": "I can show you lookbooks for:\n\n- Sarah Chen (12 looks)\n- Detective Morgan (8 looks)\n- Dr. Marcus (5 looks)\n\nWhich character's lookbook would you like to view?",
  },
  productionDesign: {
    "construction": "**Sets Under Construction:**\n\n1. **Hospital ER** - 75% complete (Friday)\n2. **1950s Diner** - 40% complete\n3. **Apartment** - 90% complete\n\n*3 sets in progress, on schedule.*",
    "concept": "**Concept Art Gallery:**\n\n- Underground bunker (3 versions)\n- Abandoned warehouse\n- Secret laboratory\n- Chase storyboards\n\n**Approved:** Bunker v2, Warehouse\n**Pending:** Laboratory",
    "dressing": "**Sets Needing Dressing:**\n\n1. Apartment Living Room - Mon AM\n2. Office Interior - Tue PM\n3. Hospital Waiting - Wed\n\n*3 sets need final dressing before shoot.*",
    "budget": "**Set Budget Status:**\n\n| Set | Budget | Spent | Status |\n|-----|--------|-------|---------|\n| Hospital | $45K | $38K | On track |\n| Diner | $30K | $28K | At limit |\n| Apartment | $15K | $12K | Under |\n\n*Total: $78K of $90K spent (87%).*",
  },
  castingForTV: {
    "shortlisted": "**Shortlisted Participants:**\n\n**Final Picks:** 8\n**Under Review:** 12\n**Callbacks:** 5\n**Awaiting Response:** 3\n\n*Target: 10 selections needed.*",
    "la": "**Participants from LA:**\n\n1. Marcus J. - Tech entrepreneur\n2. Sofia L. - Fitness influencer\n3. James T. - Restaurant owner\n4. Rosa M. - Artist\n\n*4 LA-based participants in pool.*",
    "availability": "**Confirmed Availability:**\n\n**All Dates Clear:** 6 participants\n- Marcus J., Emma R., Sofia L., James T., Chen W., Rosa M.\n\n**Partial:** 4 participants\n**Conflicts:** 2 need adjustment",
    "diversity": "**Diversity Breakdown:**\n\n- Gender: 55% F, 45% M\n- Age: 25-35 (60%), 35-45 (30%), 45+ (10%)\n- Ethnicity: Diverse representation across 8 backgrounds\n\n*Meets network diversity requirements.*",
  },
  schedule: {
    "week": "**This Week's Schedule:**\n\n- **Mon:** 3 auditions (10am-2pm)\n- **Tue:** Callbacks - Lead (all day)\n- **Wed:** Chemistry reads (afternoon)\n- **Thu:** Network prep\n- **Fri:** Final selections\n\n*12 sessions total.*",
    "audition": "**Upcoming Audition Slots:**\n\n- Mon 10am: Detective Morgan (3 slots)\n- Mon 2pm: Dr. Marcus (2 slots)\n- Tue 10am: Callbacks (4 slots)\n\n*9 slots available, 6 filled.*",
    "conflicts": "**Scheduling Conflicts:**\n\n1. **Tue 2PM** - Room double-booked\n2. **Thu** - Marcus J. unavailable\n\n*Recommendation: Move network call to 11AM.*",
    "callback": "**Next Callback Session:**\n\n**Tuesday, Full Day**\n- 10am: Sarah role - 4 actors\n- 2pm: Morgan role - 3 actors\n- 4pm: Chemistry reads\n\n*7 actors scheduled for callbacks.*",
  },
}

interface EmbeddedCoPilotProps {
  context: CoPilotContext
  className?: string
}

export default function EmbeddedCoPilot({ context, className = "" }: EmbeddedCoPilotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const config = CONTEXT_CONFIGS[context] || CONTEXT_CONFIGS.splash
  const responses = DEMO_RESPONSES[context] || DEMO_RESPONSES.splash

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const generateResponse = useCallback((userMessage: string): string => {
    const lower = userMessage.toLowerCase()
    
    // Match against response keys
    for (const [key, response] of Object.entries(responses)) {
      if (lower.includes(key)) {
        return response
      }
    }
    
    // Default response based on context
    return `I understand you're asking about "${userMessage}". In the ${config.title.toLowerCase()} context, I can help you with:\n\n${config.prompts.map(p => `- ${p.text}`).join('\n')}\n\n*Try one of these quick prompts for detailed information.*`
  }, [responses, config])

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: text.trim(),
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsProcessing(true)

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 800))

    const response = generateResponse(text)
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "assistant",
      content: response,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, assistantMessage])
    setIsProcessing(false)
  }, [isProcessing, generateResponse])

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt)
  }

  // Collapsed state - just a small round icon button
  if (!isExpanded) {
    const notificationCount = config.notifications?.length || 0
    return (
      <div className={`relative group ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          title={`${config.title} - Click to open`}
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
        {/* Notification badge */}
        {notificationCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm animate-pulse">
            {notificationCount}
          </div>
        )}
        {/* Tooltip on hover */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
          <div className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
            {config.title}
          </div>
        </div>
      </div>
    )
  }

  // Expanded state - full panel
  return (
    <div className={`w-80 max-h-[500px] bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
            {config.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{config.title}</h3>
            <p className="text-xs text-slate-500">{config.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
            <Sparkles className="w-3 h-3" />
            <span className="text-xs font-medium">AI</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(false)
            }}
            className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <>
        {/* Notifications */}
          {config.notifications && config.notifications.length > 0 && messages.length === 0 && (
            <div className="px-4 py-3 space-y-2 bg-slate-50 border-b border-slate-100">
              {config.notifications.map((notification, idx) => (
                <div 
                  key={idx}
                  className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                    notification.type === "warning" 
                      ? "bg-amber-50 text-amber-800 border border-amber-100" 
                      : notification.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                      : "bg-blue-50 text-blue-800 border border-blue-100"
                  }`}
                >
                  {notification.type === "warning" ? (
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  ) : notification.type === "success" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  ) : (
                    <Bell className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  )}
                  <span>{notification.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[400px]">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">{config.welcomeMessage}</p>
                
                {/* Quick Prompts */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Quick prompts</p>
                  <div className="grid grid-cols-1 gap-2">
                    {config.prompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickPrompt(prompt.text)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-left text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors group"
                      >
                        <span className="text-emerald-600">{prompt.icon}</span>
                        <span className="flex-1">{prompt.text}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                        message.type === "user"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none">
                        {message.content.split('\n').map((line, i) => {
                          // Simple markdown-like rendering
                          const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          const italicLine = boldLine.replace(/\*(.*?)\*/g, '<em>$1</em>')
                          return (
                            <p 
                              key={i} 
                              className={`${i > 0 ? 'mt-1' : ''} ${message.type === "user" ? "text-white" : ""}`}
                              dangerouslySetInnerHTML={{ __html: italicLine }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        <span className="text-sm text-slate-500">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(inputValue)
                  }
                }}
                placeholder={`Ask about ${config.title.toLowerCase()}...`}
                className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={isProcessing}
              />
              <Button
                size="sm"
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="mt-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                Clear conversation
              </button>
            )}
          </div>
        </>
      )
    </div>
  )
}
