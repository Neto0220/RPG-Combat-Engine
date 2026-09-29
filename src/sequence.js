import { expectedDice } from "./dice.js";
import { calculateAttribute } from "./modifiers.js";

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function allRuleEntities(actor = {}) {
  return [
    ...(actor.effects || []),
    ...(actor.abilities || [])
  ].filter(Boolean);
}

export function getActiveEffects({ actor, state }) {
  const selected = new Set(state.activeAbilityIds || []);
  const active = [];

  for (const effect of allRuleEntities(actor)) {
    if (effect.enabled === false) continue;

    const timing = effect.timing || "passive";
    if (
      timing === "passive" ||
      timing === "on_hit" ||
      timing === "start_turn" ||
      selected.has(effect.id)
    ) {
      active.push(effect);
    }
  }

  return active;
}

export function getEquippedWeapons({ actor, state }) {
  const weapons = actor.weapons || [];
  const primary =
    weapons.find((weapon) => String(weapon.id) === String(state.primaryWeaponId)) ||
    weapons[0] ||
    null;

  const secondary =
    weapons.find(
      (weapon) => String(weapon.id) === String(state.secondaryWeaponId)
    ) ||
    weapons.find((weapon) => weapon !== primary) ||
    null;

  return { weapons, primary, secondary };
}

export function expectedWeaponDamage({ actor, weapon, effects = [] }) {
  if (!weapon) return 0;

  const dice = (weapon.damageDice || []).reduce(
    (sum, expression) => sum + expectedDice(expression),
    0
  );

  const attributes = (weapon.damageAttributes || []).reduce(
    (sum, attribute) =>
      sum +
      calculateAttribute({ actor, attribute, weapon, effects }).total,
    0
  );

  return dice + attributes;
}

function chooseWeapon({
  actor,
  effects,
  primary,
  secondary,
  weapons,
  mode = "highest",
  index = 0
}) {
  if (!weapons.length) return null;

  if (mode === "primary") return primary || weapons[0];
  if (mode === "secondary") return secondary || primary || weapons[0];

  if (mode === "alternate") {
    const pair = [primary, secondary].filter(Boolean);
    return pair[index % pair.length] || weapons[0];
  }

  return [...weapons].sort(
    (a, b) =>
      expectedWeaponDamage({ actor, weapon: b, effects }) -
      expectedWeaponDamage({ actor, weapon: a, effects })
  )[0];
}

export function buildAttackSequence({ actor, state }) {
  const effects = getActiveEffects({ actor, state });
  const { weapons, primary, secondary } = getEquippedWeapons({ actor, state });

  const dualWield = effects.some(
    (effect) => effect?.mechanics?.dualWield === true
  );

  const passiveExtra = effects
    .filter((effect) => (effect.timing || "passive") === "passive")
    .reduce(
      (sum, effect) =>
        sum + Math.max(0, Math.floor(number(effect?.mechanics?.extraAttacks))),
      0
    );

  const baseCount =
    Math.max(1, Math.floor(number(state.baseAttacks, 1))) + passiveExtra;

  const attacks = [];

  for (let i = 0; i < baseCount; i += 1) {
    attacks.push({
      weapon:
        dualWield && primary && secondary
          ? i % 2 === 0
            ? primary
            : secondary
          : chooseWeapon({
              actor,
              effects,
              primary,
              secondary,
              weapons,
              mode: "highest",
              index: i
            }),
      generated: false,
      sourceId: null
    });
  }

  for (const effect of effects.filter(
    (candidate) => (candidate.timing || "passive") !== "passive"
  )) {
    const count = Math.max(
      0,
      Math.floor(number(effect?.mechanics?.extraAttacks))
    );

    for (let i = 0; i < count; i += 1) {
      attacks.push({
        weapon: chooseWeapon({
          actor,
          effects,
          primary,
          secondary,
          weapons,
          mode: effect?.mechanics?.extraWeaponMode || "highest",
          index: i
        }),
        generated: true,
        sourceId: effect.id
      });
    }
  }

  const generators = effects
    .filter(
      (effect) =>
        number(effect?.mechanics?.attackEvery) > 0 &&
        number(effect?.mechanics?.attackGrant) > 0
    )
    .map((effect) => ({ effect, count: 0 }));

  let position = 0;
  const maxAttacks = Math.max(1, Math.floor(number(state.maxAttacks, 100)));

  while (position < attacks.length && attacks.length < maxAttacks) {
    const attack = attacks[position];
    position += 1;

    for (const generator of generators) {
      const mechanics = generator.effect.mechanics || {};

      if (!mechanics.recursiveAttacks && attack.generated) {
        continue;
      }

      generator.count += 1;
      const every = Math.max(1, Math.floor(number(mechanics.attackEvery)));

      if (generator.count % every === 0) {
        const grant = Math.max(
          0,
          Math.floor(number(mechanics.attackGrant))
        );

        for (let i = 0; i < grant && attacks.length < maxAttacks; i += 1) {
          attacks.push({
            weapon: chooseWeapon({
              actor,
              effects,
              primary,
              secondary,
              weapons,
              mode: mechanics.extraWeaponMode || "highest",
              index: i
            }),
            generated: true,
            sourceId: generator.effect.id
          });
        }
      }
    }
  }

  return {
    attacks,
    effects,
    primaryWeapon: primary,
    secondaryWeapon: secondary,
    dualWield,
    baseCount,
    extraCount: Math.max(0, attacks.length - baseCount),
    capped: attacks.length >= maxAttacks
  };
}
