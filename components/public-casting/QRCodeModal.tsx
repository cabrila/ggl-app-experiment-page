"use client"

import { useEffect, useCallback, useRef } from "react"
import { X, Download, Copy, Check } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title: string
}

export default function QRCodeModal({ isOpen, onClose, url, title }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleEscape])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleDownload = () => {
    if (!qrRef.current) return
    
    const svg = qrRef.current.querySelector("svg")
    if (!svg) return

    // Create canvas from SVG
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    
    img.onload = () => {
      canvas.width = 512
      canvas.height = 512
      
      // White background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw QR code
      ctx.drawImage(img, 0, 0, 512, 512)
      
      // Download
      const link = document.createElement("a")
      link.download = `qr-code-${title.toLowerCase().replace(/\s+/g, "-")}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1a4a2a] to-[#0f1f17] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white font-sans">QR Code</h2>
            <p className="text-sm text-white/50 font-sans truncate max-w-[280px]">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code */}
        <div className="p-8 flex flex-col items-center">
          <div 
            ref={qrRef}
            className="bg-white p-4 rounded-xl shadow-lg"
          >
            <QRCodeSVG 
              value={url}
              size={200}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#0f1f17"
            />
          </div>
          
          {/* URL Display */}
          <div className="mt-6 w-full">
            <p className="text-xs text-white/40 font-sans mb-2 text-center">Scan to open casting form</p>
            <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="flex-1 text-sm text-white/70 font-mono truncate">{url}</p>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                title="Copy link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-white/10 flex gap-3">
          <button
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-white font-medium transition-colors font-sans"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium transition-colors font-sans"
          >
            <Download className="w-4 h-4" />
            Download QR
          </button>
        </div>
      </div>
    </div>
  )
}
