# Arquitetura

O projeto é dividido em módulos pequenos para manter o núcleo testável e desacoplado de interface.

## `dice.js`

Parser, rolagem e valor esperado de expressões como `2d6+3`.

## `modifiers.js`

Resolve modificadores de atributo por fase e escopo.

## `sequence.js`

Determina quais efeitos estão ativos, resolve arma principal/secundária e gera a sequência de ataques.

## `statuses.js`

Aplica stacks e calcula resumos derivados.

## `engine.js`

Orquestra custos, dano, status, frequência de uso e ações de arma.

## `index.js`

Define a API pública.

## Princípio de pureza

Sempre que possível, o motor retorna novos objetos em vez de mutar os dados recebidos. Isso facilita:

- undo/redo;
- testes determinísticos;
- integração com React/Vue;
- replay de combate;
- persistência externa.

## Extensibilidade

O caminho preferido é adicionar campos declarativos ao schema. Condições que dependem de contexto narrativo devem ser expostas como dados para a interface confirmar, em vez de codificar nomes específicos no núcleo.
