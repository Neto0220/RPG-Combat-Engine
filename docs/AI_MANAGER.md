# AI Rule Manager

A versão 1.0 integra uma camada de gerenciamento assistivo ao motor declarativo.

## O que a IA pode mudar

O gerenciador pode propor e aplicar mudanças em:

- regras de testes, iniciativa, economia de ações e dano;
- seções e comportamento da interface;
- vocabulário do interpretador;
- recursos e requisitos configuráveis;
- perfis de cenário e ramificações independentes;
- criação/interpretação de entidades e mecânicas.

A IA não recebe permissão para escrever ou executar JavaScript arbitrário. Toda alteração é convertida em operações declarativas validadas.

## Políticas

- `observe`: analisa, mas nunca aplica;
- `assist`: gera um plano e aguarda aplicação explícita;
- `autonomous`: aplica automaticamente planos válidos.

Mesmo no modo `autonomous`, operações fora da superfície declarativa são recusadas.

## Workspaces e branches

Cada workspace contém um perfil executável e histórico de revisões. É possível criar branches para campanhas, mesas, personagens ou cenários distintos sem contaminar a configuração principal.

```js
import { createAIManager } from "./src/index.js";

const manager = createAIManager({
  baseProfile: "custom-combo",
  policy: "autonomous"
});

manager.fork({ id: "arena", name: "Arena tática" });

const result = await manager.adapt(
  "Meu sistema usa d10, perícias, armas de fogo, munição e localização de dano.",
  { localOnly: true }
);

console.log(result.compiled);
```

## Referências de raciocínio

Os perfis e materiais já modelados são usados como exemplos de arquiteturas diferentes. O gerenciador não precisa copiar um sistema conhecido: ele pode combinar padrões e criar um perfil novo a partir da descrição do cenário.

Atualmente há padrões derivados de:

- D&D 5e: economia de ação, d20, CA e conjuração;
- Old Dragon: declaração de turno e iniciativa dependente da ação;
- família d10 tática: perícias, múltiplas ações, armas de fogo, localização e ferimentos;
- horror percentual: testes roll-under e recursos customizados;
- combo customizado: ataque, magia, recursos, frequências, stacks e ataques extras;
- Lovecraft: somente referência de ambientação/vocabulário, sem inventar regras mecânicas.

## Provider de modelo

O motor inclui um contrato de provider. Qualquer modelo local ou remoto pode gerar um plano JSON e o engine valida esse plano antes de aplicá-lo.

```js
import { createAIProvider, createAIManager } from "./src/index.js";

const provider = createAIProvider(async (payload) => {
  const response = await meuModelo(payload);
  return response;
}, { id: "meu-modelo" });

const manager = createAIManager({
  baseProfile: "custom-combo",
  provider,
  policy: "assist"
});
```

O provider recebe somente dados estruturados do perfil, contexto de referências e um contrato de resposta. A resposta não pode conter código executável.

## Operações permitidas

- `set`: substitui um valor;
- `merge`: mescla um objeto;
- `unset`: remove um campo;
- `append_unique`: adiciona valores únicos a listas.

As raízes permitidas são `rules`, `ui`, `interpreter`, `notes`, `configurationRequired`, `id`, `name` e `family`.

## Rollback

Toda aplicação cria uma revisão com estado anterior e posterior. O rollback restaura o perfil anterior sem perder o histórico de auditoria.
