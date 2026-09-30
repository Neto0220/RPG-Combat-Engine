export {
  parseDice,
  rollDice,
  expectedDice
} from "./dice.js";

export {
  normalizeModifier,
  modifierApplies,
  collectModifiers,
  calculateAttribute,
  calculateSequenceAttributeBonus
} from "./modifiers.js";

export {
  getActiveEffects,
  getEquippedWeapons,
  expectedWeaponDamage,
  buildAttackSequence
} from "./sequence.js";

export {
  statusGainForHit,
  applyStatus,
  statusSummary
} from "./statuses.js";

export {
  createCombatState,
  resolveAttackSequence,
  nextTurn,
  listWeaponActions,
  resolveWeaponAction,
  listMagicActions,
  resolveMagicAction,
  finishTurn
} from "./engine.js";


export {
  DEFAULT_RULE_PROFILE,
  deepMerge,
  createRulesProfile,
  getPath,
  setPath,
  number,
  actorValue,
  modifierMatches,
  collectContextModifiers
} from "./rules.js";

export {
  resolveCheck,
  resolveOpposedCheck,
  resolveInitiative
} from "./checks.js";

export {
  createTurnState,
  actionPenalty,
  canTakeAction,
  takeAction,
  advancePhase,
  nextRound,
  nextTurn as nextUniversalTurn
} from "./turns.js";

export {
  resolveHitLocation,
  combineArmorLayers,
  resolveDamage,
  tickTimedEffects
} from "./damage.js";

export {
  canPayCosts,
  payCosts,
  resetCounters
} from "./resources.js";

export {
  collectFeatures,
  featureActiveAtLevel,
  activeFeatures,
  evaluateRequirements,
  progressionRow,
  deriveProgression
} from "./progression.js";

export {
  fireModePreview,
  consumeAmmo,
  resolveReliability
} from "./firearms.js";


export {
  MECHANICS_KB_VERSION,
  MECHANICS_KB,
  interpretMechanics,
  applyMechanicsSuggestion,
  explainMechanicsSuggestion,
  inferEntityType,
  creationTemplate,
  createEntityFromText
} from "./interpreter.js";


export {
  SYSTEM_PROFILE_TEMPLATES,
  listSystemProfiles,
  createSystemProfile,
  compileSystemProfile,
  profileUiSections,
  compileUiSchema
} from "./profiles.js";
