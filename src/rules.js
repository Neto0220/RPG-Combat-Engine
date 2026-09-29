function clone(value) {
  return value == null ? value : structuredClone(value);
}

export const DEFAULT_RULE_PROFILE = Object.freeze({
  id: "generic",
  name: "Generic RPG",
  checks: {
    default: {
      die: "1d20",
      mode: "roll_over",
      comparator: "gte",
      modifierApplication: "roll",
      critical: {
        successOn: [],
        failureOn: [],
        explodeOn: [],
        maxExplosions: 0
      }
    }
  },
  initiative: {
    die: "1d20",
    sort: "desc",
    reroll: "combat",
    attribute: null,
    skill: null,
    flat: 0,
    tieBreakers: []
  },
  actionEconomy: {
    initialPhase: "main",
    phases: {
      main: {
        slots: { action: 1, movement: 1, bonus: 0, reaction: 1 },
        maxActions: null,
        repeatable: false
      }
    },
    multiAction: {
      enabled: false,
      penaltyPerExtra: 0,
      penaltyStartsAt: 2
    }
  },
  damage: {
    minimum: 0,
    hitLocation: null,
    armor: { mode: "flat", layering: { mode: "sum" } },
    health: { mode: "resource", path: "resources.hp.current" },
    woundTrack: null,
    massiveDamage: null
  },
  progression: {
    featureSources: [
      "ancestry",
      "race",
      "class",
      "subclass",
      "role",
      "background",
      "cyberware",
      "traits"
    ]
  },
  firearms: { modes: {} }
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function deepMerge(base, override) {
  if (!isPlainObject(base)) return clone(override);
  const out = clone(base) || {};
  if (!isPlainObject(override)) return out;
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = clone(value);
    }
  }
  return out;
}

export function createRulesProfile(input = {}) {
  const profile = deepMerge(DEFAULT_RULE_PROFILE, input);
  if (!profile.id) throw new Error("Rules profile requires an id");
  if (!profile.actionEconomy?.initialPhase) {
    throw new Error("Rules profile requires actionEconomy.initialPhase");
  }
  if (!profile.actionEconomy?.phases?.[profile.actionEconomy.initialPhase]) {
    throw new Error("Initial action phase must exist in actionEconomy.phases");
  }
  return profile;
}

export function getPath(object, path, fallback = undefined) {
  if (!path) return fallback;
  const parts = Array.isArray(path) ? path : String(path).split(".");
  let current = object;
  for (const part of parts) {
    if (current == null || !(part in Object(current))) return fallback;
    current = current[part];
  }
  return current === undefined ? fallback : current;
}

export function setPath(object, path, value) {
  const parts = Array.isArray(path) ? path : String(path).split(".");
  if (!parts.length) return object;
  let current = object;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (!isPlainObject(current[part])) current[part] = {};
    current = current[part];
  }
  current[parts.at(-1)] = value;
  return object;
}

export function number(value, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

export function actorValue(actor, kind, key, fallback = 0) {
  if (key == null) return fallback;
  if (typeof key === "number") return key;
  if (String(key).includes(".")) return number(getPath(actor, key), fallback);
  const candidates =
    kind === "skill"
      ? ["skills." + key + ".value", "skills." + key, "pericias." + key + ".value", "pericias." + key]
      : ["attributes." + key + ".base", "attributes." + key + ".value", "attributes." + key, "stats." + key + ".points", "stats." + key];
  for (const path of candidates) {
    const value = getPath(actor, path);
    if (Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
}

function tagsMatch(required = [], actual = []) {
  const set = new Set(actual.map(String));
  return required.every((tag) => set.has(String(tag)));
}

export function modifierMatches(modifier = {}, context = {}) {
  const when = modifier.when || {};
  const tags = context.tags || [];
  if (when.allTags && !tagsMatch(when.allTags, tags)) return false;
  if (when.anyTags && !when.anyTags.some((tag) => tags.map(String).includes(String(tag)))) return false;
  if (when.notTags && when.notTags.some((tag) => tags.map(String).includes(String(tag)))) return false;
  if (when.phase && String(when.phase) !== String(context.phase || "")) return false;
  if (when.actionType && String(when.actionType) !== String(context.actionType || "")) return false;
  if (when.attribute && String(when.attribute) !== String(context.attribute || "")) return false;
  if (when.skill && String(when.skill) !== String(context.skill || "")) return false;
  if (when.weaponCategory && String(when.weaponCategory) !== String(context.weapon?.category || "")) return false;
  if (when.targetTag) {
    const targetTags = context.target?.tags || [];
    if (!targetTags.map(String).includes(String(when.targetTag))) return false;
  }
  return true;
}

export function collectContextModifiers(actor = {}, context = {}) {
  const sources = [
    ...(actor.modifiers || []),
    ...(context.modifiers || [])
  ];
  return sources
    .filter((modifier) => modifierMatches(modifier, context))
    .map((modifier) => ({
      id: modifier.id || null,
      source: modifier.source || null,
      value: number(modifier.value),
      target: modifier.target || "roll"
    }));
}
