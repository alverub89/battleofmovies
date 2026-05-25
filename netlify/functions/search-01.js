// search-01.js — Netlify Function
// Busca de filmes em linguagem natural sobre a base IMDb (Neon PostgreSQL)
// Parser rule-based: extrai gênero, época e palavras-chave da query em texto livre

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATA_URL,
  max: 1,
  ssl: { rejectUnauthorized: false },
});

// ─── Mapeamento gênero PT-BR → IMDb genres ────────────────────────────────────
const GENRE_MAP = [
  { patterns: [/terror|horror|assust|medo/i], genres: ["Horror"] },
  { patterns: [/psicológic|psicologico|suspense/i], genres: ["Thriller"] },
  { patterns: [/thriller|tensão|tensao/i], genres: ["Thriller"] },
  { patterns: [/comédia|comedia|engraçad|engraçado|humor|comica|cómica/i], genres: ["Comedy"] },
  { patterns: [/romântic|romantico|romance|amor|amorosa/i], genres: ["Romance"] },
  {
    patterns: [/ação|acao|aventura|action|explosão|explosao/i],
    genres: ["Action"],
  },
  {
    patterns: [
      /ficção científica|ficcao cientifica|sci-fi|scifi|científico|futuro|robô|robos/i,
    ],
    genres: ["Sci-Fi"],
  },
  { patterns: [/espacial|espaço|espaco|galáxia|galaxia|planeta/i], genres: ["Sci-Fi"] },
  { patterns: [/animação|animacao|desenho animado|cartoon|animad/i], genres: ["Animation"] },
  { patterns: [/documentário|documentario|documental/i], genres: ["Documentary"] },
  { patterns: [/drama|dramático|dramatico/i], genres: ["Drama"] },
  { patterns: [/fantasia|mágico|magico|magia|fantástico|fantastico/i], genres: ["Fantasy"] },
  { patterns: [/crime|policial|detetive|investigação|investigacao/i], genres: ["Crime"] },
  { patterns: [/guerra|batalha|militar|soldado/i], genres: ["War"] },
  { patterns: [/western|velho oeste|faroeste/i], genres: ["Western"] },
  { patterns: [/musical|música|musica|cantando/i], genres: ["Music", "Musical"] },
  { patterns: [/biografia|biográfico|biografico|vida real/i], genres: ["Biography"] },
  { patterns: [/história|historia|histórico|historico/i], genres: ["History"] },
  { patterns: [/super.?herói|super.?heroi|super.?hero|herói|marvel|dc comics/i], genres: ["Action"] },
  { patterns: [/mistério|misterio|misterioso/i], genres: ["Mystery"] },
  { patterns: [/família|familia|infantil|criança|criancas/i], genres: ["Family"] },
  { patterns: [/esporte|esportes|futebol|basquete|sport/i], genres: ["Sport"] },
];

// ─── Extração de época / década ───────────────────────────────────────────────
function extractYearRange(query) {
  // "anos 90", "anos 80", etc.
  const decadeWord = query.match(/\banos?\s+(\d{2})\b/i);
  if (decadeWord) {
    const d = parseInt(decadeWord[1], 10);
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

  // Ano explícito isolado: "1994", "2003"
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

// ─── Remoção de stop words para extrair keyword de título ────────────────────
const STOP_WORDS = new Set([
  "de", "do", "da", "dos", "das", "um", "uma", "uns", "umas", "o", "a", "os", "as",
  "e", "em", "no", "na", "nos", "nas", "por", "para", "com", "que", "se", "ao",
  "aos", "às", "pelo", "pela", "pelos", "pelas", "mais", "mas", "ou", "nem", "sobre",
  "filme", "filmes", "serie", "séries", "historia", "história", "quero", "assistir",
  "ver", "busco", "procuro", "tipo", "estilo", "bom", "boa", "bons", "boas",
  "muito", "muita", "muitos", "muitas", "anos", "ano", "época", "epocas", "época",
  "dos", "das", "the", "of", "a", "an", "and", "in",
]);

function extractKeyword(query, yearRange, genres) {
  // Remove tokens que já foram capturados (ano e palavras de gênero)
  let cleaned = query
    .replace(/\b(anos?\s+\d{2,4}s?|\d{4}s?)\b/gi, "")
    .replace(/[^\w\sáéíóúâêîôûãõàèìòùüç]/gi, " ");

  // Remove palavras de gênero já mapeadas
  for (const entry of GENRE_MAP) {
    for (const p of entry.patterns) {
      cleaned = cleaned.replace(new RegExp(p.source, "gi"), " ");
    }
  }

  const tokens = cleaned
    .split(/\s+/)
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  return tokens.length > 0 ? tokens.join(" ") : null;
}

// ─── Query SQL dinâmica ───────────────────────────────────────────────────────
async function searchMovies({ genres, yearRange, keyword }) {
  const params = [];
  const conditions = [];

  // Filtro de gênero
  if (genres.length > 0) {
    params.push(genres);
    conditions.push(`genres && $${params.length}::text[]`);
  }

  // Filtro de época
  if (yearRange) {
    params.push(yearRange.from);
    conditions.push(`start_year >= $${params.length}`);
    params.push(yearRange.to);
    conditions.push(`start_year <= $${params.length}`);
  }

  // Trigram search em títulos (evita unnest em subquery correlacionada)
  if (keyword) {
    params.push(keyword);
    const idx = params.length;
    conditions.push(
      `(similarity(primary_title, $${idx}) > 0.15 OR ` +
      `similarity(original_title, $${idx}) > 0.15 OR ` +
      `similarity(array_to_string(pt_titles, ' '), $${idx}) > 0.1)`
    );
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Se não extraiu nada, busca por similaridade nos títulos com a query original
  const sql = `
    SELECT
      tconst,
      primary_title,
      original_title,
      start_year,
      runtime_minutes,
      genres,
      average_rating,
      num_votes,
      quality_score,
      pt_titles
    FROM movies_search
    ${where}
    ORDER BY quality_score DESC NULLS LAST
    LIMIT 10
  `;

  const result = await pool.query(sql, params);
  return result.rows;
}

// ─── Fallback: busca apenas por trigram no título quando não extrai nada ──────
async function searchByTitle(rawQuery) {
  const sql = `
    SELECT
      tconst,
      primary_title,
      original_title,
      start_year,
      runtime_minutes,
      genres,
      average_rating,
      num_votes,
      quality_score,
      pt_titles
    FROM movies_search
    WHERE similarity(primary_title, $1) > 0.1
      OR primary_title ILIKE $2
    ORDER BY similarity(primary_title, $1) DESC, quality_score DESC NULLS LAST
    LIMIT 10
  `;
  const result = await pool.query(sql, [rawQuery, `%${rawQuery}%`]);
  return result.rows;
}

// ─── Handler Netlify ──────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const q = (event.queryStringParameters?.q || "").trim();

  if (!q) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Parâmetro 'q' é obrigatório." }),
    };
  }

  if (q.length > 300) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Query muito longa. Máximo 300 caracteres." }),
    };
  }

  if (!process.env.DATA_URL) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Variável de ambiente DATA_URL não configurada." }),
    };
  }

  try {
    const genres = extractGenres(q);
    const yearRange = extractYearRange(q);
    const keyword = extractKeyword(q, yearRange, genres);

    let movies;

    if (genres.length === 0 && !yearRange && !keyword) {
      // Nada extraído → busca por trigram no título
      movies = await searchByTitle(q);
    } else {
      movies = await searchMovies({ genres, yearRange, keyword });

      // Se resultado vazio com filtros, tenta sem keyword (mais abrangente)
      if (movies.length === 0 && keyword) {
        movies = await searchMovies({ genres, yearRange, keyword: null });
      }

      // Se ainda vazio, remove filtro de ano também
      if (movies.length === 0 && yearRange) {
        movies = await searchMovies({ genres, yearRange: null, keyword: null });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        query: q,
        parsed: { genres, yearRange, keyword },
        total: movies.length,
        results: movies,
      }),
    };
  } catch (err) {
    console.error("search-01 error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Erro interno ao buscar filmes.",
        detail: err.message,
      }),
    };
  }
};
