import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Workflow } from '../../workflow/types.ts';
import { scheduleWorkflow } from '../schedule.ts';
import { assertTightSchedule, stepSchedule } from './schedule-assert.ts';

test('a diamond follows the long chain rather than the widest step in each rank', () => {
  const workflow: Workflow = {
    steps: [
      { id: 'a', name: 'A', durationMinutes: 5, position: { x: 0, y: 0 } },
      { id: 'b', name: 'B', durationMinutes: 5, position: { x: 1, y: 0 } },
      { id: 'c', name: 'C', durationMinutes: 20, position: { x: 0, y: 1 } },
      { id: 'd', name: 'D', durationMinutes: 5, position: { x: 2, y: 0 } },
    ],
    connections: [
      { id: 'ab', fromStepId: 'a', toStepId: 'b' },
      { id: 'bd', fromStepId: 'b', toStepId: 'd' },
      { id: 'cd', fromStepId: 'c', toStepId: 'd' },
    ],
  };
  const schedule = scheduleWorkflow(workflow);
  assert.ok(schedule);
  assert.equal(schedule.workflowDurationMinutes, 25);
  assert.deepEqual(schedule.criticalPathStepIds, ['c', 'd']);
  assert.equal(stepSchedule(schedule, 'd').earliestStart, 20);
  assert.equal(stepSchedule(schedule, 'b').onCriticalPath, false);
  assertTightSchedule(workflow, schedule);
});

test('a tie returns one critical path whose sum is the workflow time', () => {
  const workflow: Workflow = {
    steps: [
      { id: 'a', name: 'A', durationMinutes: 5, position: { x: 0, y: 0 } },
      { id: 'b', name: 'B', durationMinutes: 5, position: { x: 0, y: 1 } },
      { id: 'c', name: 'C', durationMinutes: 5, position: { x: 1, y: 0 } },
    ],
    connections: [
      { id: 'ac', fromStepId: 'a', toStepId: 'c' },
      { id: 'bc', fromStepId: 'b', toStepId: 'c' },
    ],
  };
  const schedule = scheduleWorkflow(workflow);
  assert.ok(schedule);
  assert.equal(schedule.workflowDurationMinutes, 10);
  assert.equal(schedule.criticalPathStepIds.length, 2);
  assert.equal(
    schedule.steps.filter((step) => step.onCriticalPath).length,
    schedule.criticalPathStepIds.length,
  );
  assertTightSchedule(workflow, schedule);
});

test('an empty workflow has zero duration and a cycle cannot be scheduled', () => {
  const empty = scheduleWorkflow({ steps: [], connections: [] });
  assert.ok(empty);
  assert.equal(empty.workflowDurationMinutes, 0);
  assert.deepEqual(empty.criticalPathStepIds, []);

  const cycle = scheduleWorkflow({
    steps: [
      { id: 'a', name: 'A', durationMinutes: 2, position: { x: 0, y: 0 } },
      { id: 'b', name: 'B', durationMinutes: 2, position: { x: 1, y: 0 } },
    ],
    connections: [
      { id: 'ab', fromStepId: 'a', toStepId: 'b' },
      { id: 'ba', fromStepId: 'b', toStepId: 'a' },
    ],
  });
  assert.equal(cycle, null);
});

test('an empty name still has a schedule, an invalid duration does not', () => {
  const unnamed = scheduleWorkflow({
    steps: [{ id: 'a', name: '  ', durationMinutes: 6, position: { x: 0, y: 0 } }],
    connections: [],
  });
  assert.ok(unnamed);
  assert.equal(unnamed.workflowDurationMinutes, 6);

  const invalid = scheduleWorkflow({
    steps: [{ id: 'a', name: 'A', durationMinutes: 0, position: { x: 0, y: 0 } }],
    connections: [],
  });
  assert.equal(invalid, null);
});
