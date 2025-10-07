import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { RoadmapNode as RoadmapNodeType, QuestProgress } from '../../types/Roadmap';
import RoadmapQuestNode from './RoadmapQuestNode';

interface RoadmapFlowProps {
  roadmap: RoadmapNodeType[];
  progressMap?: Map<string, QuestProgress>;
  onQuestComplete?: (questId: string, completed: boolean) => void;
}

/**
 * React Flow component for interactive roadmap visualization
 */
const RoadmapFlow = ({ roadmap, progressMap, onQuestComplete }: RoadmapFlowProps) => {
  // Custom node types
  const nodeTypes = useMemo(() => ({
    questNode: RoadmapQuestNode
  }), []);

  // Convert roadmap to React Flow nodes
  const convertToFlowNodes = useCallback((): Node[] => {
    const flowNodes: Node[] = [];
    const levelMap = new Map<string, number>();
    const processedNodes = new Set<string>();

    // Find root nodes (nodes that aren't children of any other node)
    const childrenSet = new Set<string>();
    roadmap.forEach(node => {
      node.children.forEach(childId => childrenSet.add(childId));
    });

    const rootNodes = roadmap.filter(node => !childrenSet.has(node.id));

    // BFS to assign levels with better spacing
    const queue: { node: RoadmapNodeType; level: number; xOffset: number }[] = [];
    rootNodes.forEach((node, index) => {
      queue.push({ node, level: 0, xOffset: index * 450 }); // Increased from 350 to 450
    });

    while (queue.length > 0) {
      const { node, level, xOffset } = queue.shift()!;
      
      if (processedNodes.has(node.id)) continue;
      processedNodes.add(node.id);

      levelMap.set(node.id, level);

      // Calculate position with better spacing
      const x = xOffset;
      const y = level * 350; // Increased from 250 to 350 for better vertical spacing

      // Create React Flow node
      flowNodes.push({
        id: node.id,
        type: 'questNode',
        position: { x, y },
        data: {
          node,
          progress: progressMap?.get(node.id),
          onComplete: onQuestComplete
        }
      });

      // Add children to queue with better horizontal spacing
      node.children.forEach((childId, childIndex) => {
        const childNode = roadmap.find(n => n.id === childId);
        if (childNode && !processedNodes.has(childId)) {
          const childXOffset = xOffset + (childIndex - node.children.length / 2) * 320; // Increased from 200 to 320
          queue.push({
            node: childNode,
            level: level + 1,
            xOffset: childXOffset
          });
        }
      });
    }

    return flowNodes;
  }, [roadmap, onQuestComplete]); // Removed progressMap from dependencies!

  // Convert roadmap to React Flow edges
  const convertToFlowEdges = useCallback((): Edge[] => {
    const edges: Edge[] = [];

    roadmap.forEach(node => {
      node.children.forEach(childId => {
        const childNode = roadmap.find(n => n.id === childId);
        if (childNode) {
          const isMainPath = node.type === 'MAIN' && childNode.type === 'MAIN';
          
          edges.push({
            id: `${node.id}-${childId}`,
            source: node.id,
            target: childId,
            type: 'smoothstep',
            animated: isMainPath,
            style: {
              stroke: isMainPath ? '#6366f1' : '#94a3b8',
              strokeWidth: isMainPath ? 3 : 2
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isMainPath ? '#6366f1' : '#94a3b8'
            }
          });
        }
      });
    });

    return edges;
  }, [roadmap]);

  const [nodes, setNodes, onNodesChange] = useNodesState(convertToFlowNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(convertToFlowEdges());

  // Update nodes when roadmap changes (but NOT when progress changes)
  useMemo(() => {
    setNodes(convertToFlowNodes());
    setEdges(convertToFlowEdges());
  }, [roadmap, convertToFlowNodes, convertToFlowEdges, setNodes, setEdges]); // Only depend on roadmap, not progressMap

  // Update node data when progress changes WITHOUT recalculating layout
  useMemo(() => {
    if (progressMap) {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            progress: progressMap.get(node.id)
          }
        }))
      );
    }
  }, [progressMap, setNodes]);

  return (
    <div className="sv-roadmap-flow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false
        }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#e2e8f0" gap={16} />
        <Controls className="sv-roadmap-flow__controls" />
        <MiniMap
          className="sv-roadmap-flow__minimap"
          nodeColor={(node) => {
            const data = node.data as { node?: { type?: string } };
            return data?.node?.type === 'MAIN' ? '#6366f1' : '#94a3b8';
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default RoadmapFlow;
