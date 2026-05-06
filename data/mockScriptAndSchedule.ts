/**
 * Mock data for the Script and Schedule features.
 *
 * This file provides the following top-level exports:
 *   - `MOCK_SCRIPT_DATA`       — a full ScriptData object (12 scenes, ~110 blocks)
 *   - `MOCK_SCHEDULE_ENTRIES`   — shoot-day schedule entries
 *   - `MOCK_SCENES`            — stripboard scenes
 *   - `MOCK_PRODUCTION_PHASES` — principal, pickups, second-unit, rehearsals
 *   - `MOCK_SCHEDULE_DATA`     — convenience bundle of all schedule data
 *
 * The script follows a Jurassic Park-inspired dinosaur movie titled
 * "EPOCH — WHEN GIANTS RETURN". Characters, locations, props, costumes,
 * and schedule data are fully cross-referenced so every feature works
 * end-to-end.
 *
 * All IDs use a deterministic `mock-` prefix so they can be identified
 * and cleaned up easily.
 */

import type { ScriptBlock, ScriptData, BeatItem } from "@/types/casting"
import type { ScheduleEntry, Scene, ProductionPhase } from "@/types/schedule"

/* ================================================================== */
/*  Shared Constants                                                   */
/* ================================================================== */

/** Deterministic ID helper */
const id = (prefix: string, n: number | string) => `mock-${prefix}-${n}`

/** Character names used across both data sets */
export const CHARACTERS = {
  GRANT:    { id: id("char", 1), name: "DR. GRANT" },
  REYES:    { id: id("char", 2), name: "REYES" },
  STONE:    { id: id("char", 3), name: "DR. STONE" },
  MALKOVA:  { id: id("char", 4), name: "MALKOVA" },
  PARK:     { id: id("char", 5), name: "PARK" },
  WEBB:     { id: id("char", 6), name: "WEBB" },
  COLE:     { id: id("char", 7), name: "COLE" },
  DIAZ:     { id: id("char", 8), name: "DIAZ" },
} as const

/** Locations referenced in both script and schedule */
export const LOCATIONS = {
  LAB:           "GENESIS LAB - MAIN FLOOR",
  HATCHERY:      "HATCHERY - INCUBATION WING",
  JUNGLE:        "JUNGLE TRAIL - SECTOR 4",
  COMPOUND:      "COMPOUND - MAIN GATE",
  CONTROL:       "CONTROL ROOM",
  RAPTOR_PEN:    "RAPTOR PADDOCK - OBSERVATION DECK",
  RIVER:         "RIVER VALLEY - BASE CAMP",
  VISITOR_CTR:   "VISITOR CENTER - MAIN HALL",
  HELIPAD:       "HELIPAD - NORTH RIDGE",
  T_REX_ENCL:   "T-REX ENCLOSURE - PERIMETER FENCE",
  TUNNELS:       "MAINTENANCE TUNNELS - LEVEL B2",
  DOCK:          "SUPPLY DOCK - EAST SHORE",
} as const

/** Key props referenced in both script and schedule */
export const PROPS = {
  EMBRYO_CASE:   "Cryo-embryo transport case",
  TRANQ_RIFLE:   "Tranquilizer rifle (hero)",
  SATELLITE:     "Satellite phone",
  TABLET:        "DNA sequencing tablet",
  FLARE_GUN:     "Flare gun (practical)",
  NIGHT_GOGGLES: "Night-vision goggles",
  RAPTOR_COLLAR: "Raptor tracking collar",
  JEEP_KEYS:     "Park jeep key fob",
  FENCING_CTRL:  "Fence control panel (practical)",
  MED_KIT:       "Emergency med kit",
  RADIO:         "Two-way radio",
  MAP:           "Island sector map (aged)",
} as const

/** Costume references for schedule cross-linking */
export const COSTUMES = {
  GRANT_FIELD:     "Dr. Grant field outfit (khaki vest, boots, hat)",
  GRANT_LAB:       "Dr. Grant lab coat + scrubs",
  REYES_TACTICAL:  "Reyes tactical gear (BDU, vest, sidearm)",
  REYES_RAIN:      "Reyes rain poncho + wet coverage",
  STONE_LAB:       "Dr. Stone labcoat + pencil skirt",
  STONE_JUNGLE:    "Dr. Stone field outfit (cargo pants, hiking boots)",
  MALKOVA_EXEC:    "Malkova corporate suit + heels",
  MALKOVA_DIRTY:   "Malkova suit (distressed, mud-stained)",
  PARK_TECH:       "Park tech uniform + headset",
  WEBB_RANGER:     "Webb park ranger uniform",
  COLE_MECHANIC:   "Cole mechanic jumpsuit (oil-stained)",
  DIAZ_MEDIC:      "Diaz medic outfit (scrubs + vest)",
} as const

/* ================================================================== */
/*  Script Mock Data                                                   */
/* ================================================================== */

const b = (
  type: ScriptBlock["type"],
  text: string,
  idx: number,
  extras?: Partial<ScriptBlock>,
): ScriptBlock => ({
  id: id("blk", idx),
  type,
  text,
  ...extras,
})

let i = 0

const SCRIPT_BLOCKS: ScriptBlock[] = [
  /* ==== SCENE 1 — THE HATCHERY ==== */
  b("scene-heading", "INT. HATCHERY - INCUBATION WING - NIGHT", ++i, { synopsis: "Life finds a way" }),
  b("action", "Rows of translucent incubation pods pulse with amber light. Condensation beads on curved glass. A digital counter reads: CLUTCH 7 — HATCH WINDOW: 02:14:30.", ++i),
  b("action", "DR. GRANT, 50s, silver-streaked hair, calloused hands, leans over Pod 17. Something moves inside. He steadies his breath.", ++i),
  b("character", CHARACTERS.GRANT.name, ++i, { linkedCharacterId: CHARACTERS.GRANT.id }),
  b("parenthetical", "(whispering)", ++i),
  b("dialogue", "Easy... easy, little one.", ++i),
  b("action", "The shell cracks. A wet snout pushes through. Grant's face floods with wonder — and dread.", ++i),
  b("action", "DR. STONE, 40s, brilliant and guarded, watches from the observation gallery above, arms crossed.", ++i),
  b("character", CHARACTERS.STONE.name, ++i, { linkedCharacterId: CHARACTERS.STONE.id }),
  b("dialogue", "Congratulations, Dr. Grant. It's a velociraptor.", ++i),
  b("character", CHARACTERS.GRANT.name, ++i, { linkedCharacterId: CHARACTERS.GRANT.id }),
  b("dialogue", "That wasn't the plan. This was supposed to be an herbivore clutch.", ++i),
  b("character", CHARACTERS.STONE.name, ++i, { linkedCharacterId: CHARACTERS.STONE.id }),
  b("parenthetical", "(descending the stairs)", ++i),
  b("dialogue", "The genome splicing had a lateral crossover. Nature doesn't follow plans.", ++i),

  /* ==== SCENE 2 — CONTROL ROOM EMERGENCY ==== */
  b("scene-heading", "INT. CONTROL ROOM - CONTINUOUS", ++i, { synopsis: "The fences go down" }),
  b("action", "Banks of monitors glow. A 3D map of the island rotates on the main screen. PARK, 30s, jittery and overworked, hammers at a keyboard.", ++i),
  b("character", CHARACTERS.PARK.name, ++i, { linkedCharacterId: CHARACTERS.PARK.id }),
  b("dialogue", "We have a sector-four breach. Perimeter fence dropped ninety seconds ago.", ++i),
  b("action", "MALKOVA, 50s, sharp suit, sharper eyes, strides in. She is the money behind this island.", ++i),
  b("character", CHARACTERS.MALKOVA.name, ++i, { linkedCharacterId: CHARACTERS.MALKOVA.id }),
  b("dialogue", "Define 'breach.'", ++i),
  b("character", CHARACTERS.PARK.name, ++i, { linkedCharacterId: CHARACTERS.PARK.id }),
  b("parenthetical", "(pulling up a feed)", ++i),
  b("dialogue", "Something shorted the main transformer. Fences in sectors two through six are down. Including the rex paddock.", ++i),
  b("action", "On screen: infrared blobs — large, moving fast — pouring through a gap in the fence line.", ++i),
  b("character", CHARACTERS.MALKOVA.name, ++i, { linkedCharacterId: CHARACTERS.MALKOVA.id }),
  b("parenthetical", "(ice cold)", ++i),
  b("dialogue", "Get them back up. Now.", ++i),
  b("character", CHARACTERS.PARK.name, ++i, { linkedCharacterId: CHARACTERS.PARK.id }),
  b("dialogue", "The hard reboot takes twenty minutes. We're looking at a full island blackout.", ++i),
  b("transition", "SMASH CUT TO:", ++i),

  /* ==== SCENE 3 — JUNGLE AMBUSH ==== */
  b("scene-heading", "EXT. JUNGLE TRAIL - SECTOR 4 - NIGHT", ++i, { synopsis: "First encounter in the wild" }),
  b("action", "Rain hammers through the canopy. REYES, 30s, ex-military, carries a tranquilizer rifle. WEBB, 40s, park ranger, follows with a spotlight.", ++i),
  b("character", CHARACTERS.REYES.name, ++i, { linkedCharacterId: CHARACTERS.REYES.id }),
  b("parenthetical", "(hand signal — stop)", ++i),
  b("dialogue", "Movement. Thirty meters, two o'clock.", ++i),
  b("action", "Webb swings the beam. Two amber eyes catch the light, then vanish.", ++i),
  b("character", CHARACTERS.WEBB.name, ++i, { linkedCharacterId: CHARACTERS.WEBB.id }),
  b("dialogue", "That's not a compso. That's way too big.", ++i),
  b("action", "A LOW GROWL rolls through the underbrush. Trees rustle in sequence — something flanking them.", ++i),
  b("character", CHARACTERS.REYES.name, ++i, { linkedCharacterId: CHARACTERS.REYES.id }),
  b("parenthetical", "(loading a dart)", ++i),
  b("dialogue", "Fall back to the jeep. Slowly. Don't run.", ++i),
  b("action", "A RAPTOR bursts from the ferns. Reyes fires. The dart strikes its neck. The raptor stumbles — but a SECOND raptor leaps from the right.", ++i),

  /* ==== SCENE 4 — THE COMPOUND LOCKDOWN ==== */
  b("scene-heading", "EXT. COMPOUND - MAIN GATE - NIGHT", ++i, { synopsis: "Lockdown protocol" }),
  b("action", "Flood lights blaze. Workers scramble behind the reinforced gate. COLE, 30s, grease-stained mechanic, welds a brace onto the gate hinge.", ++i),
  b("character", CHARACTERS.COLE.name, ++i, { linkedCharacterId: CHARACTERS.COLE.id }),
  b("dialogue", "This'll hold a trike. It will not hold a rex.", ++i),
  b("action", "DIAZ, 30s, steady-handed medic, tends to an injured worker. Grant arrives at a run.", ++i),
  b("character", CHARACTERS.GRANT.name, ++i, { linkedCharacterId: CHARACTERS.GRANT.id }),
  b("dialogue", "Where's Malkova?", ++i),
  b("character", CHARACTERS.DIAZ.name, ++i, { linkedCharacterId: CHARACTERS.DIAZ.id }),
  b("dialogue", "Control room. She's locked it from inside.", ++i),
  b("character", CHARACTERS.GRANT.name, ++i, { linkedCharacterId: CHARACTERS.GRANT.id }),
  b("parenthetical", "(to Cole)", ++i),
  b("dialogue", "Can you hotwire the backup fence grid from the maintenance tunnels?", ++i),
  b("character", CHARACTERS.COLE.name, ++i, { linkedCharacterId: CHARACTERS.COLE.id }),
  b("parenthetical", "(wiping his hands)", ++i),
  b("dialogue", "If I can get to junction box seven without being eaten? Sure.", ++i),

  /* ==== SCENE 5 — RAPTOR PADDOCK ==== */
  b("scene-heading", "EXT. RAPTOR PADDOCK - OBSERVATION DECK - NIGHT", ++i, { synopsis: "Stone's dilemma" }),
  b("action", "The paddock is empty. Bent steel where the raptors broke through. Stone examines claw marks on the railing.", ++i),
  b("character", CHARACTERS.STONE.name, ++i, { linkedCharacterId: CHARACTERS.STONE.id }),
  b("dialogue", "Three got out. They'll hunt as a pack.", ++i),
  b("character", CHARACTERS.GRANT.name, ++i, { linkedCharacterId: CHARACTERS.GRANT.id }),
  b("dialogue", "Then we track them before they reach the river valley. There are twenty people at base camp.", ++i),
  b("character", CHARACTERS.STONE.name, ++i, { linkedCharacterId: CHARACTERS.STONE.id }),
  b("parenthetical", "(conflicted)", ++i),
  b("dialogue", "If we tranq them... they can still be studied. Malkova will want them alive.", ++i),
  b("character", CHARACTERS.GRANT.name, ++i, { linkedCharacterId: CHARACTERS.GRANT.id }),
  b("parenthetical", "(firm)", ++i),
  b("dialogue", "I don't care what Malkova wants. Those people come first.", ++i),

  /* ==== SCENE 6 — MAINTENANCE TUNNELS ==== */
  b("scene-heading", "INT. MAINTENANCE TUNNELS - LEVEL B2 - NIGHT", ++i, { synopsis: "Cole restores the fence" }),
  b("action", "Steam pipes. Flickering emergency lights. Cole moves through ankle-deep water, flashlight in teeth, toolbox in hand.", ++i),
  b("action", "He reaches JUNCTION BOX 7. Pries it open. Inside: a rat's nest of cables.", ++i),
  b("character", CHARACTERS.COLE.name, ++i, { linkedCharacterId: CHARACTERS.COLE.id }),
  b("parenthetical", "(into radio)", ++i),
  b("dialogue", "Park, I'm at the junction. Talk me through the sequence.", ++i),
  b("character", CHARACTERS.PARK.name, ++i, { linkedCharacterId: CHARACTERS.PARK.id }),
  b("parenthetical", "(over radio, panicked)", ++i),
  b("dialogue", "Blue wire to terminal four. Yellow to six. Do NOT touch the red — that's the ten-thousand-volt live line.", ++i),
  b("action", "A SOUND echoes in the tunnel behind him. Claws on metal grating. Cole freezes.", ++i),
  b("character", CHARACTERS.COLE.name, ++i, { linkedCharacterId: CHARACTERS.COLE.id }),
  b("parenthetical", "(whispering into radio)", ++i),
  b("dialogue", "Park. I'm not alone down here.", ++i),
  b("transition", "CUT TO:", ++i),

  /* ==== SCENE 7 — RIVER VALLEY ==== */
  b("scene-heading", "EXT. RIVER VALLEY - BASE CAMP - DAWN", ++i, { synopsis: "Evacuating the camp" }),
  b("action", "Mist rises off the river. Tents and portable labs sit along the bank. Reyes rallies a frightened group of researchers.", ++i),
  b("character", CHARACTERS.REYES.name, ++i, { linkedCharacterId: CHARACTERS.REYES.id }),
  b("dialogue", "Everyone to the east shore dock. Boat leaves in fifteen minutes. Bring nothing you can't carry.", ++i),
  b("character", CHARACTERS.WEBB.name, ++i, { linkedCharacterId: CHARACTERS.WEBB.id }),
  b("dialogue", "What about the specimen samples? Six months of fieldwork is in those coolers.", ++i),
  b("character", CHARACTERS.REYES.name, ++i, { linkedCharacterId: CHARACTERS.REYES.id }),
  b("parenthetical", "(dead serious)", ++i),
  b("dialogue", "Leave. Them.", ++i),
  b("action", "In the tree line, branches snap. Something large is moving parallel to the camp.", ++i),

  /* ==== SCENE 8 — THE T-REX ENCOUNTER ==== */
  b("scene-heading", "EXT. T-REX ENCLOSURE - PERIMETER FENCE - DAWN", ++i, { synopsis: "The rex is loose" }),
  b("action", "The massive gate hangs open on shattered hinges. Footprints the size of bathtubs lead into the jungle.", ++i),
  b("action", "Grant and Stone approach in a park jeep. Grant cuts the engine. Silence.", ++i),
  b("character", CHARACTERS.STONE.name, ++i, { linkedCharacterId: CHARACTERS.STONE.id }),
  b("parenthetical", "(checking a tablet)", ++i),
  b("dialogue", "Tracking implant puts her six hundred meters northeast. Heading toward the river.", ++i),
  b("character", CHARACTERS.GRANT.name, ++i, { linkedCharacterId: CHARACTERS.GRANT.id }),
  b("dialogue", "That's base camp.", ++i),
  b("action", "He grabs the flare gun from the glove box and floors it.", ++i),

  /* ==== SCENE 9 — VISITOR CENTER STANDOFF ==== */
  b("scene-heading", "INT. VISITOR CENTER - MAIN HALL - DAY", ++i, { synopsis: "Malkova's betrayal" }),
  b("action", "The grand atrium. A fossilized skeleton hangs from the ceiling. Malkova stands behind a pillar, cryo-embryo case in hand.", ++i),
  b("character", CHARACTERS.GRANT.name, ++i, { linkedCharacterId: CHARACTERS.GRANT.id }),
  b("dialogue", "You did this. You shorted the fences to cover the extraction.", ++i),
  b("character", CHARACTERS.MALKOVA.name, ++i, { linkedCharacterId: CHARACTERS.MALKOVA.id }),
  b("dialogue", "This island is a sinking ship, Dr. Grant. I'm simply securing the cargo.", ++i),
  b("character", CHARACTERS.GRANT.name, ++i, { linkedCharacterId: CHARACTERS.GRANT.id }),
  b("parenthetical", "(stepping closer)", ++i),
  b("dialogue", "That 'cargo' killed three people tonight.", ++i),
  b("character", CHARACTERS.MALKOVA.name, ++i, { linkedCharacterId: CHARACTERS.MALKOVA.id }),
  b("parenthetical", "(unmoved)", ++i),
  b("dialogue", "The embryos are worth more than this entire island. You of all people should understand that.", ++i),
  b("action", "A RAPTOR SCREECH echoes through the hall. Both freeze. Claws clicking on marble.", ++i),

  /* ==== SCENE 10 — THE DOCK ESCAPE ==== */
  b("scene-heading", "EXT. SUPPLY DOCK - EAST SHORE - DAY", ++i, { synopsis: "Race to the boat" }),
  b("action", "A battered supply boat idles at the dock. Diaz helps injured workers aboard. Reyes stands on the dock, scanning the tree line.", ++i),
  b("character", CHARACTERS.DIAZ.name, ++i, { linkedCharacterId: CHARACTERS.DIAZ.id }),
  b("dialogue", "That's sixteen. We're at capacity.", ++i),
  b("character", CHARACTERS.REYES.name, ++i, { linkedCharacterId: CHARACTERS.REYES.id }),
  b("dialogue", "Grant and Stone are still out there.", ++i),
  b("character", CHARACTERS.DIAZ.name, ++i, { linkedCharacterId: CHARACTERS.DIAZ.id }),
  b("parenthetical", "(checking her watch)", ++i),
  b("dialogue", "Tide turns in twelve minutes. After that, we can't clear the reef.", ++i),
  b("action", "In the distance: the ROAR of a T-Rex. Flocks of birds erupt from the canopy.", ++i),

  /* ==== SCENE 11 — HELIPAD CLIMAX ==== */
  b("scene-heading", "EXT. HELIPAD - NORTH RIDGE - DAY", ++i, { synopsis: "The final escape" }),
  b("action", "Helicopter rotors spin. Grant and Stone sprint across the clearing, the cryo-case between them — Malkova's embryos confiscated.", ++i),
  b("action", "Behind them: the T-Rex crashes through the tree line. Sixty feet of muscle and teeth.", ++i),
  b("character", CHARACTERS.GRANT.name, ++i, { linkedCharacterId: CHARACTERS.GRANT.id }),
  b("dialogue", "Go! Go! Go!", ++i),
  b("action", "Stone stumbles. Grant hauls her up. The rex charges.", ++i),
  b("character", CHARACTERS.STONE.name, ++i, { linkedCharacterId: CHARACTERS.STONE.id }),
  b("parenthetical", "(gasping)", ++i),
  b("dialogue", "The flare — use the flare!", ++i),
  b("action", "Grant fires the flare gun. The bright magnesium burst arcs across the clearing. The rex flinches, turns, chasing the light.", ++i),
  b("action", "They dive into the helicopter. It lifts off, banking hard. The island shrinks below.", ++i),

  /* ==== SCENE 12 — EPILOGUE ==== */
  b("scene-heading", "EXT. OPEN OCEAN - HELICOPTER (MOVING) - SUNSET", ++i, { synopsis: "Epilogue — What survives" }),
  b("action", "Golden light. Endless water. Grant stares at the cryo-case on his lap. Stone sits beside him, exhausted.", ++i),
  b("character", CHARACTERS.STONE.name, ++i, { linkedCharacterId: CHARACTERS.STONE.id }),
  b("dialogue", "What do we do with them?", ++i),
  b("character", CHARACTERS.GRANT.name, ++i, { linkedCharacterId: CHARACTERS.GRANT.id }),
  b("parenthetical", "(long beat)", ++i),
  b("dialogue", "We make sure no one ever does this again.", ++i),
  b("action", "He looks out the window. Below, the island's volcanic peak glows against the fading sky.", ++i),
  b("action", "On the island, unseen, a raptor stands on the helipad. Watching the helicopter disappear.", ++i),
  b("transition", "FADE TO BLACK.", ++i),
  b("action", "TITLE CARD: \"The island was placed under permanent quarantine. The embryos were destroyed under international supervision. Dr. Grant testified before the UN Science Council. Genesis Corp was dissolved.\"", ++i),
  b("action", "SECOND TITLE CARD: \"Six months later, satellite imaging detected movement in Sector 4.\"", ++i),
  b("transition", "CUT TO BLACK.", ++i),
]

/** Beat-board items for three-act structure */
const MOCK_BEATS: BeatItem[] = [
  { id: id("beat", 1),  title: "Life Finds a Way",     description: "A raptor hatches instead of an herbivore. Stone warns Grant.",                   color: "blue",   act: "Act 1", linkedSceneId: id("blk", 1),  order: 1 },
  { id: id("beat", 2),  title: "Blackout",             description: "Fences drop across the island. Malkova demands a fix. Park panics.",             color: "amber",  act: "Act 1", linkedSceneId: id("blk", 16), order: 2 },
  { id: id("beat", 3),  title: "First Blood",          description: "Reyes and Webb encounter raptors in the jungle. Two escape.",                    color: "rose",   act: "Act 1", linkedSceneId: id("blk", 32), order: 3 },
  { id: id("beat", 4),  title: "Lockdown",             description: "Compound gates reinforced. Grant sends Cole into the tunnels.",                  color: "green",  act: "Act 2", linkedSceneId: id("blk", 44), order: 4 },
  { id: id("beat", 5),  title: "Pack Hunters",         description: "Three raptors loose. Stone wants them alive; Grant prioritizes people.",         color: "purple", act: "Act 2", linkedSceneId: id("blk", 59), order: 5 },
  { id: id("beat", 6),  title: "Tunnel Terror",        description: "Cole tries to restore fences but discovers he's not alone underground.",         color: "stone",  act: "Act 2", linkedSceneId: id("blk", 72), order: 6 },
  { id: id("beat", 7),  title: "Rex Unleashed",        description: "The T-Rex heads toward base camp. Grant races to intercept.",                    color: "pink",   act: "Act 2", linkedSceneId: id("blk", 97), order: 7 },
  { id: id("beat", 8),  title: "Malkova's True Colors", description: "Malkova sabotaged the fences to steal embryos. Grant confronts her.",          color: "amber",  act: "Act 3", linkedSceneId: id("blk", 106), order: 8 },
  { id: id("beat", 9),  title: "Race to the Dock",     description: "Tide is turning. Diaz holds the boat. Reyes refuses to leave Grant behind.",    color: "sky",    act: "Act 3", linkedSceneId: id("blk", 118), order: 9 },
  { id: id("beat", 10), title: "Liftoff",              description: "Grant and Stone escape by helicopter as the rex charges the helipad.",           color: "blue",   act: "Act 3", linkedSceneId: id("blk", 128), order: 10 },
  { id: id("beat", 11), title: "What Survives",        description: "Embryos confiscated. But the island isn't done with them.",                      color: "rose",   act: "Act 3", linkedSceneId: id("blk", 139), order: 11 },
]

export const MOCK_SCRIPT_DATA: ScriptData = {
  blocks: SCRIPT_BLOCKS,
  locked: false,
  lockedSceneSuffixes: {},
  currentRevision: "white",
  lastModified: Date.now(),
  beats: MOCK_BEATS,
}


/* ================================================================== */
/*  Schedule Mock Data                                                 */
/* ================================================================== */

export const MOCK_PRODUCTION_PHASES: ProductionPhase[] = [
  { id: "principal",   name: "Principal Photography", startDate: "2024-04-08", color: "text-blue-700",   bgColor: "bg-blue-500" },
  { id: "pickups",     name: "Pickups",               startDate: "2024-04-22", color: "text-orange-700", bgColor: "bg-orange-500" },
  { id: "second-unit", name: "Second Unit / VFX",     startDate: "2024-04-25", color: "text-lime-700",   bgColor: "bg-lime-500" },
  { id: "rehearsals",  name: "Rehearsals",            startDate: "2024-04-01", color: "text-purple-700", bgColor: "bg-purple-500" },
]

const now = Date.now()

export const MOCK_SCHEDULE_ENTRIES: ScheduleEntry[] = [
  /* ================================================================
   *  Day 1 — INTERIORS / NIGHT
   *  Scenes 1 (Hatchery), 2 (Control Room), 6 (Tunnels)
   *  All interior night sets on adjacent stages — no company move.
   * ================================================================ */
  {
    id: id("sched", 1),
    title: "Day 1 — Hatchery / Control Room / Tunnels (Int Night)",
    date: "2024-04-08",
    phaseId: "principal",
    startTime: "06:00",
    endTime: "21:00",
    location: "Stage 9 — Genesis Lab & Control Room Sets / Stage 5 — Tunnel Set",
    sceneType: "INT",
    sceneNotes: "AM: Hatchery — dress incubation pods (practical LED), VFX tracking markers for raptor hatchling. MID: Control Room — multi-monitor rig, 3D island map on main screen. PM: Tunnels — ankle-deep practical water, steam pipes, emergency lighting, junction box 7 hero prop.",
    props: [PROPS.EMBRYO_CASE, PROPS.TABLET, PROPS.FENCING_CTRL, PROPS.SATELLITE, PROPS.RADIO, "Junction box 7 (hero prop)", "Cole's toolbox", "Flashlight (practical)"],
    actorIds: [CHARACTERS.GRANT.id, CHARACTERS.STONE.id, CHARACTERS.PARK.id, CHARACTERS.MALKOVA.id, CHARACTERS.COLE.id],
    crewMembers: [
      "Director — James Wan",
      "1st AD — Priya Singh",
      "DP — Roger Deakins",
      "Gaffer — Dan Kowalski",
      "VFX Sup — Maya Torres",
      "Script Sup — Lena Martinez",
      "SFX — Tommy Liu (hatchery steam/fog, tunnel water/steam)",
      "Props Master — Kelly Huang",
      "Sound — Chris Nolan",
    ],
    redFlags: [
      { id: id("rf", 1), type: "important", message: "VFX raptor puppet + tracking markers needed for Pod 17 hatching sequence", color: "bg-blue-500" },
      { id: id("rf", 2), type: "important", message: "Water on tunnel set — electrical safety protocol. All crew in waterproof boots.", color: "bg-red-500" },
      { id: id("rf", 3), type: "warning", message: "Long day (15 hrs) — monitor turnaround for Day 2 night shoot. Cole wraps after tunnels.", color: "bg-amber-500" },
    ],
    notes: `Scenes 1, 2 & 6. Start with hatchery (Grant + Stone) while control room is lit. Flip to control room mid-morning (Park + Malkova). After lunch move to Stage 5 tunnels (Cole + Park on radio). Costumes: ${COSTUMES.GRANT_LAB}, ${COSTUMES.STONE_LAB}, ${COSTUMES.PARK_TECH}, ${COSTUMES.MALKOVA_EXEC}, ${COSTUMES.COLE_MECHANIC} (distressed/wet for tunnels).`,
    createdAt: now,
    updatedAt: now,
  },

  /* ================================================================
   *  Day 2 — EXTERIORS / NIGHT
   *  Scenes 3 (Jungle Ambush), 4 (Compound Gate), 5 (Raptor Paddock)
   *  All night exteriors on backlot — logical flow from jungle to compound.
   * ================================================================ */
  {
    id: id("sched", 2),
    title: "Day 2 — Jungle / Compound / Raptor Paddock (Ext Night)",
    date: "2024-04-09",
    phaseId: "principal",
    startTime: "16:00",
    endTime: "05:00",
    location: "Kualoa Ranch — Jungle Trail / Backlot — Compound & Raptor Paddock Sets",
    sceneType: "EXT",
    sceneNotes: "Full night shoot. Start at jungle trail with rain towers x4, raptor puppet on wire rig for leap. Move to compound gate for Cole welding gag (SFX sparks), 12 extras as compound workers. Wrap at raptor paddock — bent steel + claw marks set dressing.",
    props: [PROPS.TRANQ_RIFLE, PROPS.NIGHT_GOGGLES, PROPS.RADIO, PROPS.RAPTOR_COLLAR, PROPS.FLARE_GUN, PROPS.MED_KIT, PROPS.MAP],
    actorIds: [CHARACTERS.REYES.id, CHARACTERS.WEBB.id, CHARACTERS.GRANT.id, CHARACTERS.STONE.id, CHARACTERS.COLE.id, CHARACTERS.DIAZ.id],
    crewMembers: [
      "Director — James Wan",
      "1st AD — Priya Singh",
      "DP — Roger Deakins",
      "Gaffer — Dan Kowalski",
      "SFX — Tommy Liu (rain towers, welding sparks)",
      "Stunt Coord — Ava Bennett",
      "Creature FX — Kyle Nedham",
      "Key Grip — Hector Ruiz",
      "Extras Coord — Benny Cho",
    ],
    redFlags: [
      { id: id("rf", 4), type: "warning", message: "Night shoot — overtime probable after 03:00. Rain towers need 90 min setup for jungle trail.", color: "bg-amber-500" },
      { id: id("rf", 5), type: "important", message: "Raptor stunt rig safety check required before first take. Stunt double for Reyes on raptor tackle.", color: "bg-red-500" },
      { id: id("rf", 6), type: "warning", message: "Welding SFX requires fire safety officer. 12 BG extras needed for compound — release after Sc 4 wraps.", color: "bg-amber-500" },
    ],
    notes: `Scenes 3, 4 & 5. Begin at jungle trail (Reyes + Webb) for raptor ambush. Company move to compound after Sc 3 wraps (~21:00). Sc 4 compound lockdown (Grant, Cole, Diaz + extras). Finish at raptor paddock (Grant + Stone). Costumes: ${COSTUMES.REYES_RAIN}, ${COSTUMES.WEBB_RANGER}, ${COSTUMES.GRANT_FIELD}, ${COSTUMES.STONE_JUNGLE}, ${COSTUMES.COLE_MECHANIC}, ${COSTUMES.DIAZ_MEDIC}. Tranq rifle has 6 practical dart loads.`,
    createdAt: now,
    updatedAt: now,
  },

  /* ================================================================
   *  Day 3 — EXTERIORS / DAWN-DAY
   *  Scenes 7 (River Valley), 8 (T-Rex Enclosure)
   *  Pre-dawn river location then move to rex paddock backlot.
   * ================================================================ */
  {
    id: id("sched", 3),
    title: "Day 3 — River Valley & Rex Enclosure (Ext Dawn/Day)",
    date: "2024-04-11",
    phaseId: "principal",
    startTime: "04:30",
    endTime: "17:00",
    location: "Kualoa Ranch — River Valley / Backlot — Rex Paddock",
    sceneType: "EXT",
    sceneNotes: "Pre-dawn call for natural mist on river. Base camp tents + portable lab dressing. 8 BG extras as researchers. PM: Rex enclosure gate (broken hinges SFX). Jeep picture car rigged on dolly track.",
    props: [PROPS.TRANQ_RIFLE, PROPS.RADIO, PROPS.FLARE_GUN, PROPS.TABLET, PROPS.JEEP_KEYS, PROPS.MAP, "Specimen coolers x4"],
    actorIds: [CHARACTERS.REYES.id, CHARACTERS.WEBB.id, CHARACTERS.GRANT.id, CHARACTERS.STONE.id, CHARACTERS.DIAZ.id],
    crewMembers: [
      "Director — James Wan",
      "1st AD — Priya Singh",
      "DP — Roger Deakins",
      "Gaffer — Dan Kowalski",
      "Locations — Jay Park",
      "Transpo — Reggie Frost",
      "Picture Car — Sam Ortega (Jeep)",
      "SFX — Tommy Liu (broken gate hinges)",
      "Extras Coord — Benny Cho",
    ],
    redFlags: [
      { id: id("rf", 7), type: "warning", message: "Dawn call — talent in the works by 04:00. Coffee/craft services required at base by 03:30.", color: "bg-amber-500" },
      { id: id("rf", 8), type: "important", message: "Company move from river to rex paddock — allow 60 min for relocation at lunch.", color: "bg-red-500" },
    ],
    notes: `Scenes 7 & 8. River camp evacuation at dawn (Reyes, Webb, Diaz + extras), then rex enclosure after lunch (Grant + Stone in jeep). Costumes: ${COSTUMES.GRANT_FIELD}, ${COSTUMES.STONE_JUNGLE}, ${COSTUMES.REYES_TACTICAL}, ${COSTUMES.WEBB_RANGER}, ${COSTUMES.DIAZ_MEDIC}. 8 BG extras as researchers — release after Sc 7 wraps.`,
    createdAt: now,
    updatedAt: now,
  },

  /* ================================================================
   *  Day 4 — INT/EXT DAY
   *  Scenes 9 (Visitor Center), 10 (Dock Escape)
   *  Morning on stage for visitor center, PM company move to harbor.
   * ================================================================ */
  {
    id: id("sched", 4),
    title: "Day 4 — Visitor Center / Supply Dock (Int-Ext Day)",
    date: "2024-04-12",
    phaseId: "principal",
    startTime: "06:00",
    endTime: "19:00",
    location: "Stage 2 — Visitor Center Set / Haleiwa Harbor (dock)",
    sceneType: "INT/EXT",
    sceneNotes: "AM: Visitor Center — fossilized skeleton hanging rig (pre-rigged overnight), cryo-case hero prop, raptor claw sounds from practical speaker rigs, marble floor VFX reflections. PM: Supply Dock — boat rigged and idling, tide-dependent shooting window.",
    props: [PROPS.EMBRYO_CASE, PROPS.FLARE_GUN, PROPS.MED_KIT, PROPS.RADIO, "Malkova's briefcase"],
    actorIds: [CHARACTERS.GRANT.id, CHARACTERS.MALKOVA.id, CHARACTERS.REYES.id, CHARACTERS.DIAZ.id],
    crewMembers: [
      "Director — James Wan",
      "1st AD — Priya Singh",
      "DP — Roger Deakins",
      "Gaffer — Dan Kowalski",
      "VFX Sup — Maya Torres",
      "Sound — Chris Nolan",
      "Props Master — Kelly Huang",
      "Rigging — Pat Callahan (skeleton)",
      "Marine Coord — Luke Tanaka",
    ],
    redFlags: [
      { id: id("rf", 9), type: "important", message: "Hanging skeleton rig — safety inspection before crew call. Hard hat zone during lighting.", color: "bg-red-500" },
      { id: id("rf", 10), type: "warning", message: "Tide window for dock: 14:30-18:30. Must wrap dock exteriors before 19:00.", color: "bg-amber-500" },
      { id: id("rf", 11), type: "conflict", message: "Malkova wraps after Sc 9 — Grant continuity into dock requires matching costume.", color: "bg-red-600", actorId: CHARACTERS.GRANT.id },
    ],
    notes: `Scenes 9 & 10. AM: Visitor center standoff (Grant vs Malkova) — raptor VFX creature + practical sound cues. PM: Company move to Haleiwa Harbor for dock escape (Reyes + Diaz). Costumes: ${COSTUMES.GRANT_FIELD} (continuity from Day 3), ${COSTUMES.MALKOVA_DIRTY}, ${COSTUMES.REYES_TACTICAL}, ${COSTUMES.DIAZ_MEDIC}.`,
    createdAt: now,
    updatedAt: now,
  },

  /* ================================================================
   *  Day 5 — EXTERIORS / DAY-SUNSET
   *  Scenes 11 (Helipad Climax), 12 (Helicopter Epilogue)
   *  Helipad action in PM, golden hour epilogue at sunset.
   * ================================================================ */
  {
    id: id("sched", 5),
    title: "Day 5 — Helipad Climax / Helicopter Epilogue (Ext Day-Sunset)",
    date: "2024-04-14",
    phaseId: "principal",
    startTime: "12:00",
    endTime: "20:00",
    location: "North Shore Ridge — Helipad / Helicopter (air-to-air)",
    sceneType: "EXT",
    sceneNotes: "PM: Helipad — helicopter on standby, T-Rex VFX plates with tracking markers, flare gun practical burst x3 takes. GOLDEN HOUR: Air-to-air helicopter shots for epilogue. Cryo-case insert. Grant and Stone coverage in cabin. Chase helicopter for wide island shots.",
    props: [PROPS.EMBRYO_CASE, PROPS.FLARE_GUN, PROPS.RADIO, PROPS.SATELLITE],
    actorIds: [CHARACTERS.GRANT.id, CHARACTERS.STONE.id],
    crewMembers: [
      "Director — James Wan",
      "1st AD — Priya Singh",
      "DP — Roger Deakins",
      "Gaffer — Dan Kowalski",
      "VFX Sup — Maya Torres",
      "Stunt Coord — Ava Bennett",
      "Aviation — Sky Ops Hawaii",
      "SFX — Tommy Liu (flare practical)",
      "DIT — Nyla Johnson",
    ],
    redFlags: [
      { id: id("rf", 12), type: "conflict", message: "Helicopter availability: 13:00-19:30 only. Must schedule helipad action before golden hour.", color: "bg-red-600", actorId: CHARACTERS.GRANT.id },
      { id: id("rf", 13), type: "warning", message: "Golden hour window: 18:20-18:55. One-take opportunity for sunset silhouette epilogue.", color: "bg-amber-500" },
      { id: id("rf", 14), type: "important", message: "Flare gun has 3 practical charges — reset 10 min between takes. VFX T-Rex plates needed before helicopter lifts.", color: "bg-blue-500" },
    ],
    notes: `Scenes 11 & 12. Late call — helipad climax first (Grant + Stone sprint, T-Rex charges, flare gun). Transition to epilogue at golden hour (air-to-air). That's a wrap on principal photography. Costumes: ${COSTUMES.GRANT_FIELD} (continuity), ${COSTUMES.STONE_JUNGLE} (continuity). Flare gun 3 practical charges.`,
    createdAt: now,
    updatedAt: now,
  },

  /* --- Pickups (post-principal) --- */
  {
    id: id("sched", 6),
    title: "Pickup — Lab Inserts / Hatchery CU",
    date: "2024-04-22",
    phaseId: "pickups",
    startTime: "09:00",
    endTime: "14:00",
    location: "Stage 9 — Genesis Lab Set",
    sceneType: "INT",
    sceneNotes: "Insert shots: embryo pod close-ups, tablet screen UI, hatching detail (VFX puppet hand). Hands double available.",
    props: [PROPS.EMBRYO_CASE, PROPS.TABLET, "Incubation pod (hero detail)"],
    actorIds: [],
    crewMembers: [
      "1st AD — Priya Singh",
      "DP — Roger Deakins",
      "VFX Sup — Maya Torres",
      "Props Master — Kelly Huang",
    ],
    redFlags: [],
    notes: "No principal talent needed. VFX insert plates for Scenes 1 & 2. Hand double for Grant's hatching interaction.",
    createdAt: now,
    updatedAt: now,
  },

  /* --- Second Unit VFX (post-principal) --- */
  {
    id: id("sched", 7),
    title: "2nd Unit — VFX Plates (Jungle/Rex)",
    date: "2024-04-25",
    phaseId: "second-unit",
    startTime: "06:00",
    endTime: "18:00",
    location: "Kualoa Ranch — Multiple Sectors",
    sceneType: "EXT",
    sceneNotes: "Clean plates for VFX dinosaur compositing. Chrome balls, grey balls, HDRI captures. Multiple jungle angles for Scenes 3, 7, 8, 11.",
    props: ["VFX reference spheres", "Tracking markers (50)", PROPS.MAP],
    actorIds: [],
    crewMembers: [
      "2nd Unit Dir — Mike Chen",
      "VFX Sup — Maya Torres",
      "DIT — Nyla Johnson",
      "Gaffer — Dan Kowalski",
    ],
    redFlags: [],
    notes: "No talent. VFX plate day. Capture HDRI at each location for lighting reference. Priority: T-Rex charge path (Scene 11), raptor ambush trail (Scene 3).",
    createdAt: now,
    updatedAt: now,
  },
]

/** Stripboard scenes — one per script scene, tied to the 5 shoot days */
export const MOCK_SCENES: Scene[] = [
  /* — Day 1: Interior Night — Scenes 1, 2, 6 — */
  { id: id("scene", 1),  sceneNumber: "1",  pages: "1 6/8", intExt: "INT",     location: LOCATIONS.HATCHERY,     dayNight: "Night", cast: [CHARACTERS.GRANT.name, CHARACTERS.STONE.name],                                                description: "Life finds a way — raptor hatches",      shootDayId: id("sched", 1), order: 1, createdAt: now, updatedAt: now },
  { id: id("scene", 2),  sceneNumber: "2",  pages: "1 4/8", intExt: "INT",     location: LOCATIONS.CONTROL,      dayNight: "Night", cast: [CHARACTERS.PARK.name, CHARACTERS.MALKOVA.name],                                               description: "Fences go down — island blackout",       shootDayId: id("sched", 1), order: 2, createdAt: now, updatedAt: now },
  { id: id("scene", 6),  sceneNumber: "6",  pages: "1 2/8", intExt: "INT",     location: LOCATIONS.TUNNELS,      dayNight: "Night", cast: [CHARACTERS.COLE.name, CHARACTERS.PARK.name],                                                  description: "Cole restores fence — tunnel terror",    shootDayId: id("sched", 1), order: 3, createdAt: now, updatedAt: now },
  /* — Day 2: Exterior Night — Scenes 3, 4, 5 — */
  { id: id("scene", 3),  sceneNumber: "3",  pages: "1 4/8", intExt: "EXT",     location: LOCATIONS.JUNGLE,       dayNight: "Night", cast: [CHARACTERS.REYES.name, CHARACTERS.WEBB.name],                                                 description: "Jungle ambush — first raptor encounter", shootDayId: id("sched", 2), order: 1, createdAt: now, updatedAt: now },
  { id: id("scene", 4),  sceneNumber: "4",  pages: "1 2/8", intExt: "EXT",     location: LOCATIONS.COMPOUND,     dayNight: "Night", cast: [CHARACTERS.GRANT.name, CHARACTERS.COLE.name, CHARACTERS.DIAZ.name],                          description: "Compound lockdown protocol",              shootDayId: id("sched", 2), order: 2, createdAt: now, updatedAt: now },
  { id: id("scene", 5),  sceneNumber: "5",  pages: "1",     intExt: "EXT",     location: LOCATIONS.RAPTOR_PEN,   dayNight: "Night", cast: [CHARACTERS.GRANT.name, CHARACTERS.STONE.name],                                                description: "Stone's dilemma — track vs. protect",    shootDayId: id("sched", 2), order: 3, createdAt: now, updatedAt: now },
  /* — Day 3: Exterior Dawn/Day — Scenes 7, 8 — */
  { id: id("scene", 7),  sceneNumber: "7",  pages: "7/8",   intExt: "EXT",     location: LOCATIONS.RIVER,        dayNight: "Day",   cast: [CHARACTERS.REYES.name, CHARACTERS.WEBB.name],                                                 description: "Evacuating base camp",                   shootDayId: id("sched", 3), order: 1, createdAt: now, updatedAt: now },
  { id: id("scene", 8),  sceneNumber: "8",  pages: "6/8",   intExt: "EXT",     location: LOCATIONS.T_REX_ENCL,   dayNight: "Day",   cast: [CHARACTERS.GRANT.name, CHARACTERS.STONE.name],                                                description: "The rex is loose — race to base camp",   shootDayId: id("sched", 3), order: 2, createdAt: now, updatedAt: now },
  /* — Day 4: Int/Ext Day — Scenes 9, 10 — */
  { id: id("scene", 9),  sceneNumber: "9",  pages: "1 4/8", intExt: "INT",     location: LOCATIONS.VISITOR_CTR,  dayNight: "Day",   cast: [CHARACTERS.GRANT.name, CHARACTERS.MALKOVA.name],                                              description: "Malkova's betrayal — visitor center",    shootDayId: id("sched", 4), order: 1, createdAt: now, updatedAt: now },
  { id: id("scene", 10), sceneNumber: "10", pages: "7/8",   intExt: "EXT",     location: LOCATIONS.DOCK,         dayNight: "Day",   cast: [CHARACTERS.REYES.name, CHARACTERS.DIAZ.name],                                                 description: "Race to the dock — tide turning",        shootDayId: id("sched", 4), order: 2, createdAt: now, updatedAt: now },
  /* — Day 5: Exterior Day-Sunset — Scenes 11, 12 — */
  { id: id("scene", 11), sceneNumber: "11", pages: "1 2/8", intExt: "EXT",     location: LOCATIONS.HELIPAD,      dayNight: "Day",   cast: [CHARACTERS.GRANT.name, CHARACTERS.STONE.name],                                                description: "Helipad climax — T-Rex charges",         shootDayId: id("sched", 5), order: 1, createdAt: now, updatedAt: now },
  { id: id("scene", 12), sceneNumber: "12", pages: "1",     intExt: "INT/EXT", location: "OPEN OCEAN - HELICOPTER", dayNight: "Day", cast: [CHARACTERS.GRANT.name, CHARACTERS.STONE.name],                                                description: "Epilogue — what survives",               shootDayId: id("sched", 5), order: 2, createdAt: now, updatedAt: now },
]

/* ================================================================== */
/*  Convenience bundle                                                 */
/* ================================================================== */

export const MOCK_SCHEDULE_DATA = {
  entries: MOCK_SCHEDULE_ENTRIES,
  scenes: MOCK_SCENES,
  phases: MOCK_PRODUCTION_PHASES,
} as const
