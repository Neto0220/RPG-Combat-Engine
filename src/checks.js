import { rollDice } from "./dice.js";
import {
  actorValue,
  collectContextModifiers,
  createRulesProfile,
  getPath,
  number
} from "./rules.js";

function includesNatural(list = [], value) {
  return list.map(Number).includes(Number(value));
}

function compare(mode, total, target) {
  switch (mode) {
    case "roll_under":
    case "lte":
      return total <= target;
    case "lt":
      return total < target;
    case "gt":
      return total > target;
    case "roll_over":
    case "gte":
    default:
      return total >= target;
  }
}

function marginFor(mode, total, target) {
  return ["roll_under", "lte", "lt"].includes(mode)
    ? target - total
    : total - target;
}

function naturalOf(roll) {
  return roll.rolls?.length === 1 ? Math.abs(number(roll.rolls[0])) : null;
}

function explode({ die, initial, critical, rng }) {
  const rolls = [initial];
  const explodeOn = critical?.explodeOn || [];
  const maxExplosions = Math.max(0, Math.floor(number(critical?.maxExplosions)));
  let extra = 0;
  let current = initial;

  for (let count = 0; count < maxExplosions; count += 1) {
    const natural = naturalOf(current);
    if (natural == null || !includesNatural(explodeOn, natural)) break;
    current = rollDice(die, rng);
    rolls.push(current);
    extra += current.total;
  }

  return { rolls, extra };
}

function resolveTarget({ actor, target, check, rule }) {
  if (Number.isFinite(Number(check.target))) return Number(check.target);
  if (check.targetPath) return number(getPath(target, check.targetPath));
  if (check.actorTargetPath) return number(getPath(actor, check.actorTargetPath));
  if (check.skillAsTarget && check.skill) return actorValue(actor, "skill", check.skill);
  if (Number.isFinite(Number(rule.target))) return Number(rule.target);
  return null;
}

export function resolveCheck({
  actor = {},
  target = {},
  rules = {},
  check = {},
  rng = Math.random
}) {
  const profile = createRulesProfile(rules);
  const namedRule = check.type ? profile.checks?.[check.type] : null;
  const rule = {
    ...profile.checks.default,
    ...(namedRule || {}),
    ...(check.rule || {})
  };
  const die = check.die || rule.die || "1d20";
  const attribute = check.attribute ?? rule.attribute ?? null;
  const skill = check.skill ?? rule.skill ?? null;
  const context = {
    ...check.context,
    tags: [...(rule.tags || []), ...(check.tags || [])],
    actionType: check.actionType || rule.actionType || null,
    phase: check.phase || null,
    attribute,
    skill,
    target,
    weapon: check.weapon || null,
    modifiers: check.modifiers || []
  };

  const initial = rollDice(die, rng);
  const critical = { ...(rule.critical || {}), ...(check.critical || {}) };
  const exploded = explode({ die, initial, critical, rng });
  const natural = naturalOf(initial);

  const attributeValue = actorValue(actor, "attribute", attribute);
  const rawSkillValue = actorValue(actor, "skill", skill);
  const skillValue = (check.skillAsTarget || rule.skillAsTarget) ? 0 : rawSkillValue;
  const flat = number(rule.flat) + number(check.flat);
  const appliedModifiers = collectContextModifiers(actor, context);
  const rollModifiers = appliedModifiers
    .filter((modifier) => modifier.target !== "target")
    .reduce((sum, modifier) => sum + modifier.value, 0);
  const targetModifiers = appliedModifiers
    .filter((modifier) => modifier.target === "target")
    .reduce((sum, modifier) => sum + modifier.value, 0);

  const baseTarget = resolveTarget({ actor, target, check, rule });
  const modifierApplication = check.modifierApplication || rule.modifierApplication || "roll";
  const rollSide = attributeValue + skillValue + flat + exploded.extra +
    (modifierApplication === "roll" ? rollModifiers : 0);
  const targetSide = baseTarget == null
    ? null
    : baseTarget + targetModifiers + (modifierApplication === "target" ? rollModifiers : 0);
  const total = initial.total + rollSide;
  const mode = check.mode || rule.mode || rule.comparator || "roll_over";

  const naturalSuccess = natural != null && includesNatural(critical.successOn, natural);
  const naturalFailure = natural != null && includesNatural(critical.failureOn, natural);
  let success = targetSide == null ? null : compare(mode, total, targetSide);
  if (naturalSuccess) success = true;
  if (naturalFailure) success = false;

  return {
    type: check.type || "default",
    die,
    mode,
    roll: initial,
    explosionRolls: exploded.rolls.slice(1),
    natural,
    attribute,
    attributeValue,
    skill,
    skillValue,
    rawSkillValue,
    flat,
    modifiers: appliedModifiers,
    total,
    target: targetSide,
    margin: targetSide == null ? null : marginFor(mode, total, targetSide),
    success,
    criticalSuccess: naturalSuccess,
    criticalFailure: naturalFailure
  };
}

export function resolveOpposedCheck({
  actor,
  opponent,
  rules = {},
  actorCheck = {},
  opponentCheck = {},
  rng = Math.random,
  tie = "opponent"
}) {
  const left = resolveCheck({ actor, target: opponent, rules, check: { ...actorCheck, target: undefined }, rng });
  const right = resolveCheck({ actor: opponent, target: actor, rules, check: { ...opponentCheck, target: undefined }, rng });
  let winner = "tie";
  if (left.criticalSuccess && !right.criticalSuccess) winner = "actor";
  else if (right.criticalSuccess && !left.criticalSuccess) winner = "opponent";
  else if (left.total > right.total) winner = "actor";
  else if (right.total > left.total) winner = "opponent";
  else winner = tie;
  return { actor: left, opponent: right, winner, success: winner === "actor", margin: left.total - right.total };
}

function initiativeModifier(actor, initiative, context = {}) {
  const attribute = actorValue(actor, "attribute", initiative.attribute);
  const skill = actorValue(actor, "skill", initiative.skill);
  const special = initiative.specialPath ? number(getPath(actor, initiative.specialPath)) : 0;
  const mods = collectContextModifiers(actor, {
    ...context,
    tags: ["initiative", ...(context.tags || [])],
    actionType: "initiative",
    attribute: initiative.attribute,
    skill: initiative.skill
  });
  return {
    attribute,
    skill,
    special,
    modifiers: mods,
    total: attribute + skill + special + number(initiative.flat) + mods.reduce((sum, item) => sum + item.value, 0)
  };
}

export function resolveInitiative({ actors = [], rules = {}, rng = Math.random, context = {} }) {
  const profile = createRulesProfile(rules);
  const initiative = profile.initiative || {};
  const entries = actors.map((actor, index) => {
    const roll = rollDice(initiative.die || "1d20", rng);
    const modifier = initiativeModifier(actor, initiative, context);
    return {
      actor,
      index,
      roll,
      modifier,
      total: roll.total + modifier.total
    };
  });

  const direction = initiative.sort === "asc" ? 1 : -1;
  entries.sort((a, b) => {
    if (a.total !== b.total) return (a.total - b.total) * direction;
    for (const path of initiative.tieBreakers || []) {
      const av = number(getPath(a.actor, path));
      const bv = number(getPath(b.actor, path));
      if (av !== bv) return (av - bv) * direction;
    }
    return a.index - b.index;
  });
  return entries;
}
