import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';

export async function createPool(databaseUrl: string): Promise<Pool> {
  const pool = new Pool({ connectionString: databaseUrl });
  const sql = await readFile(new URL('../../migrations/001_init.sql', import.meta.url), 'utf8');
  await pool.query(sql);
  return pool;
}
