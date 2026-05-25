'use strict';

const { Pool } = require('pg');

// ─── Database ─────────────────────────────────────────────────────────────────
let _pool;
function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATA_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
  }
  return _pool;
}

// ─── NLP Constants ────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'aquele','aquela','aqueles','aquelas','esse','essa','esses','essas',
  'este','esta','estes','estas','um','uma','uns','umas','o','a','os','as',
  'de','do','da','dos','das','que','com','para','por','no','na','nos','nas',
  'em','e','ou','mas','seu','sua','seus','suas','sabe','ne','cara','tipo',
  'isso','bem','la','sei','assim','ao','mais','menos','muito','pouco',
  'ter','ser','foi','sao','tem','era','ver','assistir','quero','gosto',
  'queria','preciso','busco','procuro','me','meu','minha','bom','boa',
  'legal','otimo','ótimo','qualquer','filme','filmes','serie','séries',
  'series','historia','sobre','nele','nela','dele','dela','quando','onde',
  'como','todo','toda','todos','todas','final','antigo','novo','grande',
  'pequeno','longa','curta','velha','velho','né','à','ao','vou','vi',
]);

// Phrase-first mappings (matched before single words)
const PHRASE_GENRES = [
  ['ficção científica',    ['Sci-Fi']],
  ['ficcao cientifica',    ['Sci-Fi']],
  ['ficção-científica',    ['Sci-Fi']],
  ['ficcao-cientifica',    ['Sci-Fi']],
  ['inteligência artificial', ['Sci-Fi']],
  ['inteligencia artificial', ['Sci-Fi']],
  ['segunda guerra',       ['War']],
  ['primeira guerra',      ['War']],
  ['velho oeste',          ['Western']],
  ['nave espacial',        ['Sci-Fi']],
  ['vida real',            ['Biography']],
  ['baseado em fatos',     ['Biography']],
  ['historia real',        ['Biography']],
  ['história real',        ['Biography']],
  ['historia verdadeira',  ['Biography']],
  ['história verdadeira',  ['Biography']],
  ['desenho animado',      ['Animation']],
  ['final triste',         ['Drama', 'Romance']],
  ['protagonista feminina',['Drama']],
  ['pais e filhos',        ['Family']],
];

// Single-word genre mappings
const WORD_GENRES = new Map([
  // Horror
  ['terror',       ['Horror']], ['horrores', ['Horror']], ['horror',      ['Horror']],
  ['assustador',   ['Horror']], ['fantasma', ['Horror']], ['zumbi',       ['Horror']],
  ['vampiro',      ['Horror']], ['assustar', ['Horror']], ['medo',        ['Horror']],
  // Action
  ['ação',         ['Action']], ['acao',     ['Action']],
  // War
  ['guerra',       ['War']],    ['soldado',  ['War']],    ['militar',     ['War']],
  ['batalha',      ['War']],
  // Western
  ['faroeste',     ['Western']], ['western', ['Western']], ['cowboy',     ['Western']],
  ['caubói',       ['Western']], ['cauboi',  ['Western']], ['mocinho',    ['Western']],
  ['bandido',      ['Western']], ['xerife',  ['Western']],
  // Drama
  ['drama',        ['Drama']],  ['dramático',['Drama']],  ['dramatico',  ['Drama']],
  ['chorar',       ['Drama', 'Romance']], ['triste',   ['Drama', 'Romance']],
  ['tristeza',     ['Drama', 'Romance']], ['emocionante', ['Drama', 'Romance']],
  ['emoção',       ['Drama']],  ['emocao',   ['Drama']],
  // Comedy
  ['comédia',      ['Comedy']], ['comedia',  ['Comedy']], ['comica',     ['Comedy']],
  ['cômico',       ['Comedy']], ['comico',   ['Comedy']], ['rir',        ['Comedy']],
  ['engraçado',    ['Comedy']], ['engracado',['Comedy']], ['humor',      ['Comedy']],
  ['risada',       ['Comedy']], ['divertido',['Comedy']],
  // Romance
  ['romance',      ['Romance']], ['romântico',['Romance']], ['romantico', ['Romance']],
  ['amor',         ['Romance']], ['namoro',   ['Romance']], ['paixão',    ['Romance']],
  ['paixao',       ['Romance']], ['apaixonar',['Romance']],
  // Sci-Fi
  ['robô',         ['Sci-Fi']], ['robo',     ['Sci-Fi']], ['robôs',      ['Sci-Fi']],
  ['robos',        ['Sci-Fi']], ['espaço',   ['Sci-Fi']], ['espaco',     ['Sci-Fi']],
  ['alien',        ['Sci-Fi']], ['aliens',   ['Sci-Fi']], ['extraterrestre', ['Sci-Fi']],
  ['futurista',    ['Sci-Fi']], ['futuro',   ['Sci-Fi']], ['cyborg',     ['Sci-Fi']],
  ['androide',     ['Sci-Fi']], ['distopia', ['Sci-Fi']], ['distópico',  ['Sci-Fi']],
  ['distopico',    ['Sci-Fi']], ['espacial', ['Sci-Fi']],
  // Thriller
  ['suspense',     ['Thriller']], ['thriller', ['Thriller']],
  ['mistério',     ['Thriller']], ['misterio', ['Thriller']], ['misterioso', ['Thriller']],
  ['investigação', ['Thriller']], ['investigacao', ['Thriller']],
  // Crime
  ['crime',        ['Crime']], ['criminal', ['Crime']], ['policial', ['Crime']],
  ['detetive',     ['Crime']], ['assassino',['Crime']], ['mafia',    ['Crime']],
  ['máfia',        ['Crime']], ['gangue',   ['Crime']], ['tráfico',  ['Crime']],
  ['trafico',      ['Crime']],
  // Family
  ['família',      ['Family']], ['familia', ['Family']], ['familiar', ['Family']],
  ['infantil',     ['Family', 'Animation']],
  // History
  ['histórico',    ['History']], ['historico',['History']],
  ['medieval',     ['History', 'Fantasy']], ['antiguidade', ['History']],
  ['época',        ['History']], ['epocal',   ['History']],
  // Animation
  ['animação',     ['Animation']], ['animacao', ['Animation']],
  ['animado',      ['Animation']], ['animados', ['Animation']], ['cartoon', ['Animation']],
  // Fantasy
  ['fantasia',     ['Fantasy']], ['mágico',  ['Fantasy']], ['magico',   ['Fantasy']],
  ['magia',        ['Fantasy']], ['feiticeiro',['Fantasy']], ['dragão',  ['Fantasy']],
  ['dragao',       ['Fantasy']], ['elfo',    ['Fantasy']], ['elfos',    ['Fantasy']],
  ['monstro',      ['Horror', 'Fantasy']],
  // Adventure
  ['aventura',     ['Adventure']], ['explorador', ['Adventure']],
  ['exploração',   ['Adventure']], ['exploracao',  ['Adventure']],
  // Biography
  ['biografia',    ['Biography']], ['biográfico', ['Biography']], ['biografico', ['Biography']],
  // Music / Musical
  ['musical',      ['Music', 'Musical']], ['música', ['Music']], ['musica', ['Music']],
  ['dança',        ['Music']], ['danca', ['Music']],
  // Sport
  ['esporte',      ['Sport']], ['esportivo', ['Sport']], ['futebol', ['Sport']],
  ['basquete',     ['Sport']], ['atleta',    ['Sport']], ['olimpíadas', ['Sport']],
  ['olimpiadas',   ['Sport']],
  // Documentary
  ['documentário', ['Documentary']], ['documentario', ['Documentary']],
]);

// Set of all genre-related terms (for filtering out of required-term detection)
const ALL_GENRE_WORDS = new Set([
  ...WORD_GENRES.keys(),
  ...PHRASE_GENRES.flatMap(([phrase]) => phrase.split(/\s+/)),
]);

// Decade / year extraction patterns
const DECADE_PATTERNS = [
  { re: /\banos?\s+(20|30|40|50|60|70|80|90)s?\b/i,
    fn: m => { const d = parseInt(m[1], 10); return { from: 1900+d, to: 1900+d+9 }; } },
  { re: /\bdos\s+(20|30|40|50|60|70|80|90)\b/i,
    fn: m => { const d = parseInt(m[1], 10); return { from: 1900+d, to: 1900+d+9 }; } },
  { re: /\bdécada\s+de\s+(\d+)/i,
    fn: m => { const d=parseInt(m[1],10); return d<100 ? {from:1900+d,to:1900+d+9} : {from:d-d%10,to:d-d%10+9}; } },
  { re: /\bsé?culo\s+xxi\b/i,  fn: () => ({ from: 2000, to: 2099 }) },
  { re: /\bsé?culo\s+xx\b/i,   fn: () => ({ from: 1900, to: 1999 }) },
  { re: /\bsé?culo\s+xix\b/i,  fn: () => ({ from: 1800, to: 1899 }) },
  { re: /\bsé?culo\s+xviii\b/i,fn: () => ({ from: 1700, to: 1799 }) },
  { re: /\b(19[0-9]{2}|20[0-2][0-9])\b/,
    fn: m => { const y=parseInt(m[1],10); return { from: y, to: y }; } },
];

// ─── NLP Parser ───────────────────────────────────────────────────────────────
/**
 * Parses a natural-language movie query into structured filters.
 * Returns: { genres[], yearFrom, yearTo, requiredTerms[], confidence }
 *
 * requiredTerms: capitalized mid-sentence words (proper nouns like "Zorbak")
 * treated as mandatory title-match tokens.
 */
function parseQuery(raw) {
  const result = {
    genres:        [],
    yearFrom:      null,
    yearTo:        null,
    requiredTerms: [],
    confidence:    'normal',
  };

  // 1. Detect capitalized mid-sentence words as required title terms
  //    e.g. "filme do planeta Zorbak" → ["Zorbak"]
  const rawWords = raw.trim().split(/\s+/);
  for (let i = 1; i < rawWords.length; i++) {
    const stripped = rawWords[i].replace(/[^A-Za-záàãâäéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ]/g, '');
    if (stripped.length < 3) continue;
    if (!/^[A-ZÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ]/.test(stripped)) continue;
    const lower = stripped.toLowerCase();
    if (!STOP_WORDS.has(lower) && !ALL_GENRE_WORDS.has(lower)) {
      result.requiredTerms.push(stripped);
    }
  }

  // 2. Extract decade / year references
  let working = raw.toLowerCase();
  for (const { re, fn } of DECADE_PATTERNS) {
    const m = working.match(re);
    if (m) {
      const range = fn(m);
      if (result.yearFrom === null || range.from < result.yearFrom) result.yearFrom = range.from;
      if (result.yearTo   === null || range.to   > result.yearTo)   result.yearTo   = range.to;
      working = working.replace(m[0], ' ');
    }
  }

  // 3. Multi-word genre phrases (must run before single-word scan)
  for (const [phrase, genres] of PHRASE_GENRES) {
    if (working.includes(phrase)) {
      for (const g of genres) {
        if (!result.genres.includes(g)) result.genres.push(g);
      }
      working = working.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), ' ');
    }
  }

  // 4. Single-word genre terms
  const tokens = working.split(/[\s\-,./;:!?]+/).map(w => w.replace(/[^a-záàãâäéèêëíìîïóòõôöúùûüçñ]/g, '')).filter(Boolean);
  for (const token of tokens) {
    if (WORD_GENRES.has(token)) {
      for (const g of WORD_GENRES.get(token)) {
        if (!result.genres.includes(g)) result.genres.push(g);
      }
    }
  }

  // 5. Confidence: low when no genre, no year, no required terms
  if (result.genres.length === 0 && result.yearFrom === null && result.requiredTerms.length === 0) {
    result.confidence = 'low';
  }

  return result;
}

// ─── Query Builder ────────────────────────────────────────────────────────────
/**
 * Builds parameterized SQL for the movie search, returning both the data query
 * and the count query (for pagination).
 */
function buildSearchQuery({ parsed, page }) {
  const { genres, yearFrom, yearTo, requiredTerms } = parsed;
  const pageNum  = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 10;
  const offset   = (pageNum - 1) * pageSize;

  const params = [];
  const whereClauses = [
    'average_rating  IS NOT NULL',
    'num_votes       IS NOT NULL',
    'runtime_minutes IS NOT NULL',
    'num_votes       >= 1000',
  ];

  // Genre filter
  let genreParamIdx = null;
  if (genres.length > 0) {
    params.push(genres);
    genreParamIdx = params.length; // 1-indexed: $N
    whereClauses.push(`genres && $${genreParamIdx}::text[]`);
  }

  // Year range
  if (yearFrom !== null) {
    params.push(yearFrom);
    whereClauses.push(`start_year >= $${params.length}`);
  }
  if (yearTo !== null) {
    params.push(yearTo);
    whereClauses.push(`start_year <= $${params.length}`);
  }

  // Required title term filter (proper nouns – hard filter)
  if (requiredTerms.length > 0) {
    const termStr = requiredTerms.join(' ');
    params.push(termStr);
    const p = params.length;
    whereClauses.push(
      `(word_similarity($${p}, primary_title) > 0.25`
      + ` OR EXISTS (SELECT 1 FROM unnest(pt_titles) _t WHERE word_similarity($${p}, _t) > 0.25))`
    );
  }

  const whereSQL = whereClauses.join('\n  AND ');

  // Relevance score expression (computed in SQL for correct ORDER BY + pagination)
  // Formula: genreMatchRatio * 0.6 + normalizedQuality * 0.4
  const genreExpr = genreParamIdx !== null
    ? `(SELECT COUNT(*)::float FROM unnest(genres) _g WHERE _g = ANY($${genreParamIdx}::text[])) / ${genres.length}.0`
    : '0.5';

  const relevanceExpr = `
    ROUND((
      (${genreExpr}) * 0.6
      + LEAST(COALESCE(quality_score, 0) / 9.0, 1.0) * 0.4
    )::numeric, 4)`;

  // Pagination params
  params.push(pageSize);
  const limitIdx  = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const dataSql = `
    SELECT
      tconst,
      primary_title                   AS "primaryTitle",
      start_year                      AS "startYear",
      genres,
      runtime_minutes                 AS "runtimeMinutes",
      CAST(average_rating AS float)   AS "averageRating",
      num_votes                       AS "numVotes",
      ${relevanceExpr}                AS "relevanceScore"
    FROM movies_search
    WHERE ${whereSQL}
    ORDER BY "relevanceScore" DESC, num_votes DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM movies_search
    WHERE ${whereSQL}
  `;

  // Count query uses same params minus the trailing LIMIT + OFFSET
  const countParams = params.slice(0, params.length - 2);

  return { dataSql, countSql, params, countParams, pageNum, pageSize };
}

// ─── HTTP Handler ─────────────────────────────────────────────────────────────
const HEADERS = {
  'Content-Type':                'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':'Content-Type',
  'Access-Control-Allow-Methods':'GET, OPTIONS',
};

function respond(statusCode, body) {
  return { statusCode, headers: HEADERS, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  const rawQuery = (event.queryStringParameters?.q ?? '').trim();

  // ── Input validation ──────────────────────────────────────────────────────
  if (!rawQuery) {
    return respond(400, { error: 'Query é obrigatória' });
  }
  if (!/[a-záàãâäéèêëíìîïóòõôöúùûüçñ0-9]/i.test(rawQuery)) {
    return respond(400, { error: 'Query inválida' });
  }

  const page   = event.queryStringParameters?.page ?? 1;
  const parsed = parseQuery(rawQuery);
  const { dataSql, countSql, params, countParams, pageNum, pageSize } =
    buildSearchQuery({ parsed, page });

  const pool   = getPool();
  let   client;
  try {
    client = await pool.connect();

    const [dataResult, countResult] = await Promise.all([
      client.query(dataSql,   params),
      client.query(countSql,  countParams),
    ]);

    const total   = parseInt(countResult.rows[0].total, 10);
    const results = dataResult.rows.map(r => ({
      tconst:         r.tconst,
      primaryTitle:   r.primaryTitle,
      startYear:      r.startYear,
      genres:         r.genres,
      runtimeMinutes: r.runtimeMinutes,
      averageRating:  parseFloat(r.averageRating),
      numVotes:       r.numVotes,
      relevanceScore: parseFloat(r.relevanceScore),
    }));

    const response = {
      results,
      total,
      page:       pageNum,
      pageSize,
      hasMore:    pageNum * pageSize < total,
      confidence: parsed.confidence,
    };
    if (total === 0) {
      response.message = 'Nenhum resultado encontrado para sua busca.';
    }

    return respond(200, response);
  } catch (err) {
    console.error('[search-03] error:', err.message);
    return respond(500, { error: 'Erro interno ao processar a busca.' });
  } finally {
    if (client) client.release();
  }
};
