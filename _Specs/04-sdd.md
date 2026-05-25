# SDD — Busca Inteligente de Filmes

**Projeto:** Battle of Movies
**Feature:** Busca por linguagem natural em cima da base IMDb
**Metodologia:** Spec-Driven Development
**Data:** 26/05/2026
**Autor:** Rubens Alves

---

## constitution.md

> Decisões permanentes do projeto. O agente não pode contradizer nenhuma delas.

```
DEPLOY: Netlify — toda a feature é servida como Netlify Function
        A URL base é o site onde está deployado + "/4_SDD"
        Exemplo: https://battle-of-movies.netlify.app/4_SDD

ISOLAMENTO: toda implementação em /04_SDD — nada fora dessa pasta
            nada é criado, modificado ou removido na raiz do projeto

DADOS: a conexão com o banco vem exclusivamente da variável de ambiente DATA_URL
       o agente não acessa, lê ou infere schema de nenhuma outra fonte
       o schema das tabelas está em dataBase.md na raiz — leia antes de implementar

BANCO: queries SQL diretas — sem ORM
SEGURANÇA: queries sempre parametrizadas — sem interpolação de string em SQL
TIPAGEM: TypeScript strict — sem any explícito
ADULTOS: filmes com isAdult = 1 nunca aparecem em nenhum resultado
TIPO: apenas titleType = 'movie' nos resultados — sem série, episódio ou short
ERROS: sempre estruturados em JSON com campos error, message e status
LOGS: estruturados em JSON — sem console.log solto em produção
AMBIENTE: variáveis via process.env com validação no startup
```

---

## spec.md

### Contexto e Problema

Usuários que querem assistir a um filme frequentemente não sabem o título.
Sabem o que querem sentir, o gênero, a época, o estilo. Buscas tradicionais
por palavra-chave não resolvem isso.

O Battle of Movies precisa de um endpoint que receba uma query em linguagem
natural e retorne filmes relevantes da base IMDb ranqueados por relevância
semântica e qualidade.

### Pré-requisito obrigatório

Antes de escrever qualquer linha de código, o agente deve ler `dataBase.md`
na raiz do projeto. Esse arquivo contém o schema completo das tabelas
disponíveis no banco apontado por `DATA_URL`. O agente não deve inferir,
assumir ou inventar schema — tudo que não estiver em `dataBase.md` não existe.

### Escopo

**O que muda:**
- Criação de toda a implementação dentro de `/04_SDD`
- Endpoint de busca acessível em `[SITE_URL]/4_SDD/search`
- Endpoint de health check acessível em `[SITE_URL]/4_SDD/health`

**O que não muda:**
- Nenhum arquivo fora de `/04_SDD`
- Nada na raiz do projeto
- Nenhuma leitura de schema além do `dataBase.md`
- Nenhuma chamada externa para dados de filmes

### Estrutura da pasta

```
/04_SDD
  /api
    search.ts       → Netlify Function — busca inteligente
    health.ts       → Netlify Function — health check
  /lib
    query-parser.ts → interpreta a query, extrai intenções
    search.ts       → executa busca no banco via DATA_URL
    ranker.ts       → calcula relevanceScore e ordena
    db.ts           → conexão com o banco — singleton com pool
    validators.ts   → valida parâmetros de entrada
    types.ts        → tipos TypeScript compartilhados
  /scripts
    setup-db.js     → cria índices e view necessários
  package.json
  tsconfig.json
  .env.example
  README.md
```

> ⚠️ Netlify exige que as Functions estejam em `/04_SDD/api` e que o
> `netlify.toml` dentro de `/04_SDD` aponte o functions directory correto.
> O agente deve criar esse `netlify.toml` dentro de `/04_SDD`.

### User Stories (notação EARS)

**US-01 — Busca por descrição**
WHEN o usuário submete uma query em linguagem natural não vazia
THE SYSTEM SHALL retornar uma lista paginada de filmes relevantes
ordenados por relevância semântica decrescente combinada com qualidade IMDb

**US-02 — Busca em português**
WHEN o usuário submete uma query com termos em português
THE SYSTEM SHALL considerar títulos alternativos em português disponíveis
no banco conforme schema em `dataBase.md`

**US-03 — Query ambígua**
WHEN o usuário submete uma query de baixa especificidade
THE SYSTEM SHALL retornar resultados com o campo `confidence`
abaixo de 0.3 sem retornar erro

**US-04 — Query vazia**
WHEN o usuário submete uma query em branco ou ausente
THE SYSTEM SHALL retornar HTTP 400 com erro `INVALID_QUERY`

**US-05 — Sem resultados**
WHEN a query não encontra filmes correspondentes
THE SYSTEM SHALL retornar HTTP 200 com lista vazia — nunca HTTP 404

**US-06 — Paginação**
WHEN o usuário submete uma query sem parâmetro de página
THE SYSTEM SHALL retornar os primeiros 10 resultados
e indicar se existe página seguinte

**US-07 — Performance**
WHILE o sistema está operacional
THE SYSTEM SHALL retornar resposta para qualquer query em menos de 2 segundos

### Critérios de Aceite

**CA-01 — Campos obrigatórios na resposta**
Cada filme retornado contém:
- `tconst` (string) — identificador IMDb
- `primaryTitle` (string) — título principal
- `startYear` (integer, nullable) — ano de lançamento
- `genres` (string[]) — array de gêneros
- `runtimeMinutes` (integer, nullable) — duração em minutos
- `averageRating` (float) — nota IMDb entre 0.0 e 10.0
- `numVotes` (integer) — total de votos
- `relevanceScore` (float) — score entre 0.0 e 1.0

**CA-02 — Ranqueamento**
- Filmes com `numVotes < 1000` não aparecem nos primeiros 5 resultados
- O primeiro resultado tem `relevanceScore` >= ao último
- Filmes com `isAdult = 1` nunca aparecem

**CA-03 — Resposta de busca**
A resposta contém:
- `query` (string) — query original do usuário
- `total` (integer) — total de resultados em todas as páginas
- `page` (integer) — página atual
- `limit` (integer) — resultados por página
- `has_next_page` (boolean)
- `confidence` (float entre 0.0 e 1.0)
- `results` (array de filmes)

**CA-04 — Erros estruturados**
Erros retornam:
- `error` (string) — `INVALID_QUERY` | `INVALID_PARAMETER` | `INTERNAL_ERROR`
- `message` (string) — descrição legível
- `status` (integer) — HTTP status code

**CA-05 — Health check**
`GET [SITE_URL]/4_SDD/health` retorna:
- `status`: `"ok"` | `"degraded"`
- `database`: `"connected"` | `"unreachable"`
- `latency_ms` (integer, nullable)

---

## plan.md

### Pré-requisito

Ler `dataBase.md` na raiz antes de qualquer decisão de implementação.
O schema das queries, joins e filtros deve ser derivado exclusivamente desse arquivo.

### Arquitetura

```
Query do usuário
      ↓
Netlify Function — [SITE_URL]/4_SDD/search
      ↓
lib/validators.ts     ← valida parâmetros de entrada
      ↓
lib/query-parser.ts   ← interpreta a query, extrai intenções
      ↓
lib/search.ts         ← executa query SQL via DATA_URL
      ↓
lib/ranker.ts         ← calcula relevanceScore e ordena
      ↓
Resposta JSON paginada
```

### Configuração Netlify

O arquivo `/04_SDD/netlify.toml` deve conter:

```toml
[build]
  functions = "api"
  publish = "public"

[[redirects]]
  from = "/4_SDD/search"
  to = "/.netlify/functions/search"
  status = 200

[[redirects]]
  from = "/4_SDD/health"
  to = "/.netlify/functions/health"
  status = 200
```

### Conexão com o banco

A conexão usa exclusivamente `DATA_URL`:

```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATA_URL,
  ssl: { rejectUnauthorized: false } // obrigatório para Neon
});
```

> ⚠️ O parâmetro `ssl: { rejectUnauthorized: false }` é obrigatório para
> conexões com o Neon via Netlify Functions. Sem ele a conexão falha silenciosamente.

### Ranqueamento

```
quality_score = average_rating × log10(num_votes + 1) / 10
relevance_score final = 0.7 × semantic + 0.3 × quality
```

### Paginação

`LIMIT` e `OFFSET` no SQL. Total calculado em query separada com `COUNT(*)`.

---

## tasks.md

### FASE 1 — Leitura obrigatória

- [ ] T01 Ler `dataBase.md` na raiz do projeto
- [ ] T02 Mapear as tabelas e colunas disponíveis para a feature de busca
- [ ] T03 Identificar a coluna de títulos alternativos em português (se existir)
- [ ] T04 Confirmar os nomes exatos das colunas antes de escrever qualquer query

### FASE 2 — Setup do projeto

- [ ] T05 Criar `/04_SDD/package.json` com dependências isoladas
- [ ] T06 Criar `/04_SDD/tsconfig.json` com `strict: true`
- [ ] T07 Criar `/04_SDD/.env.example` com `DATA_URL` e `NODE_ENV`
- [ ] T08 Criar `/04_SDD/netlify.toml` com redirects para `/4_SDD/search` e `/4_SDD/health`
- [ ] T09 Criar `/04_SDD/scripts/setup-db.js` criando índices e view necessários
        usando `DATA_URL` — sem criar tabelas (schema já existe)

### FASE 3 — Camada de dados

- [ ] T10 Criar `/04_SDD/lib/types.ts` com interfaces `Movie`, `SearchResponse`,
          `ErrorResponse`, `HealthResponse`
- [ ] T11 Criar `/04_SDD/lib/db.ts` com singleton de conexão via `DATA_URL`
          incluindo `ssl: { rejectUnauthorized: false }`
- [ ] T12 Criar `/04_SDD/lib/validators.ts` validando `q`, `page`, `limit`,
          `min_rating`, `min_votes`
- [ ] T13 Criar `/04_SDD/lib/query-parser.ts` extraindo gênero, década
          e atributos qualitativos da query
- [ ] T14 Criar `/04_SDD/lib/search.ts` com queries derivadas do schema em `dataBase.md`
- [ ] T15 Criar `/04_SDD/lib/ranker.ts` calculando `relevanceScore`

### FASE 4 — API

- [ ] T16 Criar `/04_SDD/api/search.ts` como Netlify Function
- [ ] T17 Integrar `validators` + `query-parser` + `search` + `ranker`
- [ ] T18 Implementar paginação com `LIMIT`/`OFFSET` e `COUNT(*)`
- [ ] T19 Implementar respostas de erro estruturadas (400, 500)
- [ ] T20 Criar `/04_SDD/api/health.ts` testando conexão via `DATA_URL`

### FASE 5 — Validação

- [ ] T21 Confirmar que a URL `/4_SDD/search?q=` responde após deploy no Netlify
- [ ] T22 Confirmar que `/4_SDD/health` retorna `status: ok`
- [ ] T23 Testar query em português
- [ ] T24 Testar query vazia → HTTP 400
- [ ] T25 Testar query sem resultado → HTTP 200 com lista vazia
- [ ] T26 Confirmar que filmes com `isAdult = 1` não aparecem
- [ ] T27 Confirmar resposta em menos de 2 segundos
- [ ] T28 Confirmar que nenhum arquivo foi criado fora de `/04_SDD`
- [ ] T29 Documentar setup, variáveis de ambiente e deploy no `/04_SDD/README.md`
