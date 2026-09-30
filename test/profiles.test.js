import test from "node:test";
import assert from "node:assert/strict";

import {
  listSystemProfiles,
  createSystemProfile,
  compileSystemProfile,
  compileUiSchema
} from "../src/profiles.js";
import { resolveInitiative } from "../src/checks.js";
import {
  createEntityFromText,
  inferEntityType,
  creationTemplate
} from "../src/interpreter.js";

const minRoll = () => 0;

test("profile catalog exposes distinct RPG families", () => {
  const ids = listSystemProfiles().map((profile) => profile.id);
  assert.ok(ids.includes("custom-combo"));
  assert.ok(ids.includes("classic-d20-fantasy"));
  assert.ok(ids.includes("d10-skill-modern"));
  assert.ok(ids.includes("custom-horror"));
});

test("classic fantasy profile compiles an old-school oriented UI", () => {
  const profile = compileSystemProfile("classic-d20-fantasy");
  const ui = compileUiSchema(profile);

  assert.equal(profile.capabilities.initiativeDependsOnAction, true);
  assert.ok(ui.sections.some((section) => section.id === "race"));
  assert.ok(ui.sections.some((section) => section.id === "class"));
  assert.ok(ui.sections.some((section) => section.id === "magic"));
  assert.equal(ui.sections.some((section) => section.id === "cyberware"), false);
});

test("d10 tactical profile requests system-specific tables instead of embedding them", () => {
  const profile = compileSystemProfile("d10-skill-modern");
  const ui = compileUiSchema(profile);

  assert.equal(profile.capabilities.multipleActions, true);
  assert.equal(profile.capabilities.hitLocations, true);
  assert.equal(profile.capabilities.firearms, true);
  assert.ok(profile.configurationRequired.includes("damage.hitLocation.table"));
  assert.ok(ui.sections.some((section) => section.id === "roles"));
  assert.ok(ui.sections.some((section) => section.id === "cyberware"));
  assert.ok(ui.sections.some((section) => section.id === "firearms"));
});

test("action-dependent initiative can use weapon or action formula terms", () => {
  const profile = createSystemProfile("classic-d20-fantasy");
  const actor = { attributes: { DES: { base: 12 } } };

  const spell = resolveInitiative({
    actors: [actor],
    rules: profile.rules,
    rng: minRoll,
    context: {
      actionType: "spell",
      action: { level: 3 }
    }
  })[0];

  // minimum d10 roll = 1; spell modifier = 10 - level 3 = 7
  assert.equal(spell.modifier.terms.reduce((sum, term) => sum + term.total, 0), 7);
  assert.equal(spell.total, 8);

  const weapon = resolveInitiative({
    actors: [actor],
    rules: profile.rules,
    rng: minRoll,
    context: {
      actionType: "weapon",
      weapon: { initiative: 5 }
    }
  })[0];

  assert.equal(weapon.modifier.terms[0].total, 5);
  assert.equal(weapon.total, 6);
});

test("assisted creation infers ability type and fills a complete object", () => {
  const created = createEntityFromText(
    "Nome da habilidade: Punho Espacial, descrição: dá um soco no ar, manipula o espaço rachando e dá D12 de dano no oponente, custo de mana: 5, uso: uma vez por turno"
  );

  assert.equal(created.entityType, "ability");
  assert.equal(created.entity.name, "Punho Espacial");
  assert.match(created.entity.description, /soco no ar/i);
  assert.equal(created.entity.cost, 5);
  assert.equal(created.entity.costResource, "mana");
  assert.equal(created.entity.dice[0].expression, "1d12");
  assert.equal(created.entity.mechanics.frequency, "once_turn");
});

test("assisted creation infers weapon and normalizes its damage field", () => {
  const created = createEntityFromText(
    "Nome da arma: Lâmina de Vidro, descrição: uma espada leve, dano: D8, uso: sem limite"
  );

  assert.equal(inferEntityType("Nome da arma: Lâmina de Vidro"), "weapon");
  assert.equal(created.entityType, "weapon");
  assert.equal(created.entity.name, "Lâmina de Vidro");
  assert.equal(created.entity.damageDice[0].expression, "1d8");
  assert.equal("dice" in created.entity, false);
});

test("creation templates are provided by the engine for app reuse", () => {
  assert.match(creationTemplate("ability"), /Nome da habilidade:/);
  assert.match(creationTemplate("weapon"), /Nome da arma:/);
  assert.match(creationTemplate("class"), /Nome da classe:/);
});
