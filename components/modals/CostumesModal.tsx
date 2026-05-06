"use client"

import { useState, useCallback, useRef, useMemo, useEffect } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal } from "./ModalManager"
import ModalHeader from "@/components/layout/ModalHeader"
import FloatingSidebar from "@/components/layout/FloatingSidebar"
import EmbeddedCoPilot from "@/components/copilot/EmbeddedCoPilot"
import { compressImage } from "@/utils/imageCompression"
import { isValidImageUrl } from "@/lib/utils"
import type {
  Actor,
  Character,
  ProjectCostumes,
  CostumeInventoryItem,
  CostumeLook,
  CostumeShoppingItem,
  ActorMeasurements,
  ActorHMUSpecs,
  CostumeItemType,
  CostumeItemStatus,
} from "@/types/casting"
import {
  X,
  Plus,
  Search,
  Grid3X3,
  List,
  Shirt,
  Scissors,
  ShoppingBag,
  Layout,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Upload,
  Trash2,
  Pencil,
  AlertTriangle,
  Camera,
  Eye,
  MoreVertical,
  User,
  Palette,
  Ruler,
  Package,
  ArrowRight,
  Check,
  ImageIcon,
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  HelpCircle,
  MessageSquare,
  Send,
  Home,
} from "lucide-react"
import type { PropVote, PropComment } from "@/types/casting"

type VoteValue = "yes" | "no" | "maybe"

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function uid() {
  return Math.random().toString(36).slice(2, 11)
}

/** Get the cast actor for a character across ALL lists */
function getCastActorForCharacter(character: Character): Actor | null {
  const allActors: Actor[] = [
    ...(character.actors.longList as Actor[]),
    ...(character.actors.audition as Actor[]),
    ...(character.actors.approval as Actor[]),
    ...(character.actors.shortLists?.flatMap((sl) => sl.actors) || []),
  ]
  return allActors.find((a) => a.isCast) || null
}

/** Get all actors across all lists for a character */
function getAllActorsForCharacter(character: Character): Actor[] {
  return [
    ...(character.actors.longList as Actor[]),
    ...(character.actors.audition as Actor[]),
    ...(character.actors.approval as Actor[]),
    ...(character.actors.shortLists?.flatMap((sl) => sl.actors) || []),
  ]
}

const VIBE_TAGS = [
  "Formal",
  "Casual",
  "Distressed",
  "Bloody",
  "Futuristic",
  "Period",
  "Military",
  "Athletic",
  "Elegant",
  "Rugged",
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Romantic",
  "Uniform",
]

const MAKEUP_TAGS = [
  "Natural",
  "Glamour",
  "SFX",
  "Aging",
  "Bruising",
  "Prosthetic",
  "Fantasy",
  "Period",
  "Horror",
  "Bloody",
  "Beauty",
  "Corrective",
  "Bald Cap",
  "Wig",
  "Tattoo Cover",
]

const STATUS_COLORS: Record<CostumeItemStatus, { bg: string; text: string; label: string }> = {
  "in-stock": { bg: "bg-emerald-100", text: "text-emerald-700", label: "In Stock" },
  rented: { bg: "bg-blue-100", text: "text-blue-700", label: "Rented" },
  purchased: { bg: "bg-teal-100", text: "text-teal-700", label: "Purchased" },
  "on-set": { bg: "bg-amber-100", text: "text-amber-700", label: "On Set" },
  "at-cleaners": { bg: "bg-purple-100", text: "text-purple-700", label: "At Cleaners" },
  damaged: { bg: "bg-red-100", text: "text-red-700", label: "Damaged" },
}

const ITEM_TYPES: Record<CostumeItemType, string> = {
  "costume-piece": "Costume Piece",
  "hmu-consumable": "HMU Consumable",
  durable: "Durable (Wig, Prosthetic)",
}

function emptyProjectCostumes(): ProjectCostumes {
  return { actorSpecs: {}, inventory: [], looks: [], shoppingList: [] }
}

/* ================================================================== */
/*  Comprehensive mock data seeder                                     */
/* ================================================================== */

function generateMockCostumesData(characters: Character[]): ProjectCostumes {
  /* ---- Actor specs keyed by cast-actor IDs ---- */
  const actorSpecs: ProjectCostumes["actorSpecs"] = {}
  const charActorPairs: { character: Character; actor: Actor | null }[] = characters.map((ch) => ({
    character: ch,
    actor: getCastActorForCharacter(ch),
  }))

  // Predefined measurement sets (realistic, varied)
  const MEASUREMENT_SETS: { measurements: ActorMeasurements; hmuSpecs: ActorHMUSpecs }[] = [
    {
      measurements: { chest: "40\"", waist: "32\"", inseam: "32\"", hat: "7 1/4", ring: "10", glove: "L", shoe: "10.5 US" },
      hmuSpecs: { skinToneCode: "MAC NC35", hairType: "Straight, thick", hairColor: "Dark brown", allergies: ["Latex", "Spirit gum"], tattoos: [{ location: "Left forearm", coverUpNeeded: true }, { location: "Upper back", coverUpNeeded: false }] },
    },
    {
      measurements: { chest: "34\"", waist: "26\"", inseam: "30\"", hat: "7", ring: "6", glove: "S", shoe: "7 US" },
      hmuSpecs: { skinToneCode: "MAC NW25", hairType: "Wavy, fine", hairColor: "Auburn", allergies: ["Wool"], tattoos: [] },
    },
    {
      measurements: { chest: "44\"", waist: "36\"", inseam: "34\"", hat: "7 3/8", ring: "11", glove: "XL", shoe: "12 US" },
      hmuSpecs: { skinToneCode: "MAC NC45", hairType: "Coiled, dense", hairColor: "Black", allergies: [], tattoos: [{ location: "Right bicep", coverUpNeeded: true }] },
    },
    {
      measurements: { chest: "36\"", waist: "28\"", inseam: "31\"", hat: "7 1/8", ring: "7", glove: "M", shoe: "8.5 US" },
      hmuSpecs: { skinToneCode: "MAC NC20", hairType: "Straight, thin", hairColor: "Blonde", allergies: ["Nickel", "Adhesive remover"], tattoos: [{ location: "Ankle", coverUpNeeded: false }] },
    },
    {
      measurements: { chest: "42\"", waist: "34\"", inseam: "33\"", hat: "7 1/4", ring: "10.5", glove: "L", shoe: "11 US" },
      hmuSpecs: { skinToneCode: "MAC NC30", hairType: "Wavy, medium", hairColor: "Salt & pepper", allergies: ["Eyelash adhesive"], tattoos: [] },
    },
    {
      measurements: { chest: "38\"", waist: "30\"", inseam: "29\"", hat: "6 7/8", ring: "7.5", glove: "M", shoe: "9 US" },
      hmuSpecs: { skinToneCode: "MAC NW40", hairType: "Curly, thick", hairColor: "Dark brown", allergies: [], tattoos: [{ location: "Wrist", coverUpNeeded: true }, { location: "Collarbone", coverUpNeeded: true }] },
    },
  ]

  charActorPairs.forEach(({ actor }, idx) => {
    if (actor) {
      const specSet = MEASUREMENT_SETS[idx % MEASUREMENT_SETS.length]
      actorSpecs[actor.id] = specSet
    }
  })

  /* ---- Inventory items (30+ realistic wardrobe & HMU items) ---- */
  const inventory: CostumeInventoryItem[] = [
    // Hero costumes
    { id: "ci-001", name: "Navy Three-Piece Suit", type: "costume-piece", status: "in-stock", brand: "Tom Ford", size: "40R", purchasePrice: "$3,200", vendor: "Western Costume Co.", imageUrl: "", vibeTags: ["Formal", "Elegant"], notes: "Peak lapel, slim fit. Button stance slightly high.", rentReturnDate: undefined },
    { id: "ci-002", name: "Distressed Leather Jacket", type: "costume-piece", status: "on-set", brand: "Schott NYC", size: "L", purchasePrice: "$850", vendor: "Prop House LA", imageUrl: "", vibeTags: ["Rugged", "Distressed", "Casual"], notes: "Pre-aged with sandpaper on elbows and collar" },
    { id: "ci-003", name: "White Silk Blouse", type: "costume-piece", status: "in-stock", brand: "Equipment", size: "S", purchasePrice: "$320", vendor: "Nordstrom", imageUrl: "", vibeTags: ["Elegant", "Formal"], notes: "French cuffs, mother of pearl buttons" },
    { id: "ci-004", name: "Victorian Corset", type: "costume-piece", status: "rented", brand: "Period Corsets UK", size: "28\"", purchasePrice: "$180/week", vendor: "Angels Costumes London", imageUrl: "", vibeTags: ["Period", "Elegant"], rentReturnDate: "2026-04-15", notes: "Steel-boned, requires dresser assistance" },
    { id: "ci-005", name: "Military Dress Uniform", type: "costume-piece", status: "in-stock", brand: "Custom Build", size: "42R", purchasePrice: "$1,400", vendor: "In-House Tailor", imageUrl: "", vibeTags: ["Military", "Formal", "Period"], notes: "WWII era US Army Colonel. Ribbons and insignia included." },
    { id: "ci-006", name: "Futuristic Bodysuit", type: "costume-piece", status: "in-stock", brand: "Custom Build", size: "M", purchasePrice: "$2,800", vendor: "Ironhead Studio", imageUrl: "", vibeTags: ["Futuristic", "Sci-Fi"], notes: "Neoprene base with 3D-printed armor plates. LED rigging ready." },
    { id: "ci-007", name: "Blood-Stained Lab Coat", type: "costume-piece", status: "at-cleaners", brand: "N/A", size: "L", purchasePrice: "$45", vendor: "Amazon", imageUrl: "", vibeTags: ["Bloody", "Horror"], notes: "Multiple blood applications on chest and sleeves. Matching backup in stock." },
    { id: "ci-008", name: "Cashmere Overcoat", type: "costume-piece", status: "in-stock", brand: "Max Mara", size: "M", purchasePrice: "$2,100", vendor: "Western Costume Co.", imageUrl: "", vibeTags: ["Elegant", "Formal"], notes: "Camel color. Dry clean only." },
    { id: "ci-009", name: "Wrestling Singlet", type: "costume-piece", status: "in-stock", brand: "Nike", size: "L", purchasePrice: "$85", vendor: "Sports Authority", imageUrl: "", vibeTags: ["Athletic"], notes: "Red and white team colors" },
    { id: "ci-010", name: "Ballroom Gown", type: "costume-piece", status: "rented", brand: "Custom Build", size: "4", purchasePrice: "$350/week", vendor: "Angels Costumes London", imageUrl: "", vibeTags: ["Elegant", "Romantic", "Period"], rentReturnDate: "2026-05-01", notes: "Emerald green taffeta, hand-beaded bodice. Handle with extreme care." },
    { id: "ci-011", name: "Tactical Vest & Pants", type: "costume-piece", status: "on-set", brand: "5.11 Tactical", size: "L", purchasePrice: "$420", vendor: "Mil-Spec Surplus", imageUrl: "", vibeTags: ["Military", "Rugged"], notes: "Khaki, with functional pouches and radio holster" },
    { id: "ci-012", name: "Wizard Robe", type: "costume-piece", status: "in-stock", brand: "Custom Build", size: "One Size", purchasePrice: "$600", vendor: "In-House Tailor", imageUrl: "", vibeTags: ["Fantasy", "Period"], notes: "Deep purple velvet with gold embroidery, hidden pockets for wand rig" },
    { id: "ci-013", name: "Denim Jeans (Hero)", type: "costume-piece", status: "in-stock", brand: "Levi's 501", size: "32x32", purchasePrice: "$68", vendor: "Levi's Store", imageUrl: "", vibeTags: ["Casual", "Rugged"], notes: "Medium wash. Pre-distressed at knees to match Scene 14." },
    { id: "ci-014", name: "Running Sneakers", type: "costume-piece", status: "in-stock", brand: "Nike Pegasus", size: "10.5 US", purchasePrice: "$130", vendor: "Nike.com", imageUrl: "", vibeTags: ["Athletic", "Casual"], notes: "White/volt. Bought 3 identical pairs for continuity." },
    { id: "ci-015", name: "Chef Whites Set", type: "costume-piece", status: "in-stock", brand: "Chef Works", size: "M", purchasePrice: "$95", vendor: "Chef Works Direct", imageUrl: "", vibeTags: ["Uniform", "Casual"], notes: "Double-breasted jacket, checked pants, toque. All cotton." },

    // HMU Consumables
    { id: "ci-016", name: "Silicone Prosthetic - Scar", type: "hmu-consumable", status: "in-stock", brand: "RBFX", size: "Medium", purchasePrice: "$125", vendor: "Kryolan Pro", imageUrl: "", vibeTags: ["Horror", "Distressed"], notes: "Forehead scar, pre-painted. 4 applications per piece." },
    { id: "ci-017", name: "HD Foundation Kit", type: "hmu-consumable", status: "in-stock", brand: "Kryolan", size: "N/A", purchasePrice: "$340", vendor: "Kryolan Pro", imageUrl: "", vibeTags: [], notes: "16 shades. Includes NC20-NC50 range for principal cast." },
    { id: "ci-018", name: "Breakaway Blood (Gallons x3)", type: "hmu-consumable", status: "in-stock", brand: "Reel Creations", size: "1 gal each", purchasePrice: "$180", vendor: "Alcone NYC", imageUrl: "", vibeTags: ["Bloody", "Horror"], notes: "Washable formula. Non-staining on most fabrics." },
    { id: "ci-019", name: "Aging Stipple Kit", type: "hmu-consumable", status: "in-stock", brand: "Ben Nye", size: "N/A", purchasePrice: "$75", vendor: "Camera Ready Cosmetics", imageUrl: "", vibeTags: ["Period"], notes: "Latex-based -- CHECK ACTOR ALLERGIES before use" },
    { id: "ci-020", name: "Tattoo Cover Pro Palette", type: "hmu-consumable", status: "in-stock", brand: "Dermablend", size: "N/A", purchasePrice: "$52", vendor: "Sephora Pro", imageUrl: "", vibeTags: [], notes: "Heavy coverage, waterproof. For tattoo cover-ups." },

    // Durables (Wigs, Prosthetics)
    { id: "ci-021", name: "Lace-Front Wig - Long Black", type: "durable", status: "in-stock", brand: "Wig America", size: "Medium cap", purchasePrice: "$680", vendor: "Bob Kelly Wig Creations", imageUrl: "", vibeTags: ["Elegant", "Fantasy"], notes: "Human hair. Heat-safe up to 350F. Requires daily maintenance." },
    { id: "ci-022", name: "Bald Cap Kit (x6)", type: "durable", status: "in-stock", brand: "Kryolan", size: "Standard", purchasePrice: "$240", vendor: "Kryolan Pro", imageUrl: "", vibeTags: ["Sci-Fi"], notes: "Vinyl caps. Edges need blending with Pros-Aide." },
    { id: "ci-023", name: "Elf Ear Prosthetics", type: "durable", status: "in-stock", brand: "RBFX", size: "Universal", purchasePrice: "$95/pair", vendor: "Alcone NYC", imageUrl: "", vibeTags: ["Fantasy"], notes: "Silicone. Spirit gum application -- CHECK ALLERGIES" },
    { id: "ci-024", name: "Period Wig - 1940s Victory Rolls", type: "durable", status: "rented", brand: "Wig America", size: "Medium cap", purchasePrice: "$120/week", vendor: "Angels Costumes London", imageUrl: "", vibeTags: ["Period", "Elegant"], rentReturnDate: "2026-04-20", notes: "Synthetic fiber. Style is pre-set; avoid heat." },
    { id: "ci-025", name: "Zombie Bite Prosthetic Set", type: "durable", status: "in-stock", brand: "CFX Masks", size: "N/A", purchasePrice: "$210", vendor: "Kryolan Pro", imageUrl: "", vibeTags: ["Horror", "Bloody"], notes: "3 progressive stages of infection. Silicone, Pros-Aide adhesive." },

    // Additional costume pieces for depth
    { id: "ci-026", name: "Trench Coat - Khaki", type: "costume-piece", status: "in-stock", brand: "Burberry", size: "M", purchasePrice: "$2,400", vendor: "Western Costume Co.", imageUrl: "", vibeTags: ["Formal", "Elegant"], notes: "Iconic check lining. Used for detective character." },
    { id: "ci-027", name: "Motorcycle Boots", type: "costume-piece", status: "in-stock", brand: "Red Wing", size: "11 US", purchasePrice: "$350", vendor: "Red Wing Store", imageUrl: "", vibeTags: ["Rugged", "Casual"], notes: "Black harness boots. Pre-scuffed." },
    { id: "ci-028", name: "Silk Pocket Square Set", type: "costume-piece", status: "in-stock", brand: "Turnbull & Asser", size: "One Size", purchasePrice: "$85/each", vendor: "Nordstrom", imageUrl: "", vibeTags: ["Formal", "Elegant"], notes: "Burgundy, navy, ivory -- 3pc set for Changes 1-3" },
    { id: "ci-029", name: "Nurse Scrubs Set", type: "costume-piece", status: "purchased", brand: "Figs", size: "S", purchasePrice: "$110", vendor: "Figs Direct", imageUrl: "", vibeTags: ["Uniform"], notes: "Ceil blue. Multiples purchased for blood continuity." },
    { id: "ci-030", name: "Space Helmet", type: "durable", status: "in-stock", brand: "Custom Build", size: "Adjustable", purchasePrice: "$4,500", vendor: "Ironhead Studio", imageUrl: "", vibeTags: ["Sci-Fi", "Futuristic"], notes: "Vacuum-formed polycarbonate. Visor tints removable. Internal mic mount." },

    // Additional Makeup & HMU items
    { id: "ci-031", name: "Bruise Wheel Palette", type: "hmu-consumable", status: "in-stock", brand: "Ben Nye", size: "N/A", purchasePrice: "$24", vendor: "Camera Ready Cosmetics", imageUrl: "", vibeTags: ["Bruising", "SFX", "Horror"], notes: "5-color wheel: red, yellow, blue, purple, green. Build up layers for realistic bruising." },
    { id: "ci-032", name: "Setting Spray - Matte Finish", type: "hmu-consumable", status: "in-stock", brand: "Urban Decay", size: "4 oz", purchasePrice: "$34", vendor: "Sephora Pro", imageUrl: "", vibeTags: ["Natural", "Beauty"], notes: "All Nighter formula. Long-wear, humidity-resistant. Use on all principals." },
    { id: "ci-033", name: "Lace-Front Wig - Silver Bob", type: "durable", status: "in-stock", brand: "Arda Wigs", size: "Small/Medium cap", purchasePrice: "$420", vendor: "Bob Kelly Wig Creations", imageUrl: "", vibeTags: ["Wig", "Fantasy", "Glamour"], notes: "Heat-safe synthetic. Pre-styled, needs minor trimming for actor fit." },
    { id: "ci-034", name: "Pros-Aide Adhesive (8 oz)", type: "hmu-consumable", status: "in-stock", brand: "ADM Tronics", size: "8 oz", purchasePrice: "$38", vendor: "Alcone NYC", imageUrl: "", vibeTags: ["Prosthetic", "SFX"], notes: "Medical-grade. Patch test ALL actors 24hrs before use. Remove with Detach oil." },
    { id: "ci-035", name: "Gelatin Prosthetic Kit - Burn Set", type: "durable", status: "in-stock", brand: "Kryolan", size: "N/A", purchasePrice: "$185", vendor: "Kryolan Pro", imageUrl: "", vibeTags: ["SFX", "Horror", "Prosthetic"], notes: "3 progressive burn stages: redness, blistering, charring. Gelatin-based, single use per piece." },
    { id: "ci-036", name: "Airbrush Makeup System", type: "durable", status: "in-stock", brand: "Temptu", size: "N/A", purchasePrice: "$350", vendor: "Temptu Direct", imageUrl: "", vibeTags: ["Beauty", "Natural", "Corrective"], notes: "S/B silicone-based formula. Compressor + 2 guns. Full shade range loaded." },
    { id: "ci-037", name: "Color Contact Lenses - Ice Blue", type: "hmu-consumable", status: "in-stock", brand: "Orion Vision", size: "Plano (0.00)", purchasePrice: "$65/pair", vendor: "Lens.com Pro", imageUrl: "", vibeTags: ["Fantasy", "SFX"], notes: "FDA-approved cosmetic lenses. Max 8hr wear. Trained HMU applies only." },
    { id: "ci-038", name: "Tooth Enamel Paint - Gold", type: "hmu-consumable", status: "in-stock", brand: "Kryolan", size: "12ml", purchasePrice: "$18", vendor: "Kryolan Pro", imageUrl: "", vibeTags: ["Fantasy", "Period", "SFX"], notes: "Food-safe, temporary tooth color. Dries in 30s. Alcohol-based remover." },
    { id: "ci-039", name: "Nose & Chin Prosthetic Set", type: "durable", status: "rented", brand: "RBFX", size: "Custom mold", purchasePrice: "$200/week", vendor: "Alcone NYC", imageUrl: "", vibeTags: ["Prosthetic", "Period", "Aging"], rentReturnDate: "2026-05-10", notes: "Foam latex. Custom lifecast for lead actor. Application time ~45min." },
    { id: "ci-040", name: "Hair Graying Spray", type: "hmu-consumable", status: "in-stock", brand: "Streaks n Tips", size: "3 oz", purchasePrice: "$12", vendor: "Camera Ready Cosmetics", imageUrl: "", vibeTags: ["Aging", "Period"], notes: "Temporary, washes out. Apply in thin layers for salt-and-pepper look." },
    { id: "ci-041", name: "Sweat Simulation Spray", type: "hmu-consumable", status: "in-stock", brand: "Reel Creations", size: "8 oz", purchasePrice: "$22", vendor: "Alcone NYC", imageUrl: "", vibeTags: ["Natural", "SFX"], notes: "Glycerin-based, long-lasting shine. Mist from 12in for natural perspiration look." },
    { id: "ci-042", name: "Sclera Lenses - Zombie White", type: "hmu-consumable", status: "in-stock", brand: "Orion Vision", size: "22mm", purchasePrice: "$180/pair", vendor: "Lens.com Pro", imageUrl: "", vibeTags: ["Horror", "SFX", "Fantasy"], notes: "Full scleral coverage. Max 4hr wear. Optometrist fitting required. 2 backup pairs available." },
    { id: "ci-043", name: "Lace-Front Wig - Ginger Period Updo", type: "durable", status: "rented", brand: "Wig America", size: "Medium cap", purchasePrice: "$150/week", vendor: "Angels Costumes London", imageUrl: "", vibeTags: ["Wig", "Period", "Elegant"], rentReturnDate: "2026-04-25", notes: "Pre-styled 1920s finger wave. Human hair blend. Pin curl maintenance nightly." },
    { id: "ci-044", name: "Scar Wax (Rigid Collodion)", type: "hmu-consumable", status: "in-stock", brand: "Mehron", size: "0.5 oz", purchasePrice: "$9", vendor: "Camera Ready Cosmetics", imageUrl: "", vibeTags: ["SFX", "Horror", "Corrective"], notes: "Creates puckered scar effect directly on skin. Patch test 24hr before. Remove with oil." },
    { id: "ci-045", name: "Lip Palette - Period Reds", type: "hmu-consumable", status: "in-stock", brand: "RCMA", size: "N/A", purchasePrice: "$42", vendor: "Camera Ready Cosmetics", imageUrl: "", vibeTags: ["Beauty", "Period", "Glamour"], notes: "8 shades from 1920s oxblood to 1950s cherry. Long-wear, transfer-proof formula." },
  ]

  /* ---- Looks (linking characters to inventory via itemIds) ---- */
  const looks: CostumeLook[] = []
  const charCount = charActorPairs.length

  // Predefined look templates per character slot
  const LOOK_TEMPLATES = [
    // Character 0 looks
    [
      { name: "Day 1 - Power Suit", changeNumber: "1", scriptDays: ["Day 1", "Day 3"], sceneNumbers: ["Sc 1", "Sc 5", "Sc 12"], itemIds: ["ci-001", "ci-028", "ci-014"], continuityNotes: "Tie loosened by Sc 12. Pocket square in breast pocket throughout." },
      { name: "Day 2 - Casual Evening", changeNumber: "2", scriptDays: ["Day 2"], sceneNumbers: ["Sc 8", "Sc 9"], itemIds: ["ci-002", "ci-013", "ci-027", "ci-031", "ci-020"], continuityNotes: "Jacket collar popped in Sc 9 after fight scene. Blood on right sleeve. Bruise makeup on cheekbone from Sc 9. Tattoo cover on forearm." },
      { name: "Day 5 - Military Dress", changeNumber: "3", scriptDays: ["Day 5"], sceneNumbers: ["Sc 22", "Sc 23"], itemIds: ["ci-005", "ci-027"], continuityNotes: "Full medals on. Hat off for indoor scenes." },
    ],
    // Character 1 looks
    [
      { name: "Day 1 - Office Professional", changeNumber: "1", scriptDays: ["Day 1"], sceneNumbers: ["Sc 2", "Sc 3"], itemIds: ["ci-003", "ci-008", "ci-010"], continuityNotes: "Overcoat removed indoors. Hair pinned up for Sc 2, down for Sc 3." },
      { name: "Day 3 - Lab Scene", changeNumber: "2", scriptDays: ["Day 3"], sceneNumbers: ["Sc 14", "Sc 15"], itemIds: ["ci-007", "ci-029", "ci-017", "ci-032"], continuityNotes: "Blood application starts clean in Sc 14, progressive staining in Sc 15. Matte setting spray on foundation." },
      { name: "Day 4 - Ballroom Gala", changeNumber: "3", scriptDays: ["Day 4"], sceneNumbers: ["Sc 18", "Sc 19"], itemIds: ["ci-010", "ci-021", "ci-028", "ci-045", "ci-032"], continuityNotes: "Wig secured with 12 pins. Gown train pinned for dancing in Sc 19. Glamour lip in 1940s cherry. Full airbrush base." },
    ],
    // Character 2 looks
    [
      { name: "Day 1 - Street Fighter", changeNumber: "1", scriptDays: ["Day 1", "Day 2"], sceneNumbers: ["Sc 4", "Sc 7", "Sc 10"], itemIds: ["ci-002", "ci-013", "ci-027", "ci-016"], continuityNotes: "Scar prosthetic applied from Sc 7 onward. Jacket torn at Sc 10." },
      { name: "Day 3 - Tactical Ops", changeNumber: "2", scriptDays: ["Day 3"], sceneNumbers: ["Sc 13", "Sc 16"], itemIds: ["ci-011", "ci-027"], continuityNotes: "Full tactical gear. Night vision goggles on forehead Sc 13, over eyes Sc 16." },
    ],
    // Character 3 looks
    [
      { name: "Day 1 - Fantasy Wizard", changeNumber: "1", scriptDays: ["Day 1", "Day 6"], sceneNumbers: ["Sc 6", "Sc 25"], itemIds: ["ci-012", "ci-023", "ci-021", "ci-037", "ci-034", "ci-038"], continuityNotes: "Elf ears applied w/ Pros-Aide. Ice blue contacts inserted. Gold tooth enamel on canines. Robe clasp on right shoulder. Staff in left hand." },
      { name: "Day 4 - Undercover Modern", changeNumber: "2", scriptDays: ["Day 4"], sceneNumbers: ["Sc 20"], itemIds: ["ci-026", "ci-013", "ci-014"], continuityNotes: "No fantasy elements. Modern disguise look." },
    ],
    // Character 4 looks
    [
      { name: "Day 2 - Space Explorer", changeNumber: "1", scriptDays: ["Day 2", "Day 5"], sceneNumbers: ["Sc 11", "Sc 24"], itemIds: ["ci-006", "ci-030", "ci-022"], continuityNotes: "Bald cap applied. Helmet visor clear for Sc 11, tinted for Sc 24." },
      { name: "Day 1 - Off-Duty Casual", changeNumber: "2", scriptDays: ["Day 1"], sceneNumbers: ["Sc 3"], itemIds: ["ci-013", "ci-014", "ci-009"], continuityNotes: "Athletic wear under jacket. Sneakers untied." },
    ],
    // Character 5 looks
    [
      { name: "Day 3 - Chef Scene", changeNumber: "1", scriptDays: ["Day 3"], sceneNumbers: ["Sc 17"], itemIds: ["ci-015"], continuityNotes: "Sauce stain on right chest area after kitchen mishap." },
      { name: "Day 6 - Final Stand", changeNumber: "2", scriptDays: ["Day 6"], sceneNumbers: ["Sc 26", "Sc 27"], itemIds: ["ci-002", "ci-007", "ci-025", "ci-018", "ci-042", "ci-035", "ci-044"], continuityNotes: "Progressive zombie damage. Blood application stages 1, 2, 3 across scenes. Sclera zombie lenses in. Gelatin burn on neck Sc 27. Scar wax on jaw." },
    ],
  ]

  for (let i = 0; i < Math.min(charCount, LOOK_TEMPLATES.length); i++) {
    const ch = charActorPairs[i].character
    const templates = LOOK_TEMPLATES[i]
    for (const tmpl of templates) {
      looks.push({
        id: `look-${i}-${tmpl.changeNumber}`,
        name: tmpl.name,
        characterId: ch.id,
        changeNumber: tmpl.changeNumber,
        scriptDays: tmpl.scriptDays,
        sceneNumbers: tmpl.sceneNumbers,
        itemIds: tmpl.itemIds.filter((id) => inventory.some((item) => item.id === id)),
        continuityNotes: tmpl.continuityNotes,
        referencePhotos: [],
        matchPhotos: [],
      })
    }
  }

  /* ---- Shopping list ---- */
  const shoppingList: CostumeShoppingItem[] = [
    { id: "shop-001", description: "Replacement silk blouse (backup)", vendor: "Nordstrom", estimatedPrice: "$320", status: "approved", requestedBy: "Sandra M.", characterId: charActorPairs[1]?.character.id },
    { id: "shop-002", description: "Spirit gum remover (6 bottles)", vendor: "Kryolan Pro", estimatedPrice: "$48", status: "ordered", requestedBy: "Mike T.", characterId: undefined },
    { id: "shop-003", description: "Matching motorcycle boots (backup pair)", vendor: "Red Wing Store", estimatedPrice: "$350", status: "requested", requestedBy: "Sandra M.", characterId: charActorPairs[0]?.character.id },
    { id: "shop-004", description: "Custom space helmet visor tint inserts", vendor: "Ironhead Studio", estimatedPrice: "$800", status: "approved", requestedBy: "Mike T.", characterId: charActorPairs[4]?.character.id },
    { id: "shop-005", description: "Additional breakaway blood (2 gal)", vendor: "Alcone NYC", estimatedPrice: "$120", status: "received", requestedBy: "Patricia L.", characterId: undefined },
    { id: "shop-006", description: "Period-accurate officer cap (WWII)", vendor: "Angels Costumes London", estimatedPrice: "$95/week", status: "requested", requestedBy: "Sandra M.", characterId: charActorPairs[0]?.character.id },
    { id: "shop-007", description: "Hypoallergenic adhesive for prosthetics", vendor: "Camera Ready Cosmetics", estimatedPrice: "$32", status: "ordered", requestedBy: "Patricia L.", characterId: charActorPairs[2]?.character.id },
  ].filter((item) => item.characterId !== undefined || !item.characterId)

  return { actorSpecs, inventory, looks, shoppingList }
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

type MainTab = "wardrobe" | "makeup" | "looks" | "crossplot" | "purchase"

export default function CostumesModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useCasting()

  const projectId = state.currentFocus.currentProjectId
  const currentProject = projectId ? state.projects.find((p) => p.id === projectId) ?? null : null
  const characters: Character[] = currentProject?.characters ?? []

  /* ---- Persisted costumes data ---- */
  const costumes: ProjectCostumes = currentProject?.costumes ?? emptyProjectCostumes()
  const costumesRef = useRef(costumes)
  costumesRef.current = costumes

  const syncCostumes = useCallback(
    (updater: (prev: ProjectCostumes) => ProjectCostumes) => {
      if (!projectId) return
      const next = updater(costumesRef.current)
      dispatch({ type: "SET_PROJECT_COSTUMES", payload: { projectId, costumes: next } })
    },
    [projectId, dispatch],
  )

  const currentUserId = state.currentUser?.id

  const handleCostumeVote = (itemId: string, vote: VoteValue) => {
    if (!currentUserId) return
    syncCostumes((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) => {
        if (item.id !== itemId) return item
        const votes = item.votes || []
        const existing = votes.findIndex((v) => v.userId === currentUserId)
        const newVotes = [...votes]
        if (existing >= 0) {
          if (newVotes[existing].vote === vote) newVotes.splice(existing, 1)
          else newVotes[existing] = { userId: currentUserId, vote }
        } else {
          newVotes.push({ userId: currentUserId, vote })
        }
        return { ...item, votes: newVotes }
      }),
    }))
  }

  const handleCostumeImageReplace = async (itemId: string, url: string) => {
    syncCostumes((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) =>
        item.id === itemId ? { ...item, imageUrl: url } : item
      ),
    }))
  }

  const handleCostumeAddComment = (itemId: string, text: string) => {
    if (!state.currentUser) return
    const newComment: PropComment = {
      id: `c-${Date.now()}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userInitials: state.currentUser.initials,
      text,
      timestamp: Date.now(),
    }
    syncCostumes((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) =>
        item.id === itemId ? { ...item, comments: [...(item.comments || []), newComment] } : item
      ),
    }))
  }

  /* ---- Auto-seed mock data if project has characters but no costumes data ---- */
  const hasSeeded = useRef(false)
  useEffect(() => {
    if (
      !hasSeeded.current &&
      projectId &&
      characters.length > 0 &&
      costumes.inventory.length === 0 &&
      costumes.looks.length === 0
    ) {
      hasSeeded.current = true
      const mockData = generateMockCostumesData(characters)
      dispatch({ type: "SET_PROJECT_COSTUMES", payload: { projectId, costumes: mockData } })
    }
  }, [projectId, characters, costumes.inventory.length, costumes.looks.length, dispatch])

  /* ---- UI State ---- */
  const [mainTab, setMainTab] = useState<MainTab>("wardrobe")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showAddItem, setShowAddItem] = useState(false)
  const [editingItem, setEditingItem] = useState<CostumeInventoryItem | null>(null)
  const [showLookBuilder, setShowLookBuilder] = useState(false)
  const [editingLook, setEditingLook] = useState<CostumeLook | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [wardrobeCharFilter, setWardrobeCharFilter] = useState<string | null>(null) // null = All, characterId = filter by that character
  const [showActorSpecs, setShowActorSpecs] = useState<string | null>(null) // actorId
  const [showShoppingForm, setShowShoppingForm] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<CostumeItemStatus | "all">("all")
  const [filterType, setFilterType] = useState<CostumeItemType | "all">("all")
  const [sortBy, setSortBy] = useState<"name" | "status" | "type" | "brand">("name")

  // Makeup tab state
  const [makeupSearchTerm, setMakeupSearchTerm] = useState("")
  const [makeupViewMode, setMakeupViewMode] = useState<"grid" | "list">("grid")
  const [makeupFilterTag, setMakeupFilterTag] = useState<string | null>(null)
  const [makeupFilterStatus, setMakeupFilterStatus] = useState<CostumeItemStatus | "all">("all")
  const [makeupSortBy, setMakeupSortBy] = useState<"name" | "status" | "type" | "brand">("name")
  const [makeupCharFilter, setMakeupCharFilter] = useState<string | null>(null)

  /* ---- Character/Actor mapping ---- */
  const characterActorMap = useMemo(() => {
    const map: { character: Character; castActor: Actor | null }[] = []
    for (const ch of characters) {
      map.push({ character: ch, castActor: getCastActorForCharacter(ch) })
    }
    return map
  }, [characters])

  /* ---- Build set of item IDs assigned to the selected character ---- */
  const castFilterItemIds = useMemo(() => {
    if (!wardrobeCharFilter) return null // "All" -- show everything
    const charLooks = costumes.looks.filter((l) => l.characterId === wardrobeCharFilter)
    return new Set(charLooks.flatMap((l) => l.itemIds))
  }, [wardrobeCharFilter, costumes.looks])

  /* ---- Wardrobe items (costume-piece only) ---- */
  const wardrobeInventory = useMemo(() => costumes.inventory.filter((i) => i.type === "costume-piece"), [costumes.inventory])
  /* ---- Makeup items (hmu-consumable + durable) ---- */
  const makeupInventory = useMemo(() => costumes.inventory.filter((i) => i.type === "hmu-consumable" || i.type === "durable"), [costumes.inventory])

  /* ---- Makeup character filter item IDs ---- */
  const makeupCastFilterItemIds = useMemo(() => {
    if (!makeupCharFilter) return null
    const charLooks = costumes.looks.filter((l) => l.characterId === makeupCharFilter)
    return new Set(charLooks.flatMap((l) => l.itemIds))
  }, [makeupCharFilter, costumes.looks])

  /* ---- Filtered + sorted wardrobe inventory ---- */
  const filteredInventory = useMemo(() => {
    let items = wardrobeInventory
    if (castFilterItemIds) {
      items = items.filter((i) => castFilterItemIds.has(i.id))
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          i.brand?.toLowerCase().includes(s) ||
          i.vibeTags.some((t) => t.toLowerCase().includes(s)),
      )
    }
    if (filterTag) items = items.filter((i) => i.vibeTags.includes(filterTag))
    if (filterStatus !== "all") items = items.filter((i) => i.status === filterStatus)
    if (filterType !== "all") items = items.filter((i) => i.type === filterType)
    const sorted = [...items]
    sorted.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "status") return a.status.localeCompare(b.status)
      if (sortBy === "type") return a.type.localeCompare(b.type)
      if (sortBy === "brand") return (a.brand ?? "").localeCompare(b.brand ?? "")
      return 0
    })
    return sorted
  }, [wardrobeInventory, searchTerm, filterTag, filterStatus, filterType, sortBy, castFilterItemIds])

  /* ---- Filtered + sorted makeup inventory ---- */
  const filteredMakeupInventory = useMemo(() => {
    let items = makeupInventory
    if (makeupCastFilterItemIds) {
      items = items.filter((i) => makeupCastFilterItemIds.has(i.id))
    }
    if (makeupSearchTerm) {
      const s = makeupSearchTerm.toLowerCase()
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          i.brand?.toLowerCase().includes(s) ||
          i.vibeTags.some((t) => t.toLowerCase().includes(s)),
      )
    }
    if (makeupFilterTag) items = items.filter((i) => i.vibeTags.includes(makeupFilterTag))
    if (makeupFilterStatus !== "all") items = items.filter((i) => i.status === makeupFilterStatus)
    const sorted = [...items]
    sorted.sort((a, b) => {
      if (makeupSortBy === "name") return a.name.localeCompare(b.name)
      if (makeupSortBy === "status") return a.status.localeCompare(b.status)
      if (makeupSortBy === "type") return a.type.localeCompare(b.type)
      if (makeupSortBy === "brand") return (a.brand ?? "").localeCompare(b.brand ?? "")
      return 0
    })
    return sorted
  }, [makeupInventory, makeupSearchTerm, makeupFilterTag, makeupFilterStatus, makeupSortBy, makeupCastFilterItemIds])

  /* ================================================================ */
  /*  Inventory Handlers                                               */
  /* ================================================================ */

  const handleAddInventoryItem = (item: Omit<CostumeInventoryItem, "id">) => {
    syncCostumes((prev) => ({
      ...prev,
      inventory: [...prev.inventory, { ...item, id: uid() }],
    }))
    setShowAddItem(false)
  }

  const handleUpdateInventoryItem = (updated: CostumeInventoryItem) => {
    syncCostumes((prev) => ({
      ...prev,
      inventory: prev.inventory.map((i) => (i.id === updated.id ? updated : i)),
    }))
    setEditingItem(null)
  }

  const handleDeleteInventoryItem = (id: string) => {
    syncCostumes((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((i) => i.id !== id),
      looks: prev.looks.map((l) => ({
        ...l,
        itemIds: l.itemIds.filter((iid) => iid !== id),
      })),
    }))
    setConfirmDeleteId(null)
  }

  /* ================================================================ */
  /*  Look Handlers                                                    */
  /* ================================================================ */

  const handleSaveLook = (look: CostumeLook) => {
    syncCostumes((prev) => {
      const exists = prev.looks.find((l) => l.id === look.id)
      if (exists) {
        return { ...prev, looks: prev.looks.map((l) => (l.id === look.id ? look : l)) }
      }
      return { ...prev, looks: [...prev.looks, look] }
    })
    setShowLookBuilder(false)
    setEditingLook(null)
  }

const handleDeleteLook = (id: string) => {
  syncCostumes((prev) => ({ ...prev, looks: prev.looks.filter((l) => l.id !== id) }))
  }

  const handleUpdateLookCharacter = (lookId: string, newCharacterId: string) => {
    syncCostumes((prev) => ({
      ...prev,
      looks: prev.looks.map((l) => (l.id === lookId ? { ...l, characterId: newCharacterId } : l)),
    }))
  }

  /* ================================================================ */
  /*  Actor Specs Handler                                              */
  /* ================================================================ */

  const handleSaveActorSpecs = (actorId: string, measurements: ActorMeasurements, hmuSpecs: ActorHMUSpecs) => {
    syncCostumes((prev) => ({
      ...prev,
      actorSpecs: {
        ...prev.actorSpecs,
        [actorId]: { measurements, hmuSpecs },
      },
    }))
    setShowActorSpecs(null)
  }

  /* ================================================================ */
  /*  Shopping List Handler                                            */
  /* ================================================================ */

  const handleAddShoppingItem = (item: Omit<CostumeShoppingItem, "id">) => {
    syncCostumes((prev) => ({
      ...prev,
      shoppingList: [...prev.shoppingList, { ...item, id: uid() }],
    }))
    setShowShoppingForm(false)
  }

  const handleUpdateShoppingStatus = (id: string, status: CostumeShoppingItem["status"]) => {
    syncCostumes((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((i) => (i.id === id ? { ...i, status } : i)),
    }))
  }

  const handleDeleteShoppingItem = (id: string) => {
    syncCostumes((prev) => ({ ...prev, shoppingList: prev.shoppingList.filter((i) => i.id !== id) }))
  }

  /* ================================================================ */
  /*  Allergy check for Look Builder                                   */
  /* ================================================================ */

  const getAllergyWarnings = useCallback(
    (characterId: string, itemIds: string[]): string[] => {
      const ch = characters.find((c) => c.id === characterId)
      if (!ch) return []
      const castActor = getCastActorForCharacter(ch)
      if (!castActor) return []
      const specs = costumes.actorSpecs[castActor.id]
      if (!specs?.hmuSpecs?.allergies?.length) return []
      const warnings: string[] = []
      for (const iid of itemIds) {
        const item = costumes.inventory.find((i) => i.id === iid)
        if (!item) continue
        for (const allergy of specs.hmuSpecs.allergies) {
          if (
            item.name.toLowerCase().includes(allergy.toLowerCase()) ||
            item.vibeTags.some((t) => t.toLowerCase().includes(allergy.toLowerCase())) ||
            (item.notes ?? "").toLowerCase().includes(allergy.toLowerCase())
          ) {
            warnings.push(`"${item.name}" may trigger ${castActor.name}'s "${allergy}" allergy`)
          }
        }
      }
      return warnings
    },
    [characters, costumes],
  )

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  const TABS: { key: MainTab; label: string; icon: React.ReactNode }[] = [
    { key: "wardrobe", label: "Wardrobe", icon: <Shirt className="w-4 h-4" /> },
    { key: "makeup", label: "Makeup", icon: <Scissors className="w-4 h-4" /> },
    { key: "looks", label: "Looks", icon: <Palette className="w-4 h-4" /> },
    { key: "crossplot", label: "Cross-Plot", icon: <LayoutGrid className="w-4 h-4" /> },
    { key: "purchase", label: "Purchase/Design", icon: <ShoppingBag className="w-4 h-4" /> },
  ]

const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
  <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col pl-14">
  {/* Slim Sidebar Strip / Expandable Drawer */}
  <FloatingSidebar
    isOpen={isSidebarOpen}
    onClose={() => setIsSidebarOpen(false)}
    onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
    currentModal="costumes"
  />

  {/* ---- Header ---- */}
  <ModalHeader
    title="Costumes & Makeup"
    titleColor="bg-rose-600"
    onClose={onClose}
  />

      {/* ---- Tab Bar ---- */}
      <div className="flex items-center gap-2 px-6 py-2 bg-white border-b border-gray-200 shrink-0 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setMainTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              mainTab === t.key
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "text-gray-600 hover:bg-gray-100 border border-transparent"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}

        {/* Character filter (used in Looks and Cross-Plot) */}
        {(mainTab === "looks" || mainTab === "crossplot") && characters.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">Character:</span>
            <select
              value={selectedCharacterId ?? ""}
              onChange={(e) => setSelectedCharacterId(e.target.value || null)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">All Characters</option>
              {characters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ---- Content Area ---- */}
      <div className="flex-1 overflow-hidden">
        {!projectId ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Shirt className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No project selected</p>
            <p className="text-gray-400 text-xs mt-1">Create or open a project first to manage costumes and makeup</p>
          </div>
        ) : mainTab === "wardrobe" ? (
          <WardrobeTab
            inventory={filteredInventory}
            allInventory={wardrobeInventory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterTag={filterTag}
            onFilterTagChange={setFilterTag}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            onAdd={() => setShowAddItem(true)}
            onEdit={setEditingItem}
            onDelete={(id) => setConfirmDeleteId(id)}
            characterActorMap={characterActorMap}
            actorSpecs={costumes.actorSpecs}
            onShowActorSpecs={setShowActorSpecs}
            wardrobeCharFilter={wardrobeCharFilter}
            onWardrobeCharFilterChange={setWardrobeCharFilter}
            looks={costumes.looks}
            onVote={handleCostumeVote}
            onAddComment={handleCostumeAddComment}
            currentUserId={currentUserId}
            onImageReplace={handleCostumeImageReplace}
          />
        ) : mainTab === "makeup" ? (
          <MakeupTab
            inventory={filteredMakeupInventory}
            allInventory={makeupInventory}
            searchTerm={makeupSearchTerm}
            onSearchChange={setMakeupSearchTerm}
            viewMode={makeupViewMode}
            onViewModeChange={setMakeupViewMode}
            filterTag={makeupFilterTag}
            onFilterTagChange={setMakeupFilterTag}
            filterStatus={makeupFilterStatus}
            onFilterStatusChange={setMakeupFilterStatus}
            sortBy={makeupSortBy}
            onSortByChange={setMakeupSortBy}
            onAdd={() => setShowAddItem(true)}
            onEdit={setEditingItem}
            onDelete={(id) => setConfirmDeleteId(id)}
            characterActorMap={characterActorMap}
            charFilter={makeupCharFilter}
            onCharFilterChange={setMakeupCharFilter}
            looks={costumes.looks}
            onVote={handleCostumeVote}
            onAddComment={handleCostumeAddComment}
            currentUserId={currentUserId}
            onImageReplace={handleCostumeImageReplace}
          />
        ) : mainTab === "looks" ? (
<LooksTab
  looks={costumes.looks}
  inventory={costumes.inventory}
  characters={characters}
  selectedCharacterId={selectedCharacterId}
  onNewLook={() => {
  setEditingLook(null)
  setShowLookBuilder(true)
  }}
  onEditLook={(l) => {
  setEditingLook(l)
  setShowLookBuilder(true)
  }}
  onDeleteLook={handleDeleteLook}
  onUpdateLookCharacter={handleUpdateLookCharacter}
  allergyWarnings={getAllergyWarnings}
  />
        ) : mainTab === "crossplot" ? (
          <CrossPlotTab
            looks={costumes.looks}
            characters={characters}
            selectedCharacterId={selectedCharacterId}
            inventory={costumes.inventory}
          />
        ) : mainTab === "purchase" ? (
          <PurchaseTab
            shoppingList={costumes.shoppingList}
            characters={characters}
            onAdd={() => setShowShoppingForm(true)}
            onUpdateStatus={handleUpdateShoppingStatus}
            onDelete={handleDeleteShoppingItem}
          />
        ) : null}
      </div>

      {/* ---- Sub-modals ---- */}
      {showAddItem && (
        <AddItemModal onClose={() => setShowAddItem(false)} onSave={handleAddInventoryItem} />
      )}
      {editingItem && (
        <AddItemModal
          onClose={() => setEditingItem(null)}
          onSave={(item) => handleUpdateInventoryItem({ ...item, id: editingItem.id } as CostumeInventoryItem)}
          initial={editingItem}
        />
      )}
      {showLookBuilder && (
        <LookBuilderModal
          onClose={() => {
            setShowLookBuilder(false)
            setEditingLook(null)
          }}
          onSave={handleSaveLook}
          initial={editingLook}
          characters={characters}
          inventory={costumes.inventory}
          allergyWarnings={getAllergyWarnings}
        />
      )}
      {showActorSpecs && (
        <ActorSpecsModal
          actorId={showActorSpecs}
          characters={characters}
          specs={costumes.actorSpecs[showActorSpecs]}
          onClose={() => setShowActorSpecs(null)}
          onSave={(m, h) => handleSaveActorSpecs(showActorSpecs, m, h)}
        />
      )}
      {showShoppingForm && (
        <ShoppingFormModal
          characters={characters}
          onClose={() => setShowShoppingForm(false)}
          onSave={handleAddShoppingItem}
        />
      )}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center">Delete Item</h3>
              <p className="text-sm text-gray-500 text-center mt-2">This will also remove it from any Looks using it.</p>
            </div>
            <div className="flex border-t border-gray-200">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <div className="w-px bg-gray-200" />
              <button onClick={() => handleDeleteInventoryItem(confirmDeleteId)} className="flex-1 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CoPilot - Fixed position in lower right corner */}
      <div className="fixed bottom-6 right-6 z-40">
        <EmbeddedCoPilot context="costumes" />
      </div>
    </div>
  )
}

/* ================================================================== */
/*  WARDROBE TAB                                                       */
/* ================================================================== */

function WardrobeTab({
  inventory,
  allInventory,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filterTag,
  onFilterTagChange,
  filterStatus,
  onFilterStatusChange,
  filterType,
  onFilterTypeChange,
  sortBy,
  onSortByChange,
  onAdd,
  onEdit,
  onDelete,
  characterActorMap,
  actorSpecs,
  onShowActorSpecs,
  wardrobeCharFilter,
  onWardrobeCharFilterChange,
  looks,
  onVote,
  onAddComment,
  currentUserId,
  onImageReplace,
  }: {
  inventory: CostumeInventoryItem[]
  allInventory: CostumeInventoryItem[]
  searchTerm: string
  onSearchChange: (s: string) => void
  viewMode: "grid" | "list"
  onViewModeChange: (m: "grid" | "list") => void
  filterTag: string | null
  onFilterTagChange: (t: string | null) => void
  filterStatus: CostumeItemStatus | "all"
  onFilterStatusChange: (s: CostumeItemStatus | "all") => void
  filterType: CostumeItemType | "all"
  onFilterTypeChange: (t: CostumeItemType | "all") => void
  sortBy: "name" | "status" | "type" | "brand"
  onSortByChange: (s: "name" | "status" | "type" | "brand") => void
  onAdd: () => void
  onEdit: (item: CostumeInventoryItem) => void
  onDelete: (id: string) => void
  characterActorMap: { character: Character; castActor: Actor | null }[]
  actorSpecs: ProjectCostumes["actorSpecs"]
  onShowActorSpecs: (actorId: string) => void
  wardrobeCharFilter: string | null
  onWardrobeCharFilterChange: (id: string | null) => void
  looks: CostumeLook[]
  onVote?: (id: string, vote: VoteValue) => void
  onAddComment?: (id: string, text: string) => void
  currentUserId?: string
  onImageReplace?: (id: string, url: string) => void
}) {
  const activeFilterCount = [filterTag, filterStatus !== "all" ? filterStatus : null, filterType !== "all" ? filterType : null].filter(Boolean).length

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        {/* View toggle */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
          <button onClick={() => onViewModeChange("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-gray-200 text-gray-800" : "text-gray-400 hover:text-gray-600"}`} title="Grid view">
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => onViewModeChange("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-gray-200 text-gray-800" : "text-gray-400 hover:text-gray-600"}`} title="List view">
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search wardrobe..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-300 bg-white"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value as CostumeItemStatus | "all")}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-rose-300"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_COLORS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => onFilterTypeChange(e.target.value as CostumeItemType | "all")}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-rose-300"
        >
          <option value="all">All Types</option>
          {Object.entries(ITEM_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as typeof sortBy)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-rose-300"
        >
          <option value="name">Sort: Name</option>
          <option value="status">Sort: Status</option>
          <option value="type">Sort: Type</option>
          <option value="brand">Sort: Brand</option>
        </select>

        {/* Active filter count badge */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => { onFilterTagChange(null); onFilterStatusChange("all"); onFilterTypeChange("all") }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-full hover:bg-rose-100 transition-colors"
          >
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
            <X className="w-3 h-3" />
          </button>
        )}

        <button onClick={onAdd} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors shrink-0">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Vibe tags row */}
      <div className="flex items-center gap-1.5 px-6 py-2 border-b border-gray-100 bg-gray-50/50 shrink-0 overflow-x-auto">
        <span className="text-[10px] text-gray-500 font-medium shrink-0 mr-1">Tags:</span>
        <button
          onClick={() => onFilterTagChange(null)}
          className={`px-2.5 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-colors ${
            !filterTag ? "bg-rose-100 text-rose-700 border border-rose-200" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          All
        </button>
        {VIBE_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => onFilterTagChange(filterTag === tag ? null : tag)}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-colors ${
              filterTag === tag ? "bg-rose-100 text-rose-700 border border-rose-200" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Two-panel: Left = Cast cards, Right = Inventory */}
      <div className="flex-1 flex overflow-hidden">
        {/* Cast panel */}
        <div className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Characters</h3>

          {/* "All" option */}
          <button
            onClick={() => onWardrobeCharFilterChange(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2 transition-all text-left ${
              wardrobeCharFilter === null
                ? "bg-rose-50 border-2 border-rose-400 shadow-sm"
                : "border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              wardrobeCharFilter === null ? "bg-rose-500 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${wardrobeCharFilter === null ? "text-rose-800" : "text-gray-900"}`}>All Wardrobe</p>
              <p className="text-[10px] text-gray-500">{allInventory.length} items total</p>
            </div>
          </button>

          {characterActorMap.length === 0 ? (
            <p className="text-xs text-gray-400 mt-2">No characters in this project</p>
          ) : (
            <div className="space-y-1.5">
              {characterActorMap.map(({ character, castActor }) => {
                const isSelected = wardrobeCharFilter === character.id
                const charLookCount = looks.filter((l) => l.characterId === character.id).length
                const charItemIds = new Set(looks.filter((l) => l.characterId === character.id).flatMap((l) => l.itemIds))
                return (
                  <div key={character.id}>
                    <button
                      onClick={() => onWardrobeCharFilterChange(isSelected ? null : character.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left ${
                        isSelected
                          ? "bg-rose-50 border-2 border-rose-400 shadow-sm"
                          : "border border-gray-200 hover:border-rose-200 hover:bg-gray-50"
                      }`}
                    >
                      {isValidImageUrl(castActor?.headshots?.[0]) ? (
                        <img src={castActor.headshots[0]} alt="" className={`w-9 h-11 object-cover rounded-lg shrink-0 ${isSelected ? "ring-2 ring-rose-300" : ""}`} />
                      ) : (
                        <div className={`w-9 h-11 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-rose-100" : "bg-gray-100"}`}>
                          <User className={`w-4 h-4 ${isSelected ? "text-rose-400" : "text-gray-400"}`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isSelected ? "text-rose-800" : "text-gray-900"}`}>{character.name}</p>
                        {castActor ? (
                          <p className="text-[10px] text-gray-500 truncate">{castActor.name}</p>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Not yet cast
                          </span>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-gray-400">{charItemIds.size} items</span>
                          <span className="text-[9px] text-gray-300">&middot;</span>
                          <span className="text-[9px] text-gray-400">{charLookCount} looks</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </button>
                    {/* Specs button - shown when a cast actor exists and this character is selected */}
                    {isSelected && castActor && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onShowActorSpecs(castActor.id) }}
                        className="w-full mt-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors bg-white"
                      >
                        <Ruler className="w-3 h-3" />
                        {actorSpecs[castActor.id] ? "View / Edit Specs" : "Add Measurements"}
                      </button>
                    )}
                    {/* Notice for uncast characters when selected */}
                    {isSelected && !castActor && (
                      <div className="mt-1 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-[10px] text-amber-700 text-center">Cast an actor to add measurements</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Inventory grid/list */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Active character filter banner */}
          {wardrobeCharFilter && (() => {
            const pair = characterActorMap.find(({ character }) => character.id === wardrobeCharFilter)
            return pair ? (
              <div className="flex items-center gap-2 mb-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
                {isValidImageUrl(pair.castActor?.headshots?.[0]) ? (
                  <img src={pair.castActor.headshots[0]} alt="" className="w-6 h-8 rounded object-cover" />
                ) : (
                  <div className="w-6 h-8 rounded bg-rose-200 flex items-center justify-center"><User className="w-3 h-3 text-rose-400" /></div>
                )}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-rose-800">
                    Showing wardrobe for {pair.character.name}
                    {pair.castActor ? ` (${pair.castActor.name})` : ""}
                  </p>
                  <p className="text-[10px] text-rose-600">{inventory.length} items across {looks.filter((l) => l.characterId === pair.character.id).length} looks</p>
                </div>
                {!pair.castActor && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Not cast
                  </span>
                )}
                <button onClick={() => onWardrobeCharFilterChange(null)} className="p-1 text-rose-400 hover:text-rose-600 rounded-md hover:bg-rose-100 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null
          })()}

          {/* Result count */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-gray-700">{inventory.length}</span> item{inventory.length !== 1 ? "s" : ""}{wardrobeCharFilter ? " for this character" : " in wardrobe"}
            </p>
          </div>

          {inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Shirt className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm font-medium">{wardrobeCharFilter ? "No items assigned to this character" : "No items in wardrobe"}</p>
              <p className="text-gray-400 text-xs mt-1">{wardrobeCharFilter ? "Create a Look to assign inventory items" : "Add costume pieces, HMU consumables, or durables"}</p>
              {!wardrobeCharFilter && (
                <button onClick={onAdd} className="mt-4 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors">Add First Item</button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {inventory.map((item) => (
                <InventoryCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onAddToCanvas={() => {}} onVote={onVote} onAddComment={onAddComment} currentUserId={currentUserId} onImageReplace={onImageReplace} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                <span>Image</span>
                <span>Name / Details</span>
                <span>Tags</span>
                <span>Status</span>
                <span>Price</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-gray-100">
                {inventory.map((item) => (
                  <InventoryListRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Makeup Tab                                                         */
/* ================================================================== */

function MakeupTab({
  inventory,
  allInventory,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filterTag,
  onFilterTagChange,
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortByChange,
  onAdd,
  onEdit,
  onDelete,
  characterActorMap,
  charFilter,
  onCharFilterChange,
  looks,
  onVote,
  onAddComment,
  currentUserId,
  onImageReplace,
}: {
  inventory: CostumeInventoryItem[]
  allInventory: CostumeInventoryItem[]
  searchTerm: string
  onSearchChange: (s: string) => void
  viewMode: "grid" | "list"
  onViewModeChange: (m: "grid" | "list") => void
  filterTag: string | null
  onFilterTagChange: (t: string | null) => void
  filterStatus: CostumeItemStatus | "all"
  onFilterStatusChange: (s: CostumeItemStatus | "all") => void
  sortBy: "name" | "status" | "type" | "brand"
  onSortByChange: (s: "name" | "status" | "type" | "brand") => void
  onAdd: () => void
  onEdit: (item: CostumeInventoryItem) => void
  onDelete: (id: string) => void
  characterActorMap: { character: Character; castActor: Actor | null }[]
  charFilter: string | null
  onCharFilterChange: (id: string | null) => void
  looks: CostumeLook[]
  onVote?: (id: string, vote: VoteValue) => void
  onAddComment?: (id: string, text: string) => void
  currentUserId?: string
  onImageReplace?: (id: string, url: string) => void
}) {
  const activeFilterCount = [filterTag, filterStatus !== "all" ? filterStatus : null].filter(Boolean).length

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        {/* View toggle */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
          <button onClick={() => onViewModeChange("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-gray-200 text-gray-800" : "text-gray-400 hover:text-gray-600"}`} title="Grid view">
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => onViewModeChange("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-gray-200 text-gray-800" : "text-gray-400 hover:text-gray-600"}`} title="List view">
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search makeup & HMU..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300 bg-white"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value as CostumeItemStatus | "all")}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-300"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_COLORS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as typeof sortBy)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-300"
        >
          <option value="name">Sort: Name</option>
          <option value="status">Sort: Status</option>
          <option value="type">Sort: Type</option>
          <option value="brand">Sort: Brand</option>
        </select>

        {/* Active filter count badge */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => { onFilterTagChange(null); onFilterStatusChange("all") }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full hover:bg-amber-100 transition-colors"
          >
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
            <X className="w-3 h-3" />
          </button>
        )}

        <button onClick={onAdd} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors shrink-0">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Makeup tags row */}
      <div className="flex items-center gap-1.5 px-6 py-2 border-b border-gray-100 bg-gray-50/50 shrink-0 overflow-x-auto">
        <span className="text-[10px] text-gray-500 font-medium shrink-0 mr-1">Tags:</span>
        <button
          onClick={() => onFilterTagChange(null)}
          className={`px-2.5 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-colors ${
            !filterTag ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          All
        </button>
        {MAKEUP_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => onFilterTagChange(filterTag === tag ? null : tag)}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-full whitespace-nowrap transition-colors ${
              filterTag === tag ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Two-panel: Left = Cast cards, Right = Inventory */}
      <div className="flex-1 flex overflow-hidden">
        {/* Cast panel */}
        <div className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Characters</h3>

          {/* "All" option */}
          <button
            onClick={() => onCharFilterChange(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2 transition-all text-left ${
              charFilter === null
                ? "bg-amber-50 border-2 border-amber-400 shadow-sm"
                : "border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              charFilter === null ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              <Scissors className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${charFilter === null ? "text-amber-800" : "text-gray-900"}`}>All Makeup</p>
              <p className="text-[10px] text-gray-500">{allInventory.length} items total</p>
            </div>
          </button>

          {characterActorMap.length === 0 ? (
            <p className="text-xs text-gray-400 mt-2">No characters in this project</p>
          ) : (
            <div className="space-y-1.5">
              {characterActorMap.map(({ character, castActor }) => {
                const isSelected = charFilter === character.id
                const charLookCount = looks.filter((l) => l.characterId === character.id).length
                const charItemIds = new Set(looks.filter((l) => l.characterId === character.id).flatMap((l) => l.itemIds))
                const makeupItemCount = [...charItemIds].filter((id) => allInventory.some((i) => i.id === id)).length
                return (
                  <button
                    key={character.id}
                    onClick={() => onCharFilterChange(isSelected ? null : character.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left ${
                      isSelected
                        ? "bg-amber-50 border-2 border-amber-400 shadow-sm"
                        : "border border-gray-200 hover:border-amber-200 hover:bg-gray-50"
                    }`}
                  >
                    {isValidImageUrl(castActor?.headshots?.[0]) ? (
                      <img src={castActor.headshots[0]} alt="" className={`w-9 h-11 object-cover rounded-lg shrink-0 ${isSelected ? "ring-2 ring-amber-300" : ""}`} />
                    ) : (
                      <div className={`w-9 h-11 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-amber-100" : "bg-gray-100"}`}>
                        <User className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-gray-400"}`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isSelected ? "text-amber-800" : "text-gray-900"}`}>{character.name}</p>
                      {castActor ? (
                        <p className="text-[10px] text-gray-500 truncate">{castActor.name}</p>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Not yet cast
                        </span>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-gray-400">{makeupItemCount} items</span>
                        <span className="text-[9px] text-gray-300">&middot;</span>
                        <span className="text-[9px] text-gray-400">{charLookCount} looks</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Inventory grid/list */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Active character filter banner */}
          {charFilter && (() => {
            const pair = characterActorMap.find(({ character }) => character.id === charFilter)
            return pair ? (
              <div className="flex items-center gap-2 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                {isValidImageUrl(pair.castActor?.headshots?.[0]) ? (
                  <img src={pair.castActor.headshots[0]} alt="" className="w-6 h-8 rounded object-cover" />
                ) : (
                  <div className="w-6 h-8 rounded bg-amber-200 flex items-center justify-center"><User className="w-3 h-3 text-amber-400" /></div>
                )}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-800">
                    Showing makeup for {pair.character.name}
                    {pair.castActor ? ` (${pair.castActor.name})` : ""}
                  </p>
                  <p className="text-[10px] text-amber-600">{inventory.length} items across {looks.filter((l) => l.characterId === pair.character.id).length} looks</p>
                </div>
                <button onClick={() => onCharFilterChange(null)} className="p-1 text-amber-400 hover:text-amber-600 rounded-md hover:bg-amber-100 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null
          })()}

          {/* Result count */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-gray-700">{inventory.length}</span> item{inventory.length !== 1 ? "s" : ""}{charFilter ? " for this character" : " in makeup"}
            </p>
          </div>

          {inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Scissors className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm font-medium">{charFilter ? "No makeup items assigned to this character" : "No items in makeup inventory"}</p>
              <p className="text-gray-400 text-xs mt-1">{charFilter ? "Create a Look to assign makeup items" : "Add wigs, prosthetics, cosmetics, and SFX supplies"}</p>
              {!charFilter && (
                <button onClick={onAdd} className="mt-4 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors">Add First Item</button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {inventory.map((item) => (
                <InventoryCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onAddToCanvas={() => {}} onVote={onVote} onAddComment={onAddComment} currentUserId={currentUserId} onImageReplace={onImageReplace} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                <span>Image</span>
                <span>Name / Details</span>
                <span>Tags</span>
                <span>Status</span>
                <span>Price</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-gray-100">
                {inventory.map((item) => (
                  <InventoryListRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Vote / Comment components for Costumes                             */
/* ================================================================== */

const COSTUME_VOTE_PILL: Record<string, { base: string; active: string }> = {
  Yes:   { base: "bg-[#d5dece] text-[#6b7a5e] hover:bg-[#c8d4bf]", active: "bg-[#b5c9a8] text-[#4a5b3f] ring-2 ring-[#8fa67e]" },
  Maybe: { base: "bg-[#f5e6d0] text-[#9b8a5e] hover:bg-[#eddbbd]", active: "bg-[#f0d9b5] text-[#7a6a3a] ring-2 ring-[#d4b88a]" },
  No:    { base: "bg-[#f0cdd0] text-[#a06b6e] hover:bg-[#e8bfc3]", active: "bg-[#e8b4b8] text-[#8b4c4f] ring-2 ring-[#d49396]" },
}

function CostumeVoteButton({ label, isActive, count, onClick }: { label: string; icon?: typeof CheckCircle; isActive: boolean; count: number; activeClassName?: string; onClick: () => void }) {
  const style = COSTUME_VOTE_PILL[label] || COSTUME_VOTE_PILL["Maybe"]
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick() }} className={`flex-1 px-3 py-1.5 rounded-full text-xs font-semibold text-center transition-all duration-200 ${isActive ? style.active : style.base}`} title={label}>
      <span>{label}</span>
      {count > 0 && <span className="ml-1 text-[10px] opacity-70">{count}</span>}
    </button>
  )
}

function CostumeCommentSection({ comments, onAddComment }: { comments: PropComment[]; onAddComment: (text: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState("")
  const handleSubmit = () => { if (!text.trim()) return; onAddComment(text.trim()); setText("") }
  return (
    <div className="mt-1">
      <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
        <MessageSquare className="w-3 h-3" />
        {comments.length > 0 ? `${comments.length} note${comments.length === 1 ? "" : "s"}` : "Add note"}
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
          {comments.length > 0 && (
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[8px] font-bold text-gray-600">{c.userInitials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-700 leading-snug">{c.text}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{c.userName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="Write a note..." className="flex-1 px-2.5 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 placeholder-gray-400 text-gray-900" />
            <button onClick={handleSubmit} disabled={!text.trim()} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  Inventory Card                                                     */
/* ================================================================== */

function InventoryCard({
  item,
  onEdit,
  onDelete,
  onAddToCanvas,
  onVote,
  onAddComment,
  currentUserId,
  onImageReplace,
}: {
  item: CostumeInventoryItem
  onEdit: (item: CostumeInventoryItem) => void
  onDelete: (id: string) => void
  onAddToCanvas: (item: CostumeInventoryItem) => void
  onVote?: (id: string, vote: VoteValue) => void
  onAddComment?: (id: string, text: string) => void
  currentUserId?: string
  onImageReplace?: (id: string, url: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const st = STATUS_COLORS[item.status]

  const handleFiles = (files: FileList | null) => {
    if (!files || !onImageReplace) return
    const file = files[0]
    if (!file?.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const raw = e.target?.result as string
      if (raw) {
        const compressed = await compressImage(raw)
        onImageReplace(item.id, compressed)
      }
    }
    reader.readAsDataURL(file)
  }

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.types.includes("Files")) setIsDragOver(true)
  }
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation() }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current = 0; setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-rose-200 transition-all group relative">
      {/* Portrait image (fashion magazine aspect ratio) -- drag-and-drop zone */}
      <div
        className={`aspect-[3/4] bg-gray-100 relative overflow-hidden transition-all ${isDragOver ? "ring-2 ring-inset ring-rose-400 bg-rose-50" : ""}`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-20 bg-rose-50/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
            <Upload className="w-8 h-8 text-rose-400 mb-1.5" />
            <p className="text-xs font-semibold text-rose-600">Drop image here</p>
          </div>
        )}
{isValidImageUrl(item.imageUrl) ? (
                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                          ) : (
                            <Scissors className="w-6 h-6 text-gray-300" />
                          )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = "" }} />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <span className={`${st.bg} ${st.text} text-[9px] font-bold px-1.5 py-0.5 rounded-full`}>{st.label}</span>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <div className="flex flex-wrap gap-1">
            {item.vibeTags.slice(0, 3).map((t) => (
              <span key={t} className="bg-white/20 backdrop-blur-sm text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
        {/* Menu */}
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
          className="absolute top-2 right-2 p-1 rounded-full bg-white/80 text-gray-600 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute top-8 right-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10 min-w-[120px]" onMouseLeave={() => setMenuOpen(false)}>
            <button onClick={() => { onEdit(item); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => { onAddToCanvas(item); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Layout className="w-3.5 h-3.5" /> Add to Canvas
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button onClick={() => { onDelete(item.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{ITEM_TYPES[item.type]} {item.brand ? `/ ${item.brand}` : ""}</p>
        {item.size && <p className="text-[10px] text-gray-400 mt-0.5">Size: {item.size}</p>}

        {/* Response buttons + note */}
        {onVote && onAddComment && (() => {
          const itemVotes = item.votes || []
          const itemComments = item.comments || []
          const userVote = itemVotes.find((v) => v.userId === currentUserId)?.vote
          const yesCt = itemVotes.filter((v) => v.vote === "yes").length
          const noCt = itemVotes.filter((v) => v.vote === "no").length
          const maybeCt = itemVotes.filter((v) => v.vote === "maybe").length
          return (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <CostumeVoteButton label="Yes" isActive={userVote === "yes"} count={yesCt} onClick={() => onVote(item.id, "yes")} />
                <CostumeVoteButton label="Maybe" isActive={userVote === "maybe"} count={maybeCt} onClick={() => onVote(item.id, "maybe")} />
                <CostumeVoteButton label="No" isActive={userVote === "no"} count={noCt} onClick={() => onVote(item.id, "no")} />
              </div>
              <CostumeCommentSection comments={itemComments} onAddComment={(text) => onAddComment(item.id, text)} />
            </div>
          )
        })()}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  Inventory List Row                                                 */
/* ================================================================== */

function InventoryListRow({ item, onEdit, onDelete, onAddToCanvas }: { item: CostumeInventoryItem; onEdit: (i: CostumeInventoryItem) => void; onDelete: (id: string) => void; onAddToCanvas: (i: CostumeInventoryItem) => void }) {
  const st = STATUS_COLORS[item.status]
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 items-center px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="w-10 h-13 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                {isValidImageUrl(item.imageUrl) ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" /> : <div className="w-full h-full flex items-center justify-center"><Shirt className="w-5 h-5 text-gray-300" /></div>}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
        <p className="text-[10px] text-gray-500">{ITEM_TYPES[item.type]}{item.brand ? ` / ${item.brand}` : ""}{item.size ? ` / ${item.size}` : ""}</p>
        {item.vendor && <p className="text-[10px] text-gray-400 truncate">Vendor: {item.vendor}</p>}
      </div>
      <div className="flex items-center gap-1 flex-wrap max-w-[120px]">
        {item.vibeTags.slice(0, 3).map((t) => (
          <span key={t} className="bg-gray-100 text-gray-600 text-[9px] font-medium px-1.5 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
      <span className={`${st.bg} ${st.text} text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap`}>{st.label}</span>
      <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{item.purchasePrice || "--"}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onEdit(item)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => onAddToCanvas(item)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Add to Canvas"><Layout className="w-3.5 h-3.5" /></button>
        <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  LOOKS TAB                                                          */
/* ================================================================== */

function LooksTab({
  looks,
  inventory,
  characters,
  selectedCharacterId,
  onNewLook,
  onEditLook,
  onDeleteLook,
  onUpdateLookCharacter,
  allergyWarnings,
}: {
  looks: CostumeLook[]
  inventory: CostumeInventoryItem[]
  characters: Character[]
  selectedCharacterId: string | null
  onNewLook: () => void
  onEditLook: (l: CostumeLook) => void
  onDeleteLook: (id: string) => void
  onUpdateLookCharacter: (lookId: string, newCharacterId: string) => void
  allergyWarnings: (characterId: string, itemIds: string[]) => string[]
}) {
  const [editingCharacterForLook, setEditingCharacterForLook] = useState<string | null>(null)
  const filtered = selectedCharacterId ? looks.filter((l) => l.characterId === selectedCharacterId) : looks

  const groupedByCharacter: Record<string, CostumeLook[]> = {}
  for (const l of filtered) {
    if (!groupedByCharacter[l.characterId]) groupedByCharacter[l.characterId] = []
    groupedByCharacter[l.characterId].push(l)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{filtered.length}</span> look{filtered.length !== 1 ? "s" : ""} defined
        </p>
        <button onClick={onNewLook} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors">
          <Plus className="w-4 h-4" /> New Look
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {Object.keys(groupedByCharacter).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Palette className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No looks created yet</p>
            <p className="text-gray-400 text-xs mt-1">Create looks by combining wardrobe items for each character</p>
            <button onClick={onNewLook} className="mt-4 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors">Create First Look</button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByCharacter).map(([charId, charLooks]) => {
              const ch = characters.find((c) => c.id === charId)
              const castActor = ch ? getCastActorForCharacter(ch) : null
              return (
                <div key={charId}>
                  <div className="flex items-center gap-3 mb-4">
                    {isValidImageUrl(castActor?.headshots?.[0]) ? (
                      <img src={castActor.headshots[0]} alt="" className="w-8 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-10 rounded bg-gray-200 flex items-center justify-center"><User className="w-4 h-4 text-gray-400" /></div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{ch?.name ?? "Unknown"}</p>
                      {castActor && <p className="text-[10px] text-gray-500">{castActor.name}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {charLooks.map((look) => {
                      const warnings = allergyWarnings(look.characterId, look.itemIds)
                      const lookChar = characters.find((c) => c.id === look.characterId)
                      const lookActor = lookChar ? getCastActorForCharacter(lookChar) : null
                      const isEditingChar = editingCharacterForLook === look.id
                      return (
                        <div key={look.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                          {/* Item thumbnails strip */}
                          <div className="flex h-28 bg-gray-50">
                            {look.itemIds.slice(0, 4).map((iid) => {
                              const item = inventory.find((i) => i.id === iid)
                              return (
                                <div key={iid} className="flex-1 border-r border-gray-200 last:border-r-0">
{isValidImageUrl(item?.imageUrl) ? (
                              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Shirt className="w-4 h-4 text-gray-400" /></div>
                            )}
                                </div>
                              )
                            })}
                            {look.itemIds.length === 0 && (
                              <div className="w-full flex items-center justify-center text-gray-400 text-xs">No items</div>
                            )}
                          </div>
                          <div className="p-3">
                            {/* Editable character assignment */}
                            <div className="relative mb-2">
                              <button
                                onClick={() => setEditingCharacterForLook(isEditingChar ? null : look.id)}
                                className="flex items-center gap-2 px-2 py-1.5 -mx-2 rounded-md hover:bg-gray-100 transition-colors group w-full text-left"
                                title="Click to change character"
                              >
                                {isValidImageUrl(lookActor?.headshots?.[0]) ? (
                                  <img src={lookActor.headshots[0]} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"><User className="w-3 h-3 text-gray-400" /></div>
                                )}
                                <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 flex-1 truncate">{lookChar?.name ?? "Unknown"}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isEditingChar ? "rotate-180" : ""}`} />
                              </button>
                              {/* Character selector dropdown */}
                              {isEditingChar && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                  {characters.map((char) => {
                                    const charActor = getCastActorForCharacter(char)
                                    const isSelected = char.id === look.characterId
                                    return (
                                      <button
                                        key={char.id}
                                        onClick={() => {
                                          if (!isSelected) {
                                            onUpdateLookCharacter(look.id, char.id)
                                          }
                                          setEditingCharacterForLook(null)
                                        }}
                                        className={`flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${isSelected ? "bg-rose-50" : ""}`}
                                      >
                                        {isValidImageUrl(charActor?.headshots?.[0]) ? (
                                          <img src={charActor.headshots[0]} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                                        ) : (
                                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"><User className="w-3 h-3 text-gray-400" /></div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-xs font-medium truncate ${isSelected ? "text-rose-700" : "text-gray-700"}`}>{char.name}</p>
                                          {charActor && <p className="text-[10px] text-gray-500 truncate">{charActor.name}</p>}
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-rose-600 shrink-0" />}
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{look.name}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">Change {look.changeNumber} &middot; {look.sceneNumbers.join(", ") || "No scenes"}</p>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => onEditLook(look)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => onDeleteLook(look.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                            {look.continuityNotes && (
                              <p className="text-[10px] text-gray-600 mt-2 bg-amber-50 rounded p-1.5 border border-amber-100">{look.continuityNotes}</p>
                            )}
                            {warnings.length > 0 && (
                              <div className="mt-2 bg-red-50 rounded p-1.5 border border-red-100 flex items-start gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                  {warnings.map((w, i) => (
                                    <p key={i} className="text-[10px] text-red-700">{w}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  CROSS-PLOT TAB                                                     */
/* ================================================================== */

function CrossPlotTab({
  looks,
  characters,
  selectedCharacterId,
  inventory,
}: {
  looks: CostumeLook[]
  characters: Character[]
  selectedCharacterId: string | null
  inventory: CostumeInventoryItem[]
}) {
  const displayChars = selectedCharacterId ? characters.filter((c) => c.id === selectedCharacterId) : characters

  // Gather all scene numbers from looks
  const allScenes = Array.from(new Set(looks.flatMap((l) => l.sceneNumbers))).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10) || 0
    const numB = parseInt(b.replace(/\D/g, ""), 10) || 0
    return numA - numB
  })

  if (allScenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <LayoutGrid className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm font-medium">No scene data yet</p>
        <p className="text-gray-400 text-xs mt-1">Create Looks with scene numbers to populate the cross-plot</p>
      </div>
    )
  }

  // Build matrix lookup
  const matrix: Record<string, Record<string, CostumeLook | null>> = {}
  for (const scene of allScenes) {
    matrix[scene] = {}
    for (const ch of displayChars) {
      matrix[scene][ch.id] = looks.find((l) => l.characterId === ch.id && l.sceneNumbers.includes(scene)) ?? null
    }
  }

  // Detect quick changes: sequential scenes where same character has different looks
  const quickChanges = new Set<string>()
  for (let i = 1; i < allScenes.length; i++) {
    for (const ch of displayChars) {
      const prev = matrix[allScenes[i - 1]][ch.id]
      const curr = matrix[allScenes[i]][ch.id]
      if (prev && curr && prev.id !== curr.id) {
        quickChanges.add(`${allScenes[i]}-${ch.id}`)
      }
    }
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="min-w-max">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-r border-gray-300 min-w-[100px]">Scene</th>
              {displayChars.map((ch) => {
                const castActor = getCastActorForCharacter(ch)
                return (
                  <th key={ch.id} className="px-4 py-2 border-b border-gray-300 min-w-[140px] bg-gray-100">
                    <p className="text-xs font-semibold text-gray-900">{ch.name}</p>
                    {castActor && <p className="text-[10px] text-gray-500 font-normal">{castActor.name}</p>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {allScenes.map((scene) => (
              <tr key={scene} className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white px-4 py-2 text-xs font-medium text-gray-700 border-b border-r border-gray-200">{scene}</td>
                {displayChars.map((ch) => {
                  const look = matrix[scene][ch.id]
                  const isQuick = quickChanges.has(`${scene}-${ch.id}`)
                  return (
                    <td key={ch.id} className={`px-3 py-2 border-b border-gray-200 ${isQuick ? "bg-amber-50" : ""}`}>
                      {look ? (
                        <div className={`rounded-lg px-2 py-1.5 text-xs ${isQuick ? "border-2 border-amber-400 bg-amber-100" : "bg-rose-50 border border-rose-200"}`}>
                          <p className="font-semibold text-gray-900">{look.name}</p>
                          <p className="text-gray-500 text-[10px]">Chg {look.changeNumber}</p>
                          {isQuick && (
                            <span className="inline-flex items-center gap-0.5 mt-1 text-[9px] font-bold text-amber-700">
                              <AlertTriangle className="w-3 h-3" /> Quick Change
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">--</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  SHOPPING TAB                                                       */
/* ================================================================== */

const SHOPPING_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  requested: { bg: "bg-gray-100", text: "text-gray-700" },
  approved: { bg: "bg-blue-100", text: "text-blue-700" },
  ordered: { bg: "bg-amber-100", text: "text-amber-700" },
  received: { bg: "bg-emerald-100", text: "text-emerald-700" },
}

function PurchaseTab({
  shoppingList,
  characters,
  onAdd,
  onUpdateStatus,
  onDelete,
}: {
  shoppingList: CostumeShoppingItem[]
  characters: Character[]
  onAdd: () => void
  onUpdateStatus: (id: string, status: CostumeShoppingItem["status"]) => void
  onDelete: (id: string) => void
}) {
  // Group by vendor
  const grouped: Record<string, CostumeShoppingItem[]> = {}
  for (const item of shoppingList) {
    const vendor = item.vendor || "Unassigned"
    if (!grouped[vendor]) grouped[vendor] = []
    grouped[vendor].push(item)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div>
          <p className="text-sm font-semibold text-gray-900">Purchase Orders</p>
          <p className="text-xs text-gray-500">Grouped by vendor for easy procurement</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Request
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {shoppingList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">Purchase list is empty</p>
            <p className="text-gray-400 text-xs mt-1">Add items that need to be purchased or rented</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([vendor, items]) => (
              <div key={vendor} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-900">{vendor}</span>
                    <span className="text-xs text-gray-500">({items.length} item{items.length !== 1 ? "s" : ""})</span>
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    Est. Total: ${items.reduce((sum, i) => sum + (parseFloat(i.estimatedPrice.replace(/[^0-9.]/g, "")) || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const ch = characters.find((c) => c.id === item.characterId)
                    const s = SHOPPING_STATUS_COLORS[item.status] ?? SHOPPING_STATUS_COLORS.requested
                    return (
                      <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{item.description}</p>
                          <p className="text-[10px] text-gray-500">
                            {ch ? `For: ${ch.name}` : ""} {item.estimatedPrice ? `/ ${item.estimatedPrice}` : ""}
                          </p>
                        </div>
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateStatus(item.id, e.target.value as CostumeShoppingItem["status"])}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border-0 ${s.bg} ${s.text} cursor-pointer`}
                        >
                          <option value="requested">Requested</option>
                          <option value="approved">Approved</option>
                          <option value="ordered">Ordered</option>
                          <option value="received">Received</option>
                        </select>
                        <button onClick={() => onDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  ADD/EDIT INVENTORY ITEM MODAL                                      */
/* ================================================================== */

function AddItemModal({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void
  onSave: (item: Omit<CostumeInventoryItem, "id">) => void
  initial?: CostumeInventoryItem
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [type, setType] = useState<CostumeItemType>(initial?.type ?? "costume-piece")
  const [status, setStatus] = useState<CostumeItemStatus>(initial?.status ?? "in-stock")
  const [brand, setBrand] = useState(initial?.brand ?? "")
  const [size, setSize] = useState(initial?.size ?? "")
  const [price, setPrice] = useState(initial?.purchasePrice ?? "")
  const [vendor, setVendor] = useState(initial?.vendor ?? "")
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "")
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [vibeTags, setVibeTags] = useState<string[]>(initial?.vibeTags ?? [])
  const [returnDate, setReturnDate] = useState(initial?.rentReturnDate ?? "")

  const imgInputRef = useRef<HTMLInputElement>(null)

  const handleImgUpload = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async () => {
      const raw = reader.result as string
      const compressed = await compressImage(raw)
      setImageUrl(compressed)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave({
      name,
      type,
      status,
      brand,
      size,
      purchasePrice: price,
      vendor,
      imageUrl,
      vibeTags,
      notes,
      rentReturnDate: status === "rented" ? returnDate : undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{initial ? "Edit Item" : "Add Item"}</h2>
              <p className="text-xs text-gray-500">Register an item with the wardrobe inventory</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
          </div>

          {/* Image upload */}
          <div className="flex items-start gap-4 mb-5">
            <div className="flex-1 space-y-3">
              <FloatingInput label="Name" value={name} onChange={setName} />
              <div className="grid grid-cols-2 gap-3">
                <FloatingSelect label="Type" value={type} onChange={(v) => setType(v as CostumeItemType)} options={Object.entries(ITEM_TYPES).map(([k, v]) => ({ value: k, label: v }))} />
                <FloatingSelect label="Status" value={status} onChange={(v) => setStatus(v as CostumeItemStatus)} options={Object.entries(STATUS_COLORS).map(([k, v]) => ({ value: k, label: v.label }))} />
              </div>
            </div>
            <button
              onClick={() => imgInputRef.current?.click()}
              className="w-24 h-32 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-rose-300 transition-colors flex flex-col items-center justify-center overflow-hidden shrink-0"
            >
{isValidImageUrl(imageUrl) ? (
              <img src={imageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${isDragOver ? "bg-gray-100" : ""}`}><Shirt className="w-8 h-8 text-gray-300" /></div>
            )}
            </button>
            <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImgUpload(e.target.files[0]) }} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <FloatingInput label="Brand" value={brand} onChange={setBrand} />
            <FloatingInput label="Size" value={size} onChange={setSize} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <FloatingInput label="Purchase Price" value={price} onChange={setPrice} />
            <FloatingInput label="Vendor" value={vendor} onChange={setVendor} />
          </div>

          {status === "rented" && (
            <div className="mb-4">
              <FloatingInput label="Return Date" value={returnDate} onChange={setReturnDate} type="date" />
            </div>
          )}

          {/* Vibe tags */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Vibe Tags</p>
            {type !== "costume-piece" && (
              <>
                <p className="text-[10px] text-amber-600 font-medium mb-1.5">Makeup & HMU</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {MAKEUP_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setVibeTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                      className={`px-2 py-1 text-[10px] font-medium rounded-full transition-colors ${vibeTags.includes(tag) ? "bg-amber-100 text-amber-700 border border-amber-300" : "bg-gray-100 text-gray-500 border border-transparent hover:bg-gray-200"}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </>
            )}
            <p className="text-[10px] text-rose-600 font-medium mb-1.5">Wardrobe</p>
            <div className="flex flex-wrap gap-1.5">
              {VIBE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setVibeTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                  className={`px-2 py-1 text-[10px] font-medium rounded-full transition-colors ${vibeTags.includes(tag) ? "bg-rose-100 text-rose-700 border border-rose-300" : "bg-gray-100 text-gray-500 border border-transparent hover:bg-gray-200"}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300 resize-none" />
          </div>

          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={!name.trim()} className="px-5 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-40 transition-colors">
              {initial ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  LOOK BUILDER MODAL                                                 */
/* ================================================================== */

function LookBuilderModal({
  onClose,
  onSave,
  initial,
  characters,
  inventory,
  allergyWarnings,
}: {
  onClose: () => void
  onSave: (look: CostumeLook) => void
  initial: CostumeLook | null
  characters: Character[]
  inventory: CostumeInventoryItem[]
  allergyWarnings: (characterId: string, itemIds: string[]) => string[]
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [characterId, setCharacterId] = useState(initial?.characterId ?? (characters[0]?.id ?? ""))
  const [changeNumber, setChangeNumber] = useState(initial?.changeNumber ?? "1")
  const [scriptDays, setScriptDays] = useState(initial?.scriptDays?.join(", ") ?? "")
  const [sceneNumbers, setSceneNumbers] = useState(initial?.sceneNumbers?.join(", ") ?? "")
  const [continuityNotes, setContinuityNotes] = useState(initial?.continuityNotes ?? "")
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(initial?.itemIds ?? [])
  const [searchInv, setSearchInv] = useState("")

  const warnings = allergyWarnings(characterId, selectedItemIds)

  const filteredInv = inventory.filter((i) => {
    if (searchInv) {
      const s = searchInv.toLowerCase()
      return i.name.toLowerCase().includes(s) || i.vibeTags.some((t) => t.toLowerCase().includes(s))
    }
    return true
  })

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleSave = () => {
    if (!name.trim() || !characterId) return
    onSave({
      id: initial?.id ?? uid(),
      name,
      characterId,
      changeNumber,
      scriptDays: scriptDays
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sceneNumbers: sceneNumbers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      itemIds: selectedItemIds,
      continuityNotes,
      referencePhotos: initial?.referencePhotos ?? [],
      matchPhotos: initial?.matchPhotos ?? [],
    })
  }

  const selectedChar = characters.find((c) => c.id === characterId)
  const castActor = selectedChar ? getCastActorForCharacter(selectedChar) : null

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{initial ? "Edit Look" : "New Look"}</h2>
            <p className="text-xs text-gray-500">Combine wardrobe and makeup items into a character look</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <FloatingInput label="Look Name" value={name} onChange={setName} />
            <FloatingSelect
              label="Character"
              value={characterId}
              onChange={setCharacterId}
              options={characters.map((c) => {
                const ca = getCastActorForCharacter(c)
                return { value: c.id, label: `${c.name}${ca ? ` (${ca.name})` : ""}` }
              })}
            />
          </div>

          {castActor && (
            <div className="flex items-center gap-2 mb-4 bg-gray-50 rounded-lg px-3 py-2">
              {isValidImageUrl(castActor.headshots?.[0]) ? (
                <img src={castActor.headshots[0]} alt="" className="w-6 h-8 rounded object-cover" />
              ) : (
                <div className="w-6 h-8 rounded bg-gray-200 flex items-center justify-center"><User className="w-3 h-3 text-gray-400" /></div>
              )}
              <span className="text-xs text-gray-600">Cast: <strong>{castActor.name}</strong></span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            <FloatingInput label="Change #" value={changeNumber} onChange={setChangeNumber} />
            <FloatingInput label="Script Days (comma-sep)" value={scriptDays} onChange={setScriptDays} />
            <FloatingInput label="Scene Numbers (comma-sep)" value={sceneNumbers} onChange={setSceneNumbers} />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Continuity Notes</label>
            <textarea value={continuityNotes} onChange={(e) => setContinuityNotes(e.target.value)} rows={2} placeholder="Top button undone, mud on left boot..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300 resize-none" />
          </div>

          {/* Allergy warnings */}
          {warnings.length > 0 && (
            <div className="mb-4 bg-red-50 rounded-xl p-3 border border-red-200 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-800 mb-1">Allergy Warning</p>
                {warnings.map((w, i) => (
                  <p key={i} className="text-[10px] text-red-700">{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Item picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-700">Select Items ({selectedItemIds.length} chosen)</p>
              <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input value={searchInv} onChange={(e) => setSearchInv(e.target.value)} placeholder="Search inventory..." className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-rose-300" />
              </div>
            </div>

            {/* Wardrobe items */}
            {(() => {
              const wardrobeItems = filteredInv.filter((i) => i.type === "costume-piece")
              const makeupItems = filteredInv.filter((i) => i.type === "hmu-consumable" || i.type === "durable")
              return (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {/* Wardrobe section */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Shirt className="w-3.5 h-3.5 text-rose-500" />
                      <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Wardrobe</p>
                      <span className="text-[10px] text-gray-400 ml-1">{wardrobeItems.length} items</span>
                    </div>
                    {wardrobeItems.length > 0 ? (
                      <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                        {wardrobeItems.map((item) => {
                          const isSelected = selectedItemIds.includes(item.id)
                          return (
                            <button
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              className={`rounded-lg border-2 overflow-hidden transition-all text-left ${isSelected ? "border-rose-500 ring-2 ring-rose-200" : "border-gray-200 hover:border-gray-300"}`}
                            >
                              <div className="aspect-[3/4] bg-gray-100 relative">
{isValidImageUrl(item.imageUrl) ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Shirt className="w-5 h-5 text-gray-300" /></div>
                )}
                                {isSelected && (
                                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] font-medium text-gray-800 p-1.5 truncate">{item.name}</p>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 py-3 text-center">No wardrobe items found</p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200" />

                  {/* Makeup section */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Scissors className="w-3.5 h-3.5 text-amber-500" />
                      <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Makeup & HMU</p>
                      <span className="text-[10px] text-gray-400 ml-1">{makeupItems.length} items</span>
                    </div>
                    {makeupItems.length > 0 ? (
                      <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                        {makeupItems.map((item) => {
                          const isSelected = selectedItemIds.includes(item.id)
                          return (
                            <button
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              className={`rounded-lg border-2 overflow-hidden transition-all text-left ${isSelected ? "border-amber-500 ring-2 ring-amber-200" : "border-gray-200 hover:border-gray-300"}`}
                            >
                              <div className="aspect-[3/4] bg-gray-100 relative">
{isValidImageUrl(item.imageUrl) ? (
                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                          ) : (
                            <Shirt className="w-6 h-6 text-gray-300" />
                          )}
                                {isSelected && (
                                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] font-medium text-gray-800 p-1.5 truncate">{item.name}</p>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 py-3 text-center">No makeup items found</p>
                    )}
                  </div>

                  {filteredInv.length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-8">No items found. Add items in the Wardrobe or Makeup tabs first.</p>
                  )}
                </div>
              )
            })()}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || !characterId} className="px-5 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-40 transition-colors">
            {initial ? "Save Look" : "Create Look"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  ACTOR SPECS MODAL                                                  */
/* ================================================================== */

function ActorSpecsModal({
  actorId,
  characters,
  specs,
  onClose,
  onSave,
}: {
  actorId: string
  characters: Character[]
  specs?: { measurements: ActorMeasurements; hmuSpecs: ActorHMUSpecs }
  onClose: () => void
  onSave: (m: ActorMeasurements, h: ActorHMUSpecs) => void
}) {
  // Find actor across all characters
  let actorName = "Unknown"
  let characterName = ""
  for (const ch of characters) {
    const all = getAllActorsForCharacter(ch)
    const a = all.find((a) => a.id === actorId)
    if (a) {
      actorName = a.name
      characterName = ch.name
      break
    }
  }

  const [chest, setChest] = useState(specs?.measurements?.chest ?? "")
  const [waist, setWaist] = useState(specs?.measurements?.waist ?? "")
  const [inseam, setInseam] = useState(specs?.measurements?.inseam ?? "")
  const [hat, setHat] = useState(specs?.measurements?.hat ?? "")
  const [ring, setRing] = useState(specs?.measurements?.ring ?? "")
  const [glove, setGlove] = useState(specs?.measurements?.glove ?? "")
  const [shoe, setShoe] = useState(specs?.measurements?.shoe ?? "")

  const [skinTone, setSkinTone] = useState(specs?.hmuSpecs?.skinToneCode ?? "")
  const [hairType, setHairType] = useState(specs?.hmuSpecs?.hairType ?? "")
  const [hairColor, setHairColor] = useState(specs?.hmuSpecs?.hairColor ?? "")
  const [allergies, setAllergies] = useState(specs?.hmuSpecs?.allergies?.join(", ") ?? "")
  const [tattoos, setTattoos] = useState(
    specs?.hmuSpecs?.tattoos?.map((t) => `${t.location}${t.coverUpNeeded ? " (cover-up)" : ""}`).join(", ") ?? "",
  )

  const handleSave = () => {
    onSave(
      { chest, waist, inseam, hat, ring, glove, shoe },
      {
        skinToneCode: skinTone,
        hairType,
        hairColor,
        allergies: allergies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        tattoos: tattoos
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((t) => ({
            location: t.replace(" (cover-up)", ""),
            coverUpNeeded: t.includes("(cover-up)"),
          })),
      },
    )
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-900">{actorName}</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-xs text-gray-500 mb-5">Measurements & HMU specs{characterName ? ` (as ${characterName})` : ""}</p>

          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5" /> Measurements</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <FloatingInput label="Chest" value={chest} onChange={setChest} />
            <FloatingInput label="Waist" value={waist} onChange={setWaist} />
            <FloatingInput label="Inseam" value={inseam} onChange={setInseam} />
            <FloatingInput label="Hat" value={hat} onChange={setHat} />
            <FloatingInput label="Ring" value={ring} onChange={setRing} />
            <FloatingInput label="Glove" value={glove} onChange={setGlove} />
            <FloatingInput label="Shoe" value={shoe} onChange={setShoe} />
          </div>

          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5" /> HMU Specifics</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <FloatingInput label="Skin Tone (Pantone/MAC)" value={skinTone} onChange={setSkinTone} />
            <FloatingInput label="Hair Type" value={hairType} onChange={setHairType} />
            <FloatingInput label="Hair Color" value={hairColor} onChange={setHairColor} />
          </div>

          <div className="space-y-3 mb-5">
            <FloatingInput label="Allergies (comma-separated)" value={allergies} onChange={setAllergies} />
            <FloatingInput label="Tattoos (comma-sep, add '(cover-up)' if needed)" value={tattoos} onChange={setTattoos} />
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} className="px-5 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors">Save Specs</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  SHOPPING FORM MODAL                                                */
/* ================================================================== */

function ShoppingFormModal({
  characters,
  onClose,
  onSave,
}: {
  characters: Character[]
  onClose: () => void
  onSave: (item: Omit<CostumeShoppingItem, "id">) => void
}) {
  const [description, setDescription] = useState("")
  const [vendor, setVendor] = useState("")
  const [price, setPrice] = useState("")
  const [charId, setCharId] = useState("")

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Add Purchase Request</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-3 mb-5">
            <FloatingInput label="Description" value={description} onChange={setDescription} />
            <FloatingInput label="Vendor" value={vendor} onChange={setVendor} />
            <FloatingInput label="Estimated Price" value={price} onChange={setPrice} />
            <FloatingSelect
              label="For Character (optional)"
              value={charId}
              onChange={setCharId}
              options={[{ value: "", label: "None" }, ...characters.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (!description.trim()) return
                onSave({
                  description,
                  vendor,
                  estimatedPrice: price,
                  status: "requested",
                  requestedBy: "Current User",
                  characterId: charId || undefined,
                })
              }}
              disabled={!description.trim()}
              className="px-5 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-40 transition-colors"
            >
              Add Request
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  SHARED UI PRIMITIVES                                               */
/* ================================================================== */

function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="relative">
      <label className="absolute left-3 top-1.5 text-[10px] text-gray-500 pointer-events-none">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pt-5 pb-2 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300"
      />
    </div>
  )
}

function FloatingSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <label className="absolute left-3 top-1.5 text-[10px] text-gray-500 pointer-events-none z-[1]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pt-5 pb-2 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-rose-300 appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}
