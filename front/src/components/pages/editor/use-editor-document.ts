import { useCallback, useMemo, useRef, useState } from 'react';
import { scheduleWorkflow, validateWorkflow, type Workflow } from '@workflow/shared';
import { editorToWorkflow, type EditorState } from '@/editor-state';
import { toFlow } from '@/graph';
import { useAutosave, type SaveStatus } from '@/useAutosave';

export type Commit = (recipe: (current: EditorState) => EditorState, mode: 'now' | 'debounce' | 'none') => void;

export function useEditorDocument(initial: EditorState, savedWorkflow: Workflow) {
  const editorRef = useRef(initial);
  const [editor, setEditor] = useState(initial);
  const autosave = useAutosave(savedWorkflow);

  const commit = useCallback<Commit>(
    (recipe, mode) => {
      const next = recipe(editorRef.current);
      if (next === editorRef.current) {
        return;
      }
      editorRef.current = next;
      setEditor(next);
      if (mode !== 'none') {
        autosave.requestSave(editorToWorkflow(next), mode);
      }
    },
    [autosave],
  );

  const workflow = useMemo(() => editorToWorkflow(editor), [editor]);
  const validation = useMemo(() => validateWorkflow(workflow), [workflow]);
  const schedule = useMemo(() => scheduleWorkflow(workflow), [workflow]);
  const issues = validation.ok ? autosave.serverIssues : validation.error.issues;
  const status: SaveStatus = validation.ok ? autosave.status : 'invalid';
  const statusText = validation.ok ? autosave.message : 'Not saved';
  const flow = useMemo(() => toFlow(editor, schedule, issues), [editor, schedule, issues]);

  return {
    editor,
    commit,
    schedule,
    issues,
    status,
    statusText,
    nodes: flow.nodes,
    edges: flow.edges,
    retry: autosave.retry,
  };
}
