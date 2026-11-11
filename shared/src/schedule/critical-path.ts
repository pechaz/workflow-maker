import type { WorkflowStep } from '../workflow/types.ts';

const EPSILON = 1e-6;

function almostEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= EPSILON;
}

export function traceCriticalPath(
  steps: WorkflowStep[],
  predecessors: Map<string, string[]>,
  earliestStart: Map<string, number>,
  earliestFinish: Map<string, number>,
  workflowDurationMinutes: number,
): string[] {
  if (steps.length === 0) {
    return [];
  }

  const ends = steps
    .filter((step) => almostEqual(earliestFinish.get(step.id) ?? 0, workflowDurationMinutes))
    .map((step) => step.id)
    .sort();
  const end = ends[0];
  if (!end) {
    return [];
  }

  const reversed: string[] = [];
  const seen = new Set<string>();
  let current = end;

  while (!seen.has(current)) {
    seen.add(current);
    reversed.push(current);
    const next = (predecessors.get(current) ?? [])
      .filter((id) => almostEqual(earliestFinish.get(id) ?? 0, earliestStart.get(current) ?? 0))
      .sort()[0];
    if (!next) {
      break;
    }
    current = next;
  }

  return reversed.reverse();
}
