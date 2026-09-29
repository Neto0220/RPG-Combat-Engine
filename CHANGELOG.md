# Changelog

Todas as mudanças relevantes do projeto serão documentadas aqui.

## [0.5.0] - 2026-09-29

### Adicionado

- perfis de regras declarativos independentes de sistema;
- testes roll-over, roll-under, percentuais, opostos e dados explosivos;
- iniciativa configurável por dado, atributo, perícia e bônus especiais;
- economia de ações por fases, slots e penalidade cumulativa;
- frequência por turno, rodada e combate;
- pipeline genérico de dano com localização, armadura por local, camadas, penetração, redução e trilha de ferimentos;
- efeitos recorrentes e regressivos;
- custos arbitrários para mana, vida, slots, preparo, cargas e contadores;
- progressão genérica para raça, ancestralidade, classe, subclasse, papel, background, cyberware e traits;
- modos declarativos de armas de fogo, munição e confiabilidade;
- documentação de cobertura e integração universal;
- testes de regressão cobrindo arquiteturas de RPG incompatíveis entre si.

### Compatibilidade

- a API de combate existente da 0.4.x continua exportada;
- a nova camada é adicional e pode ser adotada gradualmente.

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
