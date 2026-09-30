# Orquestrador narrativo 1.2

A engine 1.2 trata criação de conteúdo e regras como partes do mesmo sistema.

## Entrada

O usuário não precisa escrever parâmetros. A entrada pode ser uma frase digitada ou o texto produzido pelo microfone do teclado do sistema operacional.

Exemplo:

```text
Quero criar uma raça de elfos do gelo chamada Avarin. Eles são médios,
andam 9 metros, ganham dois de Destreza, falam Comum e Élfico,
resistem a frio e enxergam no escuro até 18 metros.
```

## Pipeline

1. inferência do tipo de entidade;
2. interpretação das mecânicas já suportadas pelo engine;
3. extração de fatos narrativos;
4. construção de um draft;
5. validação do draft;
6. lista de campos faltantes e incertezas;
7. aplicação segura sobre a entidade atual;
8. persistência de metadados estruturados em `aiContent`.

## Liberdade de configuração

O orquestrador não exige um template `nome: valor`. Os campos são inferidos da narrativa livre.

Atualmente há blueprints para personagem, raça, classe, subclasse, habilidade, habilidade de arma/item, arma, item/equipamento, passiva, papel e cyberware.

## Moderação entre IA e engine

A IA não grava diretamente qualquer objeto recebido.

O fluxo é:

```text
narrativa
  ↓
síntese local / provider
  ↓
draft
  ↓
validador
  ↓
aplicador seguro
  ↓
objeto consumido pela engine
```

Campos manuais não vazios são preservados por padrão. Placeholders como "Nova habilidade" ou "Nova arma" podem ser substituídos pela síntese quando o nome foi dito de forma inequívoca.

## API unificada

```js
import { createUnifiedEngine } from "./src/index.js";

const engine = createUnifiedEngine({ policy: "assist" });

const result = await engine.process(
  "Quero uma habilidade chamada Passo de Gelo que custa 8 mana e causa 2d6.",
  {
    context: "ability",
    baseEntity: { name: "Nova habilidade" },
    localOnly: true
  }
);
```

O mesmo objeto também pode processar adaptações de regras quando `intent: "rules"` é usado.

## Provider opcional

Um provider generativo pode enriquecer o draft, mas continua submetido ao contrato de dados. A resposta esperada é JSON declarativo; não há execução de código fornecido pelo modelo.
