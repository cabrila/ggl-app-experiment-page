"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Search,
  UserPlus,
  MessageSquare,
  Vote,
  Users,
  AlertTriangle,
  Info,
  Star,
  Clock,
  Eye,
  Settings,
  Send,
  ChevronDown,
  ChevronRight,
  User,
  Megaphone,
} from "lucide-react"

interface NotificationsModalProps {
  onClose: () => void
}

interface Notification {
  id: string
  type: "vote" | "comment" | "status" | "user" | "deadline" | "system" | "mention" | "approval" | "sent"
  title: string
  message: string
  timestamp: number
  read: boolean
  priority: "low" | "medium" | "high"
  actorId?: string
  characterId?: string
  userId?: string
  actionUrl?: string
  metadata?: Record<string, any>
  recipients?: string[]
}

const DEPARTMENTS = [
  { key: "direction", label: "Direction", color: "bg-blue-500" },
  { key: "props", label: "Props", color: "bg-emerald-500" },
  { key: "costume", label: "Costume & Makeup", color: "bg-purple-500" },
  { key: "location", label: "Location", color: "bg-amber-500" },
  { key: "production-design", label: "Production Design", color: "bg-rose-500" },
] as const

type DepartmentKey = (typeof DEPARTMENTS)[number]["key"]

export default function NotificationsModal({ onClose }: NotificationsModalProps) {
  const { state, dispatch } = useCasting()
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "mentions" | "votes" | "sent">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [showSendPanel, setShowSendPanel] = useState(false)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notifications = state.notifications || []
  const users = state.users || []

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = `w-4 h-4 ${priority === "high" ? "text-red-500" : priority === "medium" ? "text-blue-500" : "text-gray-400"}`
    switch (type) {
      case "vote": return <Vote className={iconClass} />
      case "comment": return <MessageSquare className={iconClass} />
      case "user": return <UserPlus className={iconClass} />
      case "status": return <Star className={iconClass} />
      case "deadline": return <Clock className={iconClass} />
      case "mention": return <Users className={iconClass} />
      case "approval": return <AlertTriangle className={iconClass} />
      case "sent": return <Send className="w-4 h-4 text-emerald-500" />
      case "system": return <Info className={iconClass} />
      default: return <Bell className={iconClass} />
    }
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
    return `${days}d ago`
  }

  const filteredNotifications = (notifications || []).filter((notification) => {
    if (!notification || typeof notification.title !== "string" || typeof notification.message !== "string") return false
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    switch (activeTab) {
      case "unread": return !notification.read && matchesSearch
      case "mentions": return notification.type === "mention" && matchesSearch
      case "votes": return notification.type === "vote" && matchesSearch
      case "sent": return notification.type === "sent" && matchesSearch
      default: return matchesSearch
    }
  })

  const unreadCount = (notifications || []).filter((n) => n && !n.read).length
  const mentionCount = (notifications || []).filter((n) => n && n.type === "mention" && !n.read).length
  const sentCount = (notifications || []).filter((n) => n && n.type === "sent").length

  const handleMarkAsRead = (notificationId: string) => {
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: notificationId })
  }

  const handleMarkAllAsRead = () => {
    dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" })
  }

  const handleDeleteNotification = (notificationId: string) => {
    dispatch({ type: "DELETE_NOTIFICATION", payload: notificationId })
  }

  const handleBulkAction = (action: "read" | "delete") => {
    if (action === "read") {
      selectedNotifications.forEach((id) => {
        dispatch({ type: "MARK_NOTIFICATION_READ", payload: id })
      })
    } else {
      dispatch({ type: "DELETE_SELECTED_NOTIFICATIONS", payload: selectedNotifications })
    }
    setSelectedNotifications([])
  }

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId) ? prev.filter((id) => id !== notificationId) : [...prev, notificationId],
    )
  }

  const handleViewNotification = (notification: Notification) => {
    if (!notification.read) handleMarkAsRead(notification.id)
    if (notification.type === "sent") return
    if (notification.actorId && notification.characterId) {
      const targetProject = state.projects.find((project) =>
        project.characters.some((char) => char.id === notification.characterId),
      )
      if (!targetProject) return
      if (state.currentFocus.currentProjectId !== targetProject.id) {
        dispatch({ type: "SELECT_PROJECT", payload: targetProject.id })
      }
      if (state.currentFocus.characterId !== notification.characterId) {
        dispatch({ type: "SELECT_CHARACTER", payload: notification.characterId })
      }
      const character = targetProject.characters.find((c) => c.id === notification.characterId)
      if (character) {
        let targetTab = "longList"
        if (character.actors.longList.some((a) => a.id === notification.actorId)) targetTab = "longList"
        else if (character.actors.audition.some((a) => a.id === notification.actorId)) targetTab = "audition"
        else if (character.actors.approval.some((a) => a.id === notification.actorId)) targetTab = "approval"
        else if (character.actors.shortLists.some((sl) => sl.actors.some((a) => a.id === notification.actorId))) targetTab = "shortLists"
        else {
          for (const [tabKey, actors] of Object.entries(character.actors)) {
            if (!["longList", "audition", "approval", "shortLists"].includes(tabKey) && Array.isArray(actors) && actors.some((a: any) => a.id === notification.actorId)) {
              targetTab = tabKey
              break
            }
          }
        }
        dispatch({ type: "SELECT_TAB", payload: targetTab })
      }
    } else if (notification.characterId) {
      const targetProject = state.projects.find((project) =>
        project.characters.some((char) => char.id === notification.characterId),
      )
      if (targetProject) {
        if (state.currentFocus.currentProjectId !== targetProject.id) {
          dispatch({ type: "SELECT_PROJECT", payload: targetProject.id })
        }
        dispatch({ type: "SELECT_CHARACTER", payload: notification.characterId })
      }
    }
    onClose()
  }

  const shouldShowViewButton = (notification: Notification) => {
    if (notification.type === "sent") return false
    return notification.actorId || notification.characterId || ["vote", "user", "system", "mention", "approval"].includes(notification.type)
  }

  const handleSendNotification = useCallback((message: string, recipients: { departments: DepartmentKey[]; userIds: string[]; sendToAll: boolean }) => {
    const recipientNames: string[] = []
    if (recipients.sendToAll) {
      recipientNames.push("All Departments")
    } else {
      recipients.departments.forEach((dk) => {
        const dept = DEPARTMENTS.find((d) => d.key === dk)
        if (dept) recipientNames.push(`All in ${dept.label}`)
      })
      recipients.userIds.forEach((uid) => {
        const u = users.find((usr) => usr.id === uid)
        if (u) recipientNames.push(u.name)
      })
    }

    const notification = {
      id: `sent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "sent" as const,
      title: "Sent Notification",
      message,
      timestamp: Date.now(),
      read: true,
      priority: "medium" as const,
      recipients: recipientNames,
    }
    dispatch({ type: "ADD_NOTIFICATION", payload: notification })
    setShowSendPanel(false)

    // Show success banner
    setSendSuccess(`Notification sent to ${recipientNames.join(", ")}`)
    if (successTimerRef.current) clearTimeout(successTimerRef.current)
    successTimerRef.current = setTimeout(() => setSendSuccess(null), 4000)

    // Scroll list to top to show the new notification
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    })
  }, [dispatch, users])

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [])

  const tabs = [
    { key: "all", label: "All", count: (notifications || []).length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "mentions", label: "Mentions", count: mentionCount },
    { key: "votes", label: "Votes", count: (notifications || []).filter((n) => n && n.type === "vote").length },
    { key: "sent", label: "Sent", count: sentCount },
  ] as const

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSendPanel(!showSendPanel)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl transition-colors ${showSendPanel ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"}`}
          >
            <Send className="w-4 h-4" />
            Send Notification to...
          </button>
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={unreadCount === 0}
          >
            <CheckCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Send Notification Panel */}
      {showSendPanel && (
        <SendNotificationPanel
          users={users}
          onSend={handleSendNotification}
          onCancel={() => setShowSendPanel(false)}
        />
      )}

      {/* Success Banner */}
      {sendSuccess && (
        <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2.5 shrink-0 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-sm text-emerald-800 font-medium flex-1 min-w-0 truncate">{sendSuccess}</p>
          <button onClick={() => setSendSuccess(null)} className="p-1 text-emerald-500 hover:text-emerald-700 rounded transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search + Tabs */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50/80 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent"
            />
          </div>
          {selectedNotifications.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500 font-medium">{selectedNotifications.length} selected</span>
              <button onClick={() => handleBulkAction("read")} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors">
                <Check className="w-3.5 h-3.5" /> Read
              </button>
              <button onClick={() => handleBulkAction("delete")} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab.key ? "bg-emerald-700 text-white" : "text-gray-600 hover:bg-gray-200/80"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full font-bold ${activeTab === tab.key ? "bg-emerald-600 text-emerald-100" : "bg-gray-200 text-gray-600"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto" ref={listRef}>
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              {activeTab === "sent" ? <Send className="w-7 h-7 text-gray-300" /> : <Bell className="w-7 h-7 text-gray-300" />}
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">
              {activeTab === "sent" ? "No sent notifications" : "No notifications"}
            </h3>
            <p className="text-sm text-gray-400 max-w-xs">
              {searchTerm
                ? "No notifications match your search."
                : activeTab === "sent"
                  ? "Notifications you send will appear here."
                  : "You're all caught up!"}
            </p>
            {activeTab === "sent" && !searchTerm && (
              <button
                onClick={() => setShowSendPanel(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send your first notification
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                isSelected={selectedNotifications.includes(notification.id)}
                onToggleSelect={() => toggleNotificationSelection(notification.id)}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                onDelete={() => handleDeleteNotification(notification.id)}
                onView={() => handleViewNotification(notification)}
                showViewButton={shouldShowViewButton(notification)}
                icon={getNotificationIcon(notification.type, notification.priority)}
                formattedTime={formatTimestamp(notification.timestamp)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/80 flex items-center justify-between shrink-0">
        <span className="text-xs text-gray-500">
          {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
          {unreadCount > 0 && <span className="text-emerald-600 font-medium"> {"\u2022"} {unreadCount} unread</span>}
          {sentCount > 0 && <span className="text-blue-600 font-medium"> {"\u2022"} {sentCount} sent</span>}
        </span>
        <button
          onClick={() => alert("Notification settings coming soon!")}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </button>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Notification Row                                                    */
/* ================================================================== */

function NotificationRow({
  notification,
  isSelected,
  onToggleSelect,
  onMarkAsRead,
  onDelete,
  onView,
  showViewButton,
  icon,
  formattedTime,
}: {
  notification: Notification
  isSelected: boolean
  onToggleSelect: () => void
  onMarkAsRead: () => void
  onDelete: () => void
  onView: () => void
  showViewButton: boolean
  icon: React.ReactNode
  formattedTime: string
}) {
  const isSent = notification.type === "sent"
  const isNew = Date.now() - notification.timestamp < 5000

  return (
    <div
      className={`flex items-start gap-3 px-6 py-3.5 transition-all duration-300 hover:bg-gray-50/80 ${
        isNew ? "bg-emerald-50/60 animate-in fade-in slide-in-from-top-1 duration-500" : !notification.read ? "bg-emerald-50/40" : isSent ? "bg-blue-50/20" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="mt-1.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
      />

      <div className="mt-1 shrink-0">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-sm truncate ${!notification.read && !isSent ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                {notification.title}
              </h4>
              {!notification.read && !isSent && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
              {isSent && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                  <Send className="w-2.5 h-2.5" />
                  Sent
                </span>
              )}
            </div>

            {/* Message body */}
            <p className={`text-sm mt-0.5 ${isSent ? "text-gray-700" : "text-gray-500"} ${isSent ? "" : "line-clamp-2"}`}>
              {notification.message}
            </p>

            {/* Recipients for sent notifications */}
            {isSent && notification.recipients && notification.recipients.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">To:</span>
                {notification.recipients.map((name, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {name.startsWith("All") ? <Users className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                    {name}
                  </span>
                ))}
              </div>
            )}

            {/* Metadata row */}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[11px] text-gray-400">{formattedTime}</span>
              {notification.priority === "high" && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wide">
                  High
                </span>
              )}
              {notification.type === "mention" && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
                  Mention
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {showViewButton && (
              <button onClick={onView} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="View">
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
            {!notification.read && (
              <button onClick={onMarkAsRead} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Mark as read">
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Send Notification Panel                                            */
/* ================================================================== */

interface UserType {
  id: string
  name: string
  initials: string
  email: string
  role: string
  bgColor: string
  color: string
}

function SendNotificationPanel({
  users,
  onSend,
  onCancel,
}: {
  users: UserType[]
  onSend: (message: string, recipients: { departments: DepartmentKey[]; userIds: string[]; sendToAll: boolean }) => void
  onCancel: () => void
}) {
  const [message, setMessage] = useState("")
  const [mode, setMode] = useState<"departments" | "users">("departments")
  const [sendToAll, setSendToAll] = useState(false)
  const [selectedDepartments, setSelectedDepartments] = useState<DepartmentKey[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [expandedDepts, setExpandedDepts] = useState<DepartmentKey[]>([])
  const [userSearch, setUserSearch] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users
    const q = userSearch.toLowerCase()
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q))
  }, [users, userSearch])

  const toggleDepartment = (key: DepartmentKey) => {
    setSelectedDepartments((prev) => prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key])
    if (sendToAll) setSendToAll(false)
  }

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId])
    if (sendToAll) setSendToAll(false)
  }

  const toggleExpandDept = (key: DepartmentKey) => {
    setExpandedDepts((prev) => prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key])
  }

  const handleSendToAll = () => {
    setSendToAll(!sendToAll)
    if (!sendToAll) {
      setSelectedDepartments([])
      setSelectedUserIds([])
    }
  }

  const hasRecipients = sendToAll || selectedDepartments.length > 0 || selectedUserIds.length > 0
  const canSend = message.trim().length > 0 && hasRecipients

  const recipientSummary = useMemo(() => {
    if (sendToAll) return "All Departments"
    const parts: string[] = []
    selectedDepartments.forEach((dk) => {
      const dept = DEPARTMENTS.find((d) => d.key === dk)
      if (dept) parts.push(dept.label)
    })
    selectedUserIds.forEach((uid) => {
      const u = users.find((usr) => usr.id === uid)
      if (u) parts.push(u.name)
    })
    return parts.length > 0 ? parts.join(", ") : "No recipients selected"
  }, [sendToAll, selectedDepartments, selectedUserIds, users])

  const recipientCount = useMemo(() => {
    if (sendToAll) return users.length || DEPARTMENTS.length
    return selectedDepartments.length + selectedUserIds.length
  }, [sendToAll, selectedDepartments.length, selectedUserIds.length, users.length])

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-6 py-4">
        {/* Compose area */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-700">Message</label>
            <span className={`text-[10px] font-medium ${message.length > 500 ? "text-red-500" : "text-gray-400"}`}>
              {message.length}/500
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            placeholder="Type your notification message..."
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent focus:bg-white resize-none transition-colors"
          />
        </div>

        {/* Recipients */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700">Recipients</label>
              {hasRecipients && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  {recipientCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setMode("departments")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${mode === "departments" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Departments
              </button>
              <button
                onClick={() => setMode("users")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${mode === "users" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Individual Users
              </button>
            </div>
          </div>

          {/* Send to All toggle */}
          <button
            onClick={handleSendToAll}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2 border transition-colors ${sendToAll ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
          >
            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${sendToAll ? "bg-emerald-600 border-emerald-600" : "border-gray-300"}`}>
              {sendToAll && <Check className="w-3 h-3 text-white" />}
            </span>
            <Users className={`w-4 h-4 shrink-0 ${sendToAll ? "text-emerald-600" : "text-gray-400"}`} />
            <span className="text-sm font-medium">Send to All</span>
            <span className="text-[11px] text-gray-400 ml-auto">All departments and users</span>
          </button>

          {!sendToAll && mode === "departments" && (
            <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
              {DEPARTMENTS.map((dept) => {
                const isSelected = selectedDepartments.includes(dept.key)
                const isExpanded = expandedDepts.includes(dept.key)
                return (
                  <div key={dept.key}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleDepartment(dept.key)}
                        className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors ${isSelected ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                      >
                        <span className={`rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-emerald-600 border-emerald-600" : "border-gray-300"}`} style={{ width: 18, height: 18 }}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full ${dept.color} shrink-0`} />
                        <span className="text-sm font-medium">{dept.label}</span>
                      </button>
                      <button
                        onClick={() => toggleExpandDept(dept.key)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="ml-8 mt-1 mb-1 p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">Members in {dept.label}</p>
                        {users.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No users configured</p>
                        ) : (
                          <div className="space-y-1">
                            {users.map((user) => (
                              <button
                                key={user.id}
                                onClick={() => toggleUser(user.id)}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${selectedUserIds.includes(user.id) ? "bg-emerald-100 text-emerald-800" : "hover:bg-gray-100 text-gray-700"}`}
                              >
                                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selectedUserIds.includes(user.id) ? "bg-emerald-600 border-emerald-600" : "border-gray-300"}`}>
                                  {selectedUserIds.includes(user.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                </span>
                                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: user.bgColor, color: user.color }}>{user.initials}</span>
                                <span className="text-xs font-medium truncate">{user.name}</span>
                                <span className="text-[10px] text-gray-400 ml-auto shrink-0">{user.role}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {!sendToAll && mode === "users" && (
            <div>
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent"
                />
              </div>
              <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-4">
                    <User className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">{userSearch ? "No users match your search" : "No users available"}</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id)
                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleUser(user.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors ${isSelected ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                      >
                        <span className={`rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-emerald-600 border-emerald-600" : "border-gray-300"}`} style={{ width: 18, height: 18 }}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </span>
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ backgroundColor: user.bgColor, color: user.color }}>{user.initials}</span>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-[11px] text-gray-400">{user.role} {"\u2022"} {user.email}</p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recipient summary + Actions */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-gray-400 font-medium">Sending to:</p>
            <p className={`text-xs font-medium truncate ${hasRecipients ? "text-gray-700" : "text-gray-400"}`}>{recipientSummary}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSend(message, { departments: selectedDepartments, userIds: selectedUserIds, sendToAll })}
              disabled={!canSend}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
