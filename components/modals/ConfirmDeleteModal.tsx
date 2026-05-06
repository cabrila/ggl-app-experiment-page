"use client"

import { X } from "lucide-react"
import { CriticalModalPortal } from "@/components/ui/modal-portal"

interface ConfirmDeleteModalProps {
  onClose: () => void
  title: string
  message: string
  onConfirm: () => void
}

export default function ConfirmDeleteModal({ onClose, title, message, onConfirm }: ConfirmDeleteModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <CriticalModalPortal modalType="confirmDelete" onBackdropClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300">{message}</p>
        </div>

        <div className="flex justify-end space-x-2 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </CriticalModalPortal>
  )
}
