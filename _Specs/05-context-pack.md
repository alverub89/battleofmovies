# Context Pack — Battle of Movies

> Busca Inteligente de Filmes por Linguagem Natural
> Leia todos os documentos antes de escrever qualquer linha de código.
> Este pack contém PRD + ADR + BDD + API Spec + Data Dictionary + AGENTS.md

---

## DOCUMENTO 1 — PRD

### Problema
Usuários que querem assistir a um filme frequentemente não sabem o título —
sabem o que querem sentir, o gênero, a época, o estilo. Buscas tradicionais
por palavra-chave não resolvem isso.

### Objetivo
Permitir que o usuário encontre filmes descrevendo em linguagem natural o que
quer assistir, sem precisar saber o título ou usar filtros manuais.

### Usuário-alvo
Pessoa que quer assistir a um filme mas não sabe qual. Sabe o que quer sentir,
o gênero aproximado ou uma referência vaga. Não quer navegar por catálogo nem
aplicar filtro por filtro.

### Funcionalidades
1. Input de texto livre — sem vocabulário controlado
2. Processamento da query mapeando intenção para atributos da base
3. Consulta à base IMDb filtrando por `titleType = movie`
4. Ranqueamento por relevância semântica × qualidade (`averageRating` × peso logarítmico de `numVotes`)
5. Resposta paginada com título, ano, gêneros, duração, nota e `relevanceScore`

### Critérios de sucesso
- Resultado relevante nos primeiros 5 itens em 80% das queries
- Tempo de resposta abaixo de 2 segundos
- Busca funcional com termos em português
- Resultado útil mesmo para queries ambíguas

### Fora do escopo
- Busca por ator ou diretor
- Filtros manuais por interface
- Recomendação baseada em histórico
- Séries, episódios ou shorts
- Streaming availability

---

## DOCUMENTO 2 — ADR

### ADR-001 — Decisões Arquiteturais

**Contexto:** Feature de busca inteligente em cima da base IMDb. Implementação
isolada no repositório existente. Stack do projeto: Netlify + Neon.

**Decisão:** Toda a implementação vive em `/battle-of-movies` na raiz do
repositório. Nada fora dessa pasta é criado, modificado ou removido.

```
/battle-of-movies
  /api        → Netlify Functions
  /scripts    → ingestão da base IMDb
  /lib        → lógica de busca e ranqueamento
  /ui         → interface de busca
  README.md
  package.json
```

| Decisão | Escolha | Motivo |
|---|---|---|
| Deploy | Netlify Functions | Sem servidor. HTTP → JSON. Integração nativa com Neon. |
| Banco | Neon (PostgreSQL serverless) | Stack existente. Suporte a `pg_trgm`. |
| Runtime | Node.js + TypeScript | Consistência com o projeto. |
| ORM | Nenhum — SQL direto | Controle total das queries. |
| Ingestão | Script local | Execução única antes do deploy. |

**Consequências:**
- Implementação isolada — sem risco para o restante do repositório
- Stack consistente com o projeto existente
- Ingestão inicial exige execução manual do script antes do primeiro deploy

---

## DOCUMENTO 3 — BDD

```gherkin
Feature: Busca inteligente de filmes por linguagem natural
  Como usuário do Battle of Movies
  Quero buscar filmes descrevendo em linguagem natural o que quero assistir
  Para encontrar filmes relevantes sem precisar saber o título

  Background:
    Given a base IMDb está carregada no Neon com title_basics,
          title_ratings e title_akas
    And o sistema está disponível e respondendo via Netlify Function

  Scenario: Busca por gênero e década
    Given o usuário digita "filmes de terror dos anos 80"
    When o sistema processa a query
    Then retorna no mínimo 5 filmes com titleType "movie"
    And todos contêm o gênero "Horror"
    And todos têm startYear entre 1980 e 1989
    And os resultados estão ordenados por relevância decrescente

  Scenario: Busca por sentimento e estilo
    Given o usuário digita "filme para chorar com final triste"
    When o sistema processa a query
    Then retorna no mínimo 5 filmes com gênero "Drama" ou "Romance"
    And todos têm averageRating >= 6.0

  Scenario: Busca com termo em português
    Given o usuário digita "filme de guerra"
    When o sistema processa a query
    Then o sistema consulta title_akas com region "BR"
    And retorna filmes com gênero "War" ou "Action"

  Scenario: Ranqueamento por qualidade
    Given o usuário digita "comédia romântica"
    When o sistema processa a query
    Then filmes com numVotes < 1000 não aparecem nos primeiros 5
    And o primeiro resultado tem averageRating >= ao último

  Scenario: Primeira página de resultados
    Given o usuário digita "filme de ação" sem parâmetro de página
    When o sistema processa a query
    Then retorna exatamente 10 filmes
    And a resposta inclui total e indicação de próxima página

  Scenario: Performance
    Given qualquer query válida
    When o sistema processa a query
    Then retorna resposta em menos de 2 segundos

  Scenario: Query ambígua
    Given o usuário digita "aquele filme sabe né"
    When o sistema processa a query
    Then não retorna erro
    And a resposta indica baixa confiança no resultado

  Scenario: Sem resultados
    Given o usuário digita "filme do planeta Zorbak"
    When o sistema processa a query
    Then retorna lista vazia com status HTTP 200

  Scenario: Query vazia
    Given o usuário envia query em branco
    When o sistema processa a query
    Then retorna status HTTP 400 com mensagem de erro

  Scenario: Estrutura da resposta
    Given qualquer query válida
    When o sistema processa a query
    Then cada filme retornado contém:
      | campo          | tipo    |
      | tconst         | string  |
      | primaryTitle   | string  |
      | startYear      | integer |
      | genres         | array   |
      | runtimeMinutes | integer |
      | averageRating  | float   |
      | numVotes       | integer |
      | relevanceScore | float   |
    And relevanceScore está entre 0.0 e 1.0
    And nenhum filme tem isAdult = 1
    And nenhum filme tem titleType diferente de "movie"
```

---

## DOCUMENTO 4 — API Spec

```yaml
openapi: 3.1.0
info:
  title: Battle of Movies — API de Busca Inteligente
  version: 1.0.0

servers:
  - url: https://battle-of-movies.netlify.app/api
  - url: http://localhost:8888/api

paths:
  /search:
    get:
      parameters:
        - name: q
          in: query
          required: true
          schema: { type: string, minLength: 1, maxLength: 500 }
        - name: page
          in: query
          schema: { type: integer, minimum: 1, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
        - name: min_rating
          in: query
          schema: { type: number, minimum: 0.0, maximum: 10.0 }
        - name: min_votes
          in: query
          schema: { type: integer, minimum: 0, default: 1000 }
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  query:         { type: string }
                  total:         { type: integer }
                  page:          { type: integer }
                  limit:         { type: integer }
                  has_next_page: { type: boolean }
                  confidence:    { type: number, minimum: 0.0, maximum: 1.0 }
                  results:
                    type: array
                    items:
                      type: object
                      required:
                        - tconst
                        - primaryTitle
                        - startYear
                        - genres
                        - averageRating
                        - numVotes
                        - relevanceScore
                      properties:
                        tconst:         { type: string }
                        primaryTitle:   { type: string }
                        startYear:      { type: integer }
                        genres:         { type: array, items: { type: string } }
                        runtimeMinutes: { type: integer, nullable: true }
                        averageRating:  { type: number, minimum: 0.0, maximum: 10.0 }
                        numVotes:       { type: integer }
                        relevanceScore: { type: number, minimum: 0.0, maximum: 1.0 }
        "400":
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:   { type: string, enum: [INVALID_QUERY, INVALID_PARAMETER] }
                  message: { type: string }
                  status:  { type: integer }
        "500":
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:   { type: string, enum: [INTERNAL_ERROR] }
                  message: { type: string }
                  status:  { type: integer }

  /search/health:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:     { type: string, enum: [ok, degraded] }
                  database:   { type: string, enum: [connected, unreachable] }
                  latency_ms: { type: integer, nullable: true }
```

---

## DOCUMENTO 5 — Data Dictionary

### Tabela: `title_basics`

| Coluna | Tipo PostgreSQL | Nulo | Descrição |
|---|---|---|---|
| `tconst` | `VARCHAR(12)` | NOT NULL | PK. ID único IMDb. Ex: `tt0107048` |
| `primary_title` | `TEXT` | NOT NULL | Título principal |
| `original_title` | `TEXT` | NOT NULL | Título no idioma original |
| `start_year` | `SMALLINT` | NULL | Ano de lançamento |
| `runtime_minutes` | `SMALLINT` | NULL | Duração em minutos |
| `genres` | `TEXT[]` | NULL | Array de gêneros. Máx 3. Índice GIN. |

**Índices:** `start_year` · `genres` (GIN) · `primary_title` (GIN + `pg_trgm`)

### Tabela: `title_ratings`

| Coluna | Tipo PostgreSQL | Nulo | Descrição |
|---|---|---|---|
| `tconst` | `VARCHAR(12)` | NOT NULL | PK + FK → `title_basics` |
| `average_rating` | `NUMERIC(3,1)` | NOT NULL | Nota IMDb. Escala 0.0–10.0 |
| `num_votes` | `INTEGER` | NOT NULL | Total de votos |

**Índices:** `average_rating` · `num_votes`

### Tabela: `title_akas`

| Coluna | Tipo PostgreSQL | Nulo | Descrição |
|---|---|---|---|
| `title_id` | `VARCHAR(12)` | NOT NULL | FK → `title_basics.tconst` |
| `ordering` | `SMALLINT` | NOT NULL | Sequencial por `title_id`. Compõe PK. |
| `title` | `TEXT` | NOT NULL | Título localizado. Índice GIN + `pg_trgm`. |
| `region` | `CHAR(4)` | NULL | Código ISO 3166-1. Ex: `BR`, `US`, `PT` |
| `language` | `CHAR(3)` | NULL | Código ISO 639-2. Ex: `por`, `eng` |
| `is_original_title` | `BOOLEAN` | NOT NULL | `true` = título original da produção |

**PK:** `(title_id, ordering)`

### View: `movies_search`

```sql
CREATE VIEW movies_search AS
SELECT
  b.tconst,
  b.primary_title,
  b.original_title,
  b.start_year,
  b.runtime_minutes,
  b.genres,
  r.average_rating,
  r.num_votes,
  ARRAY_AGG(DISTINCT a.title)
    FILTER (WHERE a.region IN ('BR', 'PT')) AS pt_titles
FROM title_basics b
LEFT JOIN title_ratings r ON b.tconst = r.tconst
LEFT JOIN title_akas a ON b.tconst = a.title_id
GROUP BY
  b.tconst, b.primary_title, b.original_title,
  b.start_year, b.runtime_minutes, b.genres,
  r.average_rating, r.num_votes;
```

### Regras de ingestão

| Regra | Detalhe |
|---|---|
| Filtro de tipo | Apenas `titleType = 'movie'` |
| Filtro adulto | `isAdult = 1` descartado |
| Valor nulo | `\N` → `NULL` |
| Regiões carregadas | `BR`, `PT`, `US`, `GB` + `is_original_title = true` |
| Extensão | `pg_trgm` habilitada antes da ingestão |
| Script | `/battle-of-movies/scripts/ingest.js` |
| Ordem | `title_basics` → `title_ratings` → `title_akas` |

---

## DOCUMENTO 6 — AGENTS.md

### Stack

| Camada | Tecnologia |
|---|---|
| Deploy | Netlify Functions |
| Banco | Neon — PostgreSQL serverless |
| Runtime | Node.js |
| Linguagem | TypeScript (`strict: true`) |

### Onde implementar

Toda a implementação em `/battle-of-movies`. Nada fora dessa pasta.

### Convenções de código

- Sem `any` explícito
- Funções com responsabilidade única — máximo 30 linhas
- Erros sempre tipados — nunca `catch (e: any)`
- Queries ao Neon sempre parametrizadas — sem interpolação em SQL
- Logs estruturados em JSON — sem `console.log` solto em produção
- Variáveis de ambiente via `process.env` com validação no startup

### Variáveis de ambiente

```
DATABASE_URL  → connection string do Neon
NODE_ENV      → development | production
```

### O que não fazer

- Não usar ORM — queries SQL diretas
- Não criar tabelas fora do schema definido
- Não fazer chamada externa para dados de filmes
- Não modificar arquivos fora de `/battle-of-movies`
- Não instalar dependências no `package.json` raiz
- Não expor variáveis de ambiente em logs ou respostas

### Definition of done

- [ ] Script de ingestão popula as três tabelas no Neon sem erro
- [ ] `/api/search?q=` responde com filmes em menos de 2s
- [ ] `/api/search/health` confirma conexão com o Neon
- [ ] Busca em português retorna resultados relevantes
- [ ] Query vazia retorna HTTP 400 com erro estruturado
- [ ] Query sem resultado retorna HTTP 200 com lista vazia
- [ ] Filmes adultos não aparecem em nenhum resultado
- [ ] README documenta ingestão e deploy
