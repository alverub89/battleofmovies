'use strict';

/**
 * setup-db.js — Garante que a extensão pg_trgm e a view movies_search
 * estão criadas no banco apontado por DATA_URL.
 *
 * Uso: node scripts/setup-db.js
 * Variável obrigatória: DATA_URL
 */

const { Pool } = require('pg');

const dataUrl = process.env.DATA_URL;
if (!dataUrl) {
  console.error('[setup-db] Erro: DATA_URL não está definida.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dataUrl,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const EXTENSION_SQL = `
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
`;

// View desnormalizada para uso direto pela camada de busca.
// Derivada de dataBase.md — não modificar sem atualizar o schema.
const VIEW_SQL = `
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
    CASE
      WHEN r.average_rating IS NOT NULL AND r.num_votes IS NOT NULL
      THEN ROUND(
        (r.average_rating * LOG(r.num_votes + 1) / 10)::NUMERIC,
        4
      )
      ELSE NULL
    END AS quality_score,
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
`;

async function setup() {
  const client = await pool.connect();
  try {
    console.log('[setup-db] Criando extensão pg_trgm...');
    await client.query(EXTENSION_SQL);
    console.log('[setup-db] ✓ pg_trgm OK');

    console.log('[setup-db] Recriando view movies_search...');
    await client.query(VIEW_SQL);
    console.log('[setup-db] ✓ movies_search OK');

    console.log('[setup-db] Setup concluído.');
  } catch (err) {
    console.error('[setup-db] Erro:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
