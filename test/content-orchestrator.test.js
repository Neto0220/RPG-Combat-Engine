import test from "node:test";
import assert from "node:assert/strict";

import {
  synthesizeNarrativeEntity,
  applyEntitySynthesis,
  validateNarrativeEntityDraft,
  buildEntitySynthesisProviderRequest,
  mergeEntitySyntheses,
  createAIManager,
  createUnifiedEngine
} from "../src/index.js";

test("free speech creates a race draft without label:value syntax", () => {
  const synthesis = synthesizeNarrativeEntity(
    "Quero criar uma raça de elfos do gelo chamada Avarin. Eles são de tamanho médio, se movem 9 metros, ganham dois de Destreza, falam Comum e Élfico, são resistentes a frio e possuem visão no escuro de 18 metros."
  , { context: "race" });

  assert.equal(synthesis.entityType, "race");
  assert.equal(synthesis.draft.name, "Avarin");
  assert.equal(synthesis.draft.size, "medium");
  assert.equal(synthesis.draft.movement.value, 9);
  assert.equal(synthesis.draft.movement.unit, "m");
  assert.equal(synthesis.draft.attributeBonuses.DES, 2);
  assert.ok(synthesis.draft.languages.includes("Comum"));
  assert.ok(synthesis.draft.resistances.some((value) => /frio/i.test(value)));
  assert.equal(synthesis.draft.senses[0].range, 18);
  assert.equal(synthesis.valid, true);
  assert.ok(synthesis.changes.some((item) => item.path === "name"));
});

test("free speech fills ability mechanics and keeps editable draft", () => {
  const synthesis = synthesizeNarrativeEntity(
    "A habilidade se chama Passo de Gelo. Eu desapareço numa névoa, apareço perto do alvo, gasto 8 mana e posso usar uma vez por turno. O ataque causa 2d6 de dano."
  , { context: "ability" });

  assert.equal(synthesis.draft.name, "Passo de Gelo");
  assert.equal(synthesis.draft.cost, 8);
  assert.equal(synthesis.draft.costResource, "mana");
  assert.equal(synthesis.draft.mechanics.frequency, "once_turn");
  assert.equal(synthesis.draft.dice[0].expression, "2d6");
  assert.ok(synthesis.confidence > 0.7);
});

test("apply synthesis preserves manual fields but replaces placeholders", () => {
  const synthesis = synthesizeNarrativeEntity(
    "A arma se chama Lâmina Boreal. Ela causa 1d10 de dano e pode ser usada sem limite."
  , { context: "weapon" });

  const applied = applyEntitySynthesis(
    { name: "Nova arma", description: "", damageDice: [], mechanics: {} },
    synthesis
  );

  assert.equal(applied.name, "Lâmina Boreal");
  assert.ok(applied.damageDice.length > 0);
  assert.ok(applied.aiContent);
  assert.ok(applied.aiContent.appliedPaths.includes("name"));

  const preserved = applyEntitySynthesis(
    { name: "Espada Manual", description: "Descrição feita pelo usuário", damageDice: [], mechanics: {} },
    synthesis
  );
  assert.equal(preserved.name, "Lâmina Boreal");
  assert.equal(preserved.description, "Descrição feita pelo usuário");
});

test("validation exposes only what still needs human review", () => {
  const synthesis = synthesizeNarrativeEntity(
    "Quero uma raça que consiga respirar debaixo d'água e enxergar no escuro."
  , { context: "race" });
  const validation = validateNarrativeEntityDraft(synthesis);
  assert.equal(validation.valid, true);
  assert.ok(validation.missing.includes("name"));
  assert.ok(synthesis.uncertainties.some((item) => /nome/i.test(item)));
  assert.ok(synthesis.draft.traits.length >= 1);
});

test("provider request is narrative-first and code constrained", () => {
  const request = buildEntitySynthesisProviderRequest(
    "Quero criar uma raça chamada Avarin que ganha dois de Destreza.",
    { context: "race" }
  );
  assert.equal(request.task, "synthesize_entity");
  assert.match(request.contract.instruction, /Do not require label:value syntax/i);
  assert.match(request.contract.instruction, /Do not emit executable code/i);
  assert.equal(request.entityType, "race");
});

test("provider synthesis can enrich the local draft without losing local facts", () => {
  const local = synthesizeNarrativeEntity(
    "Quero criar uma raça chamada Avarin que ganha dois de Destreza.",
    { context: "race" }
  );
  const merged = mergeEntitySyntheses(local, {
    confidence: 0.97,
    draft: { languages: ["Comum"], size: "medium" },
    changes: [
      { path: "size", value: "medium", confidence: 0.95, evidence: "provider inference" }
    ]
  });

  assert.equal(merged.draft.name, "Avarin");
  assert.equal(merged.draft.attributeBonuses.DES, 2);
  assert.equal(merged.draft.size, "medium");
  assert.deepEqual(merged.draft.languages, ["Comum"]);
});

test("AI manager and rules engine share one entity synthesis workflow", async () => {
  const manager = createAIManager({ policy: "assist" });
  const synthesis = await manager.synthesizeEntity(
    "Quero uma habilidade chamada Corte de Névoa que custa 4 mana, causa 1d8 e só pode ser usada uma vez por turno.",
    { context: "ability", localOnly: true }
  );
  const entity = manager.applyEntity(
    { name: "Nova habilidade", description: "", cost: 0, costResource: "mana", dice: [], mechanics: {} },
    synthesis
  );

  assert.equal(entity.name, "Corte de Névoa");
  assert.equal(entity.cost, 4);
  assert.equal(entity.mechanics.frequency, "once_turn");
});

test("unified engine routes entity narration and rule narration through one API", async () => {
  const unified = createUnifiedEngine({ policy: "assist" });

  const entityResult = await unified.process(
    "Quero criar uma raça chamada Nômades da Névoa. Eles se movem 10 metros e ganham dois de Destreza.",
    { context: "race", baseEntity: {}, localOnly: true }
  );
  assert.equal(entityResult.intent, "entity");
  assert.equal(entityResult.entity.name, "Nômades da Névoa");

  const ruleResult = await unified.process(
    "Meu sistema usa d10, perícias e múltiplas ações.",
    { intent: "rules", localOnly: true, apply: false }
  );
  assert.equal(ruleResult.intent, "rules");
  assert.equal(ruleResult.applied, false);
});
