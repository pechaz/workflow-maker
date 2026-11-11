import type { WorkflowConnection, WorkflowStep } from '../workflow/types.ts';
import { collectConnectionIssues } from './connection-issues.ts';
import { findCycle } from './cycle.ts';
import type { WorkflowIssue } from './issue.ts';
import { parseConnection } from './parse-connection.ts';
import { parseStep, stepLabel } from './parse-step.ts';
import { isRecord } from './record.ts';
import { collectStepIssues } from './step-issues.ts';

export type Assessment = {
  malformed: WorkflowIssue[];
  issues: WorkflowIssue[];
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
};

export function assessWorkflow(input: unknown): Assessment {
  const malformed: WorkflowIssue[] = [];

  if (!isRecord(input)) {
    return {
      malformed: [{ code: 'malformed', message: 'Workflow must be an object.' }],
      issues: [],
      steps: [],
      connections: [],
    };
  }

  if (!Array.isArray(input.steps)) {
    malformed.push({ code: 'malformed', message: 'Steps must be an array.' });
  }

  if (!Array.isArray(input.connections)) {
    malformed.push({ code: 'malformed', message: 'Connections must be an array.' });
  }

  if (malformed.length > 0) {
    return { malformed, issues: [], steps: [], connections: [] };
  }

  const steps: WorkflowStep[] = [];
  const connections: WorkflowConnection[] = [];

  for (const [index, value] of (input.steps as unknown[]).entries()) {
    const parsed = parseStep(value, index);
    if ('issue' in parsed) {
      malformed.push(parsed.issue);
    } else {
      steps.push(parsed.step);
    }
  }

  for (const [index, value] of (input.connections as unknown[]).entries()) {
    const parsed = parseConnection(value, index);
    if ('issue' in parsed) {
      malformed.push(parsed.issue);
    } else {
      connections.push(parsed.connection);
    }
  }

  if (malformed.length > 0) {
    return { malformed, issues: [], steps: [], connections: [] };
  }

  const collected = collectStepIssues(steps);
  const issues = collected.issues;
  issues.push(...collectConnectionIssues(connections, collected.stepsById));

  const structurallyBroken = issues.some((issue) =>
    [
      'duplicate-step-id',
      'duplicate-connection-id',
      'dangling-connection',
      'invalid-duration',
      'invalid-position',
    ].includes(issue.code),
  );

  if (!structurallyBroken) {
    const cycle = findCycle(steps, connections);
    if (cycle) {
      const names = cycle.stepIds.map((id) => {
        const step = collected.stepsById.get(id);
        return step ? stepLabel(step) : id;
      });
      const loop = [...names, names[0]].filter((name): name is string => Boolean(name));
      issues.push({
        code: 'cycle',
        message: `This workflow has a cycle: ${loop.join(' → ')}. Remove a connection in the cycle to continue.`,
        stepIds: cycle.stepIds,
        connectionIds: cycle.connectionIds,
      });
    }
  }

  return { malformed, issues, steps, connections };
}
