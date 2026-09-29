# Mechanics reference

## Timings

### `passive`
Sempre ativo.

### `on_use`
Só entra no cálculo quando o ID estiver em `state.activeAbilityIds`.

### `weapon_action`
Não entra na sequência normal. É listado e resolvido separadamente após o ataque principal.

## Frequências

- `unlimited`
- `once_turn`
- `once_combat`

## Ataques

```js
mechanics: {
  extraAttacks: 2,
  dualWield: true,
  extraWeaponMode: "alternate",
  attackEvery: 2,
  attackGrant: 1,
  recursiveAttacks: true
}
```

### `extraAttacks`
Adiciona ataques diretamente.

### `attackEvery` + `attackGrant`
Cria ataques em intervalos. Exemplo: a cada 2 ataques, gerar +1.

### `recursiveAttacks`
Quando `true`, ataques gerados também contam para gerar novos ataques.

### `dualWield`
Alterna arma principal e secundária nos ataques-base.

## Modificadores de atributo

```js
{
  attribute: "DEX",
  operation: "multiply",
  value: 2,
  phase: "per_hit",
  scope: "damage_attribute"
}
```

### Operações

- `add`
- `multiply`

### Fases

- `per_hit`: entra em cada golpe.
- `once_per_sequence`: entra uma vez ao final da sequência.

### Escopos

- `all`
- `damage_attribute`
- `weapon`

Para `weapon`, informe `weaponId`.

## Recursos

```js
cost: {
  resource: "mana",
  amount: 5
}
```

O recurso precisa existir em:

```js
actor.resources.mana.current
```

## Status

Efeito por golpe:

```js
mechanics: {
  status: {
    name: "Frost",
    fixed: 1,
    die: "1d4",
    perHit: true
  }
}
```

## Ações de arma

```js
{
  id: "special-cut",
  timing: "weapon_action",
  frequency: "once_combat",
  condition: "Target must be exposed",
  cost: { resource: "mana", amount: 20 },
  damageDice: ["2d12"],
  damageAttributes: ["DEX"]
}
```

A condição é retornada para a interface confirmar. O núcleo não presume que uma condição narrativa foi cumprida.
