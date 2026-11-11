import type { WorkflowSchedule } from '@workflow/shared';
import type { CriticalPathLink } from '@/components/molecules/critical-path';
import type { SelectedConnection } from '@/components/molecules/selected-path-bar';
import type { EditorState } from '@/editor-state';

export function criticalLinksFrom(editor: EditorState, schedule: WorkflowSchedule | null) {
  const stepName = (id: string) => editor.steps.find((step) => step.id === id)?.name.trim() || 'Untitled step';
  const pathNames = schedule?.criticalPathStepIds.map((id) => stepName(id)) ?? [];
  const criticalLinks: CriticalPathLink[] =
    schedule?.criticalPathConnectionIds.flatMap((id, index) => {
      const fromName = pathNames[index];
      const toName = pathNames[index + 1];
      if (!fromName || !toName) {
        return [];
      }
      return [
        {
          id,
          fromName,
          toName,
          selected: editor.connections.some((connection) => connection.id === id && connection.selected),
        },
      ];
    }) ?? [];
  const selectedConnections: SelectedConnection[] = editor.connections
    .filter((connection) => connection.selected)
    .map((connection) => ({
      id: connection.id,
      fromName: stepName(connection.fromStepId),
      toName: stepName(connection.toStepId),
    }));

  return { pathNames, criticalLinks, selectedConnections };
}
