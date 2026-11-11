import type { WorkflowStep } from '../workflow/types.ts';
import type { WorkflowIssue } from './issue.ts';
import { isRecord } from './record.ts';

export function stepLabel(step: { id: string; name: string }): string {
  const name = step.name.trim();
  return name.length > 0 ? name : step.id;
}

export function parseStep(value: unknown, index: number): { step: WorkflowStep } | { issue: WorkflowIssue } {
  if (!isRecord(value)) {
    return { issue: { code: 'malformed', message: `Step ${index + 1} must be an object.` } };
  }

  if (typeof value.id !== 'string' || value.id.trim().length === 0) {
    return { issue: { code: 'malformed', message: `Step ${index + 1} needs an id.` } };
  }

  if (typeof value.name !== 'string') {
    return {
      issue: {
        code: 'malformed',
        message: `Step "${value.id}" name must be text.`,
        stepIds: [value.id],
      },
    };
  }

  if (typeof value.durationMinutes !== 'number') {
    return {
      issue: {
        code: 'malformed',
        message: `Step "${stepLabel({ id: value.id, name: value.name })}" duration must be a number of minutes.`,
        stepIds: [value.id],
      },
    };
  }

  if (!isRecord(value.position) || typeof value.position.x !== 'number' || typeof value.position.y !== 'number') {
    return {
      issue: {
        code: 'malformed',
        message: `Step "${stepLabel({ id: value.id, name: value.name })}" needs a numeric position.`,
        stepIds: [value.id],
      },
    };
  }

  return {
    step: {
      id: value.id,
      name: value.name.trim(),
      durationMinutes: value.durationMinutes,
      position: { x: value.position.x, y: value.position.y },
    },
  };
}
