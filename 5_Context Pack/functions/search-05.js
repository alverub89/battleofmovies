'use strict';

const { Pool } = require('pg');

/** @type {import('pg').Pool | null} */
let pool = null;

function getPool() {
  if (pool) return pool;
  const url = process.env.DATA_URL;
  if (!url) throw new Error('DATA_URL environment variable is not set');
  pool = new Pool({
    connectionString: url,
    ssl: true,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
  return pool;
}

/* ===== Genre keyword map (Portuguese + English → IMDb genre) ===== */
const GENRE_KEYWORDS = [
  // Horror
  ['terror',              'Horror'],
  ['horror',              'Horror'],
  ['assustador',          'Horror'],
  ['medo',                'Horror'],
  ['assustar',            'Horror'],
  // Comedy
  ['comedia',             'Comedy'],
  ['comédia',             'Comedy'],
  ['engraçado',           'Comedy'],
  ['engracado',           'Comedy'],
  ['humor',               'Comedy'],
  ['rir',                 'Comedy'],
  ['piada',               'Comedy'],
  ['comico',              'Comedy'],
  ['cômico',              'Comedy'],
  // Action
  ['acao',                'Action'],
  ['ação',                'Action'],
  ['explosao',            'Action'],
  ['explosão',            'Action'],
  ['action',              'Action'],
  ['adrenalina',          'Action'],
  // Drama
  ['drama',               'Drama'],
  ['chorar',              'Drama'],
  ['triste',              'Drama'],
  ['emocionante',         'Drama'],
  ['tragico',             'Drama'],
  ['trágico',             'Drama'],
  ['lágrimas',            'Drama'],
  ['lagrimas',            'Drama'],
  ['final triste',        'Drama'],
  // Romance
  ['romance',             'Romance'],
  ['romantico',           'Romance'],
  ['romântico',           'Romance'],
  ['amor',                'Romance'],
  ['amoroso',             'Romance'],
  ['romântica',           'Romance'],
  ['romantica',           'Romance'],
  // Thriller
  ['suspense',            'Thriller'],
  ['thriller',            'Thriller'],
  ['tensao',              'Thriller'],
  ['tensão',              'Thriller'],
  // Mystery
  ['misterio',            'Mystery'],
  ['mistério',            'Mystery'],
  ['detetive',            'Mystery'],
  ['investigação',        'Mystery'],
  ['investigacao',        'Mystery'],
  // War
  ['guerra',              'War'],
  ['batalha',             'War'],
  // Sci-Fi
  ['sci-fi',              'Sci-Fi'],
  ['ficcao cientifica',   'Sci-Fi'],
  ['ficção científica',   'Sci-Fi'],
  ['futuro',              'Sci-Fi'],
  ['futurista',           'Sci-Fi'],
  ['robo',                'Sci-Fi'],
  ['robô',                'Sci-Fi'],
  ['espaco',              'Sci-Fi'],
  ['espaço',              'Sci-Fi'],
  ['alienigena',          'Sci-Fi'],
  ['alienígena',          'Sci-Fi'],
  ['nave espacial',       'Sci-Fi'],
  ['inteligencia artificial', 'Sci-Fi'],
  // Animation
  ['animacao',            'Animation'],
  ['animação',            'Animation'],
  ['desenho animado',     'Animation'],
  ['desenho',             'Animation'],
  // Adventure
  ['aventura',            'Adventure'],
  // Crime
  ['crime',               'Crime'],
  ['policial',            'Crime'],
  ['mafia',               'Crime'],
  ['máfia',               'Crime'],
  // Fantasy
  ['fantasia',            'Fantasy'],
  ['magia',               'Fantasy'],
  ['dragao',              'Fantasy'],
  ['dragão',              'Fantasy'],
  ['elfos',               'Fantasy'],
  // Family
  ['familia',             'Family'],
  ['família',             'Family'],
  ['infantil',            'Family'],
  // Musical
  ['musical',             'Musical'],
  ['musica',              'Music'],
  ['música',              'Music'],
  // Western
  ['faroeste',            'Western'],
  ['western',             'Western'],
  ['bang bang',           'Western'],
  // Biography
  ['biografico',          'Biography'],
  ['biográfico',          'Biography'],
  ['biografia',           'Biography'],
  ['história real',       'Biography'],
  ['historia real',       'Biography'],
  ['baseado em fatos',    'Biography'],
  // History
  ['historico',           'History'],
  ['histórico',           'History'],
  // Documentary
  ['documentario',        'Documentary'],
  ['documentário',        'Documentary'],
  // Sport
  ['esporte',             'Sport'],
  ['futebol',             'Sport'],
  ['basquete',            'Sport'],
  ['boxe',                'Sport'],
];

/**
 * Normalise a string: lowercase + strip diacritics.
 * @param {string} s
 * @returns {string}
 */
function normalise(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Parse natural-language query into structured filters.
 * @param {string} q
 * @returns {{ genres: string[]|null, startYear: number|null, endYear: number|null, confidence: number }}
 */
function parseQuery(q) {
  const norm = normalise(q);

  // --- Genre detection ---
  /** @type {Set<string>} */
  const genres = new Set();
  for (const [kw, genre] of GENRE_KEYWORDS) {
    if (norm.includes(normalise(kw))) {
      genres.add(genre);
    }
  }

  // --- Decade detection: "anos 80", "década de 90" ---
  let startYear = null;
  let endYear   = null;
  const decadeMatch = norm.match(/\banos?\s+(\d{2,4})\b/);
  if (decadeMatch) {
    let dec = parseInt(decadeMatch[1], 10);
    if (dec < 100) {
      dec = dec < 30 ? 2000 + dec : 1900 + dec;
    }
    // Round down to decade start
    startYear = Math.floor(dec / 10) * 10;
    endYear   = startYear + 9;
  }

  // --- Specific year: "de 1994", "em 2001", etc. ---
  if (!decadeMatch) {
    const yearMatch = norm.match(/\b(19[0-9]{2}|20[0-2][0-9])\b/);
    if (yearMatch) {
      startYear = parseInt(yearMatch[0], 10);
      endYear   = startYear;
    }
  }

  // --- Confidence: how well we understood the intent ---
  const hasGenres = genres.size > 0;
  const hasYear   = startYear !== null;
  const wordCount = q.trim().split(/\s+/).length;

  let confidence = 0;
  if (hasGenres) confidence += 0.5;
  if (hasYear)   confidence += 0.3;
  if (wordCount >= 4 && hasGenres) confidence += 0.2;

  return {
    genres:     genres.size > 0 ? Array.from(genres) : null,
    startYear,
    endYear,
    confidence: Math.min(confidence, 1.0),
  };
}

/**
 * Validate pagination / filter parameters.
 * Returns an error string or null if valid.
 * @param {Record<string, string>} params
 * @returns {{ page: number, limit: number, minVotes: number, minRating: number|null } | { error: string }}
 */
function validateParams(params) {
  const page = parseInt(params.page || '1', 10);
  if (isNaN(page) || page < 1) {
    return { error: 'O parâmetro "page" deve ser um inteiro >= 1.' };
  }

  const limit = parseInt(params.limit || '10', 10);
  if (isNaN(limit) || limit < 1 || limit > 50) {
    return { error: 'O parâmetro "limit" deve ser um inteiro entre 1 e 50.' };
  }

  const minVotes = parseInt(params.min_votes || '1000', 10);
  if (isNaN(minVotes) || minVotes < 0) {
    return { error: 'O parâmetro "min_votes" deve ser um inteiro >= 0.' };
  }

  let minRating = null;
  if (params.min_rating !== undefined && params.min_rating !== '') {
    minRating = parseFloat(params.min_rating);
    if (isNaN(minRating) || minRating < 0 || minRating > 10) {
      return { error: 'O parâmetro "min_rating" deve ser um número entre 0 e 10.' };
    }
  }

  return { page, limit, minVotes, minRating };
}

/** @type {Record<string, string>} */
const RESPONSE_HEADERS = {
  'Content-Type':                'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Main Netlify Function handler.
 * @param {{ httpMethod: string, queryStringParameters: Record<string, string> | null }} event
 */
exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: RESPONSE_HEADERS, body: '' };
  }

  const qp = event.queryStringParameters || {};

  // --- Validate query string ---
  const q = (qp.q || '').trim();
  if (!q) {
    return {
      statusCode: 400,
      headers: RESPONSE_HEADERS,
      body: JSON.stringify({
        error:   'INVALID_QUERY',
        message: 'O parâmetro "q" é obrigatório.',
        status:  400,
      }),
    };
  }
  if (q.length > 500) {
    return {
      statusCode: 400,
      headers: RESPONSE_HEADERS,
      body: JSON.stringify({
        error:   'INVALID_PARAMETER',
        message: 'A query não pode exceder 500 caracteres.',
        status:  400,
      }),
    };
  }

  // --- Validate numeric params ---
  const validated = validateParams(qp);
  if ('error' in validated) {
    return {
      statusCode: 400,
      headers: RESPONSE_HEADERS,
      body: JSON.stringify({
        error:   'INVALID_PARAMETER',
        message: validated.error,
        status:  400,
      }),
    };
  }
  const { page, limit, minVotes, minRating } = validated;

  // --- Parse natural language ---
  const { genres, startYear, endYear, confidence } = parseQuery(q);
  const offset = (page - 1) * limit;

  try {
    const db = getPool();

    // Parameterised — never interpolate user input into SQL
    const SQL_FILTER = `
      FROM title_basics b
      INNER JOIN title_ratings r ON b.tconst = r.tconst
      WHERE r.num_votes          >= $1
        AND ($2::text[]  IS NULL OR b.genres      && $2::text[])
        AND ($3          IS NULL OR b.start_year  >= CAST($3 AS smallint))
        AND ($4          IS NULL OR b.start_year  <= CAST($4 AS smallint))
        AND ($5          IS NULL OR r.average_rating >= CAST($5 AS numeric))
    `;

    const baseParams = [minVotes, genres, startYear, endYear, minRating];

    // Count query (no LIMIT/OFFSET)
    const countResult = await db.query(
      'SELECT COUNT(*) AS total ' + SQL_FILTER,
      baseParams
    );
    const total = parseInt(countResult.rows[0].total, 10);

    /** @type {Array<{tconst:string,primaryTitle:string,startYear:number|null,runtimeMinutes:number|null,genres:string[]|null,averageRating:string,numVotes:string,relevanceScore:string}>} */
    let rows = [];

    if (total > 0 && offset < total) {
      const dataResult = await db.query(
        `SELECT
           b.tconst,
           b.primary_title                        AS "primaryTitle",
           b.start_year                           AS "startYear",
           b.runtime_minutes                      AS "runtimeMinutes",
           b.genres,
           r.average_rating                       AS "averageRating",
           r.num_votes                            AS "numVotes",
           LEAST(
             ROUND(CAST(
               (r.average_rating / 10.0)
               * (LN(GREATEST(r.num_votes::float, 10)) / LN(1000000.0))
             AS NUMERIC), 4),
             1.0
           )                                      AS "relevanceScore"
        ` + SQL_FILTER + `
        ORDER BY "relevanceScore" DESC
        LIMIT $6 OFFSET $7`,
        [...baseParams, limit, offset]
      );
      rows = dataResult.rows;
    }

    /** @type {Array<object>} */
    const results = rows.map(row => ({
      tconst:         row.tconst,
      primaryTitle:   row.primaryTitle,
      startYear:      row.startYear   !== null ? Number(row.startYear)   : null,
      runtimeMinutes: row.runtimeMinutes !== null ? Number(row.runtimeMinutes) : null,
      genres:         row.genres || [],
      averageRating:  parseFloat(row.averageRating),
      numVotes:       parseInt(row.numVotes, 10),
      relevanceScore: parseFloat(row.relevanceScore),
    }));

    return {
      statusCode: 200,
      headers: RESPONSE_HEADERS,
      body: JSON.stringify({
        query:         q,
        total,
        page,
        limit,
        has_next_page: offset + results.length < total,
        confidence,
        results,
      }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack   = err instanceof Error ? err.stack   : undefined;
    console.error(JSON.stringify({ event: 'search_error', message, stack }));

    return {
      statusCode: 500,
      headers: RESPONSE_HEADERS,
      body: JSON.stringify({
        error:   'INTERNAL_ERROR',
        message,   // temporary: exposes real error for debugging
        status:  500,
      }),
    };
  }
};
