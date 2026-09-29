import { createRulesProfile, number } from "./rules.js";

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function phaseOf(profile, id) {
  return profile.actionEconomy?.phases?.[id] || null;
}

export function createTurnState({ rules = {}, turn = 1, phase = null, used = {} } = {}) {
  const profile = createRulesProfile(rules);
  const initialPhase = phase || profile.actionEconomy.initialPhase;
  return {
    turn: Math.max(1, Math.floor(number(turn, 1))),
    phase: initialPhase,
    actionCount: 0,
    usedSlots: {},
    usedTurn: [...(used.turn || [])],
    usedRound: [...(used.round || [])],
    usedCombat: [...(used.combat || [])],
    history: []
  };
}

export function actionPenalty({ rules = {}, state }) {
  const profile = createRulesProfile(rules);
  const multi = profile.actionEconomy.multiAction || {};
  if (!multi.enabled) return 0;
  const nextActionNumber = number(state?.actionCount) + 1;
  const startsAt = Math.max(1, Math.floor(number(multi.penaltyStartsAt, 2)));
  if (nextActionNumber < startsAt) return 0;
  const steps = nextActionNumber - startsAt + 1;
  return steps * number(multi.penaltyPerExtra);
}

function frequencyBlocked(action, state) {
  const id = action.id;
  const frequency = action.frequency || "unlimited";
  if (!id || frequency === "unlimited") return false;
  if (frequency === "once_turn") return state.usedTurn.includes(id);
  if (frequency === "once_round") return state.usedRound.includes(id);
  if (frequency === "once_combat") return state.usedCombat.includes(id);
  return false;
}

function slotsNeeded(action = {}) {
  if (action.slots && typeof action.slots === "object") return action.slots;
  if (action.slot) return { [action.slot]: number(action.slotCost, 1) };
  return {};
}

export function canTakeAction({ rules = {}, state, action = {} }) {
  const profile = createRulesProfile(rules);
  const phase = phaseOf(profile, state.phase);
  if (!phase) return { ok: false, reason: "unknown_phase" };
  if (action.phase && action.phase !== state.phase) {
    return { ok: false, reason: "wrong_phase" };
  }
  if (frequencyBlocked(action, state)) {
    return { ok: false, reason: "frequency" };
  }

  const multi = profile.actionEconomy.multiAction || {};
  const needed = slotsNeeded(action);
  for (const [slot, amountRaw] of Object.entries(needed)) {
    const amount = number(amountRaw, 1);
    const capacity = number(phase.slots?.[slot]);
    const used = number(state.usedSlots?.[slot]);
    if (capacity > 0 && used + amount > capacity && !multi.enabled && !phase.repeatable) {
      return { ok: false, reason: "slot", slot, capacity, used, requested: amount };
    }
  }

  if (phase.maxActions != null && number(state.actionCount) >= number(phase.maxActions)) {
    if (!phase.repeatable && !multi.enabled) return { ok: false, reason: "max_actions" };
  }

  return { ok: true, penalty: actionPenalty({ rules: profile, state }) };
}

function markFrequency(action, state) {
  const id = action.id;
  if (!id) return;
  const frequency = action.frequency || "unlimited";
  const map = {
    once_turn: "usedTurn",
    once_round: "usedRound",
    once_combat: "usedCombat"
  };
  const key = map[frequency];
  if (key && !state[key].includes(id)) state[key].push(id);
}

export function takeAction({ rules = {}, state, action = {}, metadata = null }) {
  const profile = createRulesProfile(rules);
  const check = canTakeAction({ rules: profile, state, action });
  if (!check.ok) return { ok: false, state: clone(state), ...check };

  const next = clone(state);
  const needed = slotsNeeded(action);
  for (const [slot, amount] of Object.entries(needed)) {
    next.usedSlots[slot] = number(next.usedSlots[slot]) + number(amount, 1);
  }
  next.actionCount = number(next.actionCount) + 1;
  markFrequency(action, next);
  next.history.push({
    id: action.id || null,
    type: action.type || null,
    phase: next.phase,
    actionNumber: next.actionCount,
    penalty: check.penalty,
    metadata: metadata == null ? null : clone(metadata)
  });

  if (action.transitionTo) {
    if (!phaseOf(profile, action.transitionTo)) {
      throw new Error("Unknown transition phase: " + action.transitionTo);
    }
    next.phase = action.transitionTo;
    next.actionCount = 0;
    next.usedSlots = {};
  }

  return { ok: true, state: next, penalty: check.penalty };
}

export function advancePhase({ rules = {}, state, phase = null }) {
  const profile = createRulesProfile(rules);
  const current = phaseOf(profile, state.phase);
  const nextPhase = phase || current?.nextPhase;
  if (!nextPhase) return { ...clone(state) };
  if (!phaseOf(profile, nextPhase)) throw new Error("Unknown phase: " + nextPhase);
  return {
    ...clone(state),
    phase: nextPhase,
    actionCount: 0,
    usedSlots: {}
  };
}

export function nextRound(state) {
  return {
    ...clone(state),
    usedRound: []
  };
}

export function nextTurn({ rules = {}, state }) {
  const profile = createRulesProfile(rules);
  return {
    ...clone(state),
    turn: number(state.turn, 1) + 1,
    phase: profile.actionEconomy.initialPhase,
    actionCount: 0,
    usedSlots: {},
    usedTurn: [],
    usedRound: [],
    history: []
  };
}
