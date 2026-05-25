import type { Pool } from 'pg';
import type { ParsedQuery } from './types';

// Linha retornada pelo banco antes do ranqueamento final
export interface SearchRawRow {
  tconst: string;
  primaryTitle: string;
  startYear: number | null;
  genres: string[] | null;
  runtimeMinutes: number | null;
  averageRating: number;
  numVotes: number;
  qualityScore: number | null;
  semanticScore: number;
}

export interface SearchRawResult {
  rows: SearchRawRow[];
  total: number;
}

/**
 * Executa a busca na view movies_search usando queries parametrizadas.
 * Retorna rows com semanticScore e qualityScore para o ranker calcular
 * o relevanceScore final.
 *
 * Segurança: todos os valores do usuário são passados como parâmetros — 
 * sem interpolação de string no SQL.
 */
export async function executeSearch(
  pool: Pool,
  rawQuery: string,
  parsed: ParsedQuery,
  page: number,
  limit: number,
): Promise<SearchRawResult> {
  const { genres, yearFrom, yearTo, requiredTerms } = parsed;

  const params: unknown[] = [];
  const whereClauses: string[] = [
    'average_rating IS NOT NULL',
    'num_votes >= 1000',
  ];

  // $1 — query bruta para word_similarity (sempre o primeiro parâmetro)
  params.push(rawQuery);
  const rawIdx = params.length; // 1

  // Filtro por gênero (operador de interseção de arrays, usa índice GIN)
  if (genres.length > 0) {
    params.push(genres);
    whereClauses.push(`genres && $${params.length}::text[]`);
  }

  // Filtro por faixa de ano
  if (yearFrom !== null) {
    params.push(yearFrom);
    whereClauses.push(`start_year >= $${params.length}`);
  }
  if (yearTo !== null) {
    params.push(yearTo);
    whereClauses.push(`start_year <= $${params.length}`);
  }

  // Filtro por termos obrigatórios (nomes próprios / palavras capitalizadas)
  if (requiredTerms.length > 0) {
    const termStr = requiredTerms.join(' ');
    params.push(termStr);
    const termIdx = params.length;
    whereClauses.push(
      `(word_similarity($${termIdx}, primary_title) > 0.2`
      + ` OR word_similarity($${termIdx}, original_title) > 0.2`
      + ` OR EXISTS (`
      + `   SELECT 1 FROM UNNEST(pt_titles) AS _pt`
      + `   WHERE word_similarity($${termIdx}, _pt) > 0.2`
      + ` ))`,
    );
  }

  const whereSQL = whereClauses.join('\n    AND ');

  // Expressão de score semântico: maior similaridade entre a query e
  // primary_title, original_title e qualquer título em português (pt_titles).
  const semExpr = `GREATEST(
        word_similarity($${rawIdx}, primary_title),
        word_similarity($${rawIdx}, original_title),
        COALESCE(
          (SELECT MAX(word_similarity($${rawIdx}, _pt))
           FROM UNNEST(pt_titles) AS _pt),
          0.0
        )
      )`;

  // Parâmetros de paginação (sempre os últimos)
  params.push(limit);
  const limitIdx = params.length;
  params.push((page - 1) * limit);
  const offsetIdx = params.length;

  // CTE: calcula semantic_score uma vez por linha
  // ORDER BY: combina semântica (70%) + qualidade (30%)
  const dataSql = `
    WITH scored AS (
      SELECT
        tconst,
        primary_title                 AS "primaryTitle",
        start_year                    AS "startYear",
        genres,
        runtime_minutes               AS "runtimeMinutes",
        CAST(average_rating AS float) AS "averageRating",
        num_votes                     AS "numVotes",
        quality_score                 AS "qualityScore",
        ROUND((${semExpr})::numeric, 4) AS "semanticScore"
      FROM movies_search
      WHERE ${whereSQL}
    )
    SELECT *
    FROM scored
    ORDER BY
      (0.7 * "semanticScore" + 0.3 * COALESCE("qualityScore", 0.0)) DESC,
      "numVotes" DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  // COUNT usa os mesmos WHERE clauses mas sem LIMIT/OFFSET
  const countParams = params.slice(0, params.length - 2);
  const countSql = `
    SELECT COUNT(*) AS total
    FROM movies_search
    WHERE ${whereSQL}
  `;

  const client = await pool.connect();
  try {
    const [dataResult, countResult] = await Promise.all([
      client.query<SearchRawRow>(dataSql, params),
      client.query<{ total: string }>(countSql, countParams),
    ]);

    const totalRow = countResult.rows[0];
    const total = totalRow !== undefined
      ? parseInt(totalRow.total, 10)
      : 0;

    return { rows: dataResult.rows, total };
  } finally {
    client.release();
  }
}
