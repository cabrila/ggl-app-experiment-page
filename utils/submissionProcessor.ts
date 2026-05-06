"use client"

import type { Actor } from "@/types/casting"

export interface SubmissionData {
  formId: string
  characterId: string
  projectId: string
  submissionId: string
  timestamp: number
  formData: {
    name: string
    age: string
    gender: string
    ethnicity: string
    location: string
    contactPhone: string
    contactEmail: string
    agent: string
    playingAge: string
    skills: string[]
    availability: string[]
    experience: string
    notes: string
  }
  photos: Array<{
    id: string
    file: File
    preview: string
    processed?: boolean
  }>
  videos: Array<{
    id: string
    platform: "youtube" | "vimeo"
    url: string
    title: string
    embedUrl?: string
  }>
}

export interface ProcessingResult {
  success: boolean
  actorId?: string
  errors: string[]
  warnings: string[]
  processingLog: Array<{
    step: string
    status: "success" | "error" | "warning"
    message: string
    timestamp: number
  }>
}

export class SubmissionProcessor {
  private static instance: SubmissionProcessor
  private processingQueue: SubmissionData[] = []
  private isProcessing = false

  static getInstance(): SubmissionProcessor {
    if (!SubmissionProcessor.instance) {
      SubmissionProcessor.instance = new SubmissionProcessor()
    }
    return SubmissionProcessor.instance
  }

  // Add submission to processing queue
  addSubmission(submission: SubmissionData): void {
    console.log("📥 SubmissionProcessor: Adding submission to queue:", submission.formData.name)
    this.processingQueue.push(submission)

    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  // Process all submissions in queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return
    }

    this.isProcessing = true
    console.log("🔄 SubmissionProcessor: Starting queue processing, items:", this.processingQueue.length)

    while (this.processingQueue.length > 0) {
      const submission = this.processingQueue.shift()
      if (submission) {
        try {
          await this.processSubmission(submission)
        } catch (error) {
          console.error("❌ SubmissionProcessor: Failed to process submission:", error)
        }
      }
    }

    this.isProcessing = false
    console.log("✅ SubmissionProcessor: Queue processing completed")
  }

  // Process individual submission
  private async processSubmission(submission: SubmissionData): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      success: false,
      errors: [],
      warnings: [],
      processingLog: [],
    }

    const log = (step: string, status: "success" | "error" | "warning", message: string) => {
      result.processingLog.push({
        step,
        status,
        message,
        timestamp: Date.now(),
      })
      console.log(`${status === "error" ? "❌" : status === "warning" ? "⚠️" : "✅"} ${step}: ${message}`)
    }

    try {
      log("validation", "success", "Starting submission validation")

      // Step 1: Validate submission data
      const validationResult = this.validateSubmission(submission)
      if (!validationResult.isValid) {
        result.errors.push(...validationResult.errors)
        log("validation", "error", `Validation failed: ${validationResult.errors.join(", ")}`)
        return result
      }

      log("validation", "success", "Submission data validated successfully")

      // Step 2: Process photos
      log("photo_processing", "success", "Starting photo processing")
      const processedPhotos = await this.processPhotos(submission.photos)

      if (processedPhotos.errors.length > 0) {
        result.warnings.push(...processedPhotos.errors)
        log("photo_processing", "warning", `Photo processing warnings: ${processedPhotos.errors.join(", ")}`)
      } else {
        log("photo_processing", "success", `Processed ${processedPhotos.photos.length} photos successfully`)
      }

      // Step 3: Process videos
      log("video_processing", "success", "Starting video processing")
      const processedVideos = await this.processVideos(submission.videos)

      if (processedVideos.errors.length > 0) {
        result.warnings.push(...processedVideos.errors)
        log("video_processing", "warning", `Video processing warnings: ${processedVideos.errors.join(", ")}`)
      } else {
        log("video_processing", "success", `Processed ${processedVideos.videos.length} videos successfully`)
      }

      // Step 4: Create actor object
      log("actor_creation", "success", "Creating actor object")
      const actor = this.createActorFromSubmission(submission, processedPhotos.photos, processedVideos.videos)
      result.actorId = actor.id

      // Step 5: Integrate with casting system
      log("integration", "success", "Integrating with casting system")
      await this.integrateWithCastingSystem(actor, submission)

      log("completion", "success", "Submission processed successfully")
      result.success = true

      // Step 6: Send success notification
      this.sendProcessingNotification(submission, result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      result.errors.push(errorMessage)
      log("error", "error", `Processing failed: ${errorMessage}`)

      // Send error notification
      this.sendErrorNotification(submission, result)
    }

    return result
  }

  // Validate submission data
  private validateSubmission(submission: SubmissionData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields validation
    if (!submission.formData.name?.trim()) {
      errors.push("Actor name is required")
    }

    if (!submission.formData.contactEmail?.trim()) {
      errors.push("Contact email is required")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.formData.contactEmail)) {
      errors.push("Invalid email format")
    }

    if (!submission.characterId) {
      errors.push("Character ID is missing")
    }

    if (!submission.projectId) {
      errors.push("Project ID is missing")
    }

    // Photo validation
    if (submission.photos.length === 0) {
      errors.push("At least one photo is required")
    }

    // Check for duplicate email (this would need to be implemented with actual data access)
    // For now, we'll skip this check in the demo

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Process uploaded photos
  private async processPhotos(photos: SubmissionData["photos"]): Promise<{
    photos: string[]
    errors: string[]
  }> {
    const processedPhotos: string[] = []
    const errors: string[] = []

    for (const photo of photos) {
      try {
        // In a real implementation, you would:
        // 1. Upload to cloud storage (AWS S3, Cloudinary, etc.)
        // 2. Generate optimized versions (thumbnails, different sizes)
        // 3. Return the permanent URLs

        // For demo purposes, we'll use the preview URL
        if (photo.preview) {
          processedPhotos.push(photo.preview)
        } else {
          errors.push(`Failed to process photo: ${photo.id}`)
        }
      } catch (error) {
        errors.push(`Photo processing error for ${photo.id}: ${error}`)
      }
    }

    return { photos: processedPhotos, errors }
  }

  // Process video URLs
  private async processVideos(videos: SubmissionData["videos"]): Promise<{
    videos: Array<{ url: string; embedUrl: string; platform: string }>
    errors: string[]
  }> {
    const processedVideos: Array<{ url: string; embedUrl: string; platform: string }> = []
    const errors: string[] = []

    for (const video of videos) {
      try {
        const embedUrl = this.generateEmbedUrl(video.url, video.platform)
        if (embedUrl) {
          processedVideos.push({
            url: video.url,
            embedUrl,
            platform: video.platform,
          })
        } else {
          errors.push(`Failed to generate embed URL for ${video.platform} video`)
        }
      } catch (error) {
        errors.push(`Video processing error: ${error}`)
      }
    }

    return { videos: processedVideos, errors }
  }

  // Generate embed URLs for videos
  private generateEmbedUrl(url: string, platform: "youtube" | "vimeo"): string | null {
    try {
      if (platform === "youtube") {
        const videoId = this.extractYouTubeId(url)
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null
      } else if (platform === "vimeo") {
        const videoId = this.extractVimeoId(url)
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null
      }
    } catch (error) {
      console.error("Error generating embed URL:", error)
    }
    return null
  }

  private extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  private extractVimeoId(url: string): string | null {
    const patterns = [/vimeo\.com\/(\d+)/, /player\.vimeo\.com\/video\/(\d+)/]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  // Create actor object from submission
  private createActorFromSubmission(
    submission: SubmissionData,
    photos: string[],
    videos: Array<{ url: string; embedUrl: string; platform: string }>,
  ): Actor {
    const actorId = `actor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      id: actorId,
      name: submission.formData.name.trim(),
      age: submission.formData.age || undefined,
      playingAge: submission.formData.playingAge || undefined,
      location: submission.formData.location || undefined,
      agent: submission.formData.agent || undefined,
      gender: submission.formData.gender || undefined,
      ethnicity: submission.formData.ethnicity || undefined,
      contactPhone: submission.formData.contactPhone || undefined,
      contactEmail: submission.formData.contactEmail.trim(),
      skills: submission.formData.skills || [],
      availability: submission.formData.availability || [],
      headshots: photos,
      currentCardHeadshotIndex: 0,
      userVotes: {},
      isSoftRejected: false,
      isGreenlit: false,
      isCast: false,
      currentListKey: "longList",
      statuses: [],
      notes:
        submission.formData.experience || submission.formData.notes
          ? [
              {
                id: `note_${Date.now()}`,
                userId: "system",
                userName: "Form Submission",
                content: [
                  submission.formData.experience && `Experience: ${submission.formData.experience}`,
                  submission.formData.notes && `Notes: ${submission.formData.notes}`,
                ]
                  .filter(Boolean)
                  .join("\n\n"),
                timestamp: Date.now(),
                isPrivate: false,
              },
            ]
          : [],
      dateAdded: Date.now(),
      sortOrder: undefined,
      // Add video data as custom field for now
      submissionVideos: videos,
      submissionId: submission.submissionId,
      submissionSource: "form",
    }
  }

  // Integrate with casting system
  private async integrateWithCastingSystem(actor: Actor, submission: SubmissionData): Promise<void> {
    // This would typically dispatch to the casting context
    // For now, we'll use a custom event to communicate with the main app
    const integrationEvent = new CustomEvent("actorSubmissionProcessed", {
      detail: {
        actor,
        characterId: submission.characterId,
        projectId: submission.projectId,
        submissionId: submission.submissionId,
      },
    })

    window.dispatchEvent(integrationEvent)
  }

  // Send processing notification
  private sendProcessingNotification(submission: SubmissionData, result: ProcessingResult): void {
    const notificationEvent = new CustomEvent("submissionNotification", {
      detail: {
        type: "success",
        title: "New Actor Submission Processed",
        message: `${submission.formData.name} has been successfully added to the casting list`,
        actorId: result.actorId,
        characterId: submission.characterId,
        submissionId: submission.submissionId,
        processingLog: result.processingLog,
      },
    })

    window.dispatchEvent(notificationEvent)
  }

  // Send error notification
  private sendErrorNotification(submission: SubmissionData, result: ProcessingResult): void {
    const notificationEvent = new CustomEvent("submissionNotification", {
      detail: {
        type: "error",
        title: "Submission Processing Failed",
        message: `Failed to process submission from ${submission.formData.name}: ${result.errors.join(", ")}`,
        submissionId: submission.submissionId,
        errors: result.errors,
        processingLog: result.processingLog,
      },
    })

    window.dispatchEvent(notificationEvent)
  }

  // Get processing status
  getProcessingStatus(): {
    isProcessing: boolean
    queueLength: number
  } {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.processingQueue.length,
    }
  }
}

// Export singleton instance
export const submissionProcessor = SubmissionProcessor.getInstance()

interface SubmissionData {
  name: string
  age: number
  gender: string
  email: string
  phone?: string
  photos: string[]
  videos: Array<{
    url: string
    platform: "youtube" | "vimeo"
    title?: string
  }>
  notes?: string
  location?: string
  experience?: string
}

export async function processSubmission(submissionData: SubmissionData, characterId: string): Promise<Actor> {
  try {
    // Validate submission data
    if (!submissionData.name || !submissionData.email) {
      throw new Error("Name and email are required")
    }

    // Process photos - validate URLs and generate thumbnails
    const processedPhotos = await Promise.all(
      submissionData.photos.map(async (photoUrl) => {
        try {
          // Validate image URL
          const response = await fetch(photoUrl, { method: "HEAD" })
          if (!response.ok) {
            throw new Error(`Invalid photo URL: ${photoUrl}`)
          }
          return photoUrl
        } catch (error) {
          console.warn(`Skipping invalid photo: ${photoUrl}`, error)
          return null
        }
      }),
    )

    // Filter out invalid photos
    const validPhotos = processedPhotos.filter(Boolean) as string[]

    // Process videos - validate and extract metadata
    const processedVideos = await Promise.all(
      submissionData.videos.map(async (video) => {
        try {
          // Basic URL validation for YouTube/Vimeo
          const isValidVideo = validateVideoUrl(video.url, video.platform)
          if (!isValidVideo) {
            throw new Error(`Invalid ${video.platform} URL: ${video.url}`)
          }
          return video
        } catch (error) {
          console.warn(`Skipping invalid video: ${video.url}`, error)
          return null
        }
      }),
    )

    // Filter out invalid videos
    const validVideos = processedVideos.filter(Boolean) as typeof submissionData.videos

    // Create new actor object
    const newActor: Actor = {
      id: `actor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: submissionData.name,
      age: submissionData.age,
      gender: submissionData.gender,
      email: submissionData.email,
      phone: submissionData.phone || "",
      photos: validPhotos,
      videos: validVideos.map((video) => ({
        url: video.url,
        platform: video.platform,
        title: video.title || `${video.platform} video`,
      })),
      notes: submissionData.notes || "",
      location: submissionData.location || "",
      experience: submissionData.experience || "",
      status: "submitted",
      tags: ["form-submission"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characterId: characterId,
      submissionSource: "form",
    }

    // Add actor to the character's actor list
    await addActorToCharacter(newActor, characterId)

    return newActor
  } catch (error) {
    console.error("Error processing submission:", error)
    throw error
  }
}

function validateVideoUrl(url: string, platform: "youtube" | "vimeo"): boolean {
  try {
    const urlObj = new URL(url)

    if (platform === "youtube") {
      return urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")
    } else if (platform === "vimeo") {
      return urlObj.hostname.includes("vimeo.com")
    }

    return false
  } catch {
    return false
  }
}

async function addActorToCharacter(actor: Actor, characterId: string): Promise<void> {
  // This would integrate with your state management system
  // For now, we'll dispatch a custom event that the CastingContext can listen to
  const event = new CustomEvent("addActorToCharacter", {
    detail: { actor, characterId },
  })

  window.dispatchEvent(event)
}
