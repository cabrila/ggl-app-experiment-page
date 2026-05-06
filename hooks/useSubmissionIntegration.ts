"use client"

import { useEffect, useCallback } from "react"
import { useUploadNotifications } from "./useUploadNotifications"
import { processSubmission } from "@/utils/submissionProcessor"

export function useSubmissionIntegration() {
  const { showSuccess, showError, showUploading, updateNotification } = useUploadNotifications()

  const handleSubmissionEvent = useCallback(
    async (event: CustomEvent) => {
      const { submissionData, characterId } = event.detail

      // Show uploading notification
      const notificationId = showUploading("Processing actor submission...")

      try {
        // Process the submission
        await processSubmission(submissionData, characterId)

        // Update to success
        updateNotification(notificationId, {
          type: "success",
          message: "Actor submission processed successfully",
          details: `Added ${submissionData.name} to character list`,
        })
      } catch (error) {
        console.error("Failed to process submission:", error)

        // Update to error
        updateNotification(notificationId, {
          type: "error",
          message: "Failed to process actor submission",
          details: error instanceof Error ? error.message : "Unknown error occurred",
        })
      }
    },
    [showUploading, updateNotification],
  )

  useEffect(() => {
    // Listen for submission events
    window.addEventListener("actorSubmission", handleSubmissionEvent as EventListener)

    return () => {
      window.removeEventListener("actorSubmission", handleSubmissionEvent as EventListener)
    }
  }, [handleSubmissionEvent])
}
