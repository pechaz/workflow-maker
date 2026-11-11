import type { Workflow, WorkflowIssue, WorkflowSchedule } from '@workflow/shared';

export type WorkflowPayload = {
  revision: number;
  workflow: Workflow;
  schedule: WorkflowSchedule | null;
};

export type SaveFailure = Error & {
  status?: number;
  issues: WorkflowIssue[];
};

export async function loadWorkflow(): Promise<WorkflowPayload> {
  const response = await fetch('/api/workflow');
  if (!response.ok) {
    throw new Error('Could not load the workflow.');
  }
  return (await response.json()) as WorkflowPayload;
}

export async function saveWorkflow(workflow: Workflow): Promise<WorkflowPayload> {
  let response: Response;
  try {
    response = await fetch('/api/workflow', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow }),
    });
  } catch {
    const error = new Error('Could not reach the server. Your changes are still on screen.') as SaveFailure;
    error.issues = [];
    throw error;
  }

  const body = (await response.json().catch(() => null)) as
    | WorkflowPayload
    | { error?: { message?: string; issues?: WorkflowIssue[] } }
    | null;

  if (!response.ok) {
    const message =
      body && 'error' in body && body.error?.message
        ? body.error.message
        : 'Could not save the workflow. Your changes are still on screen.';
    const error = new Error(message) as SaveFailure;
    error.status = response.status;
    error.issues = body && 'error' in body && body.error?.issues ? body.error.issues : [];
    throw error;
  }

  return body as WorkflowPayload;
}
