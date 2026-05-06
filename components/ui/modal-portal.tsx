"use client"

import type React from "react"

import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { getModalZIndex, getBackdropZIndex } from "@/utils/zIndex"

interface ModalPortalProps {
  children: React.ReactNode
  modalType: string
  onBackdropClick?: () => void
  className?: string
}

export function ModalPortal({ children, modalType, onBackdropClick, className = "" }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  const backdropZIndex = getBackdropZIndex(modalType)
  const contentZIndex = getModalZIndex(modalType)

  return createPortal(
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 ${className}`}
      style={{ zIndex: backdropZIndex }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onBackdropClick) {
          onBackdropClick()
        }
      }}
    >
      <div style={{ zIndex: contentZIndex }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  )
}

// Special portal for critical modals that must appear above everything
export function CriticalModalPortal({ children, modalType, onBackdropClick }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
      style={{ zIndex: getBackdropZIndex(modalType) }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onBackdropClick) {
          onBackdropClick()
        }
      }}
    >
      <div style={{ zIndex: getModalZIndex(modalType) }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  )
}
