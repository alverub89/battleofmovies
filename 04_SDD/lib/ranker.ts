import type { SearchRawRow } from './search';
import type { Movie } from './types';

/**
 * Recebe as linhas brutas do banco e calcula o relevanceScore final.
 * Fórmula: 0.7 × semanticScore + 0.3 × qualityScore (clampado entre 0 e 1).
 *
 * A ordenação já foi feita pelo SQL; aqui apenas formatamos o output.
 */
export function rank(rows: SearchRawRow[]): Movie[] {
  return rows.map(row => ({
    tconst:         row.tconst,
    primaryTitle:   row.primaryTitle,
    startYear:      row.startYear,
    genres:         row.genres ?? [],
    runtimeMinutes: row.runtimeMinutes,
    averageRating:  row.averageRating,
    numVotes:       row.numVotes,
    relevanceScore: clamp(
      parseFloat(
        (0.7 * row.semanticScore + 0.3 * (row.qualityScore ?? 0)).toFixed(4),
      ),
      0,
      1,
    ),
  }));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
