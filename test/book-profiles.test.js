import test from "node:test";
import assert from "node:assert/strict";

import {
  BOOK_COMPILATION_TARGETS,
  BOOK_PROFILE_IDS,
  listBookProfiles,
  getBookUsageMethods,
  compileBookProfile
} from "../src/book-profiles.js";

test("exposes supported compilation targets and book profiles", () => {
  assert.deepEqual(
    BOOK_COMPILATION_TARGETS,
    ["runtime", "rules", "ui", "assistant"]
  );
  assert.ok(BOOK_PROFILE_IDS.includes("dnd-5e-phb"));
  assert.ok(BOOK_PROFILE_IDS.includes("old-dragon-basic"));
  assert.ok(BOOK_PROFILE_IDS.includes("cyberpunk-2020-scaffold"));
  assert.ok(BOOK_PROFILE_IDS.includes("lovecraft-setting"));

  const listed = listBookProfiles();
  assert.equal(listed.length, BOOK_PROFILE_IDS.length);
});

test("compiles D&D 5e action economy and usability methods", () => {
  const runtime = compileBookProfile("dnd-5e-phb", {
    usageMethod: "combat"
  });

  assert.equal(runtime.rules.initiative.die, "1d20");
  assert.equal(runtime.rules.initiative.attribute, "DES");
  assert.equal(runtime.rules.actionEconomy.phases.main.slots.action, 1);
  assert.equal(runtime.rules.actionEconomy.phases.main.slots.movement, 1);
  assert.equal(runtime.rules.actionEconomy.phases.main.slots.bonus, 1);
  assert.equal(runtime.rules.actionEconomy.phases.main.slots.reaction, 1);
  assert.equal(runtime.activeUsage.id, "combat");
  assert.equal(runtime.source.verification, "book-backed");
  assert.equal(runtime.ui.combat.showArmorClass, true);
});

test("compiles Old Dragon declaration and per-turn initiative", () => {
  const rulesOnly = compileBookProfile("old-dragon-basic", {
    target: "rules"
  });

  assert.equal(rulesOnly.rules.initiative.die, "1d10");
  assert.equal(rulesOnly.rules.initiative.reroll, "turn");
  assert.equal(
    rulesOnly.rules.initiative.variants.spell.terms[0].value,
    10
  );
  assert.equal(
    rulesOnly.rules.actionEconomy.initialPhase,
    "declare"
  );
  assert.equal(
    rulesOnly.rules.checks.attack.targetPath,
    "defense.armorClass"
  );
});

test("keeps Cyberpunk tactical tables configurable", () => {
  const runtime = compileBookProfile("cyberpunk-2020-scaffold", {
    usageMethod: "firearms"
  });

  assert.equal(runtime.rules.checks.default.die, "1d10");
  assert.equal(runtime.rules.initiative.attribute, "REF");
  assert.equal(runtime.rules.actionEconomy.multiAction.enabled, true);
  assert.ok(runtime.configurationRequired.includes("damage.hitLocation.table"));
  assert.ok(runtime.capabilities.firearms);
  assert.equal(runtime.activeUsage.id, "firearms");
});

test("treats Lovecraft material as setting reference, not rule authority", () => {
  const assistant = compileBookProfile("lovecraft-setting", {
    target: "assistant",
    usageMethod: "setting_reference"
  });

  assert.equal(assistant.source.rulesAuthority, "none");
  assert.equal(assistant.source.verification, "setting-only");
  assert.equal(assistant.activeUsage.id, "setting_reference");
  assert.ok(assistant.interpreter.vocabulary.includes("horror cosmico"));
});

test("compiles UI-only target without runtime rules payload", () => {
  const ui = compileBookProfile("dnd-5e-phb", { target: "ui" });

  assert.ok(ui.uiSchema.sections.some((section) => section.id === "magic"));
  assert.equal("rules" in ui, false);
  assert.ok(getBookUsageMethods("dnd-5e-phb").length >= 4);
});

test("rejects invalid compilation target and usage method", () => {
  assert.throws(
    () => compileBookProfile("dnd-5e-phb", { target: "apk" }),
    /Unknown compilation target/
  );

  assert.throws(
    () => compileBookProfile("dnd-5e-phb", { usageMethod: "invalid" }),
    /Unknown usage method/
  );
});
