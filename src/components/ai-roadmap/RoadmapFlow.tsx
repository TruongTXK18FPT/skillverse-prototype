import { useCallback, useEffect, useMemo } from 'react';
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
  Position
} from 'reactflow';
import ELK from 'elkjs/lib/elk.bundled.js'; // Import ELK
import 'reactflow/dist/style.css';
import { RoadmapNode as RoadmapNodeType, QuestProgress } from '../../types/Roadmap';
import RoadmapQuestNode from './RoadmapQuestNode';

interface RoadmapFlowProps {
  roadmap: RoadmapNodeType[];
  progressMap?: Map<string, QuestProgress>;
  onQuestComplete?: (questId: string, completed: boolean) => void;
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

const RoadmapFlow = ({ roadmap, progressMap, onQuestComplete }: RoadmapFlowProps) => {
  // Giữ nguyên Node cũ của bạn
  const nodeTypes = useMemo(() => ({
    questNode: RoadmapQuestNode
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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
        width: 400,
        height: 250,
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
        onComplete: onQuestComplete
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

  }, [roadmap, getLayoutedElements]); // Chỉ chạy lại khi cấu trúc roadmap thay đổi

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
            onComplete: onQuestComplete
          }
        }))
      );
    }
  }, [progressMap, onQuestComplete, setNodes]);

  return (
    <div className="sv-roadmap-flow" style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        // Thêm các props này để tối ưu performance khi drag
        onlyRenderVisibleElements={true}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
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
    </div>
  );
};

export default RoadmapFlow;