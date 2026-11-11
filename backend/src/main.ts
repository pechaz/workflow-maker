import { createApp } from './app/index.ts';
import { createPool } from './database/index.ts';
import { createPostgresRepository } from './modules/workflow/index.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const port = Number(process.env.PORT ?? 3001);
const pool = await createPool(databaseUrl);
const app = createApp(createPostgresRepository(pool));

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on http://0.0.0.0:${port}/health`);
});

async function shutdown() {
  server.close();
  await pool.end();
}

process.on('SIGTERM', () => {
  void shutdown();
});
process.on('SIGINT', () => {
  void shutdown();
});
