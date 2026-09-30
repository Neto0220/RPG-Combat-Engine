import { createRulesProfile, deepMerge } from "./rules.js";

const customCombo = {
  id: "custom-combo",
  name: "Custom Combo RPG",
  family: "custom",
  rules: {
    checks: {
      default: {
        die: "1d20",
        mode: "roll_over",
        critical: { successOn: [20], failureOn: [1] }
      }
    },
    initiative: {
      die: "1d20",
      sort: "desc",
      attribute: "DES"
    },
    actionEconomy: {
      initialPhase: "attack",
      phases: {
        attack: { slots: { action: 1 }, repeatable: false },
        magic: { slots: {}, repeatable: true }
      },
      multiAction: { enabled: false }
    },
    damage: {
      minimum: 0,
      armor: { mode: "flat", layering: { mode: "sum" } },
      health: { mode: "resource", path: "resources.life.current" }
    },
    progression: {
      featureSources: ["race", "class", "subclass", "equipment", "traits"]
    }
  },
  ui: {
    sections: {
      attributes: true,
      race: true,
      class: true,
      subclass: true,
      skills: false,
      roles: false,
      weapons: true,
      equipment: true,
      magic: true,
      passives: true,
      cyberware: false,
      firearms: false,
      ammunition: false,
      hitLocations: false,
      localizedArmor: false,
      woundTrack: false
    },
    combat: {
      phases: ["attack", "magic"],
      showDefenseTarget: true,
      showArmorClass: false,
      showSkillTarget: false,
      showComboLog: true
    }
  },
  interpreter: {
    preferredContexts: ["ability", "item_ability", "item", "class", "subclass", "passive"]
  }
};

const classicD20Fantasy = {
  id: "classic-d20-fantasy",
  name: "Classic d20 Fantasy",
  family: "classic-fantasy",
  rules: {
    checks: {
      default: {
        die: "1d20",
        mode: "roll_over",
        critical: { successOn: [20], failureOn: [1] }
      },
      attack: {
        die: "1d20",
        mode: "roll_over",
        targetPath: "defense.armorClass"
      },
      attribute: {
        die: "1d20",
        mode: "roll_under",
        skillAsTarget: true
      }
    },
    initiative: {
      die: "1d10",
      sort: "desc",
      variants: {
        weapon: {
          terms: [
            { source: "weapon", path: "initiative", default: 0 }
          ]
        },
        spell: {
          terms: [
            { source: "constant", value: 10 },
            { source: "action", path: "level", multiplier: -1 }
          ]
        },
        turning: {
          terms: [{ source: "attribute", key: "DES" }]
        },
        unarmed: {
          terms: [{ source: "constant", value: 10 }]
        },
        area: {
          terms: [{ source: "attribute", key: "DES" }]
        },
        movement: {
          terms: [{ source: "attribute", key: "DES", multiplier: 0.3333333333 }]
        }
      }
    },
    actionEconomy: {
      initialPhase: "declare",
      phases: {
        declare: { slots: {}, maxActions: 0, nextPhase: "main" },
        main: { slots: { action: 1, movement: 1 }, repeatable: false }
      },
      multiAction: { enabled: false }
    },
    damage: {
      minimum: 1,
      health: { mode: "resource", path: "resources.hp.current" },
      armor: { mode: "class", layering: { mode: "sum" } }
    },
    progression: {
      featureSources: ["race", "class", "subclass", "traits", "equipment"]
    }
  },
  ui: {
    sections: {
      attributes: true,
      race: true,
      class: true,
      subclass: true,
      skills: false,
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
      woundTrack: false
    },
    combat: {
      phases: ["declare", "main"],
      showDefenseTarget: false,
      showArmorClass: true,
      showSkillTarget: false,
      showComboLog: false,
      declareActionBeforeInitiative: true,
      initiativeDependsOnAction: true
    }
  },
  interpreter: {
    preferredContexts: ["ability", "item_ability", "item", "class", "subclass", "race", "passive"],
    vocabulary: ["classe de armadura", "bonus de ataque", "jogada de protecao", "magia preparada", "circulo"]
  }
};

const d10SkillModern = {
  id: "d10-skill-modern",
  name: "d10 Skill & Tactical",
  family: "skill-tactical",
  rules: {
    checks: {
      default: {
        die: "1d10",
        mode: "roll_over",
        critical: {
          failureOn: [1],
          explodeOn: [10],
          maxExplosions: 1
        }
      }
    },
    initiative: {
      die: "1d10",
      attribute: "REF",
      sort: "desc",
      specialPath: "role.initiativeBonus"
    },
    actionEconomy: {
      initialPhase: "main",
      phases: {
        main: { slots: {}, repeatable: true }
      },
      multiAction: {
        enabled: true,
        penaltyPerExtra: -3,
        penaltyStartsAt: 2
      }
    },
    damage: {
      minimum: 0,
      hitLocation: {
        die: "1d10",
        table: []
      },
      armor: {
        layering: {
          mode: "highest_plus_difference_bonus",
          bonusByDifference: []
        }
      },
      health: { mode: "wounds", path: "wounds.current" },
      woundTrack: { path: "wounds.current" }
    },
    progression: {
      featureSources: ["role", "background", "cyberware", "traits", "equipment"]
    },
    firearms: {
      modes: {
        single: {
          shots: 1,
          hits: { type: "single" }
        },
        burst: {
          shots: 3,
          attackModifier: 3,
          hits: { type: "single" }
        },
        auto: {
          shots: "rate",
          attackModifierEveryShots: 10,
          attackModifierPerStep: -1,
          hits: { type: "margin", perMargin: 1, minimumOnSuccess: true }
        }
      }
    }
  },
  ui: {
    sections: {
      attributes: true,
      race: false,
      class: false,
      subclass: false,
      skills: true,
      roles: true,
      weapons: true,
      equipment: true,
      magic: false,
      passives: true,
      cyberware: true,
      firearms: true,
      ammunition: true,
      hitLocations: true,
      localizedArmor: true,
      woundTrack: true
    },
    combat: {
      phases: ["main"],
      showDefenseTarget: false,
      showArmorClass: false,
      showSkillTarget: true,
      showComboLog: false,
      showActionPenalty: true,
      showHitLocation: true,
      showArmorByLocation: true
    }
  },
  interpreter: {
    preferredContexts: ["ability", "item_ability", "item", "role", "cyberware", "passive"],
    vocabulary: ["ref", "pericia", "cadencia", "municao", "blindagem", "localizacao", "recuo"]
  },
  configurationRequired: [
    "damage.hitLocation.table",
    "damage.armor.layering.bonusByDifference",
    "damage.woundTrack.thresholds"
  ],
  notes: [
    "Estrutura tática d10 pronta; tabelas específicas devem ser fornecidas pelo sistema/aplicativo."
  ]
};

const customHorror = {
  id: "custom-horror",
  name: "Custom Horror",
  family: "horror",
  rules: {
    checks: {
      default: {
        die: "1d100",
        mode: "roll_under",
        skillAsTarget: true
      }
    },
    initiative: {
      die: "1d20",
      sort: "desc"
    },
    actionEconomy: {
      initialPhase: "main",
      phases: {
        main: { slots: { action: 1, movement: 1 }, repeatable: false }
      },
      multiAction: { enabled: false }
    },
    damage: {
      health: { mode: "resource", path: "resources.hp.current" }
    },
    progression: {
      featureSources: ["background", "traits", "equipment"]
    }
  },
  ui: {
    sections: {
      attributes: true,
      race: false,
      class: false,
      subclass: false,
      skills: true,
      roles: false,
      weapons: true,
      equipment: true,
      magic: false,
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
      showArmorClass: false,
      showSkillTarget: true,
      showComboLog: false
    }
  },
  interpreter: {
    preferredContexts: ["ability", "item", "background", "passive"],
    vocabulary: ["estresse", "sanidade", "corrupcao", "medo"]
  },
  notes: [
    "Starter genérico de horror. Fórmulas de sanidade/estresse devem ser definidas pelo sistema usado."
  ]
};

export const SYSTEM_PROFILE_TEMPLATES = Object.freeze({
  [customCombo.id]: customCombo,
  [classicD20Fantasy.id]: classicD20Fantasy,
  [d10SkillModern.id]: d10SkillModern,
  [customHorror.id]: customHorror
});

export function listSystemProfiles() {
  return Object.values(SYSTEM_PROFILE_TEMPLATES).map((profile) => ({
    id: profile.id,
    name: profile.name,
    family: profile.family,
    ui: structuredClone(profile.ui),
    notes: structuredClone(profile.notes || [])
  }));
}

export function createSystemProfile(id = "custom-combo", overrides = {}) {
  const base = SYSTEM_PROFILE_TEMPLATES[id];
  if (!base) throw new Error("Unknown system profile: " + id);
  const merged = deepMerge(base, overrides);
  merged.rules = createRulesProfile(merged.rules);
  return merged;
}

export function compileSystemProfile(input = {}, options = {}) {
  const profile = typeof input === "string"
    ? createSystemProfile(input)
    : input.id && SYSTEM_PROFILE_TEMPLATES[input.id]
      ? createSystemProfile(input.id, input)
      : {
          id: input.id || "custom",
          name: input.name || "Custom",
          family: input.family || "custom",
          rules: createRulesProfile(input.rules || {}),
          ui: structuredClone(input.ui || {}),
          interpreter: structuredClone(input.interpreter || {}),
          notes: structuredClone(input.notes || []),
          configurationRequired: structuredClone(input.configurationRequired || [])
        };

  const sections = Object.entries(profile.ui?.sections || {})
    .filter(([, enabled]) => Boolean(enabled))
    .map(([id]) => id);

  const combat = profile.ui?.combat || {};
  return {
    id: profile.id,
    name: profile.name,
    family: profile.family,
    rules: profile.rules,
    ui: profile.ui || {},
    interpreter: profile.interpreter || {},
    notes: profile.notes || [],
    configurationRequired: profile.configurationRequired || [],
    capabilities: {
      sections,
      phases: combat.phases || [profile.rules.actionEconomy.initialPhase],
      initiativeDependsOnAction: Boolean(combat.initiativeDependsOnAction),
      multipleActions: Boolean(profile.rules.actionEconomy.multiAction?.enabled),
      hitLocations: Boolean(profile.rules.damage?.hitLocation),
      firearms: Boolean(profile.rules.firearms && Object.keys(profile.rules.firearms.modes || {}).length)
    }
  };
}

export function profileUiSections(profile) {
  const compiled = compileSystemProfile(profile);
  return compiled.capabilities.sections;
}


const SECTION_FIELD_HINTS = Object.freeze({
  attributes: ["attributes"],
  race: ["race", "race.features", "movement"],
  class: ["class", "class.features", "level", "progression"],
  subclass: ["subclass", "subclass.features"],
  skills: ["skills"],
  roles: ["role", "role.features"],
  weapons: ["weapons", "damageDice", "damageAttributes"],
  equipment: ["equipment", "armor"],
  magic: ["abilities", "resources", "prepared", "spellSlots"],
  spellPreparation: ["prepared", "spellbook", "spellSlots"],
  passives: ["passives", "traits"],
  cyberware: ["cyberware"],
  firearms: ["weapons.rateOfFire", "weapons.fireModes"],
  ammunition: ["weapons.ammo"],
  hitLocations: ["damage.hitLocation"],
  localizedArmor: ["armor"],
  woundTrack: ["wounds"],
  customResources: ["resources"]
});

export function compileUiSchema(profile) {
  const compiled = compileSystemProfile(profile);
  const sections = Object.entries(compiled.ui?.sections || {})
    .filter(([, enabled]) => Boolean(enabled))
    .map(([id]) => ({
      id,
      enabled: true,
      fieldHints: structuredClone(SECTION_FIELD_HINTS[id] || [])
    }));

  return {
    profileId: compiled.id,
    family: compiled.family,
    sections,
    combat: structuredClone(compiled.ui?.combat || {}),
    interpreter: structuredClone(compiled.interpreter || {}),
    configurationRequired: structuredClone(compiled.configurationRequired || [])
  };
}
