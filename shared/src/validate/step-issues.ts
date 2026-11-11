import type { WorkflowStep } from '../workflow/types.ts';
import type { WorkflowIssue } from './issue.ts';
import { stepLabel } from './parse-step.ts';

export function collectStepIssues(steps: WorkflowStep[]): {
  issues: WorkflowIssue[];
  stepsById: Map<string, WorkflowStep>;
} {
  const issues: WorkflowIssue[] = [];
  const stepsById = new Map<string, WorkflowStep>();
  const seenStepIds = new Set<string>();

  for (const step of steps) {
    if (seenStepIds.has(step.id)) {
      issues.push({
        code: 'duplicate-step-id',
        message: `Step id "${step.id}" is used more than once.`,
        stepIds: [step.id],
      });
    }
    seenStepIds.add(step.id);
    stepsById.set(step.id, step);

    if (step.name.length === 0) {
      issues.push({
        code: 'empty-name',
        message: `Step "${step.id}" needs a name.`,
        stepIds: [step.id],
      });
    }

    if (!Number.isFinite(step.durationMinutes) || step.durationMinutes <= 0) {
      issues.push({
        code: 'invalid-duration',
        message: `Step "${stepLabel(step)}" duration must be a positive number of minutes.`,
        stepIds: [step.id],
      });
    }

    if (!Number.isFinite(step.position.x) || !Number.isFinite(step.position.y)) {
      issues.push({
        code: 'invalid-position',
        message: `Step "${stepLabel(step)}" has an invalid position.`,
        stepIds: [step.id],
      });
    }
  }

  return { issues, stepsById };
}
