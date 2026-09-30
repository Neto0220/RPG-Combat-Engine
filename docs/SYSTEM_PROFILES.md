# System Profiles

A camada de perfis existe para manter o motor genérico sem obrigar toda interface a mostrar os mesmos campos.

## Fluxo recomendado

```js
import {
  createSystemProfile,
  compileSystemProfile,
  compileUiSchema
} from "./src/index.js";

const profile = createSystemProfile("custom-combo");
const compiled = compileSystemProfile(profile);
const ui = compileUiSchema(compiled);
```

`compiled.rules` é usado pelos resolvedores do engine.

`ui.sections` informa quais módulos fazem sentido para a ficha atual.

## Perfis-base

### custom-combo

Perfil compatível com o fluxo atual do FichaRPG:

- fase de ataque;
- fase aberta de combo mágico;
- raça, classe, subclasse, armas, itens, magia e passivas.

### classic-d20-fantasy

Base para fantasia clássica:

- testes d20 configuráveis;
- raça, classe e progressão;
- CA/defesa;
- magia preparada/recursos;
- iniciativa dependente da ação.

Os valores de tabelas e conteúdo de um sistema específico devem ser fornecidos pelo aplicativo ou pelo usuário.

### d10-skill-modern

Base para sistemas táticos de atributo + perícia:

- d10;
- iniciativa por atributo;
- múltiplas ações;
- papéis/profissões;
- cyberware;
- armas de fogo;
- munição;
- localização de dano;
- blindagem localizada;
- trilha de ferimentos.

As tabelas específicas de localização, armadura e ferimentos ficam em `configurationRequired`.

### custom-horror

Starter neutro para jogos de horror:

- testes percentuais configuráveis;
- perícias;
- recursos personalizados como estresse/sanidade/corrupção.

Ele não define nenhuma fórmula específica de um RPG de horror. Essas regras precisam vir do sistema realmente utilizado.

## Interface orientada pelo perfil

Exemplo:

```js
const ui = compileUiSchema("d10-skill-modern");

for (const section of ui.sections) {
  console.log(section.id, section.fieldHints);
}
```

Uma interface pode esconder módulos não usados.

Por exemplo, `classic-d20-fantasy` não precisa mostrar cyberware, enquanto `d10-skill-modern` pode mostrar munição e armadura localizada.

## Criação assistida

Os templates de criação também vêm do engine:

```js
import {
  creationTemplate,
  createEntityFromText
} from "./src/index.js";

console.log(creationTemplate("ability"));

const created = createEntityFromText(
  "Nome da habilidade: Impacto Espacial, dano: D12, custo de mana: 5, uso: uma vez por turno"
);
```

`createEntityFromText()` devolve:

- `entityType`;
- objeto `entity` já preenchido;
- interpretação técnica;
- confiança;
- template correspondente.

A descrição narrativa continua preservada.

## Segurança de dados

Perfis não devem carregar personagens reais, saves ou informações privadas.

O perfil descreve regras. A ficha descreve o personagem.
