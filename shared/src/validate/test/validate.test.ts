import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exampleWorkflow } from '../../workflow/example.ts';
import { validateWorkflow } from '../validate.ts';

test('example workflow is valid', () => {
  const result = validateWorkflow(exampleWorkflow);
  assert.equal(result.ok, true);
});

test('empty workflow is valid', () => {
  const result = validateWorkflow({ steps: [], connections: [] });
  assert.equal(result.ok, true);
});

test('trims a step name', () => {
  const result = validateWorkflow({
    steps: [
      {
        id: 'paint',
        name: '  Paint  ',
        durationMinutes: 4,
        position: { x: 1, y: 2 },
      },
    ],
    connections: [],
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.workflow.steps[0]?.name, 'Paint');
  }
});

test('rejects an empty name', () => {
  const result = validateWorkflow({
    steps: [{ id: 'paint', name: '   ', durationMinutes: 4, position: { x: 0, y: 0 } }],
    connections: [],
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 422);
    assert.equal(result.error.issues[0]?.code, 'empty-name');
    assert.deepEqual(result.error.issues[0]?.stepIds, ['paint']);
  }
});

test('rejects zero, negative, and non-finite durations', () => {
  for (const durationMinutes of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
    const result = validateWorkflow({
      steps: [{ id: 'paint', name: 'Paint', durationMinutes, position: { x: 0, y: 0 } }],
      connections: [],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 422);
      assert.equal(result.error.issues[0]?.code, 'invalid-duration');
    }
  }
});

test('rejects a duration that is not a number as malformed', () => {
  const result = validateWorkflow({
    steps: [{ id: 'paint', name: 'Paint', durationMinutes: '4', position: { x: 0, y: 0 } }],
    connections: [],
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 400);
    assert.equal(result.error.code, 'malformed-workflow');
  }
});
