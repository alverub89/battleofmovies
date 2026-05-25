# 04 — SDD: Busca Inteligente de Filmes

Implementação da feature de busca em linguagem natural sobre a base IMDb,
usando TypeScript, Netlify Functions e `pg_trgm` para scoring semântico sem
dependência de LLM externo.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript 5 (`strict: true`) |
| Build | esbuild (bundle + tree-shake) |
| Runtime | Netlify Functions (Node 18) |
| Banco | Neon (PostgreSQL serverless) via `pg` |
| Semântica | `pg_trgm` — `word_similarity()` |
| Frontend | HTML/CSS/JS puro (dark theme, sem framework) |

---

## Pré-requisitos

- Node.js >= 18
- Banco Neon com a view `movies_search` e a extensão `pg_trgm` ativadas

---

## Configuração

### 1. Instalar dependências

```bash
npm --prefix 04_SDD install
```

### 2. Configurar variável de ambiente

No painel do Netlify (ou em `.env` local para testes), defina:

```
DATA_URL=postgresql://user:password@host/dbname?sslmode=require
```

### 3. Configurar o banco (primeiro deploy ou ambiente novo)

Execute manualmente o script de setup para ativar `pg_trgm` e criar a view:

```bash
# Na raiz do projeto
DATA_URL=postgresql://... node 04_SDD/scripts/setup-db.js
```

> O script é idempotente (`CREATE EXTENSION IF NOT EXISTS`, `CREATE OR REPLACE VIEW`).

---

## Build

```bash
npm --prefix 04_SDD run build
```

Gera os bundles em `04_SDD/.dist/`:
- `search.js` — handler da busca
- `health.js` — handler de health check

O build do Netlify copia esses arquivos automaticamente para `netlify/functions/`.

---

## Endpoints

### `GET /4_SDD/search`

Busca filmes em linguagem natural.

**Query params:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `q` | string | Sim | — | Texto da busca (máx. 200 chars) |
| `page` | integer | Não | 1 | Página (>= 1) |
| `limit` | integer | Não | 10 | Resultados por página (1–50) |

**Resposta 200:**

```json
{
  "query": "terror anos 80",
  "total": 142,
  "page": 1,
  "limit": 10,
  "has_next_page": true,
  "confidence": 0.8,
  "results": [
    {
      "tconst": "tt0123456",
      "primaryTitle": "The Shining",
      "startYear": 1980,
      "genres": ["Horror", "Drama"],
      "runtimeMinutes": 146,
      "averageRating": 8.4,
      "numVotes": 1000000,
      "relevanceScore": 0.8231
    }
  ]
}
```

**Campo `confidence`:** float 0.0–1.0. Valores < 0.3 indicam busca muito vaga — o frontend exibe um alerta.

**Resposta 400 (query inválida):**

```json
{
  "error": "INVALID_QUERY",
  "message": "O parâmetro 'q' é obrigatório e não pode estar vazio.",
  "status": 400
}
```

---

### `GET /4_SDD/health`

Verifica conectividade com o banco.

**Resposta 200:**

```json
{
  "status": "ok",
  "database": "connected",
  "latency_ms": 48
}
```

**Resposta 503 (banco inacessível):**

```json
{
  "status": "degraded",
  "database": "unreachable",
  "latency_ms": null
}
```

---

## Estrutura de arquivos

```
04_SDD/
├── api/
│   ├── health.ts        # Netlify Function — health check
│   └── search.ts        # Netlify Function — busca
├── lib/
│   ├── db.ts            # Pool singleton pg
│   ├── query-parser.ts  # NLP em português → ParsedQuery
│   ├── ranker.ts        # SearchRawRow[] → Movie[] com relevanceScore
│   ├── search.ts        # Executa SQL parametrizado + paginação
│   ├── types.ts         # Interfaces TypeScript compartilhadas
│   └── validators.ts    # Valida e normaliza query params HTTP
├── scripts/
│   └── setup-db.js      # Setup manual: pg_trgm + view movies_search
├── .dist/               # Bundles gerados pelo build (gitignored)
├── .env.example         # Template de variáveis de ambiente
├── app.js               # Frontend JS
├── index.html           # Frontend HTML
├── style.css            # Frontend CSS (dark theme)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Como o score de relevância é calculado

```
relevanceScore = clamp(0.7 × semanticScore + 0.3 × qualityScore, 0, 1)

semanticScore = MAX(
  word_similarity(query, primary_title),
  word_similarity(query, original_title),
  MAX(word_similarity(query, pt_title) FOR pt_title IN pt_titles)
)

qualityScore = ROUND((average_rating × LOG(num_votes + 1) / 10), 4)
               -- pré-calculado na view movies_search
```

Filtros obrigatórios no SQL: `average_rating IS NOT NULL AND num_votes >= 1000`.

---

## Typecheck

```bash
npm --prefix 04_SDD run typecheck
```
