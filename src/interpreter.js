export const MECHANICS_KB_VERSION = 1;

export const MECHANICS_KB = Object.freeze({
  attributes: [
    { id: "FOR", aliases: ["for", "forca", "força", "strength", "str"] },
    { id: "DES", aliases: ["des", "destreza", "dexterity", "dex"] },
    { id: "CON", aliases: ["con", "constituicao", "constituição", "constitution"] },
    { id: "INT", aliases: ["int", "inteligencia", "inteligência", "intelligence"] },
    { id: "SAB", aliases: ["sab", "sabedoria", "wisdom", "wis"] },
    { id: "CAR", aliases: ["car", "carisma", "charisma", "cha"] }
  ],
  resources: [
    { id: "mana", aliases: ["mana", "mp"] },
    { id: "life", aliases: ["vida", "pv", "hp", "life"] },
    { id: "defense", aliases: ["defesa", "def", "defense"] },
    { id: "stamina", aliases: ["stamina", "vigor", "energia", "energy"] }
  ],
  timings: [
    { id: "reaction", aliases: ["reacao", "reação", "reaction", "quando for atacado", "ao ser atacado", "ao sofrer dano"] },
    { id: "start_turn", aliases: ["inicio do turno", "início do turno", "no começo do turno", "start of turn"] },
    { id: "magic_action", aliases: ["magia", "feitico", "feitiço", "spell", "acao magica", "ação mágica", "tecnica magica", "técnica mágica"] },
    { id: "passive", aliases: ["passiva", "passivo", "sempre ativo", "sempre ativa", "enquanto equipado", "while equipped"] }
  ],
  frequencies: [
    { id: "once_turn", aliases: ["1x por turno", "1 vez por turno", "uma vez por turno", "once per turn"] },
    { id: "once_round", aliases: ["1x por rodada", "1 vez por rodada", "uma vez por rodada", "once per round"] },
    { id: "once_combat", aliases: ["1x por combate", "1 vez por combate", "uma vez por combate", "1x por luta", "uma vez por luta", "once per combat"] },
    { id: "unlimited", aliases: ["sem limite", "quantas vezes quiser", "reutilizavel", "reutilizável", "livre", "unlimited"] }
  ]
});

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[×x]\s*(?=\d)/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

function number(value, fallback = 0) {
  const result = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(result) ? result : fallback;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function pushMatch(result, rule, value, confidence = 0.85, text = "") {
  result.matches.push({ rule, value, confidence, text });
}

function attributeId(text) {
  const n = normalize(text);
  for (const entry of MECHANICS_KB.attributes) {
    if (entry.aliases.some((alias) => n === normalize(alias))) return entry.id;
  }
  return null;
}

function resourceId(text) {
  const n = normalize(text);
  for (const entry of MECHANICS_KB.resources) {
    if (entry.aliases.some((alias) => n === normalize(alias))) return entry.id;
  }
  return n || "mana";
}

function contextDefaults(context) {
  const c = String(context || "ability");
  if (c === "item_ability" || c === "weapon_ability") {
    return {
      enabled: true,
      timing: "weapon_action",
      duration: "instant",
      frequency: "unlimited",
      attributeScope: "linked_weapon",
      statusPerHit: false
    };
  }
  if (["item", "equipment", "class", "subclass", "race", "passive"].includes(c)) {
    return {
      enabled: true,
      timing: "passive",
      duration: "combat",
      frequency: "unlimited",
      statusPerHit: true
    };
  }
  return {
    enabled: true,
    timing: "on_use",
    duration: "sequence",
    frequency: "unlimited",
    statusPerHit: true
  };
}

function detectAlias(text, table) {
  const n = normalize(text);
  let best = null;
  for (const entry of table) {
    for (const alias of entry.aliases) {
      const a = normalize(alias);
      if (a && n.includes(a) && (!best || a.length > best.alias.length)) {
        best = { id: entry.id, alias: a };
      }
    }
  }
  return best;
}

function findDice(text) {
  return [...String(text || "").matchAll(/\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/gi)]
    .map((match) => match[1].replace(/\s+/g, ""));
}

function nonDefaultMechanics(mechanics) {
  return Object.entries(mechanics).some(([key, value]) => {
    if (key === "enabled") return Boolean(value);
    if (["duration", "frequency", "timing", "attributeScope", "targetStatusMode"].includes(key)) return Boolean(value);
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0 && value !== 1;
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  });
}

export function interpretMechanics(text, options = {}) {
  const raw = String(text || "").trim();
  const normalized = normalize(raw);
  const context = options.context || "ability";
  const result = {
    version: MECHANICS_KB_VERSION,
    context,
    text: raw,
    confidence: 0,
    fields: {},
    mechanics: contextDefaults(context),
    requirements: [],
    tags: [],
    matches: [],
    warnings: []
  };

  if (!normalized) {
    result.mechanics.enabled = false;
    result.warnings.push("Descrição vazia.");
    return result;
  }

  const frequency = detectAlias(normalized, MECHANICS_KB.frequencies);
  if (frequency) {
    result.mechanics.frequency = frequency.id;
    pushMatch(result, "frequency", frequency.id, 0.98, frequency.alias);
  }

  const timing = detectAlias(normalized, MECHANICS_KB.timings);
  if (timing) {
    result.mechanics.timing = timing.id;
    if (timing.id === "magic_action") {
      result.mechanics.magicActionEligible = true;
      result.mechanics.duration = "instant";
      result.mechanics.statusPerHit = false;
    }
    if (timing.id === "reaction") result.mechanics.duration = "instant";
    pushMatch(result, "timing", timing.id, 0.95, timing.alias);
  }

  const costRegex = /\b(?:custa|gasta|consome|usar custa|costs?)\s*(\d+(?:[.,]\d+)?)\s*(mana|mp|vida|pv|hp|life|defesa|def|defense|stamina|vigor|energia|energy)\b/gi;
  for (const match of raw.matchAll(costRegex)) {
    const amount = number(match[1]);
    const resource = resourceId(match[2]);
    if (resource === "defense") result.fields.defenseCost = amount;
    else {
      result.fields.cost = amount;
      result.fields.costResource = resource === "life" ? "life" : resource;
    }
    pushMatch(result, "cost", { resource, amount }, 0.99, match[0]);
  }

  if (/\b(?:sem custo|gratuit[oa]|gratis|grátis|free)\b/i.test(raw)) {
    result.fields.cost = 0;
    pushMatch(result, "cost", { resource: "mana", amount: 0 }, 0.96, "sem custo");
  }

  const convert = raw.match(/\b(?:recupera|recebe|restaura|ganha)\s*(\d+(?:[.,]\d+)?)\s*(mana|vida|pv|hp|life)\b/i);
  if (convert && !/\bdano\b/i.test(convert[0])) {
    result.fields.convertAmount = number(convert[1]);
    result.fields.convertResource = resourceId(convert[2]) === "life" ? "life" : "mana";
    pushMatch(result, "resource_gain", { resource: result.fields.convertResource, amount: result.fields.convertAmount }, 0.86, convert[0]);
  }

  if (/\b(?:outra habilidade|proxima habilidade|próxima habilidade).{0,30}(?:sem custo|gratis|grátis)\b/i.test(raw)) {
    result.fields.coversOtherCost = true;
    pushMatch(result, "covers_other_cost", true, 0.93);
  }

  const every = raw.match(/\ba cada\s+(\d+)\s+ataques?.{0,35}?(?:gera|ganha|faz|realiza|adiciona)\s+(\d+)\s+ataques?\s+extras?\b/i);
  if (every) {
    result.mechanics.attackEvery = Math.max(1, number(every[1], 1));
    result.mechanics.attackGrant = Math.max(1, number(every[2], 1));
    result.mechanics.timing = "on_use";
    result.mechanics.duration = "sequence";
    pushMatch(result, "generated_attacks", { every: result.mechanics.attackEvery, grant: result.mechanics.attackGrant }, 0.99, every[0]);
  }

  const extras = raw.match(/\b(?:ganha|gera|faz|realiza|adiciona|recebe)\s*\+?\s*(\d+)\s+ataques?\s+extras?\b/i)
    || raw.match(/\+\s*(\d+)\s+ataques?\b/i);
  if (extras && !every) {
    result.mechanics.extraAttacks = Math.max(0, number(extras[1]));
    if (result.mechanics.timing === "passive") result.mechanics.duration = "combat";
    else {
      result.mechanics.timing = "on_use";
      result.mechanics.duration = "sequence";
    }
    pushMatch(result, "extra_attacks", result.mechanics.extraAttacks, 0.97, extras[0]);
  }

  if (/\b(?:recursiv|inclusive os ataques gerados|ataques gerados tambem|ataques gerados também)\b/i.test(raw)) {
    result.mechanics.recursiveAttacks = true;
    pushMatch(result, "recursive_attacks", true, 0.95);
  }

  const guaranteed = raw.match(/\b(\d+)\s+ataques?\s+(?:garantidos?|automaticos?|automáticos?)\b/i);
  if (guaranteed || /\bsem teste de defesa\b/i.test(raw)) {
    result.mechanics.guaranteedAttacks = guaranteed ? number(guaranteed[1], 1) : 1;
    pushMatch(result, "guaranteed_attacks", result.mechanics.guaranteedAttacks, guaranteed ? 0.96 : 0.78);
  }

  if (/\b(?:duas armas|ambidestro|ambidestria|dual wield|alternando as armas)\b/i.test(raw)) {
    result.mechanics.dualWield = true;
    pushMatch(result, "dual_wield", true, 0.92);
  }

  if (/\barma\s+(?:principal|primaria|primária)\b/i.test(raw)) {
    result.mechanics.conditionWeaponRole = "primary";
    pushMatch(result, "weapon_role", "primary", 0.96);
  } else if (/\barma\s+secundaria\b/i.test(normalized)) {
    result.mechanics.conditionWeaponRole = "secondary";
    pushMatch(result, "weapon_role", "secondary", 0.96);
  }

  const statusRequirement = raw.match(/\b(?:requer|precisa|necessita|somente se|apenas se).{0,45}?(\d+)\s+(?:stacks?|cargas?)\s+de\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ _-]{1,32})/i);
  if (statusRequirement) {
    result.mechanics.requiredStatusMin = number(statusRequirement[1], 1);
    result.mechanics.requiredStatusName = statusRequirement[2].trim().replace(/[.,;:]$/, "");
    pushMatch(result, "required_status", { name: result.mechanics.requiredStatusName, min: result.mechanics.requiredStatusMin }, 0.94, statusRequirement[0]);
  }

  const condition = raw.match(/\b(?:requer|precisa|necessita|somente se|apenas se)\s+([^.;\n]+)/i);
  if (condition) {
    result.mechanics.conditionText = condition[0].trim();
    result.requirements.push(condition[0].trim());
    pushMatch(result, "condition", result.mechanics.conditionText, 0.82, condition[0]);
  }

  const multAttr = raw.match(/\b(?:dobro|triplo)\s+(?:da|de)\s+(forca|força|destreza|constituicao|constituição|inteligencia|inteligência|sabedoria|carisma)\b/i)
    || raw.match(/\b(\d+(?:[.,]\d+)?)\s*x\s*(for|forca|força|des|destreza|con|constituicao|constituição|int|inteligencia|inteligência|sab|sabedoria|car|carisma)\b/i);
  if (multAttr) {
    let factor;
    let attrRaw;
    if (/^dobro/i.test(multAttr[0])) {
      factor = 2;
      attrRaw = multAttr[1];
    } else if (/^triplo/i.test(multAttr[0])) {
      factor = 3;
      attrRaw = multAttr[1];
    } else {
      factor = number(multAttr[1], 1);
      attrRaw = multAttr[2];
    }
    const id = attributeId(attrRaw);
    if (id) {
      result.mechanics.attributeName = id;
      result.mechanics.attributeMode = "multiply";
      result.mechanics.attributeValue = factor;
      result.mechanics.attributeScope = context.includes("weapon") || context === "item_ability" ? "linked_weapon" : "global";
      result.fields.attributeBuffs = [{ attribute: id, mode: "multiply", value: factor }];
      pushMatch(result, "attribute_multiplier", { attribute: id, value: factor }, 0.98, multAttr[0]);
    }
  }

  const addAttr = raw.match(/\+\s*(\d+(?:[.,]\d+)?)\s*(for|forca|força|des|destreza|con|constituicao|constituição|int|inteligencia|inteligência|sab|sabedoria|car|carisma)\b/i);
  if (addAttr) {
    const id = attributeId(addAttr[2]);
    if (id) {
      result.mechanics.attributeName = id;
      result.mechanics.attributeMode = "add";
      result.mechanics.attributeValue = number(addAttr[1]);
      result.mechanics.attributeScope = context.includes("weapon") || context === "item_ability" ? "linked_weapon" : "global";
      result.fields.attributeBuffs = [{ attribute: id, mode: "add", value: result.mechanics.attributeValue }];
      pushMatch(result, "attribute_bonus", { attribute: id, value: result.mechanics.attributeValue }, 0.95, addAttr[0]);
    }
  }

  const defense = raw.match(/(?:\+\s*(\d+)\s*(?:de\s*)?defesa|defesa\s*\+\s*(\d+))/i);
  if (defense) {
    const value = number(defense[1] || defense[2]);
    result.fields.defenseBonus = value;
    result.mechanics.defenseBonus = value;
    pushMatch(result, "defense_bonus", value, 0.95, defense[0]);
  }

  const reductionDice = raw.match(/\b(?:reduz|reducao de dano|redução de dano|rd)\s*(?:em|de|:)?\s*(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/i);
  if (reductionDice) {
    result.mechanics.damageReductionDice = reductionDice[1].replace(/\s+/g, "");
    result.fields.damageReductionDice = result.mechanics.damageReductionDice;
    pushMatch(result, "damage_reduction_dice", result.mechanics.damageReductionDice, 0.96, reductionDice[0]);
  } else {
    const reduction = raw.match(/\b(?:reduz|reducao de dano|redução de dano|rd)\s*(?:em|de|:)?\s*(\d+)\s*(?:de\s*)?dano?\b/i)
      || raw.match(/\b(?:rd)\s*\+?\s*(\d+)\b/i);
    if (reduction) {
      result.mechanics.damageReduction = number(reduction[1]);
      result.fields.damageReduction = result.mechanics.damageReduction;
      pushMatch(result, "damage_reduction", result.mechanics.damageReduction, 0.95, reduction[0]);
    }
  }

  const negate = raw.match(/\bnega\s+(\d+)\s+ataques?\b/i);
  if (negate) {
    result.mechanics.timing = "reaction";
    result.mechanics.negateAttacks = number(negate[1]);
    pushMatch(result, "negate_attacks", result.mechanics.negateAttacks, 0.97, negate[0]);
  }

  const counter = raw.match(/\b(?:contra[- ]?ataca|realiza contra[- ]?ataque)\s*(\d+)?\s*(?:vezes?|x)?/i);
  if (counter) {
    result.mechanics.timing = "reaction";
    result.mechanics.reactionAttacks = Math.max(1, number(counter[1], 1));
    pushMatch(result, "reaction_attacks", result.mechanics.reactionAttacks, 0.93, counter[0]);
  }

  const status = raw.match(/\b(?:aplica|adiciona|gera|recebe)\s+(\d+d\d+(?:\s*[+-]\s*\d+)?|\d+)\s+(?:stacks?|cargas?)\s+de\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ _-]{1,32})/i);
  if (status) {
    const amount = status[1].replace(/\s+/g, "");
    const name = status[2].trim().replace(/[.,;:]$/, "");
    result.mechanics.targetStatusName = name;
    if (/d/i.test(amount)) result.mechanics.targetStatusDie = amount;
    else result.mechanics.targetStatusFixed = number(amount);
    result.mechanics.targetStatusMode = /\b(?:mantem o maior|mantém o maior|maximo|máximo)\b/i.test(raw) ? "max" : "add";
    result.mechanics.statusPerHit = /\b(?:por acerto|a cada acerto|em cada ataque acertado)\b/i.test(raw);
    pushMatch(result, "target_status", { name, amount }, 0.98, status[0]);
  }

  const statusEvery = raw.match(/\ba cada\s+(\d+)\s+(?:stacks?|cargas?)\s+(?:de\s+)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ _-]{1,24}).{0,35}?(?:causa|da|dá)\s+(\d+)\s+dano\b/i);
  if (statusEvery) {
    result.mechanics.statusName = statusEvery[2].trim();
    result.mechanics.statusEvery = number(statusEvery[1]);
    result.mechanics.statusDamage = number(statusEvery[3]);
    pushMatch(result, "status_threshold_damage", { name: result.mechanics.statusName, every: result.mechanics.statusEvery, damage: result.mechanics.statusDamage }, 0.96, statusEvery[0]);
  }

  const dice = findDice(raw);
  const damageDiceMatches = [...raw.matchAll(/\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*(?:de\s*)?(?:dano|damage)\b/gi)]
    .map((match) => match[1].replace(/\s+/g, ""));

  if (damageDiceMatches.length) {
    const expression = damageDiceMatches[0];
    const actionLike = ["magic_action", "weapon_action"].includes(result.mechanics.timing)
      || ["item_ability", "weapon_ability"].includes(context);
    if (actionLike) {
      result.fields.dice = unique([...(result.fields.dice || []).map((item) => item.expression || item), expression])
        .map((value) => ({ expression: value, label: "Dano" }));
    } else {
      result.mechanics.bonusDamageDice = expression;
    }
    pushMatch(result, "damage_dice", expression, 0.97, expression);
  } else if (dice.length && ["magic_action", "weapon_action"].includes(result.mechanics.timing)) {
    result.fields.dice = [{ expression: dice[0], label: "Resultado" }];
    pushMatch(result, "generic_dice", dice[0], 0.67, dice[0]);
  }

  const flatDamage = raw.match(/\b(?:dano|damage)\s*(?:extra|adicional)?\s*\+\s*(\d+)\b/i)
    || raw.match(/\+\s*(\d+)\s+(?:de\s*)?dano\b/i);
  if (flatDamage) {
    result.mechanics.bonusDamageFlat = number(flatDamage[1]);
    pushMatch(result, "bonus_damage_flat", result.mechanics.bonusDamageFlat, 0.91, flatDamage[0]);
  }

  const damageMult = raw.match(/\b(?:dano|damage)\s*(?:x|×)\s*(\d+(?:[.,]\d+)?)\b/i)
    || raw.match(/\b(\d+(?:[.,]\d+)?)\s*(?:x|×)\s*(?:o\s+)?dano\b/i);
  if (damageMult) {
    result.mechanics.damageMultiplier = number(damageMult[1], 1);
    pushMatch(result, "damage_multiplier", result.mechanics.damageMultiplier, 0.94, damageMult[0]);
  }

  const durationTurns = raw.match(/\bpor\s+(\d+)\s+(?:turnos?|rodadas?|rounds?)\b/i);
  if (durationTurns) {
    result.mechanics.effectDuration = number(durationTurns[1]);
    result.mechanics.effectDurationUnit = /rodad|round/i.test(durationTurns[0]) ? "round" : "turn";
    pushMatch(result, "duration", { value: result.mechanics.effectDuration, unit: result.mechanics.effectDurationUnit }, 0.88, durationTurns[0]);
  } else if (/\bate o fim do turno|até o fim do turno|durante este turno\b/i.test(normalized)) {
    result.mechanics.duration = "turn";
    pushMatch(result, "duration", "turn", 0.94);
  }

  if (result.mechanics.timing === "reaction") {
    result.mechanics.duration = "instant";
    result.mechanics.magicActionEligible = false;
  }

  if (result.mechanics.timing === "magic_action") {
    result.mechanics.magicActionEligible = true;
    result.mechanics.magicActionLabel = /\btecnica|técnica\b/i.test(raw) ? "Técnica" : "Magia";
    result.mechanics.actionLabel = result.mechanics.magicActionLabel;
  }

  if (["item_ability", "weapon_ability"].includes(context) && result.mechanics.timing === "on_use") {
    result.mechanics.timing = "weapon_action";
    result.mechanics.duration = "instant";
    result.mechanics.statusPerHit = false;
  }

  if (["item", "equipment", "class", "subclass", "race", "passive"].includes(context)
      && !timing
      && (result.mechanics.extraAttacks || result.mechanics.attributeName || result.mechanics.defenseBonus || result.mechanics.damageReduction)) {
    result.mechanics.timing = "passive";
  }

  const meaningfulMatches = result.matches.length;
  if (!meaningfulMatches) {
    result.mechanics.enabled = false;
    result.warnings.push("Não encontrei uma mecânica objetiva. A descrição foi preservada, mas nenhum campo foi preenchido.");
  }

  const score = result.matches.reduce((sum, match) => sum + match.confidence, 0);
  result.confidence = meaningfulMatches ? Math.min(0.99, score / meaningfulMatches) : 0;

  if (result.confidence < 0.72 && meaningfulMatches) {
    result.warnings.push("Interpretação de baixa confiança; revise os campos sugeridos.");
  }

  result.tags = unique([
    result.mechanics.timing,
    result.mechanics.frequency,
    result.mechanics.magicActionEligible ? "magic" : null,
    result.mechanics.timing === "reaction" ? "reaction" : null,
    result.mechanics.extraAttacks || result.mechanics.attackGrant ? "extra_attacks" : null,
    result.mechanics.targetStatusName ? "status" : null
  ]);

  return result;
}

const MECHANIC_DEFAULTS = Object.freeze({
  enabled: false,
  timing: "on_use",
  duration: "turn",
  frequency: "unlimited",
  extraAttacks: 0,
  attackEvery: 0,
  attackGrant: 0,
  recursiveAttacks: true,
  extraWeaponMode: "highest",
  dualWield: false,
  bonusDamageDice: "",
  bonusDamageFlat: 0,
  damageMultiplier: 1,
  guaranteedAttacks: 0,
  reactionAttacks: 0,
  negateAttacks: 0,
  defenseBonus: 0,
  damageReduction: 0,
  damageReductionDice: "",
  attributeName: "",
  attributeMode: "add",
  attributeValue: 0,
  attributeScope: "global",
  conditionWeaponRole: "any",
  requiredStatusName: "",
  requiredStatusMin: 0,
  statusName: "",
  statusFixed: 0,
  statusDie: "",
  statusPerHit: true,
  statusEvery: 0,
  statusDamage: 0,
  actionLabel: "",
  conditionText: "",
  effectText: "",
  targetStatusName: "",
  targetStatusFixed: 0,
  targetStatusDie: "",
  targetStatusMode: "add",
  magicActionEligible: false,
  magicActionLabel: ""
});

function emptyLike(value) {
  if (value == null || value === "") return true;
  if (value === false) return true;
  if (typeof value === "number") return value === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function mechanicIsDefault(key, value) {
  if (!(key in MECHANIC_DEFAULTS)) return emptyLike(value);
  return JSON.stringify(value) === JSON.stringify(MECHANIC_DEFAULTS[key]);
}

export function applyMechanicsSuggestion(entity = {}, suggestion, options = {}) {
  if (!suggestion) return structuredClone(entity);
  const overwrite = Boolean(options.overwrite);
  const next = structuredClone(entity);
  const existingMechanics = next.mechanics || {};
  next.mechanics = { ...existingMechanics };

  for (const [key, value] of Object.entries(suggestion.mechanics || {})) {
    if (overwrite || mechanicIsDefault(key, existingMechanics[key])) next.mechanics[key] = structuredClone(value);
  }

  for (const [key, value] of Object.entries(suggestion.fields || {})) {
    const canReplaceResourceDefault = key === "costResource" && (next.cost == null || number(next.cost) === 0);
    if (overwrite || emptyLike(next[key]) || canReplaceResourceDefault) next[key] = structuredClone(value);
  }

  next.mechanicsInterpretation = {
    version: suggestion.version,
    confidence: suggestion.confidence,
    matches: suggestion.matches.map(({ rule, value }) => ({ rule, value }))
  };
  return next;
}

export function explainMechanicsSuggestion(suggestion) {
  if (!suggestion) return [];
  return suggestion.matches.map((match) => {
    const value = typeof match.value === "object" ? JSON.stringify(match.value) : String(match.value);
    return match.rule + ": " + value;
  });
}


if (typeof window !== "undefined") {
  window.RPGMechanicsAI = Object.freeze({
    version: MECHANICS_KB_VERSION,
    knowledgeBase: MECHANICS_KB,
    interpretMechanics,
    applyMechanicsSuggestion,
    explainMechanicsSuggestion
  });
}
