function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeModifier(modifier = {}) {
  return {
    attribute: String(modifier.attribute || ""),
    operation: modifier.operation === "multiply" ? "multiply" : "add",
    value: number(modifier.value, modifier.operation === "multiply" ? 1 : 0),
    phase:
      modifier.phase === "once_per_sequence"
        ? "once_per_sequence"
        : "per_hit",
    scope: modifier.scope || "all",
    weaponId: modifier.weaponId ? String(modifier.weaponId) : null,
    label: modifier.label || ""
  };
}

export function modifierApplies(modifier, { attribute, weapon } = {}) {
  if (!modifier.attribute || modifier.attribute !== attribute) return false;

  switch (modifier.scope) {
    case "damage_attribute":
      return Boolean(
        weapon &&
          Array.isArray(weapon.damageAttributes) &&
          weapon.damageAttributes.includes(attribute)
      );
    case "weapon":
      return Boolean(weapon && String(weapon.id) === String(modifier.weaponId));
    case "all":
    default:
      return true;
  }
}

export function collectModifiers(effects = [], phase = "per_hit") {
  const result = [];

  for (const effect of effects) {
    const modifiers = effect?.mechanics?.attributeModifiers || [];
    for (const raw of modifiers) {
      const modifier = normalizeModifier(raw);
      if (modifier.phase === phase) {
        result.push({ ...modifier, source: effect.name || effect.id || "effect" });
      }
    }
  }

  return result;
}

export function calculateAttribute({
  actor,
  attribute,
  weapon = null,
  effects = []
}) {
  const base = number(actor?.attributes?.[attribute]?.base);
  const builtIn = number(actor?.attributes?.[attribute]?.perHitBonus);
  const modifiers = collectModifiers(effects, "per_hit").filter((modifier) =>
    modifierApplies(modifier, { attribute, weapon })
  );

  const additions = modifiers
    .filter((modifier) => modifier.operation === "add")
    .reduce((sum, modifier) => sum + modifier.value, builtIn);

  const multiplier = modifiers
    .filter((modifier) => modifier.operation === "multiply")
    .reduce((product, modifier) => product * modifier.value, 1);

  const total = (base + additions) * multiplier;

  return {
    attribute,
    base,
    additions,
    multiplier,
    total,
    applied: modifiers
  };
}

export function calculateSequenceAttributeBonus({
  actor,
  effects = [],
  attacks = []
}) {
  const attributes = new Set();

  for (const attack of attacks) {
    for (const attribute of attack.weapon?.damageAttributes || []) {
      attributes.add(attribute);
    }
  }

  const modifiers = collectModifiers(effects, "once_per_sequence");
  const details = [];
  let total = 0;

  for (const attribute of attributes) {
    const builtIn = number(actor?.attributes?.[attribute]?.sequenceBonus);
    const applicable = modifiers.filter((modifier) =>
      modifierApplies(modifier, { attribute, weapon: null })
    );

    const additions = applicable
      .filter((modifier) => modifier.operation === "add")
      .reduce((sum, modifier) => sum + modifier.value, builtIn);

    const multiplier = applicable
      .filter((modifier) => modifier.operation === "multiply")
      .reduce((product, modifier) => product * modifier.value, 1);

    const value = additions * multiplier;
    total += value;

    if (value !== 0) {
      details.push({
        attribute,
        additions,
        multiplier,
        total: value,
        applied: applicable
      });
    }
  }

  return { total, details };
}
