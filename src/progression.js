import { actorValue, createRulesProfile, getPath, number } from "./rules.js";

function flattenFeatures(source, sourceName) {
  if (!source) return [];
  if (Array.isArray(source)) {
    return source.flatMap((item) => {
      if (item?.features) return item.features.map((feature) => ({ ...feature, source: feature.source || sourceName, sourceId: item.id || null }));
      return item?.id || item?.name ? [{ ...item, source: item.source || sourceName }] : [];
    });
  }
  if (source.features) return source.features.map((feature) => ({ ...feature, source: feature.source || sourceName, sourceId: source.id || null }));
  return [];
}

export function collectFeatures(actor = {}, rules = {}) {
  const profile = createRulesProfile(rules);
  const sources = profile.progression?.featureSources || [];
  const result = [];
  for (const sourceName of sources) {
    result.push(...flattenFeatures(actor[sourceName], sourceName));
  }
  result.push(...flattenFeatures(actor.features, "features"));
  return result;
}

export function featureActiveAtLevel(feature = {}, actor = {}) {
  const level = number(actor.level, 1);
  const min = feature.level == null ? number(feature.minLevel, 1) : number(feature.level, 1);
  const max = feature.maxLevel == null ? Infinity : number(feature.maxLevel);
  return level >= min && level <= max;
}

export function activeFeatures(actor = {}, rules = {}) {
  return collectFeatures(actor, rules).filter((feature) => featureActiveAtLevel(feature, actor));
}

function requirementResult(actor, requirement) {
  const type = requirement.type || "path";
  if (type === "attribute_min") {
    const actual = actorValue(actor, "attribute", requirement.attribute);
    return { ok: actual >= number(requirement.value), actual, expected: requirement.value };
  }
  if (type === "attribute_max") {
    const actual = actorValue(actor, "attribute", requirement.attribute);
    return { ok: actual <= number(requirement.value), actual, expected: requirement.value };
  }
  if (type === "tag") {
    const tags = actor.tags || [];
    return { ok: tags.includes(requirement.value), actual: tags, expected: requirement.value };
  }
  if (type === "source") {
    const value = actor[requirement.source];
    const ids = Array.isArray(value) ? value.map((item) => item?.id ?? item) : [value?.id ?? value];
    return { ok: ids.map(String).includes(String(requirement.value)), actual: ids, expected: requirement.value };
  }
  if (type === "equipment") {
    const items = actor.equipment || [];
    const ok = items.some((item) => {
      if (requirement.category && item.category !== requirement.category) return false;
      if (requirement.tag && !(item.tags || []).includes(requirement.tag)) return false;
      return true;
    });
    return { ok, actual: items.length, expected: requirement.category || requirement.tag };
  }
  const actual = getPath(actor, requirement.path);
  const expected = requirement.value;
  const operator = requirement.operator || "eq";
  const ok = operator === "gte" ? number(actual) >= number(expected)
    : operator === "lte" ? number(actual) <= number(expected)
      : operator === "neq" ? actual !== expected
        : actual === expected;
  return { ok, actual, expected };
}

export function evaluateRequirements(actor = {}, requirements = []) {
  const details = (requirements || []).map((requirement) => ({ requirement, ...requirementResult(actor, requirement) }));
  return { ok: details.every((item) => item.ok), details };
}

export function progressionRow(table = [], level = 1) {
  const value = Math.max(1, Math.floor(number(level, 1)));
  let best = null;
  for (const row of table || []) {
    const rowLevel = number(row.level, 1);
    if (rowLevel <= value && (!best || rowLevel > number(best.level, 1))) best = row;
  }
  return best ? structuredClone(best) : null;
}

export function deriveProgression(actor = {}, progression = {}) {
  const level = number(actor.level, 1);
  const row = progressionRow(progression.table || [], level);
  const features = (progression.features || []).filter((feature) => featureActiveAtLevel(feature, actor));
  return { level, row, features };
}
