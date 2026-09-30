import test from "node:test";
import assert from "node:assert/strict";

import {
  AI_MANAGER_VERSION,
  AI_POLICIES,
  REFERENCE_REASONING_PATTERNS,
  analyzeScenario,
  planScenarioAdaptation,
  validateAdaptationPlan,
  applyOperations,
  createRuleWorkspace,
  forkRuleBranch,
  switchRuleBranch,
  applyAdaptationPlan,
  rollbackAdaptation,
  compileRuleWorkspace,
  createAIProvider,
  buildAIProviderRequest,
  createAIManager
} from "../src/ai-manager.js";

test("analyzes a scenario using multiple rulebook reasoning patterns", () => {
  const result = analyzeScenario(
    "Quero d20, classe de armadura, ação bônus, reação e movimento. Magias podem exigir concentração."
  );

  assert.ok(result.signals.includes("d20"));
  assert.ok(result.signals.includes("bonus_action"));
  assert.ok(result.signals.includes("reaction"));
  assert.ok(result.signals.includes("magic"));
  assert.equal(result.references[0].id, "dnd-5e-phb");
});

test("plans and applies a d20 action-economy adaptation", () => {
  const plan = planScenarioAdaptation(
    "Sistema d20. Ataques contra classe de armadura. Cada turno tem ação bônus, reação e movimento."
  );

  assert.ok(plan.operations.length > 0);
  assert.ok(plan.references.some((item) => item.id === "dnd-5e-phb"));

  const workspace = createRuleWorkspace("custom-combo");
  const applied = applyAdaptationPlan(workspace, plan);
  const compiled = applied.compiled;

  assert.equal(compiled.rules.checks.default.die, "1d20");
  assert.equal(compiled.rules.checks.attack.targetPath, "defense.armorClass");
  assert.equal(compiled.rules.actionEconomy.phases.main.slots.bonus, 1);
  assert.equal(compiled.rules.actionEconomy.phases.main.slots.reaction, 1);
  assert.equal(compiled.rules.actionEconomy.phases.main.slots.movement, 1);
  assert.equal(compiled.ui.combat.showArmorClass, true);
});

test("adapts a tactical scenario without requiring a named RPG", () => {
  const plan = planScenarioAdaptation(
    "Meu sistema próprio usa d10, perícias, múltiplas ações, armas de fogo, munição, localização de dano, blindagem e ferimentos."
  );

  const workspace = createRuleWorkspace("custom-combo");
  const result = applyAdaptationPlan(workspace, plan);

  assert.equal(result.compiled.rules.checks.default.die, "1d10");
  assert.equal(result.compiled.rules.actionEconomy.multiAction.enabled, true);
  assert.equal(result.compiled.ui.sections.skills, true);
  assert.equal(result.compiled.ui.sections.firearms, true);
  assert.equal(result.compiled.ui.sections.ammunition, true);
  assert.equal(result.compiled.ui.sections.hitLocations, true);
  assert.equal(result.compiled.ui.sections.localizedArmor, true);
  assert.equal(result.compiled.ui.sections.woundTrack, true);
  assert.ok(
    result.compiled.configurationRequired.includes("damage.hitLocation.table")
  );
});

test("creates isolated branches and switches between them", () => {
  const base = createRuleWorkspace("custom-combo");
  const forked = forkRuleBranch(base, { id: "horror", name: "Horror" });

  assert.equal(forked.activeBranchId, "horror");
  assert.equal(forked.branches.horror.parentId, "main");

  const plan = planScenarioAdaptation(
    "Sistema percentual d100, rolar abaixo, investigação e sanidade."
  );
  const adapted = applyAdaptationPlan(forked, plan, { branchId: "horror" });

  assert.equal(adapted.compiled.rules.checks.default.die, "1d100");
  assert.equal(adapted.compiled.rules.checks.default.mode, "roll_under");
  assert.equal(adapted.compiled.ui.sections.customResources, true);

  const main = compileRuleWorkspace(adapted.workspace, "main");
  assert.notEqual(main.rules.checks.default.die, "1d100");

  const switched = switchRuleBranch(adapted.workspace, "main");
  assert.equal(switched.activeBranchId, "main");
});

test("rolls back a declarative engine adaptation", () => {
  const workspace = createRuleWorkspace("custom-combo");
  const plan = validateAdaptationPlan({
    prompt: "Quero iniciativa em d10",
    operations: [
      {
        op: "set",
        path: "rules.initiative.die",
        value: "1d10",
        confidence: 1
      }
    ]
  });

  const applied = applyAdaptationPlan(workspace, plan);
  assert.equal(applied.compiled.rules.initiative.die, "1d10");

  const rolled = rollbackAdaptation(applied.workspace);
  assert.equal(rolled.compiled.rules.initiative.die, "1d20");
  assert.equal(
    rolled.workspace.branches.main.history.at(-1).kind,
    "rollback"
  );
});

test("rejects provider attempts to mutate executable or unsafe paths", () => {
  assert.throws(
    () =>
      validateAdaptationPlan({
        operations: [
          {
            op: "set",
            path: "runtime.eval",
            value: "alert(1)"
          }
        ]
      }),
    /outside the declarative engine surface/
  );

  assert.throws(
    () =>
      validateAdaptationPlan({
        operations: [
          {
            op: "set",
            path: "rules.__proto__.polluted",
            value: true
          }
        ]
      }),
    /Unsafe AI operation path/
  );
});

test("custom AI provider receives constrained engine context and returns a plan", async () => {
  let received;
  const provider = createAIProvider(async (payload) => {
    received = payload;
    return {
      summary: "Adicionar duas ações por turno",
      confidence: 0.98,
      operations: [
        {
          op: "merge",
          path: "rules.actionEconomy.phases.main",
          value: { slots: { action: 2, movement: 1 }, repeatable: false },
          reason: "Cenário pede duas ações.",
          confidence: 0.98
        },
        {
          op: "set",
          path: "rules.actionEconomy.initialPhase",
          value: "main",
          reason: "Usar a fase principal adaptada.",
          confidence: 0.98
        }
      ]
    };
  }, { id: "test-model" });

  const workspace = createRuleWorkspace("custom-combo");
  const manager = createAIManager({
    workspace,
    provider,
    policy: "assist"
  });

  const proposed = await manager.propose(
    "É um RPG próprio. Quero duas ações por turno.",
    { mergeLocal: false }
  );

  assert.equal(proposed.provider, "test-model");
  assert.equal(received.contract.version, AI_MANAGER_VERSION);
  assert.ok(received.referenceContext.references.length > 0);
  assert.ok(received.referenceContext.bookProfiles.length > 0);

  const applied = manager.apply(proposed);
  assert.equal(applied.compiled.rules.actionEconomy.initialPhase, "main");
  assert.equal(applied.compiled.rules.actionEconomy.phases.main.slots.action, 2);
});

test("autonomous manager applies validated plans while assist mode only proposes", async () => {
  const assist = createAIManager({ policy: "assist" });
  const first = await assist.adapt(
    "Use d10, perícias e armas de fogo.",
    { localOnly: true }
  );
  assert.equal(first.applied, false);

  assist.setPolicy("autonomous");
  assert.equal(assist.policy, "autonomous");

  const second = await assist.adapt(
    "Use d10, perícias e armas de fogo.",
    { localOnly: true }
  );
  assert.equal(second.applied, true);
  assert.equal(second.compiled.rules.checks.default.die, "1d10");
  assert.equal(second.compiled.ui.sections.firearms, true);
});

test("provider request never asks for executable code", () => {
  const workspace = createRuleWorkspace("dnd-5e-phb");
  const request = buildAIProviderRequest(
    "Adapte para uma campanha com duas ações e stamina.",
    workspace
  );

  assert.match(request.contract.instruction, /Never emit executable code/i);
  assert.ok(request.contract.allowedRoots.includes("rules"));
  assert.ok(REFERENCE_REASONING_PATTERNS.length >= 5);
  assert.deepEqual(AI_POLICIES, ["observe", "assist", "autonomous"]);
});

test("applyOperations supports set, merge, append_unique and unset", () => {
  const base = compileRuleWorkspace(createRuleWorkspace("custom-combo"));
  const seed = {
    id: base.id,
    name: base.name,
    family: base.family,
    rules: base.rules,
    ui: base.ui,
    interpreter: base.interpreter,
    notes: [],
    configurationRequired: []
  };

  const changed = applyOperations(seed, [
    { op: "set", path: "ui.sections.skills", value: true },
    {
      op: "merge",
      path: "rules.actionEconomy.multiAction",
      value: { enabled: true, penaltyPerExtra: -2 }
    },
    {
      op: "append_unique",
      path: "interpreter.vocabulary",
      value: ["energia", "energia"]
    },
    { op: "unset", path: "ui.combat.showComboLog" }
  ]);

  assert.equal(changed.ui.sections.skills, true);
  assert.equal(changed.rules.actionEconomy.multiAction.enabled, true);
  assert.equal(changed.rules.actionEconomy.multiAction.penaltyPerExtra, -2);
  assert.deepEqual(changed.interpreter.vocabulary, ["energia"]);
  assert.equal(changed.ui.combat.showComboLog, undefined);
});
