import { MarkerType, Position, type Edge, type Node } from '@xyflow/react';
import type { WorkflowIssue, WorkflowSchedule } from '@workflow/shared';
import type { EditorState } from './editor-state';
import type { StepNodeData } from '@/components/organisms/step-node';

export function toFlow(
  state: EditorState,
  schedule: WorkflowSchedule | null,
  issues: WorkflowIssue[],
): { nodes: Node<StepNodeData, 'step'>[]; edges: Edge[] } {
  const timing = new Map(schedule?.steps.map((step) => [step.stepId, step]) ?? []);
  const criticalSteps = new Set(schedule?.criticalPathStepIds ?? []);
  const criticalConnections = new Set(schedule?.criticalPathConnectionIds ?? []);
  const invalidSteps = new Set(issues.flatMap((issue) => issue.stepIds ?? []));
  const invalidConnections = new Set(issues.flatMap((issue) => issue.connectionIds ?? []));
  const selectedEndpoints = new Set(
    state.connections
      .filter((connection) => connection.selected)
      .flatMap((connection) => [connection.fromStepId, connection.toStepId]),
  );

  return {
    nodes: state.steps.map((step) => {
      const times = timing.get(step.id);
      return {
        id: step.id,
        type: 'step',
        position: { ...step.position },
        selected: step.selected,
        width: step.width,
        height: step.height,
        measured:
          step.width !== undefined && step.height !== undefined
            ? { width: step.width, height: step.height }
            : undefined,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          name: step.name,
          durationText: step.durationText,
          earliestStart: times?.earliestStart ?? null,
          earliestFinish: times?.earliestFinish ?? null,
          isStart: times?.isStart ?? false,
          onCriticalPath: criticalSteps.has(step.id),
          onSelectedPath: selectedEndpoints.has(step.id),
          invalid: invalidSteps.has(step.id),
        },
      };
    }),
    edges: state.connections.map((connection) => {
      const critical = criticalConnections.has(connection.id);
      const invalid = invalidConnections.has(connection.id);
      const selected = connection.selected;
      const color = selected ? '#1d4ed8' : invalid ? '#dc2626' : critical ? '#ea580c' : '#64748b';
      return {
        id: connection.id,
        source: connection.fromStepId,
        target: connection.toStepId,
        selected,
        reconnectable: true,
        interactionWidth: selected ? 36 : 24,
        zIndex: selected ? 20 : critical ? 5 : 0,
        animated: selected,
        label: selected ? 'Selected' : undefined,
        labelShowBg: true,
        labelStyle: { fill: '#1e3a8a', fontWeight: 700, fontSize: 12 },
        labelBgStyle: { fill: '#dbeafe', fillOpacity: 1 },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 999,
        markerEnd: { type: MarkerType.ArrowClosed, width: selected ? 22 : 18, height: selected ? 22 : 18, color },
        style: { stroke: color, strokeWidth: selected ? 4.5 : critical || invalid ? 2.5 : 1.75 },
        className: [selected ? 'selected-path' : '', critical ? 'critical' : '', invalid ? 'invalid' : '']
          .filter(Boolean)
          .join(' '),
      };
    }),
  };
}

export function formatMinutes(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return String(Math.round(value * 100) / 100);
}
