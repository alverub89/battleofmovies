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

  const baseClauses = [
    'average_rating IS NOT NULL',
    'num_votes >= 1000',
  ];

  // Parâmetros de filtro compartilhados (sem rawQuery, sem limit/offset).
  // dataParams  = [rawQuery, ...filterParams, limit, offset]
  // countParams = [...filterParams]
  // Dessa forma, o COUNT nunca recebe parâmetros não referenciados.
  const filterParams: unknown[] = [];
  const dataFilterClauses: string[] = [];   // índices: $2 em diante (rawQuery ocupa $1)
  const countFilterClauses: string[] = [];  // índices: $1 em diante

  // Filtro por gênero
  if (genres.length > 0) {
    filterParams.push(genres);
    const fi = filterParams.length;
    dataFilterClauses.push(`genres && $${1 + fi}::text[]`);   // $2, $3, …
    countFilterClauses.push(`genres && $${fi}::text[]`);      // $1, $2, …
  }

  // Filtro por faixa de ano
  if (yearFrom !== null) {
    filterParams.push(yearFrom);
    const fi = filterParams.length;
    dataFilterClauses.push(`start_year >= $${1 + fi}`);
    countFilterClauses.push(`start_year >= $${fi}`);
  }
  if (yearTo !== null) {
    filterParams.push(yearTo);
    const fi = filterParams.length;
    dataFilterClauses.push(`start_year <= $${1 + fi}`);
    countFilterClauses.push(`start_year <= $${fi}`);
  }

  // Filtro por termos obrigatórios
  if (requiredTerms.length > 0) {
    filterParams.push(requiredTerms.join(' '));
    const fi = filterParams.length;
    const dIdx = 1 + fi;
    const cIdx = fi;
    dataFilterClauses.push(
      `(word_similarity($${dIdx}, primary_title) > 0.2`
      + ` OR word_similarity($${dIdx}, original_title) > 0.2`
      + ` OR EXISTS (`
      + `   SELECT 1 FROM UNNEST(pt_titles) AS _pt`
      + `   WHERE word_similarity($${dIdx}, _pt) > 0.2`
      + ` ))`,
    );
    countFilterClauses.push(
      `(word_similarity($${cIdx}, primary_title) > 0.2`
      + ` OR word_similarity($${cIdx}, original_title) > 0.2`
      + ` OR EXISTS (`
      + `   SELECT 1 FROM UNNEST(pt_titles) AS _pt`
      + `   WHERE word_similarity($${cIdx}, _pt) > 0.2`
      + ` ))`,
    );
  }

  const dataWhere  = [...baseClauses, ...dataFilterClauses].join('\n    AND ');
  const countWhere = [...baseClauses, ...countFilterClauses].join('\n    AND ');

  // Expressão de score semântico: $1 = rawQuery (só no data query)
  const semExpr = `GREATEST(
        word_similarity($1, primary_title),
        word_similarity($1, original_title),
        COALESCE(
          (SELECT MAX(word_similarity($1, _pt))
           FROM UNNEST(pt_titles) AS _pt),
          0.0
        )
      )`;

  // Montar arrays finais de parâmetros
  const limitVal  = limit;
  const offsetVal = (page - 1) * limit;
  const limitIdx  = 1 + 1 + filterParams.length;     // rawQuery ($1) + filterParams + limit
  const offsetIdx = limitIdx + 1;

  const dataParams:  unknown[] = [rawQuery, ...filterParams, limitVal, offsetVal];
  const countParams: unknown[] = [...filterParams];

  // CTE: calcula semantic_score uma vez por linha
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
      WHERE ${dataWhere}
    )
    SELECT *
    FROM scored
    ORDER BY
      (0.7 * "semanticScore" + 0.3 * COALESCE("qualityScore", 0.0)) DESC,
      "numVotes" DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM movies_search
    WHERE ${countWhere}
  `;

  const client = await pool.connect();
  try {
    const [dataResult, countResult] = await Promise.all([
      client.query<SearchRawRow>(dataSql, dataParams),
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
