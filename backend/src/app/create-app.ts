import express from 'express';
import { handleError } from '../http/index.ts';
import { createHealthRouter } from '../modules/health/index.ts';
import { createWorkflowRouter, type WorkflowRepository } from '../modules/workflow/index.ts';

export function createApp(repository: WorkflowRepository) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/health', createHealthRouter());
  app.use('/api/workflow', createWorkflowRouter(repository));
  app.use(handleError);
  return app;
}
