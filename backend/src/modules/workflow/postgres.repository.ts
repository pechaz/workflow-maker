import type { Pool } from 'pg';
import { exampleWorkflow, validateWorkflow } from '@workflow/shared';
import type { StoredWorkflow, WorkflowRepository } from './workflow.types.ts';

type WorkflowRow = {
  revision: string | number;
  document: unknown;
};

function fromRow(row: WorkflowRow): StoredWorkflow {
  const result = validateWorkflow(row.document);
  if (!result.ok) {
    throw new Error('Stored workflow is invalid.');
  }

  return {
    revision: Number(row.revision),
    workflow: result.workflow,
  };
}

export function createPostgresRepository(pool: Pool): WorkflowRepository {
  return {
    async load() {
      const existing = await pool.query<WorkflowRow>(
        'SELECT revision, document FROM workflow_document WHERE id = 1',
      );
      const row = existing.rows[0];
      if (row) {
        return fromRow(row);
      }

      const inserted = await pool.query<WorkflowRow>(
        `INSERT INTO workflow_document (id, revision, document)
         VALUES (1, 1, $1::jsonb)
         ON CONFLICT (id) DO NOTHING
         RETURNING revision, document`,
        [JSON.stringify(exampleWorkflow)],
      );
      const created = inserted.rows[0];
      if (created) {
        return fromRow(created);
      }

      const again = await pool.query<WorkflowRow>(
        'SELECT revision, document FROM workflow_document WHERE id = 1',
      );
      const raced = again.rows[0];
      if (!raced) {
        throw new Error('Workflow could not be loaded.');
      }
      return fromRow(raced);
    },

    async save(workflow) {
      const saved = await pool.query<WorkflowRow>(
        `INSERT INTO workflow_document (id, revision, document)
         VALUES (1, 1, $1::jsonb)
         ON CONFLICT (id) DO UPDATE
         SET document = EXCLUDED.document,
             revision = workflow_document.revision + 1,
             updated_at = now()
         RETURNING revision, document`,
        [JSON.stringify(workflow)],
      );
      const row = saved.rows[0];
      if (!row) {
        throw new Error('Workflow could not be saved.');
      }
      return fromRow(row);
    },
  };
}
