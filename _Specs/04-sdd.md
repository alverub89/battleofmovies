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
STACK: Netlify Functions + Neon (PostgreSQL serverless) + Node.js + TypeScript
ISOLAMENTO: toda implementação em /battle-of-movies — nada fora dessa pasta
BANCO: queries SQL diretas ao Neon — sem ORM
SEGURANÇA: queries sempre parametrizadas — sem interpolação de string em SQL
TIPAGEM: TypeScript strict — sem any explícito
ADULTOS: filmes com isAdult = 1 nunca aparecem em nenhum resultado
TIPO: apenas titleType = 'movie' nos resultados — sem série, episódio ou short
ERROS: sempre estruturados em JSON com campo error, message e status
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

### Escopo

**O que muda:**
- Criação do endpoint `/api/search`
- Criação do endpoint `/api/search/health`
- Script de ingestão da base IMDb no Neon
- View desnormalizada `movies_search` para a camada de busca

**O que não muda:**
- Nenhum arquivo fora de `/battle-of-movies`
- Nenhuma tabela além de `title_basics`, `title_ratings` e `title_akas`
- Nenhuma chamada externa para dados de filmes

### User Stories (notação EARS)

**US-01 — Busca por descrição**
WHEN o usuário submete uma query em linguagem natural não vazia
THE SYSTEM SHALL retornar uma lista paginada de filmes relevantes
ordenados por relevância semântica decrescente combinada com qualidade IMDb

**US-02 — Busca em português**
WHEN o usuário submete uma query com termos em português
THE SYSTEM SHALL considerar títulos da tabela `title_akas`
com `region IN ('BR', 'PT')` antes de buscar por `primary_title`

**US-03 — Query ambígua**
WHEN o usuário submete uma query de baixa especificidade
THE SYSTEM SHALL retornar resultados com o campo `confidence`
abaixo de 0.3 sem retornar erro

**US-04 — Query vazia**
WHEN o usuário submete uma query em branco ou ausente
THE SYSTEM SHALL retornar HTTP 400 com erro `INVALID_QUERY`

**US-05 — Sem resultados**
WHEN a query não encontra filmes correspondentes na base
THE SYSTEM SHALL retornar HTTP 200 com lista vazia
e nunca retornar HTTP 404

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
`GET /api/search/health` retorna:
- `status`: `"ok"` | `"degraded"`
- `database`: `"connected"` | `"unreachable"`
- `latency_ms` (integer, nullable)

---

## plan.md

### Arquitetura

```
Query do usuário
      ↓
Netlify Function (/api/search)
      ↓
lib/query-parser.ts     ← interpreta a query, extrai intenções
      ↓
lib/search.ts           ← monta e executa a query SQL no Neon
      ↓
lib/ranker.ts           ← calcula relevanceScore e ordena
      ↓
Resposta JSON paginada
```

### Decisões técnicas

**Interpretação da query**
A query é processada em `lib/query-parser.ts` antes de chegar ao banco.
O parser extrai: gênero provável, década, atributos qualitativos (ex:
"triste", "assustador", "inspirador") e termos em português para lookup
em `title_akas`.

**Busca no banco**
`lib/search.ts` consulta a view `movies_search` usando `pg_trgm` para
similaridade textual e filtros SQL derivados do parser. Sem full-text
search externo — tudo dentro do Neon.

**Ranqueamento**
`lib/ranker.ts` combina relevância semântica (0.0–1.0) com score de
qualidade calculado como:
```
quality_score = average_rating × log10(num_votes + 1) / 10
relevance_score final = 0.7 × semantic + 0.3 × quality
```

**Paginação**
`LIMIT` e `OFFSET` no SQL. Total calculado em query separada com `COUNT(*)`.

### Módulos a criar

| Arquivo | Responsabilidade |
|---|---|
| `/api/search.ts` | Netlify Function — recebe request, valida, chama lib, retorna response |
| `/api/search/health.ts` | Netlify Function — testa conexão com Neon |
| `/lib/query-parser.ts` | Extrai intenções da query em linguagem natural |
| `/lib/search.ts` | Executa busca no Neon via `movies_search` |
| `/lib/ranker.ts` | Calcula `relevanceScore` e ordena resultados |
| `/lib/db.ts` | Conexão com Neon — singleton com pool |
| `/lib/validators.ts` | Valida parâmetros de entrada |
| `/lib/types.ts` | Tipos TypeScript compartilhados |
| `/scripts/ingest.js` | Lê TSVs e popula `title_basics`, `title_ratings`, `title_akas` |
| `/scripts/setup-db.js` | Cria tabelas, índices, extensão `pg_trgm` e view `movies_search` |

---

## tasks.md

### FASE 1 — Banco de dados

- [ ] T01 Habilitar extensão `pg_trgm` no Neon
- [ ] T02 Criar tabela `title_basics` com índices
- [ ] T03 Criar tabela `title_ratings` com índices
- [ ] T04 Criar tabela `title_akas` com índices
- [ ] T05 Criar view `movies_search`
- [ ] T06 Escrever script `scripts/setup-db.js` executando T01–T05
- [ ] T07 Escrever script `scripts/ingest.js` para `title_basics`
        — filtrar `titleType = 'movie'` e `isAdult = 0`
        — converter `\N` para `NULL`
- [ ] T08 Escrever script `scripts/ingest.js` para `title_ratings`
- [ ] T09 Escrever script `scripts/ingest.js` para `title_akas`
        — filtrar `region IN ('BR', 'PT', 'US', 'GB')` + `is_original_title`
- [ ] T10 Validar ingestão — contar registros e verificar integridade

### FASE 2 — Camada de dados

- [ ] T11 Criar `lib/types.ts` com interfaces `Movie`, `SearchResponse`, `ErrorResponse`, `HealthResponse`
- [ ] T12 Criar `lib/db.ts` com singleton de conexão ao Neon
- [ ] T13 Criar `lib/validators.ts` validando `q`, `page`, `limit`, `min_rating`, `min_votes`
- [ ] T14 Criar `lib/query-parser.ts` extraindo gênero, década e atributos qualitativos
- [ ] T15 Criar `lib/search.ts` consultando `movies_search` com filtros derivados do parser
- [ ] T16 Criar `lib/ranker.ts` calculando `relevanceScore` e ordenando resultados

### FASE 3 — API

- [ ] T17 Criar `api/search.ts` validando parâmetros via `validators.ts`
- [ ] T18 Integrar `query-parser` + `search` + `ranker` no fluxo do endpoint
- [ ] T19 Implementar paginação com `LIMIT`/`OFFSET` e `COUNT(*)`
- [ ] T20 Implementar respostas de erro estruturadas (400, 500)
- [ ] T21 Criar `api/search/health.ts` testando conexão com Neon
- [ ] T22 Criar `.env.example` com `DATABASE_URL` e `NODE_ENV`

### FASE 4 — Validação

- [ ] T23 Testar US-02: query em português retorna resultados relevantes
- [ ] T24 Testar US-04: query vazia retorna HTTP 400
- [ ] T25 Testar US-05: query sem resultado retorna HTTP 200 com lista vazia
- [ ] T26 Testar CA-02: filmes com `isAdult = 1` não aparecem
- [ ] T27 Testar CA-07: resposta em menos de 2 segundos
- [ ] T28 Testar CA-05: health check confirma conexão com Neon
- [ ] T29 Documentar setup e deploy no README
