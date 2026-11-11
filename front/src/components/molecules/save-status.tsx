import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import type { SaveStatus } from '@/useAutosave';

const statusVariant = {
  saved: 'secondary',
  saving: 'outline',
  invalid: 'destructive',
  error: 'destructive',
} as const;

type SaveStatusIndicatorProps = {
  status: SaveStatus;
  message: string;
  onRetry: () => void;
};

export function SaveStatusIndicator({ status, message, onRetry }: SaveStatusIndicatorProps) {
  return (
    <p className="flex items-center gap-2" role="status">
      <Badge variant={statusVariant[status]}>{message}</Badge>
      {status === 'error' ? (
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </p>
  );
}
