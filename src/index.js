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

export {
  BOOK_COMPILATION_TARGETS,
  BOOK_PROFILE_IDS,
  listBookProfiles,
  getBookUsageMethods,
  compileBookProfile
} from "./book-profiles.js";

export {
  AI_MANAGER_VERSION,
  AI_POLICIES,
  AI_OPERATION_TYPES,
  REFERENCE_REASONING_PATTERNS,
  validateAdaptationPlan,
  applyOperations,
  analyzeScenario,
  planScenarioAdaptation,
  createRuleWorkspace,
  forkRuleBranch,
  switchRuleBranch,
  applyAdaptationPlan,
  rollbackAdaptation,
  compileRuleWorkspace,
  createAIProvider,
  buildAIProviderRequest,
  createAIManager
} from "./ai-manager.js";


export {
  DESIGN_CORPUS_VERSION,
  DESIGN_DIMENSIONS,
  RPG_DESIGN_CORPUS,
  listDesignBenchmarks,
  getDesignBenchmark,
  compareDesignDimensions,
  evaluateScenarioAgainstCorpus
} from "./design-corpus.js";


export {
  NARRATIVE_ENGINE_VERSION,
  ENTITY_BLUEPRINTS,
  validateNarrativeEntityDraft,
  synthesizeNarrativeEntity,
  applyEntitySynthesis,
  buildEntitySynthesisProviderRequest,
  mergeEntitySyntheses
} from "./content-orchestrator.js";

export {
  UNIFIED_ENGINE_VERSION,
  createUnifiedEngine
} from "./unified-engine.js";
