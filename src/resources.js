import { getPath, number, setPath } from "./rules.js";

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function normalizeCosts(costs) {
  if (!costs) return [];
  const list = Array.isArray(costs) ? costs : [costs];
  return list.map((cost) => {
    if (typeof cost === "number") return { type: "resource", path: "resources.mana.current", amount: cost };
    return { type: "resource", amount: 0, ...cost };
  });
}

function costPath(cost) {
  if (cost.path) return cost.path;
  if (cost.resource) return "resources." + cost.resource + ".current";
  if (cost.counter) return cost.counter;
  return null;
}

export function canPayCosts(actor = {}, costs = []) {
  const normalized = normalizeCosts(costs);
  const details = [];
  for (const cost of normalized) {
    const path = costPath(cost);
    if (cost.type === "prepared") {
      const value = number(getPath(actor, path), 0);
      const required = Math.max(1, number(cost.amount, 1));
      details.push({ ...cost, path, available: value, required, ok: value >= required });
      continue;
    }
    if (cost.type === "boolean") {
      const available = Boolean(getPath(actor, path));
      details.push({ ...cost, path, available, required: true, ok: available });
      continue;
    }
    const available = number(getPath(actor, path), 0);
    const required = Math.max(0, number(cost.amount));
    details.push({ ...cost, path, available, required, ok: available >= required });
  }
  return { ok: details.every((item) => item.ok), details };
}

export function payCosts(actor = {}, costs = []) {
  const check = canPayCosts(actor, costs);
  if (!check.ok) return { ok: false, actor: clone(actor), spent: [], details: check.details };
  const next = clone(actor);
  const spent = [];
  for (const item of check.details) {
    if (item.type === "boolean") {
      if (item.consume !== false) setPath(next, item.path, false);
      spent.push({ ...item, amount: item.consume === false ? 0 : 1 });
      continue;
    }
    const amount = item.required;
    if (item.consume !== false) setPath(next, item.path, item.available - amount);
    spent.push({ ...item, amount: item.consume === false ? 0 : amount });
  }
  return { ok: true, actor: next, spent, details: check.details };
}

export function resetCounters(actor = {}, resets = []) {
  const next = clone(actor);
  for (const reset of resets || []) {
    const path = reset.path;
    if (!path) continue;
    const current = number(getPath(next, path));
    const max = reset.maxPath ? number(getPath(next, reset.maxPath), current) : number(reset.value, current);
    setPath(next, path, max);
  }
  return next;
}
