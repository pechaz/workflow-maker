import assert from 'node:assert/strict';
import type { WorkflowSchedule } from '../schedule.ts';
import type { Workflow } from '../../workflow/types.ts';

export function stepSchedule(schedule: WorkflowSchedule, id: string) {
  const found = schedule.steps.find((step) => step.stepId === id);
  assert.ok(found, `missing schedule for ${id}`);
  return found;
}

export function assertTightSchedule(workflow: Workflow, schedule: WorkflowSchedule) {
  const byId = new Map(workflow.steps.map((step) => [step.id, step]));
  let maximum = 0;
  for (const step of schedule.steps) {
    const source = byId.get(step.stepId);
    assert.ok(source);
    assert.equal(step.earliestFinish, step.earliestStart + source.durationMinutes);
    maximum = Math.max(maximum, step.earliestFinish);
    const predecessorFinishes = workflow.connections
      .filter((connection) => connection.toStepId === step.stepId)
      .map((connection) => schedule.steps.find((item) => item.stepId === connection.fromStepId)?.earliestFinish ?? 0);
    const expectedStart = predecessorFinishes.length === 0 ? 0 : Math.max(...predecessorFinishes);
    assert.equal(step.earliestStart, expectedStart);
    assert.equal(step.isStart, predecessorFinishes.length === 0);
  }
  assert.equal(schedule.workflowDurationMinutes, maximum);
  const criticalSum = schedule.criticalPathStepIds.reduce(
    (total, id) => total + (byId.get(id)?.durationMinutes ?? 0),
    0,
  );
  assert.ok(Math.abs(criticalSum - schedule.workflowDurationMinutes) < 1e-6);
}
