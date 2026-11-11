import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { test } from 'node:test';
import { createApp } from '../../../app/index.ts';
import { createMemoryRepository } from '../../workflow/index.ts';

test('health reports ok', async () => {
  const app = createApp(createMemoryRepository());
  const server = createServer(app);
  await listen(server);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  } finally {
    await close(server);
  }
});

function listen(server: Server) {
  return new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
}

function close(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
