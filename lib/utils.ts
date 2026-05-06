import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates if a string is a valid image URL that can be safely used in an img src attribute.
 * Returns false for undefined, null, empty strings, "undefined", "null", and placeholder.svg URLs.
 */
export function isValidImageUrl(url: string | undefined | null): url is string {
  if (!url) return false
  if (typeof url !== "string") return false
  if (url.trim() === "") return false
  if (url === "undefined" || url === "null") return false
  if (url.includes("placeholder.svg")) return false
  return true
}
