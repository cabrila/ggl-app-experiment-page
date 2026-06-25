"use client"

import { useRef, useState } from "react"
import { ImagePlus, X } from "lucide-react"

type Accent = "rose" | "amber" | "emerald" | "violet"

interface ImageUploadFieldProps {
  /** Current image values (data URLs or remote URLs). */
  value: string[]
  /** Called with the updated list of image values. */
  onChange: (value: string[]) => void
  /** Allow more than one image (renders a thumbnail grid). */
  multiple?: boolean
  /** Accent color used for hover/drag states. */
  accent?: Accent
  /** Placeholder text shown in the empty state. */
  placeholder?: string
  /** Optional click handler for an existing thumbnail (e.g. open a carousel). */
  onPreview?: (index: number) => void
}

const ACCENT_ACTIVE: Record<Accent, string> = {
  rose: "border-rose-500 bg-rose-500/10",
  amber: "border-amber-500 bg-amber-500/10",
  emerald: "border-emerald-500 bg-emerald-500/10",
  violet: "border-violet-500 bg-violet-500/10",
}

const ACCENT_HOVER: Record<Accent, string> = {
  rose: "hover:border-rose-500/50",
  amber: "hover:border-amber-500/50",
  emerald: "hover:border-emerald-500/50",
  violet: "hover:border-violet-500/50",
}

/**
 * Reusable image uploader supporting click-to-choose and drag-and-drop. Reads
 * files as data URLs so they persist in client-side state. When `multiple` is
 * true it renders a thumbnail grid with an add tile; otherwise a single large
 * dropzone like a cover image.
 */
export default function ImageUploadField({
  value,
  onChange,
  multiple = false,
  accent = "emerald",
  placeholder,
  onPreview,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const readFiles = (files: FileList | null | undefined) => {
    if (!files || files.length === 0) return
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (images.length === 0) return

    if (!multiple) {
      const reader = new FileReader()
      reader.onload = () => onChange([reader.result as string])
      reader.readAsDataURL(images[0])
      return
    }

    // Read all selected files, preserving order, then append to existing.
    Promise.all(
      images.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          }),
      ),
    ).then((dataUrls) => onChange([...value, ...dataUrls]))
  }

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  const openPicker = () => inputRef.current?.click()

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      multiple={multiple}
      className="hidden"
      onChange={(e) => {
        readFiles(e.target.files)
        // Reset so selecting the same file again re-triggers onChange.
        e.target.value = ""
      }}
    />
  )

  // Single-image mode: one large dropzone (cover-style).
  if (!multiple) {
    const single = value[0] || ""
    return (
      <div
        onClick={openPicker}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
          readFiles(e.dataTransfer.files)
        }}
        className={`relative h-40 w-full rounded-lg overflow-hidden cursor-pointer border-2 border-dashed transition-colors group bg-[#0f1f17] ${
          isDragOver ? ACCENT_ACTIVE[accent] : `border-white/15 ${ACCENT_HOVER[accent]}`
        }`}
        title="Click or drag an image to upload"
      >
        {single ? (
          <>
            <img
              src={single || "/placeholder.svg"}
              alt="Reference"
              className="w-full h-full object-cover"
              onClick={(e) => {
                if (onPreview) {
                  e.stopPropagation()
                  onPreview(0)
                }
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeAt(0)
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
        {hiddenInput}
      </div>
    )
  }

  // Multi-image mode: thumbnail grid + add tile.
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        readFiles(e.dataTransfer.files)
      }}
      className={`grid grid-cols-3 gap-3 p-3 rounded-lg border-2 border-dashed transition-colors bg-[#0f1f17] ${
        isDragOver ? ACCENT_ACTIVE[accent] : "border-white/15"
      }`}
    >
      {value.map((img, idx) => (
        <div
          key={idx}
          className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group bg-[#1a2e23]"
        >
          <img
            src={img || "/placeholder.svg"}
            alt={`Reference ${idx + 1}`}
            className={`w-full h-full object-cover ${onPreview ? "cursor-zoom-in" : ""}`}
            onClick={() => onPreview?.(idx)}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeAt(idx)
            }}
            className="absolute top-1.5 right-1.5 p-1 bg-black/50 hover:bg-black/70 rounded-md text-white transition-colors opacity-0 group-hover:opacity-100"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={openPicker}
        className={`aspect-square rounded-lg border-2 border-dashed border-white/15 ${ACCENT_HOVER[accent]} flex flex-col items-center justify-center gap-1.5 text-white/40 hover:text-white/60 transition-colors`}
        title="Click or drag images to upload"
      >
        <ImagePlus className="w-6 h-6" />
        <span className="text-xs font-sans text-center px-2">{placeholder || "Add image"}</span>
      </button>

      {hiddenInput}
    </div>
  )
}
