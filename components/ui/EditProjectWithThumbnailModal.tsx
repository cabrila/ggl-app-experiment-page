"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Check, Upload, Image as ImageIcon, Trash2 } from "lucide-react"

interface EditProjectWithThumbnailModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newName: string, thumbnailUrl?: string) => void
  currentName: string
  currentThumbnail?: string
  title: string
  label?: string
  accentColor?: "emerald" | "sky" | "amber" | "violet"
}

export default function EditProjectWithThumbnailModal({
  isOpen,
  onClose,
  onSave,
  currentName,
  currentThumbnail,
  title,
  label = "Project Name",
  accentColor = "emerald",
}: EditProjectWithThumbnailModalProps) {
  const [name, setName] = useState(currentName)
  const [thumbnail, setThumbnail] = useState<string | undefined>(currentThumbnail)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const colorClasses = {
    emerald: {
      border: "border-emerald-500/50",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      button: "bg-emerald-500 hover:bg-emerald-600",
      buttonDisabled: "bg-emerald-500/30",
      focusRing: "focus:border-emerald-500/50 focus:ring-emerald-500/50",
    },
    sky: {
      border: "border-sky-500/50",
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      button: "bg-sky-500 hover:bg-sky-600",
      buttonDisabled: "bg-sky-500/30",
      focusRing: "focus:border-sky-500/50 focus:ring-sky-500/50",
    },
    amber: {
      border: "border-amber-500/50",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      button: "bg-amber-500 hover:bg-amber-600",
      buttonDisabled: "bg-amber-500/30",
      focusRing: "focus:border-amber-500/50 focus:ring-amber-500/50",
    },
    violet: {
      border: "border-violet-500/50",
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      button: "bg-violet-500 hover:bg-violet-600",
      buttonDisabled: "bg-violet-500/30",
      focusRing: "focus:border-violet-500/50 focus:ring-violet-500/50",
    },
  }

  const colors = colorClasses[accentColor]

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(currentName)
      setThumbnail(currentThumbnail)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, currentName, currentThumbnail])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }

    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setThumbnail(result)
      setIsUploading(false)
    }
    reader.onerror = () => {
      alert("Failed to read file")
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSave(name.trim(), thumbnail)
      onClose()
    }
  }

  const hasChanged = name.trim() !== currentName || thumbnail !== currentThumbnail

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-[#1a2e23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="edit-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Title */}
          <h2
            id="edit-modal-title"
            className="text-xl font-bold text-white mb-6 font-sans"
          >
            {title}
          </h2>

          {/* Thumbnail Upload */}
          <div className="mb-5">
            <label className="block text-sm text-white/60 mb-2 font-sans">
              Thumbnail (optional)
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative h-40 rounded-xl border-2 border-dashed transition-all ${
                isDragging
                  ? `${colors.border} ${colors.bg}`
                  : "border-white/20 hover:border-white/40"
              } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
            >
              {thumbnail ? (
                <div className="relative w-full h-full group">
                  <img
                    src={thumbnail}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="Change thumbnail"
                    >
                      <Upload className="w-5 h-5 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnail(undefined)}
                      className="p-3 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors"
                      title="Remove thumbnail"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-sm text-white/50 font-sans">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <div className={`p-4 rounded-full ${colors.bg}`}>
                        <ImageIcon className={`w-8 h-8 ${colors.text}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-white/60 font-sans">
                          Drop an image here or click to upload
                        </p>
                        <p className="text-xs text-white/40 font-sans mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-sm text-white/60 mb-2 font-sans">
              {label}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-1 transition-colors font-sans ${colors.focusRing}`}
              placeholder="Enter name..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-semibold transition-colors font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !hasChanged}
              className={`flex-1 py-3 ${
                !name.trim() || !hasChanged ? colors.buttonDisabled : colors.button
              } disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-colors flex items-center justify-center gap-2 font-sans`}
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
