// Helpers for deriving the "extra" fields of a casting submission — i.e. every
// field the actor entered on the casting call form that ISN'T already shown by
// default on the submission/actor card (name, contact, age, notes) and isn't a
// media value (rendered separately as photos/videos).

import { getVideoEmbed, isImageValue, splitMultiValue } from "@/utils/mediaEmbed"

export interface ExtraField {
  key: string
  label: string
  value: string
}

// Keys already surfaced directly on the cards. Compared case-insensitively
// with spaces/underscores stripped so both "playingAge" and "Playing Age Range"
// resolve to the same normalized token.
const STANDARD_KEYS = new Set(
  [
    "name",
    "fullname",
    "email",
    "phone",
    "phonenumber",
    "age",
    "playingage",
    "playingagerange",
    "headshot",
    "headshoturl",
    "notes",
    "additionalnotes",
  ].map((k) => k),
)

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]+/g, "")
}

// Turn a raw field key into a human-readable label.
// "voiceSample" -> "Voice Sample", "reel" -> "Reel". Label-style keys
// (already containing spaces/capitals) are left untouched.
function prettifyLabel(key: string): string {
  if (/[\s/]/.test(key)) return key
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function isMediaValue(value: string): boolean {
  return splitMultiValue(value).some((entry) => isImageValue(entry) || getVideoEmbed(entry) !== null)
}

/**
 * Derive the extra submission fields that should live inside the
 * "More Information" panel. Skips standard fields, media values, and empties.
 */
export function getExtraSubmissionFields(data: Record<string, string> | undefined): ExtraField[] {
  if (!data) return []
  const result: ExtraField[] = []

  for (const [key, value] of Object.entries(data)) {
    if (!value || !String(value).trim()) continue
    if (STANDARD_KEYS.has(normalizeKey(key))) continue
    if (isMediaValue(String(value))) continue
    result.push({ key, label: prettifyLabel(key), value: String(value) })
  }

  return result
}
