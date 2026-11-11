import { Alert, AlertDescription, AlertTitle } from '@/components/atoms/alert';
import type { WorkflowIssue } from '@workflow/shared';

type IssueBannerProps = {
  issues: WorkflowIssue[];
};

export function IssueBanner({ issues }: IssueBannerProps) {
  return (
    <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
      <AlertTitle>This workflow is not saved.</AlertTitle>
      <AlertDescription>
        <p>Keep editing until the problems are gone.</p>
        <ul className="mt-1 list-disc pl-4">
          {issues.map((issue, index) => (
            <li key={`${issue.code}-${index}`}>{issue.message}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
