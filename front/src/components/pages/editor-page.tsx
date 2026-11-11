import type { Workflow } from '@workflow/shared';
import { IssueBanner } from '@/components/organisms/issue-banner';
import { StepActionsContext } from '@/components/organisms/step-node';
import { WorkflowCanvas } from '@/components/organisms/workflow-canvas';
import { WorkflowToolbar } from '@/components/organisms/workflow-toolbar';
import { EditorTemplate } from '@/components/templates/editor-template';
import type { EditorState } from '@/editor-state';
import { formatMinutes } from '@/graph';
import { criticalLinksFrom } from './editor/critical-links';
import { useCanvasEditing } from './editor/use-canvas-editing';
import { useEditorDocument } from './editor/use-editor-document';
import { useToolbarEditing } from './editor/use-toolbar-editing';

type EditorScreenProps = {
  initial: EditorState;
  savedWorkflow: Workflow;
};

export function EditorScreen({ initial, savedWorkflow }: EditorScreenProps) {
  const document = useEditorDocument(initial, savedWorkflow);
  const canvas = useCanvasEditing(document.commit);
  const toolbar = useToolbarEditing(document.commit);
  const links = criticalLinksFrom(document.editor, document.schedule);

  return (
    <StepActionsContext.Provider value={toolbar.actions}>
      <EditorTemplate
        toolbar={
          <WorkflowToolbar
            durationLabel={document.schedule ? formatMinutes(document.schedule.workflowDurationMinutes) : '—'}
            durationDetail={
              document.schedule ? 'minutes on the longest path' : 'Time unavailable until the workflow is valid'
            }
            criticalLinks={links.criticalLinks}
            criticalStepNames={links.pathNames}
            scheduleUnavailable={!document.schedule}
            selectedConnections={links.selectedConnections}
            canReset={document.editor.steps.length > 0 || document.editor.connections.length > 0}
            status={document.status}
            message={document.statusText}
            onRetry={document.retry}
            onAddStep={toolbar.addStep}
            onReset={toolbar.resetWorkflow}
            onSelectConnection={toolbar.selectConnection}
            onRemoveSelected={toolbar.removeSelectedConnections}
          />
        }
        banner={document.issues.length > 0 ? <IssueBanner issues={document.issues} /> : null}
        canvas={
          <WorkflowCanvas
            nodes={document.nodes}
            edges={document.edges}
            onNodesChange={canvas.onNodesChange}
            onEdgesChange={canvas.onEdgesChange}
            onConnect={canvas.onConnect}
            onReconnect={canvas.onReconnect}
          />
        }
      />
    </StepActionsContext.Provider>
  );
}
