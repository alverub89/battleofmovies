import type { ParsedQuery } from './types';

// ─── Stop words ────────────────────────────────────────────────────────────
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

// ─── Phrase-first genre mappings ──────────────────────────────────────────
// (verificados antes dos termos simples para evitar conflitos)
const PHRASE_GENRES: Array<[string, string[]]> = [
  ['ficção científica',      ['Sci-Fi']],
  ['ficcao cientifica',      ['Sci-Fi']],
  ['ficção-científica',      ['Sci-Fi']],
  ['ficcao-cientifica',      ['Sci-Fi']],
  ['inteligência artificial',['Sci-Fi']],
  ['inteligencia artificial',['Sci-Fi']],
  ['segunda guerra',         ['War']],
  ['primeira guerra',        ['War']],
  ['velho oeste',            ['Western']],
  ['nave espacial',          ['Sci-Fi']],
  ['vida real',              ['Biography']],
  ['baseado em fatos',       ['Biography']],
  ['historia real',          ['Biography']],
  ['história real',          ['Biography']],
  ['historia verdadeira',    ['Biography']],
  ['história verdadeira',    ['Biography']],
  ['desenho animado',        ['Animation']],
  ['final triste',           ['Drama', 'Romance']],
  ['protagonista feminina',  ['Drama']],
  ['pais e filhos',          ['Family']],
];

// ─── Single-word genre mappings ───────────────────────────────────────────
const WORD_GENRES = new Map<string, string[]>([
  // Horror
  ['terror',         ['Horror']], ['horrores',     ['Horror']],
  ['horror',         ['Horror']], ['assustador',   ['Horror']],
  ['fantasma',       ['Horror']], ['zumbi',        ['Horror']],
  ['vampiro',        ['Horror']], ['assustar',     ['Horror']],
  ['medo',           ['Horror']],
  // Action
  ['ação',           ['Action']], ['acao',         ['Action']],
  // War
  ['guerra',         ['War']],   ['soldado',       ['War']],
  ['militar',        ['War']],   ['batalha',       ['War']],
  // Western
  ['faroeste',       ['Western']], ['western',     ['Western']],
  ['cowboy',         ['Western']], ['caubói',      ['Western']],
  ['cauboi',         ['Western']], ['mocinho',     ['Western']],
  ['bandido',        ['Western']], ['xerife',      ['Western']],
  // Drama
  ['drama',          ['Drama']],  ['dramático',    ['Drama']],
  ['dramatico',      ['Drama']],
  ['chorar',         ['Drama', 'Romance']],
  ['triste',         ['Drama', 'Romance']],
  ['tristeza',       ['Drama', 'Romance']],
  ['emocionante',    ['Drama', 'Romance']],
  ['emoção',         ['Drama']], ['emocao',        ['Drama']],
  // Comedy
  ['comédia',        ['Comedy']], ['comedia',      ['Comedy']],
  ['comica',         ['Comedy']], ['cômico',       ['Comedy']],
  ['comico',         ['Comedy']], ['rir',          ['Comedy']],
  ['engraçado',      ['Comedy']], ['engracado',    ['Comedy']],
  ['humor',          ['Comedy']], ['risada',       ['Comedy']],
  ['divertido',      ['Comedy']],
  // Romance
  ['romance',        ['Romance']], ['romântico',   ['Romance']],
  ['romantico',      ['Romance']], ['amor',        ['Romance']],
  ['namoro',         ['Romance']], ['paixão',      ['Romance']],
  ['paixao',         ['Romance']], ['apaixonar',   ['Romance']],
  // Sci-Fi
  ['robô',           ['Sci-Fi']], ['robo',         ['Sci-Fi']],
  ['robôs',          ['Sci-Fi']], ['robos',        ['Sci-Fi']],
  ['espaço',         ['Sci-Fi']], ['espaco',       ['Sci-Fi']],
  ['alien',          ['Sci-Fi']], ['aliens',       ['Sci-Fi']],
  ['extraterrestre', ['Sci-Fi']], ['futurista',    ['Sci-Fi']],
  ['futuro',         ['Sci-Fi']], ['cyborg',       ['Sci-Fi']],
  ['androide',       ['Sci-Fi']], ['distopia',     ['Sci-Fi']],
  ['distópico',      ['Sci-Fi']], ['distopico',    ['Sci-Fi']],
  ['espacial',       ['Sci-Fi']],
  // Thriller
  ['suspense',       ['Thriller']], ['thriller',   ['Thriller']],
  ['mistério',       ['Thriller']], ['misterio',   ['Thriller']],
  ['misterioso',     ['Thriller']],
  ['investigação',   ['Thriller']], ['investigacao',['Thriller']],
  // Crime
  ['crime',          ['Crime']], ['criminal',      ['Crime']],
  ['policial',       ['Crime']], ['detetive',      ['Crime']],
  ['assassino',      ['Crime']], ['mafia',         ['Crime']],
  ['máfia',          ['Crime']], ['gangue',        ['Crime']],
  ['tráfico',        ['Crime']], ['trafico',       ['Crime']],
  // Family
  ['família',        ['Family']], ['familia',      ['Family']],
  ['familiar',       ['Family']], ['infantil',     ['Family', 'Animation']],
  // History
  ['histórico',      ['History']], ['historico',   ['History']],
  ['medieval',       ['History', 'Fantasy']],
  ['antiguidade',    ['History']],
  ['época',          ['History']], ['epocal',      ['History']],
  // Animation
  ['animação',       ['Animation']], ['animacao',  ['Animation']],
  ['animado',        ['Animation']], ['animados',  ['Animation']],
  ['cartoon',        ['Animation']],
  // Fantasy
  ['fantasia',       ['Fantasy']], ['mágico',      ['Fantasy']],
  ['magico',         ['Fantasy']], ['magia',       ['Fantasy']],
  ['feiticeiro',     ['Fantasy']], ['dragão',      ['Fantasy']],
  ['dragao',         ['Fantasy']], ['elfo',        ['Fantasy']],
  ['elfos',          ['Fantasy']],
  ['monstro',        ['Horror', 'Fantasy']],
  // Adventure
  ['aventura',       ['Adventure']], ['explorador', ['Adventure']],
  ['exploração',     ['Adventure']], ['exploracao', ['Adventure']],
  // Biography
  ['biografia',      ['Biography']], ['biográfico', ['Biography']],
  ['biografico',     ['Biography']],
  // Music / Musical
  ['musical',        ['Music', 'Musical']], ['música', ['Music']],
  ['musica',         ['Music']],  ['dança',         ['Music']],
  ['danca',          ['Music']],
  // Sport
  ['esporte',        ['Sport']], ['esportivo',     ['Sport']],
  ['futebol',        ['Sport']], ['basquete',      ['Sport']],
  ['atleta',         ['Sport']], ['olimpíadas',    ['Sport']],
  ['olimpiadas',     ['Sport']],
  // Documentary
  ['documentário',   ['Documentary']], ['documentario', ['Documentary']],
]);

// Conjunto de todos os termos de gênero (para não os confundir com nomes próprios)
const ALL_GENRE_WORDS = new Set<string>([
  ...WORD_GENRES.keys(),
  ...PHRASE_GENRES.flatMap(([phrase]) => phrase.split(/\s+/)),
]);

// ─── Decade / year patterns ───────────────────────────────────────────────
type DecadeFn = (m: RegExpMatchArray) => { from: number; to: number };

const DECADE_PATTERNS: Array<{ re: RegExp; fn: DecadeFn }> = [
  {
    re: /\banos?\s+(20|30|40|50|60|70|80|90)s?\b/i,
    fn: m => { const d = parseInt(m[1] ?? '0', 10); return { from: 1900 + d, to: 1900 + d + 9 }; },
  },
  {
    re: /\bdos\s+(20|30|40|50|60|70|80|90)\b/i,
    fn: m => { const d = parseInt(m[1] ?? '0', 10); return { from: 1900 + d, to: 1900 + d + 9 }; },
  },
  {
    re: /\bdécada\s+de\s+(\d+)/i,
    fn: m => {
      const d = parseInt(m[1] ?? '0', 10);
      return d < 100 ? { from: 1900 + d, to: 1900 + d + 9 } : { from: d - (d % 10), to: d - (d % 10) + 9 };
    },
  },
  { re: /\bsé?culo\s+xxi\b/i,   fn: () => ({ from: 2000, to: 2099 }) },
  { re: /\bsé?culo\s+xx\b/i,    fn: () => ({ from: 1900, to: 1999 }) },
  { re: /\bsé?culo\s+xix\b/i,   fn: () => ({ from: 1800, to: 1899 }) },
  { re: /\bsé?culo\s+xviii\b/i, fn: () => ({ from: 1700, to: 1799 }) },
  {
    re: /\b(19[0-9]{2}|20[0-2][0-9])\b/,
    fn: m => { const y = parseInt(m[1] ?? '0', 10); return { from: y, to: y }; },
  },
];

// ─── Main parser ──────────────────────────────────────────────────────────

/**
 * Interpreta uma query em linguagem natural e extrai intenções estruturadas.
 * Retorna: { genres, yearFrom, yearTo, requiredTerms, confidence }
 *
 * confidence (0.0–1.0):
 *  >= 0.7  — gênero + faixa de ano detectados
 *  >= 0.5  — gênero OU faixa de ano detectados
 *  >= 0.3  — apenas termos capitalizados (possíveis títulos/nomes próprios)
 *   < 0.3  — nenhum sinal estruturado — busca puramente fuzzy
 */
export function parseQuery(raw: string): ParsedQuery {
  const result: ParsedQuery = {
    genres:        [],
    yearFrom:      null,
    yearTo:        null,
    requiredTerms: [],
    confidence:    0,
  };

  // 1. Palavras capitalizadas no meio da frase → possíveis títulos/nomes próprios
  const rawWords = raw.trim().split(/\s+/);
  for (let i = 1; i < rawWords.length; i++) {
    const word = rawWords[i];
    if (!word) continue;
    const stripped = word.replace(/[^A-Za-záàãâäéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ]/g, '');
    if (stripped.length < 3) continue;
    if (!/^[A-ZÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ]/.test(stripped)) continue;
    const lower = stripped.toLowerCase();
    if (!STOP_WORDS.has(lower) && !ALL_GENRE_WORDS.has(lower)) {
      result.requiredTerms.push(stripped);
    }
  }

  // 2. Extrair referências de décadas / anos
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

  // 3. Frases compostas de gênero (antes dos termos simples)
  for (const [phrase, genres] of PHRASE_GENRES) {
    if (working.includes(phrase)) {
      for (const g of genres) {
        if (!result.genres.includes(g)) result.genres.push(g);
      }
      working = working.replace(
        new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        ' ',
      );
    }
  }

  // 4. Termos simples de gênero
  const tokens = working
    .split(/[\s\-,./;:!?]+/)
    .map(w => w.replace(/[^a-záàãâäéèêëíìîïóòõôöúùûüçñ]/g, ''))
    .filter(Boolean);

  for (const token of tokens) {
    const mapped = WORD_GENRES.get(token);
    if (mapped) {
      for (const g of mapped) {
        if (!result.genres.includes(g)) result.genres.push(g);
      }
    }
  }

  // 5. Calcular confidence
  const hasGenre = result.genres.length > 0;
  const hasYear  = result.yearFrom !== null;
  const hasTerm  = result.requiredTerms.length > 0;

  if (hasGenre && hasYear)      result.confidence = 0.8;
  else if (hasGenre || hasYear) result.confidence = 0.5;
  else if (hasTerm)             result.confidence = 0.3;
  else                          result.confidence = 0.15;

  return result;
}
