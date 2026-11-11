import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exampleWorkflow } from '@workflow/shared';
import { put, withApp, type WorkflowResponse } from './workflow-test-client.ts';

test('load seeds the example workflow', async () => {
  await withApp(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/workflow`);
    assert.equal(response.status, 200);
    const body = (await response.json()) as WorkflowResponse;
    assert.equal(body.revision, 1);
    assert.deepEqual(body.workflow, exampleWorkflow);
    assert.equal(body.schedule?.workflowDurationMinutes, 35);
  });
});

test('save round-trips steps and positions, and a later save replaces the document', async () => {
  await withApp(async (baseUrl) => {
    const seeded = (await (await fetch(`${baseUrl}/api/workflow`)).json()) as WorkflowResponse;
    assert.equal(seeded.revision, 1);

    const moved = structuredClone(exampleWorkflow);
    const assembly = moved.steps.find((step) => step.id === 'assembly');
    assert.ok(assembly);
    assembly.durationMinutes = 30;
    assembly.position = { x: 480, y: 40 };

    const first = await put(baseUrl, { workflow: moved });
    assert.equal(first.status, 200);
    const saved = (await first.json()) as WorkflowResponse;
    assert.equal(saved.revision, 2);
    assert.equal(saved.workflow.steps.find((step) => step.id === 'assembly')?.durationMinutes, 30);
    assert.deepEqual(saved.workflow.steps.find((step) => step.id === 'assembly')?.position, {
      x: 480,
      y: 40,
    });
    assert.equal(saved.schedule?.workflowDurationMinutes, 50);

    const renamed = structuredClone(saved.workflow);
    const cutting = renamed.steps.find((step) => step.id === 'cutting');
    assert.ok(cutting);
    cutting.name = 'Rough cutting';
    const second = await put(baseUrl, { workflow: renamed });
    assert.equal(second.status, 200);
    const replaced = (await second.json()) as WorkflowResponse;
    assert.equal(replaced.revision, 3);
    assert.equal(replaced.workflow.steps.find((step) => step.id === 'cutting')?.name, 'Rough cutting');
    assert.equal(replaced.workflow.steps.find((step) => step.id === 'assembly')?.durationMinutes, 30);

    const loaded = (await (await fetch(`${baseUrl}/api/workflow`)).json()) as WorkflowResponse;
    assert.deepEqual(loaded.workflow, replaced.workflow);
    assert.equal(loaded.revision, 3);
  });
});
