import { assessWorkflow } from '../validate/assess.ts';
import type { Workflow, WorkflowConnection, WorkflowStep } from '../workflow/types.ts';
import { traceCriticalPath } from './critical-path.ts';

export type StepSchedule = {
  stepId: string;
  earliestStart: number;
  earliestFinish: number;
  isStart: boolean;
  onCriticalPath: boolean;
};

export type WorkflowSchedule = {
  workflowDurationMinutes: number;
  steps: StepSchedule[];
  criticalPathStepIds: string[];
  criticalPathConnectionIds: string[];
};

function canSchedule(issues: { code: string }[]): boolean {
  return issues.every((issue) => issue.code === 'empty-name' || issue.code === 'duplicate-connection');
}

/**
 * Earliest start is 0 for a step with no prerequisites, otherwise the latest
 * finish among its prerequisites. Workflow time is the maximum finish.
 * The critical path is one chain of tight links whose durations sum to that time.
 */
export function scheduleWorkflow(input: Workflow): WorkflowSchedule | null {
  const assessment = assessWorkflow(input);
  if (assessment.malformed.length > 0 || !canSchedule(assessment.issues)) {
    return null;
  }

  const steps = assessment.steps;
  const connections = assessment.connections.filter((connection, index, all) => {
    return (
      all.findIndex(
        (other) => other.fromStepId === connection.fromStepId && other.toStepId === connection.toStepId,
      ) === index
    );
  });

  return computeSchedule(steps, connections);
}

function computeSchedule(steps: WorkflowStep[], connections: WorkflowConnection[]): WorkflowSchedule | null {
  const indegree = new Map<string, number>();
  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  const duration = new Map<string, number>();

  for (const step of steps) {
    indegree.set(step.id, 0);
    successors.set(step.id, []);
    predecessors.set(step.id, []);
    duration.set(step.id, step.durationMinutes);
  }

  for (const connection of connections) {
    successors.get(connection.fromStepId)?.push(connection.toStepId);
    predecessors.get(connection.toStepId)?.push(connection.fromStepId);
    indegree.set(connection.toStepId, (indegree.get(connection.toStepId) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, degree] of indegree) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  const earliestStart = new Map<string, number>();
  for (const step of steps) {
    earliestStart.set(step.id, 0);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) {
      break;
    }
    order.push(id);
    const finish = (earliestStart.get(id) ?? 0) + (duration.get(id) ?? 0);
    for (const next of successors.get(id) ?? []) {
      earliestStart.set(next, Math.max(earliestStart.get(next) ?? 0, finish));
      const nextDegree = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, nextDegree);
      if (nextDegree === 0) {
        queue.push(next);
      }
    }
  }

  if (order.length !== steps.length) {
    return null;
  }

  const earliestFinish = new Map<string, number>();
  let workflowDurationMinutes = 0;
  for (const step of steps) {
    const finish = (earliestStart.get(step.id) ?? 0) + step.durationMinutes;
    earliestFinish.set(step.id, finish);
    workflowDurationMinutes = Math.max(workflowDurationMinutes, finish);
  }

  const criticalPathStepIds = traceCriticalPath(
    steps,
    predecessors,
    earliestStart,
    earliestFinish,
    workflowDurationMinutes,
  );
  const criticalSteps = new Set(criticalPathStepIds);
  const criticalPathConnectionIds = criticalPathStepIds.slice(0, -1).flatMap((fromStepId, index) => {
    const toStepId = criticalPathStepIds[index + 1];
    const connection = connections.find(
      (item) => item.fromStepId === fromStepId && item.toStepId === toStepId,
    );
    return connection ? [connection.id] : [];
  });

  return {
    workflowDurationMinutes,
    criticalPathStepIds,
    criticalPathConnectionIds,
    steps: steps.map((step) => ({
      stepId: step.id,
      earliestStart: earliestStart.get(step.id) ?? 0,
      earliestFinish: earliestFinish.get(step.id) ?? 0,
      isStart: (predecessors.get(step.id) ?? []).length === 0,
      onCriticalPath: criticalSteps.has(step.id),
    })),
  };
}
