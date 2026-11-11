import { useCallback } from 'react';
import { type Connection, type Edge, type EdgeChange, type NodeChange } from '@xyflow/react';
import type { StepNode } from '@/components/organisms/step-node';
import { applyEdgeChanges, applyNodeChanges } from './apply-flow-changes';
import type { Commit } from './use-editor-document';

export function useCanvasEditing(commit: Commit) {
  const onNodesChange = useCallback(
    (changes: NodeChange<StepNode>[]) => {
      const removes = changes.some((change) => change.type === 'remove');
      const dragStopped = changes.some(
        (change) => change.type === 'position' && change.dragging === false && change.position,
      );
      commit((current) => applyNodeChanges(current, changes), removes || dragStopped ? 'now' : 'none');
    },
    [commit],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removes = changes.some((change) => change.type === 'remove');
      commit((current) => applyEdgeChanges(current, changes), removes ? 'now' : 'none');
    },
    [commit],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }
      commit((current) => {
        const exists = current.connections.some(
          (item) => item.fromStepId === connection.source && item.toStepId === connection.target,
        );
        if (exists) {
          return current;
        }
        return {
          ...current,
          connections: [
            ...current.connections,
            {
              id: crypto.randomUUID(),
              fromStepId: connection.source,
              toStepId: connection.target,
              selected: false,
            },
          ],
        };
      }, 'now');
    },
    [commit],
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, connection: Connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) {
        return;
      }
      commit((current) => {
        const duplicate = current.connections.some(
          (item) =>
            item.id !== oldEdge.id &&
            item.fromStepId === connection.source &&
            item.toStepId === connection.target,
        );
        if (duplicate) {
          return current;
        }
        const existing = current.connections.find((item) => item.id === oldEdge.id);
        if (
          !existing ||
          (existing.fromStepId === connection.source && existing.toStepId === connection.target)
        ) {
          return current;
        }
        return {
          ...current,
          connections: current.connections.map((item) =>
            item.id === oldEdge.id
              ? { ...item, fromStepId: connection.source!, toStepId: connection.target!, selected: true }
              : { ...item, selected: false },
          ),
        };
      }, 'now');
    },
    [commit],
  );

  return { onNodesChange, onEdgesChange, onConnect, onReconnect };
}
