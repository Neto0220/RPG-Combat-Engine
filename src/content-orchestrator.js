import {
  createEntityFromText,
  inferEntityType,
  interpretMechanics
} from "./interpreter.js";
import { deepMerge, getPath, setPath } from "./rules.js";

export const NARRATIVE_ENGINE_VERSION = 1;

export const ENTITY_BLUEPRINTS = Object.freeze({
  character: {
    required: ["name", "description"],
    fields: ["name", "description", "race", "class", "subclass", "attributes", "resources", "traits", "abilities", "equipment"]
  },
  race: {
    required: ["name", "description"],
    fields: ["name", "description", "size", "movement", "languages", "resistances", "immunities", "senses", "attributeBonuses", "traits", "abilities", "mechanics"]
  },
  class: {
    required: ["name", "description"],
    fields: ["name", "description", "primaryAttributes", "resources", "traits", "abilities", "mechanics"]
  },
  subclass: {
    required: ["name", "description"],
    fields: ["name", "description", "primaryAttributes", "resources", "traits", "abilities", "mechanics"]
  },
  ability: {
    required: ["name", "description"],
    fields: ["name", "description", "type", "cost", "costResource", "dice", "attributeDamage", "requirements", "mechanics"]
  },
  weapon_ability: {
    required: ["name", "description"],
    fields: ["name", "description", "type", "cost", "costResource", "dice", "attributeDamage", "requirements", "mechanics"]
  },
  item_ability: {
    required: ["name", "description"],
    fields: ["name", "description", "type", "cost", "costResource", "dice", "attributeDamage", "requirements", "mechanics"]
  },
  weapon: {
    required: ["name", "description"],
    fields: ["name", "description", "damageDice", "attributeDamage", "traits", "abilities", "mechanics"]
  },
  item: {
    required: ["name", "description"],
    fields: ["name", "description", "traits", "abilities", "mechanics"]
  },
  equipment: {
    required: ["name", "description"],
    fields: ["name", "description", "traits", "abilities", "mechanics"]
  },
  passive: {
    required: ["name", "description"],
    fields: ["name", "description", "traits", "mechanics"]
  },
  role: {
    required: ["name", "description"],
    fields: ["name", "description", "traits", "abilities", "mechanics"]
  },
  cyberware: {
    required: ["name", "description"],
    fields: ["name", "description", "traits", "abilities", "mechanics"]
  }
});

const ATTRIBUTE_ALIASES = Object.freeze({
  FOR: ["for", "forca", "força", "strength", "str"],
  DES: ["des", "destreza", "dexterity", "dex"],
  CON: ["con", "constituicao", "constituição", "constitution"],
  INT: ["int", "inteligencia", "inteligência", "intelligence"],
  SAB: ["sab", "sabedoria", "wisdom", "wis"],
  CAR: ["car", "carisma", "charisma", "cha"],
  PER: ["per", "percepcao", "percepção", "perception"]
});

const PLACEHOLDER_NAMES = new Set([
  "nova habilidade",
  "nova arma",
  "novo equipamento",
  "novo item",
  "nova passiva",
  "meu personagem",
  "classe",
  "subclasse",
  "raca",
  "raça"
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

function compactText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanEntityName(value) {
  let name = String(value || "")
    .trim()
    .replace(/^[\"“”']+|[\"“”']+$/g, "")
    .trim();
  name = name.replace(
    /\s+(?:que|e)\s+(?=(?:custa|gasta|consome|causa|d[aá]|faz|pode|consegue|ganha|recebe|tem|possui|se\s+move|anda|voa|fala|resiste|[ée]\s+resistente|[ée]\s+imune)\b).*$/i,
    ""
  );
  name = name.replace(
    /\s+(?=(?:custa|gasta|consome|causa|d[aá]|faz|pode|ganha|recebe)\b).*$/i,
    ""
  );
  return name.trim().replace(/[,:;-]+$/, "").trim();
}

function unique(values) {
  return [...new Set((values || []).filter((value) => value != null && String(value).trim()).map((value) => String(value).trim()))];
}

function numberWord(value) {
  const map = {
    zero: 0,
    um: 1,
    uma: 1,
    dois: 2,
    duas: 2,
    tres: 3,
    "três": 3,
    quatro: 4,
    cinco: 5,
    seis: 6,
    sete: 7,
    oito: 8,
    nove: 9,
    dez: 10
  };
  const raw = String(value || "").trim().toLowerCase();
  if (/^-?\d+(?:[.,]\d+)?$/.test(raw)) return Number(raw.replace(",", "."));
  return map[raw] ?? null;
}

function attributeId(raw) {
  const n = normalize(raw);
  for (const [id, aliases] of Object.entries(ATTRIBUTE_ALIASES)) {
    if (aliases.some((alias) => normalize(alias) === n)) return id;
  }
  return null;
}

function sentenceParts(text) {
  return compactText(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function inferSpokenName(text, entityType) {
  const raw = compactText(text);
  const nouns = {
    race: "(?:ra[cç]a)",
    class: "(?:classe)",
    subclass: "(?:subclasse)",
    ability: "(?:habilidade|poder|t[eé]cnica|magia)",
    weapon_ability: "(?:habilidade|poder|t[eé]cnica)",
    item_ability: "(?:habilidade|poder|t[eé]cnica)",
    weapon: "(?:arma|espada|lan[cç]a|arco|machado|adaga|cajado)",
    item: "(?:item|amuleto|anel|artefato|objeto)",
    equipment: "(?:equipamento|armadura|escudo|manto|elmo)",
    passive: "(?:passiva|tra[cç]o)",
    role: "(?:papel|profiss[aã]o|fun[cç][aã]o)",
    cyberware: "(?:implante|cyberware)",
    character: "(?:personagem)"
  };
  const noun = nouns[entityType] || "(?:personagem|ra[cç]a|classe|subclasse|habilidade|arma|item|passiva)";

  const patterns = [
    new RegExp(noun + "\\s+(?:se\\s+chama|chama-se|chamad[oa]|vai\\s+se\\s+chamar|[ée]|eh)\\s+[\"“]?([^,.;!?\\n\"”]{2,80})", "i"),
    /\b(?:ele|ela)\s+(?:se\s+chama|vai\s+se\s+chamar|chama-se)\s+[\"“]?([^,.;!?\n\"”]{2,80})/i,
    new RegExp("(?:quero|vou)\\s+(?:criar|fazer|montar)\\s+(?:um|uma)?\\s*" + noun + ".*?\\bchamad[oa]\\s+[\"“]?([^,.;!?\\n\"”]{2,80})", "i")
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/\s+(?:que|e)\s*$/i, "");
  }
  return null;
}

function inferDescription(text) {
  const raw = compactText(text);
  if (!raw) return "";
  return raw
    .replace(/^\s*(?:eu\s+)?(?:quero|gostaria|preciso|vou)\s+(?:criar|fazer|montar)\s+(?:um|uma)?\s*/i, "")
    .trim();
}

function extractAttributeBonuses(text) {
  const out = {};
  const raw = compactText(text);
  const aliases = Object.values(ATTRIBUTE_ALIASES).flat()
    .sort((a, b) => b.length - a.length)
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const patterns = [
    new RegExp("(?:ganha|ganham|recebe|recebem|tem|t[eê]m|possui|possuem|d[aá])\\s*(?:\\+|mais\\s*)?(zero|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|\\d+(?:[.,]\\d+)?)\\s*(?:pontos?\\s*)?(?:de|em)?\\s*(" + aliases + ")", "gi"),
    new RegExp("(?:\\+|mais\\s*)(zero|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|\\d+(?:[.,]\\d+)?)\\s*(" + aliases + ")", "gi")
  ];

  for (const pattern of patterns) {
    for (const match of raw.matchAll(pattern)) {
      const value = numberWord(match[1]);
      const id = attributeId(match[2]);
      if (id && value != null) out[id] = Number(out[id] || 0) + value;
    }
  }
  return out;
}

function extractMovement(text) {
  const raw = compactText(text);
  const match = raw.match(/\b(?:deslocamento|movimento|move-se|movem-se|se move|se movem|anda|andam|caminha|caminham|voa|voam|nada|nadam)\s*(?:de|a|at[eé])?\s*(\d+(?:[.,]\d+)?)\s*(m|metros?|ft|p[eé]s?)\b/i);
  if (!match) return null;
  const mode = /voa/i.test(match[0]) ? "fly" : /nada/i.test(match[0]) ? "swim" : "walk";
  return {
    mode,
    value: Number(match[1].replace(",", ".")),
    unit: /ft|p[eé]s?/i.test(match[2]) ? "ft" : "m"
  };
}

function extractSize(text) {
  const n = normalize(text);
  if (/\bminuscul[oa]\b|\btiny\b/.test(n)) return "tiny";
  if (/\bpequen[oa]\b|\bsmall\b/.test(n)) return "small";
  if (/\bmedi[oa]\b|\bmedium\b/.test(n)) return "medium";
  if (/\bgrande\b|\blarge\b/.test(n)) return "large";
  if (/\benorme\b|\bhuge\b/.test(n)) return "huge";
  return null;
}

function extractLanguages(text) {
  const raw = compactText(text);
  const match = raw.match(/\b(?:fala|falam|conhece|conhecem|idiomas?|l[ií]nguas?)\s*(?:s[aã]o|incluem|:|,)?\s*([^.;!?\n]{2,100})/i);
  if (!match) return [];
  return unique(
    match[1]
      .replace(/\be\b/gi, ",")
      .split(/[,/]/)
      .map((value) => value.trim())
      .filter((value) => value.length >= 2 && value.length <= 32)
  ).slice(0, 8);
}

function extractTaggedPhrases(text, kind) {
  const raw = compactText(text);
  const patterns = kind === "resistance"
    ? [
        /\b(?:resistentes?|resist[eê]ncias?)\s+(?:a|ao|[àa])\s*([^.;!?\n]{2,60})/gi,
        /\breduz\s+(?:o\s+)?dano\s+de\s+([^.;!?\n]{2,60})/gi
      ]
    : [
        /\bimunes?\s+(?:a|ao|[àa])\s*([^.;!?\n]{2,60})/gi,
        /\bimunidade\s+(?:a|ao|[àa])\s*([^.;!?\n]{2,60})/gi
      ];
  const out = [];
  for (const pattern of patterns) {
    for (const match of raw.matchAll(pattern)) {
      const value = match[1]
        .replace(/\b(?:e|mas|quando|enquanto)\b.*$/i, "")
        .trim()
        .replace(/[,:]+$/, "");
      if (value) out.push(value);
    }
  }
  return unique(out).slice(0, 8);
}

function extractSenses(text) {
  const raw = compactText(text);
  const out = [];
  for (const match of raw.matchAll(/\b(vis[aã]o\s+no\s+escuro|vis[aã]o\s+noturna|sentido\s+s[ií]smico|tremorsense|vis[aã]o\s+cega|blindsight)(?:\s+(?:de|at[eé])\s*(\d+(?:[.,]\d+)?)\s*(m|metros?|ft|p[eé]s?))?/gi)) {
    out.push({
      type: normalize(match[1]).replace(/\s+/g, "_"),
      range: match[2] ? Number(match[2].replace(",", ".")) : null,
      unit: match[3] ? (/ft|p[eé]s?/i.test(match[3]) ? "ft" : "m") : null
    });
  }
  return out;
}

function extractTraits(text) {
  const parts = sentenceParts(text);
  const traitSignals = /\b(?:pode|podem|possa|possam|consegue|conseguem|consiga|consigam|possui|possuem|ganha|ganham|recebe|recebem|resistente|imune|vis[aã]o|enxerga|enxergam|enxergar|respira|respiram|respirar|voa|voam|nada|nadam|regenera|regeneram|teleporta|teleportam|transforma|transformam|vantagem|desvantagem)\b/i;
  return unique(
    parts
      .filter((part) => traitSignals.test(part))
      .map((part) => part.replace(/[.!?]+$/, "").trim())
  ).slice(0, 12);
}

function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === "string") return !value.trim();
  if (typeof value === "number") return value === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function looksPlaceholderName(value) {
  const n = normalize(value);
  return !n || PLACEHOLDER_NAMES.has(n);
}

function change(path, value, confidence, evidence, source = "local_narrative") {
  return {
    path,
    value: clone(value),
    confidence: Math.max(0, Math.min(1, Number(confidence) || 0)),
    evidence: String(evidence || ""),
    source
  };
}

function buildFacts(text) {
  return {
    attributeBonuses: extractAttributeBonuses(text),
    movement: extractMovement(text),
    size: extractSize(text),
    languages: extractLanguages(text),
    resistances: extractTaggedPhrases(text, "resistance"),
    immunities: extractTaggedPhrases(text, "immunity"),
    senses: extractSenses(text),
    traits: extractTraits(text)
  };
}

function enrichDraft(entityType, base, facts) {
  const draft = clone(base || {});
  if (Object.keys(facts.attributeBonuses).length) draft.attributeBonuses = facts.attributeBonuses;
  if (facts.movement) draft.movement = facts.movement;
  if (facts.size) draft.size = facts.size;
  if (facts.languages.length) draft.languages = facts.languages;
  if (facts.resistances.length) draft.resistances = facts.resistances;
  if (facts.immunities.length) draft.immunities = facts.immunities;
  if (facts.senses.length) draft.senses = facts.senses;
  if (facts.traits.length) draft.traits = facts.traits;

  if (["race", "class", "subclass", "role", "character"].includes(entityType)) {
    draft.abilities = Array.isArray(draft.abilities) ? draft.abilities : [];
  }
  return draft;
}

function collectDraftChanges(draft, suggestion, facts, raw, explicitName, description) {
  const changes = [];
  if (explicitName) changes.push(change("name", explicitName, 0.99, explicitName));
  if (description) changes.push(change("description", description, 0.92, raw.slice(0, 220)));

  const costMatch = (suggestion?.matches || []).find((item) => item.rule === "cost");
  if (costMatch && draft.cost != null) {
    changes.push(change("cost", draft.cost, Number(costMatch.confidence || 0.96), costMatch.text || raw));
    if (draft.costResource) changes.push(change("costResource", draft.costResource, Number(costMatch.confidence || 0.96), costMatch.text || raw));
  }
  if (Array.isArray(draft.dice) && draft.dice.length) {
    changes.push(change("dice", draft.dice, 0.96, raw));
  }
  if (Array.isArray(draft.damageDice) && draft.damageDice.length) {
    changes.push(change("damageDice", draft.damageDice, 0.96, raw));
  }
  if (Array.isArray(draft.attributeDamage) && draft.attributeDamage.length) {
    changes.push(change("attributeDamage", draft.attributeDamage, 0.9, raw));
  }
  if (draft.type) changes.push(change("type", draft.type, 0.88, raw));

  for (const match of suggestion?.matches || []) {
    const rule = String(match.rule || "");
    const confidence = Number(match.confidence || 0.85);
    if (rule === "cost") {
      if (draft.cost != null) changes.push(change("cost", draft.cost, confidence, match.text || raw));
      if (draft.costResource) changes.push(change("costResource", draft.costResource, confidence, match.text || raw));
    } else if (rule === "frequency") {
      changes.push(change("mechanics.frequency", draft.mechanics?.frequency, confidence, match.text || raw));
    } else if (rule === "timing") {
      changes.push(change("mechanics.timing", draft.mechanics?.timing, confidence, match.text || raw));
    } else if (rule.includes("damage") && (draft.dice?.length || draft.damageDice?.length)) {
      changes.push(change(draft.damageDice ? "damageDice" : "dice", draft.damageDice || draft.dice, confidence, match.text || raw));
    }
  }

  if (Object.keys(facts.attributeBonuses).length) changes.push(change("attributeBonuses", facts.attributeBonuses, 0.93, raw));
  if (facts.movement) changes.push(change("movement", facts.movement, 0.94, raw));
  if (facts.size) changes.push(change("size", facts.size, 0.88, raw));
  if (facts.languages.length) changes.push(change("languages", facts.languages, 0.88, raw));
  if (facts.resistances.length) changes.push(change("resistances", facts.resistances, 0.9, raw));
  if (facts.immunities.length) changes.push(change("immunities", facts.immunities, 0.92, raw));
  if (facts.senses.length) changes.push(change("senses", facts.senses, 0.9, raw));
  if (facts.traits.length) changes.push(change("traits", facts.traits, 0.8, raw));

  const seen = new Set();
  return changes.filter((item) => {
    if (!item.path || item.value == null) return false;
    if (seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });
}

export function validateNarrativeEntityDraft(input = {}) {
  const entityType = input.entityType || "ability";
  const blueprint = ENTITY_BLUEPRINTS[entityType] || ENTITY_BLUEPRINTS.ability;
  const draft = clone(input.draft || {});
  const errors = [];
  const warnings = [];

  if (draft.name != null && typeof draft.name !== "string") errors.push("name must be a string");
  if (draft.description != null && typeof draft.description !== "string") errors.push("description must be a string");
  if (draft.cost != null && (!Number.isFinite(Number(draft.cost)) || Number(draft.cost) < 0)) errors.push("cost must be a non-negative number");
  if (draft.movement?.value != null && !Number.isFinite(Number(draft.movement.value))) errors.push("movement.value must be numeric");

  const missing = blueprint.required.filter((path) => isEmpty(getPath(draft, path)));
  for (const path of missing) warnings.push("Campo base ainda não definido: " + path);

  return {
    valid: errors.length === 0,
    entityType,
    errors,
    warnings,
    missing,
    blueprint: clone(blueprint)
  };
}

export function synthesizeNarrativeEntity(text, options = {}) {
  const raw = compactText(text);
  const fallback = options.entityType || options.context || "ability";
  const entityType = options.entityType || inferEntityType(raw, fallback);
  const blueprint = ENTITY_BLUEPRINTS[entityType] || ENTITY_BLUEPRINTS.ability;
  const baseEntity = clone(options.baseEntity || {});
  const creation = createEntityFromText(raw, {
    ...options,
    entityType,
    context: entityType,
    baseEntity
  });

  const suggestion = creation.suggestion || interpretMechanics(raw, { context: entityType });
  const explicitName = cleanEntityName(creation.entity?.name || inferSpokenName(raw, entityType));
  const description =
    creation.entity?.description ||
    (raw ? inferDescription(raw) : "");
  const facts = buildFacts(raw);

  let draft = enrichDraft(entityType, creation.entity || baseEntity, facts);
  if (explicitName) draft.name = explicitName;
  if (description && (!draft.description || options.preferNarrativeDescription !== false)) {
    draft.description = description;
  }

  const changes = collectDraftChanges(draft, suggestion, facts, raw, explicitName, description);
  const validation = validateNarrativeEntityDraft({ entityType, draft });
  const uncertainties = [];

  if (!explicitName) uncertainties.push("O nome não foi dito de forma inequívoca.");
  if (!suggestion?.matches?.length && !facts.traits.length) {
    uncertainties.push("A narrativa contém pouca mecânica objetiva; preservei o texto como descrição.");
  }
  if (facts.traits.length && !suggestion?.matches?.length) {
    uncertainties.push("Alguns traços foram entendidos como descrição estruturada, mas não viraram fórmula de regra automaticamente.");
  }

  const signalCount =
    (explicitName ? 1 : 0) +
    (suggestion?.matches?.length || 0) +
    Object.values(facts).filter((value) => Array.isArray(value) ? value.length : value && (typeof value !== "object" || Object.keys(value).length)).length;

  const suggestionConfidence = Number(suggestion?.confidence || 0);
  const confidence = Math.max(
    0,
    Math.min(1, (suggestionConfidence * 0.6) + (explicitName ? 0.2 : 0) + (signalCount ? 0.15 : 0) + (raw.length > 20 ? 0.05 : 0))
  );

  draft.aiContent = {
    version: NARRATIVE_ENGINE_VERSION,
    source: "local_narrative",
    entityType,
    facts: clone(facts),
    confidence,
    generatedAt: new Date().toISOString()
  };

  return {
    version: NARRATIVE_ENGINE_VERSION,
    entityType,
    text: raw,
    blueprint: clone(blueprint),
    draft,
    changes,
    confidence,
    facts,
    suggestion,
    missing: validation.missing,
    uncertainties,
    warnings: [...validation.warnings, ...(suggestion?.warnings || [])],
    valid: validation.valid,
    errors: validation.errors
  };
}

function shouldReplace(path, current, synthesis, overwrite) {
  if (overwrite) return true;
  if (path === "name") {
    const explicit = synthesis.changes?.find((item) => item.path === "name" && item.confidence >= 0.95);
    return Boolean(explicit) || looksPlaceholderName(current);
  }
  if (path === "description") return isEmpty(current);
  return isEmpty(current);
}

function applyChange(target, item, synthesis, options) {
  const current = getPath(target, item.path);
  const overwrite = Boolean(options.overwrite);
  const minConfidence = Number.isFinite(Number(options.minConfidence))
    ? Number(options.minConfidence)
    : 0.68;

  if (Number(item.confidence || 0) < minConfidence) return false;
  if (!shouldReplace(item.path, current, synthesis, overwrite)) return false;
  setPath(target, item.path, clone(item.value));
  return true;
}

export function applyEntitySynthesis(entity = {}, synthesis, options = {}) {
  if (!synthesis?.draft) return clone(entity);
  const next = clone(entity);
  const applied = [];

  for (const item of synthesis.changes || []) {
    if (applyChange(next, item, synthesis, options)) applied.push(item.path);
  }

  const structuralKeys = [
    "movement",
    "size",
    "languages",
    "resistances",
    "immunities",
    "senses",
    "attributeBonuses",
    "traits",
    "abilities"
  ];

  for (const key of structuralKeys) {
    if (!(key in synthesis.draft)) continue;
    if (shouldReplace(key, next[key], synthesis, Boolean(options.overwrite))) {
      next[key] = clone(synthesis.draft[key]);
      if (!applied.includes(key)) applied.push(key);
    }
  }

  if (synthesis.draft.mechanics) {
    next.mechanics = deepMerge(next.mechanics || {}, synthesis.draft.mechanics);
    if (!applied.includes("mechanics")) applied.push("mechanics");
  }

  if (options.includeMetadata !== false) {
    next.aiContent = {
      ...(clone(synthesis.draft.aiContent || {})),
      appliedPaths: applied,
      missing: clone(synthesis.missing || []),
      uncertainties: clone(synthesis.uncertainties || [])
    };
  }

  return next;
}

export function buildEntitySynthesisProviderRequest(text, options = {}) {
  const local = options.localSynthesis || synthesizeNarrativeEntity(text, options);
  return {
    task: "synthesize_entity",
    contract: {
      version: NARRATIVE_ENGINE_VERSION,
      instruction:
        "Transform free natural-language narration into a structured RPG entity draft. Do not require label:value syntax. Do not emit executable code. Preserve uncertainty instead of inventing unsupported facts.",
      response: {
        entityType: "string",
        confidence: "0..1",
        draft: "JSON object compatible with blueprint",
        changes: [{ path: "field.path", value: "JSON value", confidence: "0..1", evidence: "source phrase" }],
        missing: ["string"],
        uncertainties: ["string"]
      }
    },
    entityType: local.entityType,
    blueprint: local.blueprint,
    currentEntity: clone(options.baseEntity || {}),
    activeProfile: clone(options.profile || null),
    narration: compactText(text),
    localSynthesis: local
  };
}

export function mergeEntitySyntheses(local, external = {}) {
  const entityType = external.entityType || local.entityType;
  const draft = deepMerge(local.draft || {}, external.draft || {});
  const externalChanges = Array.isArray(external.changes) ? external.changes : [];
  const map = new Map();

  for (const item of [...(local.changes || []), ...externalChanges]) {
    if (!item?.path) continue;
    const normalized = {
      path: String(item.path),
      value: clone(item.value),
      confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0.75)),
      evidence: String(item.evidence || ""),
      source: item.source || (externalChanges.includes(item) ? "provider" : "local_narrative")
    };
    const previous = map.get(normalized.path);
    if (!previous || normalized.confidence >= previous.confidence) map.set(normalized.path, normalized);
  }

  const validation = validateNarrativeEntityDraft({ entityType, draft });
  return {
    ...clone(local),
    ...clone(external),
    version: NARRATIVE_ENGINE_VERSION,
    entityType,
    draft,
    changes: [...map.values()],
    confidence: Math.max(Number(local.confidence || 0), Number(external.confidence || 0)),
    missing: unique([...(validation.missing || []), ...(external.missing || [])]),
    uncertainties: unique([...(local.uncertainties || []), ...(external.uncertainties || [])]),
    warnings: unique([...(local.warnings || []), ...(external.warnings || []), ...(validation.warnings || [])]),
    valid: validation.valid,
    errors: validation.errors
  };
}
