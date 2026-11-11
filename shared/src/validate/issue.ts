import type { Workflow } from '../workflow/types.ts';

export type WorkflowIssue = {
  code: string;
  message: string;
  stepIds?: string[];
  connectionIds?: string[];
};

export type WorkflowErrorBody = {
  code: 'malformed-workflow' | 'invalid-workflow';
  message: string;
  issues: WorkflowIssue[];
};

export type ValidationResult =
  | { ok: true; workflow: Workflow }
  | { ok: false; status: 400 | 422; error: WorkflowErrorBody };
