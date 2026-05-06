"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RenameTabModalProps {
  show: boolean
  onHide: () => void
  tabKey: string
  tabName: string
  onRename?: (oldKey: string, newKey: string, newName: string) => void
}

const RenameTabModal: React.FC<RenameTabModalProps> = ({ show, onHide, tabKey, tabName, onRename }) => {
  const [newTabName, setNewTabName] = useState(tabName)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!newTabName.trim()) {
      setError("Tab name cannot be empty")
      return
    }

    const newTabKey = newTabName.toLowerCase().replace(/\s+/g, "-")

    // Call the onRename callback if provided
    if (onRename) {
      onRename(tabKey, newTabKey, newTabName)
    }

    onHide()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onHide()
    }
  }

  return (
    <Dialog open={show} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Tab</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tabName" className="text-right">
              Tab Name
            </Label>
            <Input
              id="tabName"
              value={newTabName}
              onChange={(e) => {
                setNewTabName(e.target.value)
                setError(null)
              }}
              className="col-span-3"
              placeholder="Enter new tab name"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onHide}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RenameTabModal
