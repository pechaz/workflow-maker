import type { ReactNode } from 'react';

type EditorTemplateProps = {
  toolbar: ReactNode;
  banner: ReactNode;
  canvas: ReactNode;
};

export function EditorTemplate({ toolbar, banner, canvas }: EditorTemplateProps) {
  return (
    <main className="flex h-full min-h-0 flex-col bg-background" aria-label="Workflow">
      {toolbar}
      {banner}
      <section className="relative min-h-0 flex-1" aria-label="Workflow graph">
        <div className="absolute inset-0">{canvas}</div>
      </section>
    </main>
  );
}
