import { Router } from 'express';
import { scheduleWorkflow, validateWorkflow } from '@workflow/shared';
import { malformed } from '../../http/index.ts';
import type { WorkflowRepository } from './workflow.types.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createWorkflowRouter(repository: WorkflowRepository): Router {
  const router = Router();

  router.get('/', async (_request, response, next) => {
    try {
      const stored = await repository.load();
      response.json({
        revision: stored.revision,
        workflow: stored.workflow,
        schedule: scheduleWorkflow(stored.workflow),
      });
    } catch (error) {
      next(error);
    }
  });

  router.put('/', async (request, response, next) => {
    try {
      if (!isRecord(request.body) || !('workflow' in request.body)) {
        response.status(400).json(
          malformed('Request body must be an object with a workflow.', [
            {
              code: 'malformed',
              message: 'Request body must be an object with a workflow.',
            },
          ]),
        );
        return;
      }

      const result = validateWorkflow(request.body.workflow);
      if (!result.ok) {
        response.status(result.status).json({ error: result.error });
        return;
      }

      const stored = await repository.save(result.workflow);
      response.json({
        revision: stored.revision,
        workflow: stored.workflow,
        schedule: scheduleWorkflow(stored.workflow),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
