"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import type { ProjectScript } from "@/types/script"
import { isPdfScript, downloadScript } from "@/lib/scriptFile"
import ScriptViewerModal from "@/components/modals/ScriptViewerModal"

interface ScriptButtonProps {
  /** The original uploaded script. When absent, nothing renders. */
  script?: ProjectScript
  /** Trigger classes so each page keeps its existing look. */
  className?: string
  /** Classes for the label span (controls responsive hide behavior). */
  labelClassName?: string
}

/**
 * Surfaces the original uploaded script a list was extracted from. PDFs open in
 * a preview modal (with a Download button inside); other formats download
 * directly. Renders nothing when the project has no stored script — e.g.
 * manually created lists or older saved projects.
 */
export default function ScriptButton({
  script,
  className = "flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-sans text-sm transition-colors",
  labelClassName = "hidden sm:inline",
}: ScriptButtonProps) {
  const [showViewer, setShowViewer] = useState(false)

  if (!script) return null

  const handleClick = () => {
    if (isPdfScript(script)) {
      setShowViewer(true)
    } else {
      downloadScript(script)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className}
        title={isPdfScript(script) ? "View original script" : "Download original script"}
      >
        <FileText className="w-4 h-4" />
        <span className={labelClassName}>Script</span>
      </button>

      {showViewer && <ScriptViewerModal script={script} onClose={() => setShowViewer(false)} />}
    </>
  )
}
