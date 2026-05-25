import type { ErrorResponse, SearchParams } from './types';

export type ValidationResult =
  | { ok: true; params: SearchParams }
  | { ok: false; error: ErrorResponse };

/**
 * Valida os query string parameters da requisição de busca.
 * Retorna { ok: true, params } ou { ok: false, error } (CA-04).
 */
export function validateSearchParams(
  qs: Record<string, string | undefined>,
): ValidationResult {
  // ── q (obrigatório) ──────────────────────────────────────────────────────
  const q = (qs['q'] ?? '').trim();

  if (!q) {
    return {
      ok: false,
      error: {
        error: 'INVALID_QUERY',
        message: 'O parâmetro q é obrigatório e não pode estar vazio.',
        status: 400,
      },
    };
  }

  if (q.length > 200) {
    return {
      ok: false,
      error: {
        error: 'INVALID_QUERY',
        message: 'A query não pode ter mais de 200 caracteres.',
        status: 400,
      },
    };
  }

  if (!/[a-záàãâäéèêëíìîïóòõôöúùûüçñ0-9]/i.test(q)) {
    return {
      ok: false,
      error: {
        error: 'INVALID_QUERY',
        message: 'A query deve conter ao menos uma letra ou número válido.',
        status: 400,
      },
    };
  }

  // ── page (opcional, default 1) ────────────────────────────────────────────
  const rawPage = qs['page'];
  const page = rawPage !== undefined ? parseInt(rawPage, 10) : 1;
  if (!Number.isInteger(page) || page < 1) {
    return {
      ok: false,
      error: {
        error: 'INVALID_PARAMETER',
        message: 'O parâmetro page deve ser um inteiro maior ou igual a 1.',
        status: 400,
      },
    };
  }

  // ── limit (opcional, default 10) ─────────────────────────────────────────
  const rawLimit = qs['limit'];
  const limit = rawLimit !== undefined ? parseInt(rawLimit, 10) : 10;
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return {
      ok: false,
      error: {
        error: 'INVALID_PARAMETER',
        message: 'O parâmetro limit deve ser um inteiro entre 1 e 50.',
        status: 400,
      },
    };
  }

  return { ok: true, params: { q, page, limit } };
}
