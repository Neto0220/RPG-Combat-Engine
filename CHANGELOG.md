# Changelog

Todas as mudanças relevantes do projeto serão documentadas aqui.

## [0.9.0] - 2026-09-30

### Adicionado

- compilador de perfis por livro/sistema com alvos `runtime`, `rules`, `ui` e `assistant`;
- perfil D&D 5e Livro do Jogador para economia de ações, iniciativa, CA, progressão e conjuração;
- perfil Old Dragon Livro Básico com declaração de turno, iniciativa dependente da ação e nova rolagem por turno;
- scaffold Cyberpunk 2020 sobre a família d10 tática, mantendo tabelas específicas configuráveis;
- pacote Lovecraft tratado como referência literária/ambientação, sem atribuir regras inexistentes ao texto;
- métodos de uso por perfil para criação, combate, magia, progressão, armas de fogo, ferimentos e ambientação;
- testes de regressão para compilação por alvo e seleção de método de uso.

### Compatibilidade

- os perfis genéricos existentes continuam disponíveis;
- o núcleo universal não passa a depender de nenhum livro específico;
- perfis por livro funcionam como camadas opcionais sobre o mesmo motor declarativo.

## [0.8.0] - 2026-09-30

### Adicionado

- perfis compiláveis de famílias de sistema;
- schema de interface derivado do perfil ativo;
- iniciativa dependente do tipo de ação com termos declarativos;
- criação completa de entidades por linguagem natural;
- inferência de tipo para habilidade, habilidade de arma/item, arma, item, classe, subclasse, raça, papel e cyberware;
- templates de criação fornecidos pelo próprio engine;
- normalização de dano principal em descrições livres;
- testes de regressão para perfis, iniciativa e criação assistida.

### Arquitetura

- o perfil `custom-combo` representa o fluxo atual do FichaRPG;
- `classic-d20-fantasy` oferece uma base old-school configurável;
- `d10-skill-modern` oferece uma base de atributo + perícia, múltiplas ações, localização e armas de fogo;
- `custom-horror` é apenas um starter configurável, sem presumir regras a partir de literatura de horror;
- tabelas específicas/proprietárias ficam fora do núcleo e são fornecidas pelo sistema/aplicativo.

## [0.7.0] - 2026-09-29

### Adicionado

- criação assistida por parâmetros nomeados e texto livre;
- interpretação de nome da habilidade, arma, item, classe e subclasse;
- campos estruturados de descrição, dano, custo, uso, requisito, duração, status e atributo;
- suporte a dados abreviados como `D12` = `1d12`;
- instruções explícitas de nome/descrição substituem esses campos no cadastro;
- suporte a prompts em várias linhas ou em uma única linha;
- tipos explícitos como magia, ataque, passiva e reação.

### Compatibilidade

- descrições livres continuam aceitas;
- configurações manuais de mecânica continuam protegidas;
- apenas campos explicitamente nomeados pelo usuário ganham prioridade de substituição.

## [0.6.0] - 2026-09-29

### Adicionado

- interpretador local de descrições de mecânicas, sem dependência de API externa;
- base interna de aliases para atributos, recursos, timings e frequências;
- interpretação de custos, ataques extras, geradores recursivos, multiplicadores de atributo, dano, reações, status, requisitos e duração;
- merge seguro que preenche defaults sem sobrescrever configurações manuais;
- API browser global `window.RPGMechanicsAI` para integração direta em aplicativos;
- testes automáticos de linguagem natural e casos ambíguos.

### Compatibilidade

- a camada universal 0.5.x permanece compatível;
- o interpretador é opcional e funciona como camada de assistência sobre os mesmos campos declarativos do engine.

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
