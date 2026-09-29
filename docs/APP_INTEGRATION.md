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
