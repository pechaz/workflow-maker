import type { Workflow, WorkflowConnection } from '@workflow/shared';

export type EditorStep = {
  id: string;
  name: string;
  durationText: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  selected: boolean;
};

export type EditorConnection = WorkflowConnection & {
  selected: boolean;
};

export type EditorState = {
  steps: EditorStep[];
  connections: EditorConnection[];
};

export function workflowToEditor(workflow: Workflow): EditorState {
  return {
    steps: workflow.steps.map((step) => ({
      id: step.id,
      name: step.name,
      durationText: String(step.durationMinutes),
      position: { ...step.position },
      selected: false,
    })),
    connections: workflow.connections.map((connection) => ({
      ...connection,
      selected: false,
    })),
  };
}

export function editorToWorkflow(state: EditorState): Workflow {
  return {
    steps: state.steps.map((step) => ({
      id: step.id,
      name: step.name,
      durationMinutes: Number(step.durationText),
      position: { x: step.position.x, y: step.position.y },
    })),
    connections: state.connections.map(({ id, fromStepId, toStepId }) => ({
      id,
      fromStepId,
      toStepId,
    })),
  };
}
