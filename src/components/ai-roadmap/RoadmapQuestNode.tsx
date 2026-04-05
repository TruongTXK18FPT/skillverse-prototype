import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FlowNodeData } from '../../types/Roadmap';
import { CheckCircle, Circle, Clock, PlayCircle, Star, ChevronRight } from 'lucide-react';

/**
 * Custom React Flow node for roadmap quests (V2 Enhanced)
 */
const RoadmapQuestNode = memo(({ data }: NodeProps<FlowNodeData>) => {
  const {
    node,
    progress,
    isSelected
  } = data;
  const isCompleted = progress?.status === 'COMPLETED';
  const isInProgress = progress?.status === 'IN_PROGRESS';
  const isMain = node.type === 'MAIN';
  const normalizedProgress = Math.max(0, Math.min(100, progress?.progress ?? (isCompleted ? 100 : 0)));
  const nodeStatusLabel = isCompleted
    ? 'Hoàn thành'
    : isInProgress || normalizedProgress > 0
      ? 'Đang học'
      : node.nodeStatus === 'LOCKED'
        ? 'Bị khóa'
        : 'Sẵn sàng';

  const formatTime = (minutes?: number | null): string => {
    if (!minutes || minutes <= 0) {
      return 'Linh hoạt';
    }
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div
      className={`sv-roadmap-node ${isMain ? 'sv-roadmap-node--main' : 'sv-roadmap-node--side'} ${
        isCompleted ? 'sv-roadmap-node--completed' : ''
      } ${isInProgress ? 'sv-roadmap-node--in-progress' : ''} ${isSelected ? 'sv-roadmap-node--selected' : ''}`}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="sv-roadmap-node__handle sv-roadmap-node__handle--target"
      />

      {/* Node Header */}
      <div className="sv-roadmap-node__header">
        <div className="sv-roadmap-node__badge">
          {isMain ? (
            <Star className="sv-roadmap-node__badge-icon" size={14} />
          ) : (
            <ChevronRight className="sv-roadmap-node__badge-icon" size={14} />
          )}
          <span className="sv-roadmap-node__badge-text">{isMain ? 'Mục tiêu chính' : 'Mục tiêu phụ'}</span>
        </div>

        <span className={`sv-roadmap-node__status-pill sv-roadmap-node__status-pill--${isCompleted ? 'done' : (isInProgress || normalizedProgress > 0) ? 'progress' : node.nodeStatus === 'LOCKED' ? 'locked' : 'ready'}`}>
          {isCompleted ? <CheckCircle size={14} /> : isInProgress || normalizedProgress > 0 ? <PlayCircle size={14} /> : <Circle size={14} />}
          <span>{nodeStatusLabel}</span>
        </span>
      </div>

      {/* Node Content */}
      <div className="sv-roadmap-node__content">
        <h3 className="sv-roadmap-node__title" title={node.title}>{node.title}</h3>
        {node.description && (
          <p className="sv-roadmap-node__description" title={node.description}>
            {node.description}
          </p>
        )}
      </div>

      {/* Node Footer */}
      <div className="sv-roadmap-node__footer">
        <div className="sv-roadmap-node__meta">
          <div className="sv-roadmap-node__time">
            <Clock size={14} />
            <span>{formatTime(node.estimatedTimeMinutes)}</span>
          </div>
          
          {/* V2 Difficulty Badge */}
          {node.difficulty && (
            <span className={`sv-roadmap-node__difficulty sv-roadmap-node__difficulty--${node.difficulty}`}>
              {node.difficulty}
            </span>
          )}
        </div>

        {normalizedProgress > 0 && !isCompleted && (
          <div className="sv-roadmap-node__progress-bar">
            <div
              className="sv-roadmap-node__progress-fill"
              style={{ width: `${normalizedProgress}%` }}
            />
          </div>
        )}

        <div className="sv-roadmap-node__meta-line">
          <span>{normalizedProgress}%</span>
          <span>Nhấn để xem chi tiết</span>
        </div>
      </div>

      {/* Handles for connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="sv-roadmap-node__handle sv-roadmap-node__handle--source"
      />
    </div>
  );
});

RoadmapQuestNode.displayName = 'RoadmapQuestNode';

export default RoadmapQuestNode;
