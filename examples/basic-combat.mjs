import {
  createCombatState,
  buildAttackSequence,
  resolveAttackSequence,
  listWeaponActions
} from "../src/index.js";

const actor = {
  attributes: {
    DEX: { base: 3 }
  },
  resources: {
    mana: { current: 40, max: 40 }
  },
  weapons: [
    {
      id: "blade",
      name: "Blade",
      damageDice: ["1d8"],
      damageAttributes: ["DEX"],
      actions: [
        {
          id: "arc-cut",
          name: "Arc Cut",
          timing: "weapon_action",
          cost: { resource: "mana", amount: 8 },
          damageDice: ["2d6"],
          damageAttributes: ["DEX"]
        }
      ]
    },
    {
      id: "knife",
      name: "Knife",
      damageDice: ["1d4"],
      damageAttributes: ["DEX"]
    }
  ],
  effects: [
    {
      id: "dual-wield",
      name: "Dual wield",
      timing: "passive",
      mechanics: {
        dualWield: true,
        extraAttacks: 1
      }
    }
  ],
  abilities: [
    {
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
    }
  ]
};

const state = createCombatState({
  primaryWeaponId: "blade",
  secondaryWeaponId: "knife",
  activeAbilityIds: ["flurry"]
});

const sequence = buildAttackSequence({ actor, state });
const result = resolveAttackSequence({
  actor,
  state,
  sequence
});

console.log("Attacks:", sequence.attacks.length);
console.log("Damage:", result.damageTotal);
console.log("Mana left:", result.actor.resources.mana.current);
console.log(
  "Post-attack weapon actions:",
  listWeaponActions({ actor: result.actor, state: result.state }).map(
    (action) => action.name
  )
);
