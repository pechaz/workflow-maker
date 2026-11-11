import { createServer, type Server } from 'node:http';
import type { Workflow } from '@workflow/shared';
import { createApp } from '../../../app/index.ts';
import { createMemoryRepository } from '../index.ts';

export type WorkflowResponse = {
  revision: number;
  workflow: Workflow;
  schedule: { workflowDurationMinutes: number } | null;
};

export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    issues: { code: string; stepIds?: string[]; connectionIds?: string[] }[];
  };
};

export async function withApp(run: (baseUrl: string) => Promise<void>) {
  const app = createApp(createMemoryRepository());
  const server = createServer(app);
  await listen(server);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await close(server);
  }
}

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

export function put(baseUrl: string, body: unknown, raw = false) {
  return fetch(`${baseUrl}/api/workflow`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}
