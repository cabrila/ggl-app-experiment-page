"use client"

import { useEffect } from "react"
import { X, Download, FileText } from "lucide-react"
import type { ProjectScript } from "@/types/script"
import { downloadScript, isPdfScript } from "@/lib/scriptFile"

interface ScriptViewerModalProps {
  script: ProjectScript
  onClose: () => void
}

/**
 * Previews the original uploaded script. PDFs render inline in an <iframe>;
 * non-previewable formats (e.g. DOCX) show a download prompt instead. A
 * Download button is always available.
 */
export default function ScriptViewerModal({ script, onClose }: ScriptViewerModalProps) {
  const isPdf = isPdfScript(script)

  // Close on Escape, matching the app's other modals.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1a2e23] to-[#152019] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/20">
              <FileText className="h-5 w-5 text-teal-400" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-white font-sans">{script.name}</h2>
              <p className="text-xs text-white/50 font-sans">Original uploaded script</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadScript(script)}
              className="flex items-center gap-2 rounded-lg bg-teal-500 px-3 py-2 text-sm font-sans text-white transition-colors hover:bg-teal-600"
              title="Download script"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-[#0f1f17]">
          {isPdf ? (
            <iframe
              src={script.dataUrl}
              title={`Preview of ${script.name}`}
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <FileText className="h-7 w-7 text-white/50" />
              </div>
              <div>
                <p className="font-sans font-medium text-white">Preview not available</p>
                <p className="mt-1 max-w-sm text-sm text-white/50 font-sans">
                  This file type can&apos;t be previewed in the browser. Download it to view the script.
                </p>
              </div>
              <button
                onClick={() => downloadScript(script)}
                className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 font-sans font-medium text-white transition-colors hover:bg-teal-600"
              >
                <Download className="h-4 w-4" />
                Download Script
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
