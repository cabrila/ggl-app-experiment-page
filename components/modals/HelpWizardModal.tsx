"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight, FolderPlus, Users, Layout, Upload, Plus, UserPlus, Settings, Play, Target, List } from 'lucide-react'

interface HelpWizardModalProps {
  onClose: () => void
}

export default function HelpWizardModal({ onClose }: HelpWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Project Creation and User Management",
      icon: <FolderPlus className="w-8 h-8 text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Project Setup and Team Management</h3>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <FolderPlus className="w-4 h-4 mr-2 text-emerald-500" />
              Creating a New Project
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">
                1. Click <span className="font-medium text-emerald-600">Project Manager</span> in the top menu.
              </p>
              <p className="text-sm text-gray-600">
                2. Go to the <span className="font-medium">Overview</span> tab.
              </p>
              <p className="text-sm text-gray-600">
                3. Click <span className="font-medium text-emerald-600">+ New Project</span>.
              </p>
              <p className="text-sm text-gray-600">4. Enter project name and description.</p>
              <p className="text-sm text-gray-600">
                5. Click <span className="font-medium text-emerald-600">Create Project</span>.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <UserPlus className="w-4 h-4 mr-2 text-emerald-500" />
              User Management
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">
                1. Access <span className="font-medium text-emerald-600">User Permissions</span> from Project Manager.
              </p>
              <p className="text-sm text-gray-600">2. Add team members and assign roles.</p>
              <p className="text-sm text-gray-600">3. Use the user selector in the sidebar to switch between users.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-emerald-500" />
              Project Settings
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">
                1. Go to <span className="font-medium">Settings</span> tab in Project Manager.
              </p>
              <p className="text-sm text-gray-600">2. Export project data for backup.</p>
              <p className="text-sm text-gray-600">3. Import project data from JSON files.</p>
              <p className="text-sm text-gray-600">4. Archive or delete projects as needed.</p>
            </div>
          </div>

          <div className="bg-emerald-50 p-3 rounded-md border border-emerald-200">
            <p className="text-xs text-emerald-700">
              <strong>Pro Tip:</strong> Use <span className="font-medium">Load Demo Data</span> in the sidebar to
              explore the application with sample data before creating your own project.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Character Creation and Casting Breakdown",
      icon: <Target className="w-8 h-8 text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Creating Characters and Breakdowns</h3>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Plus className="w-4 h-4 mr-2 text-emerald-500" />
              Adding Characters
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">
                1. Click <span className="font-medium text-emerald-600">+ Create Character</span> in the main view.
              </p>
              <p className="text-sm text-gray-600">2. Fill in character name and description.</p>
              <p className="text-sm text-gray-600">3. Add age range, physical attributes, and role details.</p>
              <p className="text-sm text-gray-600">
                4. Click <span className="font-medium text-emerald-600">Create Character</span>.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Upload className="w-4 h-4 mr-2 text-emerald-500" />
              Importing Characters
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">
                1. Click <span className="font-medium text-emerald-600">Upload Characters</span>.
              </p>
              <p className="text-sm text-gray-600">2. Upload CSV file or paste character data.</p>
              <p className="text-sm text-gray-600">3. Map columns to character fields.</p>
              <p className="text-sm text-gray-600">
                4. Click <span className="font-medium text-emerald-600">Import Characters</span>.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Target className="w-4 h-4 mr-2 text-emerald-500" />
              Casting Breakdown
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">
                1. Click <span className="font-medium text-emerald-600">Casting Breakdown</span> for a character.
              </p>
              <p className="text-sm text-gray-600">2. Review and edit character requirements.</p>
              <p className="text-sm text-gray-600">3. Generate breakdown reports for distribution.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <List className="w-4 h-4 mr-2 text-emerald-500" />
              Character Organization
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">1. Use tabs to organize characters by scenes or importance.</p>
              <p className="text-sm text-gray-600">2. Click + next to tabs to create new character groups.</p>
              <p className="text-sm text-gray-600">3. Rename tabs by right-clicking on them.</p>
            </div>
          </div>

          <div className="bg-emerald-50 p-3 rounded-md border border-emerald-200">
            <p className="text-xs text-emerald-700">
              <strong>Pro Tip:</strong> Create detailed character descriptions early to help with targeted actor
              submissions and more efficient casting decisions.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Actor Card Creation and List Management",
      icon: <Users className="w-8 h-8 text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Managing Actor Cards and Lists</h3>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Plus className="w-4 h-4 mr-2 text-emerald-500" />
              Adding Actor Cards
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">
                1. Select a character and click <span className="font-medium text-emerald-600">+ Add Actor</span>.
              </p>
              <p className="text-sm text-gray-600">2. Fill in actor details (name, contact, physical attributes).</p>
              <p className="text-sm text-gray-600">3. Upload headshots and additional photos.</p>
              <p className="text-sm text-gray-600">4. Add casting notes and set status.</p>
              <p className="text-sm text-gray-600">
                5. Click <span className="font-medium text-emerald-600">Add Actor</span>.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Upload className="w-4 h-4 mr-2 text-emerald-500" />
              Importing Actors
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">
                1. Click <span className="font-medium text-emerald-600">Upload File</span> in character view.
              </p>
              <p className="text-sm text-gray-600">2. Upload CSV or paste actor data.</p>
              <p className="text-sm text-gray-600">3. Map columns to actor fields.</p>
              <p className="text-sm text-gray-600">
                4. Click <span className="font-medium text-emerald-600">Import Actors</span>.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <List className="w-4 h-4 mr-2 text-emerald-500" />
              Managing Lists
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">
                1. Click <span className="font-medium text-emerald-600">+ Add Shortlist</span> to create lists.
              </p>
              <p className="text-sm text-gray-600">2. Name lists (e.g., "Callbacks", "First Choices").</p>
              <p className="text-sm text-gray-600">3. Drag actors between lists to organize them.</p>
              <p className="text-sm text-gray-600">4. Use bulk actions to move multiple actors.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-emerald-500" />
              Sorting and Filtering
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">
                1. Use <span className="font-medium">Sort by</span> dropdown (Alphabetical, Status, Date Added).
              </p>
              <p className="text-sm text-gray-600">2. Search actors by name using the search bar.</p>
              <p className="text-sm text-gray-600">3. Toggle card view settings in the sidebar.</p>
              <p className="text-sm text-gray-600">4. Switch between Grid, Detailed, and List views.</p>
            </div>
          </div>

          <div className="bg-emerald-50 p-3 rounded-md border border-emerald-200">
            <p className="text-xs text-emerald-700">
              <strong>Pro Tip:</strong> Right-click on actor cards for quick actions like editing, moving to another
              character, or contacting the actor directly.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Player View",
      icon: <Play className="w-8 h-8 text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Using Player View for Presentations</h3>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Play className="w-4 h-4 mr-2 text-emerald-500" />
              Opening Player View
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">
                1. Click <span className="font-medium text-emerald-600">Open Player View</span> in the sidebar.
              </p>
              <p className="text-sm text-gray-600">
                2. Use arrow keys or on-screen buttons to navigate between actors.
              </p>
              <p className="text-sm text-gray-600">3. Select different characters from the dropdown menu.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Layout className="w-4 h-4 mr-2 text-emerald-500" />
              View Options
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">1. Toggle between Grid and Slideshow modes.</p>
              <p className="text-sm text-gray-600">2. Use fullscreen mode for presentations.</p>
              <p className="text-sm text-gray-600">3. Adjust slideshow timing and auto-advance settings.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Users className="w-4 h-4 mr-2 text-emerald-500" />
              Interactive Features
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">1. Add notes and feedback during viewing sessions.</p>
              <p className="text-sm text-gray-600">2. Mark actors for callbacks or further consideration.</p>
              <p className="text-sm text-gray-600">3. Access actor details without leaving Player View.</p>
            </div>
          </div>

          <div className="bg-emerald-50 p-3 rounded-md border border-emerald-200">
            <p className="text-xs text-emerald-700">
              <strong>Pro Tip:</strong> Player View is ideal for director meetings and producer presentations. The clean
              interface helps focus on the actors without distractions.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Canvas",
      icon: <Layout className="w-8 h-8 text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Using Canvas for Visual Organization</h3>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Layout className="w-4 h-4 mr-2 text-emerald-500" />
              Canvas Basics
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">
                1. Click <span className="font-medium text-emerald-600">Open Canvas</span> in the sidebar.
              </p>
              <p className="text-sm text-gray-600">2. Drag actors from the character sidebar onto the Canvas.</p>
              <p className="text-sm text-gray-600">3. Use zoom controls to adjust your workspace view.</p>
              <p className="text-sm text-gray-600">4. Pan around by clicking and dragging in empty areas.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Plus className="w-4 h-4 mr-2 text-emerald-500" />
              Creating Groups
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">
                1. Click <span className="font-medium text-emerald-600">+ Create Group</span> on the Canvas.
              </p>
              <p className="text-sm text-gray-600">2. Name your group (e.g., "Option A Cast", "Chemistry Test").</p>
              <p className="text-sm text-gray-600">3. Drag actors into groups to organize them visually.</p>
              <p className="text-sm text-gray-600">4. Resize and move groups as needed.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Target className="w-4 h-4 mr-2 text-emerald-500" />
              Decision-Making Tools
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">1. Compare different casting scenarios side by side.</p>
              <p className="text-sm text-gray-600">2. Visualize ensemble chemistry by grouping actors.</p>
              <p className="text-sm text-gray-600">3. Create multiple Canvas layouts for different options.</p>
              <p className="text-sm text-gray-600">4. Right-click on Canvas elements for additional options.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Users className="w-4 h-4 mr-2 text-emerald-500" />
              Collaboration
            </h4>
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600">1. Use Canvas during team meetings to visualize casting options.</p>
              <p className="text-sm text-gray-600">2. Present different combinations to directors and producers.</p>
              <p className="text-sm text-gray-600">3. Save Canvas layouts for future reference.</p>
            </div>
          </div>

          <div className="bg-emerald-50 p-3 rounded-md border border-emerald-200">
            <p className="text-xs text-emerald-700">
              <strong>Pro Tip:</strong> Use Canvas to explore ensemble chemistry and test different casting combinations
              before making final decisions. Groups help organize different scenarios visually.
            </p>
          </div>
        </div>
      ),
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (index: number) => {
    setCurrentStep(index)
  }

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-4xl w-full max-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">GoGreenlight Casting Help</h2>
        <button onClick={onClose} className="text-white hover:text-emerald-200 transition-colors" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="bg-emerald-50 px-6 py-3">
        <div className="flex items-center justify-between relative">
          {steps.map((step, index) => (
            <button
              key={index}
              onClick={() => handleStepClick(index)}
              className={`flex flex-col items-center group z-10 ${
                index === currentStep ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${
                  index === currentStep
                    ? "bg-emerald-600 text-white"
                    : index < currentStep
                      ? "bg-emerald-200 text-emerald-700"
                      : "bg-gray-200 text-gray-500"
                } ${index !== currentStep && "group-hover:bg-emerald-100"}`}
              >
                {index + 1}
              </div>
              <span
                className={`text-xs text-center max-w-16 leading-tight ${
                  index === currentStep
                    ? "text-emerald-700 font-medium"
                    : index < currentStep
                      ? "text-emerald-600"
                      : "text-gray-500"
                }`}
              >
                {step.title.split(" ").slice(0, 2).join(" ")}
              </span>
            </button>
          ))}

          <div className="absolute left-0 right-0 flex justify-center">
            <div className="h-0.5 bg-gray-200 w-4/5 absolute top-4"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="flex items-center mb-4">
          {steps[currentStep].icon}
          <h3 className="text-xl font-medium text-gray-900 ml-3">{steps[currentStep].title}</h3>
        </div>
        {steps[currentStep].content}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            currentStep === 0
              ? "text-gray-400 cursor-not-allowed"
              : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
          }`}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </button>

        <div className="flex space-x-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? "bg-emerald-600" : "bg-gray-300"
              }`}
            ></div>
          ))}
        </div>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  )
}
