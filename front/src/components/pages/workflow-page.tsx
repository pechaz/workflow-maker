import { useCallback, useEffect, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { validateWorkflow, type Workflow } from '@workflow/shared';
import { Button } from '@/components/atoms/button';
import { EditorScreen } from '@/components/pages/editor-page';
import { loadWorkflow } from '@/api';
import { workflowToEditor, type EditorState } from '@/editor-state';

export function WorkflowPage() {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [savedWorkflow, setSavedWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const payload = await loadWorkflow();
      const validation = validateWorkflow(payload.workflow);
      const workflow = validation.ok ? validation.workflow : payload.workflow;
      setSavedWorkflow(workflow);
      setEditor(workflowToEditor(workflow));
    } catch (error) {
      setEditor(null);
      setSavedWorkflow(null);
      setLoadError(error instanceof Error ? error.message : 'Could not load the workflow.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) {
    return (
      <main className="grid h-full place-items-center" aria-label="Workflow">
        <p className="text-sm text-muted-foreground">Loading workflow…</p>
      </main>
    );
  }

  if (!editor || !savedWorkflow) {
    return (
      <main className="grid h-full place-items-center gap-3" aria-label="Workflow">
        <p className="text-sm">{loadError ?? 'Could not load the workflow.'}</p>
        <Button type="button" variant="outline" onClick={() => void reload()}>
          Retry
        </Button>
      </main>
    );
  }

  return (
    <ReactFlowProvider>
      <EditorScreen initial={editor} savedWorkflow={savedWorkflow} />
    </ReactFlowProvider>
  );
}
