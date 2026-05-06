"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, X, Loader2 } from "lucide-react"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: number
}

interface CanvasChatbotProps {
  selectedActorCount: number
  totalActorCount: number
  isDisabled: boolean
}

export default function CanvasChatbot({ selectedActorCount, totalActorCount, isDisabled }: CanvasChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && !isDisabled) {
      inputRef.current?.focus()
    }
  }, [isExpanded, isDisabled])

  const generateMockResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()

    // Detect image manipulation requests
    if (lowerMessage.includes("remove") && (lowerMessage.includes("beard") || lowerMessage.includes("facial hair"))) {
      return `I can help you visualize ${selectedActorCount > 0 ? `the selected actor${selectedActorCount > 1 ? "s" : ""}` : "actors"} without facial hair. This would create a clean-shaven version of the headshot${selectedActorCount > 1 ? "s" : ""}, maintaining lighting and composition. Would you like me to proceed with this modification?`
    }

    if (lowerMessage.includes("combine") || lowerMessage.includes("scene") || lowerMessage.includes("together")) {
      const sceneType = lowerMessage.includes("forest")
        ? "forest"
        : lowerMessage.includes("beach")
          ? "beach"
          : lowerMessage.includes("city")
            ? "urban"
            : "custom"
      return `I can create a composite scene with ${selectedActorCount > 0 ? `your ${selectedActorCount} selected actor${selectedActorCount > 1 ? "s" : ""}` : "the actors"} in a ${sceneType} setting. This would place them together in a cohesive environment, adjusting lighting and perspective to match. The result would help visualize their on-screen chemistry and physical dynamics.`
    }

    if (lowerMessage.includes("age") || lowerMessage.includes("older") || lowerMessage.includes("younger")) {
      return `I can simulate age progression or regression for ${selectedActorCount > 0 ? `the selected actor${selectedActorCount > 1 ? "s" : ""}` : "actors"}. This helps visualize how they might appear at different life stages for your production needs. Would you like to specify a target age range?`
    }

    if (lowerMessage.includes("costume") || lowerMessage.includes("wardrobe") || lowerMessage.includes("outfit")) {
      return `I can help visualize ${selectedActorCount > 0 ? `your selected actor${selectedActorCount > 1 ? "s" : ""}` : "actors"} in different costumes or period-appropriate attire. This is useful for historical productions or character development. What style or era are you considering?`
    }

    if (lowerMessage.includes("hair") && (lowerMessage.includes("color") || lowerMessage.includes("style"))) {
      return `I can modify hair color and style for ${selectedActorCount > 0 ? `the selected actor${selectedActorCount > 1 ? "s" : ""}` : "actors"}. This helps explore different looks without requiring physical changes. What hair modifications would you like to see?`
    }

    if (lowerMessage.includes("lighting") || lowerMessage.includes("mood") || lowerMessage.includes("atmosphere")) {
      return `I can adjust the lighting and mood of ${selectedActorCount > 0 ? `your selected headshot${selectedActorCount > 1 ? "s" : ""}` : "the headshots"} to match different atmospheric conditions - dramatic, soft, noir, bright, etc. This helps visualize how actors might appear in various production settings.`
    }

    if (lowerMessage.includes("background") || lowerMessage.includes("backdrop")) {
      return `I can change or remove the background for ${selectedActorCount > 0 ? `the selected actor${selectedActorCount > 1 ? "s" : ""}` : "actors"}, placing them in different environments or creating clean cutouts. This is useful for promotional materials or scene visualization.`
    }

    if (lowerMessage.includes("side by side") || lowerMessage.includes("compare")) {
      return `I can create a side-by-side comparison layout for ${selectedActorCount > 0 ? `your ${selectedActorCount} selected actor${selectedActorCount > 1 ? "s" : ""}` : "the actors"}, making it easy to evaluate physical characteristics, expressions, and overall presence. This helps with final casting decisions.`
    }

    // Generic helpful response
    return `I can help you visualize modifications to ${selectedActorCount > 0 ? `your ${selectedActorCount} selected actor${selectedActorCount > 1 ? "s" : ""}` : "the actors on the canvas"}. Try asking me to:\n\n• Remove or add facial features (beard, glasses, etc.)\n• Combine actors into a scene\n• Adjust age, hair, or styling\n• Change lighting or backgrounds\n• Create comparison layouts\n\nWhat would you like to explore?`
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isDisabled || isProcessing) return

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      type: "user",
      content: inputValue.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsProcessing(true)

    // Simulate AI processing delay
    setTimeout(
      () => {
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          type: "assistant",
          content: generateMockResponse(userMessage.content),
          timestamp: Date.now(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        setIsProcessing(false)
      },
      1000 + Math.random() * 1000,
    ) // 1-2 second delay
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = () => {
    setMessages([])
  }

  return (
    <div
      className={`absolute left-0 right-0 bottom-12 mx-auto w-full max-w-2xl px-12 transition-all duration-300 z-10 ${
        isExpanded ? "h-96" : "h-16"
      } flex flex-col`}
      style={{
        // Ensure the box expands upward smoothly
        transformOrigin: "bottom center",
      }}
    >
      <div className={`w-full border border-gray-200 rounded-2xl shadow-lg bg-white ${isDisabled ? "opacity-60" : ""}`}>
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-pointer transition-colors ${
            isDisabled ? "bg-gray-50 cursor-not-allowed" : "hover:bg-emerald-50/50"
          }`}
          onClick={() => !isDisabled && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg transition-all ${
                isDisabled
                  ? "bg-gray-200"
                  : "bg-gradient-to-br from-emerald-500 to-green-600 shadow-md shadow-emerald-200"
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isDisabled ? "text-gray-400" : "text-white"}`} />
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${isDisabled ? "text-gray-400" : "text-gray-800"}`}>
                Modify Images with AI
              </h3>
              <p className={`text-xs ${isDisabled ? "text-gray-300" : "text-gray-500"}`}>
                {isDisabled
                  ? "Add actors to canvas to enable"
                  : selectedActorCount > 0
                    ? `${selectedActorCount} actor${selectedActorCount > 1 ? "s" : ""} selected`
                    : `${totalActorCount} actor${totalActorCount > 1 ? "s" : ""} on canvas`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {messages.length > 0 && !isDisabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearChat()
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Clear chat"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
            <button
              className={`text-xs font-medium ${isDisabled ? "text-gray-400" : "text-emerald-600"}`}
              disabled={isDisabled}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>

        {/* Chat Messages Area */}
        {isExpanded && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-emerald-50/30 to-white">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-4 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full mb-3 shadow-lg shadow-emerald-200/50">
                    <Sparkles className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Modify Images with AI</h4>
                  <p className="text-sm text-gray-600 max-w-md">
                    Ask me to modify actor images, create composite scenes, or visualize different looks. I can help you
                    explore creative possibilities for your casting decisions.
                  </p>
                  <div className="mt-4 text-xs text-gray-500 space-y-1">
                    <div>💡 Try: "Remove the beard from this actor"</div>
                    <div>💡 Try: "Combine these actors in a forest scene"</div>
                    <div>💡 Try: "Show them with different hair colors"</div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.type === "user"
                            ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-200"
                            : "bg-white border border-gray-200 text-gray-800"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.type === "user" ? "text-emerald-100" : "text-gray-400"}`}>
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-emerald-200 rounded-lg px-4 py-3 flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                        <span className="text-sm text-gray-600">Processing your request...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-3 bg-white">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isDisabled ? "Add actors to canvas to enable..." : "Ask me to modify images or create scenes..."
                  }
                  disabled={isDisabled || isProcessing}
                  className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm ${
                    isDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isDisabled || isProcessing}
                  className={`p-2 rounded-lg transition-all ${
                    !inputValue.trim() || isDisabled || isProcessing
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-br from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-md shadow-emerald-200"
                  }`}
                  title="Send message"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {isDisabled
                  ? "This is a mockup feature. Add actors to the canvas to enable the AI assistant."
                  : "This is a mockup feature demonstrating AI-powered image manipulation capabilities."}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
