import { rollDice } from "./dice.js";

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function statusGainForHit(effect, rng = Math.random) {
  const mechanics = effect?.mechanics || {};
  const status = mechanics.status;
  if (!status?.name) return null;

  const fixed = number(status.fixed);
  const die = status.die ? rollDice(status.die, rng).total : 0;

  return {
    name: status.name,
    amount: fixed + die,
    perHit: status.perHit !== false
  };
}

export function applyStatus(target, name, amount) {
  const next = structuredClone(target || {});
  next.statuses = { ...(next.statuses || {}) };
  next.statuses[name] = number(next.statuses[name]) + number(amount);
  return next;
}

export function statusSummary(target = {}, rules = []) {
  const statuses = target.statuses || {};
  let damagePerTurn = 0;
  const attributePenalties = {};

  for (const rule of rules) {
    const stacks = number(statuses[rule.name]);

    if (number(rule.damageEvery) > 0) {
      damagePerTurn +=
        Math.floor(stacks / number(rule.damageEvery)) *
        number(rule.damageAmount);
    }

    if (rule.attribute && number(rule.attributeEvery) > 0) {
      attributePenalties[rule.attribute] =
        number(attributePenalties[rule.attribute]) +
        Math.floor(stacks / number(rule.attributeEvery)) *
          number(rule.attributeAmount);
    }
  }

  return { damagePerTurn, attributePenalties };
}
