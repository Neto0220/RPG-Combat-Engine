# Universal Rules Layer

A partir da versão 0.5.0, o motor separa as primitivas de regras do perfil de cada sistema. O perfil chamado rulesProfile descreve como um jogo usa dados, testes, iniciativa, ações, dano, recursos e progressão.

## Checks

resolveCheck suporta roll-over, roll-under, testes percentuais, atributo + perícia + dado, modificadores condicionais, resultados naturais e dados explosivos. resolveOpposedCheck cobre disputas entre dois lados.

## Iniciativa

resolveInitiative pode combinar dado, atributo, perícia, bônus especial vindo de qualquer caminho da ficha, modificadores contextuais e critérios de desempate.

## Economia de ações

turns.js permite declarar:
- uma ação + movimento;
- fases com slots diferentes;
- múltiplas ações com penalidade cumulativa;
- transições entre fases, como ataque seguido de combo;
- frequências unlimited, once_turn, once_round e once_combat.

Exemplo conceitual de perfil rígido:

~~~js
actionEconomy: {
  initialPhase: "main",
  phases: {
    main: { slots: { action: 1, movement: 1 }, repeatable: false }
  },
  multiAction: { enabled: false }
}
~~~

Exemplo conceitual de múltiplas ações:

~~~js
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
}
~~~

## Dano

resolveDamage é um pipeline componível. O perfil pode ligar somente os estágios de que precisa:
- localização do acerto;
- multiplicador por localização;
- armadura global ou por parte do corpo;
- múltiplas camadas;
- penetração;
- redução fixa ou proporcional;
- redução derivada de atributo;
- pontos de vida;
- trilha acumulativa de ferimentos;
- gatilho de dano maciço.

tickTimedEffects trata dano recorrente e regressivo, duração em ticks e qualquer recurso escolhido pela ficha.

## Recursos e magia

resources.js aceita custos arbitrários. O mesmo mecanismo pode consumir mana, vida, stamina, munição, cargas, slots, magias preparadas ou contadores próprios.

## Progressão

A hierarquia do personagem não é fixa. Por padrão, collectFeatures entende ancestry, race, class, subclass, role, background, cyberware, traits e features. O perfil pode trocar essa lista.

evaluateRequirements cobre requisitos de atributo, tag, origem, equipamento e caminhos arbitrários. deriveProgression lê tabelas por nível sem pressupor o significado das colunas.

## Armas de fogo

firearms.js oferece primitivas para munição, cadência, modos de tiro, número de disparos, modificadores por volume de fogo, acertos por margem, zona, confiabilidade e travamento. As tabelas e números ficam no perfil.

## Modificadores condicionais

Bônus e penalidades podem depender de tags, fase, tipo de ação, atributo, perícia, categoria da arma ou tags do alvo. Isso permite modelar características de raça, classe, papel, equipamento, cobertura, alcance e estados sem nomes hardcoded.

## Compatibilidade

A API anterior continua disponível. buildAttackSequence, resolveAttackSequence, resolveMagicAction, resolveWeaponAction e finishTurn não foram removidos. Aplicações existentes podem migrar gradualmente para a camada universal.
