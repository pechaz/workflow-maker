import type { WorkflowConnection } from '../workflow/types.ts';
import type { WorkflowIssue } from './issue.ts';
import { isRecord } from './record.ts';

export function parseConnection(
  value: unknown,
  index: number,
): { connection: WorkflowConnection } | { issue: WorkflowIssue } {
  if (!isRecord(value)) {
    return { issue: { code: 'malformed', message: `Connection ${index + 1} must be an object.` } };
  }

  if (typeof value.id !== 'string' || value.id.trim().length === 0) {
    return { issue: { code: 'malformed', message: `Connection ${index + 1} needs an id.` } };
  }

  if (typeof value.fromStepId !== 'string' || typeof value.toStepId !== 'string') {
    return {
      issue: {
        code: 'malformed',
        message: `Connection "${value.id}" must point from one step id to another.`,
        connectionIds: [value.id],
      },
    };
  }

  return {
    connection: {
      id: value.id,
      fromStepId: value.fromStepId,
      toStepId: value.toStepId,
    },
  };
}
