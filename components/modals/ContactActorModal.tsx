"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import {
  X,
  Mail,
  Send,
  Edit3,
  Eye,
  User,
  Inbox,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  FileText,
  Search,
  Plus,
  Save,
  Trash2,
  Copy,
  Layers,
  Check,
  Pencil,
  RotateCcw,
} from "lucide-react"
import type { Actor, MessageHistoryItem } from "@/types/casting"

interface ContactActorModalProps {
  onClose: () => void
  actorIds: string[]
  characterId: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  category: "audition" | "callback" | "rejection" | "offer" | "general"
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "empty-mail",
    name: "Empty Mail",
    subject: "",
    category: "general",
    content: "",
  },
  {
    id: "invitation-audition",
    name: "Invitation to Audition",
    subject: "Audition Invitation - {{CHARACTER_NAME}} in {{PROJECT_NAME}}",
    category: "audition",
    content: `Dear {{ACTOR_NAME}},

We are pleased to invite you to audition for the role of {{CHARACTER_NAME}} in our upcoming production "{{PROJECT_NAME}}".

Audition Details:
Date: {{AUDITION_DATE}}
Time: {{AUDITION_TIME}}
Location: {{AUDITION_LOCATION}}
Duration: Approximately {{AUDITION_DURATION}}

Please prepare:
- A contemporary monologue (2-3 minutes)
- Sides will be provided upon arrival
- Please bring a current headshot and resume

If you have any questions or need to reschedule, please contact us as soon as possible.

We look forward to seeing your audition.

Best regards,
{{SENDER_NAME}}
{{SENDER_TITLE}}
{{PRODUCTION_COMPANY}}`,
  },
  {
    id: "callback",
    name: "Callback Invitation",
    subject: "Callback Invitation - {{CHARACTER_NAME}} in {{PROJECT_NAME}}",
    category: "callback",
    content: `Dear {{ACTOR_NAME}},

Congratulations! We would like to invite you back for a callback audition for the role of {{CHARACTER_NAME}} in "{{PROJECT_NAME}}".

Callback Details:
Date: {{CALLBACK_DATE}}
Time: {{CALLBACK_TIME}}
Location: {{CALLBACK_LOCATION}}
Duration: Approximately {{CALLBACK_DURATION}}

For this callback, please prepare:
- The attached sides ({{SCENE_REFERENCE}})
- Be prepared to take direction and try different approaches
- {{ADDITIONAL_PREPARATION}}

Please confirm your attendance by replying to this email.

We were impressed with your initial audition and look forward to working with you further.

Best regards,
{{SENDER_NAME}}
{{SENDER_TITLE}}
{{PRODUCTION_COMPANY}}`,
  },
  {
    id: "rejection",
    name: "Audition Thank You",
    subject: "Thank you for your audition - {{PROJECT_NAME}}",
    category: "rejection",
    content: `Dear {{ACTOR_NAME}},

Thank you for taking the time to audition for the role of {{CHARACTER_NAME}} in "{{PROJECT_NAME}}". We appreciate your preparation and the energy you brought to your audition.

After careful consideration, we have decided to move forward with another actor for this particular role. This decision was not easy, as we had many talented actors audition.

We were impressed with your work and would like to keep you in mind for future projects. We encourage you to continue submitting for roles with our production company.

Thank you again for your time and interest in our project.

Best wishes,
{{SENDER_NAME}}
{{SENDER_TITLE}}
{{PRODUCTION_COMPANY}}`,
  },
  {
    id: "formal-offer",
    name: "Formal Casting Offer",
    subject: "Casting Offer - {{CHARACTER_NAME}} in {{PROJECT_NAME}}",
    category: "offer",
    content: `Dear {{ACTOR_NAME}},

We are delighted to formally offer you the role of {{CHARACTER_NAME}} in our production "{{PROJECT_NAME}}".

Production Details:
Start Date: {{START_DATE}}
End Date: {{END_DATE}}
Rehearsal Period: {{REHEARSAL_PERIOD}}
Performance Dates: {{PERFORMANCE_DATES}}
Location: {{PRODUCTION_LOCATION}}

Compensation: {{COMPENSATION_DETAILS}}

Next Steps:
1. Please confirm your acceptance by {{RESPONSE_DEADLINE}}
2. Contract and additional details will be sent upon acceptance
3. First rehearsal: {{FIRST_REHEARSAL_DATE}}

We are excited about the possibility of working with you and believe you will bring something special to this role.

Please let us know if you have any questions.

Congratulations and welcome to the team!

Best regards,
{{SENDER_NAME}}
{{SENDER_TITLE}}
{{PRODUCTION_COMPANY}}`,
  },
  {
    id: "general-inquiry",
    name: "General Inquiry",
    subject: "Regarding {{PROJECT_NAME}} - {{CHARACTER_NAME}}",
    category: "general",
    content: `Dear {{ACTOR_NAME}},

I hope this email finds you well. I am reaching out regarding our upcoming production "{{PROJECT_NAME}}".

{{CUSTOM_MESSAGE}}

If you are interested and available, please let us know at your earliest convenience.

Thank you for your time and consideration.

Best regards,
{{SENDER_NAME}}
{{SENDER_TITLE}}
{{PRODUCTION_COMPANY}}`,
  },
]

/* ------------------------------------------------------------------ */
/*  Helper: format relative time                                       */
/* ------------------------------------------------------------------ */
function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatFullDate(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */

export default function ContactActorModal({ onClose, actorIds, characterId }: ContactActorModalProps) {
  const { state, dispatch } = useCasting()

  // -- view state --
  type ViewTab = "compose" | "history" | "templates"
  const [viewTab, setViewTab] = useState<ViewTab>("compose")

  // -- custom templates state --
  const [customTemplates, setCustomTemplates] = useState<EmailTemplate[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("greenlight_custom_templates")
        if (stored) return JSON.parse(stored)
      } catch {}
    }
    return []
  })
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    content: "",
    category: "general" as EmailTemplate["category"],
  })
  const [templateSaved, setTemplateSaved] = useState(false)

  const allTemplates = useMemo(() => [...EMAIL_TEMPLATES, ...customTemplates], [customTemplates])

  const saveCustomTemplates = (templates: EmailTemplate[]) => {
    setCustomTemplates(templates)
    if (typeof window !== "undefined") {
      localStorage.setItem("greenlight_custom_templates", JSON.stringify(templates))
    }
  }

  const handleSaveTemplate = () => {
    if (!templateForm.name.trim() || !templateForm.subject.trim()) return
    if (editingTemplateId) {
      const updated = customTemplates.map((t) =>
        t.id === editingTemplateId ? { ...t, ...templateForm } : t,
      )
      saveCustomTemplates(updated)
    } else {
      const newTemplate: EmailTemplate = {
        id: `custom-${Date.now()}`,
        ...templateForm,
      }
      saveCustomTemplates([...customTemplates, newTemplate])
    }
    setTemplateEditorOpen(false)
    setEditingTemplateId(null)
    setTemplateForm({ name: "", subject: "", content: "", category: "general" })
    setTemplateSaved(true)
    setTimeout(() => setTemplateSaved(false), 2500)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplateId(template.id)
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      content: template.content,
      category: template.category,
    })
    setTemplateEditorOpen(true)
  }

  const handleDeleteTemplate = (id: string) => {
    saveCustomTemplates(customTemplates.filter((t) => t.id !== id))
  }

  const handleDuplicateBuiltIn = (template: EmailTemplate) => {
    const copy: EmailTemplate = {
      id: `custom-${Date.now()}`,
      name: `${template.name} (Copy)`,
      subject: template.subject,
      content: template.content,
      category: template.category,
    }
    saveCustomTemplates([...customTemplates, copy])
    setTemplateSaved(true)
    setTimeout(() => setTemplateSaved(false), 2500)
  }

  const handleNewTemplate = () => {
    setEditingTemplateId(null)
    setTemplateForm({ name: "", subject: "", content: "", category: "general" })
    setTemplateEditorOpen(true)
  }

  const handleUseTemplate = (template: EmailTemplate) => {
    handleTemplateSelect(template)
    setViewTab("compose")
  }

  // -- compose state --
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [emailContent, setEmailContent] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [justSent, setJustSent] = useState(false)
  const [customFields, setCustomFields] = useState({
    auditionDate: "",
    auditionTime: "",
    auditionLocation: "",
    auditionDuration: "30 minutes",
    callbackDate: "",
    callbackTime: "",
    callbackLocation: "",
    callbackDuration: "45 minutes",
    sceneReference: "",
    additionalPreparation: "",
    startDate: "",
    endDate: "",
    rehearsalPeriod: "",
    performanceDates: "",
    productionLocation: "",
    compensationDetails: "",
    responseDeadline: "",
    firstRehearsalDate: "",
    customMessage: "",
  })

  // -- history state --
  const [historySearch, setHistorySearch] = useState("")
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
  const [selectedActorFilter, setSelectedActorFilter] = useState<string>("all")
  const historyScrollRef = useRef<HTMLDivElement>(null)

  // -- derived --
  const selectedActors = actorIds
    .map((id) => {
      const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
      const character = currentProject?.characters.find((c) => c.id === characterId)
      if (!character) return null
      const allActors = [
        ...character.actors.longList,
        ...character.actors.audition,
        ...character.actors.approval,
        ...character.actors.shortLists.flatMap((sl) => sl.actors),
      ]
      return allActors.find((actor) => actor.id === id)
    })
    .filter((actor): actor is Actor => Boolean(actor))

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const character = currentProject?.characters.find((c) => c.id === characterId)

  // Aggregate message history across all selected actors
  const allMessages = useMemo(() => {
    const msgs: (MessageHistoryItem & { actorName: string; actorId: string })[] = []
    for (const actor of selectedActors) {
      if (actor.messageHistory) {
        for (const msg of actor.messageHistory) {
          msgs.push({ ...msg, actorName: actor.name, actorId: actor.id })
        }
      }
    }
    return msgs.sort((a, b) => b.timestamp - a.timestamp)
  }, [selectedActors])

  const filteredMessages = useMemo(() => {
    let items = allMessages
    if (selectedActorFilter !== "all") {
      items = items.filter((m) => m.actorId === selectedActorFilter)
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase()
      items = items.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q) ||
          m.senderName.toLowerCase().includes(q),
      )
    }
    return items
  }, [allMessages, selectedActorFilter, historySearch])

  // Group messages by conversation thread (by subject root)
  const threadedMessages = useMemo(() => {
    const threads: Map<string, typeof filteredMessages> = new Map()
    for (const msg of filteredMessages) {
      const rootSubject = msg.subject.replace(/^Re:\s*/i, "").trim()
      if (!threads.has(rootSubject)) threads.set(rootSubject, [])
      threads.get(rootSubject)!.push(msg)
    }
    // Sort threads by most-recent message
    const sorted = Array.from(threads.entries()).sort((a, b) => {
      const latestA = Math.max(...a[1].map((m) => m.timestamp))
      const latestB = Math.max(...b[1].map((m) => m.timestamp))
      return latestB - latestA
    })
    // Within each thread, sort oldest-first for conversation flow
    for (const [, msgs] of sorted) {
      msgs.sort((a, b) => a.timestamp - b.timestamp)
    }
    return sorted
  }, [filteredMessages])

  const totalMessageCount = allMessages.length
  const incomingCount = allMessages.filter((m) => m.direction === "incoming").length

  // -- template helpers --
  const replaceTemplateVariables = (text: string, actor: Actor): string => {
    const currentUser = state.currentUser
    const replacements: Record<string, string> = {
      "{{ACTOR_NAME}}": actor.name,
      "{{CHARACTER_NAME}}": character?.name || "Character",
      "{{PROJECT_NAME}}": currentProject?.name || "Project",
      "{{SENDER_NAME}}": currentUser?.name || "Casting Director",
      "{{SENDER_TITLE}}":
        currentUser?.role === "Producer" ? "Producer" : currentUser?.role === "Director" ? "Director" : "Casting Director",
      "{{PRODUCTION_COMPANY}}": "Production Company",
      "{{AUDITION_DATE}}": customFields.auditionDate || "[AUDITION DATE]",
      "{{AUDITION_TIME}}": customFields.auditionTime || "[AUDITION TIME]",
      "{{AUDITION_LOCATION}}": customFields.auditionLocation || "[AUDITION LOCATION]",
      "{{AUDITION_DURATION}}": customFields.auditionDuration,
      "{{CALLBACK_DATE}}": customFields.callbackDate || "[CALLBACK DATE]",
      "{{CALLBACK_TIME}}": customFields.callbackTime || "[CALLBACK TIME]",
      "{{CALLBACK_LOCATION}}": customFields.callbackLocation || "[CALLBACK LOCATION]",
      "{{CALLBACK_DURATION}}": customFields.callbackDuration,
      "{{SCENE_REFERENCE}}": customFields.sceneReference || "[SCENE REFERENCE]",
      "{{ADDITIONAL_PREPARATION}}": customFields.additionalPreparation || "[ADDITIONAL PREPARATION]",
      "{{START_DATE}}": customFields.startDate || "[START DATE]",
      "{{END_DATE}}": customFields.endDate || "[END DATE]",
      "{{REHEARSAL_PERIOD}}": customFields.rehearsalPeriod || "[REHEARSAL PERIOD]",
      "{{PERFORMANCE_DATES}}": customFields.performanceDates || "[PERFORMANCE DATES]",
      "{{PRODUCTION_LOCATION}}": customFields.productionLocation || "[PRODUCTION LOCATION]",
      "{{COMPENSATION_DETAILS}}": customFields.compensationDetails || "[COMPENSATION DETAILS]",
      "{{RESPONSE_DEADLINE}}": customFields.responseDeadline || "[RESPONSE DEADLINE]",
      "{{FIRST_REHEARSAL_DATE}}": customFields.firstRehearsalDate || "[FIRST REHEARSAL DATE]",
      "{{CUSTOM_MESSAGE}}": customFields.customMessage || "[YOUR MESSAGE HERE]",
    }
    let result = text
    Object.entries(replacements).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value)
    })
    return result
  }

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setEmailSubject(template.subject)
    setEmailContent(template.content)
    setIsEditing(false)
    setIsPreview(false)
  }

  const handleSendEmail = async () => {
    if (!selectedTemplate || selectedActors.length === 0) return
    setIsSending(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const finalBody = selectedActors.length > 0 ? replaceTemplateVariables(emailContent, selectedActors[0]) : emailContent
      const finalSubject = selectedActors.length > 0 ? replaceTemplateVariables(emailSubject, selectedActors[0]) : emailSubject

      dispatch({
        type: "ADD_CONTACT_STATUS",
        payload: {
          actorIds,
          characterId,
          contactType: selectedTemplate.category,
          templateName: selectedTemplate.name,
          timestamp: Date.now(),
          emailSubject: finalSubject,
          emailBody: finalBody,
        },
      })

      setJustSent(true)
      setTimeout(() => {
        setJustSent(false)
        setViewTab("history")
      }, 2000)
    } catch (error) {
      console.error("Failed to send emails:", error)
    } finally {
      setIsSending(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "audition":
        return "bg-blue-100 text-blue-800"
      case "callback":
        return "bg-green-100 text-green-800"
      case "rejection":
        return "bg-red-100 text-red-800"
      case "offer":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const renderCustomFields = () => {
    if (!selectedTemplate) return null
    const fields: React.ReactNode[] = []

    if (selectedTemplate.category === "audition") {
      fields.push(
        <div key="audition-date" className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Audition Date</label>
            <input type="date" value={customFields.auditionDate} onChange={(e) => setCustomFields({ ...customFields, auditionDate: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Audition Time</label>
            <input type="time" value={customFields.auditionTime} onChange={(e) => setCustomFields({ ...customFields, auditionTime: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
        </div>,
        <div key="audition-location">
          <label className="block text-xs font-medium text-gray-600 mb-1">Audition Location</label>
          <input type="text" value={customFields.auditionLocation} onChange={(e) => setCustomFields({ ...customFields, auditionLocation: e.target.value })} placeholder="Studio address or virtual meeting link" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>,
      )
    }
    if (selectedTemplate.category === "callback") {
      fields.push(
        <div key="callback-details" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Callback Date</label>
              <input type="date" value={customFields.callbackDate} onChange={(e) => setCustomFields({ ...customFields, callbackDate: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Callback Time</label>
              <input type="time" value={customFields.callbackTime} onChange={(e) => setCustomFields({ ...customFields, callbackTime: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Scene Reference</label>
            <input type="text" value={customFields.sceneReference} onChange={(e) => setCustomFields({ ...customFields, sceneReference: e.target.value })} placeholder="e.g., Act 2, Scene 3" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Additional Preparation</label>
            <textarea value={customFields.additionalPreparation} onChange={(e) => setCustomFields({ ...customFields, additionalPreparation: e.target.value })} placeholder="Any specific preparation instructions" rows={2} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
          </div>
        </div>,
      )
    }
    if (selectedTemplate.category === "offer") {
      fields.push(
        <div key="offer-details" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input type="date" value={customFields.startDate} onChange={(e) => setCustomFields({ ...customFields, startDate: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Response Deadline</label>
              <input type="date" value={customFields.responseDeadline} onChange={(e) => setCustomFields({ ...customFields, responseDeadline: e.target.value })} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Compensation Details</label>
            <input type="text" value={customFields.compensationDetails} onChange={(e) => setCustomFields({ ...customFields, compensationDetails: e.target.value })} placeholder="e.g., $500/week + benefits" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
        </div>,
      )
    }
    if (selectedTemplate.category === "general") {
      fields.push(
        <div key="custom-message">
          <label className="block text-xs font-medium text-gray-600 mb-1">Your Message</label>
          <textarea value={customFields.customMessage} onChange={(e) => setCustomFields({ ...customFields, customMessage: e.target.value })} placeholder="Enter your custom message here..." rows={3} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
        </div>,
      )
    }

    return fields.length > 0 ? (
      <div className="space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Template Details</h4>
        {fields}
      </div>
    ) : null
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Contact {selectedActors.length === 1 ? selectedActors[0].name : `${selectedActors.length} Actors`}
              </h2>
              <p className="text-xs text-gray-500">
                {character?.name || "Character"} {"\u2022"} {currentProject?.name || "Project"}
              </p>
            </div>
          </div>

          {/* Tab toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewTab("compose")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewTab === "compose" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Compose
            </button>
            <button
              onClick={() => setViewTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewTab === "history" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              History
              {totalMessageCount > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  viewTab === "history" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
                }`}>
                  {totalMessageCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewTab("templates")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewTab === "templates" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Templates
              {customTemplates.length > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  viewTab === "templates" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
                }`}>
                  {customTemplates.length}
                </span>
              )}
            </button>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" disabled={isSending}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {viewTab === "compose" && (
            <div className="flex h-full">
              {/* Left sidebar: Recipients + Templates */}
              <div className="w-72 border-r border-gray-200 shrink-0 bg-gray-50/50 flex flex-col overflow-hidden">
                {/* Recipients */}
                <div className="p-4 border-b border-gray-100 shrink-0">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
                    Recipients ({selectedActors.length})
                  </h3>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {selectedActors.map((actor) => (
                      <div key={actor.id} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{actor.name}</p>
                          {actor.contactEmail && <p className="text-[10px] text-gray-400 truncate">{actor.contactEmail}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Templates */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Templates</h3>
                    <button
                      onClick={() => setViewTab("templates")}
                      className="text-[10px] text-blue-600 font-medium hover:underline"
                    >
                      Manage
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {allTemplates.map((template) => {
                      const isCustom = template.id.startsWith("custom-")
                      return (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-colors ${
                            selectedTemplate?.id === template.id
                              ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-semibold text-gray-900 truncate">{template.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {isCustom && (
                                <span className="px-1 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
                                  Custom
                                </span>
                              )}
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getCategoryColor(template.category)}`}>
                                {template.category}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-500 line-clamp-1">{template.subject}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Right panel: Compose */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {selectedTemplate ? (
                  <>
                    {/* Success banner */}
                    {justSent && (
                      <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2 text-emerald-800 text-sm font-medium shrink-0">
                        <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center">
                          <Send className="w-3 h-3" />
                        </div>
                        Email sent successfully! Switching to history...
                      </div>
                    )}

                    {/* Subject + actions bar */}
                    <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">{selectedTemplate.name}</h3>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { setIsPreview(!isPreview); setIsEditing(false) }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                              isPreview ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            <Eye className="w-3 h-3" /> Preview
                          </button>
                          <button
                            onClick={() => { setIsEditing(!isEditing); setIsPreview(false) }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                              isEditing ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 font-medium">Subject</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="w-full mt-0.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        ) : (
                          <p className="mt-0.5 px-3 py-1.5 text-sm bg-gray-50 border border-gray-100 rounded-lg text-gray-800">
                            {isPreview && selectedActors.length > 0
                              ? replaceTemplateVariables(emailSubject, selectedActors[0])
                              : emailSubject}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Custom fields */}
                    {!isPreview && renderCustomFields() && (
                      <div className="px-5 py-3 border-b border-gray-100 shrink-0">{renderCustomFields()}</div>
                    )}

                    {/* Email body */}
                    <div className="flex-1 min-h-0 p-5 overflow-y-auto">
                      {isEditing ? (
                        <textarea
                          value={emailContent}
                          onChange={(e) => setEmailContent(e.target.value)}
                          className="w-full h-full min-h-[250px] px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono resize-none"
                        />
                      ) : (
                        <div className="w-full min-h-[250px] px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                          <pre className="whitespace-pre-wrap text-sm font-sans text-gray-800 leading-relaxed">
                            {isPreview && selectedActors.length > 0
                              ? replaceTemplateVariables(emailContent, selectedActors[0])
                              : emailContent}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/70 flex items-center justify-between shrink-0">
                      <p className="text-xs text-gray-500">
                        {isPreview && selectedActors.length > 1
                          ? `Preview shows content for ${selectedActors[0].name}. Each actor will receive a personalized email.`
                          : ""}
                      </p>
                      <div className="flex items-center gap-2">
                        <button onClick={onClose} disabled={isSending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                        <button
                          onClick={handleSendEmail}
                          disabled={isSending || !emailContent.trim() || !emailSubject.trim()}
                          className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                        >
                          {isSending ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Send{selectedActors.length > 1 ? ` to ${selectedActors.length}` : ""}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium">Select a template to get started</p>
                      <p className="text-xs text-gray-400 mt-1">Choose from the sidebar on the left</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {viewTab === "history" && (
            <div className="flex h-full">
              {/* Filters sidebar */}
              <div className="w-56 border-r border-gray-200 shrink-0 bg-gray-50/50 flex flex-col overflow-hidden">
                {/* Stats */}
                <div className="p-4 border-b border-gray-100 shrink-0">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100 text-center">
                      <p className="text-lg font-bold text-gray-900">{totalMessageCount}</p>
                      <p className="text-[10px] text-gray-500">Total</p>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100 text-center">
                      <p className="text-lg font-bold text-blue-600">{incomingCount}</p>
                      <p className="text-[10px] text-gray-500">Replies</p>
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="px-4 py-3 border-b border-gray-100 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search messages..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                  </div>
                </div>

                {/* Actor filter */}
                <div className="p-4 flex-1 overflow-y-auto">
                  <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Filter by Actor</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedActorFilter("all")}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedActorFilter === "all" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      All Actors
                    </button>
                    {selectedActors.map((actor) => {
                      const actorMsgCount = allMessages.filter((m) => m.actorId === actor.id).length
                      return (
                        <button
                          key={actor.id}
                          onClick={() => setSelectedActorFilter(actor.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                            selectedActorFilter === actor.id ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <span className="truncate">{actor.name}</span>
                          {actorMsgCount > 0 && (
                            <span className="text-[10px] text-gray-400 font-normal">{actorMsgCount}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Message threads */}
              <div className="flex-1 min-h-0 overflow-y-auto" ref={historyScrollRef}>
                {threadedMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-8">
                    <Inbox className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      {historySearch ? "No messages match your search" : "Send an email from the Compose tab to start a conversation"}
                    </p>
                    {!historySearch && (
                      <button
                        onClick={() => setViewTab("compose")}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Compose Email
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {threadedMessages.map(([threadSubject, messages]) => {
                      const latestMsg = messages[messages.length - 1]
                      const isExpanded = expandedMessageId === threadSubject

                      return (
                        <div key={threadSubject} className="bg-white">
                          {/* Thread header */}
                          <button
                            onClick={() => setExpandedMessageId(isExpanded ? null : threadSubject)}
                            className="w-full text-left px-5 py-3.5 hover:bg-gray-50/70 transition-colors flex items-start gap-3"
                          >
                            <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              latestMsg.direction === "incoming" ? "bg-blue-100" : "bg-gray-100"
                            }`}>
                              {latestMsg.direction === "incoming" ? (
                                <ArrowDownLeft className="w-4 h-4 text-blue-600" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900 truncate">{threadSubject}</p>
                                {messages.length > 1 && (
                                  <span className="shrink-0 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">
                                    {messages.length}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-500 truncate">
                                  {latestMsg.senderName}
                                  {latestMsg.senderRole && (
                                    <span className="text-gray-400"> ({latestMsg.senderRole})</span>
                                  )}
                                </span>
                                <span className="text-gray-300">{"\u2022"}</span>
                                <span className="text-[10px] text-gray-400 shrink-0">{formatRelativeTime(latestMsg.timestamp)}</span>
                              </div>
                              {!isExpanded && (
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{latestMsg.body.split("\n")[0]}</p>
                              )}
                            </div>
                            <div className="shrink-0 mt-1">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </button>

                          {/* Expanded thread */}
                          {isExpanded && (
                            <div className="px-5 pb-4">
                              <div className="ml-4 border-l-2 border-gray-200 pl-4 space-y-3">
                                {messages.map((msg, idx) => (
                                  <div key={msg.id} className="relative">
                                    {/* Connector dot */}
                                    <div className={`absolute -left-[21px] top-3 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                      msg.direction === "incoming" ? "bg-blue-500" : "bg-gray-400"
                                    }`} />

                                    <div className={`rounded-xl p-3.5 ${
                                      msg.direction === "incoming"
                                        ? "bg-blue-50 border border-blue-100"
                                        : "bg-gray-50 border border-gray-100"
                                    }`}>
                                      {/* Message header */}
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                            msg.direction === "incoming" ? "bg-blue-200" : "bg-gray-200"
                                          }`}>
                                            {msg.direction === "incoming" ? (
                                              <ArrowDownLeft className="w-3 h-3 text-blue-700" />
                                            ) : (
                                              <ArrowUpRight className="w-3 h-3 text-gray-600" />
                                            )}
                                          </div>
                                          <div>
                                            <span className="text-xs font-semibold text-gray-900">{msg.senderName}</span>
                                            {msg.senderRole && (
                                              <span className="text-[10px] text-gray-400 ml-1">({msg.senderRole})</span>
                                            )}
                                          </div>
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                            msg.direction === "incoming"
                                              ? "bg-blue-100 text-blue-700"
                                              : "bg-gray-200 text-gray-600"
                                          }`}>
                                            {msg.direction === "incoming" ? "Received" : "Sent"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                          <Clock className="w-3 h-3" />
                                          {formatFullDate(msg.timestamp)}
                                        </div>
                                      </div>

                                      {/* Subject (if different from thread) */}
                                      {msg.subject !== threadSubject && (
                                        <p className="text-[10px] text-gray-500 font-medium mb-1.5">
                                          Subject: {msg.subject}
                                        </p>
                                      )}

                                      {/* Template badge */}
                                      {msg.templateUsed && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mb-2 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-medium">
                                          <FileText className="w-2.5 h-2.5" />
                                          {msg.templateUsed}
                                        </span>
                                      )}

                                      {/* Body */}
                                      <pre className="whitespace-pre-wrap text-xs font-sans text-gray-700 leading-relaxed">
                                        {msg.body}
                                      </pre>

                                      {/* Character context */}
                                      {msg.characterName && (
                                        <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
                                          <User className="w-3 h-3" />
                                          Re: {msg.characterName}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Quick reply hint */}
                              <div className="mt-3 ml-4 pl-4">
                                <button
                                  onClick={() => setViewTab("compose")}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline"
                                >
                                  <Send className="w-3 h-3" />
                                  Reply to this thread
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          {viewTab === "templates" && (
            <div className="flex h-full">
              {/* Left: template list */}
              <div className="w-72 border-r border-gray-200 shrink-0 bg-gray-50/50 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 shrink-0">
                  <button
                    onClick={handleNewTemplate}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Template
                  </button>
                </div>

                {/* Success toast */}
                {templateSaved && (
                  <div className="mx-4 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium">
                    <Check className="w-3.5 h-3.5" />
                    Template saved
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Built-in templates */}
                  <div>
                    <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Built-in Templates ({EMAIL_TEMPLATES.length})
                    </h4>
                    <div className="space-y-1.5">
                      {EMAIL_TEMPLATES.map((template) => (
                        <div
                          key={template.id}
                          className="p-2.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-900 truncate">{template.name}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{template.subject}</p>
                            </div>
                            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => handleUseTemplate(template)}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-medium transition-colors"
                            >
                              <Send className="w-2.5 h-2.5" /> Use
                            </button>
                            <button
                              onClick={() => handleDuplicateBuiltIn(template)}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg text-[10px] font-medium transition-colors"
                            >
                              <Copy className="w-2.5 h-2.5" /> Duplicate
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom templates */}
                  <div>
                    <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      My Custom Templates ({customTemplates.length})
                    </h4>
                    {customTemplates.length === 0 ? (
                      <div className="text-center py-6">
                        <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-[10px] text-gray-400">No custom templates yet</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Create one or duplicate a built-in template
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {customTemplates.map((template) => (
                          <div
                            key={template.id}
                            className={`p-2.5 rounded-xl border transition-colors ${
                              editingTemplateId === template.id
                                ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200"
                                : "bg-white border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{template.name}</p>
                                  <span className="px-1 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                                    Custom
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{template.subject}</p>
                              </div>
                              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getCategoryColor(template.category)}`}>
                                {template.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                              <button
                                onClick={() => handleUseTemplate(template)}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-medium transition-colors"
                              >
                                <Send className="w-2.5 h-2.5" /> Use
                              </button>
                              <button
                                onClick={() => handleEditTemplate(template)}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg text-[10px] font-medium transition-colors"
                              >
                                <Pencil className="w-2.5 h-2.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-red-500 hover:bg-red-50 rounded-lg text-[10px] font-medium transition-colors"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: template editor or empty state */}
              <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                {templateEditorOpen ? (
                  <>
                    {/* Editor header */}
                    <div className="px-6 py-4 border-b border-gray-100 shrink-0 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          {editingTemplateId ? "Edit Template" : "Create New Template"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {editingTemplateId ? "Modify your saved template" : "Build a reusable message template"}
                        </p>
                      </div>
                      <button
                        onClick={() => { setTemplateEditorOpen(false); setEditingTemplateId(null) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Editor form */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                      {/* Name + Category row */}
                      <div className="grid grid-cols-[1fr_auto] gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Template Name *</label>
                          <input
                            type="text"
                            value={templateForm.name}
                            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                            placeholder="e.g. Chemistry Read Invitation"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
                          <select
                            value={templateForm.category}
                            onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as EmailTemplate["category"] })}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none cursor-pointer pr-8"
                          >
                            <option value="audition">Audition</option>
                            <option value="callback">Callback</option>
                            <option value="rejection">Rejection</option>
                            <option value="offer">Offer</option>
                            <option value="general">General</option>
                          </select>
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Subject Line *</label>
                        <input
                          type="text"
                          value={templateForm.subject}
                          onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                          placeholder={"e.g. {{CHARACTER_NAME}} - Chemistry Read for {{PROJECT_NAME}}"}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>

                      {/* Available variables hint */}
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide mb-1.5">Available Variables</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "{{ACTOR_NAME}}", "{{CHARACTER_NAME}}", "{{PROJECT_NAME}}",
                            "{{SENDER_NAME}}", "{{SENDER_TITLE}}", "{{PRODUCTION_COMPANY}}",
                            "{{AUDITION_DATE}}", "{{AUDITION_TIME}}", "{{AUDITION_LOCATION}}",
                            "{{CUSTOM_MESSAGE}}",
                          ].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setTemplateForm({ ...templateForm, content: templateForm.content + v })}
                              className="px-1.5 py-0.5 bg-white border border-amber-300 rounded text-[10px] font-mono text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                              title={`Click to insert ${v}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Content body */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Template Content</label>
                        <textarea
                          value={templateForm.content}
                          onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                          placeholder={"Dear {{ACTOR_NAME}},\n\nYour message here...\n\nBest regards,\n{{SENDER_NAME}}"}
                          rows={12}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Editor footer */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/70 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        {editingTemplateId && (
                          <button
                            onClick={() => { setTemplateEditorOpen(false); setEditingTemplateId(null) }}
                            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Discard Changes
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setTemplateEditorOpen(false); setEditingTemplateId(null) }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveTemplate}
                          disabled={!templateForm.name.trim() || !templateForm.subject.trim()}
                          className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {editingTemplateId ? "Save Changes" : "Save Template"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-xs">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Layers className="w-7 h-7 text-gray-400" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">Template Manager</h3>
                      <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                        Create custom message templates or duplicate built-in ones to streamline your communication workflow.
                        Templates support variable placeholders that auto-fill with actor and project details.
                      </p>
                      <button
                        onClick={handleNewTemplate}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create New Template
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
