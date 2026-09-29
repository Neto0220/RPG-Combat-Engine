import test from "node:test";
import assert from "node:assert/strict";

import {
  interpretMechanics,
  applyMechanicsSuggestion
} from "../src/interpreter.js";

test("interprets cost, frequency and magic action", () => {
  const suggestion = interpretMechanics(
    "Magia que custa 10 mana, causa 2d6 de dano e pode ser usada uma vez por turno.",
    { context: "ability" }
  );

  assert.equal(suggestion.fields.cost, 10);
  assert.equal(suggestion.fields.costResource, "mana");
  assert.equal(suggestion.mechanics.frequency, "once_turn");
  assert.equal(suggestion.mechanics.timing, "magic_action");
  assert.equal(suggestion.mechanics.magicActionEligible, true);
  assert.equal(suggestion.fields.dice[0].expression, "2d6");
  assert.ok(suggestion.confidence > 0.9);
});

test("interprets recursive extra attack generator", () => {
  const suggestion = interpretMechanics(
    "Ao usar, a cada 2 ataques gera 1 ataque extra, inclusive os ataques gerados contam para gerar novos ataques. Custa 5 mana.",
    { context: "ability" }
  );

  assert.equal(suggestion.mechanics.attackEvery, 2);
  assert.equal(suggestion.mechanics.attackGrant, 1);
  assert.equal(suggestion.mechanics.recursiveAttacks, true);
  assert.equal(suggestion.mechanics.timing, "on_use");
  assert.equal(suggestion.fields.cost, 5);
});

test("interprets attribute multiplier and weapon role", () => {
  const suggestion = interpretMechanics(
    "Enquanto esta arma estiver como arma secundária, aplica o dobro da Destreza no dano.",
    { context: "item_ability" }
  );

  assert.equal(suggestion.mechanics.attributeName, "DES");
  assert.equal(suggestion.mechanics.attributeMode, "multiply");
  assert.equal(suggestion.mechanics.attributeValue, 2);
  assert.equal(suggestion.mechanics.attributeScope, "linked_weapon");
  assert.equal(suggestion.mechanics.conditionWeaponRole, "secondary");
});

test("interprets reaction and mitigation", () => {
  const suggestion = interpretMechanics(
    "Reação, uma vez por turno: nega 1 ataque e reduz 1d6 de dano.",
    { context: "ability" }
  );

  assert.equal(suggestion.mechanics.timing, "reaction");
  assert.equal(suggestion.mechanics.frequency, "once_turn");
  assert.equal(suggestion.mechanics.negateAttacks, 1);
  assert.equal(suggestion.mechanics.damageReductionDice, "1d6");
});

test("interprets status stacks and requirements", () => {
  const suggestion = interpretMechanics(
    "Requer 5 stacks de Gelo. Aplica 1d4 stacks de Congelado.",
    { context: "ability" }
  );

  assert.equal(suggestion.mechanics.requiredStatusName, "Gelo");
  assert.equal(suggestion.mechanics.requiredStatusMin, 5);
  assert.equal(suggestion.mechanics.targetStatusName, "Congelado");
  assert.equal(suggestion.mechanics.targetStatusDie, "1d4");
});

test("item descriptions default to passive mechanics", () => {
  const suggestion = interpretMechanics(
    "Enquanto equipado concede +2 Defesa e redução de dano 3.",
    { context: "item" }
  );

  assert.equal(suggestion.mechanics.timing, "passive");
  assert.equal(suggestion.fields.defenseBonus, 2);
  assert.equal(suggestion.mechanics.damageReduction, 3);
});

test("apply suggestion preserves manual values unless overwrite is requested", () => {
  const suggestion = interpretMechanics(
    "Custa 10 mana e pode ser usada uma vez por turno.",
    { context: "ability" }
  );

  const existing = {
    cost: 5,
    costResource: "mana",
    mechanics: {
      enabled: true,
      frequency: "once_combat"
    }
  };

  const safe = applyMechanicsSuggestion(existing, suggestion);
  assert.equal(safe.cost, 5);
  assert.equal(safe.mechanics.frequency, "once_combat");

  const forced = applyMechanicsSuggestion(existing, suggestion, { overwrite: true });
  assert.equal(forced.cost, 10);
  assert.equal(forced.mechanics.frequency, "once_turn");
});

test("ambiguous prose does not invent mechanics", () => {
  const suggestion = interpretMechanics(
    "Uma técnica elegante que envolve o usuário em uma aura azul.",
    { context: "ability" }
  );

  assert.equal(suggestion.confidence, 0);
  assert.equal(suggestion.mechanics.enabled, false);
  assert.ok(suggestion.warnings.length > 0);
});


test("structured creation prompt fills name description damage cost and use", () => {
  const suggestion = interpretMechanics(
    "Nome da habilidade: Ruptura Espacial\nDescrição: Dá um soco no ar, manipula o espaço e racha a área.\nDano: 1d12\nCusto de mana: 5\nUso: uma vez por turno",
    { context: "ability" }
  );

  assert.equal(suggestion.fields.name, "Ruptura Espacial");
  assert.equal(suggestion.fields.description, "Dá um soco no ar, manipula o espaço e racha a área.");
  assert.equal(suggestion.fields.dice[0].expression, "1d12");
  assert.equal(suggestion.fields.cost, 5);
  assert.equal(suggestion.fields.costResource, "mana");
  assert.equal(suggestion.mechanics.frequency, "once_turn");
  assert.equal(suggestion.mechanics.timing, "magic_action");
  assert.equal(suggestion.structured, true);
  assert.ok(suggestion.explicitFields.includes("name"));
});

test("explicit structured name replaces an existing entity name safely", () => {
  const suggestion = interpretMechanics(
    "Nome da arma: Lâmina do Vazio\nDescrição: Uma espada que causa 2d6 de dano.\nUso: sem limite",
    { context: "item" }
  );

  const existing = {
    name: "Espada Antiga",
    description: "texto antigo",
    mechanics: { enabled: true, frequency: "once_combat" }
  };

  const merged = applyMechanicsSuggestion(existing, suggestion);
  assert.equal(merged.name, "Lâmina do Vazio");
  assert.equal(merged.description, "Uma espada que causa 2d6 de dano.");
  assert.equal(merged.mechanics.frequency, "unlimited");
});

test("free speech can infer an explicit ability name", () => {
  const suggestion = interpretMechanics(
    "A habilidade se chama Punho Dimensional, custa 5 mana, dá 1d12 de dano e pode ser usada uma vez por turno.",
    { context: "ability" }
  );

  assert.equal(suggestion.fields.name, "Punho Dimensional");
  assert.equal(suggestion.fields.cost, 5);
  assert.equal(suggestion.mechanics.frequency, "once_turn");
});


test("single-line parameter prompt accepts shorthand D12", () => {
  const suggestion = interpretMechanics(
    "Nome da habilidade: Punho Espacial, descrição: dá um soco no ar e racha o espaço, dano: D12, custo de mana: 5, uso: uma vez por turno",
    { context: "ability" }
  );

  assert.equal(suggestion.fields.name, "Punho Espacial");
  assert.equal(suggestion.fields.description, "dá um soco no ar e racha o espaço");
  assert.equal(suggestion.fields.dice[0].expression, "1d12");
  assert.equal(suggestion.fields.cost, 5);
  assert.equal(suggestion.mechanics.frequency, "once_turn");
  assert.equal(suggestion.mechanics.magicActionEligible, true);
});
