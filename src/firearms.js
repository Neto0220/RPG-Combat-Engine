import { createRulesProfile, number } from "./rules.js";

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function modeConfig(profile, mode) {
  return profile.firearms?.modes?.[mode] || null;
}

function resolveShots(config, weapon) {
  if (config.shots === "rate") return Math.max(0, Math.floor(number(weapon.rateOfFire ?? weapon.rof)));
  if (config.shots === "magazine") return Math.max(0, Math.floor(number(weapon.ammo?.current)));
  return Math.max(1, Math.floor(number(config.shots, 1)));
}

export function fireModePreview({ weapon = {}, mode, rules = {}, margin = 0, targetCount = 1 }) {
  const profile = createRulesProfile(rules);
  const config = modeConfig(profile, mode);
  if (!config) throw new Error("Unknown fire mode: " + mode);

  const available = number(weapon.ammo?.current, Infinity);
  const desiredShots = resolveShots(config, weapon);
  const shots = Math.min(desiredShots, available);
  const step = Math.max(1, Math.floor(number(config.attackModifierEveryShots, 0) || 1));
  const shotSteps = config.attackModifierEveryShots
    ? Math.floor(shots / step)
    : 0;
  const attackModifier = number(config.attackModifier) + shotSteps * number(config.attackModifierPerStep);

  let hits = 0;
  const hitRule = config.hits || { type: "single" };
  if (hitRule.type === "margin") {
    const per = Math.max(1, number(hitRule.perMargin, 1));
    hits = Math.floor(Math.max(0, number(margin)) / per);
    if (hitRule.minimumOnSuccess && number(margin) >= 0) hits = Math.max(1, hits);
  } else if (hitRule.type === "fixed") {
    hits = Math.max(0, Math.floor(number(hitRule.value)));
  } else if (hitRule.type === "targets") {
    hits = Math.max(0, Math.floor(number(targetCount)));
  } else {
    hits = number(margin) >= 0 ? 1 : 0;
  }
  hits = Math.min(hits, shots);

  const difficultyModifier = config.difficultyEveryShots
    ? Math.floor(shots / Math.max(1, number(config.difficultyEveryShots))) * number(config.difficultyPerStep)
    : number(config.difficultyModifier);

  return {
    mode,
    shots,
    available,
    attackModifier,
    difficultyModifier,
    hits,
    zoneSize: config.zoneSizeFormula === "shots_div_width"
      ? shots / Math.max(1, number(config.zoneWidth, 1))
      : number(config.zoneSize),
    metadata: clone(config.metadata || null)
  };
}

export function consumeAmmo(weapon = {}, shots = 1) {
  const next = clone(weapon);
  if (!next.ammo) next.ammo = { current: 0 };
  const current = number(next.ammo.current);
  const spent = Math.min(current, Math.max(0, Math.floor(number(shots))));
  next.ammo.current = Math.max(0, current - spent);
  return { weapon: next, spent, remaining: next.ammo.current };
}

export function resolveReliability({ weapon = {}, roll = null, mode = null, rules = {} }) {
  const profile = createRulesProfile(rules);
  const table = profile.firearms?.reliability || [];
  if (roll == null || !table.length) return { jammed: false, threshold: null };
  const rating = weapon.reliability || "default";
  const row = table.find((item) => item.id === rating) || table.find((item) => item.id === "default");
  if (!row) return { jammed: false, threshold: null };
  const threshold = number(row.jamOnOrBelow);
  const automaticBonus = mode && row.automaticJamOnOrBelow != null ? number(row.automaticJamOnOrBelow) : threshold;
  return { jammed: number(roll) <= automaticBonus, threshold: automaticBonus };
}
