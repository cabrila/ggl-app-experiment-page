"use client"

import { useRef, useState } from "react"
import { ImagePlus, X } from "lucide-react"

interface ProfilePictureFieldProps {
  /** Current image value (data URL or remote URL). Empty string when none. */
  value: string
  /** Called with the new image value, or "" when removed. */
  onChange: (value: string) => void
  /** Accent color used for hover/drag states. */
  accent?: "violet" | "emerald"
  /** Highlight the dropzone as invalid (e.g. required + empty). */
  error?: boolean
  /** Placeholder text shown in the empty state. */
  placeholder?: string
}

/**
 * Reusable profile-picture uploader. Lets the user click to choose a file or
 * drag and drop an image, previews the current image, and supports removing it.
 * Files are read as data URLs so they persist in client-side state.
 */
export default function ProfilePictureField({
  value,
  onChange,
  accent = "violet",
  error = false,
  placeholder,
}: ProfilePictureFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const readFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  const accentActive =
    accent === "emerald" ? "border-emerald-500 bg-emerald-500/10" : "border-violet-500 bg-violet-500/10"
  const accentHover = accent === "emerald" ? "hover:border-emerald-500/50" : "hover:border-violet-500/50"

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        readFile(e.dataTransfer.files?.[0])
      }}
      className={`relative h-40 w-full rounded-lg overflow-hidden cursor-pointer border-2 border-dashed transition-colors group bg-[#0f1f17] ${
        isDragOver ? accentActive : error ? "border-red-500/50" : `border-white/15 ${accentHover}`
      }`}
      title="Click or drag an image to upload"
    >
      {value ? (
        <>
          <img src={value || "/placeholder.svg"} alt="Profile picture" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-sans transition-opacity">
              Click or drag to replace
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange("")
            }}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/40">
          <ImagePlus className="w-7 h-7" />
          <span className="text-sm font-sans text-center px-3">
            {placeholder || "Click or drag an image to upload"}
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => readFile(e.target.files?.[0])}
      />
    </div>
  )
}
