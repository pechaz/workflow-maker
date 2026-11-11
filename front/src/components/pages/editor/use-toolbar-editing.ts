import { useCallback, useMemo } from 'react';
import type { Commit } from './use-editor-document';

export function useToolbarEditing(commit: Commit) {
  const actions = useMemo(
    () => ({
      rename: (id: string, name: string) => {
        commit(
          (current) => ({
            ...current,
            steps: current.steps.map((step) => (step.id === id ? { ...step, name } : step)),
          }),
          'debounce',
        );
      },
      setDuration: (id: string, durationText: string) => {
        commit(
          (current) => ({
            ...current,
            steps: current.steps.map((step) => (step.id === id ? { ...step, durationText } : step)),
          }),
          'debounce',
        );
      },
    }),
    [commit],
  );

  const addStep = useCallback(() => {
    commit((current) => {
      const offset = current.steps.length % 6;
      return {
        ...current,
        steps: [
          ...current.steps,
          {
            id: crypto.randomUUID(),
            name: 'New step',
            durationText: '10',
            position: { x: 80 + offset * 36, y: 80 + offset * 28 },
            selected: false,
          },
        ],
      };
    }, 'now');
  }, [commit]);

  const selectConnection = useCallback(
    (id: string) => {
      commit(
        (current) => ({
          ...current,
          steps: current.steps.map((step) => (step.selected ? { ...step, selected: false } : step)),
          connections: current.connections.map((connection) =>
            connection.selected === (connection.id === id)
              ? connection
              : { ...connection, selected: connection.id === id },
          ),
        }),
        'none',
      );
    },
    [commit],
  );

  const removeSelectedConnections = useCallback(() => {
    commit((current) => {
      if (!current.connections.some((connection) => connection.selected)) {
        return current;
      }
      return {
        ...current,
        connections: current.connections.filter((connection) => !connection.selected),
      };
    }, 'now');
  }, [commit]);

  const resetWorkflow = useCallback(() => {
    commit((current) => {
      if (current.steps.length === 0 && current.connections.length === 0) {
        return current;
      }
      return { steps: [], connections: [] };
    }, 'now');
  }, [commit]);

  return { actions, addStep, selectConnection, removeSelectedConnections, resetWorkflow };
}
