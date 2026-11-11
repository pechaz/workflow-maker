import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exampleWorkflow } from '../../workflow/example.ts';
import type { Workflow } from '../../workflow/types.ts';
import { scheduleWorkflow } from '../schedule.ts';
import { assertTightSchedule, stepSchedule } from './schedule-assert.ts';

test('example workflow finishes in 35 minutes on Cutting → Assembly', () => {
  const schedule = scheduleWorkflow(exampleWorkflow);
  assert.ok(schedule);
  assert.equal(schedule.workflowDurationMinutes, 35);
  assert.deepEqual(schedule.criticalPathStepIds, ['cutting', 'assembly']);
  assert.deepEqual(schedule.criticalPathConnectionIds, ['cutting-assembly']);

  const cutting = stepSchedule(schedule, 'cutting');
  assert.equal(cutting.earliestStart, 0);
  assert.equal(cutting.earliestFinish, 20);
  assert.equal(cutting.isStart, true);
  assert.equal(cutting.onCriticalPath, true);

  const preparation = stepSchedule(schedule, 'preparation');
  assert.equal(preparation.earliestStart, 0);
  assert.equal(preparation.earliestFinish, 10);
  assert.equal(preparation.isStart, true);
  assert.equal(preparation.onCriticalPath, false);

  const assembly = stepSchedule(schedule, 'assembly');
  assert.equal(assembly.earliestStart, 20);
  assert.equal(assembly.earliestFinish, 35);
  assert.equal(assembly.isStart, false);
  assert.equal(assembly.onCriticalPath, true);
  assertTightSchedule(exampleWorkflow, schedule);
});

test('a chain sums every step and a single step is its own critical path', () => {
  const chain: Workflow = {
    steps: [
      { id: 'a', name: 'A', durationMinutes: 3, position: { x: 0, y: 0 } },
      { id: 'b', name: 'B', durationMinutes: 4, position: { x: 1, y: 0 } },
      { id: 'c', name: 'C', durationMinutes: 5, position: { x: 2, y: 0 } },
    ],
    connections: [
      { id: 'ab', fromStepId: 'a', toStepId: 'b' },
      { id: 'bc', fromStepId: 'b', toStepId: 'c' },
    ],
  };
  const schedule = scheduleWorkflow(chain);
  assert.ok(schedule);
  assert.equal(schedule.workflowDurationMinutes, 12);
  assert.deepEqual(schedule.criticalPathStepIds, ['a', 'b', 'c']);
  assert.equal(stepSchedule(schedule, 'b').earliestStart, 3);
  assert.equal(stepSchedule(schedule, 'c').earliestStart, 7);
  assertTightSchedule(chain, schedule);

  const single: Workflow = {
    steps: [{ id: 'only', name: 'Only', durationMinutes: 8, position: { x: 0, y: 0 } }],
    connections: [],
  };
  const alone = scheduleWorkflow(single);
  assert.ok(alone);
  assert.equal(alone.workflowDurationMinutes, 8);
  assert.deepEqual(alone.criticalPathStepIds, ['only']);
  assert.equal(stepSchedule(alone, 'only').isStart, true);
});

test('disconnected groups use the slower group', () => {
  const workflow: Workflow = {
    steps: [
      { id: 'a', name: 'A', durationMinutes: 10, position: { x: 0, y: 0 } },
      { id: 'b', name: 'B', durationMinutes: 4, position: { x: 0, y: 1 } },
      { id: 'c', name: 'C', durationMinutes: 4, position: { x: 1, y: 1 } },
    ],
    connections: [{ id: 'bc', fromStepId: 'b', toStepId: 'c' }],
  };
  const schedule = scheduleWorkflow(workflow);
  assert.ok(schedule);
  assert.equal(schedule.workflowDurationMinutes, 10);
  assert.deepEqual(schedule.criticalPathStepIds, ['a']);
  assert.equal(stepSchedule(schedule, 'c').earliestFinish, 8);
  assert.equal(stepSchedule(schedule, 'c').onCriticalPath, false);
  assertTightSchedule(workflow, schedule);
});
