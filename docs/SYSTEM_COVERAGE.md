# System Coverage

A versão 0.5.0 foi desenhada a partir de famílias de mecânicas encontradas em RPGs com arquiteturas muito diferentes.

## Matriz de capacidades

| Família de regra | Primitive do motor |
|---|---|
| d20 contra defesa/dificuldade | resolveCheck |
| teste percentual / roll-under | resolveCheck |
| atributo + perícia + dado | resolveCheck |
| crítico natural e dado explosivo | política critical |
| testes opostos | resolveOpposedCheck |
| iniciativa configurável | resolveInitiative |
| uma ação + movimento | slots de fase |
| múltiplas ações com penalidade | multiAction |
| ataque seguido de combo | transição de fases |
| uma vez por turno/rodada/combate | frequência |
| raça, ancestralidade, classe e subclasse | fontes de features |
| papel/profissão | fonte role |
| implantes e modificações corporais | fonte cyberware |
| progressão por nível | tabelas genéricas |
| pré-requisitos | evaluateRequirements |
| mana, slots, preparo e cargas | custos arbitrários |
| localização de acerto | resolveHitLocation |
| armadura por parte do corpo | pipeline de dano |
| múltiplas camadas | combineArmorLayers |
| penetração | multiplicadores de armadura/dano |
| redução derivada de atributo | bodyModifier |
| HP tradicional | modo resource |
| trilha de ferimentos | modo wounds |
| dano recorrente/regressivo | tickTimedEffects |
| cadência e modos de tiro | firearms.js |
| munição e confiabilidade | consumeAmmo / resolveReliability |

## O que universal significa

Universal não significa que o código conhece previamente todo RPG publicado ou futuro.

Significa que o motor oferece primitivas independentes para descrever famílias de regras. Quando surgir uma regra que não caiba nessas primitivas, a expansão correta é adicionar uma nova primitive genérica, acompanhada de teste, e não codificar o nome de uma habilidade, classe, arma ou sistema específico.

## Conteúdo versus motor

O repositório público guarda a infraestrutura. Dados específicos de uma ficha ou de um sistema ficam fora do núcleo.

Isso também evita incorporar tabelas ou conteúdo proprietário de livros como preset oficial sem licença apropriada. Exemplos do repositório devem ser fictícios e mínimos.

## Horror e sanidade

O motor consegue representar um recurso de sanidade, estresse, corrupção ou semelhante como atributo, recurso, trilha ou contador. Porém a fórmula concreta de perda, recuperação e testes deve vir do livro de regras do sistema realmente utilizado.

Uma obra literária de ambientação, sozinha, não define essas mecânicas.
