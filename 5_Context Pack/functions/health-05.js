'use strict';

const { Pool } = require('pg');

/** @type {import('pg').Pool | null} */
let pool = null;

function getPool() {
  if (pool) return pool;
  const url = process.env.data_url;
  if (!url) throw new Error('data_url environment variable is not set');
  pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 3000,
  });
  return pool;
}

/** @type {Record<string, string>} */
const RESPONSE_HEADERS = {
  'Content-Type':                'application/json',
  'Access-Control-Allow-Origin': '*',
};

/**
 * Health check — verifies database connectivity.
 * @param {{ httpMethod: string }} event
 */
exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: RESPONSE_HEADERS, body: '' };
  }

  const start = Date.now();

  try {
    const db = getPool();
    await db.query('SELECT 1');
    const latency_ms = Date.now() - start;

    return {
      statusCode: 200,
      headers: RESPONSE_HEADERS,
      body: JSON.stringify({
        status:     'ok',
        database:   'connected',
        latency_ms,
      }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ event: 'health_check_error', message }));

    return {
      statusCode: 200,
      headers: RESPONSE_HEADERS,
      body: JSON.stringify({
        status:     'degraded',
        database:   'unreachable',
        latency_ms: null,
      }),
    };
  }
};
