import { Trash2 } from 'lucide-react';
import { Button } from '@/components/atoms/button';

export type SelectedConnection = {
  id: string;
  fromName: string;
  toName: string;
};

type SelectedPathBarProps = {
  connections: SelectedConnection[];
  onRemove: () => void;
};

export function SelectedPathBar({ connections, onRemove }: SelectedPathBarProps) {
  if (connections.length === 0) {
    return null;
  }

  const visible = connections.slice(0, 3);
  const extra = connections.length - visible.length;
  const label = connections.length === 1 ? 'Selected path' : `${connections.length} paths selected`;

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-blue-200 bg-blue-50 px-5 py-2.5 text-blue-950">
      <span className="size-2.5 shrink-0 rounded-full bg-blue-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm">
          {visible.map((connection) => `${connection.fromName} → ${connection.toName}`).join(' · ')}
          {extra > 0 ? ` · +${extra} more` : ''}
        </p>
        <p className="text-xs text-blue-800/80">
          The blue line on the canvas is this path. Drag either end to retarget it, or remove it.
        </p>
      </div>
      <Button type="button" size="sm" variant="destructive" onClick={onRemove}>
        <Trash2 />
        Remove
      </Button>
    </div>
  );
}
