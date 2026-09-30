import test from "node:test";
import assert from "node:assert/strict";

import {
  RPG_DESIGN_CORPUS,
  DESIGN_DIMENSIONS,
  listDesignBenchmarks,
  getDesignBenchmark,
  compareDesignDimensions,
  evaluateScenarioAgainstCorpus,
  createAIManager
} from "../src/index.js";

test("design corpus contains exactly 30 benchmark RPG systems", () => {
  assert.equal(RPG_DESIGN_CORPUS.length, 30);
  assert.equal(listDesignBenchmarks().length, 30);
  assert.ok(DESIGN_DIMENSIONS.includes("actionEconomy"));
  assert.ok(DESIGN_DIMENSIONS.includes("narrativeAuthority"));
});

test("corpus spans distinct mechanical families", () => {
  const families = new Set(RPG_DESIGN_CORPUS.map((entry) => entry.family));
  assert.ok(families.size >= 20);
  for (const id of [
    "dnd-5e-2024",
    "pathfinder-2e",
    "call-of-cthulhu-7e",
    "blades-in-the-dark",
    "daggerheart",
    "cyberpunk-red",
    "fate-core",
    "gurps-4e",
    "fabula-ultima",
    "mothership-1e"
  ]) assert.ok(getDesignBenchmark(id));
});

test("scenario evaluation finds relevant benchmark architectures", () => {
  const tactical = evaluateScenarioAgainstCorpus(
    "Sistema com três ações, quatro graus de sucesso, d20 e reação."
  );
  assert.equal(tactical.matches[0].id, "pathfinder-2e");

  const horror = evaluateScenarioAgainstCorpus(
    "Horror espacial com stress, panic e testes percentile."
  );
  assert.ok(horror.matches.some((entry) => entry.id === "mothership-1e"));

  const narrative = evaluateScenarioAgainstCorpus(
    "Quero aspects, Fate Points, invoke e compel."
  );
  assert.equal(narrative.matches[0].id, "fate-core");
});

test("dimension comparison exposes reusable design differences", () => {
  const comparison = compareDesignDimensions("dnd-5e-2024", "blades-in-the-dark");
  assert.equal(comparison.left, "dnd-5e-2024");
  assert.equal(comparison.right, "blades-in-the-dark");
  assert.equal(comparison.dimensions.initiative.same, false);
  assert.equal(comparison.dimensions.actionEconomy.same, false);
});

test("AI manager exposes corpus and includes benchmark evaluation in analysis", () => {
  const manager = createAIManager({ policy: "assist" });
  const analysis = manager.analyze(
    "Quero d6 pool, flashback, stress, posição e efeito."
  );
  assert.equal(analysis.designEvaluation.benchmarkCount, 30);
  assert.ok(analysis.designEvaluation.matches.some((entry) => entry.id === "blades-in-the-dark"));
  assert.equal(manager.designBenchmarks().length, 30);
  assert.ok(manager.references().length > 30);
});
