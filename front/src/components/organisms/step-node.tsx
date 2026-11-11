import { createContext, useContext } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { StepField } from '@/components/molecules/step-field';
import { formatMinutes } from '@/graph';
import { cn } from '@/lib/utils';

export type StepNodeData = {
  name: string;
  durationText: string;
  earliestStart: number | null;
  earliestFinish: number | null;
  isStart: boolean;
  onCriticalPath: boolean;
  onSelectedPath: boolean;
  invalid: boolean;
};

export type StepNode = Node<StepNodeData, 'step'>;

type StepActions = {
  rename: (id: string, name: string) => void;
  setDuration: (id: string, durationText: string) => void;
};

export const StepActionsContext = createContext<StepActions | null>(null);

export function StepNodeView({ id, data }: NodeProps<StepNode>) {
  const actions = useContext(StepActionsContext);
  const times =
    data.earliestStart === null || data.earliestFinish === null
      ? 'Times unavailable'
      : `Starts ${formatMinutes(data.earliestStart)} · Finishes ${formatMinutes(data.earliestFinish)}`;

  return (
    <div
      className={cn(
        'w-56 rounded-xl border bg-card p-2.5 text-card-foreground shadow-sm',
        data.onCriticalPath && 'border-orange-500 ring-2 ring-orange-400',
        data.invalid && 'border-destructive ring-2 ring-destructive/40',
        data.onSelectedPath && 'border-blue-700 ring-2 ring-blue-500',
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable
        role="button"
        aria-label={`Incoming connection for ${data.name || 'this step'}`}
      />
      <div className="mb-1.5 flex min-h-5 gap-1">
        {data.isStart ? <Badge variant="secondary">Start</Badge> : null}
        {data.onCriticalPath ? (
          <Badge className="bg-orange-100 text-orange-800">Critical</Badge>
        ) : null}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_4.25rem] gap-1.5">
        <StepField label="Name">
          <Input
            className="nodrag nopan"
            aria-label="Step name"
            value={data.name}
            onChange={(event) => actions?.rename(id, event.target.value)}
          />
        </StepField>
        <StepField label="Minutes">
          <Input
            className="nodrag nopan"
            aria-label="Estimated duration in minutes"
            inputMode="decimal"
            value={data.durationText}
            onChange={(event) => actions?.setDuration(id, event.target.value)}
          />
        </StepField>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{times}</p>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable
        role="button"
        aria-label={`Outgoing connection from ${data.name || 'this step'}`}
      />
    </div>
  );
}
