import type { ReactNode } from 'react';

type StepFieldProps = {
  label: string;
  children: ReactNode;
};

export function StepField({ label, children }: StepFieldProps) {
  return (
    <label className="grid gap-1">
      <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
