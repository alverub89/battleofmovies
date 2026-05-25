import { Pool } from 'pg';

// Singleton de conexão com o banco via DATA_URL.
// ssl: { rejectUnauthorized: false } é obrigatório para Neon via Netlify Functions.

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (!_pool) {
    const dataUrl = process.env['DATA_URL'];
    if (!dataUrl) {
      throw new Error('[db] DATA_URL environment variable is not set');
    }
    _pool = new Pool({
      connectionString: dataUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
  }
  return _pool;
}
