export interface Notification {
  id: string
  type: "system" | "user" | "casting" | "approval"
  title: string
  message: string
  timestamp: number
  read: boolean
  priority: "low" | "medium" | "high"
  relatedTabKey?: string
  relatedActorId?: string
  relatedProjectId?: string
  relatedCharacterId?: string
  actionUrl?: string
  metadata?: Record<string, any>
}
