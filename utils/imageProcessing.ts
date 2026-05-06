export interface ImageProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: "jpeg" | "png" | "webp"
}

export interface ImageValidationResult {
  isValid: boolean
  error?: string
  file?: File
}

export interface ImageProcessingResult {
  dataUrl: string
  blob: Blob
  dimensions: { width: number; height: number }
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

/**
 * Validates an image file for upload
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check if file exists
  if (!file) {
    return { isValid: false, error: "No file provided" }
  }

  // Check file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff"]

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Please upload: ${allowedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")}`,
    }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB in bytes
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return {
      isValid: false,
      error: `File too large (${sizeMB}MB). Maximum size is 10MB.`,
    }
  }

  // Check minimum file size (1KB)
  const minSize = 1024 // 1KB
  if (file.size < minSize) {
    return {
      isValid: false,
      error: "File too small. Minimum size is 1KB.",
    }
  }

  return { isValid: true, file }
}

/**
 * Processes and optimizes an image file
 */
export function processImage(file: File, options: ImageProcessingOptions = {}): Promise<ImageProcessingResult> {
  const { maxWidth = 800, maxHeight = 1000, quality = 0.85, format = "jpeg" } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        try {
          // Create canvas for image processing
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          if (!ctx) {
            reject(new Error("Failed to create canvas context"))
            return
          }

          // Calculate optimal dimensions while maintaining aspect ratio
          let { width, height } = img
          const aspectRatio = width / height

          // Resize if image is too large
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              width = maxWidth
              height = width / aspectRatio

              // If height is still too large, adjust based on height
              if (height > maxHeight) {
                height = maxHeight
                width = height * aspectRatio
              }
            } else {
              height = maxHeight
              width = height * aspectRatio

              // If width is still too large, adjust based on width
              if (width > maxWidth) {
                width = maxWidth
                height = width / aspectRatio
              }
            }
          }

          // Set canvas dimensions
          canvas.width = Math.round(width)
          canvas.height = Math.round(height)

          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"

          // Draw image with high quality
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          // Convert to blob with specified format and quality
          const mimeType = `image/${format}`

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"))
                return
              }

              // Create data URL for immediate display
              const reader = new FileReader()
              reader.onload = () => {
                const dataUrl = reader.result as string

                const result: ImageProcessingResult = {
                  dataUrl,
                  blob,
                  dimensions: { width: canvas.width, height: canvas.height },
                  originalSize: file.size,
                  compressedSize: blob.size,
                  compressionRatio: Math.round((1 - blob.size / file.size) * 100),
                }

                resolve(result)
              }

              reader.onerror = () => reject(new Error("Failed to create data URL"))
              reader.readAsDataURL(blob)
            },
            mimeType,
            quality,
          )
        } catch (error) {
          reject(new Error(`Image processing failed: ${error instanceof Error ? error.message : "Unknown error"}`))
        }
      }

      img.onerror = () => reject(new Error("Failed to load image. The file may be corrupted."))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

/**
 * Creates a thumbnail from an image file
 */
export function createThumbnail(file: File, size = 150): Promise<string> {
  return processImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.8,
    format: "jpeg",
  }).then((result) => result.dataUrl)
}

/**
 * Extracts image metadata
 */
export function getImageMetadata(file: File): Promise<{
  name: string
  size: number
  type: string
  lastModified: number
  dimensions?: { width: number; height: number }
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        resolve({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          dimensions: { width: img.naturalWidth, height: img.naturalHeight },
        })
      }

      img.onerror = () => {
        // Return metadata without dimensions if image can't be loaded
        resolve({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        })
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error("Failed to read file metadata"))
    reader.readAsDataURL(file)
  })
}

/**
 * Batch process multiple images
 */
export async function processMultipleImages(
  files: File[],
  options: ImageProcessingOptions = {},
  onProgress?: (completed: number, total: number) => void,
): Promise<ImageProcessingResult[]> {
  const results: ImageProcessingResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    // Validate each file
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      throw new Error(`File ${file.name}: ${validation.error}`)
    }

    try {
      const result = await processImage(file, options)
      results.push(result)

      // Report progress
      if (onProgress) {
        onProgress(i + 1, files.length)
      }
    } catch (error) {
      throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return results
}

/**
 * Converts a data URL to a File object
 */
export function dataURLtoFile(dataURL: string, filename: string): File {
  const arr = dataURL.split(",")
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new File([u8arr], filename, { type: mime })
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Checks if the browser supports the File API
 */
export function isFileAPISupported(): boolean {
  return !!(window.File && window.FileReader && window.FileList && window.Blob)
}

/**
 * Checks if the browser supports canvas
 */
export function isCanvasSupported(): boolean {
  const canvas = document.createElement("canvas")
  return !!(canvas.getContext && canvas.getContext("2d"))
}

/**
 * Gets supported image formats for the current browser
 */
export function getSupportedFormats(): string[] {
  const canvas = document.createElement("canvas")
  const formats = ["image/jpeg", "image/png"]

  // Check for WebP support
  if (canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0) {
    formats.push("image/webp")
  }

  return formats
}
