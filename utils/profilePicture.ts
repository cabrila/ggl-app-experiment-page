// Helpers for the standard "Profile picture" form field that casting forms
// include by default. Centralizing the label/detection keeps the form,
// submission mapping, and card editing in sync.

import type { CastingCallField } from "@/types/public-casting"

/** The canonical label used for the standard profile picture form field. */
export const PROFILE_PICTURE_LABEL = "Profile picture"

/**
 * Detect whether a form field is the standard profile-picture field. Matches
 * on an image-type field whose label normalizes to "profilepicture" (so
 * "Profile Picture", "profile_picture", etc. all resolve correctly).
 */
export function isProfilePictureField(field: Pick<CastingCallField, "label" | "type">): boolean {
  if (field.type !== "image") return false
  return normalize(field.label) === "profilepicture"
}

/** Pull the profile-picture value out of submitted form data, if present. */
export function getProfilePictureFromData(data: Record<string, string> | undefined): string {
  if (!data) return ""
  for (const [key, value] of Object.entries(data)) {
    if (normalize(key) === "profilepicture" && value && value.trim()) {
      // A single image is stored, but guard against multi-value just in case.
      return value.split("\n")[0].trim()
    }
  }
  return ""
}

function normalize(key: string): string {
  return key.toLowerCase().replace(/[\s_-]+/g, "")
}
