-- =============================================================
-- MIGRATION: Battle of Movies — Busca Inteligente IMDb
-- Banco: Neon (PostgreSQL serverless)
-- Autor: Rubens Alves
-- Data: 26/05/2026
-- Executar: psql $DATABASE_URL -f migration.sql
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- EXTENSÕES
-- -------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- -------------------------------------------------------------
-- TABELA: title_basics
-- Fonte: title.basics.tsv.gz
-- Filtros de ingestão:
--   titleType = 'movie'
--   isAdult = 0
--   \N → NULL em todas as colunas
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS title_basics (
  tconst          VARCHAR(12)   NOT NULL,
  primary_title   TEXT          NOT NULL,
  original_title  TEXT          NOT NULL,
  start_year      SMALLINT      NULL,
  runtime_minutes INTEGER       NULL,
  genres          TEXT[]        NULL,

  CONSTRAINT pk_title_basics PRIMARY KEY (tconst)
);

-- Índice: filtro e ordenação por ano
CREATE INDEX IF NOT EXISTS idx_title_basics_start_year
  ON title_basics (start_year);

-- Índice: busca por similaridade no título principal
CREATE INDEX IF NOT EXISTS idx_title_basics_primary_title_trgm
  ON title_basics USING GIN (primary_title gin_trgm_ops);

-- Índice: busca e filtragem por gênero (array)
CREATE INDEX IF NOT EXISTS idx_title_basics_genres
  ON title_basics USING GIN (genres);


-- -------------------------------------------------------------
-- TABELA: title_ratings
-- Fonte: title.ratings.tsv.gz
-- Nota: nem todo filme em title_basics tem avaliação
--       ausência de linha ≠ NULL — é simplesmente sem dados
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS title_ratings (
  tconst         VARCHAR(12)   NOT NULL,
  average_rating NUMERIC(3, 1) NOT NULL,
  num_votes      INTEGER       NOT NULL,

  CONSTRAINT pk_title_ratings     PRIMARY KEY (tconst),
  CONSTRAINT fk_title_ratings_basics
    FOREIGN KEY (tconst) REFERENCES title_basics (tconst)
    ON DELETE CASCADE
);

-- Índice: filtro e ordenação por nota
CREATE INDEX IF NOT EXISTS idx_title_ratings_average_rating
  ON title_ratings (average_rating);

-- Índice: filtro por volume de votos
CREATE INDEX IF NOT EXISTS idx_title_ratings_num_votes
  ON title_ratings (num_votes);

-- Índice composto: ranqueamento (nota × votos juntos)
CREATE INDEX IF NOT EXISTS idx_title_ratings_ranking
  ON title_ratings (average_rating DESC, num_votes DESC);


-- -------------------------------------------------------------
-- TABELA: title_akas
-- Fonte: title.akas.tsv.gz
-- Filtros de ingestão:
--   region IN ('BR', 'PT', 'US', 'GB') OR is_original_title = true
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS title_akas (
  title_id         VARCHAR(12)  NOT NULL,
  ordering         SMALLINT     NOT NULL,
  title            TEXT         NOT NULL,
  region           CHAR(4)      NULL,
  language         CHAR(3)      NULL,
  is_original_title BOOLEAN     NOT NULL DEFAULT FALSE,

  CONSTRAINT pk_title_akas PRIMARY KEY (title_id, ordering),
  CONSTRAINT fk_title_akas_basics
    FOREIGN KEY (title_id) REFERENCES title_basics (tconst)
    ON DELETE CASCADE
);

-- Índice: lookup por title_id (join com title_basics)
CREATE INDEX IF NOT EXISTS idx_title_akas_title_id
  ON title_akas (title_id);

-- Índice: filtro por região (busca em português)
CREATE INDEX IF NOT EXISTS idx_title_akas_region
  ON title_akas (region);

-- Índice: busca por similaridade em títulos localizados
CREATE INDEX IF NOT EXISTS idx_title_akas_title_trgm
  ON title_akas USING GIN (title gin_trgm_ops);

-- Índice: títulos originais
CREATE INDEX IF NOT EXISTS idx_title_akas_is_original
  ON title_akas (is_original_title)
  WHERE is_original_title = TRUE;


-- -------------------------------------------------------------
-- VIEW: movies_search
-- View desnormalizada para uso direto pela camada de busca.
-- Elimina joins em tempo de query.
-- Agrega títulos em português (BR e PT) como array.
-- -------------------------------------------------------------

CREATE OR REPLACE VIEW movies_search AS
SELECT
  b.tconst,
  b.primary_title,
  b.original_title,
  b.start_year,
  b.runtime_minutes,
  b.genres,
  r.average_rating,
  r.num_votes,
  -- Score de qualidade pré-calculado para ranqueamento
  -- Fórmula: average_rating × log10(num_votes + 1) / 10
  -- Resultado entre 0.0 e 1.0 (nota máxima 10 × log10(enorme) / 10)
  CASE
    WHEN r.average_rating IS NOT NULL AND r.num_votes IS NOT NULL
    THEN ROUND(
      (r.average_rating * LOG(r.num_votes + 1) / 10)::NUMERIC,
      4
    )
    ELSE NULL
  END AS quality_score,
  -- Títulos em português para suporte a queries em PT-BR
  ARRAY_AGG(DISTINCT a.title)
    FILTER (WHERE a.region IN ('BR', 'PT'))
  AS pt_titles
FROM title_basics b
LEFT JOIN title_ratings r
  ON b.tconst = r.tconst
LEFT JOIN title_akas a
  ON b.tconst = a.title_id
GROUP BY
  b.tconst,
  b.primary_title,
  b.original_title,
  b.start_year,
  b.runtime_minutes,
  b.genres,
  r.average_rating,
  r.num_votes;


-- -------------------------------------------------------------
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- -------------------------------------------------------------

COMMENT ON TABLE title_basics IS
  'Dados principais dos filmes. Apenas titleType=movie e isAdult=0.
   Fonte: title.basics.tsv.gz da base pública IMDb.';

COMMENT ON TABLE title_ratings IS
  'Notas e votos dos filmes. Nem todo filme tem avaliação.
   Ausência de linha ≠ NULL — o filme simplesmente não tem dados de rating.
   Fonte: title.ratings.tsv.gz da base pública IMDb.';

COMMENT ON TABLE title_akas IS
  'Títulos alternativos por região e idioma.
   Carregados apenas region IN (BR, PT, US, GB) + is_original_title=true.
   Fonte: title.akas.tsv.gz da base pública IMDb.';

COMMENT ON VIEW movies_search IS
  'View desnormalizada para uso direto pela camada de busca.
   Une title_basics + title_ratings + title_akas.
   Inclui quality_score pré-calculado e pt_titles para busca em português.
   Não usar para inserção ou atualização — é read-only.';

COMMENT ON COLUMN title_basics.tconst IS
  'Identificador único IMDb. Formato: tt seguido de 7-8 dígitos. Ex: tt0107048';
COMMENT ON COLUMN title_basics.genres IS
  'Array de gêneros. Máximo 3 valores por filme conforme IMDb.';
COMMENT ON COLUMN title_ratings.average_rating IS
  'Média ponderada de todas as avaliações individuais. Escala 0.0–10.0.';
COMMENT ON COLUMN title_ratings.num_votes IS
  'Total de votos. Mínimo 5 para aparecer na base pública do IMDb.';
COMMENT ON COLUMN title_akas.is_original_title IS
  'true quando este é o título original da produção no idioma de origem.';


COMMIT;

-- =============================================================
-- VERIFICAÇÃO PÓS-MIGRATION
-- Execute após o COMMIT para confirmar que tudo foi criado.
-- =============================================================

-- Tabelas criadas
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(quote_ident(tablename))) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('title_basics', 'title_ratings', 'title_akas')
ORDER BY tablename;

-- Índices criados
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('title_basics', 'title_ratings', 'title_akas')
ORDER BY tablename, indexname;

-- View criada
SELECT viewname FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'movies_search';

-- Extensão habilitada
SELECT extname, extversion FROM pg_extension
WHERE extname = 'pg_trgm';