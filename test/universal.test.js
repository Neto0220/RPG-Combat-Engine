import test from "node:test";
import assert from "node:assert/strict";

import { createRulesProfile } from "../src/rules.js";
import { resolveCheck, resolveOpposedCheck, resolveInitiative } from "../src/checks.js";
import { createTurnState, takeAction, nextTurn as nextUniversalTurn } from "../src/turns.js";
import { resolveDamage, tickTimedEffects } from "../src/damage.js";
import { collectFeatures, evaluateRequirements, deriveProgression } from "../src/progression.js";
import { canPayCosts, payCosts } from "../src/resources.js";
import { fireModePreview, consumeAmmo } from "../src/firearms.js";

const minRoll = () => 0;
const maxRoll = () => 0.999999;

const oldSchool = createRulesProfile({
  id: "old-school-example",
  checks: {
    default: {
      die: "1d20",
      mode: "roll_over",
      critical: { successOn: [20], failureOn: [1] }
    },
    percent: { die: "1d100", mode: "roll_under", skillAsTarget: true }
  },
  initiative: { die: "1d10", attribute: "DEX", sort: "desc", reroll: "turn" },
  actionEconomy: {
    initialPhase: "main",
    phases: { main: { slots: { action: 1, movement: 1 }, repeatable: false } },
    multiAction: { enabled: false }
  },
  damage: {
    minimum: 1,
    health: { mode: "resource", path: "resources.hp.current" },
    massiveDamage: { base: 35, attributePath: "attributes.CON.base", consequence: "save" }
  }
});

test("roll-over and natural critical policies are data driven", () => {
  const actor = { attributes: { STR: { base: 4 } } };
  const miss = resolveCheck({ actor, rules: oldSchool, check: { attribute: "STR", target: 10 }, rng: minRoll });
  assert.equal(miss.total, 5);
  assert.equal(miss.success, false);
  assert.equal(miss.criticalFailure, true);

  const crit = resolveCheck({ actor, rules: oldSchool, check: { attribute: "STR", target: 30 }, rng: maxRoll });
  assert.equal(crit.natural, 20);
  assert.equal(crit.success, true);
  assert.equal(crit.criticalSuccess, true);
});

test("roll-under percent skills work without hardcoded class logic", () => {
  const actor = { skills: { stealth: { value: 65 } } };
  const result = resolveCheck({ actor, rules: oldSchool, check: { type: "percent", skill: "stealth", skillAsTarget: true }, rng: () => 0.49 });
  assert.equal(result.target, 65);
  assert.equal(result.success, true);
});

const d10Skill = createRulesProfile({
  id: "d10-skill-example",
  checks: {
    default: {
      die: "1d10",
      mode: "roll_over",
      critical: { failureOn: [1], explodeOn: [10], maxExplosions: 1 }
    }
  },
  initiative: { die: "1d10", attribute: "REF", specialPath: "role.initiativeBonus", sort: "desc" },
  actionEconomy: {
    initialPhase: "main",
    phases: { main: { slots: {}, repeatable: true } },
    multiAction: { enabled: true, penaltyPerExtra: -3, penaltyStartsAt: 2 }
  },
  damage: {
    hitLocation: {
      die: "1d10",
      table: [
        { min: 1, max: 1, id: "head", multiplier: 2 },
        { min: 2, max: 4, id: "torso" },
        { min: 5, max: 10, id: "limb" }
      ]
    },
    armor: {
      layering: {
        mode: "highest_plus_difference_bonus",
        bonusByDifference: [
          { min: 0, max: 4, bonus: 5 },
          { min: 5, max: 8, bonus: 4 },
          { min: 9, max: 14, bonus: 3 },
          { min: 15, max: 20, bonus: 2 },
          { min: 21, max: 26, bonus: 1 },
          { min: 27, max: 999, bonus: 0 }
        ]
      }
    },
    bodyModifier: {
      path: "attributes.BODY.base",
      table: [
        { min: 1, max: 2, reduction: 0 },
        { min: 3, max: 4, reduction: 1 },
        { min: 5, max: 7, reduction: 2 },
        { min: 8, max: 9, reduction: 3 },
        { min: 10, max: 10, reduction: 4 }
      ]
    },
    health: { mode: "wounds", path: "wounds.current" },
    woundTrack: {
      path: "wounds.current",
      thresholds: [
        { min: 0, max: 4, label: "light" },
        { min: 5, max: 8, label: "serious" },
        { min: 9, max: 12, label: "critical" },
        { min: 13, max: 999, label: "mortal" }
      ]
    }
  },
  firearms: {
    modes: {
      burst: { shots: 3, attackModifier: 3, hits: { type: "single" } },
      auto: { shots: "rate", attackModifierEveryShots: 10, attackModifierPerStep: -1, hits: { type: "margin", perMargin: 1, minimumOnSuccess: true } }
    }
  }
});

test("d10 skill checks can explode on a natural maximum", () => {
  const actor = { attributes: { REF: { base: 8 } }, skills: { handgun: { value: 6 } } };
  const values = [0.999999, 0.4];
  const result = resolveCheck({ actor, rules: d10Skill, check: { attribute: "REF", skill: "handgun", target: 25 }, rng: () => values.shift() });
  assert.equal(result.natural, 10);
  assert.equal(result.explosionRolls.length, 1);
  assert.equal(result.total, 29);
  assert.equal(result.success, true);
});

test("opposed checks model melee-style attacker versus defender rolls", () => {
  const actor = { attributes: { REF: { base: 8 } }, skills: { melee: { value: 7 } } };
  const opponent = { attributes: { REF: { base: 6 } }, skills: { evade: { value: 5 } } };
  const rolls = [0.4, 0.3];
  const result = resolveOpposedCheck({
    actor,
    opponent,
    rules: d10Skill,
    actorCheck: { attribute: "REF", skill: "melee" },
    opponentCheck: { attribute: "REF", skill: "evade" },
    rng: () => rolls.shift()
  });
  assert.equal(result.winner, "actor");
});

test("initiative supports attributes plus role or feature bonuses", () => {
  const actors = [
    { id: "a", attributes: { REF: { base: 7 } }, role: { initiativeBonus: 3 } },
    { id: "b", attributes: { REF: { base: 8 } }, role: { initiativeBonus: 0 } }
  ];
  const results = resolveInitiative({ actors, rules: d10Skill, rng: () => 0.4 });
  assert.equal(results[0].actor.id, "a");
});

test("action economy can be strict or allow repeated actions with cumulative penalties", () => {
  let strict = createTurnState({ rules: oldSchool });
  const first = takeAction({ rules: oldSchool, state: strict, action: { id: "attack", slot: "action" } });
  assert.equal(first.ok, true);
  const second = takeAction({ rules: oldSchool, state: first.state, action: { id: "spell", slot: "action" } });
  assert.equal(second.ok, false);

  let flexible = createTurnState({ rules: d10Skill });
  const a1 = takeAction({ rules: d10Skill, state: flexible, action: { id: "one" } });
  const a2 = takeAction({ rules: d10Skill, state: a1.state, action: { id: "two" } });
  const a3 = takeAction({ rules: d10Skill, state: a2.state, action: { id: "three" } });
  assert.equal(a1.penalty, 0);
  assert.equal(a2.penalty, -3);
  assert.equal(a3.penalty, -6);
});

test("phase transitions can model attack then an open combo phase", () => {
  const comboRules = createRulesProfile({
    id: "combo-example",
    actionEconomy: {
      initialPhase: "attack",
      phases: {
        attack: { slots: { action: 1 }, repeatable: false },
        magic: { slots: {}, repeatable: true }
      },
      multiAction: { enabled: false }
    }
  });
  let state = createTurnState({ rules: comboRules });
  const attack = takeAction({ rules: comboRules, state, action: { id: "attack", slot: "action", transitionTo: "magic" } });
  assert.equal(attack.state.phase, "magic");
  const spell1 = takeAction({ rules: comboRules, state: attack.state, action: { id: "spell-1", phase: "magic" } });
  const spell2 = takeAction({ rules: comboRules, state: spell1.state, action: { id: "spell-2", phase: "magic" } });
  assert.equal(spell2.ok, true);
  const fresh = nextUniversalTurn({ rules: comboRules, state: spell2.state });
  assert.equal(fresh.phase, "attack");
});

test("location armor, penetration, body reduction and wound tracks compose", () => {
  const target = {
    attributes: { BODY: { base: 6 } },
    armor: { head: [{ value: 10 }, { value: 6 }], torso: 8 },
    wounds: { current: 0 }
  };
  const result = resolveDamage({
    target,
    damage: 20,
    penetration: { armorMultiplier: 0.5, damageMultiplier: 0.5 },
    rules: d10Skill,
    rng: minRoll
  });
  assert.equal(result.location.id, "head");
  assert.equal(result.armor.combined, 15);
  assert.equal(result.armor.effective, 7.5);
  assert.equal(result.finalDamage, 10);
  assert.equal(result.target.wounds.current, 10);
  assert.equal(result.woundSeverity.label, "critical");
});

test("timed effects support recurring and decaying damage", () => {
  const target = { resources: { hp: { current: 20 } } };
  const first = tickTimedEffects({
    target,
    effects: [{ id: "acid", damage: { flat: 3 }, decayPerTick: 1, remaining: 3, resourcePath: "resources.hp.current", stopAtZero: true }]
  });
  assert.equal(first.target.resources.hp.current, 17);
  assert.equal(first.effects[0].damage.flat, 2);
});

test("classes, ancestries, roles and cyberware can all contribute features", () => {
  const actor = {
    level: 8,
    race: { id: "heritage", features: [{ id: "vision", level: 1 }] },
    class: { id: "fighter", features: [{ id: "extra-attack", level: 7 }] },
    role: { id: "operative", features: [{ id: "special-sense", level: 1 }] },
    cyberware: [{ id: "implant", features: [{ id: "reflex-boost", level: 1 }] }]
  };
  const features = collectFeatures(actor, oldSchool);
  assert.deepEqual(features.map((x) => x.id).sort(), ["extra-attack", "reflex-boost", "special-sense", "vision"]);
  const req = evaluateRequirements({ ...actor, attributes: { STR: { base: 12 } } }, [
    { type: "attribute_min", attribute: "STR", value: 10 },
    { type: "source", source: "class", value: "fighter" }
  ]);
  assert.equal(req.ok, true);

  const progression = deriveProgression(actor, {
    table: [{ level: 1, attacks: 1 }, { level: 7, attacks: 2 }],
    features: [{ id: "x", level: 5 }]
  });
  assert.equal(progression.row.attacks, 2);
});

test("resource costs support mana, spell slots, prepared uses and arbitrary counters", () => {
  const actor = {
    resources: { mana: { current: 20 }, spellSlots: { 2: { current: 1 } } },
    prepared: { fire: 1 }
  };
  const costs = [
    { resource: "mana", amount: 5 },
    { path: "resources.spellSlots.2.current", amount: 1 },
    { type: "prepared", path: "prepared.fire", amount: 1 }
  ];
  assert.equal(canPayCosts(actor, costs).ok, true);
  const paid = payCosts(actor, costs);
  assert.equal(paid.actor.resources.mana.current, 15);
  assert.equal(paid.actor.resources.spellSlots[2].current, 0);
  assert.equal(paid.actor.prepared.fire, 0);
});

test("fire modes are declared by profile instead of hardcoded by weapon name", () => {
  const weapon = { rateOfFire: 30, ammo: { current: 20 } };
  const auto = fireModePreview({ weapon, mode: "auto", margin: 4, rules: d10Skill });
  assert.equal(auto.shots, 20);
  assert.equal(auto.attackModifier, -2);
  assert.equal(auto.hits, 4);
  const consumed = consumeAmmo(weapon, auto.shots);
  assert.equal(consumed.remaining, 0);
});
