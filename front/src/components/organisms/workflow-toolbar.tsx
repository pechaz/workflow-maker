import { useState } from 'react';
import { GitBranch, Plus, RotateCcw, Timer } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { ConfirmDialog } from '@/components/molecules/confirm-dialog';
import { CriticalPath, type CriticalPathLink } from '@/components/molecules/critical-path';
import { SaveStatusIndicator } from '@/components/molecules/save-status';
import { SelectedPathBar, type SelectedConnection } from '@/components/molecules/selected-path-bar';
import type { SaveStatus } from '@/useAutosave';

type WorkflowToolbarProps = {
  durationLabel: string;
  durationDetail: string;
  criticalLinks: CriticalPathLink[];
  criticalStepNames: string[];
  scheduleUnavailable: boolean;
  selectedConnections: SelectedConnection[];
  canReset: boolean;
  status: SaveStatus;
  message: string;
  onRetry: () => void;
  onAddStep: () => void;
  onReset: () => void;
  onSelectConnection: (id: string) => void;
  onRemoveSelected: () => void;
};

export function WorkflowToolbar({
  durationLabel,
  durationDetail,
  criticalLinks,
  criticalStepNames,
  scheduleUnavailable,
  selectedConnections,
  canReset,
  status,
  message,
  onRetry,
  onAddStep,
  onReset,
  onSelectConnection,
  onRemoveSelected,
}: WorkflowToolbarProps) {
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <header className="border-b bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GitBranch className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">Production workflow</h1>
            <p className="text-sm text-muted-foreground">
              Connect prerequisites, then follow the longest path through the work.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveStatusIndicator status={status} message={message} onRetry={onRetry} />
          <Button type="button" variant="outline" disabled={!canReset} onClick={() => setResetOpen(true)}>
            <RotateCcw />
            Reset
          </Button>
          <Button type="button" onClick={onAddStep}>
            <Plus />
            Add step
          </Button>
        </div>
      </div>
      <div className="grid border-t sm:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="flex items-start gap-3 border-b bg-muted/40 px-5 py-3 sm:border-r sm:border-b-0">
          <Timer className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Workflow time</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{durationLabel}</p>
            <p className="text-xs text-muted-foreground">{durationDetail}</p>
          </div>
        </div>
        <div className="px-5 py-3">
          <CriticalPath
            links={criticalLinks}
            stepNames={criticalStepNames}
            unavailable={scheduleUnavailable}
            onSelect={onSelectConnection}
          />
        </div>
      </div>
      <SelectedPathBar connections={selectedConnections} onRemove={onRemoveSelected} />
      <ConfirmDialog
        open={resetOpen}
        title="Reset this workflow?"
        description="Every step and connection will be removed. The empty workflow is saved immediately, and this editor cannot bring the current steps back."
        confirmLabel="Reset workflow"
        onOpenChange={setResetOpen}
        onConfirm={onReset}
      />
    </header>
  );
}
