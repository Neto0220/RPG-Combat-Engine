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


## Perfil de sistema

Aplicações que desejam suportar mais de um RPG devem manter o conteúdo da ficha separado do perfil de regras.

Estrutura recomendada:

~~~js
{
  system: {
    id: "meu-sistema",
    version: 1,
    rulesProfile: { /* regras declarativas */ }
  },
  character: { /* dados do personagem */ }
}
~~~

O aplicativo pode trocar o perfil sem alterar o código do motor. O perfil descreve checks, iniciativa, economia de ações, dano, progressão, recursos e armas de fogo.

Os dados do personagem continuam livres para usar nomes e estruturas próprias. O motor acessa valores por caminhos e fontes de features configuráveis.

### Princípio de compatibilidade

Não salve regras particulares de um personagem dentro do código do engine. Habilidades, armas, classes, raças, papéis, implantes e passivas devem ser dados.

Ao importar uma ficha de outro sistema:

1. carregue o rulesProfile correspondente;
2. normalize os caminhos necessários ou configure os caminhos no perfil;
3. mantenha identificadores e conteúdo do personagem na própria ficha;
4. use as primitives universais para resolver os testes e efeitos.

### Interfaces

Uma interface não precisa expor todos os campos universais ao mesmo tempo. Ela pode renderizar apenas as seções habilitadas pelo perfil. Por exemplo, um sistema sem armas de fogo não precisa exibir cadência ou munição; um sistema sem classes pode omitir progressão por classe; um sistema com ferimentos localizados pode habilitar o mapa de armadura por localização.

Isso permite que um mesmo aplicativo se adapte ao sistema em uso sem transformar o engine em uma interface fixa.
