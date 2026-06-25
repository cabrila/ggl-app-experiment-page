import type { ProjectScript } from "@/types/script"

// A sample script used by the built-in demo projects so the "Script" button is
// visible and functional out of the box. It points at a real PDF served from
// /public, which works as both the <iframe> preview source and the download
// href (same-origin). Real uploads instead store a base64 data URL.
export const DEMO_SCRIPT: ProjectScript = {
  name: "Sample Screenplay.pdf",
  type: "application/pdf",
  dataUrl: "/screenplays/A_Dinner_Party_screenplay.pdf",
}

// Ensures demo projects/bibles carry the sample script so the "Script" button
// shows up. This is applied AFTER loading from localStorage, so demo data that
// was cached before scripts existed still gets the script re-attached. Only
// demo entries are touched, and only when they don't already have a script.
export function ensureDemoScript<T extends { isDemo?: boolean; script?: ProjectScript }>(
  items: T[],
): T[] {
  return items.map((item) =>
    item.isDemo && !item.script ? { ...item, script: DEMO_SCRIPT } : item,
  )
}

// Reads an uploaded File into a ProjectScript (base64 data URL + metadata) so
// it can be stored on a project and later re-downloaded / previewed.
export function fileToProjectScript(file: File): Promise<ProjectScript> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        name: file.name,
        // Browsers sometimes report an empty type for .docx — fall back to the
        // extension so the viewer/download still behave correctly.
        type: file.type || guessTypeFromName(file.name),
        dataUrl: typeof reader.result === "string" ? reader.result : "",
      })
    }
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

function guessTypeFromName(name: string): string {
  if (/\.pdf$/i.test(name)) return "application/pdf"
  if (/\.docx$/i.test(name))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  return "application/octet-stream"
}

// Reconstructs a File from a stored script so it can be fed back into the AI
// extraction pipeline (which expects a File). Works for both base64 data URLs
// (real uploads) and same-origin paths (the demo script).
export async function projectScriptToFile(script: ProjectScript): Promise<File> {
  const res = await fetch(script.dataUrl)
  const blob = await res.blob()
  return new File([blob], script.name, { type: script.type || blob.type })
}

// Whether a stored script is a PDF (and therefore previewable in-browser).
export function isPdfScript(script: ProjectScript): boolean {
  return script.type === "application/pdf" || /\.pdf$/i.test(script.name)
}

// Triggers a browser download of the stored script.
export function downloadScript(script: ProjectScript): void {
  const link = document.createElement("a")
  link.href = script.dataUrl
  link.download = script.name || "script"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
