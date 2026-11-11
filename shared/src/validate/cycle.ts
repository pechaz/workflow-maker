import type { WorkflowConnection, WorkflowStep } from '../workflow/types.ts';

export function findCycle(
  steps: WorkflowStep[],
  connections: WorkflowConnection[],
): { stepIds: string[]; connectionIds: string[] } | null {
  const adjacency = new Map<string, { to: string; id: string }[]>();
  for (const step of steps) {
    adjacency.set(step.id, []);
  }

  for (const connection of connections) {
    adjacency.get(connection.fromStepId)?.push({ to: connection.toStepId, id: connection.id });
  }

  const color = new Map<string, 'white' | 'gray' | 'black'>();
  for (const step of steps) {
    color.set(step.id, 'white');
  }

  const stack: string[] = [];
  const incomingEdge = new Map<string, string>();

  const walk = (node: string): { stepIds: string[]; connectionIds: string[] } | null => {
    color.set(node, 'gray');
    stack.push(node);

    for (const edge of adjacency.get(node) ?? []) {
      if (color.get(edge.to) === 'gray') {
        const start = stack.indexOf(edge.to);
        const stepIds = stack.slice(start);
        const connectionIds: string[] = [];
        for (let index = start + 1; index < stack.length; index += 1) {
          const edgeId = incomingEdge.get(stack[index] ?? '');
          if (edgeId) {
            connectionIds.push(edgeId);
          }
        }
        connectionIds.push(edge.id);
        return { stepIds, connectionIds };
      }

      if (color.get(edge.to) === 'white') {
        incomingEdge.set(edge.to, edge.id);
        const found = walk(edge.to);
        if (found) {
          return found;
        }
      }
    }

    stack.pop();
    color.set(node, 'black');
    return null;
  };

  for (const step of steps) {
    if (color.get(step.id) === 'white') {
      const found = walk(step.id);
      if (found) {
        return found;
      }
    }
  }

  return null;
}
