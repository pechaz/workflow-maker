import { useEffect } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useStoreApi,
  type Connection,
  type Edge,
  type EdgeChange,
  type OnReconnect,
  type NodeChange,
  type NodeTypes,
} from '@xyflow/react';
import { StepNodeView, type StepNode } from '@/components/organisms/step-node';

const nodeTypes: NodeTypes = { step: StepNodeView };

function MeasureNodes({ signature }: { signature: string }) {
  const store = useStoreApi();

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }
      const { domNode, updateNodeInternals } = store.getState();
      if (!domNode) {
        return;
      }
      const updates = new Map<string, { id: string; nodeElement: HTMLDivElement; force: true }>();
      for (const nodeElement of domNode.querySelectorAll<HTMLDivElement>('.react-flow__node')) {
        const id = nodeElement.getAttribute('data-id');
        if (id) {
          updates.set(id, { id, nodeElement, force: true });
        }
      }
      if (updates.size > 0) {
        updateNodeInternals(updates);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [store, signature]);

  return null;
}

type WorkflowCanvasProps = {
  nodes: StepNode[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange<StepNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onReconnect: OnReconnect;
};

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onReconnect,
}: WorkflowCanvasProps) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onReconnect={onReconnect}
      edgesReconnectable
      deleteKeyCode={['Backspace', 'Delete']}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      minZoom={0.2}
      maxZoom={1.5}
      colorMode="light"
      className="bg-muted/40"
    >
      <MeasureNodes
        signature={nodes
          .map(
            (node) =>
              `${node.id}:${node.data.name}:${node.data.durationText}:${node.data.onCriticalPath}:${node.data.invalid}`,
          )
          .join('|')}
      />
      <Background />
      <Controls />
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
}
