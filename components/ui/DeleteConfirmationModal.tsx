"use client"

import { useEffect, useRef } from "react"
import { AlertTriangle, X } from "lucide-react"

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  itemName: string
  description?: string
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  description,
}: DeleteConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

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

  // Focus trap and click outside to close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      modalRef.current?.focus()
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-md bg-[#1a2e23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Warning Icon */}
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>

          {/* Title */}
          <h2
            id="delete-modal-title"
            className="text-xl font-bold text-white text-center mb-2 font-sans"
          >
            {title}
          </h2>

          {/* Description */}
          <p
            id="delete-modal-description"
            className="text-white/60 text-center text-sm mb-2 font-sans"
          >
            {description || "This action cannot be undone."}
          </p>

          {/* Item Name */}
          <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-6">
            <p className="text-white font-medium text-center truncate font-sans">
              {itemName}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-semibold transition-colors font-sans"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-semibold transition-colors font-sans"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
