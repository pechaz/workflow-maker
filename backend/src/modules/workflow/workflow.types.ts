import type { Workflow } from '@workflow/shared';

export type StoredWorkflow = {
  revision: number;
  workflow: Workflow;
};

export type WorkflowRepository = {
  load(): Promise<StoredWorkflow>;
  save(workflow: Workflow): Promise<StoredWorkflow>;
};

export function cloneStored(stored: StoredWorkflow): StoredWorkflow {
  return structuredClone(stored);
}
