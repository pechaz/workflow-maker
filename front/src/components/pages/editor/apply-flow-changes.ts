import type { EdgeChange, NodeChange } from '@xyflow/react';
import type { StepNode } from '@/components/organisms/step-node';
import type { EditorState } from '@/editor-state';

export function applyNodeChanges(current: EditorState, changes: NodeChange<StepNode>[]): EditorState {
  let steps = current.steps;
  let connections = current.connections;
  let changed = false;

  for (const change of changes) {
    if (change.type === 'position' && change.position) {
      const { x, y } = change.position;
      if (typeof x !== 'number' || typeof y !== 'number') {
        continue;
      }
      steps = steps.map((step) => {
        if (step.id !== change.id || (step.position.x === x && step.position.y === y)) {
          return step;
        }
        changed = true;
        return { ...step, position: { x, y } };
      });
    } else if (change.type === 'dimensions' && change.dimensions) {
      const { width, height } = change.dimensions;
      steps = steps.map((step) => {
        if (step.id !== change.id || (step.width === width && step.height === height)) {
          return step;
        }
        changed = true;
        return { ...step, width, height };
      });
    } else if (change.type === 'select') {
      steps = steps.map((step) => {
        if (step.id !== change.id || step.selected === change.selected) {
          return step;
        }
        changed = true;
        return { ...step, selected: change.selected };
      });
    } else if (change.type === 'remove') {
      if (!steps.some((step) => step.id === change.id)) {
        continue;
      }
      changed = true;
      steps = steps.filter((step) => step.id !== change.id);
      connections = connections.filter(
        (connection) => connection.fromStepId !== change.id && connection.toStepId !== change.id,
      );
    }
  }

  return changed ? { steps, connections } : current;
}

export function applyEdgeChanges(current: EditorState, changes: EdgeChange[]): EditorState {
  let connections = current.connections;
  let changed = false;

  for (const change of changes) {
    if (change.type === 'select') {
      connections = connections.map((connection) => {
        if (connection.id !== change.id || connection.selected === change.selected) {
          return connection;
        }
        changed = true;
        return { ...connection, selected: change.selected };
      });
    } else if (change.type === 'remove') {
      if (!connections.some((connection) => connection.id === change.id)) {
        continue;
      }
      changed = true;
      connections = connections.filter((connection) => connection.id !== change.id);
    }
  }

  return changed ? { ...current, connections } : current;
}
