export const DESIGN_CORPUS_VERSION = 1;

export const DESIGN_DIMENSIONS = Object.freeze([
  "resolution",
  "successDegrees",
  "actionEconomy",
  "initiative",
  "damageModel",
  "resourceModel",
  "progression",
  "narrativeAuthority",
  "tacticality",
  "lethality",
  "characterBuild",
  "gmLoad"
]);

export const RPG_DESIGN_CORPUS = Object.freeze([
  {
    id: "dnd-5e-2024",
    name: "Dungeons & Dragons 5e / 2024",
    family: "d20-heroic-fantasy",
    recognition: ["Wargamer all-time list", "major-market benchmark"],
    genres: ["heroic fantasy"],
    signals: ["d20","classe de armadura","ação bônus","reação","proficiência","spell slot","concentração"],
    mechanics: {
      resolution: "single-d20 roll-over",
      successDegrees: "mostly binary with critical exceptions",
      actionEconomy: "action + movement + conditional bonus action + reaction",
      initiative: "individual ordered initiative",
      damageModel: "hit points and armor class",
      resourceModel: "rest-based resources, spell slots and per-feature uses",
      progression: "level and class progression",
      narrativeAuthority: "GM-led traditional",
      tacticality: "medium",
      lethality: "low-medium after early levels",
      characterBuild: "class/level with subclasses and feats",
      gmLoad: "medium"
    },
    lessons: ["separate action slots cleanly","support feature-gated bonus actions","model class/level feature progression"]
  },
  {
    id: "pathfinder-2e",
    name: "Pathfinder Second Edition",
    family: "d20-tactical-fantasy",
    recognition: ["major alternative to D&D", "frequent best-of inclusion"],
    genres: ["heroic fantasy","tactical fantasy"],
    signals: ["três ações","3 ações","three action","graus de sucesso","critical success","critical failure","pathfinder"],
    mechanics: {
      resolution: "single-d20 roll-over",
      successDegrees: "four degrees",
      actionEconomy: "three interchangeable actions plus reaction",
      initiative: "skill-context initiative",
      damageModel: "hit points, armor class, conditions",
      resourceModel: "prepared/spontaneous spell resources and per-feature uses",
      progression: "level-based with feats at multiple layers",
      narrativeAuthority: "GM-led traditional",
      tacticality: "high",
      lethality: "medium",
      characterBuild: "deep modular feat architecture",
      gmLoad: "medium-high"
    },
    lessons: ["treat actions as a fungible budget","support four-degree outcomes","allow initiative skill to depend on approach"]
  },
  {
    id: "call-of-cthulhu-7e",
    name: "Call of Cthulhu 7e",
    family: "brp-percentile-horror",
    recognition: ["Wargamer all-time list", "major non-D&D benchmark"],
    genres: ["cosmic horror","investigation"],
    signals: ["d100","percentual","sanidade","hard success","extreme success","investigação"],
    mechanics: {
      resolution: "percentile roll-under",
      successDegrees: "regular, hard, extreme, critical/fumble bands",
      actionEconomy: "traditional turn procedures",
      initiative: "dexterity-ordered baseline",
      damageModel: "low hit points, serious wounds",
      resourceModel: "sanity, luck and situational resources",
      progression: "skill improvement by use",
      narrativeAuthority: "GM-led investigative",
      tacticality: "low-medium",
      lethality: "high",
      characterBuild: "skill-based profession model",
      gmLoad: "medium"
    },
    lessons: ["support percentile thresholds","separate mental resource pressure from health","let progression improve skills instead of levels"]
  },
  {
    id: "blades-in-the-dark",
    name: "Blades in the Dark",
    family: "forged-in-the-dark",
    recognition: ["Wargamer all-time list", "widely influential indie design"],
    genres: ["heist","crime","dark fantasy"],
    signals: ["position","effect","flashback","stress","crew","downtime","d6 pool"],
    mechanics: {
      resolution: "d6 pool, highest die",
      successDegrees: "failure, partial, full, critical",
      actionEconomy: "fiction-driven scene flow",
      initiative: "no fixed traditional initiative",
      damageModel: "harm levels and resistance",
      resourceModel: "stress, load, heat, coin",
      progression: "playbook and crew advancement",
      narrativeAuthority: "shared fiction with GM consequences",
      tacticality: "low-medium",
      lethality: "medium",
      characterBuild: "playbooks plus crew sheet",
      gmLoad: "low-medium"
    },
    lessons: ["evaluate risk as position/effect before rolling","support flashback costs","track group progression separately from character progression"]
  },
  {
    id: "mork-borg",
    name: "Mörk Borg",
    family: "rules-light-osr",
    recognition: ["Wargamer all-time list", "modern OSR benchmark"],
    genres: ["dark fantasy","doom horror"],
    signals: ["rules light","osr","letal","miseries","doom","mörk borg","mork borg"],
    mechanics: {
      resolution: "lightweight d20 target checks",
      successDegrees: "mostly binary",
      actionEconomy: "simple turn structure",
      initiative: "fast side/individual procedures",
      damageModel: "small health pools",
      resourceModel: "minimal tracked resources",
      progression: "light advancement",
      narrativeAuthority: "rulings-heavy GM",
      tacticality: "low",
      lethality: "very high",
      characterBuild: "fast/randomized",
      gmLoad: "low"
    },
    lessons: ["do not over-model a rules-light scenario","prefer fast rulings over extra subsystems","keep death/replacement workflow cheap"]
  },
  {
    id: "daggerheart",
    name: "Daggerheart",
    family: "dual-d12-narrative-fantasy",
    recognition: ["Wargamer all-time list", "Game Informer 2025 selection"],
    genres: ["fantasy","narrative adventure"],
    signals: ["hope","fear","dual d12","d12","spotlight","daggerheart"],
    mechanics: {
      resolution: "dual d12 plus modifiers",
      successDegrees: "success/failure crossed with Hope/Fear tone",
      actionEconomy: "spotlight-oriented flexible flow",
      initiative: "no conventional fixed order emphasis",
      damageModel: "thresholded damage and stress-style pressure",
      resourceModel: "Hope/Fear currencies and stress",
      progression: "level/tier with cards/domains",
      narrativeAuthority: "shared narrative with GM currency",
      tacticality: "medium",
      lethality: "medium",
      characterBuild: "class/domain card architecture",
      gmLoad: "medium"
    },
    lessons: ["separate mechanical success from narrative tone","model player and GM currencies independently","allow flexible spotlight combat"]
  },
  {
    id: "savage-worlds-adventure-edition",
    name: "Savage Worlds Adventure Edition",
    family: "generic-pulp",
    recognition: ["PC Gamer recommendation", "universal-system benchmark"],
    genres: ["universal","pulp","action"],
    signals: ["wild die","exploding dice","raises","bennies","shaken","savage worlds"],
    mechanics: {
      resolution: "trait die plus Wild Die vs target",
      successDegrees: "success plus raises",
      actionEconomy: "turn actions with multi-action penalties",
      initiative: "card-based initiative",
      damageModel: "Shaken and wounds",
      resourceModel: "Bennies",
      progression: "advances/ranks",
      narrativeAuthority: "traditional with metacurrency",
      tacticality: "medium-high",
      lethality: "medium",
      characterBuild: "classless edges/hindrances",
      gmLoad: "low-medium"
    },
    lessons: ["support exploding dice and raise thresholds","model metacurrency for rerolls/soak","multi-action penalties can replace rigid action slots"]
  },
  {
    id: "cyberpunk-red",
    name: "Cyberpunk RED",
    family: "d10-skill-cyberpunk",
    recognition: ["major cyberpunk benchmark", "Wargamer coverage"],
    genres: ["cyberpunk","urban action"],
    signals: ["interface","reflex","ref","role ability","cyberware","netrunning","cyberpunk red"],
    mechanics: {
      resolution: "d10 + stat + skill",
      successDegrees: "mostly target-based",
      actionEconomy: "action + movement oriented tactical turns",
      initiative: "REF-driven",
      damageModel: "hit points, armor and critical injuries",
      resourceModel: "ammo, humanity, role/cyberware resources",
      progression: "skill and role improvement",
      narrativeAuthority: "traditional tactical",
      tacticality: "high",
      lethality: "medium-high",
      characterBuild: "roles plus skills/cyberware",
      gmLoad: "medium-high"
    },
    lessons: ["separate role abilities from generic skills","treat cyberware as progression plus cost","firearms need ammo/armor/critical-injury hooks"]
  },
  {
    id: "shadowrun",
    name: "Shadowrun",
    family: "dice-pool-cyberfantasy",
    recognition: ["long-running cyberpunk/fantasy benchmark"],
    genres: ["cyberpunk","urban fantasy"],
    signals: ["dice pool","hits","edge","matrix","cyberware","magic and tech","shadowrun"],
    mechanics: {
      resolution: "d6 dice pool counting hits",
      successDegrees: "successes and net hits",
      actionEconomy: "multi-action tactical turns",
      initiative: "initiative score/pass variants by edition",
      damageModel: "condition tracks, armor and soak",
      resourceModel: "Edge, ammo, matrix and magic resources",
      progression: "karma point advancement",
      narrativeAuthority: "traditional crunchy",
      tacticality: "very high",
      lethality: "medium-high",
      characterBuild: "classless priority/point hybrid",
      gmLoad: "high"
    },
    lessons: ["support counted-success dice pools","allow parallel physical/digital/magic subsystems","use generic resource channels so subsystems can coexist"]
  },
  {
    id: "vampire-the-masquerade-v5",
    name: "Vampire: The Masquerade 5th Edition",
    family: "storyteller-dice-pool",
    recognition: ["major World of Darkness benchmark"],
    genres: ["urban horror","personal horror"],
    signals: ["hunger dice","blood potency","humanity","messy critical","bestial failure","vampire"],
    mechanics: {
      resolution: "d10 dice pool counting successes",
      successDegrees: "success margin plus special hunger outcomes",
      actionEconomy: "scene/turn based",
      initiative: "conflict ordering with narrative flexibility",
      damageModel: "health and willpower tracks",
      resourceModel: "Hunger, Willpower, Humanity",
      progression: "experience purchase",
      narrativeAuthority: "storyteller-led narrative",
      tacticality: "medium",
      lethality: "medium",
      characterBuild: "clan/discipline plus point buys",
      gmLoad: "medium"
    },
    lessons: ["let a resource alter dice outcomes rather than only pay costs","support parallel physical/social damage tracks","special dice can encode theme"]
  },
  {
    id: "warhammer-fantasy-roleplay-4e",
    name: "Warhammer Fantasy Roleplay 4e",
    family: "d100-gritty-fantasy",
    recognition: ["established fantasy benchmark"],
    genres: ["grim fantasy"],
    signals: ["d100","success level","career","advantage","critical injury","warhammer fantasy"],
    mechanics: {
      resolution: "percentile roll-under with opposed success levels",
      successDegrees: "success levels",
      actionEconomy: "structured tactical rounds",
      initiative: "initiative characteristic",
      damageModel: "wounds, armor, hit locations, critical injuries",
      resourceModel: "advantage and fate/fortune-style currencies",
      progression: "career-based",
      narrativeAuthority: "traditional simulation",
      tacticality: "high",
      lethality: "high",
      characterBuild: "careers and skills/talents",
      gmLoad: "high"
    },
    lessons: ["opposed checks can compare success margins","career progression differs from level progression","critical injury tables should remain data-driven"]
  },
  {
    id: "star-wars-genesys",
    name: "Star Wars RPG / Genesys lineage",
    family: "narrative-symbol-dice",
    recognition: ["major licensed RPG benchmark", "universal narrative-dice lineage"],
    genres: ["space opera","universal"],
    signals: ["advantage","threat","triumph","despair","narrative dice","genesys","star wars rpg"],
    mechanics: {
      resolution: "custom symbol dice pool",
      successDegrees: "success/failure plus independent advantage/threat axis",
      actionEconomy: "action + maneuver",
      initiative: "slot-based initiative",
      damageModel: "wounds/strain and critical injuries",
      resourceModel: "strain, destiny/story points",
      progression: "XP purchase talent trees/skills",
      narrativeAuthority: "shared interpretation of symbols",
      tacticality: "medium",
      lethality: "medium",
      characterBuild: "career/specialization or archetype/talent",
      gmLoad: "medium"
    },
    lessons: ["separate success axis from side-effect axis","initiative slots can be actor-agnostic","allow positive and negative consequences on the same roll"]
  },
  {
    id: "13th-age",
    name: "13th Age",
    family: "d20-narrative-tactical",
    recognition: ["Wargamer all-time list"],
    genres: ["heroic fantasy"],
    signals: ["escalation die","one unique thing","icons","backgrounds","13th age"],
    mechanics: {
      resolution: "d20 roll-over",
      successDegrees: "mostly binary",
      actionEconomy: "standard/move/quick/free style",
      initiative: "ordered initiative",
      damageModel: "hit points and defenses",
      resourceModel: "recoveries and class resources",
      progression: "level/class",
      narrativeAuthority: "traditional with narrative hooks",
      tacticality: "medium-high",
      lethality: "medium",
      characterBuild: "class level plus narrative backgrounds",
      gmLoad: "medium"
    },
    lessons: ["combat escalation can be a shared round resource","backgrounds can replace fixed skill lists","narrative identity can coexist with tactical classes"]
  },
  {
    id: "dragonbane",
    name: "Dragonbane",
    family: "d20-roll-under-fantasy",
    recognition: ["recent D&D-alternative coverage"],
    genres: ["fantasy","adventure"],
    signals: ["roll under d20","boon","bane","willpower points","dragonbane"],
    mechanics: {
      resolution: "d20 roll-under skill",
      successDegrees: "success/failure with dragon/demon extremes",
      actionEconomy: "one main action with reactive defense choices",
      initiative: "card initiative",
      damageModel: "hit points and armor reduction",
      resourceModel: "Willpower Points",
      progression: "skill-based improvement",
      narrativeAuthority: "traditional light-medium",
      tacticality: "medium",
      lethality: "medium-high",
      characterBuild: "profession/skills/heroic abilities",
      gmLoad: "low-medium"
    },
    lessons: ["d20 can be roll-under instead of DC-based","reactions can consume/compete with turn options","boon/bane can replace modifier stacks"]
  },
  {
    id: "forbidden-lands",
    name: "Forbidden Lands",
    family: "year-zero-hexcrawl",
    recognition: ["Free League benchmark", "recent alternative coverage"],
    genres: ["survival fantasy","hexcrawl"],
    signals: ["push roll","stronghold","hexcrawl","resource dice","year zero","forbidden lands"],
    mechanics: {
      resolution: "d6 dice pools with pushed rerolls",
      successDegrees: "counted successes",
      actionEconomy: "fast/slow actions",
      initiative: "card-based",
      damageModel: "attribute damage and critical injuries",
      resourceModel: "consumable resource dice",
      progression: "XP talents/skills",
      narrativeAuthority: "traditional sandbox",
      tacticality: "medium",
      lethality: "high",
      characterBuild: "kin/profession/talents",
      gmLoad: "medium"
    },
    lessons: ["pushing a roll should trade risk for agency","resources can degrade as dice instead of counters","support travel/base-building as first-class campaign loops"]
  },
  {
    id: "vaesen",
    name: "Vaesen",
    family: "year-zero-investigation",
    recognition: ["ENNIE Product of the Year lineage", "Wargamer coverage"],
    genres: ["folk horror","investigation"],
    signals: ["conditions","mystery","headquarters","year zero","vaesen"],
    mechanics: {
      resolution: "d6 dice pool with push",
      successDegrees: "counted successes",
      actionEconomy: "light conflict turns",
      initiative: "card-based conflict order",
      damageModel: "physical/mental conditions",
      resourceModel: "conditions and headquarters resources",
      progression: "XP talents/skills and HQ development",
      narrativeAuthority: "GM-led mystery",
      tacticality: "low-medium",
      lethality: "medium-high",
      characterBuild: "archetypes and skills",
      gmLoad: "medium"
    },
    lessons: ["mental and physical conditions can replace HP-heavy models","campaign headquarters can be a shared progression entity","investigation UI should prioritize clues over attacks"]
  },
  {
    id: "alien-rpg",
    name: "Alien RPG",
    family: "year-zero-stress-horror",
    recognition: ["Wargamer high-rated review", "major sci-fi horror benchmark"],
    genres: ["sci-fi horror","survival"],
    signals: ["stress dice","panic","agenda","cinematic mode","alien rpg"],
    mechanics: {
      resolution: "d6 pool plus stress dice",
      successDegrees: "successes with panic side effects",
      actionEconomy: "fast/slow actions",
      initiative: "card-based",
      damageModel: "health plus critical injuries",
      resourceModel: "stress and consumables",
      progression: "talent/skill XP",
      narrativeAuthority: "GM-led with personal agendas",
      tacticality: "medium",
      lethality: "very high",
      characterBuild: "career plus talents",
      gmLoad: "medium"
    },
    lessons: ["pressure dice can improve odds while increasing failure cost","cinematic and campaign modes can share a ruleset with different lifecycle expectations","panic should be event-driven"]
  },
  {
    id: "traveller",
    name: "Traveller",
    family: "2d6-sci-fi-simulation",
    recognition: ["long-running sci-fi benchmark"],
    genres: ["science fiction","sandbox"],
    signals: ["2d6","lifepath","terms","trade","starship","traveller"],
    mechanics: {
      resolution: "2d6 + skill/stat vs target",
      successDegrees: "effect margin",
      actionEconomy: "structured combat turns",
      initiative: "dexterity/skill based",
      damageModel: "physical characteristics absorb damage",
      resourceModel: "money, ship, fuel and logistics",
      progression: "lifepath creation, limited in-play skill growth",
      narrativeAuthority: "traditional sandbox",
      tacticality: "medium-high",
      lethality: "high",
      characterBuild: "procedural lifepath",
      gmLoad: "high"
    },
    lessons: ["character creation itself can be a simulation loop","margin of success can drive effect","economic/logistics systems may be as important as combat"]
  },
  {
    id: "runequest-rig",
    name: "RuneQuest: Roleplaying in Glorantha",
    family: "brp-percentile-mythic",
    recognition: ["classic BRP lineage"],
    genres: ["mythic fantasy"],
    signals: ["rune","passion","d100","hit location","spirit magic","runequest"],
    mechanics: {
      resolution: "percentile roll-under",
      successDegrees: "critical/special/success/failure/fumble",
      actionEconomy: "strike-rank tactical sequence",
      initiative: "strike ranks",
      damageModel: "hit locations and locational hit points",
      resourceModel: "magic points, runes/passions",
      progression: "skill-use improvement",
      narrativeAuthority: "traditional simulation",
      tacticality: "high",
      lethality: "high",
      characterBuild: "culture/occupation/cult plus skills",
      gmLoad: "high"
    },
    lessons: ["hit-location health can replace global HP","belief/relationship traits can enter resolution","initiative can be a time-cost model instead of one scalar"]
  },
  {
    id: "delta-green",
    name: "Delta Green",
    family: "d100-conspiracy-horror",
    recognition: ["critically acclaimed horror benchmark"],
    genres: ["conspiracy horror","investigation"],
    signals: ["bonds","sanity","breaking point","lethality","delta green"],
    mechanics: {
      resolution: "percentile roll-under",
      successDegrees: "critical/success/failure/fumble",
      actionEconomy: "traditional tactical turns",
      initiative: "dexterity/alertness-style ordering",
      damageModel: "low health plus weapon lethality rules",
      resourceModel: "sanity and bonds",
      progression: "skill improvement and bond erosion",
      narrativeAuthority: "GM-led investigative",
      tacticality: "medium",
      lethality: "very high",
      characterBuild: "profession/skills/bonds",
      gmLoad: "medium"
    },
    lessons: ["social relationships can absorb psychological consequences","very lethal weapons can use probability shortcuts instead of huge damage pools","campaign decay is a valid progression direction"]
  },
  {
    id: "the-one-ring-2e",
    name: "The One Ring 2e",
    family: "journey-fantasy",
    recognition: ["Wargamer recommended non-D&D RPG"],
    genres: ["fantasy","journey","heroic folklore"],
    signals: ["journey","shadow","hope","fellowship","stances","the one ring"],
    mechanics: {
      resolution: "feat die plus skill dice",
      successDegrees: "success plus quality icons/degrees",
      actionEconomy: "stance-driven combat",
      initiative: "stance/order procedures",
      damageModel: "endurance and wounds",
      resourceModel: "Hope, Fellowship, Shadow",
      progression: "skill/virtue/reward advancement",
      narrativeAuthority: "GM-led literary",
      tacticality: "medium",
      lethality: "medium-high",
      characterBuild: "culture/calling/distinctive features",
      gmLoad: "medium"
    },
    lessons: ["travel can be a first-class subsystem","combat stance can determine available actions and targeting","corruption resources can model thematic pressure"]
  },
  {
    id: "lancer",
    name: "Lancer",
    family: "d20-mech-tactical",
    recognition: ["modern tactical sci-fi benchmark"],
    genres: ["mecha","science fiction"],
    signals: ["mech","license level","heat","structure","stress","accuracy","difficulty","lancer"],
    mechanics: {
      resolution: "d20 plus accuracy/difficulty dice",
      successDegrees: "mostly target-based",
      actionEconomy: "quick/full actions plus reactions",
      initiative: "alternating side activation",
      damageModel: "HP, structure, heat and stress",
      resourceModel: "heat, limited systems, repairs",
      progression: "license levels and modular frames/systems",
      narrativeAuthority: "split narrative/tactical layers",
      tacticality: "very high",
      lethality: "medium",
      characterBuild: "modular licenses/loadouts",
      gmLoad: "high"
    },
    lessons: ["separate narrative and tactical resolution layers when useful","multi-track durability can model different failure modes","alternating activations improve team-level pacing"]
  },
  {
    id: "shadowdark",
    name: "Shadowdark RPG",
    family: "modern-osr-d20",
    recognition: ["Polygon 2024 standout", "current OSR benchmark"],
    genres: ["dungeon fantasy","OSR"],
    signals: ["real time torch","slot inventory","shadowdark","osr","dungeon crawl"],
    mechanics: {
      resolution: "light d20 checks",
      successDegrees: "mostly binary",
      actionEconomy: "simple turn action plus movement",
      initiative: "fast around-table/ordered initiative",
      damageModel: "low hit points",
      resourceModel: "slot inventory and real-time light pressure",
      progression: "level/class",
      narrativeAuthority: "rulings-oriented GM",
      tacticality: "low-medium",
      lethality: "high",
      characterBuild: "compact classes/random tables",
      gmLoad: "low"
    },
    lessons: ["real-world timers can be represented as countdown resources","inventory slots are a strong encumbrance abstraction","avoid feature bloat in old-school modes"]
  },
  {
    id: "monster-of-the-week",
    name: "Monster of the Week",
    family: "powered-by-the-apocalypse",
    recognition: ["PC Gamer recommended alternative"],
    genres: ["urban fantasy","episodic horror"],
    signals: ["2d6","move","playbook","7-9","10+","monster of the week","hard move"],
    mechanics: {
      resolution: "2d6 + stat",
      successDegrees: "miss, mixed success, full success",
      actionEconomy: "fiction-triggered moves, no fixed combat economy",
      initiative: "fictional spotlight",
      damageModel: "harm track",
      resourceModel: "Luck and playbook resources",
      progression: "playbook improvements",
      narrativeAuthority: "conversation-driven",
      tacticality: "low",
      lethality: "medium",
      characterBuild: "playbooks",
      gmLoad: "low-medium"
    },
    lessons: ["mechanics can trigger from fiction instead of menu actions","mixed success should encode consequence selection","do not force initiative on fiction-first scenarios"]
  },
  {
    id: "fate-core",
    name: "Fate Core / Condensed",
    family: "fate-narrative-universal",
    recognition: ["universal-system benchmark"],
    genres: ["universal"],
    signals: ["aspects","fate points","invoke","compel","fudge dice","fate core"],
    mechanics: {
      resolution: "4dF + skill",
      successDegrees: "fail, tie, succeed, succeed with style",
      actionEconomy: "fictional exchanges/zones",
      initiative: "order varies by implementation",
      damageModel: "stress and consequences",
      resourceModel: "Fate Points",
      progression: "milestones and aspect/skill change",
      narrativeAuthority: "highly shared",
      tacticality: "low-medium",
      lethality: "low-medium",
      characterBuild: "aspects, skills, stunts",
      gmLoad: "low-medium"
    },
    lessons: ["freeform tags can be mechanically invokable","consequences can be both narrative facts and damage","metacurrency can mediate shared narrative authority"]
  },
  {
    id: "gurps-4e",
    name: "GURPS 4e",
    family: "3d6-universal-simulation",
    recognition: ["universal-system benchmark"],
    genres: ["universal"],
    signals: ["3d6","point buy","advantages","disadvantages","gurps","active defense"],
    mechanics: {
      resolution: "3d6 roll-under",
      successDegrees: "margin of success/failure",
      actionEconomy: "one-second maneuvers",
      initiative: "speed-based sequence",
      damageModel: "HP with detailed injury modifiers",
      resourceModel: "fatigue and configurable resources",
      progression: "point-buy advancement",
      narrativeAuthority: "traditional simulation",
      tacticality: "very high when modules enabled",
      lethality: "configurable/high",
      characterBuild: "classless point-buy",
      gmLoad: "very high unless curated"
    },
    lessons: ["support modular rulesets rather than one mandatory complexity level","point-buy needs budget validation","simulation modules should be opt-in capabilities"]
  },
  {
    id: "starfinder-2e",
    name: "Starfinder Second Edition",
    family: "d20-tactical-scifi",
    recognition: ["Game Informer 2025 selection", "Paizo flagship sci-fi"],
    genres: ["science fantasy","space opera"],
    signals: ["starfinder","three actions","3 actions","ancestry feat","class feat","space fantasy"],
    mechanics: {
      resolution: "d20 roll-over",
      successDegrees: "four degrees",
      actionEconomy: "three interchangeable actions plus reaction",
      initiative: "skill-context initiative",
      damageModel: "HP/defenses/conditions",
      resourceModel: "class and equipment resources",
      progression: "level/feat architecture",
      narrativeAuthority: "traditional tactical",
      tacticality: "high",
      lethality: "medium",
      characterBuild: "ancestry/class/feat modularity",
      gmLoad: "medium-high"
    },
    lessons: ["reuse a stable tactical chassis across genres","keep genre-specific gear/resources data-driven","share core action economy across compatible profiles"]
  },
  {
    id: "draw-steel",
    name: "Draw Steel",
    family: "heroic-tactical",
    recognition: ["Game Informer 2025 selection"],
    genres: ["heroic fantasy","tactical combat"],
    signals: ["draw steel","heroic resource","tiered outcome","grid combat","power grows during battle"],
    mechanics: {
      resolution: "tiered outcome rolls",
      successDegrees: "multiple effect tiers",
      actionEconomy: "tactical action/maneuver/reaction structure",
      initiative: "team-oriented tactical sequencing",
      damageModel: "heroic attrition and battlefield control",
      resourceModel: "class resources that can build during combat",
      progression: "heroic class progression",
      narrativeAuthority: "traditional tactical",
      tacticality: "very high",
      lethality: "medium",
      characterBuild: "class/kit/power selection",
      gmLoad: "high"
    },
    lessons: ["resources can increase during combat instead of only depleting","abilities can map roll tiers directly to distinct effects","battlefield control deserves explicit modeling in tactical profiles"]
  },
  {
    id: "fabula-ultima",
    name: "Fabula Ultima",
    family: "jrpg-inspired",
    recognition: ["2023 ENNIE Best Game Gold"],
    genres: ["JRPG fantasy","heroic adventure"],
    signals: ["fabula points","bond","villain","jrpg","fabula ultima","multi class"],
    mechanics: {
      resolution: "attribute-dice pair summed",
      successDegrees: "target-based with opportunities for critical effects",
      actionEconomy: "turn-based JRPG-style actions",
      initiative: "group-oriented conflict flow",
      damageModel: "HP/MP and status effects",
      resourceModel: "Fabula Points, MP and class resources",
      progression: "multi-class level packages",
      narrativeAuthority: "shared narrative metacurrency",
      tacticality: "medium",
      lethality: "low-medium",
      characterBuild: "highly modular multiclass",
      gmLoad: "medium"
    },
    lessons: ["attributes can be dice sizes instead of fixed modifiers","multiclassing can be the default character architecture","metacurrency can authorize retroactive narrative facts"]
  },
  {
    id: "mothership-1e",
    name: "Mothership 1e",
    family: "percentile-scifi-horror",
    recognition: ["2025 ENNIE production recognition", "modern sci-fi horror benchmark"],
    genres: ["science fiction","survival horror"],
    signals: ["panic","stress","mothership","save","percentile","sci fi horror"],
    mechanics: {
      resolution: "percentile roll-under checks/saves",
      successDegrees: "mostly binary with criticals",
      actionEconomy: "fast lethal rounds",
      initiative: "lightweight situational order",
      damageModel: "health/wounds with lethal threats",
      resourceModel: "Stress and Panic",
      progression: "class/skill advancement",
      narrativeAuthority: "GM-led survival",
      tacticality: "low-medium",
      lethality: "very high",
      characterBuild: "compact class/skill packages",
      gmLoad: "low-medium"
    },
    lessons: ["stress can accumulate across scenes and trigger separate panic resolution","keep horror combat fast enough that avoidance remains attractive","compact character generation supports high lethality"]
  },
  {
    id: "warhammer-40k-imperium-maledictum",
    name: "Warhammer 40,000: Imperium Maledictum",
    family: "d100-grimdark-investigation",
    recognition: ["Wargamer all-time list"],
    genres: ["grimdark sci-fi","investigation"],
    signals: ["imperium maledictum","patron","influence","d100","superiority","warhammer 40k"],
    mechanics: {
      resolution: "percentile roll-under",
      successDegrees: "success levels",
      actionEconomy: "structured combat turns",
      initiative: "characteristic-based",
      damageModel: "wounds, armor and critical injuries",
      resourceModel: "fate/influence/patron-driven resources",
      progression: "XP skills/talents",
      narrativeAuthority: "traditional investigative",
      tacticality: "high",
      lethality: "high",
      characterBuild: "role/skill/talent plus patron context",
      gmLoad: "high"
    },
    lessons: ["campaign patron/faction can be a shared rules object","influence/social access can be modeled as resources","investigation and tactical combat can share one d100 core"]
  }
]);

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function listDesignBenchmarks() {
  return structuredClone(RPG_DESIGN_CORPUS);
}

export function getDesignBenchmark(id) {
  const found = RPG_DESIGN_CORPUS.find((entry) => entry.id === id);
  if (!found) throw new Error("Unknown RPG design benchmark: " + id);
  return structuredClone(found);
}

export function compareDesignDimensions(a, b) {
  const left = typeof a === "string" ? getDesignBenchmark(a) : structuredClone(a);
  const right = typeof b === "string" ? getDesignBenchmark(b) : structuredClone(b);
  const dimensions = {};
  for (const key of DESIGN_DIMENSIONS) {
    dimensions[key] = {
      left: left.mechanics?.[key] ?? null,
      right: right.mechanics?.[key] ?? null,
      same: left.mechanics?.[key] === right.mechanics?.[key]
    };
  }
  return { left: left.id, right: right.id, dimensions };
}

export function evaluateScenarioAgainstCorpus(text, options = {}) {
  const n = normalize(text);
  const limit = Math.max(1, Math.min(RPG_DESIGN_CORPUS.length, number(options.limit, 8)));
  const scored = RPG_DESIGN_CORPUS.map((entry) => {
    const matchedSignals = (entry.signals || []).filter((signal) =>
      n.includes(normalize(signal))
    );
    const genreMatches = (entry.genres || []).filter((genre) =>
      n.includes(normalize(genre))
    );
    const score =
      matchedSignals.length * 3 +
      genreMatches.length * 2 +
      (matchedSignals.length ? matchedSignals.length / Math.max(1, entry.signals.length) : 0);
    return {
      id: entry.id,
      name: entry.name,
      family: entry.family,
      score,
      matchedSignals,
      genreMatches,
      mechanics: structuredClone(entry.mechanics),
      lessons: structuredClone(entry.lessons || []),
      recognition: structuredClone(entry.recognition || [])
    };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.matchedSignals.length - a.matchedSignals.length)
    .slice(0, limit);

  return {
    corpusVersion: DESIGN_CORPUS_VERSION,
    benchmarkCount: RPG_DESIGN_CORPUS.length,
    matches: scored
  };
}
