import type { Handler } from '@netlify/functions';
import { getPool } from '../lib/db';
import type { HealthResponse } from '../lib/types';

const HEADERS = {
  'Content-Type':                'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':'Content-Type',
  'Access-Control-Allow-Methods':'GET, OPTIONS',
};

function log(level: 'info' | 'error', data: Record<string, unknown>) {
  console.log(JSON.stringify({ level, fn: 'health-04', ...data }));
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  const t0 = Date.now();
  try {
    const pool   = getPool();
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }

    const latency = Date.now() - t0;
    const response: HealthResponse = {
      status:     'ok',
      database:   'connected',
      latency_ms: latency,
    };

    log('info', { status: 'ok', latency_ms: latency });
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(response) };
  } catch (err) {
    const latency = Date.now() - t0;
    log('error', {
      status:    'degraded',
      latency_ms: latency,
      message:   err instanceof Error ? err.message : 'Unknown error',
    });

    const response: HealthResponse = {
      status:     'degraded',
      database:   'unreachable',
      latency_ms: null,
    };
    return { statusCode: 503, headers: HEADERS, body: JSON.stringify(response) };
  }
};
