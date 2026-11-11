import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Workflow } from '../../workflow/types.ts';
import { validateWorkflow } from '../validate.ts';

function workflow(partial: Partial<Workflow> & Pick<Workflow, 'steps' | 'connections'>): Workflow {
  return partial;
}

test('rejects a self-loop and a longer cycle', () => {
  const selfLoop = validateWorkflow({
    steps: [{ id: 'a', name: 'A', durationMinutes: 3, position: { x: 0, y: 0 } }],
    connections: [{ id: 'loop', fromStepId: 'a', toStepId: 'a' }],
  });
  assert.equal(selfLoop.ok, false);
  if (!selfLoop.ok) {
    const cycle = selfLoop.error.issues.find((issue) => issue.code === 'cycle');
    assert.ok(cycle);
    assert.deepEqual(cycle.stepIds, ['a']);
    assert.deepEqual(cycle.connectionIds, ['loop']);
    assert.match(cycle.message, /cycle/);
  }

  const longer = validateWorkflow(
    workflow({
      steps: [
        { id: 'a', name: 'A', durationMinutes: 1, position: { x: 0, y: 0 } },
        { id: 'b', name: 'B', durationMinutes: 1, position: { x: 1, y: 0 } },
        { id: 'c', name: 'C', durationMinutes: 1, position: { x: 2, y: 0 } },
      ],
      connections: [
        { id: 'ab', fromStepId: 'a', toStepId: 'b' },
        { id: 'bc', fromStepId: 'b', toStepId: 'c' },
        { id: 'ca', fromStepId: 'c', toStepId: 'a' },
      ],
    }),
  );
  assert.equal(longer.ok, false);
  if (!longer.ok) {
    const cycle = longer.error.issues.find((issue) => issue.code === 'cycle');
    assert.ok(cycle);
    assert.deepEqual(cycle.stepIds, ['a', 'b', 'c']);
    assert.deepEqual(cycle.connectionIds, ['ab', 'bc', 'ca']);
  }
});

test('rejects a dangling connection and a duplicate edge', () => {
  const dangling = validateWorkflow({
    steps: [{ id: 'a', name: 'A', durationMinutes: 2, position: { x: 0, y: 0 } }],
    connections: [{ id: 'missing', fromStepId: 'a', toStepId: 'gone' }],
  });
  assert.equal(dangling.ok, false);
  if (!dangling.ok) {
    assert.equal(dangling.error.issues[0]?.code, 'dangling-connection');
    assert.deepEqual(dangling.error.issues[0]?.connectionIds, ['missing']);
  }

  const duplicate = validateWorkflow({
    steps: [
      { id: 'a', name: 'A', durationMinutes: 2, position: { x: 0, y: 0 } },
      { id: 'b', name: 'B', durationMinutes: 2, position: { x: 1, y: 0 } },
    ],
    connections: [
      { id: 'one', fromStepId: 'a', toStepId: 'b' },
      { id: 'two', fromStepId: 'a', toStepId: 'b' },
    ],
  });
  assert.equal(duplicate.ok, false);
  if (!duplicate.ok) {
    assert.equal(duplicate.error.issues[0]?.code, 'duplicate-connection');
    assert.deepEqual(duplicate.error.issues[0]?.connectionIds, ['one', 'two']);
  }
});

test('rejects duplicate ids and a non-finite position', () => {
  const duplicateId = validateWorkflow({
    steps: [
      { id: 'a', name: 'A', durationMinutes: 2, position: { x: 0, y: 0 } },
      { id: 'a', name: 'Also A', durationMinutes: 3, position: { x: 1, y: 1 } },
    ],
    connections: [],
  });
  assert.equal(duplicateId.ok, false);
  if (!duplicateId.ok) {
    assert.equal(duplicateId.error.issues[0]?.code, 'duplicate-step-id');
  }

  const position = validateWorkflow({
    steps: [{ id: 'a', name: 'A', durationMinutes: 2, position: { x: Number.NaN, y: 0 } }],
    connections: [],
  });
  assert.equal(position.ok, false);
  if (!position.ok) {
    assert.equal(position.error.issues.some((issue) => issue.code === 'invalid-position'), true);
  }
});

test('rejects a workflow that is not an object', () => {
  const result = validateWorkflow(null);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 400);
  }
});
