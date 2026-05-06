"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import RenameTabModal from "@/components/modals/RenameTabModal"

interface Tab {
  key: string
  name: string
}

export default function RenameTabModalTest() {
  const [showModal, setShowModal] = useState(false)
  const [selectedTab, setSelectedTab] = useState<Tab | null>(null)
  const [tabs, setTabs] = useState<Tab[]>([
    { key: "long-list", name: "Long List" },
    { key: "audition", name: "Audition" },
    { key: "shortlists", name: "Shortlists" },
    { key: "custom-tab-1", name: "Custom Tab 1" },
    { key: "custom-tab-2", name: "Custom Tab 2" },
  ])
  const [renameHistory, setRenameHistory] = useState<
    Array<{
      timestamp: string
      oldKey: string
      oldName: string
      newKey: string
      newName: string
    }>
  >([])

  const handleRenameTab = (tabToRename: Tab) => {
    setSelectedTab(tabToRename)
    setShowModal(true)
  }

  const handleRename = (oldKey: string, newKey: string, newName: string) => {
    const oldTab = tabs.find((tab) => tab.key === oldKey)
    if (!oldTab) return

    // Update the tabs array
    setTabs((prevTabs) => prevTabs.map((tab) => (tab.key === oldKey ? { key: newKey, name: newName } : tab)))

    // Add to rename history
    setRenameHistory((prev) => [
      {
        timestamp: new Date().toLocaleTimeString(),
        oldKey,
        oldName: oldTab.name,
        newKey,
        newName,
      },
      ...prev,
    ])

    console.log(`Tab renamed: ${oldKey} (${oldTab.name}) -> ${newKey} (${newName})`)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedTab(null)
  }

  const clearHistory = () => {
    setRenameHistory([])
  }

  const resetTabs = () => {
    setTabs([
      { key: "long-list", name: "Long List" },
      { key: "audition", name: "Audition" },
      { key: "shortlists", name: "Shortlists" },
      { key: "custom-tab-1", name: "Custom Tab 1" },
      { key: "custom-tab-2", name: "Custom Tab 2" },
    ])
    setRenameHistory([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              RenameTabModal Test Component
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  Clear History
                </Button>
                <Button variant="outline" size="sm" onClick={resetTabs}>
                  Reset Tabs
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Click on any tab below to test the rename functionality. The modal should open, allow you to change the
              name, and update the tab when you save.
            </p>

            {/* Current Tabs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Tabs</h3>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.key}
                    variant="outline"
                    onClick={() => handleRenameTab(tab)}
                    className="flex items-center gap-2 hover:bg-blue-50"
                  >
                    <span>{tab.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {tab.key}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Test Scenarios */}
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold">Test Scenarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium text-green-700 mb-2">✅ Valid Tests</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Rename with normal text</li>
                    <li>• Rename with spaces (should convert to kebab-case)</li>
                    <li>• Rename with special characters</li>
                    <li>• Rename with numbers</li>
                  </ul>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium text-red-700 mb-2">❌ Error Tests</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Try to save with empty name</li>
                    <li>• Try to save with only spaces</li>
                    <li>• Cancel the modal</li>
                    <li>• Close modal with X button</li>
                  </ul>
                </Card>
              </div>
            </div>

            {/* Rename History */}
            {renameHistory.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold">Rename History</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {renameHistory.map((entry, index) => (
                    <Card key={index} className="p-3 bg-green-50 border-green-200">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {entry.timestamp}
                          </Badge>
                          <span className="text-gray-600">
                            <code className="bg-gray-100 px-1 rounded">{entry.oldKey}</code> ({entry.oldName}) →{" "}
                            <code className="bg-gray-100 px-1 rounded">{entry.newKey}</code> ({entry.newName})
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Testing Instructions</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Click on any tab button above to open the rename modal</li>
                <li>2. Try different input scenarios (valid names, empty names, etc.)</li>
                <li>3. Check that the tab updates correctly after saving</li>
                <li>4. Verify that the key is generated correctly (lowercase, hyphens)</li>
                <li>5. Test canceling and closing the modal</li>
                <li>6. Check the rename history to see all changes</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
        {selectedTab && (
          <RenameTabModal
            show={showModal}
            onHide={handleCloseModal}
            tabKey={selectedTab.key}
            tabName={selectedTab.name}
            onRename={handleRename}
          />
        )}
      </div>
    </div>
  )
}
