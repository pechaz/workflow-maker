import { assessWorkflow } from './assess.ts';
import type { WorkflowErrorBody, ValidationResult } from './issue.ts';

function failure(
  status: 400 | 422,
  code: WorkflowErrorBody['code'],
  message: string,
  issues: WorkflowErrorBody['issues'],
): ValidationResult {
  return { ok: false, status, error: { code, message, issues } };
}

export function validateWorkflow(input: unknown): ValidationResult {
  const assessment = assessWorkflow(input);

  if (assessment.malformed.length > 0) {
    return failure(
      400,
      'malformed-workflow',
      'Workflow could not be read. Check the request shape and try again.',
      assessment.malformed,
    );
  }

  if (assessment.issues.length > 0) {
    return failure(
      422,
      'invalid-workflow',
      'Workflow is invalid and was not saved. Fix the problems below and keep editing.',
      assessment.issues,
    );
  }

  return {
    ok: true,
    workflow: {
      steps: assessment.steps,
      connections: assessment.connections,
    },
  };
}
