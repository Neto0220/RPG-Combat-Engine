# Corpus de 30 RPGs para a IA

A versão 1.1 adiciona um conjunto de 30 sistemas de referência para comparação arquitetural. A lista não é tratada como ranking absoluto: ela combina jogos amplamente reconhecidos, referências históricas, sistemas premiados e designs contemporâneos para ampliar a diversidade mecânica disponível à IA.

## Benchmarks

1. Dungeons & Dragons 5e / 2024
2. Pathfinder 2e
3. Call of Cthulhu 7e
4. Blades in the Dark
5. Mörk Borg
6. Daggerheart
7. Savage Worlds Adventure Edition
8. Cyberpunk RED
9. Shadowrun
10. Vampire: The Masquerade 5e
11. Warhammer Fantasy Roleplay 4e
12. Star Wars RPG / Genesys
13. 13th Age
14. Dragonbane
15. Forbidden Lands
16. Vaesen
17. Alien RPG
18. Traveller
19. RuneQuest: Roleplaying in Glorantha
20. Delta Green
21. The One Ring 2e
22. Lancer
23. Shadowdark RPG
24. Monster of the Week
25. Fate Core / Condensed
26. GURPS 4e
27. Starfinder 2e
28. Draw Steel
29. Fabula Ultima
30. Mothership 1e

## Dimensões avaliadas

Cada benchmark é descrito por:

- resolução principal;
- graus de sucesso;
- economia de ações;
- iniciativa;
- modelo de dano;
- recursos;
- progressão;
- autoridade narrativa;
- grau de tática;
- letalidade;
- construção de personagem;
- carga operacional do mestre.

Além disso, o corpus registra sinais linguísticos e lições de arquitetura reutilizáveis.

## Uso

```js
import { evaluateScenarioAgainstCorpus } from "./src/index.js";

const result = evaluateScenarioAgainstCorpus(
  "Quero três ações por turno, quatro graus de sucesso e reação."
);

console.log(result.matches);
```

O AI Rule Manager incorpora essa avaliação automaticamente em `analyze()` e envia o corpus ao provider conectado. O objetivo não é clonar um sistema conhecido, mas permitir que a IA escolha, combine ou descarte padrões conforme o cenário descrito.

Nenhuma tabela proprietária ou texto de regra fechado é reproduzido no corpus.
