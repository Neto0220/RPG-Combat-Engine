const DICE_RE = /^([+-]?\d*)d(\d+)([+-]\d+)?$/i;

export function parseDice(expression) {
  const raw = String(expression ?? "").trim().replace(/\s+/g, "");
  if (!raw) return null;

  const match = raw.match(DICE_RE);
  if (!match) {
    const constant = Number(raw);
    return Number.isFinite(constant)
      ? { count: 0, sides: 0, modifier: constant, constant: true }
      : null;
  }

  const countRaw = match[1];
  const count =
    countRaw === "" || countRaw === "+"
      ? 1
      : countRaw === "-"
        ? -1
        : Number(countRaw);

  const sides = Number(match[2]);
  const modifier = Number(match[3] || 0);

  if (!Number.isInteger(count) || !Number.isInteger(sides) || sides < 1) {
    return null;
  }

  return { count, sides, modifier, constant: false };
}

export function rollDice(expression, rng = Math.random) {
  const parsed = parseDice(expression);
  if (!parsed) {
    throw new Error(`Invalid dice expression: ${expression}`);
  }

  if (parsed.constant) {
    return {
      expression: String(expression),
      rolls: [],
      modifier: parsed.modifier,
      total: parsed.modifier
    };
  }

  const sign = parsed.count < 0 ? -1 : 1;
  const rolls = [];
  let total = parsed.modifier;

  for (let i = 0; i < Math.abs(parsed.count); i += 1) {
    const normalized = Math.min(0.999999999, Math.max(0, Number(rng())));
    const value = (Math.floor(normalized * parsed.sides) + 1) * sign;
    rolls.push(value);
    total += value;
  }

  return {
    expression: String(expression),
    rolls,
    modifier: parsed.modifier,
    total
  };
}

export function expectedDice(expression) {
  const parsed = parseDice(expression);
  if (!parsed) return 0;
  if (parsed.constant) return parsed.modifier;

  const sign = parsed.count < 0 ? -1 : 1;
  return (
    Math.abs(parsed.count) * ((parsed.sides + 1) / 2) * sign +
    parsed.modifier
  );
}
