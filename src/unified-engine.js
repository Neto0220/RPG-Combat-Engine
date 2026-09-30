import { createAIManager } from "./ai-manager.js";
import {
  synthesizeNarrativeEntity,
  applyEntitySynthesis,
  validateNarrativeEntityDraft
} from "./content-orchestrator.js";

export const UNIFIED_ENGINE_VERSION = 1;

function inferIntent(text, options = {}) {
  if (options.intent) return options.intent;
  if (options.entityType || options.context) return "entity";
  const raw = String(text || "").toLowerCase();
  if (/\b(?:raça|raca|classe|subclasse|habilidade|arma|item|equipamento|passiva|personagem|implante|cyberware)\b/.test(raw)) {
    return "entity";
  }
  return "rules";
}

export function createUnifiedEngine(options = {}) {
  const manager = createAIManager(options);

  const api = {
    version: UNIFIED_ENGINE_VERSION,
    manager,

    analyze(text, opts = {}) {
      const intent = inferIntent(text, opts);
      if (intent === "entity") {
        return synthesizeNarrativeEntity(text, {
          ...opts,
          profile: manager.compile(opts.branchId || null),
          baseEntity: opts.baseEntity || {}
        });
      }
      return manager.analyze(text, opts);
    },

    async process(text, opts = {}) {
      const intent = inferIntent(text, opts);

      if (intent === "entity") {
        const synthesis = await manager.synthesizeEntity(text, opts);
        const current = opts.baseEntity || {};
        const entity = opts.apply === false
          ? structuredClone(current)
          : manager.applyEntity(current, synthesis, {
              overwrite: Boolean(opts.overwrite),
              minConfidence: opts.minConfidence
            });

        return {
          intent,
          applied: opts.apply !== false,
          synthesis,
          validation: validateNarrativeEntityDraft(synthesis),
          entity
        };
      }

      const result = await manager.adapt(text, opts);
      return { intent, ...result };
    },

    synthesizeEntity(text, opts = {}) {
      return manager.synthesizeEntity(text, opts);
    },

    applyEntity(entity, synthesis, opts = {}) {
      return applyEntitySynthesis(entity, synthesis, opts);
    },

    adaptRules(text, opts = {}) {
      return manager.adapt(text, opts);
    },

    compile(branchId = null) {
      return manager.compile(branchId);
    },

    getWorkspace() {
      return manager.getWorkspace();
    }
  };

  return api;
}
