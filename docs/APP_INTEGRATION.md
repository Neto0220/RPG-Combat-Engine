# Integração com aplicativos

O RPG Combat Engine não armazena fichas e não conhece usuários. Persistência pertence ao aplicativo que integra o motor.

## Regra de separação

- **motor:** interpreta mecânicas genéricas;
- **aplicativo:** cria/edita personagens e persiste dados;
- **usuário:** possui seus próprios dados em cada instalação ou conta.

Compartilhar um aplicativo que usa o motor não deve compartilhar personagens do desenvolvedor.

## Compatibilidade com estruturas de ficha

O motor aceita a forma canônica documentada neste repositório e também reconhece alguns aliases comuns usados por interfaces de ficha:

- `damageDice` ou `dice[].expression`;
- `damageAttributes` ou `attributeDamage`;
- `frequency` no objeto ou em `mechanics.frequency`;
- `condition` ou `mechanics.conditionText`;
- status de ação em `status` ou nos campos `mechanics.targetStatus*`.

Exemplo de ação especial configurada por uma interface:

```js
{
  id: "special-action",
  name: "Nome escolhido pelo usuário",
  dice: [{ expression: "2d6" }],
  attributeDamage: ["DEX"],
  cost: 8,
  costResource: "mana",
  mechanics: {
    enabled: true,
    timing: "weapon_action",
    frequency: "once_turn",
    actionLabel: "Ataque especial",
    conditionText: "Condição a confirmar",
    effectText: "Resumo mostrado na interface",
    targetStatusName: "Marcado",
    targetStatusDie: "1d4",
    targetStatusMode: "max"
  }
}
```

Nenhum nome acima possui significado especial para o motor.

## Atualizações sem perder dados

Se um aplicativo móvel usa armazenamento local, ele deve preservar:

1. o mesmo identificador/package do aplicativo;
2. a mesma assinatura de atualização;
3. as mesmas chaves de persistência ou uma migração versionada;
4. compatibilidade de schema.

O motor não exige uma tecnologia de persistência específica: localStorage, IndexedDB, SQLite, arquivos ou backend são decisões do aplicativo.

## Migrações

Migrações devem transformar **versões de schema**, nunca procurar nomes específicos de habilidades ou personagens.

Preferível:

```js
if (data.schemaVersion < 3) {
  // transforma campos antigos em novos campos genéricos
}
```

Evite:

```js
if (ability.name === "Nome da habilidade") {
  // comportamento especial
}
```

## Projeto de referência

O aplicativo privado que originou o motor segue este mesmo princípio: código genérico e dados locais por instalação.


## Ataque seguido de fase de combo

Aplicações podem modelar o turno em duas fases:

1. `phase: "attack"`: sequência normal de ataques;
2. `phase: "magic"`: janela de combo para magias, técnicas e ações especiais de arma.

A fase de combo não é consumida pela primeira ação. Ela continua aberta e aceita várias ações enquanto os recursos e a frequência de cada habilidade permitirem. `finishTurn()` (ou `nextTurn()`) encerra o turno, limpa `usedTurn` e `comboLog` e retorna para `phase: "attack"`.

Use `listMagicActions()` para listar habilidades elegíveis e `resolveMagicAction()` para executá-las. Uma ação pode ser exposta como magia com:

```js
mechanics: {
  enabled: true,
  timing: "magic_action",
  magicActionEligible: true,
  magicActionLabel: "Magia"
}
```

`resolveMagicAction()` e `resolveWeaponAction()` acrescentam uma entrada em `comboLog` e mantêm a fase de combo aberta. Restrições como `once_turn` e `once_combat` continuam sendo respeitadas individualmente. `finishTurn()` encerra a janela e prepara o próximo turno.

Habilidades que modificam diretamente a sequência normal de ataque, como geração de ataques extras, permanecem fora da lista de magia mesmo que sejam marcadas como elegíveis.
