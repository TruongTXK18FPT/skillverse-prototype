import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import ELK from 'elkjs/lib/elk.bundled.js'; // Import ELK
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

// Cấu hình ELK Layout
const elk = new ELK();
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN', // Sắp xếp từ trên xuống
  'elk.spacing.nodeNode': '80', // Khoảng cách ngang giữa các node
  'elk.layered.spacing.nodeNodeBetweenLayers': '150', // Khoảng cách dọc giữa các tầng
  'elk.layered.noCollision.handling': 'true', // Tự động tránh đè lên nhau
};

const FLOW_NODE_WIDTH = 400;
const FLOW_NODE_HEIGHT = 250;

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
  // Giữ nguyên Node cũ của bạn
  const nodeTypes = useMemo(() => ({
    questNode: RoadmapQuestNode
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

  // 1. Hàm tính toán Layout bằng ELK (Thay thế cho thuật toán BFS cũ)
  const getLayoutedElements = useCallback(async (rawNodes: Node[], rawEdges: Edge[]) => {
    const graph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '300', // <--- Đẩy chiều ngang ra thật xa (300px)
        'elk.layered.spacing.nodeNodeBetweenLayers': '250', // <--- Đẩy chiều dọc ra xa (250px)
        'elk.layered.noCollision.handling': 'true',
      },
      children: rawNodes.map((node) => ({
        id: node.id,
        // <--- Khai báo kích thước vùng chiếm dụng lớn hơn để tạo khoảng thở
        width: FLOW_NODE_WIDTH,
        height: FLOW_NODE_HEIGHT,
      })),
      edges: rawEdges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    };

    try {
      const layoutedGraph = await elk.layout(graph);

      const layoutedNodes = rawNodes.map((node) => {
        const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
        return {
          ...node,
          position: {
            // Thêm offset nhẹ nếu cần căn chỉnh tâm
            x: elkNode?.x || 0,
            y: elkNode?.y || 0
          },
          targetPosition: Position.Top,
          sourcePosition: Position.Bottom,
        };
      });

      return { nodes: layoutedNodes, edges: rawEdges };
    } catch (e) {
      console.error("ELK Layout Error:", e);
      return { nodes: rawNodes, edges: rawEdges };
    }
  }, []);

  // 2. Effect: Xây dựng cấu trúc Graph và chạy Layout
  useEffect(() => {
    // A. Tạo Nodes thô (chưa có vị trí chuẩn)
    const initialNodes: Node[] = roadmap.map((node) => ({
      id: node.id,
      type: 'questNode',
      position: { x: 0, y: 0 }, // Vị trí tạm
      data: {
        node,
        progress: progressMap?.get(node.id),
        onComplete: onQuestComplete,
        onCreateStudyTask,
        isCreatingStudyTask: creatingTaskNodeId === node.id,
        isEligibleForStudyTask: eligibleNodeId == null ? true : eligibleNodeId === node.id,
        hasStudyTask: studyTaskNodeIds?.has(node.id) ?? false,
        isSelected: selectedNodeId === node.id
      }
    }));

    // B. Tạo Edges (Dây nối)
    const initialEdges: Edge[] = [];
    roadmap.forEach((node) => {
      node.children.forEach((childId) => {
        const childNode = roadmap.find((n) => n.id === childId);
        if (childNode) {
          const isMainPath = node.type === 'MAIN' && childNode.type === 'MAIN';
          initialEdges.push({
            id: `${node.id}-${childId}`,
            source: node.id,
            target: childId,
            type: 'smoothstep', // Dây cong vuông góc cho gọn
            animated: isMainPath,
            style: {
              stroke: isMainPath ? '#6366f1' : '#475569', // Màu dây: Tím (Main) hoặc Xám (Side)
              strokeWidth: isMainPath ? 3 : 1.5,
              opacity: 0.8
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isMainPath ? '#6366f1' : '#475569'
            }
          });
        }
      });
    });

    // C. Gọi hàm Layout
    getLayoutedElements(initialNodes, initialEdges).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    });

  }, [roadmap, getLayoutedElements, onQuestComplete, onCreateStudyTask, creatingTaskNodeId, eligibleNodeId, studyTaskNodeIds, selectedNodeId]); // Chỉ chạy lại khi cấu trúc roadmap thay đổi

  // 3. Effect: Cập nhật tiến độ (Không chạy lại Layout -> Fix Lag)
  useEffect(() => {
    if (progressMap) {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            progress: progressMap.get(node.id),
            // Quan trọng: Update lại callback để tránh stale closure
            onComplete: onQuestComplete,
            onCreateStudyTask,
            isCreatingStudyTask: creatingTaskNodeId === node.id,
            isEligibleForStudyTask: eligibleNodeId == null ? true : eligibleNodeId === node.id,
            hasStudyTask: studyTaskNodeIds?.has(node.id) ?? false,
            isSelected: selectedNodeId === node.id
          }
        }))
      );
    }
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

    const graphMinX = Math.min(
      ...nodes.map((node) => (node.positionAbsolute?.x ?? node.position.x))
    );
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

  return (
    <div
      ref={flowContainerRef}
      className={`sv-roadmap-flow ${nodeFocusPanel?.isOpen ? 'sv-roadmap-flow--focus-active' : ''}`}
      style={{ width: '100%', height: '100%' }}
    >
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
        // Thêm các props này để tối ưu performance khi drag
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
