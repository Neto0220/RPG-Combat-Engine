# Changelog

Todas as mudanças relevantes do projeto serão documentadas aqui.

## [0.4.0] - 2026-09-29

### Adicionado

- fase genérica de combo após a sequência normal de ataque;
- múltiplas magias, técnicas e ações de arma no mesmo combo;
- `comboLog` para registrar cada ação e recurso gasto;
- `finishTurn()` para encerrar explicitamente o turno;
- reinicialização de usos `once_turn` ao avançar o turno.

### Alterado

- o segundo estágio do turno não é mais bloqueado globalmente após a primeira ação;
- limites de uso passam a ser controlados pela frequência da própria habilidade e pelos recursos disponíveis.

## [0.3.0] - 2026-09-29

### Adicionado

- segunda ação genérica por turno;
- ações de magia/técnica separadas do ataque normal;
- compartilhamento do segundo slot entre magia e ação especial de arma;
- controle de `secondaryUsed` reiniciado por `nextTurn`;
- aplicação genérica de stacks/status em ações mágicas;
- testes do orçamento de duas ações.

## [0.2.0] - 2026-09-29

### Adicionado

- contrato de integração com aplicativos;
- compatibilidade com ações de arma descritas em `mechanics`;
- aliases para dados/dano usados por interfaces de ficha;
- condições e status genéricos em ações pós-ataque;
- testes de integração com schema de aplicativo.

## [0.1.0] - 2026-09-29

### Adicionado

- núcleo independente do motor;
- rolagem de dados;
- atributos por golpe e bônus únicos por sequência;
- arma principal/secundária;
- dual wield;
- ataques extras e geração recursiva;
- habilidades opcionais;
- custos de recurso;
- stacks/status;
- ações especiais de arma pós-ataque;
- limites por turno e por combate;
- testes automatizados.
