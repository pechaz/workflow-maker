import { useCallback, useRef, useState } from 'react';
import { validateWorkflow, type Workflow, type WorkflowIssue } from '@workflow/shared';
import { saveWorkflow, type SaveFailure } from './api';

export type SaveStatus = 'saving' | 'saved' | 'invalid' | 'error';

export function useAutosave(initialWorkflow: Workflow) {
  const versionRef = useRef(0);
  const inFlightRef = useRef(false);
  const latestRef = useRef(initialWorkflow);
  const lastSavedRef = useRef(JSON.stringify(initialWorkflow));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [message, setMessage] = useState('All changes saved');
  const [serverIssues, setServerIssues] = useState<WorkflowIssue[]>([]);

  const flush = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }

    const snapshot = latestRef.current;
    const capturedVersion = versionRef.current;
    const validation = validateWorkflow(snapshot);
    if (!validation.ok) {
      setServerIssues(validation.error.issues);
      setStatus('invalid');
      setMessage('Not saved');
      return;
    }

    const serialized = JSON.stringify(validation.workflow);
    if (serialized === lastSavedRef.current) {
      setServerIssues([]);
      setStatus('saved');
      setMessage('All changes saved');
      return;
    }

    inFlightRef.current = true;
    setStatus('saving');
    setMessage('Saving…');

    try {
      await saveWorkflow(validation.workflow);
      lastSavedRef.current = serialized;
      setServerIssues([]);
      if (versionRef.current === capturedVersion) {
        setStatus('saved');
        setMessage('All changes saved');
      }
    } catch (error) {
      const failure = error as SaveFailure;
      if (failure.status === 400 || failure.status === 422) {
        setServerIssues(failure.issues);
        setStatus('invalid');
        setMessage('Not saved');
      } else {
        setStatus('error');
        setMessage(failure.message || 'Save failed');
      }
    } finally {
      inFlightRef.current = false;
      if (versionRef.current !== capturedVersion) {
        void flush();
      }
    }
  }, []);

  const requestSave = useCallback(
    (workflow: Workflow, mode: 'now' | 'debounce') => {
      latestRef.current = workflow;
      versionRef.current += 1;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const validation = validateWorkflow(workflow);
      if (!validation.ok) {
        setServerIssues(validation.error.issues);
        setStatus('invalid');
        setMessage('Not saved');
        return;
      }

      setServerIssues([]);
      setStatus('saving');
      setMessage('Saving…');
      if (mode === 'debounce') {
        timerRef.current = setTimeout(() => {
          void flush();
        }, 300);
        return;
      }
      void flush();
    },
    [flush],
  );

  const retry = useCallback(() => {
    versionRef.current += 1;
    void flush();
  }, [flush]);

  return { status, message, serverIssues, requestSave, retry };
}
