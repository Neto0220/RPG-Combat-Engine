import { rollDice } from "./dice.js";
import {
  calculateAttribute,
  calculateSequenceAttributeBonus
} from "./modifiers.js";
import {
  buildAttackSequence,
  getActiveEffects,
  getEquippedWeapons
} from "./sequence.js";
import { applyStatus, statusGainForHit } from "./statuses.js";

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clone(value) {
  return structuredClone(value);
}

export function createCombatState(options = {}) {
  return {
    turn: number(options.turn, 1),
    baseAttacks: Math.max(1, Math.floor(number(options.baseAttacks, 1))),
    maxAttacks: Math.max(1, Math.floor(number(options.maxAttacks, 100))),
    primaryWeaponId: options.primaryWeaponId || null,
    secondaryWeaponId: options.secondaryWeaponId || null,
    activeAbilityIds: [...(options.activeAbilityIds || [])],
    usedTurn: [...(options.usedTurn || [])],
    usedCombat: [...(options.usedCombat || [])]
  };
}

function costOf(entity = {}) {
  if (entity.cost && typeof entity.cost === "object") {
    return {
      resource: entity.cost.resource || "mana",
      amount: Math.max(0, number(entity.cost.amount))
    };
  }

  return {
    resource: entity.costResource || "mana",
    amount: Math.max(0, number(entity.cost))
  };
}

function canUseByFrequency(entity, state) {
  const frequency = entity.frequency || entity?.mechanics?.frequency || "unlimited";
  if (frequency === "once_turn" && state.usedTurn.includes(entity.id)) {
    return false;
  }
  if (frequency === "once_combat" && state.usedCombat.includes(entity.id)) {
    return false;
  }
  return true;
}

function spendResource(actor, cost) {
  if (!cost.amount) return { actor, spent: 0 };

  const current = number(actor?.resources?.[cost.resource]?.current);
  if (current < cost.amount) {
    throw new Error(`Insufficient ${cost.resource}`);
  }

  const next = clone(actor);
  next.resources = { ...(next.resources || {}) };
  next.resources[cost.resource] = {
    ...(next.resources[cost.resource] || {}),
    current: current - cost.amount
  };

  return { actor: next, spent: cost.amount };
}

function markUsed(state, entity) {
  const next = clone(state);
  const frequency = entity.frequency || entity?.mechanics?.frequency || "unlimited";

  if (frequency === "once_turn" && !next.usedTurn.includes(entity.id)) {
    next.usedTurn.push(entity.id);
  }

  if (frequency === "once_combat" && !next.usedCombat.includes(entity.id)) {
    next.usedCombat.push(entity.id);
  }

  return next;
}

function resolveWeaponHit({ actor, weapon, effects, rng }) {
  let diceTotal = 0;
  const dice = [];

  for (const expression of weapon?.damageDice || []) {
    const result = rollDice(expression, rng);
    dice.push(result);
    diceTotal += result.total;
  }

  let attributeTotal = 0;
  const attributes = [];

  for (const attribute of weapon?.damageAttributes || []) {
    const result = calculateAttribute({
      actor,
      attribute,
      weapon,
      effects
    });
    attributes.push(result);
    attributeTotal += result.total;
  }

  let flat = 0;
  let multiplier = 1;
  const bonusDice = [];

  for (const effect of effects) {
    const mechanics = effect.mechanics || {};

    if (mechanics.bonusDamageDice) {
      const result = rollDice(mechanics.bonusDamageDice, rng);
      bonusDice.push({
        source: effect.name || effect.id,
        ...result
      });
      diceTotal += result.total;
    }

    flat += number(mechanics.bonusDamageFlat);
    multiplier *= number(mechanics.damageMultiplier, 1) || 1;
  }

  const subtotal = diceTotal + attributeTotal + flat;
  const total = subtotal * multiplier;

  return {
    weaponId: weapon?.id || null,
    weaponName: weapon?.name || "Weapon",
    dice,
    bonusDice,
    attributes,
    flat,
    multiplier,
    total
  };
}

function applyHitStatuses({ target, effects, rng }) {
  let nextTarget = clone(target || { statuses: {} });
  const gained = {};

  for (const effect of effects) {
    const status = statusGainForHit(effect, rng);
    if (!status || !status.perHit || status.amount === 0) continue;

    nextTarget = applyStatus(nextTarget, status.name, status.amount);
    gained[status.name] = number(gained[status.name]) + status.amount;
  }

  return { target: nextTarget, gained };
}

export function resolveAttackSequence({
  actor,
  target = { statuses: {} },
  state,
  sequence = null,
  rng = Math.random
}) {
  let actorAfter = clone(actor);
  let stateAfter = clone(state);
  let targetAfter = clone(target);
  const actualSequence =
    sequence || buildAttackSequence({ actor: actorAfter, state: stateAfter });

  const selectedEffects = actualSequence.effects.filter(
    (effect) =>
      effect.timing === "on_use" &&
      stateAfter.activeAbilityIds.includes(effect.id)
  );

  const spent = {};

  for (const effect of selectedEffects) {
    if (!canUseByFrequency(effect, stateAfter)) {
      throw new Error(`Ability unavailable by frequency: ${effect.id}`);
    }

    const cost = costOf(effect);
    const spending = spendResource(actorAfter, cost);
    actorAfter = spending.actor;
    spent[cost.resource] = number(spent[cost.resource]) + spending.spent;
    stateAfter = markUsed(stateAfter, effect);
  }

  const hits = [];
  let damageTotal = 0;
  const statusesGained = {};

  for (const attack of actualSequence.attacks) {
    if (!attack.weapon) continue;

    const hit = resolveWeaponHit({
      actor: actorAfter,
      weapon: attack.weapon,
      effects: actualSequence.effects,
      rng
    });

    const statusResult = applyHitStatuses({
      target: targetAfter,
      effects: actualSequence.effects,
      rng
    });

    targetAfter = statusResult.target;

    for (const [name, amount] of Object.entries(statusResult.gained)) {
      statusesGained[name] = number(statusesGained[name]) + amount;
    }

    hits.push(hit);
    damageTotal += hit.total;
  }

  const sequenceBonus = calculateSequenceAttributeBonus({
    actor: actorAfter,
    effects: actualSequence.effects,
    attacks: actualSequence.attacks
  });

  damageTotal += sequenceBonus.total;

  const sequenceOnly = new Set(
    selectedEffects
      .filter(
        (effect) =>
          effect.duration === "sequence" ||
          effect?.mechanics?.duration === "sequence"
      )
      .map((effect) => effect.id)
  );

  if (sequenceOnly.size) {
    stateAfter.activeAbilityIds = stateAfter.activeAbilityIds.filter(
      (id) => !sequenceOnly.has(id)
    );
  }

  return {
    actor: actorAfter,
    target: targetAfter,
    state: stateAfter,
    sequence: actualSequence,
    hits,
    sequenceBonus,
    statusesGained,
    spent,
    damageTotal
  };
}

export function nextTurn(state) {
  return {
    ...clone(state),
    turn: number(state.turn, 1) + 1,
    activeAbilityIds: [],
    usedTurn: []
  };
}

export function listWeaponActions({ actor, state }) {
  const { primary, secondary } = getEquippedWeapons({ actor, state });
  const equipped = new Set(
    [primary?.id, secondary?.id].filter(Boolean).map(String)
  );

  const actions = [];

  for (const weapon of actor.weapons || []) {
    if (!equipped.has(String(weapon.id))) continue;

    for (const action of weapon.actions || weapon.abilities || []) {
      if (action.timing && action.timing !== "weapon_action") continue;
      actions.push({ ...action, weaponId: weapon.id, weaponName: weapon.name });
    }
  }

  return actions;
}

export function resolveWeaponAction({
  actor,
  target = { statuses: {} },
  state,
  actionId,
  confirmCondition = false,
  rng = Math.random
}) {
  const action = listWeaponActions({ actor, state }).find(
    (candidate) => String(candidate.id) === String(actionId)
  );

  if (!action) {
    throw new Error(`Weapon action not found: ${actionId}`);
  }

  if (!canUseByFrequency(action, state)) {
    throw new Error(`Weapon action unavailable by frequency: ${action.id}`);
  }

  if (action.condition && !confirmCondition) {
    return {
      requiresConfirmation: true,
      condition: action.condition,
      action
    };
  }

  let actorAfter = clone(actor);
  let stateAfter = clone(state);
  let targetAfter = clone(target);

  const cost = costOf(action);
  const spending = spendResource(actorAfter, cost);
  actorAfter = spending.actor;
  stateAfter = markUsed(stateAfter, action);

  const weapon = (actorAfter.weapons || []).find(
    (candidate) => String(candidate.id) === String(action.weaponId)
  );

  let damage = 0;
  const dice = [];

  for (const expression of action.damageDice || action.dice || []) {
    const result = rollDice(expression, rng);
    dice.push(result);
    damage += result.total;
  }

  const attributes = [];
  for (const attribute of action.damageAttributes || []) {
    const result = calculateAttribute({
      actor: actorAfter,
      attribute,
      weapon,
      effects: getActiveEffects({ actor: actorAfter, state: stateAfter })
    });
    attributes.push(result);
    damage += result.total;
  }

  if (action.status?.name) {
    const fixed = number(action.status.fixed);
    const die = action.status.die ? rollDice(action.status.die, rng).total : 0;
    targetAfter = applyStatus(
      targetAfter,
      action.status.name,
      fixed + die
    );
  }

  return {
    requiresConfirmation: false,
    actor: actorAfter,
    target: targetAfter,
    state: stateAfter,
    action,
    dice,
    attributes,
    spent: { [cost.resource]: spending.spent },
    damage
  };
}
