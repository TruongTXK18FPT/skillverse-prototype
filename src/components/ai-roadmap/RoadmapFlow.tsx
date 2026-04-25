import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  Position,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { RoadmapNode as RoadmapNodeType, QuestProgress } from '../../types/Roadmap';
import RoadmapQuestNode from './RoadmapQuestNode';
import RoadmapNodeFocusPanel, {
  type RoadmapNodeFocusPanelPlacement,
  type RoadmapNodeFocusPanelProps,
} from '../roadmap/RoadmapNodeFocusPanel';

interface RoadmapFlowProps {
  roadmap: RoadmapNodeType[];
  progressMap?: Map<string, QuestProgress>;
  onQuestComplete?: (questId: string, completed: boolean) => void;
  onCreateStudyTask?: (nodeId: string) => void;
  creatingTaskNodeId?: string | null;
  eligibleNodeId?: string | null;
  studyTaskNodeIds?: Set<string>;
  selectedNodeId?: string | null;
  onNodeSelect?: (nodeId: string) => void;
  nodeFocusPanel?: RoadmapNodeFocusPanelProps | null;
}

const FLOW_NODE_WIDTH = 400;
const FLOW_NODE_HEIGHT = 250;
const MAIN_SPINE_X = 0;
const MAIN_SPINE_GAP_Y = 420;
const SIDE_LANE_GAP_X = 560;
const SIDE_NODE_GAP_Y = 290;
const SIDE_NODE_Y_OFFSET = 85;

const isMainNode = (node: RoadmapNodeType): boolean =>
  node.type === 'MAIN' || node.isCore === true;

const compareRoadmapOrder = (
  left: RoadmapNodeType,
  right: RoadmapNodeType,
  originalIndex: Map<string, number>,
): number => {
  const leftMain = Number.isFinite(left.mainPathIndex ?? NaN)
    ? Number(left.mainPathIndex)
    : Number.MAX_SAFE_INTEGER;
  const rightMain = Number.isFinite(right.mainPathIndex ?? NaN)
    ? Number(right.mainPathIndex)
    : Number.MAX_SAFE_INTEGER;
  if (leftMain !== rightMain) {
    return leftMain - rightMain;
  }

  const leftOrder = Number.isFinite(left.orderIndex ?? NaN)
    ? Number(left.orderIndex)
    : Number.MAX_SAFE_INTEGER;
  const rightOrder = Number.isFinite(right.orderIndex ?? NaN)
    ? Number(right.orderIndex)
    : Number.MAX_SAFE_INTEGER;
  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return (originalIndex.get(left.id) ?? 0) - (originalIndex.get(right.id) ?? 0);
};

const RoadmapFlow = ({
  roadmap,
  progressMap,
  onQuestComplete,
  onCreateStudyTask,
  creatingTaskNodeId,
  eligibleNodeId,
  studyTaskNodeIds,
  selectedNodeId,
  onNodeSelect,
  nodeFocusPanel,
}: RoadmapFlowProps) => {
  const nodeTypes = useMemo(() => ({
    questNode: RoadmapQuestNode,
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [panelPlacement, setPanelPlacement] = useState<RoadmapNodeFocusPanelPlacement>('right');
  const flowContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedFlowNode = useMemo(() => {
    if (!selectedNodeId) {
      return null;
    }
    return nodes.find((node) => node.id === selectedNodeId) ?? null;
  }, [nodes, selectedNodeId]);

  const isFocusModeActive = Boolean(nodeFocusPanel?.isOpen && nodeFocusPanel?.node);

  const buildInitialEdges = useCallback((roadmapItems: RoadmapNodeType[]): Edge[] => {
    const roadmapById = new Map(roadmapItems.map((node) => [node.id, node]));
    const initialEdges: Edge[] = [];

    roadmapItems.forEach((node) => {
      (node.children ?? []).forEach((childId) => {
        const childNode = roadmapById.get(childId);
        if (!childNode) {
          return;
        }

        const isMainPath = isMainNode(node) && isMainNode(childNode);
        initialEdges.push({
          id: `${node.id}-${childId}`,
          source: node.id,
          target: childId,
          type: 'smoothstep',
          animated: isMainPath,
          style: {
            stroke: isMainPath ? '#6366f1' : '#38bdf8',
            strokeWidth: isMainPath ? 3 : 1.5,
            strokeDasharray: isMainPath ? undefined : '6 6',
            opacity: isMainPath ? 0.9 : 0.72,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isMainPath ? '#6366f1' : '#38bdf8',
          },
        });
      });
    });

    return initialEdges;
  }, []);

  const buildInitialNodes = useCallback((roadmapItems: RoadmapNodeType[]): Node[] => {
    const originalIndex = new Map(roadmapItems.map((node, index) => [node.id, index]));
    const roadmapById = new Map(roadmapItems.map((node) => [node.id, node]));
    const mainNodes = roadmapItems
      .filter(isMainNode)
      .sort((left, right) => compareRoadmapOrder(left, right, originalIndex));
    const fallbackMain = mainNodes[0] ?? roadmapItems[0] ?? null;
    const mainPositionById = new Map<string, { x: number; y: number; node: RoadmapNodeType }>();

    mainNodes.forEach((node, index) => {
      mainPositionById.set(node.id, {
        x: MAIN_SPINE_X,
        y: index * MAIN_SPINE_GAP_Y,
        node,
      });
    });

    const sideOrdinalByParent = new Map<string, number>();

    const resolveParentMain = (node: RoadmapNodeType): RoadmapNodeType | null => {
      const explicitParent = node.parentId ? roadmapById.get(node.parentId) : null;
      if (explicitParent && isMainNode(explicitParent)) {
        return explicitParent;
      }

      if (node.mainPathIndex != null) {
        const matchedByMainIndex = mainNodes.find((main) => main.mainPathIndex === node.mainPathIndex);
        if (matchedByMainIndex) {
          return matchedByMainIndex;
        }
      }

      return fallbackMain;
    };

    return roadmapItems.map((node) => {
      let position = mainPositionById.get(node.id);

      if (!position) {
        const parentMain = resolveParentMain(node);
        const parentPosition = parentMain ? mainPositionById.get(parentMain.id) : null;
        const parentId = parentMain?.id ?? 'root';
        const ordinal = sideOrdinalByParent.get(parentId) ?? 0;
        sideOrdinalByParent.set(parentId, ordinal + 1);

        const lane = Math.floor(ordinal / 2) + 1;
        const direction = ordinal % 2 === 0 ? -1 : 1;
        const verticalPair = Math.floor(ordinal / 2);
        position = {
          x: (parentPosition?.x ?? MAIN_SPINE_X) + direction * SIDE_LANE_GAP_X * lane,
          y: (parentPosition?.y ?? 0) + SIDE_NODE_Y_OFFSET + verticalPair * SIDE_NODE_GAP_Y,
          node,
        };
      }

      return {
        id: node.id,
        type: 'questNode',
        position: { x: position.x, y: position.y },
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
        data: {
          node,
          progress: progressMap?.get(node.id),
          onComplete: onQuestComplete,
          onCreateStudyTask,
          isCreatingStudyTask: creatingTaskNodeId === node.id,
          isEligibleForStudyTask: eligibleNodeId == null ? true : eligibleNodeId === node.id,
          hasStudyTask: studyTaskNodeIds?.has(node.id) ?? false,
          isSelected: selectedNodeId === node.id,
        },
      };
    });
  }, [
    progressMap,
    onQuestComplete,
    onCreateStudyTask,
    creatingTaskNodeId,
    eligibleNodeId,
    studyTaskNodeIds,
    selectedNodeId,
  ]);

  useEffect(() => {
    setNodes(buildInitialNodes(roadmap));
    setEdges(buildInitialEdges(roadmap));
  }, [roadmap, buildInitialNodes, buildInitialEdges, setNodes, setEdges]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          progress: progressMap?.get(node.id),
          onComplete: onQuestComplete,
          onCreateStudyTask,
          isCreatingStudyTask: creatingTaskNodeId === node.id,
          isEligibleForStudyTask: eligibleNodeId == null ? true : eligibleNodeId === node.id,
          hasStudyTask: studyTaskNodeIds?.has(node.id) ?? false,
          isSelected: selectedNodeId === node.id,
        },
      }))
    );
  }, [progressMap, onQuestComplete, onCreateStudyTask, creatingTaskNodeId, eligibleNodeId, setNodes, studyTaskNodeIds, selectedNodeId]);

  useEffect(() => {
    if (!nodeFocusPanel?.isOpen || !selectedFlowNode || !reactFlowInstance || !flowContainerRef.current) {
      return;
    }

    const nodeWidth = typeof selectedFlowNode.width === 'number'
      ? selectedFlowNode.width
      : FLOW_NODE_WIDTH;
    const nodeHeight = typeof selectedFlowNode.height === 'number'
      ? selectedFlowNode.height
      : FLOW_NODE_HEIGHT;
    const nodeX = selectedFlowNode.positionAbsolute?.x ?? selectedFlowNode.position.x;
    const nodeY = selectedFlowNode.positionAbsolute?.y ?? selectedFlowNode.position.y;
    const nodeCenterX = nodeX + nodeWidth / 2;
    const nodeCenterY = nodeY + nodeHeight / 2;

    const containerWidth = flowContainerRef.current.clientWidth;
    const isMobileLayout = containerWidth <= 900;

    if (isMobileLayout) {
      setPanelPlacement('right');
      reactFlowInstance.setCenter(nodeCenterX, nodeCenterY, {
        zoom: 0.72,
        duration: 450,
      });
      return;
    }

    const graphMinX = Math.min(...nodes.map((node) => (node.positionAbsolute?.x ?? node.position.x)));
    const graphMaxX = Math.max(
      ...nodes.map((node) => {
        const nodeLeft = node.positionAbsolute?.x ?? node.position.x;
        const width = typeof node.width === 'number' ? node.width : FLOW_NODE_WIDTH;
        return nodeLeft + width;
      })
    );
    const graphCenterX = (graphMinX + graphMaxX) / 2;
    const nextPlacement: RoadmapNodeFocusPanelPlacement = nodeCenterX >= graphCenterX ? 'left' : 'right';
    setPanelPlacement(nextPlacement);

    const targetZoom = containerWidth >= 1480 ? 0.98 : 0.9;
    const panelShiftPixels = Math.min(360, containerWidth * 0.24);
    const shiftInFlowUnits = panelShiftPixels / targetZoom;
    const focusCenterX = nextPlacement === 'right'
      ? nodeCenterX + shiftInFlowUnits
      : nodeCenterX - shiftInFlowUnits;

    reactFlowInstance.setCenter(focusCenterX, nodeCenterY, {
      zoom: targetZoom,
      duration: 650,
    });
  }, [nodeFocusPanel?.isOpen, selectedFlowNode, reactFlowInstance, nodes]);

  useEffect(() => {
    const className = 'sv-roadmap-lock-scroll';
    if (!isFocusModeActive) {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
      return;
    }

    document.documentElement.classList.add(className);
    document.body.classList.add(className);

    return () => {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    };
  }, [isFocusModeActive]);

  const handleResetLayout = useCallback(() => {
    setNodes(buildInitialNodes(roadmap));
    setEdges(buildInitialEdges(roadmap));
    reactFlowInstance?.fitView({ padding: 0.2, duration: 450 });
  }, [roadmap, buildInitialNodes, buildInitialEdges, reactFlowInstance, setNodes, setEdges]);

  return (
    <div
      ref={flowContainerRef}
      className={`sv-roadmap-flow ${nodeFocusPanel?.isOpen ? 'sv-roadmap-flow--focus-active' : ''}`}
      style={{ width: '100%', height: '100%' }}
    >
      <button
        type="button"
        className="sv-roadmap-flow__reset-layout"
        onClick={handleResetLayout}
        title="Reset layout roadmap"
        aria-label="Reset layout roadmap"
        disabled={roadmap.length === 0}
      >
        <RotateCcw size={14} />
        <span>Reset layout</span>
      </button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(_event, node) => {
          if (onNodeSelect && node?.id) {
            onNodeSelect(node.id);
          }
        }}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        panOnDrag={!isFocusModeActive}
        zoomOnScroll={!isFocusModeActive}
        zoomOnPinch={!isFocusModeActive}
        zoomOnDoubleClick={!isFocusModeActive}
        preventScrolling
        onlyRenderVisibleElements={true}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        onInit={setReactFlowInstance}
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls className="sv-roadmap-flow__controls" />
        <MiniMap
          className="sv-roadmap-flow__minimap"
          maskColor="rgba(2, 6, 23, 0.7)"
          nodeColor={(node) => {
            const type = (node.data as { node?: { type?: string } })?.node?.type;
            return type === 'MAIN' ? '#8b5cf6' : '#38bdf8';
          }}
        />
      </ReactFlow>

      {nodeFocusPanel?.isOpen && nodeFocusPanel.node && (
        <RoadmapNodeFocusPanel
          {...nodeFocusPanel}
          variant="inline"
          placement={panelPlacement}
        />
      )}
    </div>
  );
};

export default RoadmapFlow;
