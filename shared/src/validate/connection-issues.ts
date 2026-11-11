import type { WorkflowConnection, WorkflowStep } from '../workflow/types.ts';
import type { WorkflowIssue } from './issue.ts';
import { stepLabel } from './parse-step.ts';

export function collectConnectionIssues(
  connections: WorkflowConnection[],
  stepsById: Map<string, WorkflowStep>,
): WorkflowIssue[] {
  const issues: WorkflowIssue[] = [];
  const seenConnectionIds = new Set<string>();
  const seenPairs = new Map<string, string>();

  for (const connection of connections) {
    if (seenConnectionIds.has(connection.id)) {
      issues.push({
        code: 'duplicate-connection-id',
        message: `Connection id "${connection.id}" is used more than once.`,
        connectionIds: [connection.id],
      });
    }
    seenConnectionIds.add(connection.id);

    const missing = !stepsById.has(connection.fromStepId) || !stepsById.has(connection.toStepId);
    if (missing) {
      issues.push({
        code: 'dangling-connection',
        message: `Connection "${connection.id}" points at a step that does not exist.`,
        connectionIds: [connection.id],
      });
      continue;
    }

    const pair = `${connection.fromStepId}\u0000${connection.toStepId}`;
    const previous = seenPairs.get(pair);
    if (previous) {
      const from = stepsById.get(connection.fromStepId);
      const to = stepsById.get(connection.toStepId);
      issues.push({
        code: 'duplicate-connection',
        message: `The connection from "${from ? stepLabel(from) : connection.fromStepId}" to "${to ? stepLabel(to) : connection.toStepId}" is duplicated.`,
        connectionIds: [previous, connection.id],
      });
    } else {
      seenPairs.set(pair, connection.id);
    }
  }

  return issues;
}
