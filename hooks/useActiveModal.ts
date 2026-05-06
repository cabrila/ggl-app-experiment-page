"use client"

import { useEffect, useState } from "react"

export type ActiveModalType =
  | "locations"
  | "castingForTV"
  | "productionDesign"
  | "costumes"
  | "props"
  | "schedule"
  | null

/**
 * Hook to detect which modal is currently active
 * Scans the DOM for open modals and returns the active one
 */
export function useActiveModal(): ActiveModalType {
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null)

  useEffect(() => {
    const checkActiveModal = () => {
      // Map of modal data attributes to modal types
      const modalMap: Record<string, ActiveModalType> = {
        "modal-locations": "locations",
        "modal-casting-tv": "castingForTV",
        "modal-production-design": "productionDesign",
        "modal-costumes": "costumes",
        "modal-props": "props",
        "modal-schedule": "schedule",
      }

      // Find all visible modals by checking for elements with data-active-modal attribute
      let detectedModal: ActiveModalType = null

      for (const [attr, modalType] of Object.entries(modalMap)) {
        const element = document.querySelector(`[data-active-modal="${attr}"]`)
        if (element && element.offsetParent !== null) {
          // Element is visible (offsetParent is not null)
          detectedModal = modalType
          break
        }
      }

      setActiveModal(detectedModal)
    }

    // Check immediately
    checkActiveModal()

    // Set up observer for DOM changes
    const observer = new MutationObserver(checkActiveModal)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })

    // Fallback: check periodically in case MutationObserver misses something
    const interval = setInterval(checkActiveModal, 500)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return activeModal
}

/**
 * Get context-aware CoPilot prompts based on active modal
 */
export function getCoPilotContextPrompts(activeModal: ActiveModalType) {
  const contextPrompts: Record<ActiveModalType, Array<{ icon: string; text: string }>> = {
    locations: [
      { icon: "MapPin", text: "How many locations do we need?" },
      { icon: "Building2", text: "Add a new location" },
      { icon: "Map", text: "Show location constraints" },
      { icon: "Search", text: "Find available filming locations" },
    ],
    castingForTV: [
      { icon: "Users", text: "How many actors do we need?" },
      { icon: "User", text: "Find actors for this character" },
      { icon: "Check", text: "Review audition results" },
      { icon: "Calendar", text: "Schedule auditions" },
    ],
    productionDesign: [
      { icon: "Palette", text: "Create a new set design" },
      { icon: "Lightbulb", text: "Plan lighting for this set" },
      { icon: "Hammer2", text: "Track construction progress" },
      { icon: "Image", text: "Add mood board images" },
    ],
    costumes: [
      { icon: "Shirt", text: "Design costume for character" },
      { icon: "ShoppingBag", text: "Create shopping list" },
      { icon: "CheckCircle", text: "Check inventory" },
      { icon: "Scissors", text: "Plan alterations" },
    ],
    props: [
      { icon: "Box", text: "Add new prop" },
      { icon: "ShoppingCart", text: "Purchase request" },
      { icon: "MapPin", text: "Track prop location" },
      { icon: "Search", text: "Search prop database" },
    ],
    schedule: [
      { icon: "Calendar", text: "Add shooting day" },
      { icon: "Clock", text: "Plan timing" },
      { icon: "Users", text: "Assign crew" },
      { icon: "AlertCircle", text: "View scheduling conflicts" },
    ],
    null: [
      { icon: "Sparkles", text: "What do you need help with?" },
      { icon: "Lightbulb", text: "Show me production tips" },
      { icon: "HelpCircle", text: "Get started with Greenlight" },
      { icon: "Settings", text: "Explore project settings" },
    ],
  }

  return contextPrompts[activeModal] || contextPrompts[null]
}

/**
 * Get context-aware CoPilot response template based on active modal
 */
export function getCoPilotContextResponse(activeModal: ActiveModalType, query: string) {
  const responses: Record<ActiveModalType, Record<string, string>> = {
    locations: {
      "How many locations": "Based on your script, I count 5 unique locations needed. Would you like me to help organize them?",
      "Add a location":
        "I can help you add a new location. Start with the location name, then I'll guide you through adding details like address, availability, and facilities.",
      "location constraints": "Your current locations have these constraints: No drilling at Museum, Limited crew access at Park, and Noise restrictions in Residential area.",
      default:
        "I can help you manage your filming locations, check constraints, and organize your location scouting. What would you like to do?",
    },
    castingForTV: {
      "How many actors": "For your TV production, you need to cast 8 lead roles and 12 supporting roles. Would you like to start with leads?",
      "Find actors": "I can help you find actors matching specific criteria. Tell me the character type, age range, and special skills needed.",
      "audition results": "You have 24 actors submitted for auditions. 8 are pending review, 12 completed auditions, and 4 were callbacks.",
      "Schedule auditions": "I can help you schedule auditions efficiently. When would you like to start auditions?",
      default: "I can help you cast your TV production by finding actors, managing auditions, and organizing your cast. What's your next step?",
    },
    productionDesign: {
      "Create a new set": "Let's create a new set design! What's the set name, and which location is it for?",
      "Plan lighting": "I can help plan lighting by analyzing your set's mood, natural light availability, and production requirements.",
      "Track construction": "Your sets are 40% complete overall. Kitchen set is fully dressed, while Control Room is in framing stage.",
      "mood board": "Upload mood board images to establish the visual style. I'll analyze colors and suggest palette options.",
      default:
        "I can assist with set design, lighting plans, construction tracking, and mood boards. What aspect of production design can I help with?",
    },
    costumes: {
      "Design costume": "Let's design a costume! Tell me the character name, the scene or era, and any specific style references.",
      "shopping list": "I can create a shopping list from your costume designs. This helps track fabric, notions, and rental items.",
      "inventory": "Your costume inventory has 45 pieces. 38 are available, 5 are in alterations, and 2 are in storage.",
      "alterations": "I can plan costume alterations based on actor measurements and character requirements. Need any adjustments?",
      default:
        "I can help with costume design, shopping lists, inventory management, and alterations. What would you like to tackle?",
    },
    props: {
      "Add new prop": "Let's add a new prop! Describe the prop, its category, and any special requirements.",
      "Purchase request": "I can create a purchase request for props you need. This tracks costs and vendor information.",
      "track location": "I can help track prop locations across sets and storage. Would you like to update a prop's location?",
      "Search prop": "I can search your prop database by category, keyword, or production phase. What are you looking for?",
      default:
        "I can help you manage props by adding items, creating purchase requests, tracking locations, and searching inventory. What do you need?",
    },
    schedule: {
      "Add shooting day": "Let's add a shooting day! What date, and which scenes are being shot?",
      "Plan timing": "I can help optimize your shooting schedule based on locations, cast availability, and crew requirements.",
      "Assign crew": "I can help assign crew to specific days based on their skills and availability.",
      "scheduling conflicts": "You have 3 scheduling conflicts: Actor unavailable on Day 5, Location blocked on Day 8, and Weather risk on Day 12.",
      default:
        "I can help you plan your production schedule, assign crew, manage locations, and resolve conflicts. What's your scheduling challenge?",
    },
    null: [
      "Welcome to GoGreenlight CoPilot! I can help you with casting, locations, production design, costumes, props, and scheduling. Which area would you like assistance with?",
    ],
  }

  // Try to find a matching response for the query, otherwise return default
  const modalResponses = responses[activeModal]
  if (modalResponses && typeof modalResponses !== "string") {
    for (const [key, response] of Object.entries(modalResponses)) {
      if (query.toLowerCase().includes(key.toLowerCase())) {
        return response
      }
    }
    return modalResponses.default || "How can I assist you?"
  }

  return "How can I assist you?"
}
