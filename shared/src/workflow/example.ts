import type { Workflow } from './types.ts';

export const exampleWorkflow: Workflow = {
  steps: [
    {
      id: 'cutting',
      name: 'Cutting',
      durationMinutes: 20,
      position: { x: 0, y: 0 },
    },
    {
      id: 'preparation',
      name: 'Preparation',
      durationMinutes: 10,
      position: { x: 0, y: 180 },
    },
    {
      id: 'assembly',
      name: 'Assembly',
      durationMinutes: 15,
      position: { x: 320, y: 80 },
    },
  ],
  connections: [
    {
      id: 'cutting-assembly',
      fromStepId: 'cutting',
      toStepId: 'assembly',
    },
    {
      id: 'preparation-assembly',
      fromStepId: 'preparation',
      toStepId: 'assembly',
    },
  ],
};
