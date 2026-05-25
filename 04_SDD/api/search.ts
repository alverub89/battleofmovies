import type { Handler } from '@netlify/functions';
import { getPool } from '../lib/db';
import { validateSearchParams } from '../lib/validators';
import { parseQuery } from '../lib/query-parser';
import { executeSearch } from '../lib/search';
import { rank } from '../lib/ranker';
import type { SearchResponse, ErrorResponse } from '../lib/types';

const HEADERS = {
  'Content-Type':                'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':'Content-Type',
  'Access-Control-Allow-Methods':'GET, OPTIONS',
};

function respond(statusCode: number, body: SearchResponse | ErrorResponse) {
  return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
}

function log(level: 'info' | 'error', data: Record<string, unknown>) {
  console.log(JSON.stringify({ level, fn: 'search-04', ...data }));
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  const qs = (event.queryStringParameters ?? {}) as Record<string, string | undefined>;

  // ── Validação de entrada ─────────────────────────────────────────────────
  const validation = validateSearchParams(qs);
  if (!validation.ok) {
    return respond(validation.error.status, validation.error);
  }

  const { q, page, limit } = validation.params;

  // ── Parse + busca + ranqueamento ─────────────────────────────────────────
  const t0 = Date.now();
  try {
    const parsed = parseQuery(q);

    const pool = getPool();
    const { rows, total } = await executeSearch(pool, q, parsed, page, limit);
    const results = rank(rows);

    const elapsed = Date.now() - t0;
    log('info', { query: q, total, page, results: results.length, ms: elapsed });

    const response: SearchResponse = {
      query:         q,
      total,
      page,
      limit,
      has_next_page: page * limit < total,
      confidence:    parsed.confidence,
      results,
    };

    return respond(200, response);
  } catch (err) {
    const elapsed = Date.now() - t0;
    log('error', {
      query: q,
      ms: elapsed,
      message: err instanceof Error ? err.message : 'Unknown error',
    });

    return respond(500, {
      error:   'INTERNAL_ERROR',
      message: 'Erro interno ao processar a busca.',
      status:  500,
    });
  }
};
