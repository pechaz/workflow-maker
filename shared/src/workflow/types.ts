export type WorkflowStep = {
  id: string;
  name: string;
  durationMinutes: number;
  position: {
    x: number;
    y: number;
  };
};

export type WorkflowConnection = {
  id: string;
  fromStepId: string;
  toStepId: string;
};

export type Workflow = {
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
};
