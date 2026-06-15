"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { User } from "firebase/auth"
import { Location, LocationProject } from "@/types/location-scouting"
import { subscribeToAuthStateChanges } from "@/lib/auth"
import {
  subscribeToLocationProjects,
  addLocationProject,
  updateLocationProject as updateLocationProjectInFirestore,
  deleteLocationProject as deleteLocationProjectFromFirestore,
} from "@/lib/firestore"
import { loadDemoData, saveDemoData, DEMO_STORAGE_KEYS } from "@/utils/demoPersistence"

type ViewState = "projects" | "upload" | "results"

interface LocationScoutingContextType {
  projects: LocationProject[]
  currentProject: LocationProject | null
  view: ViewState
  isLoading: boolean
  setView: (view: ViewState) => void
  setCurrentProject: (project: LocationProject | null) => void
  addProject: (project: LocationProject) => void
  updateProject: (project: LocationProject) => void
  deleteProject: (projectId: string) => void
  addLocation: (projectId: string, location: Location) => void
  updateLocation: (projectId: string, location: Location) => void
  deleteLocation: (projectId: string, locationId: string) => void
}

const LocationScoutingContext = createContext<LocationScoutingContextType | null>(null)

// Demo data - shown when user is not logged in

// Helper: build described locations for a demo project from compact tuples.
// Tuple shape: [name, type, timeOfDay, description, scoutingNotes]
const buildLocations = (
  key: string,
  rows: [string, "INT" | "EXT", "DAY" | "NIGHT" | "DAWN" | "DUSK", string, string][]
): Location[] =>
  rows.map(([name, type, timeOfDay, description, scoutingNotes], i) => ({
    id: `${key}-loc-${i + 1}`,
    name,
    type,
    timeOfDay,
    description,
    scoutingNotes,
  }))

const extraLocationProjects: LocationProject[] = [
  {
    id: "demo-loc-noir",
    name: "CITY OF ASH Script",
    createdAt: new Date("2026-05-02"),
    updatedAt: new Date("2026-05-02"),
    isDemo: true,
    locations: buildLocations("noir", [
      ["DOWNTOWN - RAIN-SLICKED ALLEY", "EXT", "NIGHT", "A narrow brick alley glistening under a flickering neon sign, steam rising from a sewer grate.", "Need controlled water/rain rig and overhead neon. Look for alleys with practical fire escapes."],
      ["DETECTIVE'S OFFICE", "INT", "NIGHT", "A cramped office with venetian blinds casting hard stripes across a whiskey-stained desk.", "Practical window for blind shadows; space for slow dolly. Period furniture dressing required."],
      ["JAZZ CLUB - MAIN FLOOR", "INT", "NIGHT", "A smoky basement club with a brass quartet, red booths, and a haze of cigarette smoke.", "Low ceilings ideal but need rigging points. Hire live band or playback; smoke permit needed."],
      ["HARBOR - PIER 9", "EXT", "DUSK", "A weathered shipping pier with stacked crates and a lone freighter horn in the distance.", "Coordinate with working port for access. Magic-hour window is tight; plan two evenings."],
      ["POLICE PRECINCT - BULLPEN", "INT", "DAY", "A busy bullpen of metal desks, ringing phones, and a captain's glass-walled office.", "Large open floor needed; 20+ extras. Source period typewriters and rotary phones."],
      ["ROOFTOP - WATER TOWER", "EXT", "NIGHT", "A tar-paper rooftop beneath a rusted water tower overlooking the glittering skyline.", "Safety rails and fall protection essential. Skyline backdrop or VFX plate may be required."],
      ["DINER - LATE NIGHT", "INT", "NIGHT", "A chrome-edged diner with a long counter, lone waitress, and a humming jukebox.", "Practical period diner preferred over build. Need controllable exterior street glow."],
      ["TENEMENT - STAIRWELL", "INT", "NIGHT", "A peeling stairwell with a single swinging bulb and graffiti-covered plaster.", "Tight access for camera; consider removable wall section. Stunt pads for fall scene."],
      ["RIVERSIDE - UNDER THE BRIDGE", "EXT", "DAWN", "A concrete embankment beneath an iron bridge where the river fog never fully lifts.", "Fog machines plus natural mist; early call. Check tide and water safety for crew."],
      ["MAYOR'S MANSION - STUDY", "INT", "NIGHT", "An opulent oak-paneled study with a roaring fireplace and walls of leather-bound books.", "Historic home location scout; fire marshal for working fireplace. Protect antique surfaces."],
      ["PAWN SHOP", "INT", "DAY", "A cluttered shop behind iron bars, glass cases glinting with watches and pistols.", "Dress an existing retail space. Prop weapons require armorer and signage compliance."],
      ["TRAIN STATION - PLATFORM 4", "EXT", "DUSK", "A grand station platform wreathed in steam as a midnight express prepares to depart.", "Heritage railway location; book steam engine in advance. Crowd of period extras needed."],
    ]),
  },
  {
    id: "demo-loc-coast",
    name: "TIDES OF SUMMER Script",
    createdAt: new Date("2026-05-03"),
    updatedAt: new Date("2026-05-03"),
    isDemo: true,
    locations: buildLocations("coast", [
      ["BEACH - MORNING SURF", "EXT", "DAY", "A wide golden beach with rolling surf and a lone red lifeguard tower.", "Permit for vehicle access on sand; tide schedule critical. Sun comes around fast—storyboard."],
      ["BOARDWALK - ARCADE", "EXT", "DUSK", "A bustling boardwalk lined with arcade lights, a Ferris wheel turning against a pink sky.", "Negotiate with amusement operator for ride control. Practical bulbs may need dimmer rig."],
      ["BEACH HOUSE - SUN PORCH", "INT", "DAY", "A breezy whitewashed porch with linen curtains billowing toward the sea.", "South-facing porch for soft light. Rent furnished rental; protect floors and rattan furniture."],
      ["TIDE POOLS - ROCKY POINT", "EXT", "DAWN", "Glassy tide pools among black volcanic rocks teeming with starfish at first light.", "Slippery rocks—safety brief and grip mats. Dawn-only; coordinate with marine conservation."],
      ["ICE CREAM PARLOR", "INT", "DAY", "A pastel parlor with checkerboard floors, a chrome counter, and spinning ceiling fans.", "Practical period parlor or dress a cafe. Refrigeration for real product or food stylist."],
      ["MARINA - SAILBOAT DECK", "EXT", "DAY", "A teak sailboat deck rocking gently in a harbor full of white masts.", "Charter boat plus safety vessel. Gimbal or stabilizer for deck movement; weather contingency."],
      ["BONFIRE - DUNES", "EXT", "NIGHT", "A crackling bonfire ringed by teenagers on a dark dune under a spray of stars.", "Fire permit and extinguishers on hand. Generator for hidden lighting; star field may be VFX."],
      ["LIFEGUARD STATION", "INT", "DAY", "A sun-bleached lifeguard hut crammed with rescue gear and a wall of faded photos.", "Small interior—minimal crew. Borrow authentic rescue equipment for set dressing."],
      ["SEASIDE CHAPEL", "INT", "DAY", "A tiny whitewashed chapel with sea-blue stained glass throwing color across the pews.", "Working chapel; schedule around services. Stained glass needs no fill—plan exposure."],
      ["CLIFF PATH - OVERLOOK", "EXT", "DUSK", "A grassy cliff path ending at a dizzying overlook above crashing waves.", "Fall protection at the edge; mark safe zones. Wind affects sound—plan ADR."],
      ["FISH MARKET - HARBORSIDE", "EXT", "DAY", "A noisy open-air market of crushed ice, gleaming catch, and shouting vendors.", "Early morning while market is live. Negotiate vendor releases; manage real odors for cast."],
      ["MOTEL - POOLSIDE", "EXT", "NIGHT", "A retro motel courtyard glowing turquoise from an underlit kidney-shaped pool.", "Vintage motel location; pool safety and lighting in water. Neon sign practical or rebuilt."],
    ]),
  },
  {
    id: "demo-loc-mountain",
    name: "THE ASCENT Script",
    createdAt: new Date("2026-05-04"),
    updatedAt: new Date("2026-05-04"),
    isDemo: true,
    locations: buildLocations("mtn", [
      ["BASE CAMP - GLACIER EDGE", "EXT", "DAY", "A cluster of bright expedition tents pitched on blue glacial ice beneath a sheer peak.", "Helicopter access likely; altitude crew health plan. Cold-weather gear for equipment too."],
      ["MOUNTAIN LODGE - GREAT HALL", "INT", "NIGHT", "A timber lodge hall with a stone hearth, antler chandeliers, and frosted windows.", "Rent off-season ski lodge. Working fireplace permit; warm interior for long shoot days."],
      ["RIDGELINE - SUMMIT PUSH", "EXT", "DAWN", "A knife-edge snow ridge where climbers inch forward against a blinding sunrise.", "Stunt riggers and mountain guides mandatory. Weather window may be hours—standby plan."],
      ["CREVASSE - ICE INTERIOR", "INT", "DAY", "A cathedral of glowing blue ice walls dripping with meltwater deep inside the glacier.", "Likely set build or studio ice; real crevasse too dangerous. Practical blue uplighting."],
      ["ALPINE MEADOW - WILDFLOWERS", "EXT", "DAY", "A sweeping high meadow exploding with wildflowers ringed by snow-capped peaks.", "Protect protected flora—matting and minimal footprint. Drone permits for sweeping shots."],
      ["RANGER STATION", "INT", "DAY", "A snug ranger cabin lined with topographic maps, a radio set, and a wood stove.", "Practical cabin; generator for lights. Source period radio gear and survey maps."],
      ["FROZEN LAKE - CROSSING", "EXT", "DAY", "A vast frozen lake under flat grey light where every footstep echoes through the ice.", "Ice thickness survey by experts before any crew. Safety lines; backup warming tent."],
      ["CABLE CAR - MID-ASCENT", "INT", "DAY", "A swaying gondola car climbing through cloud, the valley vanishing far below.", "Charter cable car system off-hours. Gimbal for sway; comms with operator essential."],
      ["AVALANCHE SLOPE - AFTERMATH", "EXT", "DAY", "A churned field of broken snow and splintered pines after a slide has passed.", "Controlled snow FX or post-slide natural site with avalanche control sign-off."],
      ["CHAPEL OF SNOWS", "INT", "DUSK", "A tiny stone alpine chapel half-buried in drifts, candlelight warming the icy walls.", "Heritage structure—protect interior. Candle safety; exterior snow may need augmentation."],
      ["FOREST TRAIL - TREELINE", "EXT", "DAY", "A pine trail climbing to where the forest thins into bare rock and wind-bent trees.", "Accessible by foot with gear carts. Watch for wildlife; plan for shifting mountain light."],
      ["MEDICAL TENT - INTERIOR", "INT", "NIGHT", "A cramped orange medical tent lit by headlamps as a storm howls against the canvas.", "Easy studio or location build. Wind/snow FX outside; sound blanket for storm ambience."],
    ]),
  },
  {
    id: "demo-loc-desert",
    name: "DUST AND GOLD Script",
    createdAt: new Date("2026-05-05"),
    updatedAt: new Date("2026-05-05"),
    isDemo: true,
    locations: buildLocations("desert", [
      ["SALOON - MAIN ROOM", "INT", "DAY", "A swinging-door saloon with a long bar, faro tables, and dust hanging in shafts of light.", "Western backlot or build. Haze for light shafts; period glassware and an upright piano."],
      ["MAIN STREET - HIGH NOON", "EXT", "DAY", "A sun-baked frontier street of clapboard storefronts facing off in dead silence.", "Backlot western town. Dust control vs. atmosphere balance; horses need wrangler."],
      ["DESERT MESA - OVERLOOK", "EXT", "DUSK", "A towering red mesa glowing crimson as the sun bleeds into the horizon.", "Iconic mesa park—strict permits and no-trace rules. 4x4 access; magic-hour only."],
      ["GOLD MINE - SHAFT ENTRANCE", "EXT", "DAY", "A timber-braced mine mouth in a rocky hillside with a rusted ore cart on bent rails.", "Historic mine site; structural safety check. No real descent—interior to be built."],
      ["HOMESTEAD - KITCHEN", "INT", "DAY", "A spare frontier kitchen with a cast-iron stove, hanging herbs, and a rough plank table.", "Living-history museum or build. Working stove permit; period cookware dressing."],
      ["CANYON - NARROW PASS", "EXT", "DAY", "A slot canyon of wind-carved sandstone barely wide enough for a single rider.", "Flash-flood weather check mandatory. Limited crew footprint; natural reflected light."],
      ["TRADING POST", "INT", "DAY", "A dim trading post crowded with pelts, tools, barrels, and bolts of bright cloth.", "Dress existing barn/store. Source authentic trade goods; control window light for mood."],
      ["RIVER CROSSING - FORD", "EXT", "DAY", "A shallow muddy ford where a wagon strains against the current of a brown river.", "Wrangler and water-safety team for animals. Wagon stunt rehearsal; downstream spotters."],
      ["SHERIFF'S OFFICE - CELLS", "INT", "NIGHT", "A lamplit jail with iron-barred cells and a gun rack behind a battered desk.", "Build or dress; iron bars for sound and look. Prop weapons under armorer control."],
      ["CAMPFIRE - OPEN RANGE", "EXT", "NIGHT", "A lone campfire on the open plain, the Milky Way blazing above the sleeping herd.", "Dark-sky location for real stars or VFX plate. Fire permit; livestock and wrangler."],
      ["CHURCH - ADOBE MISSION", "INT", "DAY", "A cool adobe mission with thick white walls and a single shaft of light on the altar.", "Heritage mission—respect services and decor. Single-source daylight; minimal augmentation."],
      ["STAGECOACH - INTERIOR", "INT", "DAY", "The jostling interior of a stagecoach, passengers packed knee-to-knee in the heat.", "Coach on a gimbal/process trailer. Dust and exterior plates; tight rig for camera."],
    ]),
  },
  {
    id: "demo-loc-metro",
    name: "MIDNIGHT METRO Script",
    createdAt: new Date("2026-05-06"),
    updatedAt: new Date("2026-05-06"),
    isDemo: true,
    locations: buildLocations("metro", [
      ["SUBWAY PLATFORM - LATE", "INT", "NIGHT", "A deserted tiled platform humming with fluorescent buzz as a distant train approaches.", "Negotiate transit-authority night access. Practical fluorescents; safety on live tracks."],
      ["ROOFTOP BAR - SKYLINE", "EXT", "NIGHT", "A chic rooftop bar with string lights framing a glittering downtown skyline.", "Venue rental after hours. Skyline as backdrop; manage ambient city sound for dialogue."],
      ["LOFT APARTMENT - OPEN PLAN", "INT", "NIGHT", "A converted industrial loft with exposed brick, huge windows, and a wall of vinyl records.", "Practical loft location. Window treatment for city glow; protect floors and fixtures."],
      ["TAXI - BACK SEAT", "INT", "NIGHT", "The back seat of a yellow cab, neon streaking past the rain-streaked windows.", "Process trailer or rigged cab. Rain bars and exterior light streaks; intimate two-camera setup."],
      ["24-HR LAUNDROMAT", "INT", "NIGHT", "A buzzing laundromat of spinning dryers and green light where insomniacs fold in silence.", "Rent off-hours laundromat. Practical machines for sound and motion; control flicker."],
      ["BRIDGE - PEDESTRIAN WALK", "EXT", "DAWN", "A long suspension-bridge walkway where the city wakes in a wash of pale gold.", "Permit and possible lane control. Dawn light is brief; wind and traffic noise plan."],
      ["CORNER BODEGA", "INT", "NIGHT", "A cramped bodega glowing with snack racks, a humming cooler, and a cat on the counter.", "Working bodega after close. Source product dressing; manage tight aisles for camera."],
      ["PARKING GARAGE - LEVEL 3", "INT", "NIGHT", "An echoing concrete garage lit by sodium lamps, a single car idling in the gloom.", "Rent garage level overnight. Sodium-vapor look or gels; exhaust ventilation for idling car."],
      ["FIRE ESCAPE - WALK-UP", "EXT", "NIGHT", "A black iron fire escape clinging to a brick walk-up, laundry lines crossing the gap.", "Engineering check for load. Stunt pads if climbing; backlight from windows for separation."],
      ["DINER - 3 AM", "INT", "NIGHT", "A lonely all-night diner where a tired cook and one customer share the radio's static.", "Practical diner overnight. Controllable exterior street light; minimal background extras."],
      ["RIVERFRONT - PIER LIGHTS", "EXT", "DUSK", "A wooden riverfront pier strung with bulbs reflecting in the slow dark water.", "Pier permit and water safety. Practical bulb strings; magic-hour reflection window."],
      ["RADIO STATION - BOOTH", "INT", "NIGHT", "A soundproofed late-night radio booth glowing with console lights and a single mic.", "Real station off-air or build. Practical console glow; genuine broadcast gear for detail."],
    ]),
  },
]

const demoProjects: LocationProject[] = [
  {
    id: "demo-1",
    name: "JURASSIC PARK Script",
    createdAt: new Date("2026-04-29"),
    updatedAt: new Date("2026-04-29"),
    isDemo: true,
    locations: [
      {
        id: "1",
        name: "JUNGLE - HOLDING PEN",
        type: "EXT",
        timeOfDay: "NIGHT",
        description: "A dense, dark jungle clearing on Isla Nublar featuring a massive, San Quentin-style holding pen with a guard tower and electrified fences. A large crate is shoved into a slot in the pen using a bulldozer while riflemen and workers stand by.",
        scoutingNotes: "Requires a large clearing suitable for heavy machinery and a high-security industrial fence set. Must accommodate a large crate and searchlights.",
      },
      {
        id: "2",
        name: "MOUNTAIN - AMBER MINE",
        type: "EXT",
        timeOfDay: "DAY",
        description: "A rocky, manual mining operation on a hillside in the Dominican Republic. Workers use picks and shovels to scrape the rock, and visitors arrive via a raft pulled across a river.",
        scoutingNotes: "Requires a steep, rocky landscape and a nearby water source for the raft scene. Look for active or historical manual excavation sites.",
      },
      {
        id: "3",
        name: "AMBER MINE - CAVE",
        type: "EXT",
        timeOfDay: "DAY",
        description: "A dark, dripping cave within the amber mine where sunlight streams through the mouth. The interior is cramped and filled with workers examining finds.",
        scoutingNotes: "A natural cave or limestone mine with a wide enough opening for sunlight to provide strong backlighting for translucent objects.",
      },
      {
        id: "4",
        name: "THE DIG - MONTANA BADLANDS",
        type: "EXT",
        timeOfDay: "DAY",
        description: "A vast, arid expanse of crumbling limestone with checkered excavation pits. The site includes a base camp with teepees, a mess tent, and various dig equipment.",
        scoutingNotes: "Requires a remote, desert-like terrain with existing or buildable excavation areas. Access for crew and equipment trucks essential.",
      },
      {
        id: "5",
        name: "DIG OFFICE - TRAILER",
        type: "INT",
        timeOfDay: "DAY",
        description: "A dusty mobile home converted into a laboratory and office. Every surface is covered with bone specimens, ceramic dishes, and labeling tags.",
        scoutingNotes: "A practical trailer or mobile unit that can be dressed as a working paleontology lab with adequate power for computers and lighting.",
      },
      {
        id: "6",
        name: "SAN JOSE - CAFE",
        type: "EXT",
        timeOfDay: "DAY",
        description: "A public outdoor cafe in Costa Rica where patrons sit at small tables. The atmosphere is tropical and casual.",
        scoutingNotes: "An outdoor cafe with tropical vegetation, preferably with ocean or jungle views. Need space for extras and equipment.",
      },
    ],
  },
  ...extraLocationProjects,
]

export function LocationScoutingProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<LocationProject[]>(() =>
    loadDemoData(DEMO_STORAGE_KEYS.locationProjects, demoProjects)
  )
  const [currentProject, setCurrentProject] = useState<LocationProject | null>(null)
  const [view, setView] = useState<ViewState>("projects")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Persist demo-mode data so it survives navigation/remounts when no backend is signed in.
  useEffect(() => {
    if (user) return
    saveDemoData(DEMO_STORAGE_KEYS.locationProjects, projects)
  }, [projects, user])

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthStateChanges((authUser) => {
      setUser(authUser)
      if (!authUser) {
        // User logged out (or no backend configured): show persisted demo data.
        setProjects(loadDemoData(DEMO_STORAGE_KEYS.locationProjects, demoProjects))
        setCurrentProject(null)
        setView("projects")
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Subscribe to Firestore when user is authenticated
  useEffect(() => {
    if (!user) return

    setIsLoading(true)
    const unsubscribe = subscribeToLocationProjects(
      user.uid,
      (firestoreProjects) => {
        setProjects(firestoreProjects)
        // Update currentProject if it exists in the new data
        if (currentProject) {
          const updated = firestoreProjects.find((p) => p.id === currentProject.id)
          if (updated) {
            setCurrentProject(updated)
          }
        }
        setIsLoading(false)
      },
      (error) => {
        console.error("[v0] Error subscribing to location projects:", error)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const addProject = async (project: LocationProject) => {
    if (user) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, isDemo, ...projectData } = project
        const newId = await addLocationProject(user.uid, projectData)
        // Firestore subscription will update the state
        setCurrentProject({ ...project, id: newId, isDemo: false })
      } catch (error) {
        console.error("[v0] Error adding location project:", error)
      }
    } else {
      // Demo mode
      setProjects((prev) => [...prev, project])
    }
  }

  const updateProject = async (project: LocationProject) => {
    const existingProject = projects.find((p) => p.id === project.id)
    if (!existingProject) return

    if (user && !existingProject.isDemo) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, isDemo, ...projectData } = project
        await updateLocationProjectInFirestore(user.uid, project.id, projectData)
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error updating location project:", error)
      }
    } else {
      // Demo mode
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)))
      if (currentProject?.id === project.id) {
        setCurrentProject(project)
      }
    }
  }

  const deleteProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    if (user && !project.isDemo) {
      try {
        await deleteLocationProjectFromFirestore(user.uid, projectId)
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error deleting location project:", error)
      }
    } else {
      // Demo mode
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
    }

    if (currentProject?.id === projectId) {
      setCurrentProject(null)
      setView("projects")
    }
  }

  const addLocation = async (projectId: string, location: Location) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const updatedLocations = [...project.locations, location]
    const updatedProject = { ...project, locations: updatedLocations, updatedAt: new Date() }

    if (user && !project.isDemo) {
      try {
        await updateLocationProjectInFirestore(user.uid, projectId, {
          locations: updatedLocations,
        })
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error adding location:", error)
      }
    } else {
      // Demo mode
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)))
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
    }
  }

  const updateLocation = async (projectId: string, location: Location) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const updatedLocations = project.locations.map((l) =>
      l.id === location.id ? location : l
    )
    const updatedProject = { ...project, locations: updatedLocations, updatedAt: new Date() }

    if (user && !project.isDemo) {
      try {
        await updateLocationProjectInFirestore(user.uid, projectId, {
          locations: updatedLocations,
        })
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error updating location:", error)
      }
    } else {
      // Demo mode
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)))
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
    }
  }

  const deleteLocation = async (projectId: string, locationId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const updatedLocations = project.locations.filter((l) => l.id !== locationId)
    const updatedProject = { ...project, locations: updatedLocations, updatedAt: new Date() }

    if (user && !project.isDemo) {
      try {
        await updateLocationProjectInFirestore(user.uid, projectId, {
          locations: updatedLocations,
        })
        // Firestore subscription will update the state
      } catch (error) {
        console.error("[v0] Error deleting location:", error)
      }
    } else {
      // Demo mode
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)))
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
    }
  }

  return (
    <LocationScoutingContext.Provider
      value={{
        projects,
        currentProject,
        view,
        isLoading,
        setView,
        setCurrentProject,
        addProject,
        updateProject,
        deleteProject,
        addLocation,
        updateLocation,
        deleteLocation,
      }}
    >
      {children}
    </LocationScoutingContext.Provider>
  )
}

export function useLocationScouting() {
  const context = useContext(LocationScoutingContext)
  if (!context) {
    throw new Error("useLocationScouting must be used within a LocationScoutingProvider")
  }
  return context
}
