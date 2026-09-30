import { compileSystemProfile, createSystemProfile } from "./profiles.js";
import {
  BOOK_PROFILE_IDS,
  compileBookProfile,
  listBookProfiles
} from "./book-profiles.js";
import { createEntityFromText, interpretMechanics } from "./interpreter.js";
import { deepMerge, setPath } from "./rules.js";
import { evaluateScenarioAgainstCorpus, listDesignBenchmarks } from "./design-corpus.js";

export const AI_MANAGER_VERSION = 1;

export const AI_POLICIES = Object.freeze([
  "observe",
  "assist",
  "autonomous"
]);

export const AI_OPERATION_TYPES = Object.freeze([
  "set",
  "merge",
  "unset",
  "append_unique"
]);

const ALLOWED_ROOTS = new Set([
  "id",
  "name",
  "family",
  "rules",
  "ui",
  "interpreter",
  "notes",
  "configurationRequired"
]);

const DANGEROUS_PATH_PARTS = new Set([
  "__proto__",
  "prototype",
  "constructor"
]);

export const REFERENCE_REASONING_PATTERNS = Object.freeze([
  {
    id: "custom-combo",
    kind: "system_profile",
    label: "Combo customizável",
    profileId: "custom-combo",
    signals: [
      "combo",
      "ataque e magia",
      "ataque mais magia",
      "duas ações",
      "segunda ação",
      "mana",
      "ataques extras",
      "stacks"
    ],
    lessons: [
      "separar ataque normal de ações especiais",
      "controlar custos e frequências por habilidade",
      "permitir ações encadeadas sem acoplar nomes específicos"
    ]
  },
  {
    id: "dnd-5e-phb",
    kind: "book_profile",
    label: "D&D 5e - Livro do Jogador",
    profileId: "dnd-5e-phb",
    signals: [
      "d20",
      "classe de armadura",
      "ação bônus",
      "acao bonus",
      "reação",
      "reacao",
      "teste de resistência",
      "teste de resistencia",
      "proficiência",
      "proficiencia",
      "concentração",
      "concentracao"
    ],
    lessons: [
      "economia de ação composta por ação, movimento, ação bônus e reação",
      "testes d20 contra dificuldade ou classe de armadura",
      "recursos e restrições podem ser habilitados por características"
    ]
  },
  {
    id: "old-dragon-basic",
    kind: "book_profile",
    label: "Old Dragon - Livro Básico",
    profileId: "old-dragon-basic",
    signals: [
      "declaração de turno",
      "declaracao de turno",
      "iniciativa da arma",
      "iniciativa por ação",
      "iniciativa por acao",
      "jogada de proteção",
      "jogada de protecao",
      "círculo da magia",
      "circulo da magia",
      "old school"
    ],
    lessons: [
      "declarar a intenção antes de resolver a ordem",
      "permitir iniciativa dependente do tipo de ação",
      "rerrolar iniciativa quando o sistema exigir"
    ]
  },
  {
    id: "d10-skill-modern",
    kind: "system_profile",
    label: "Família d10 tática",
    profileId: "d10-skill-modern",
    signals: [
      "d10",
      "perícia",
      "pericia",
      "ref",
      "cadência",
      "cadencia",
      "munição",
      "municao",
      "localização de dano",
      "localizacao de dano",
      "blindagem",
      "armas de fogo",
      "cyberware"
    ],
    lessons: [
      "combinar atributo e perícia",
      "permitir múltiplas ações com penalidade",
      "separar localização, blindagem, munição e ferimentos"
    ]
  },
  {
    id: "lovecraft-setting",
    kind: "book_profile",
    label: "Lovecraft - referência de ambientação",
    profileId: "lovecraft-setting",
    signals: [
      "horror cósmico",
      "horror cosmico",
      "culto",
      "ritual",
      "investigação",
      "investigacao",
      "entidade",
      "sanidade"
    ],
    lessons: [
      "ambientação pode orientar vocabulário sem impor regras",
      "não atribuir mecânicas a uma referência literária que não é sistema"
    ]
  },
  {
    id: "custom-horror",
    kind: "system_profile",
    label: "Horror percentual genérico",
    profileId: "custom-horror",
    signals: [
      "d100",
      "percentual",
      "roll under",
      "rolar abaixo",
      "sanidade",
      "estresse",
      "corrupção",
      "corrupcao"
    ],
    lessons: [
      "testes percentuais podem usar roll-under",
      "recursos de horror devem permanecer configuráveis"
    ]
  }
]);

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function slug(text, fallback = "scenario") {
  const value = normalize(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return value || fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function profileSeed(profile) {
  const compiled = compileSystemProfile(profile, { detached: typeof profile !== "string" });
  return {
    id: compiled.id,
    name: compiled.name,
    family: compiled.family,
    rules: clone(compiled.rules),
    ui: clone(compiled.ui || {}),
    interpreter: clone(compiled.interpreter || {}),
    notes: clone(compiled.notes || []),
    configurationRequired: clone(compiled.configurationRequired || [])
  };
}

function resolveProfile(input = "custom-combo") {
  if (typeof input === "string") {
    if (BOOK_PROFILE_IDS.includes(input)) {
      return profileSeed(compileBookProfile(input));
    }
    return profileSeed(createSystemProfile(input));
  }

  if (input?.source?.kind && input?.rules) {
    return profileSeed(input);
  }

  return profileSeed(input || {});
}

function safePath(path) {
  const parts = String(path || "").split(".").filter(Boolean);
  if (!parts.length || !ALLOWED_ROOTS.has(parts[0])) {
    throw new Error("AI operation path is outside the declarative engine surface: " + path);
  }
  if (parts.some((part) => DANGEROUS_PATH_PARTS.has(part))) {
    throw new Error("Unsafe AI operation path: " + path);
  }
  return parts;
}

function deletePath(object, path) {
  const parts = safePath(path);
  let current = object;
  for (let index = 0; index < parts.length - 1; index += 1) {
    current = current?.[parts[index]];
    if (!current || typeof current !== "object") return object;
  }
  delete current[parts.at(-1)];
  return object;
}

function getPath(object, path) {
  const parts = String(path || "").split(".").filter(Boolean);
  let current = object;
  for (const part of parts) {
    if (current == null || !(part in Object(current))) return undefined;
    current = current[part];
  }
  return current;
}

function equivalent(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function appendUniqueAtPath(object, path, value) {
  safePath(path);
  const current = getPath(object, path);
  const next = Array.isArray(current) ? [...current] : [];
  const values = Array.isArray(value) ? value : [value];

  for (const item of values) {
    if (!next.some((entry) => equivalent(entry, item))) next.push(clone(item));
  }

  setPath(object, path, next);
  return object;
}

function normalizeOperation(operation = {}) {
  const op = String(operation.op || operation.type || "set");
  if (!AI_OPERATION_TYPES.includes(op)) {
    throw new Error("Unsupported AI operation: " + op);
  }

  const path = String(operation.path || "").trim();
  safePath(path);

  return {
    op,
    path,
    value: clone(operation.value),
    reason: String(operation.reason || "").trim(),
    confidence: Number.isFinite(Number(operation.confidence))
      ? Math.max(0, Math.min(1, Number(operation.confidence)))
      : 0.75,
    source: operation.source ? clone(operation.source) : null
  };
}

export function validateAdaptationPlan(plan = {}) {
  const operations = (plan.operations || []).map(normalizeOperation);
  return {
    version: AI_MANAGER_VERSION,
    id: String(plan.id || "plan-" + Date.now()),
    createdAt: plan.createdAt || nowIso(),
    prompt: String(plan.prompt || ""),
    summary: String(plan.summary || ""),
    rationale: Array.isArray(plan.rationale) ? plan.rationale.map(String) : [],
    confidence: Number.isFinite(Number(plan.confidence))
      ? Math.max(0, Math.min(1, Number(plan.confidence)))
      : operations.length
        ? operations.reduce((sum, item) => sum + item.confidence, 0) / operations.length
        : 0,
    references: Array.isArray(plan.references) ? clone(plan.references) : [],
    unresolved: Array.isArray(plan.unresolved) ? plan.unresolved.map(String) : [],
    provider: String(plan.provider || "local"),
    operations
  };
}

export function applyOperations(profile, operations = []) {
  const out = clone(profile);

  for (const raw of operations) {
    const operation = normalizeOperation(raw);

    if (operation.op === "unset") {
      deletePath(out, operation.path);
      continue;
    }

    if (operation.op === "append_unique") {
      appendUniqueAtPath(out, operation.path, operation.value);
      continue;
    }

    if (operation.op === "merge") {
      const current = getPath(out, operation.path);
      setPath(out, operation.path, deepMerge(current || {}, operation.value || {}));
      continue;
    }

    setPath(out, operation.path, clone(operation.value));
  }

  return profileSeed(out);
}

function referenceScores(text) {
  const n = normalize(text);
  const legacy = REFERENCE_REASONING_PATTERNS
    .map((pattern) => {
      const matchedSignals = pattern.signals.filter((signal) =>
        n.includes(normalize(signal))
      );
      return {
        id: pattern.id,
        kind: pattern.kind,
        label: pattern.label,
        profileId: pattern.profileId,
        score: pattern.signals.length
          ? matchedSignals.length / pattern.signals.length
          : 0,
        matchedSignals,
        lessons: clone(pattern.lessons)
      };
    })
    .filter((item) => item.matchedSignals.length);

  const benchmarks = evaluateScenarioAgainstCorpus(text, { limit: 10 }).matches.map((item) => ({
    id: item.id,
    kind: "design_benchmark",
    label: item.name,
    profileId: null,
    score: item.score,
    matchedSignals: clone(item.matchedSignals || []),
    lessons: clone(item.lessons || []),
    mechanics: clone(item.mechanics || {}),
    recognition: clone(item.recognition || [])
  }));

  const combined = new Map();
  for (const item of [...legacy, ...benchmarks]) {
    const previous = combined.get(item.id);
    if (!previous || Number(item.score || 0) > Number(previous.score || 0)) {
      combined.set(item.id, item);
    }
  }

  return [...combined.values()]
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || (b.matchedSignals?.length || 0) - (a.matchedSignals?.length || 0))
    .slice(0, 12);
}

function op(path, value, reason, confidence = 0.9, source = "scenario") {
  return {
    op: "set",
    path,
    value,
    reason,
    confidence,
    source: { kind: source }
  };
}

function mergeOp(path, value, reason, confidence = 0.9, source = "scenario") {
  return {
    op: "merge",
    path,
    value,
    reason,
    confidence,
    source: { kind: source }
  };
}

function appendOp(path, value, reason, confidence = 0.88, source = "scenario") {
  return {
    op: "append_unique",
    path,
    value,
    reason,
    confidence,
    source: { kind: source }
  };
}

function detectActionCount(normalized, operations, rationale) {
  const direct = normalized.match(/\b(\d+)\s+acoes?\s+(?:por|a cada)\s+turno\b/);
  if (direct) {
    const count = Math.max(1, Number(direct[1]));
    operations.push(
      op(
        "rules.actionEconomy.phases.main.slots.action",
        count,
        "Quantidade explícita de ações por turno.",
        0.99
      )
    );
    rationale.push("A economia de ações foi dimensionada pelo número explícito informado.");
  }

  if (/\bmultiplas acoes\b|\bmúltiplas ações\b/.test(normalized)) {
    operations.push(
      mergeOp(
        "rules.actionEconomy.multiAction",
        { enabled: true },
        "O cenário descreve múltiplas ações.",
        0.95
      )
    );
  }

  const penalty = normalized.match(/penalidade\s*(?:de\s*)?(-?\d+)\s*(?:por\s*)?(?:acao|ação)?\s*extra/);
  if (penalty) {
    operations.push(
      mergeOp(
        "rules.actionEconomy.multiAction",
        {
          enabled: true,
          penaltyPerExtra: Number(penalty[1]),
          penaltyStartsAt: 2
        },
        "Penalidade de ações extras informada explicitamente.",
        0.99
      )
    );
  }
}

function detectDiceAndChecks(normalized, operations, rationale) {
  const die = normalized.match(/\b(d20|d10|d100|d12|d8|d6)\b/);
  if (die) {
    operations.push(
      op(
        "rules.checks.default.die",
        "1" + die[1],
        "Dado-base explicitamente descrito para testes.",
        0.97
      )
    );
    rationale.push("O dado-base dos testes foi inferido diretamente do cenário.");
  }

  if (/\broll under\b|\brolar abaixo\b|\bresultado abaixo\b|\bmenor ou igual ao atributo\b/.test(normalized)) {
    operations.push(
      mergeOp(
        "rules.checks.default",
        { mode: "roll_under", comparator: "lte", modifierApplication: "target" },
        "O cenário usa resolução por rolagem abaixo do alvo.",
        0.97
      )
    );
  }

  if (/\broll over\b|\brolar acima\b|\bsuperar dificuldade\b|\bmaior ou igual\b/.test(normalized)) {
    operations.push(
      mergeOp(
        "rules.checks.default",
        { mode: "roll_over", comparator: "gte", modifierApplication: "roll" },
        "O cenário usa resolução por rolagem acima da dificuldade.",
        0.97
      )
    );
  }

  if (/classe de armadura|\bca\b/.test(normalized)) {
    operations.push(
      mergeOp(
        "rules.checks.attack",
        {
          die: "1d20",
          mode: "roll_over",
          comparator: "gte",
          targetPath: "defense.armorClass"
        },
        "Ataques são comparados com Classe de Armadura.",
        0.96,
        "reference-pattern"
      )
    );
    operations.push(
      op("ui.combat.showArmorClass", true, "Exibir Classe de Armadura na interface.", 0.94)
    );
  }
}

function detectDndActionEconomy(normalized, operations) {
  const slots = {};
  if (/acao bonus|ação bônus/.test(normalized)) slots.bonus = 1;
  if (/\breacao\b|\breação\b/.test(normalized)) slots.reaction = 1;
  if (/\bmovimento\b|\bdeslocamento\b/.test(normalized)) slots.movement = 1;
  if (Object.keys(slots).length) {
    operations.push(
      mergeOp(
        "rules.actionEconomy.phases.main.slots",
        slots,
        "O cenário cita slots separados de ação.",
        0.94,
        "reference-pattern"
      )
    );
  }
  if (slots.bonus) operations.push(op("ui.combat.showBonusAction", true, "Exibir ação bônus.", 0.92));
  if (slots.reaction) operations.push(op("ui.combat.showReaction", true, "Exibir reação.", 0.92));
  if (slots.movement) operations.push(op("ui.combat.movementSeparateFromAction", true, "Movimento separado da ação.", 0.92));
}

function detectOldSchoolFlow(normalized, operations) {
  if (/declaracao de turno|declaração de turno|declarar antes/.test(normalized)) {
    operations.push(op("rules.actionEconomy.initialPhase", "declare", "O turno deve começar por declaração.", 0.96));
    operations.push(
      mergeOp(
        "rules.actionEconomy.phases",
        {
          declare: { slots: {}, maxActions: 0, nextPhase: "main" },
          main: { slots: { action: 1, movement: 1 }, repeatable: false }
        },
        "Fluxo com declaração antes da resolução.",
        0.94,
        "reference-pattern"
      )
    );
    operations.push(op("ui.combat.declareActionBeforeInitiative", true, "A UI deve pedir declaração antes da iniciativa.", 0.94));
  }

  if (/iniciativa (?:por|pela|depende da) (?:acao|ação)|iniciativa da arma/.test(normalized)) {
    operations.push(op("ui.combat.initiativeDependsOnAction", true, "A iniciativa depende da ação declarada.", 0.95));
  }

  if (/iniciativa.*cada turno|rerrolar iniciativa.*turno|nova iniciativa.*turno/.test(normalized)) {
    operations.push(op("rules.initiative.reroll", "turn", "A iniciativa é rolada novamente por turno.", 0.98));
    operations.push(op("ui.combat.rerollInitiativeEachTurn", true, "Exibir rerrolagem de iniciativa por turno.", 0.95));
  }
}

function detectTacticalFeatures(normalized, operations) {
  const sections = {};
  if (/\bpericias?\b|\bperícias?\b/.test(normalized)) sections.skills = true;
  if (/armas de fogo|cadencia|cadência/.test(normalized)) sections.firearms = true;
  if (/municao|munição/.test(normalized)) sections.ammunition = true;
  if (/localizacao de dano|localização de dano|local de acerto/.test(normalized)) sections.hitLocations = true;
  if (/blindagem|armadura por local/.test(normalized)) sections.localizedArmor = true;
  if (/ferimentos|wound/.test(normalized)) sections.woundTrack = true;
  if (/cyberware|implante/.test(normalized)) sections.cyberware = true;
  if (/\brole\b|\bpapel\b/.test(normalized)) sections.roles = true;

  for (const [key, value] of Object.entries(sections)) {
    operations.push(op("ui.sections." + key, value, "Seção requerida pelo cenário tático.", 0.92));
  }

  if (sections.hitLocations) {
    operations.push(
      mergeOp(
        "rules.damage.hitLocation",
        { die: "1d10", table: [] },
        "O cenário usa localização de dano; a tabela permanece configurável.",
        0.9
      )
    );
    operations.push(
      appendOp(
        "configurationRequired",
        "damage.hitLocation.table",
        "Tabela de localização precisa ser preenchida para o cenário.",
        0.9
      )
    );
  }
}

function detectResourcesAndMagic(normalized, operations) {
  if (/\bmagia\b|\bfeitico\b|\bfeitiço\b|\bspell\b/.test(normalized)) {
    operations.push(op("ui.sections.magic", true, "O cenário utiliza magia.", 0.93));
  }
  if (/preparar magia|magia preparada|spell slot|espaco de magia|espaço de magia/.test(normalized)) {
    operations.push(op("ui.sections.spellPreparation", true, "O cenário usa preparação ou slots de magia.", 0.94));
  }
  if (/\bconcentracao\b|\bconcentração\b/.test(normalized)) {
    operations.push(
      appendOp(
        "interpreter.vocabulary",
        "concentracao",
        "Adicionar concentração ao vocabulário assistivo.",
        0.9
      )
    );
  }
  if (/\bsanidade\b|\bestresse\b|\bstress\b|\bcorrupcao\b|\bcorrupção\b/.test(normalized)) {
    operations.push(op("ui.sections.customResources", true, "Recursos narrativos/customizados são necessários.", 0.92));
  }
}

function detectCustomCombo(normalized, operations) {
  if (/ataque (?:e|\+|mais) magia|uma acao de ataque e uma.*magia|uma ação de ataque e uma.*magia/.test(normalized)) {
    operations.push(op("rules.actionEconomy.initialPhase", "attack", "O turno começa com ataque.", 0.97));
    operations.push(
      mergeOp(
        "rules.actionEconomy.phases",
        {
          attack: { slots: { action: 1 }, repeatable: false, nextPhase: "magic" },
          magic: { slots: { action: 1 }, repeatable: false }
        },
        "O cenário separa uma ação de ataque e uma ação de magia.",
        0.97,
        "reference-pattern"
      )
    );
    operations.push(op("ui.combat.phases", ["attack", "magic"], "Interface com duas fases de ação.", 0.95));
  }
}

function dedupeOperations(operations) {
  const map = new Map();
  for (const item of operations) {
    const key = item.op + "::" + item.path;
    if (!map.has(key)) {
      map.set(key, item);
      continue;
    }
    const previous = map.get(key);
    if (item.op === "merge") {
      map.set(key, {
        ...previous,
        value: deepMerge(previous.value || {}, item.value || {}),
        confidence: Math.max(previous.confidence || 0, item.confidence || 0),
        reason: [previous.reason, item.reason].filter(Boolean).join(" ")
      });
    } else if (item.op === "append_unique") {
      const values = [];
      for (const value of [previous.value, item.value].flat()) {
        if (!values.some((entry) => equivalent(entry, value))) values.push(value);
      }
      map.set(key, { ...item, value: values });
    } else if ((item.confidence || 0) >= (previous.confidence || 0)) {
      map.set(key, item);
    }
  }
  return [...map.values()];
}

export function analyzeScenario(text, options = {}) {
  const prompt = String(text || "").trim();
  const normalized = normalize(prompt);
  const references = referenceScores(prompt);
  const signals = [];

  if (/\bd20\b/.test(normalized)) signals.push("d20");
  if (/\bd10\b/.test(normalized)) signals.push("d10");
  if (/\bd100\b|percentual/.test(normalized)) signals.push("percentile");
  if (/acao bonus|ação bônus/.test(normalized)) signals.push("bonus_action");
  if (/\breacao\b|\breação\b/.test(normalized)) signals.push("reaction");
  if (/declaracao|declaração/.test(normalized)) signals.push("declared_turn");
  if (/armas de fogo/.test(normalized)) signals.push("firearms");
  if (/localizacao de dano|localização de dano/.test(normalized)) signals.push("hit_locations");
  if (/sanidade|estresse|corrupcao|corrupção/.test(normalized)) signals.push("horror_resource");
  if (/magia|feitico|feitiço/.test(normalized)) signals.push("magic");
  if (/ataques extras|ataque extra/.test(normalized)) signals.push("extra_attacks");

  return {
    version: AI_MANAGER_VERSION,
    prompt,
    normalized,
    signals,
    references,
    designEvaluation: evaluateScenarioAgainstCorpus(prompt, { limit: 8 }),
    baseProfileId: options.baseProfileId || null
  };
}

export function planScenarioAdaptation(text, options = {}) {
  const analysis = analyzeScenario(text, options);
  const normalized = analysis.normalized;
  const operations = [];
  const rationale = [];

  detectActionCount(normalized, operations, rationale);
  detectDiceAndChecks(normalized, operations, rationale);
  detectDndActionEconomy(normalized, operations);
  detectOldSchoolFlow(normalized, operations);
  detectTacticalFeatures(normalized, operations);
  detectResourcesAndMagic(normalized, operations);
  detectCustomCombo(normalized, operations);

  if (/iniciativa.*\bd20\b/.test(normalized)) {
    operations.push(op("rules.initiative.die", "1d20", "Dado de iniciativa explícito.", 0.99));
  } else if (/iniciativa.*\bd10\b/.test(normalized)) {
    operations.push(op("rules.initiative.die", "1d10", "Dado de iniciativa explícito.", 0.99));
  }

  if (/iniciativa.*destreza|iniciativa.*\bdes\b/.test(normalized)) {
    operations.push(op("rules.initiative.attribute", "DES", "Destreza participa da iniciativa.", 0.97));
  } else if (/iniciativa.*\bref\b|iniciativa.*reflex/.test(normalized)) {
    operations.push(op("rules.initiative.attribute", "REF", "REF participa da iniciativa.", 0.97));
  }

  const unresolved = [];
  if (/tabela|threshold|limiar/.test(normalized) && !/\d/.test(normalized)) {
    unresolved.push("Há referência a tabela/limiar sem valores suficientes para compilação automática.");
  }

  if (!operations.length) {
    unresolved.push(
      "Nenhuma regra estrutural objetiva foi encontrada. A descrição ainda pode ser usada pelo interpretador de entidades ou por um provedor de IA conectado."
    );
  }

  const deduped = dedupeOperations(operations);
  const confidence = deduped.length
    ? deduped.reduce((sum, item) => sum + (item.confidence || 0), 0) / deduped.length
    : 0;

  return validateAdaptationPlan({
    id: "local-" + Date.now(),
    prompt: analysis.prompt,
    summary: deduped.length
      ? "Adaptação declarativa do motor a partir do cenário descrito."
      : "Análise concluída sem alterações estruturais automáticas.",
    rationale,
    confidence,
    references: analysis.references.slice(0, 4),
    unresolved,
    provider: "local",
    operations: deduped
  });
}

export function createRuleWorkspace(baseProfile = "custom-combo", options = {}) {
  const seed = resolveProfile(baseProfile);
  const id = String(options.id || "workspace-" + Date.now());
  const branchId = String(options.branchId || "main");

  return {
    schemaVersion: AI_MANAGER_VERSION,
    id,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    activeBranchId: branchId,
    branches: {
      [branchId]: {
        id: branchId,
        name: String(options.branchName || "Principal"),
        parentId: null,
        createdAt: nowIso(),
        profile: seed,
        revision: 0,
        history: []
      }
    }
  };
}

function requireBranch(workspace, branchId = null) {
  const id = String(branchId || workspace.activeBranchId || "main");
  const branch = workspace.branches?.[id];
  if (!branch) throw new Error("Unknown AI workspace branch: " + id);
  return branch;
}

export function forkRuleBranch(workspace, options = {}) {
  const next = clone(workspace);
  const source = requireBranch(next, options.fromBranchId);
  const id = String(options.id || slug(options.name || "branch-" + Date.now()));

  if (next.branches[id]) {
    throw new Error("AI workspace branch already exists: " + id);
  }

  next.branches[id] = {
    id,
    name: String(options.name || id),
    parentId: source.id,
    createdAt: nowIso(),
    profile: clone(source.profile),
    revision: source.revision,
    history: clone(source.history || [])
  };
  next.activeBranchId = id;
  next.updatedAt = nowIso();
  return next;
}

export function switchRuleBranch(workspace, branchId) {
  const next = clone(workspace);
  requireBranch(next, branchId);
  next.activeBranchId = String(branchId);
  next.updatedAt = nowIso();
  return next;
}

export function applyAdaptationPlan(workspace, rawPlan, options = {}) {
  const plan = validateAdaptationPlan(rawPlan);
  const next = clone(workspace);
  const branch = requireBranch(next, options.branchId);
  const before = clone(branch.profile);
  const after = applyOperations(before, plan.operations);

  branch.revision = Number(branch.revision || 0) + 1;
  const revisionId = branch.id + "-r" + branch.revision;

  branch.profile = after;
  branch.history = [
    ...(branch.history || []),
    {
      id: revisionId,
      kind: "adaptation",
      at: nowIso(),
      prompt: plan.prompt,
      summary: plan.summary,
      confidence: plan.confidence,
      provider: plan.provider,
      references: clone(plan.references),
      unresolved: clone(plan.unresolved),
      operations: clone(plan.operations),
      before,
      after: clone(after)
    }
  ];

  next.updatedAt = nowIso();

  return {
    workspace: next,
    branchId: branch.id,
    revisionId,
    compiled: compileSystemProfile(after, { detached: true }),
    plan
  };
}

export function rollbackAdaptation(workspace, options = {}) {
  const next = clone(workspace);
  const branch = requireBranch(next, options.branchId);
  const history = branch.history || [];
  if (!history.length) throw new Error("No AI adaptation revision available for rollback.");

  let target;
  if (options.revisionId) {
    target = [...history].reverse().find((entry) => entry.id === options.revisionId);
    if (!target) throw new Error("Unknown AI revision: " + options.revisionId);
  } else {
    target = [...history].reverse().find((entry) => entry.kind === "adaptation");
    if (!target) throw new Error("No AI adaptation revision available for rollback.");
  }

  const beforeRollback = clone(branch.profile);
  branch.profile = clone(target.before);
  branch.revision = Number(branch.revision || 0) + 1;
  const revisionId = branch.id + "-r" + branch.revision;

  branch.history.push({
    id: revisionId,
    kind: "rollback",
    at: nowIso(),
    revertedRevisionId: target.id,
    before: beforeRollback,
    after: clone(branch.profile)
  });

  next.updatedAt = nowIso();

  return {
    workspace: next,
    branchId: branch.id,
    revisionId,
    compiled: compileSystemProfile(branch.profile, { detached: true })
  };
}

export function compileRuleWorkspace(workspace, branchId = null) {
  const branch = requireBranch(workspace, branchId);
  return compileSystemProfile(branch.profile, { detached: true });
}

function providerReferenceContext() {
  return {
    references: clone(REFERENCE_REASONING_PATTERNS),
    designBenchmarks: listDesignBenchmarks(),
    bookProfiles: listBookProfiles().map((item) => ({
      id: item.id,
      source: item.source,
      usageMethods: item.usageMethods
    }))
  };
}

function parseProviderResult(result) {
  if (result && typeof result === "object") return result;
  const raw = String(result || "").trim();
  if (!raw) throw new Error("AI provider returned an empty plan.");

  try {
    return JSON.parse(raw);
  } catch {}

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(raw.slice(start, end + 1));
  }

  throw new Error("AI provider did not return a JSON adaptation plan.");
}

export function createAIProvider(complete, metadata = {}) {
  if (typeof complete !== "function") {
    throw new TypeError("AI provider requires a complete(payload) function.");
  }

  return {
    id: String(metadata.id || "custom-provider"),
    name: String(metadata.name || "Custom AI Provider"),
    async propose(payload) {
      return parseProviderResult(await complete(clone(payload)));
    }
  };
}

export function buildAIProviderRequest(text, workspace, options = {}) {
  const compiled = compileRuleWorkspace(workspace, options.branchId);
  return {
    contract: {
      version: AI_MANAGER_VERSION,
      response: {
        summary: "string",
        rationale: ["string"],
        confidence: "0..1",
        references: [{ id: "reference id", reason: "string" }],
        unresolved: ["string"],
        operations: [
          {
            op: "set | merge | unset | append_unique",
            path: "declarative profile path",
            value: "JSON value",
            reason: "string",
            confidence: "0..1"
          }
        ]
      },
      allowedRoots: [...ALLOWED_ROOTS],
      instruction:
        "Adapt only the declarative RPG profile. Never emit executable code, scripts, network instructions, or prototype paths."
    },
    scenario: String(text || ""),
    activeProfile: profileSeed(compiled),
    branchId: options.branchId || workspace.activeBranchId,
    referenceContext: providerReferenceContext(),
    localAnalysis: analyzeScenario(text, { baseProfileId: compiled.id })
  };
}

export function createAIManager(options = {}) {
  let workspace = options.workspace
    ? clone(options.workspace)
    : createRuleWorkspace(options.baseProfile || "custom-combo", options.workspaceOptions || {});
  const provider = options.provider || null;
  let policy = AI_POLICIES.includes(options.policy) ? options.policy : "assist";

  const api = {
    get policy() {
      return policy;
    },

    setPolicy(nextPolicy) {
      if (!AI_POLICIES.includes(nextPolicy)) {
        throw new Error("Unknown AI policy: " + nextPolicy);
      }
      policy = nextPolicy;
      return policy;
    },

    getWorkspace() {
      return clone(workspace);
    },

    setWorkspace(nextWorkspace) {
      workspace = clone(nextWorkspace);
      return api.getWorkspace();
    },

    analyze(text, opts = {}) {
      return analyzeScenario(text, {
        ...opts,
        baseProfileId: compileRuleWorkspace(workspace, opts.branchId).id
      });
    },

    async propose(text, opts = {}) {
      const localPlan = planScenarioAdaptation(text, opts);
      if (!provider || opts.localOnly) return localPlan;

      const request = buildAIProviderRequest(text, workspace, opts);
      const external = await provider.propose(request);
      const externalPlan = validateAdaptationPlan({
        ...external,
        prompt: external.prompt || String(text || ""),
        provider: provider.id || "external"
      });

      if (opts.mergeLocal === false) return externalPlan;

      return validateAdaptationPlan({
        ...externalPlan,
        references: [
          ...(localPlan.references || []),
          ...(externalPlan.references || [])
        ],
        rationale: [
          ...(localPlan.rationale || []),
          ...(externalPlan.rationale || [])
        ],
        unresolved: [
          ...(localPlan.unresolved || []),
          ...(externalPlan.unresolved || [])
        ],
        operations: dedupeOperations([
          ...(localPlan.operations || []),
          ...(externalPlan.operations || [])
        ])
      });
    },

    apply(plan, opts = {}) {
      const result = applyAdaptationPlan(workspace, plan, opts);
      workspace = result.workspace;
      return { ...result, workspace: clone(workspace) };
    },

    async adapt(text, opts = {}) {
      const plan = await api.propose(text, opts);
      const shouldApply =
        opts.apply === true ||
        (opts.apply !== false && policy === "autonomous");

      if (!shouldApply || policy === "observe") {
        return {
          applied: false,
          plan,
          workspace: clone(workspace),
          compiled: compileRuleWorkspace(workspace, opts.branchId)
        };
      }

      const result = api.apply(plan, opts);
      return { applied: true, ...result };
    },

    fork(opts = {}) {
      workspace = forkRuleBranch(workspace, opts);
      return clone(workspace);
    },

    switchBranch(branchId) {
      workspace = switchRuleBranch(workspace, branchId);
      return clone(workspace);
    },

    rollback(opts = {}) {
      const result = rollbackAdaptation(workspace, opts);
      workspace = result.workspace;
      return { ...result, workspace: clone(workspace) };
    },

    compile(branchId = null) {
      return compileRuleWorkspace(workspace, branchId);
    },

    interpretEntity(text, opts = {}) {
      return createEntityFromText(text, opts);
    },

    interpretMechanics(text, opts = {}) {
      return interpretMechanics(text, opts);
    },

    references() {
      return [
        ...clone(REFERENCE_REASONING_PATTERNS),
        ...listDesignBenchmarks().map((entry) => ({
          id: entry.id,
          kind: "design_benchmark",
          label: entry.name,
          profileId: null,
          signals: clone(entry.signals || []),
          lessons: clone(entry.lessons || []),
          mechanics: clone(entry.mechanics || {}),
          recognition: clone(entry.recognition || [])
        }))
      ];
    },

    designBenchmarks() {
      return listDesignBenchmarks();
    }
  };

  return api;
}
