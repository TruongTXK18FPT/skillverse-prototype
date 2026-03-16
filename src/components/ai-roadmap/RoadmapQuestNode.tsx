import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FlowNodeData } from '../../types/Roadmap';
import { Clock, CheckCircle, PlayCircle, Star, ChevronRight, ChevronDown, Target, Lightbulb, BookOpen, PlusCircle, Loader2, Lock } from 'lucide-react';

/**
 * Custom React Flow node for roadmap quests (V2 Enhanced)
 */
const RoadmapQuestNode = memo(({ data }: NodeProps<FlowNodeData>) => {
  const { node, progress, onComplete, onCreateStudyTask, isCreatingStudyTask, isEligibleForStudyTask } = data;
  const isCompleted = progress?.status === 'COMPLETED';
  const isInProgress = progress?.status === 'IN_PROGRESS';
  const isMain = node.type === 'MAIN';
  const canCreateStudyTask = Boolean(onCreateStudyTask) && !isCompleted && (isEligibleForStudyTask ?? true);
  
  // State for collapsible sections (V2 Enhanced fields)
  const [showDetails, setShowDetails] = useState(false);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };
  
  // Check if node has V2 enhanced fields
  const hasEnhancedFields = !!(
    node.learningObjectives?.length ||
    node.keyConcepts?.length ||
    node.practicalExercises?.length
  );

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node selection
    e.preventDefault(); // Prevent any default behavior
    if (onComplete) {
      onComplete(node.id, !isCompleted);
    }
  };

  const handleCreateTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onCreateStudyTask || isCreatingStudyTask || !canCreateStudyTask) {
      return;
    }
    onCreateStudyTask(node.id);
  };

  return (
    <div
      className={`sv-roadmap-node ${isMain ? 'sv-roadmap-node--main' : 'sv-roadmap-node--side'} ${
        isCompleted ? 'sv-roadmap-node--completed' : ''
      } ${isInProgress ? 'sv-roadmap-node--in-progress' : ''}`}
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
        
        {/* Completion Checkbox */}
        <button
          className={`sv-roadmap-node__checkbox ${isCompleted ? 'sv-roadmap-node__checkbox--checked' : ''}`}
          onClick={handleCheckboxClick}
          title={isCompleted ? 'Đánh dấu là chưa hoàn thành' : 'Đánh dấu là hoàn thành'}
        >
          {isCompleted && <CheckCircle size={20} />}
        </button>
        
        {isInProgress && (
          <PlayCircle className="sv-roadmap-node__status-icon sv-roadmap-node__status-icon--progress" size={20} />
        )}
      </div>

      {/* Node Content */}
      <div className="sv-roadmap-node__content">
        <h3 className="sv-roadmap-node__title" title={node.title}>{node.title}</h3>
        {node.description && (
          <p 
            className="sv-roadmap-node__description" 
            title={node.description}
          >
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
        
        {progress && progress.progress > 0 && !isCompleted && (
          <div className="sv-roadmap-node__progress-bar">
            <div
              className="sv-roadmap-node__progress-fill"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        )}
      </div>

      {onCreateStudyTask && !isCompleted && (
        <div className="sv-roadmap-node__planner">
          <button
            className={`sv-roadmap-node__planner-btn ${isCreatingStudyTask ? 'sv-roadmap-node__planner-btn--loading' : ''} ${!canCreateStudyTask ? 'sv-roadmap-node__planner-btn--locked' : ''}`}
            onClick={handleCreateTaskClick}
            disabled={Boolean(isCreatingStudyTask) || !canCreateStudyTask}
            title={canCreateStudyTask ? 'Tạo task học tập trong Study Planner' : 'Bạn cần hoàn thành node hiện tại trước'}
          >
            {isCreatingStudyTask ? <Loader2 size={14} className="sv-roadmap-node__planner-spinner" /> : canCreateStudyTask ? <PlusCircle size={14} /> : <Lock size={14} />}
            <span>
              {isCreatingStudyTask
                ? 'Đang tạo task...'
                : canCreateStudyTask
                  ? 'Tạo task Planner'
                  : 'Hoàn thành node trước'}
            </span>
          </button>
        </div>
      )}

      {/* V2 Enhanced Details (Collapsible) */}
      {hasEnhancedFields && (
        <div className="sv-roadmap-node__enhanced">
          <button
            className="sv-roadmap-node__toggle"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
          >
            <ChevronDown 
              size={16} 
              className={`sv-roadmap-node__toggle-icon ${showDetails ? 'sv-roadmap-node__toggle-icon--open' : ''}`}
            />
            <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
          </button>

          {showDetails && (
            <div className="sv-roadmap-node__details">
              {node.learningObjectives && node.learningObjectives.length > 0 && (
                <div className="sv-roadmap-node__detail-section">
                  <h4 className="sv-roadmap-node__detail-title">
                    <Target size={14} />
                    Learning Objectives
                  </h4>
                  <ul className="sv-roadmap-node__detail-list">
                    {node.learningObjectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {node.keyConcepts && node.keyConcepts.length > 0 && (
                <div className="sv-roadmap-node__detail-section">
                  <h4 className="sv-roadmap-node__detail-title">
                    <Lightbulb size={14} />
                    Key Concepts
                  </h4>
                  <ul className="sv-roadmap-node__detail-list">
                    {node.keyConcepts.map((concept, idx) => (
                      <li key={idx}>{concept}</li>
                    ))}
                  </ul>
                </div>
              )}

              {node.practicalExercises && node.practicalExercises.length > 0 && (
                <div className="sv-roadmap-node__detail-section">
                  <h4 className="sv-roadmap-node__detail-title">
                    <BookOpen size={14} />
                    Practical Exercises
                  </h4>
                  <ul className="sv-roadmap-node__detail-list">
                    {node.practicalExercises.map((exercise, idx) => (
                      <li key={idx}>{exercise}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
