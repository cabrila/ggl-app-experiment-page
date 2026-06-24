// The original source script a project was extracted from. Stored on each
// feature project (scenes, props, locations, characters) so the user can later
// re-download — or, for PDFs, preview — the exact file they uploaded.
//
// `dataUrl` is a base64 data URL of the uploaded file. It is intentionally kept
// out of Firestore writes (see each context's addProject/updateProject, which
// strip `script` before persisting) to avoid the 1MB document limit; it lives
// in memory for the session and in demo-mode localStorage.
export interface ProjectScript {
  /** Original filename, e.g. "Midnight Echo.pdf". */
  name: string
  /** MIME type reported by the browser, e.g. "application/pdf". */
  type: string
  /** Base64 data URL of the uploaded file. */
  dataUrl: string
}
