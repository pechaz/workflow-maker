import type { ErrorRequestHandler } from 'express';
import type { WorkflowIssue } from '@workflow/shared';

export function malformed(message: string, issues: WorkflowIssue[]) {
  return {
    error: {
      code: 'malformed-workflow' as const,
      message,
      issues,
    },
  };
}

export const handleError: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof SyntaxError) {
    response.status(400).json(
      malformed('Request body is not valid JSON.', [
        { code: 'malformed', message: 'Request body is not valid JSON.' },
      ]),
    );
    return;
  }

  response.status(500).json({
    error: {
      code: 'internal-error',
      message: 'The workflow could not be handled.',
      issues: [],
    },
  });
};
