import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exampleWorkflow } from '@workflow/shared';
import { put, withApp, type ErrorResponse, type WorkflowResponse } from './workflow-test-client.ts';

test('an invalid workflow is rejected and does not change the stored document', async () => {
  await withApp(async (baseUrl) => {
    const before = (await (await fetch(`${baseUrl}/api/workflow`)).json()) as WorkflowResponse;
    const cycled = structuredClone(exampleWorkflow);
    cycled.connections.push({ id: 'assembly-cutting', fromStepId: 'assembly', toStepId: 'cutting' });

    const response = await put(baseUrl, { workflow: cycled });
    assert.equal(response.status, 422);
    const body = (await response.json()) as ErrorResponse;
    assert.equal(body.error.code, 'invalid-workflow');
    assert.equal(body.error.issues.some((issue) => issue.code === 'cycle'), true);

    const after = (await (await fetch(`${baseUrl}/api/workflow`)).json()) as WorkflowResponse;
    assert.deepEqual(after, before);
  });
});

test('malformed and garbage bodies return the error shape and keep the stored document', async () => {
  await withApp(async (baseUrl) => {
    const before = (await (await fetch(`${baseUrl}/api/workflow`)).json()) as WorkflowResponse;

    const missing = await put(baseUrl, { steps: [] });
    assert.equal(missing.status, 400);
    const missingBody = (await missing.json()) as ErrorResponse;
    assert.equal(missingBody.error.code, 'malformed-workflow');
    assert.ok(missingBody.error.message.length > 0);
    assert.ok(Array.isArray(missingBody.error.issues));

    const garbage = await put(baseUrl, '{', true);
    assert.equal(garbage.status, 400);
    const garbageBody = (await garbage.json()) as ErrorResponse;
    assert.equal(garbageBody.error.code, 'malformed-workflow');

    const emptyName = await put(baseUrl, {
      workflow: {
        steps: [{ id: 'a', name: ' ', durationMinutes: 5, position: { x: 1, y: 2 } }],
        connections: [],
      },
    });
    assert.equal(emptyName.status, 422);
    const emptyBody = (await emptyName.json()) as ErrorResponse;
    assert.equal(emptyBody.error.issues[0]?.code, 'empty-name');

    const after = (await (await fetch(`${baseUrl}/api/workflow`)).json()) as WorkflowResponse;
    assert.deepEqual(after, before);
  });
});
