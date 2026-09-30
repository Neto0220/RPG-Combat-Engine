import { createSystemProfile, compileSystemProfile, compileUiSchema } from "./profiles.js";
import { deepMerge } from "./rules.js";

export const BOOK_COMPILATION_TARGETS = Object.freeze([
  "runtime",
  "rules",
  "ui",
  "assistant"
]);

const dnd5eProfile = {
  id: "dnd-5e-phb",
  name: "D&D 5e - Player Handbook",
  family: "d20-fantasy",
  rules: {
    id: "dnd-5e-phb",
    name: "D&D 5e - Player Handbook",
    checks: {
      default: {
        die: "1d20",
        mode: "roll_over",
        comparator: "gte",
        critical: { successOn: [], failureOn: [] }
      },
      attack: {
        die: "1d20",
        mode: "roll_over",
        comparator: "gte",
        targetPath: "defense.armorClass",
        critical: { successOn: [20], failureOn: [1] }
      },
      ability: {
        die: "1d20",
        mode: "roll_over",
        comparator: "gte"
      },
      savingThrow: {
        die: "1d20",
        mode: "roll_over",
        comparator: "gte"
      }
    },
    initiative: {
      die: "1d20",
      sort: "desc",
      reroll: "combat",
      attribute: "DES"
    },
    actionEconomy: {
      initialPhase: "main",
      phases: {
        main: {
          slots: { action: 1, movement: 1, bonus: 1, reaction: 1 },
          maxActions: null,
          repeatable: false,
          slotGuards: {
            bonus: "requires_feature_spell_or_rule",
            reaction: "requires_trigger"
          }
        }
      },
      multiAction: { enabled: false }
    },
    damage: {
      minimum: 0,
      armor: { mode: "class", layering: { mode: "sum" } },
      health: { mode: "resource", path: "resources.hp.current" }
    },
    progression: {
      featureSources: [
        "race",
        "class",
        "subclass",
        "background",
        "traits",
        "equipment"
      ]
    }
  },
  ui: {
    sections: {
      attributes: true,
      race: true,
      class: true,
      subclass: true,
      skills: true,
      roles: false,
      weapons: true,
      equipment: true,
      magic: true,
      spellPreparation: true,
      passives: true,
      cyberware: false,
      firearms: false,
      ammunition: false,
      hitLocations: false,
      localizedArmor: false,
      woundTrack: false,
      customResources: true
    },
    combat: {
      phases: ["main"],
      showDefenseTarget: false,
      showArmorClass: true,
      showSkillTarget: false,
      showComboLog: false,
      showBonusAction: true,
      showReaction: true,
      movementSeparateFromAction: true
    }
  },
  interpreter: {
    preferredContexts: [
      "ability",
      "item_ability",
      "item",
      "class",
      "subclass",
      "race",
      "passive"
    ],
    vocabulary: [
      "acao",
      "acao bonus",
      "reacao",
      "movimento",
      "classe de armadura",
      "teste de habilidade",
      "teste de resistencia",
      "bonus de proficiencia",
      "espaco de magia",
      "concentracao"
    ]
  },
  notes: [
    "Perfil mecânico para o fluxo-base de personagem, combate e magia do Livro do Jogador 5e.",
    "Características específicas continuam declarativas no cadastro de classe, subclasse, talento, item e magia."
  ]
};

const BOOK_RULE_PACKS = {
  "dnd-5e-phb": {
    id: "dnd-5e-phb",
    source: {
      kind: "rulebook",
      title: "D&D 5e - Livro do Jogador",
      edition: "5e",
      rulesAuthority: "rulebook",
      verification: "book-backed"
    },
    profile: dnd5eProfile,
    usageMethods: [
      {
        id: "character_creation",
        label: "Criação de personagem",
        focus: ["attributes", "race", "class", "subclass", "skills", "equipment"]
      },
      {
        id: "combat",
        label: "Combate por turno",
        flow: ["initiative", "movement", "action", "bonus_action", "reaction"]
      },
      {
        id: "spellcasting",
        label: "Conjuração",
        focus: ["magic", "spellPreparation", "resources"],
        runtimeHints: { concentration: true, spellSlots: true }
      },
      {
        id: "progression",
        label: "Progressão",
        focus: ["class", "subclass", "features"]
      }
    ]
  },

  "old-dragon-basic": {
    id: "old-dragon-basic",
    source: {
      kind: "rulebook",
      title: "Old Dragon - Livro Básico",
      edition: "1a edicao",
      rulesAuthority: "rulebook",
      verification: "book-backed"
    },
    baseProfileId: "classic-d20-fantasy",
    profileOverrides: {
      id: "old-dragon-basic",
      name: "Old Dragon - Livro Básico",
      family: "old-school-d20",
      rules: {
        id: "old-dragon-basic",
        name: "Old Dragon - Livro Básico",
        initiative: {
          die: "1d10",
          sort: "desc",
          reroll: "turn",
          tieBreakers: [
            { type: "attribute", key: "DES", sort: "desc" },
            { type: "die", die: "1d6", sort: "desc" }
          ]
        }
      },
      ui: {
        combat: {
          phases: ["declare", "main"],
          showDefenseTarget: false,
          showArmorClass: true,
          showSkillTarget: false,
          showComboLog: false,
          declareActionBeforeInitiative: true,
          initiativeDependsOnAction: true,
          rerollInitiativeEachTurn: true
        }
      },
      interpreter: {
        preferredContexts: [
          "ability",
          "item_ability",
          "item",
          "class",
          "subclass",
          "race",
          "passive"
        ],
        vocabulary: [
          "classe de armadura",
          "bonus de ataque",
          "jogada de protecao",
          "declaracao de turno",
          "iniciativa da arma",
          "circulo da magia",
          "afastar mortos vivos"
        ]
      },
      notes: [
        "Fluxo: declarar a ação, calcular a iniciativa conforme a ação e resolver em ordem.",
        "A iniciativa é rolada novamente a cada turno."
      ]
    },
    usageMethods: [
      {
        id: "character_creation",
        label: "Criação old-school",
        focus: ["attributes", "race", "class", "equipment", "magic"]
      },
      {
        id: "declared_combat",
        label: "Combate com declaração",
        flow: ["declare_action", "initiative_by_action", "resolve_action"]
      },
      {
        id: "protection_rolls",
        label: "Jogadas de proteção",
        focus: ["saving_throw", "attribute_modifier"]
      },
      {
        id: "spellcasting",
        label: "Magia por círculo",
        focus: ["magic", "spellPreparation"]
      }
    ]
  },

  "cyberpunk-2020-scaffold": {
    id: "cyberpunk-2020-scaffold",
    source: {
      kind: "rulebook_family",
      title: "Cyberpunk 2020",
      edition: "2020",
      rulesAuthority: "partial",
      verification: "mechanics-scaffold"
    },
    baseProfileId: "d10-skill-modern",
    profileOverrides: {
      id: "cyberpunk-2020-scaffold",
      name: "Cyberpunk 2020 - Mechanics Scaffold",
      family: "d10-skill-tactical",
      notes: [
        "Estrutura d10, perícias, múltiplas ações, armas de fogo, localização e ferimentos.",
        "Tabelas específicas e conteúdo proprietário permanecem configuráveis e fora do núcleo."
      ]
    },
    usageMethods: [
      {
        id: "character_creation",
        label: "Personagem por atributos e perícias",
        focus: ["attributes", "skills", "roles", "cyberware", "equipment"]
      },
      {
        id: "tactical_combat",
        label: "Combate tático",
        focus: ["skills", "hitLocations", "localizedArmor", "woundTrack"]
      },
      {
        id: "firearms",
        label: "Armas de fogo",
        focus: ["firearms", "ammunition", "hitLocations"]
      },
      {
        id: "wounds",
        label: "Ferimentos",
        focus: ["woundTrack", "localizedArmor"]
      }
    ]
  },

  "lovecraft-setting": {
    id: "lovecraft-setting",
    source: {
      kind: "literary_reference",
      title: "H. P. Lovecraft - O Chamado de Cthulhu",
      edition: "1928",
      rulesAuthority: "none",
      verification: "setting-only"
    },
    baseProfileId: "custom-horror",
    profileOverrides: {
      id: "lovecraft-setting",
      name: "Lovecraft - Setting Reference",
      family: "horror-setting",
      interpreter: {
        preferredContexts: ["ability", "item", "background", "passive"],
        vocabulary: [
          "horror cosmico",
          "culto",
          "ritual",
          "medo",
          "investigacao",
          "entidade"
        ]
      },
      notes: [
        "Este material é referência literária/ambientação, não um sistema de regras.",
        "Nenhuma mecânica de sanidade, combate ou perícia é atribuída ao livro literário."
      ]
    },
    usageMethods: [
      {
        id: "setting_reference",
        label: "Referência de ambientação",
        focus: ["background", "traits", "items", "narrative_tags"]
      },
      {
        id: "horror_vocabulary",
        label: "Vocabulário de horror",
        focus: ["interpreter", "narrative_tags"]
      }
    ]
  }
};

export const BOOK_PROFILE_IDS = Object.freeze(Object.keys(BOOK_RULE_PACKS));

function getPack(bookId) {
  const pack = BOOK_RULE_PACKS[bookId];
  if (!pack) throw new Error("Unknown book profile: " + bookId);
  return pack;
}

function buildCompiledProfile(pack, profileOverrides = {}) {
  if (pack.baseProfileId) {
    const mergedOverrides = deepMerge(pack.profileOverrides || {}, profileOverrides || {});
    return compileSystemProfile(createSystemProfile(pack.baseProfileId, mergedOverrides));
  }

  const merged = deepMerge(pack.profile || {}, profileOverrides || {});
  return compileSystemProfile(merged);
}

export function listBookProfiles() {
  return BOOK_PROFILE_IDS.map((id) => {
    const pack = BOOK_RULE_PACKS[id];
    return {
      id,
      source: structuredClone(pack.source),
      usageMethods: structuredClone(pack.usageMethods || [])
    };
  });
}

export function getBookUsageMethods(bookId) {
  return structuredClone(getPack(bookId).usageMethods || []);
}

export function compileBookProfile(bookId, options = {}) {
  const pack = getPack(bookId);
  const target = options.target || "runtime";
  if (!BOOK_COMPILATION_TARGETS.includes(target)) {
    throw new Error("Unknown compilation target: " + target);
  }

  const compiled = buildCompiledProfile(pack, options.profileOverrides || {});
  const usageMethods = structuredClone(pack.usageMethods || []);
  const activeUsage = options.usageMethod
    ? usageMethods.find((method) => method.id === options.usageMethod)
    : null;

  if (options.usageMethod && !activeUsage) {
    throw new Error("Unknown usage method for " + bookId + ": " + options.usageMethod);
  }

  const base = {
    id: compiled.id,
    name: compiled.name,
    family: compiled.family,
    source: structuredClone(pack.source),
    notes: structuredClone(compiled.notes || []),
    activeUsage: activeUsage ? structuredClone(activeUsage) : null
  };

  if (target === "rules") {
    return {
      ...base,
      rules: structuredClone(compiled.rules),
      configurationRequired: structuredClone(compiled.configurationRequired || [])
    };
  }

  if (target === "ui") {
    return {
      ...base,
      uiSchema: compileUiSchema(compiled),
      usageMethods
    };
  }

  if (target === "assistant") {
    return {
      ...base,
      interpreter: structuredClone(compiled.interpreter || {}),
      usageMethods
    };
  }

  return {
    ...base,
    rules: structuredClone(compiled.rules),
    ui: structuredClone(compiled.ui || {}),
    uiSchema: compileUiSchema(compiled),
    interpreter: structuredClone(compiled.interpreter || {}),
    configurationRequired: structuredClone(compiled.configurationRequired || []),
    capabilities: structuredClone(compiled.capabilities || {}),
    usageMethods
  };
}
