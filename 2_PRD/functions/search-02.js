// search-02.js — Netlify Function
// PRD: Busca Inteligente de Filmes
// Parser rule-based melhorado com paginação, relevanceScore e confidence

const { Pool } = require("pg");

const connectionString = process.env.DATA_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  max: 1,
  ssl: { rejectUnauthorized: false },
});

// ─── Mapeamento gênero PT-BR → IMDb genres (gênero + humor/sentimento) ───────
const GENRE_MAP = [
  // Gêneros principais
  { patterns: [/terror|horror|assust|medo\b/i], genres: ["Horror"] },
  { patterns: [/psicológic|psicologico|suspense/i], genres: ["Thriller"] },
  { patterns: [/thriller|tensão|tensao/i], genres: ["Thriller"] },
  { patterns: [/comédia|comedia|engraçad|engraçado|humor\b|comica|cómica/i], genres: ["Comedy"] },
  { patterns: [/romântic|romantico|romance|amor\b|amorosa/i], genres: ["Romance"] },
  { patterns: [/\bação\b|acao\b|aventura|explosão|explosao/i], genres: ["Action"] },
  { patterns: [/ficção científica|ficcao cientifica|sci-fi|scifi|científico|futuro\b|robô|robos/i], genres: ["Sci-Fi"] },
  { patterns: [/espacial|espaço|espaco|galáxia|galaxia|planeta|nave espacial/i], genres: ["Sci-Fi"] },
  { patterns: [/animação|animacao|desenho animado|cartoon|animad/i], genres: ["Animation"] },
  { patterns: [/documentário|documentario|documental/i], genres: ["Documentary"] },
  { patterns: [/\bdrama\b|dramático|dramatico/i], genres: ["Drama"] },
  { patterns: [/fantasia|fantástico|fantastico/i], genres: ["Fantasy"] },
  { patterns: [/\bmagia\b|mágico\b|magico\b/i], genres: ["Fantasy"] },
  { patterns: [/crime|policial|detetive|investigação|investigacao/i], genres: ["Crime"] },
  { patterns: [/guerra|batalha|militar|soldado/i], genres: ["War"] },
  { patterns: [/western|velho oeste|faroeste/i], genres: ["Western"] },
  { patterns: [/musical|música\b|musica\b|cantando/i], genres: ["Music", "Musical"] },
  { patterns: [/biografia|biográfico|biografico|vida real/i], genres: ["Biography"] },
  { patterns: [/histórico|historico/i], genres: ["History"] },
  { patterns: [/super.?herói|super.?heroi|super.?hero|marvel|dc comics/i], genres: ["Action"] },
  { patterns: [/mistério|misterio|misterioso/i], genres: ["Mystery"] },
  { patterns: [/família|familia|infantil/i], genres: ["Family"] },
  { patterns: [/esporte|esportes|futebol|basquete/i], genres: ["Sport"] },
  // Humor / sentimento
  { patterns: [/chorar|comovente|emocionante|triste|tristeza|tocante|sensível/i], genres: ["Drama"] },
  { patterns: [/inspirador|inspiradora|motivador|motivacional|superação|superacao/i], genres: ["Biography", "Drama"] },
  { patterns: [/arrepiar|perturbador|perturbadora|perturbante/i], genres: ["Horror", "Thriller"] },
  { patterns: [/gargalhar|hilário|hilario|pastelão|slapstick/i], genres: ["Comedy"] },
  { patterns: [/reflexivo|pensativo|profundo|profunda|cerebral/i], genres: ["Drama", "Mystery"] },
  { patterns: [/adrenalina|adrenalínico|eletrizante|empolgante/i], genres: ["Action", "Thriller"] },
  { patterns: [/encantador|encantadora/i], genres: ["Fantasy", "Family"] },
  { patterns: [/\bkids?\b|para crianças|para filhos/i], genres: ["Family", "Animation"] },
];

// ─── Extração de época / década ───────────────────────────────────────────────
function extractYearRange(query) {
  // "recente", "novo", "atual" → últimos 5 anos
  if (/\b(recente|recentes|novo|nova|atual|moderno|moderna|lançamento)\b/i.test(query)) {
    return { from: 2020, to: new Date().getFullYear() };
  }

  // "clássico", "antigo", "velho", "retro" → antes de 1980
  if (/\b(clássico|classico|clássicos|classicos|antigo|velho|retrô|retro)\b/i.test(query)) {
    return { from: 1920, to: 1979 };
  }

  // "anos 90", "anos 80", "anos 2000", etc.
  const decadeWord = query.match(/\banos?\s+(\d{2,4})\b/i);
  if (decadeWord) {
    const d = parseInt(decadeWord[1], 10);
    if (d >= 1920 && d <= 2029) {
      const decade = Math.floor(d / 10) * 10;
      return { from: decade, to: decade + 9 };
    }
    const century = d < 30 ? 2000 : 1900;
    const decade = century + Math.floor(d / 10) * 10;
    return { from: decade, to: decade + 9 };
  }

  // "1990s", "2000s", "90s", "80s"
  const decadeS = query.match(/\b((?:19|20)?\d{2})s\b/i);
  if (decadeS) {
    const raw = parseInt(decadeS[1], 10);
    const decade = raw < 100 ? (raw < 30 ? 2000 + raw : 1900 + raw) : Math.floor(raw / 10) * 10;
    return { from: decade, to: decade + 9 };
  }

  // Ano explícito: "1994", "2003"
  const yearExact = query.match(/\b(19[3-9]\d|20[0-2]\d)\b/);
  if (yearExact) {
    const y = parseInt(yearExact[1], 10);
    return { from: y - 2, to: y + 2 };
  }

  // "século XXI", "século XX"
  if (/século\s+xxi|seculo\s+xxi/i.test(query)) return { from: 2000, to: 2099 };
  if (/século\s+xx|seculo\s+xx/i.test(query)) return { from: 1900, to: 1999 };

  return null;
}

// ─── Extração de gêneros ─────────────────────────────────────────────────────
function extractGenres(query) {
  const found = new Set();
  for (const entry of GENRE_MAP) {
    if (entry.patterns.some((p) => p.test(query))) {
      entry.genres.forEach((g) => found.add(g));
    }
  }
  return [...found];
}

// ─── Stop words ──────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  "de", "do", "da", "dos", "das", "um", "uma", "uns", "umas", "o", "a", "os", "as",
  "e", "em", "no", "na", "nos", "nas", "por", "para", "com", "que", "se", "ao",
  "aos", "às", "pelo", "pela", "pelos", "pelas", "mais", "mas", "ou", "nem", "sobre",
  "filme", "filmes", "serie", "séries", "historia", "história", "quero", "assistir",
  "ver", "busco", "procuro", "tipo", "estilo", "bom", "boa", "bons", "boas",
  "muito", "muita", "muitos", "muitas", "anos", "ano", "época", "epocas",
  "the", "of", "an", "and", "in", "qual", "como", "algo", "algum", "alguma",
  "aquele", "aquela", "esse", "essa", "este", "esta", "pra", "pras", "pros",
  "aqueles", "aquelas", "esses", "essas",
]);

// ─── Extração de keyword ─────────────────────────────────────────────────────
function extractKeyword(query, yearRange, genres) {
  let cleaned = query
    .replace(/\b(anos?\s+\d{2,4}s?|\d{4}s?)\b/gi, "")
    .replace(/[^\w\sáéíóúâêîôûãõàèìòùüç]/gi, " ");

  // Remove termos de gênero/humor
  for (const entry of GENRE_MAP) {
    for (const p of entry.patterns) {
      cleaned = cleaned.replace(new RegExp(p.source, "gi"), " ");
    }
  }

  // Remove termos de época
  cleaned = cleaned.replace(
    /\b(recente|recentes|novo|nova|atual|moderno|moderna|clássico|classico|antigo|velho|retro|retrô|lançamento)\b/gi,
    " "
  );

  const tokens = cleaned
    .split(/\s+/)
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  return tokens.length > 0 ? tokens.join(" ") : null;
}

// ─── Cálculo de confiança (0.0 – 0.95) ──────────────────────────────────────
function calculateConfidence(genres, yearRange, keyword) {
  // Nenhum atributo → fallback puro
  if (genres.length === 0 && !yearRange && !keyword) return 0.10;
  let score = 0.10;
  if (genres.length > 0) score += 0.40;
  if (yearRange) score += 0.30;
  if (keyword) score += 0.20;
  return Math.min(0.95, score);
}

// ─── Busca principal com paginação e scoring ──────────────────────────────────
async function searchMovies({ genres, yearRange, keyword, minRating, minVotes, page, limit }) {
  const params = [];
  const conditions = [];

  // min_votes (sempre)
  params.push(minVotes);
  conditions.push(`num_votes >= $${params.length}`);

  // min_rating opcional
  if (minRating != null && !isNaN(minRating)) {
    params.push(minRating);
    conditions.push(`average_rating >= $${params.length}`);
  }

  // gênero
  if (genres.length > 0) {
    params.push(genres);
    conditions.push(`genres && $${params.length}::text[]`);
  }

  // época
  if (yearRange) {
    params.push(yearRange.from);
    conditions.push(`start_year >= $${params.length}`);
    params.push(yearRange.to);
    conditions.push(`start_year <= $${params.length}`);
  }

  // keyword — guarda índice para reutilizar na cláusula ORDER BY e SELECT
  let keywordIdx = null;
  if (keyword) {
    params.push(keyword);
    keywordIdx = params.length;
    params.push(`%${keyword}%`);
    const likeIdx = params.length;
    conditions.push(
      `(similarity(primary_title, $${keywordIdx}) > 0.1` +
      ` OR similarity(original_title, $${keywordIdx}) > 0.1` +
      ` OR similarity(array_to_string(pt_titles, ' '), $${keywordIdx}) > 0.08` +
      ` OR primary_title ILIKE $${likeIdx})`
    );
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // relevance_score: 70% semântico (trigram) + 30% qualidade
  const relevanceExpr = keywordIdx != null
    ? `ROUND((
        0.7 * GREATEST(
          similarity(primary_title, $${keywordIdx}),
          similarity(original_title, $${keywordIdx}),
          similarity(array_to_string(pt_titles, ' '), $${keywordIdx}),
          0.1
        ) + 0.3 * LEAST(1.0, COALESCE(quality_score, 0) / 65.0)
      )::numeric, 3) AS relevance_score`
    : `ROUND((0.42 + 0.3 * LEAST(1.0, COALESCE(quality_score, 0) / 65.0))::numeric, 3) AS relevance_score`;

  // COUNT para total (params sem limit/offset)
  const countResult = await pool.query(
    `SELECT COUNT(*) AS total FROM movies_search ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Adicionar paginação
  params.push(limit);
  const limitIdx = params.length;
  params.push((page - 1) * limit);
  const offsetIdx = params.length;

  const orderBy = keywordIdx != null
    ? `relevance_score DESC NULLS LAST, quality_score DESC NULLS LAST`
    : `quality_score DESC NULLS LAST`;

  const mainSql = `
    SELECT
      tconst,
      primary_title,
      original_title,
      start_year,
      runtime_minutes,
      genres,
      average_rating,
      num_votes,
      pt_titles,
      ${relevanceExpr}
    FROM movies_search
    ${where}
    ORDER BY ${orderBy}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const result = await pool.query(mainSql, params);
  return { rows: result.rows, total };
}

// ─── Fallback: trigram nos títulos quando parser extrai zero atributos ────────
async function searchByTitle(rawQuery, minVotes, page, limit) {
  const baseParams = [rawQuery, `%${rawQuery}%`, minVotes];

  const countResult = await pool.query(
    `SELECT COUNT(*) AS total FROM movies_search
     WHERE (similarity(primary_title, $1) > 0.1 OR primary_title ILIKE $2)
       AND num_votes >= $3`,
    baseParams
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const mainSql = `
    SELECT
      tconst,
      primary_title,
      original_title,
      start_year,
      runtime_minutes,
      genres,
      average_rating,
      num_votes,
      pt_titles,
      ROUND((
        0.7 * GREATEST(similarity(primary_title, $1), 0.1)
        + 0.3 * LEAST(1.0, COALESCE(quality_score, 0) / 65.0)
      )::numeric, 3) AS relevance_score
    FROM movies_search
    WHERE (similarity(primary_title, $1) > 0.1 OR primary_title ILIKE $2)
      AND num_votes >= $3
    ORDER BY similarity(primary_title, $1) DESC, quality_score DESC NULLS LAST
    LIMIT $4 OFFSET $5
  `;

  const result = await pool.query(mainSql, [...baseParams, limit, (page - 1) * limit]);
  return { rows: result.rows, total };
}

// ─── Handler Netlify ──────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const qs = event.queryStringParameters || {};
  const q = (qs.q || "").trim();

  if (!q) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "INVALID_QUERY",
        message: "Parâmetro 'q' é obrigatório.",
        status: 400,
      }),
    };
  }

  if (q.length > 500) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "INVALID_QUERY",
        message: "Query muito longa. Máximo 500 caracteres.",
        status: 400,
      }),
    };
  }

  const page = Math.max(1, parseInt(qs.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(qs.limit, 10) || 10));
  const minRating = qs.min_rating != null ? parseFloat(qs.min_rating) : null;
  const minVotes = Math.max(0, parseInt(qs.min_votes, 10) || 1000);

  if (!connectionString) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "INTERNAL_ERROR",
        message: "Variável de ambiente DATA_URL não configurada.",
        status: 500,
      }),
    };
  }

  try {
    const genres = extractGenres(q);
    const yearRange = extractYearRange(q);
    const keyword = extractKeyword(q, yearRange, genres);
    let confidence = calculateConfidence(genres, yearRange, keyword);

    let result;

    if (genres.length === 0 && !yearRange && !keyword) {
      // Nada extraído → busca trigram direta
      result = await searchByTitle(q, minVotes, page, limit);
      confidence = 0.10;
    } else {
      result = await searchMovies({ genres, yearRange, keyword, minRating, minVotes, page, limit });

      // Fallback progressivo — apenas na primeira página
      if (result.total === 0 && keyword && page === 1) {
        result = await searchMovies({ genres, yearRange, keyword: null, minRating, minVotes, page, limit });
        confidence = Math.max(0.10, parseFloat((confidence * 0.55).toFixed(2)));
      }

      if (result.total === 0 && yearRange && page === 1) {
        result = await searchMovies({ genres, yearRange: null, keyword: null, minRating, minVotes, page, limit });
        confidence = Math.max(0.10, parseFloat((confidence * 0.50).toFixed(2)));
      }

      if (result.total === 0 && page === 1) {
        result = await searchByTitle(q, minVotes, page, limit);
        confidence = 0.10;
      }
    }

    const { rows, total } = result;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        query: q,
        parsed: { genres, yearRange, keyword },
        total,
        page,
        limit,
        has_next_page: page * limit < total,
        confidence: parseFloat(confidence.toFixed(2)),
        results: rows,
      }),
    };
  } catch (err) {
    console.error("search-02 error:", JSON.stringify({ message: err.message }));
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "INTERNAL_ERROR",
        message: "Erro interno ao buscar filmes.",
        status: 500,
      }),
    };
  }
};
