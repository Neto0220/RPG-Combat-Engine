import test from "node:test";
import assert from "node:assert/strict";

import {
  createCombatState,
  buildAttackSequence,
  resolveAttackSequence,
  resolveWeaponAction,
  listMagicActions,
  resolveMagicAction,
  nextTurn
} from "../src/index.js";

const lowRoll = () => 0;

function baseActor() {
  return {
    attributes: {
      DEX: { base: 3 }
    },
    resources: {
      mana: { current: 100, max: 100 }
    },
    weapons: [
      {
        id: "sword",
        name: "Sword",
        damageDice: ["1d8"],
        damageAttributes: ["DEX"]
      },
      {
        id: "dagger",
        name: "Dagger",
        damageDice: ["1d6"],
        damageAttributes: ["DEX"]
      }
    ],
    effects: [],
    abilities: []
  };
}

test("dual wield alternates primary and secondary weapons", () => {
  const actor = baseActor();
  actor.effects.push({
    id: "dual",
    name: "Dual wield",
    timing: "passive",
    mechanics: { dualWield: true, extraAttacks: 1 }
  });

  const state = createCombatState({
    primaryWeaponId: "sword",
    secondaryWeaponId: "dagger"
  });

  const sequence = buildAttackSequence({ actor, state });

  assert.equal(sequence.attacks.length, 2);
  assert.equal(sequence.attacks[0].weapon.id, "sword");
  assert.equal(sequence.attacks[1].weapon.id, "dagger");
});

test("optional recursive ability only changes sequence when explicitly selected", () => {
  const actor = baseActor();
  actor.effects.push({
    id: "rapid",
    name: "Rapid passive",
    timing: "passive",
    mechanics: { extraAttacks: 3 }
  });
  actor.abilities.push({
    id: "flurry",
    name: "Flurry",
    timing: "on_use",
    duration: "sequence",
    frequency: "once_turn",
    cost: { resource: "mana", amount: 5 },
    mechanics: {
      attackEvery: 2,
      attackGrant: 1,
      recursiveAttacks: true
    }
  });

  const inactive = createCombatState();
  const inactiveSequence = buildAttackSequence({ actor, state: inactive });
  assert.equal(inactiveSequence.attacks.length, 4);

  const active = createCombatState({ activeAbilityIds: ["flurry"] });
  const activeSequence = buildAttackSequence({ actor, state: active });
  assert.equal(activeSequence.attacks.length, 7);

  const result = resolveAttackSequence({
    actor,
    state: active,
    sequence: activeSequence,
    rng: lowRoll
  });

  assert.equal(result.spent.mana, 5);
  assert.equal(result.actor.resources.mana.current, 95);
  assert.equal(result.state.activeAbilityIds.includes("flurry"), false);
  assert.equal(result.state.usedTurn.includes("flurry"), true);
});

test("per-hit attribute multiplier and once-per-sequence bonus stay separate", () => {
  const actor = baseActor();
  actor.attributes.DEX.sequenceBonus = 10;
  actor.effects.push({
    id: "attribute-rules",
    name: "Attribute rules",
    timing: "passive",
    mechanics: {
      extraAttacks: 1,
      attributeModifiers: [
        {
          attribute: "DEX",
          operation: "multiply",
          value: 2,
          phase: "per_hit",
          scope: "damage_attribute"
        },
        {
          attribute: "DEX",
          operation: "multiply",
          value: 2,
          phase: "once_per_sequence",
          scope: "all"
        }
      ]
    }
  });

  const state = createCombatState({ primaryWeaponId: "sword" });
  const result = resolveAttackSequence({
    actor,
    state,
    rng: lowRoll
  });

  // Each hit: 1 from 1d8 + (DEX 3 × 2) = 7. Two hits = 14.
  // Sequence bonus: +10 × 2 = +20 once.
  assert.equal(result.hits.length, 2);
  assert.equal(result.hits[0].total, 7);
  assert.equal(result.sequenceBonus.total, 20);
  assert.equal(result.damageTotal, 34);
});

test("weapon actions are resolved separately from the normal attack sequence", () => {
  const actor = baseActor();
  actor.weapons[0].actions = [
    {
      id: "finisher",
      name: "Finisher",
      timing: "weapon_action",
      frequency: "once_combat",
      condition: "Target must be marked",
      cost: { resource: "mana", amount: 20 },
      damageDice: ["2d6"],
      damageAttributes: ["DEX"]
    }
  ];

  const state = createCombatState({
    primaryWeaponId: "sword",
    secondaryWeaponId: "dagger"
  });

  const preview = resolveWeaponAction({
    actor,
    state,
    actionId: "finisher",
    confirmCondition: false,
    rng: lowRoll
  });

  assert.equal(preview.requiresConfirmation, true);

  const result = resolveWeaponAction({
    actor,
    state,
    actionId: "finisher",
    confirmCondition: true,
    rng: lowRoll
  });

  // 2d6 at minimum = 2, plus DEX 3.
  assert.equal(result.damage, 5);
  assert.equal(result.actor.resources.mana.current, 80);
  assert.equal(result.state.usedCombat.includes("finisher"), true);
  assert.equal(result.state.secondaryUsed, true);

  assert.throws(() =>
    resolveWeaponAction({
      actor: result.actor,
      state: result.state,
      actionId: "finisher",
      confirmCondition: true,
      rng: lowRoll
    })
  );
});

test("nextTurn clears optional selections and once-turn usage", () => {
  const state = createCombatState({
    turn: 3,
    activeAbilityIds: ["a"],
    usedTurn: ["a"],
    usedCombat: ["b"]
  });

  const next = nextTurn(state);

  assert.equal(next.turn, 4);
  assert.deepEqual(next.activeAbilityIds, []);
  assert.deepEqual(next.usedTurn, []);
  assert.deepEqual(next.usedCombat, ["b"]);
  assert.equal(next.secondaryUsed, false);
});


test("app-shaped weapon abilities use generic mechanics metadata", () => {
  const actor = baseActor();
  actor.weapons[0].abilities = [
    {
      id: "special",
      name: "Special",
      dice: [{ expression: "1d6" }],
      attributeDamage: ["DEX"],
      cost: 10,
      costResource: "mana",
      mechanics: {
        enabled: true,
        timing: "weapon_action",
        frequency: "once_turn",
        actionLabel: "Special action",
        conditionText: "Requires a fictional condition",
        effectText: "Applies a fictional status",
        targetStatusName: "Marked",
        targetStatusDie: "1d4",
        targetStatusMode: "max"
      }
    }
  ];

  const state = createCombatState({
    primaryWeaponId: "sword",
    secondaryWeaponId: "dagger"
  });

  const preview = resolveWeaponAction({
    actor,
    state,
    actionId: "special",
    confirmCondition: false,
    rng: lowRoll
  });

  assert.equal(preview.requiresConfirmation, true);
  assert.equal(preview.condition, "Requires a fictional condition");

  const result = resolveWeaponAction({
    actor,
    state,
    actionId: "special",
    confirmCondition: true,
    rng: lowRoll
  });

  assert.equal(result.damage, 4); // 1d6 minimum 1 + DEX 3
  assert.equal(result.actor.resources.mana.current, 90);
  assert.equal(result.appliedStatus.name, "Marked");
  assert.equal(result.appliedStatus.amount, 1);
  assert.equal(result.target.statuses.Marked, 1);
  assert.equal(result.metadata.label, "Special action");
  assert.equal(result.state.usedTurn.includes("special"), true);
});


test("magic and weapon actions share the same second-action slot", () => {
  const actor = baseActor();
  actor.abilities.push({
    id: "spell",
    name: "Spell",
    cost: { resource: "mana", amount: 10 },
    dice: [{ expression: "+1", label: "Stack Frost" }],
    mechanics: {
      enabled: true,
      timing: "magic_action",
      magicActionEligible: true
    }
  });
  actor.weapons[0].actions = [
    {
      id: "weapon-special",
      name: "Weapon special",
      timing: "weapon_action",
      cost: { resource: "mana", amount: 5 },
      damageDice: ["1d6"]
    }
  ];

  const state = createCombatState({
    primaryWeaponId: "sword",
    secondaryWeaponId: "dagger"
  });

  const listed = listMagicActions({ actor, state });
  assert.equal(listed.map((action) => action.id).includes("spell"), true);

  const magic = resolveMagicAction({
    actor,
    state,
    actionId: "spell",
    rng: lowRoll
  });

  assert.equal(magic.actor.resources.mana.current, 90);
  assert.equal(magic.target.statuses.Frost, 1);
  assert.equal(magic.state.secondaryUsed, true);

  assert.throws(() =>
    resolveWeaponAction({
      actor: magic.actor,
      state: magic.state,
      actionId: "weapon-special",
      rng: lowRoll
    })
  );
});

test("normal attack modifiers are not automatically listed as magic actions", () => {
  const actor = baseActor();
  actor.abilities.push({
    id: "attack-modifier",
    name: "Attack modifier",
    cost: { resource: "mana", amount: 5 },
    mechanics: {
      enabled: true,
      timing: "on_use",
      magicActionEligible: true,
      attackEvery: 2,
      attackGrant: 1
    }
  });

  const state = createCombatState();
  assert.equal(listMagicActions({ actor, state }).length, 0);
});
