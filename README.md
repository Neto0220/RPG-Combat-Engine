# RPG Combat Engine

[![Tests](https://github.com/Neto0220/RPG-Combat-Engine/actions/workflows/test.yml/badge.svg)](https://github.com/Neto0220/RPG-Combat-Engine/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Motor open source e independente para fichas e aplicativos de RPG, com foco em regras declarativas, combate, recursos, progressão e extensibilidade entre sistemas.

> Este repositório contém apenas o motor genérico. Ele não contém fichas, personagens, saves ou dados privados do aplicativo que originou o projeto.

## Objetivo

Permitir que qualquer aplicativo, ficha digital ou ferramenta de RPG descreva mecânicas em JSON e deixe o motor resolver:

- ataques com uma ou duas armas;
- arma principal e secundária;
- ataques extras e ataques gerados recursivamente;
- habilidades opcionais ativadas por turno;
- custos de mana, vida ou outros recursos;
- atributos por golpe e bônus únicos por sequência;
- multiplicadores de atributo;
- stacks e efeitos de status;
- ações especiais de arma após a sequência normal;
- limitações por turno ou por combate;
- resultados detalhados para interfaces, logs e testes.

## Filosofia

O motor tenta manter **regra** separada de **interface**. Uma interface pode ser web, Android, desktop ou CLI; o motor recebe dados e devolve resultados.

As mecânicas são declarativas sempre que possível. Em vez de escrever código para cada habilidade, você descreve o efeito:

```js
{
  id: "flurry",
  name: "Rajada",
  timing: "on_use",
  cost: { resource: "mana", amount: 5 },
  mechanics: {
    attackEvery: 2,
    attackGrant: 1,
    recursiveAttacks: true
  }
}
```

## Camada universal 0.5.0

Além do resolvedor de combate original, o motor possui uma camada universal baseada em perfis de regras. Ela cobre testes roll-over e roll-under, testes opostos, iniciativa configurável, diferentes economias de ação, localização e pipeline de dano, recursos arbitrários, progressão, papéis, implantes e armas de fogo.

O núcleo não contém nomes de personagens, classes, habilidades ou jogos específicos. Cada aplicativo fornece um `rulesProfile` e os dados da ficha.

- [Guia da camada universal](docs/UNIVERSAL_RULES.md)
- [Matriz de cobertura](docs/SYSTEM_COVERAGE.md)
- [Integração com aplicativos](docs/APP_INTEGRATION.md)

## Instalação

Requer Node.js 20+.

```bash
npm install
npm test
```

Para usar localmente:

```js
import {
  createCombatState,
  buildAttackSequence,
  resolveAttackSequence
} from "./src/index.js";
```

## Exemplo rápido

```js
import {
  createCombatState,
  buildAttackSequence,
  resolveAttackSequence
} from "./src/index.js";

const actor = {
  attributes: {
    DEX: { base: 3 }
  },
  resources: {
    mana: { current: 50, max: 50 }
  },
  weapons: [
    {
      id: "sword",
      name: "Espada",
      damageDice: ["1d8"],
      damageAttributes: ["DEX"]
    },
    {
      id: "dagger",
      name: "Adaga",
      damageDice: ["1d6"],
      damageAttributes: ["DEX"]
    }
  ],
  effects: [
    {
      id: "dual-wield",
      name: "Ambidestria",
      timing: "passive",
      mechanics: {
        dualWield: true,
        extraAttacks: 1
      }
    }
  ]
};

const state = createCombatState({
  primaryWeaponId: "sword",
  secondaryWeaponId: "dagger"
});

const sequence = buildAttackSequence({ actor, state });
const result = resolveAttackSequence({ actor, state, sequence });

console.log(result.damageTotal);
```

## Modelo mental dos atributos

O motor distingue dois tipos de bônus:

1. **Por golpe:** atributo base e bônus explicitamente marcados para aplicar em cada ataque.
2. **Uma vez por sequência:** bônus externos/globais configurados como `once_per_sequence`.

Isso evita multiplicar acidentalmente um bônus de equipamento em todos os ataques.

Exemplo conceitual:

```text
DEX base = 3
multiplicador por golpe = ×2
bônus externo = +10
multiplicador do bônus externo = ×2

3 × 2 = 6 por golpe
10 × 2 = 20 uma única vez na sequência
```

## Estrutura do projeto

```text
src/
  dice.js          rolagem e expectativa de dados
  modifiers.js     atributos e modificadores
  sequence.js      geração da sequência de ataques
  statuses.js      stacks e efeitos de status
  engine.js        resolução de combate e recursos
  index.js         API pública

examples/
  basic-combat.mjs

test/
  engine.test.js

.github/
  ISSUE_TEMPLATE/
```

## Contribuindo

Ideias, correções e novas mecânicas são bem-vindas.

- Abra uma **Issue** para bugs ou propostas.
- Para uma nova regra, descreva também um exemplo de entrada e o resultado esperado.
- Pull Requests devem incluir testes quando alterarem comportamento do motor.

Leia [CONTRIBUTING.md](CONTRIBUTING.md). Para integrar o motor a uma ficha ou aplicativo, consulte [docs/APP_INTEGRATION.md](docs/APP_INTEGRATION.md).

## Segurança e privacidade

Não envie saves reais, fichas pessoais ou dados privados em Issues públicas. Use exemplos fictícios e mínimos para reproduzir bugs.

## Licença

MIT — consulte [LICENSE](LICENSE).

## Participar do projeto

- [Abrir um bug](https://github.com/Neto0220/RPG-Combat-Engine/issues/new?template=bug_report.yml)
- [Sugerir uma melhoria](https://github.com/Neto0220/RPG-Combat-Engine/issues/new?template=feature_request.yml)
- [Propor uma nova mecânica](https://github.com/Neto0220/RPG-Combat-Engine/issues/new?template=mechanic_proposal.yml)
- [Ver o roadmap e ideias da comunidade](https://github.com/Neto0220/RPG-Combat-Engine/issues/1)

O mantenedor do código é `@Neto0220`. Pull Requests são revisados antes de serem incorporados ao motor.
