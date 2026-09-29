import { rollDice } from "./dice.js";
import { createRulesProfile, getPath, number, setPath } from "./rules.js";

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function lookupBand(table = [], value, fallback = null) {
  for (const row of table) {
    const min = row.min == null ? -Infinity : number(row.min);
    const max = row.max == null ? Infinity : number(row.max);
    if (value >= min && value <= max) return row;
  }
  return fallback;
}

export function resolveHitLocation({ rules = {}, roll = null, rng = Math.random } = {}) {
  const profile = createRulesProfile(rules);
  const config = profile.damage?.hitLocation;
  if (!config?.table?.length) return null;
  const result = roll == null ? rollDice(config.die || "1d10", rng) : null;
  const value = roll == null ? number(result.total) : number(roll);
  const row = lookupBand(config.table, value);
  if (!row) return { roll: value, id: null, multiplier: 1 };
  return {
    roll: value,
    id: row.id || row.location || null,
    label: row.label || row.id || row.location || null,
    multiplier: number(row.multiplier, 1),
    armorKey: row.armorKey || row.id || row.location || null,
    metadata: row.metadata || null
  };
}

function normalizeArmorEntry(entry) {
  if (entry == null) return null;
  if (Number.isFinite(Number(entry))) return { value: Number(entry), id: null, ablation: 0 };
  return {
    ...entry,
    value: number(entry.value ?? entry.rating ?? entry.sp ?? entry.pb),
    ablation: number(entry.ablation)
  };
}

function layerValues(target = {}, location = null) {
  const key = location?.armorKey || location?.id;
  const local = key ? target.armor?.[key] : null;
  const global = target.armor?.global;
  const entries = [];
  const add = (value) => {
    if (Array.isArray(value)) value.forEach(add);
    else {
      const normalized = normalizeArmorEntry(value);
      if (normalized) entries.push(normalized);
    }
  };
  add(global);
  add(local);
  return entries;
}

function proportionalBonus(config, difference) {
  const row = lookupBand(config?.bonusByDifference || [], difference);
  return row ? number(row.bonus) : 0;
}

export function combineArmorLayers(layers = [], layering = {}) {
  const normalized = layers.map(normalizeArmorEntry).filter(Boolean);
  if (!normalized.length) return { total: 0, layers: [] };
  const mode = layering.mode || "sum";
  if (mode === "highest") {
    return { total: Math.max(...normalized.map((item) => item.value)), layers: normalized };
  }
  if (mode === "highest_plus_difference_bonus") {
    const values = normalized.map((item) => item.value).sort((a, b) => b - a);
    let total = values[0];
    for (let index = 1; index < values.length; index += 1) {
      total += proportionalBonus(layering, Math.abs(total - values[index]));
    }
    return { total, layers: normalized };
  }
  return {
    total: normalized.reduce((sum, item) => sum + item.value, 0),
    layers: normalized
  };
}

function damageReduction(target = {}, damageType = null) {
  const all = target.damageReductions || [];
  const matching = all.filter((entry) => {
    if (!entry.types?.length) return true;
    return entry.types.includes(damageType);
  });
  let flat = number(target.damageReduction?.flat);
  let multiplier = 1;
  if (target.damageReduction?.fraction != null) {
    multiplier *= Math.max(0, 1 - number(target.damageReduction.fraction));
  }
  for (const entry of matching) {
    flat += number(entry.flat);
    if (entry.fraction != null) multiplier *= Math.max(0, 1 - number(entry.fraction));
    if (entry.multiplier != null) multiplier *= number(entry.multiplier, 1);
  }
  return { flat, multiplier };
}

function bodyReduction(target, profile) {
  const config = profile.damage?.bodyModifier;
  if (!config) return 0;
  if (config.path) {
    const value = number(getPath(target, config.path));
    const row = lookupBand(config.table || [], value);
    return row ? number(row.reduction) : number(config.default);
  }
  return number(config.flat);
}

function massiveDamage(rawDamage, target, profile) {
  const config = profile.damage?.massiveDamage;
  if (!config) return null;
  const attribute = config.attributePath ? number(getPath(target, config.attributePath)) : 0;
  const threshold = number(config.base) + attribute * number(config.attributeMultiplier, 1);
  const triggered = config.operator === "gte" ? rawDamage >= threshold : rawDamage > threshold;
  return { triggered, threshold, consequence: config.consequence || "check" };
}

function woundSeverity(total, track) {
  if (!track?.thresholds?.length) return null;
  const row = lookupBand(track.thresholds, total);
  return row ? { ...row } : null;
}

function applyHealth(target, damage, health) {
  const next = clone(target);
  if (!health?.path) return { target: next, before: null, after: null };
  const before = number(getPath(next, health.path));
  const after = before - damage;
  setPath(next, health.path, after);
  return { target: next, before, after };
}

function applyWounds(target, damage, track) {
  const next = clone(target);
  const path = track.path || "wounds.current";
  const before = number(getPath(next, path));
  const after = before + damage;
  setPath(next, path, after);
  return {
    target: next,
    before,
    after,
    severity: woundSeverity(after, track)
  };
}

export function resolveDamage({
  target = {},
  damage = 0,
  damageType = null,
  penetration = null,
  location = null,
  rules = {},
  rng = Math.random
}) {
  const profile = createRulesProfile(rules);
  const config = profile.damage || {};
  const resolvedLocation = location || resolveHitLocation({ rules: profile, rng });
  const layers = layerValues(target, resolvedLocation);
  const combined = combineArmorLayers(layers, config.armor?.layering || {});

  const penetrationConfig = penetration || {};
  const armorMultiplier = number(penetrationConfig.armorMultiplier, 1);
  const damageMultiplierAfterArmor = number(penetrationConfig.damageMultiplier, 1);
  const effectiveArmor = Math.max(0, combined.total * armorMultiplier);
  const rawDamage = Math.max(0, number(damage));
  const penetrating = Math.max(0, rawDamage - effectiveArmor);
  const locationMultiplier = number(resolvedLocation?.multiplier, 1);
  const reduction = damageReduction(target, damageType);
  const body = bodyReduction(target, profile);

  let finalDamage = penetrating * damageMultiplierAfterArmor * locationMultiplier;
  finalDamage = Math.max(0, (finalDamage - reduction.flat - body) * reduction.multiplier);
  finalDamage = Math.max(number(config.minimum), Math.floor(finalDamage));

  let applied;
  if (config.health?.mode === "wounds" || config.woundTrack?.path) {
    applied = applyWounds(target, finalDamage, config.woundTrack || config.health);
  } else {
    applied = applyHealth(target, finalDamage, config.health || {});
  }

  const armorAblation = number(config.armor?.ablationOnPenetration);
  const massive = massiveDamage(rawDamage, target, profile);

  return {
    rawDamage,
    damageType,
    location: resolvedLocation,
    armor: {
      layers: combined.layers,
      combined: combined.total,
      multiplier: armorMultiplier,
      effective: effectiveArmor,
      penetrated: penetrating > 0,
      suggestedAblation: penetrating > 0 ? armorAblation : 0
    },
    reductions: { flat: reduction.flat, multiplier: reduction.multiplier, body },
    finalDamage,
    target: applied.target,
    healthBefore: applied.before,
    healthAfter: applied.after,
    woundSeverity: applied.severity || null,
    massiveDamage: massive
  };
}

export function tickTimedEffects({ target = {}, effects = [], rng = Math.random }) {
  let nextTarget = clone(target);
  const nextEffects = [];
  const resolved = [];

  for (const effect of effects) {
    let amount = number(effect.damage?.flat);
    if (effect.damage?.die) amount += rollDice(effect.damage.die, rng).total;
    const decay = number(effect.decayPerTick);
    const remaining = effect.remaining == null ? null : number(effect.remaining) - 1;

    if (effect.resourcePath) {
      const before = number(getPath(nextTarget, effect.resourcePath));
      setPath(nextTarget, effect.resourcePath, before - amount);
    }

    resolved.push({ id: effect.id || null, amount, remaining });
    const nextAmount = Math.max(0, amount - decay);
    if ((remaining == null || remaining > 0) && (nextAmount > 0 || !effect.stopAtZero)) {
      const updated = clone(effect);
      if (updated.damage && updated.decayPerTick) {
        updated.damage.flat = nextAmount;
        delete updated.damage.die;
      }
      if (remaining != null) updated.remaining = remaining;
      nextEffects.push(updated);
    }
  }

  return { target: nextTarget, effects: nextEffects, resolved };
}
