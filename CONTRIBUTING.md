# Como contribuir

Obrigado por ajudar a melhorar o RPG Combat Engine.

## Antes de começar

1. Procure uma Issue existente sobre a mesma ideia.
2. Para mudanças de regra, descreva o comportamento esperado antes de implementar.
3. Não publique fichas reais, saves pessoais ou informações privadas.

## Desenvolvimento

Requisitos: Node.js 20+.

```bash
git clone https://github.com/Neto0220/RPG-Combat-Engine.git
cd RPG-Combat-Engine
npm install
npm test
```

## Pull Requests

Um PR de regra deve incluir:

- descrição do problema;
- exemplo mínimo de entrada;
- resultado esperado;
- teste automatizado;
- atualização de documentação quando necessário.

Evite acoplar regras a nomes específicos de personagens, armas ou campanhas. O núcleo deve permanecer genérico.

## Convenção de mecânicas

Prefira dados declarativos:

```js
{
  timing: "on_use",
  cost: { resource: "mana", amount: 5 },
  mechanics: {
    extraAttacks: 1
  }
}
```

em vez de condicionais com nomes específicos no código.

## Bugs

Para bugs de cálculo, inclua:

- estado inicial;
- armas;
- efeitos ativos;
- resultado obtido;
- resultado esperado.

Use dados fictícios.

## Código de conduta

Ao participar, siga [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
