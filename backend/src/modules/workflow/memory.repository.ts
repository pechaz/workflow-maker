import { exampleWorkflow } from '@workflow/shared';
import { cloneStored, type StoredWorkflow, type WorkflowRepository } from './workflow.types.ts';

export function createMemoryRepository(initial: StoredWorkflow | null = null): WorkflowRepository {
  let state = initial === null ? null : cloneStored(initial);

  return {
    async load() {
      if (!state) {
        state = { revision: 1, workflow: structuredClone(exampleWorkflow) };
      }
      return cloneStored(state);
    },

    async save(workflow) {
      state = {
        revision: (state?.revision ?? 0) + 1,
        workflow: structuredClone(workflow),
      };
      return cloneStored(state);
    },
  };
}
