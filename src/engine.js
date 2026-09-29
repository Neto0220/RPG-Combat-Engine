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
    usedCombat: [...(options.usedCombat || [])],
    secondaryUsed: Boolean(options.secondaryUsed)
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
    usedTurn: [],
    secondaryUsed: false
  };
}

function groupedAbilities(actor = {}) {
  const out = [];
  if (Array.isArray(actor.abilities)) {
    for (const ability of actor.abilities) out.push({ ...ability, source: ability.source || "Ability" });
  } else {
    for (const [key, label] of [["race", "Race"], ["class", "Class"], ["subclass", "Subclass"]]) {
      for (const ability of actor.abilities?.[key] || []) {
        out.push({ ...ability, source: ability.source || label });
      }
    }
  }
  for (const passive of actor.passives || []) {
    out.push({ ...passive, source: passive.sourceLabel || "Passive" });
  }
  return out;
}

function isNormalAttackModifier(entity = {}) {
  const mechanics = entity.mechanics || {};
  const timing = entity.timing || mechanics.timing || "";
  if (timing !== "on_use") return false;
  return Boolean(
    number(mechanics.extraAttacks) > 0 ||
    number(mechanics.attackEvery) > 0 ||
    number(mechanics.attackGrant) > 0 ||
    mechanics.dualWield ||
    mechanics.bonusDamageDice ||
    number(mechanics.bonusDamageFlat) !== 0 ||
    number(mechanics.damageMultiplier, 1) !== 1 ||
    mechanics.attributeName ||
    (mechanics.conditionWeaponRole && mechanics.conditionWeaponRole !== "any") ||
    mechanics.requiredStatusName
  );
}

export function listMagicActions({ actor }) {
  return groupedAbilities(actor).filter((ability) => {
    const mechanics = ability.mechanics || {};
    const timing = ability.timing || mechanics.timing || "";
    const eligible =
      mechanics.magicActionEligible === true ||
      timing === "magic_action";
    return eligible && !isNormalAttackModifier(ability);
  });
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

  if (state.secondaryUsed) {
    throw new Error("Secondary action already used");
  }

  if (!canUseByFrequency(action, state)) {
    throw new Error(`Weapon action unavailable by frequency: ${action.id}`);
  }

  const mechanics = action.mechanics || {};
  const condition = action.condition || mechanics.conditionText || "";

  if (condition && !confirmCondition) {
    return {
      requiresConfirmation: true,
      condition,
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
  stateAfter.secondaryUsed = true;

  const weapon = (actorAfter.weapons || []).find(
    (candidate) => String(candidate.id) === String(action.weaponId)
  );

  let damage = 0;
  const dice = [];

  const damageDice = (action.damageDice || action.dice || []).map(
    (entry) => entry?.expression || entry
  );

  for (const expression of damageDice) {
    const result = rollDice(expression, rng);
    dice.push(result);
    damage += result.total;
  }

  const attributes = [];
  for (const attribute of action.damageAttributes || action.attributeDamage || []) {
    const result = calculateAttribute({
      actor: actorAfter,
      attribute,
      weapon,
      effects: getActiveEffects({ actor: actorAfter, state: stateAfter })
    });
    attributes.push(result);
    damage += result.total;
  }

  const status = action.status || {
    name: mechanics.targetStatusName || mechanics.statusName || "",
    fixed:
      mechanics.targetStatusFixed ??
      mechanics.statusFixed ??
      0,
    die: mechanics.targetStatusDie || mechanics.statusDie || "",
    mode: mechanics.targetStatusMode || "add"
  };

  let appliedStatus = null;

  if (status?.name) {
    const fixed = number(status.fixed);
    const die = status.die ? rollDice(status.die, rng).total : 0;
    const amount = fixed + die;

    if (amount !== 0) {
      const current = number(targetAfter?.statuses?.[status.name]);

      if (status.mode === "max") {
        targetAfter = clone(targetAfter || {});
        targetAfter.statuses = { ...(targetAfter.statuses || {}) };
        targetAfter.statuses[status.name] = Math.max(current, amount);
      } else {
        targetAfter = applyStatus(targetAfter, status.name, amount);
      }

      appliedStatus = { name: status.name, amount };
    }
  }

  return {
    requiresConfirmation: false,
    actor: actorAfter,
    target: targetAfter,
    state: stateAfter,
    action,
    metadata: {
      label: action.actionLabel || mechanics.actionLabel || "",
      condition,
      effect: action.effectText || mechanics.effectText || ""
    },
    dice,
    attributes,
    appliedStatus,
    spent: { [cost.resource]: spending.spent },
    damage
  };
}


export function resolveMagicAction({
  actor,
  target = { statuses: {} },
  state,
  actionId,
  confirmCondition = false,
  rng = Math.random
}) {
  const action = listMagicActions({ actor, state }).find(
    (candidate) => String(candidate.id) === String(actionId)
  );

  if (!action) {
    throw new Error(`Magic action not found: ${actionId}`);
  }

  if (state.secondaryUsed) {
    throw new Error("Secondary action already used");
  }

  if (!canUseByFrequency(action, state)) {
    throw new Error(`Magic action unavailable by frequency: ${action.id}`);
  }

  const mechanics = action.mechanics || {};
  const condition = action.condition || mechanics.conditionText || "";

  if (condition && !confirmCondition) {
    return {
      requiresConfirmation: true,
      condition,
      action
    };
  }

  let actorAfter = clone(actor);
  let targetAfter = clone(target);
  let stateAfter = clone(state);

  const cost = costOf(action);
  const spending = spendResource(actorAfter, cost);
  actorAfter = spending.actor;
  stateAfter = markUsed(stateAfter, action);
  stateAfter.secondaryUsed = true;

  let total = 0;
  const dice = [];
  const statusFromDice = [];

  for (const entry of action.dice || action.damageDice || []) {
    const expression = entry?.expression || entry;
    const label = String(entry?.label || "Result");
    const result = rollDice(expression, rng);
    dice.push({ label, ...result });

    const match = label.match(/^\s*(?:stack|status)\s+(.+)$/i);
    if (match) {
      statusFromDice.push({ name: match[1].trim(), amount: result.total });
    } else {
      total += result.total;
    }
  }

  const attributes = [];
  for (const attribute of action.attributeDamage || action.damageAttributes || []) {
    const result = calculateAttribute({
      actor: actorAfter,
      attribute,
      weapon: null,
      effects: getActiveEffects({ actor: actorAfter, state: stateAfter })
    });
    attributes.push(result);
    total += result.total;
  }

  const appliedStatuses = [];
  const configuredStatus = {
    name: mechanics.targetStatusName || mechanics.statusName || "",
    fixed: mechanics.targetStatusFixed ?? mechanics.statusFixed ?? 0,
    die: mechanics.targetStatusDie || mechanics.statusDie || "",
    mode: mechanics.targetStatusMode || "add"
  };

  if (configuredStatus.name) {
    const amount =
      number(configuredStatus.fixed) +
      (configuredStatus.die ? rollDice(configuredStatus.die, rng).total : 0);

    if (amount !== 0) {
      const current = number(targetAfter?.statuses?.[configuredStatus.name]);
      if (configuredStatus.mode === "max") {
        targetAfter = clone(targetAfter || {});
        targetAfter.statuses = { ...(targetAfter.statuses || {}) };
        targetAfter.statuses[configuredStatus.name] = Math.max(current, amount);
      } else {
        targetAfter = applyStatus(targetAfter, configuredStatus.name, amount);
      }
      appliedStatuses.push({ name: configuredStatus.name, amount });
    }
  } else {
    for (const status of statusFromDice) {
      if (!status.name || !status.amount) continue;
      targetAfter = applyStatus(targetAfter, status.name, status.amount);
      appliedStatuses.push(status);
    }
  }

  return {
    requiresConfirmation: false,
    actor: actorAfter,
    target: targetAfter,
    state: stateAfter,
    action,
    metadata: {
      label: mechanics.magicActionLabel || mechanics.actionLabel || action.source || "Magic action",
      condition,
      effect: mechanics.effectText || ""
    },
    dice,
    attributes,
    appliedStatuses,
    spent: { [cost.resource]: spending.spent },
    total
  };
}
