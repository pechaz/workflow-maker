import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CriticalPathLink = {
  id: string;
  fromName: string;
  toName: string;
  selected: boolean;
};

type CriticalPathProps = {
  links: CriticalPathLink[];
  stepNames: string[];
  unavailable: boolean;
  onSelect: (id: string) => void;
};

export function CriticalPath({ links, stepNames, unavailable, onSelect }: CriticalPathProps) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Critical path</p>
        {links.length > 0 ? (
          <p className="text-xs text-muted-foreground">Click a link to select it on the canvas</p>
        ) : null}
      </div>
      {unavailable ? (
        <p className="mt-2 text-sm text-muted-foreground">Fix the workflow before a path can be calculated.</p>
      ) : links.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              aria-pressed={link.selected}
              aria-label={`Select path from ${link.fromName} to ${link.toName}`}
              className={cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-left text-xs font-medium transition-colors',
                link.selected
                  ? 'border-blue-700 bg-blue-600 text-white shadow-sm'
                  : 'border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100',
              )}
              onClick={() => onSelect(link.id)}
            >
              <span className="truncate">{link.fromName}</span>
              <ArrowRight className="size-3 shrink-0" />
              <span className="truncate">{link.toName}</span>
            </button>
          ))}
        </div>
      ) : stepNames.length > 0 ? (
        <p className="mt-2 text-sm font-medium">{stepNames[0]}</p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Add steps and connect them to build a path.</p>
      )}
    </div>
  );
}
