// Tipos compartilhados — 4_SDD
// Derivados exclusivamente dos Critérios de Aceite do SDD.

export interface Movie {
  tconst: string;
  primaryTitle: string;
  startYear: number | null;
  genres: string[];
  runtimeMinutes: number | null;
  averageRating: number;
  numVotes: number;
  relevanceScore: number;
}

export interface SearchParams {
  q: string;
  page: number;
  limit: number;
}

export interface ParsedQuery {
  genres: string[];
  yearFrom: number | null;
  yearTo: number | null;
  requiredTerms: string[];
  /** Float entre 0.0 e 1.0. Abaixo de 0.3 indica query ambígua (US-03). */
  confidence: number;
}

/** CA-03 — Resposta de busca */
export interface SearchResponse {
  query: string;
  total: number;
  page: number;
  limit: number;
  has_next_page: boolean;
  confidence: number;
  results: Movie[];
}

export type ErrorCode =
  | 'INVALID_QUERY'
  | 'INVALID_PARAMETER'
  | 'INTERNAL_ERROR';

/** CA-04 — Erros estruturados */
export interface ErrorResponse {
  error: ErrorCode;
  message: string;
  status: number;
}

/** CA-05 — Health check */
export interface HealthResponse {
  status: 'ok' | 'degraded';
  database: 'connected' | 'unreachable';
  latency_ms: number | null;
}
