import React, { useState } from 'react';
import {
  Plus,
  Palette,
  X,
  Smile,
  Meh,
  Frown,
  Link as LinkIcon,
  Clock,
  Trash2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FaYoutube } from 'react-icons/fa';
import { SiGooglemeet } from 'react-icons/si';
import {
  TaskColumnResponse,
  TaskResponse,
  TaskPriority,
} from '../../../types/TaskBoard';
import { taskBoardService } from '../../../services/taskBoardService';
import '../styles/StudyPlanner.css';

interface TaskBoardProps {
  columns: TaskColumnResponse[];
  onTaskClick: (task: TaskResponse) => void;
  onAddTask: (columnId: string) => void;
  onColumnsChange: (columns: TaskColumnResponse[]) => void;
  onRefresh: () => void;
  onClearColumnOverdue: (
    columnId: string,
    columnName: string,
    overdueCount: number,
  ) => void;
  overdueDaysThreshold: number;
  isClearingOverdue: boolean;
}

const COLUMN_COLORS = [
  '#00f0ff',
  '#00ff9d',
  '#ff4d4d',
  '#ffaa00',
  '#d946ef',
  '#8b5cf6',
];

const ROADMAP_NOTE_MARKER_PATTERN =
  /\[ROADMAP_NODE_LINK\]\s+journey=(\d+)\s+roadmap=(\d+)\s+node=([^\s]+)(?:\s+nodeOrder=([^\s]+))?(?:\s+step=([^\s]+))?/i;

const formatRoadmapTaskNote = (rawNotes: string): string => {
  const normalized = rawNotes.trim();
  if (!normalized) {
    return rawNotes;
  }

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const markerLine = lines.find((line) => line.includes('[ROADMAP_NODE_LINK]'));
  if (!markerLine) {
    return rawNotes;
  }

  const readableLines = lines.filter((line) => !line.includes('[ROADMAP_NODE_LINK]'));
  if (readableLines.length > 0) {
    return readableLines.join(' • ');
  }

  const markerMatch = markerLine.match(ROADMAP_NOTE_MARKER_PATTERN);
  if (!markerMatch) {
    return rawNotes;
  }

  const [, journeyId, roadmapId, nodeId, nodeOrder, step] = markerMatch;
  const nodeLabel = nodeOrder ? `Node ${nodeOrder}` : `Node ${nodeId}`;
  const taskLabel = step ? `Task ${step}` : 'Task roadmap';

  return `${nodeLabel} • ${taskLabel} • Journey #${journeyId} • Roadmap #${roadmapId}`;
};

const TaskBoard: React.FC<TaskBoardProps> = ({
  columns,
  onTaskClick,
  onAddTask,
  onColumnsChange,
  onRefresh,
  onClearColumnOverdue,
  overdueDaysThreshold,
  isClearingOverdue,
}) => {
  const [isNewColumnModalOpen, setIsNewColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');

    if (taskId && targetColId) {
      const sourceCol = columns.find((col) =>
        col.tasks.some((task) => task.id === taskId),
      );
      if (!sourceCol || sourceCol.id === targetColId) return;

      const task = sourceCol.tasks.find((item) => item.id === taskId);
      if (!task) return;

      const newColumns = columns.map((col) => {
        if (col.id === sourceCol.id) {
          return { ...col, tasks: col.tasks.filter((item) => item.id !== taskId) };
        }
        if (col.id === targetColId) {
          return {
            ...col,
            tasks: [...col.tasks, { ...task, columnId: targetColId }],
          };
        }
        return col;
      });

      onColumnsChange(newColumns);

      try {
        await taskBoardService.moveTask(taskId, targetColId);
      } catch (error) {
        console.error('Failed to move task:', error);
      }
    }
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    try {
      await taskBoardService.createColumn(newColumnName);
      setNewColumnName('');
      setIsNewColumnModalOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Failed to create column:', error);
    }
  };

  const handleUpdateColumnColor = async (columnId: string, color: string) => {
    try {
      const column = columns.find((item) => item.id === columnId);
      if (column) {
        const newColumns = columns.map((item) =>
          item.id === columnId ? { ...item, color } : item,
        );
        onColumnsChange(newColumns);
        await taskBoardService.updateColumn(columnId, column.name, color);
      }
      setEditingColumnId(null);
    } catch (error) {
      console.error('Failed to update column color:', error);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return '#ff4d4d';
      case TaskPriority.MEDIUM:
        return '#ffaa00';
      case TaskPriority.LOW:
        return '#00ff9d';
      default:
        return '#00f0ff';
    }
  };

  const getSentimentIcon = (level?: string) => {
    if (level === 'Satisfied') {
      return <Smile size={14} className="study-plan-sentiment-icon satisfied" />;
    }
    if (level === 'Neutral') {
      return <Meh size={14} className="study-plan-sentiment-icon neutral" />;
    }
    if (level === 'Unsatisfied') {
      return <Frown size={14} className="study-plan-sentiment-icon unsatisfied" />;
    }
    return null;
  };

  const handleLinkClick = (e: React.MouseEvent, text?: string) => {
    e.stopPropagation();
    if (!text) return;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    if (match && match[0]) {
      window.open(match[0], '_blank');
    }
  };

  const isTaskOldOverdue = (task: TaskResponse): boolean => {
    if (!task.deadline) return false;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - overdueDaysThreshold);

    const taskDeadline = new Date(task.deadline);
    const isDone = task.status?.toLowerCase() === 'done';
    const isCompletedByProgress =
      task.userProgress !== undefined && task.userProgress >= 100;

    return taskDeadline < cutoffDate && !isDone && !isCompletedByProgress;
  };

  const renderLinkIcon = (text?: string) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    if (!match || !match[0]) return null;

    const url = match[0];

    if (/(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/.test(url)) {
      return (
        <div
          className="study-plan-link-icon"
          onClick={(e) => handleLinkClick(e, text)}
          title="Mở liên kết YouTube"
        >
          <FaYoutube size={14} color="#FF0000" />
        </div>
      );
    }

    if (/(https?:\/\/)?meet\.google\.com/.test(url)) {
      return (
        <div
          className="study-plan-link-icon"
          onClick={(e) => handleLinkClick(e, text)}
          title="Mở Google Meet"
        >
          <SiGooglemeet size={14} color="#00897B" />
        </div>
      );
    }

    return (
      <div
        className="study-plan-link-icon"
        onClick={(e) => handleLinkClick(e, text)}
        title="Mở liên kết"
      >
        <LinkIcon size={14} color="var(--sv-primary)" />
      </div>
    );
  };

  return (
    <div className="study-plan-board-container">
      {columns.map((column) => {
        const oldOverdueCount = column.tasks.filter(isTaskOldOverdue).length;

        return (
          <div
            key={column.id}
            className="study-plan-board-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            style={{ borderColor: column.color || 'var(--sv-border)' }}
          >
            <div
              className="study-plan-column-header"
              style={{ borderBottomColor: column.color || 'var(--sv-border)' }}
            >
              <div
                className="study-plan-column-title"
                style={{ color: column.color || 'var(--sv-primary)' }}
              >
                {column.name}{' '}
                <span style={{ opacity: 0.5, fontSize: '0.8em' }}>
                  ({column.tasks.length})
                </span>
              </div>

              <div className="study-plan-column-header-actions">
                {oldOverdueCount > 0 && (
                  <button
                    className="study-plan-column-action-btn study-plan-column-action-btn--danger"
                    onClick={() =>
                      onClearColumnOverdue(column.id, column.name, oldOverdueCount)
                    }
                    title={`Xóa ${oldOverdueCount} task quá hạn hơn ${overdueDaysThreshold} ngày`}
                    disabled={isClearingOverdue}
                  >
                    <Trash2 size={14} />
                    <span>{oldOverdueCount}</span>
                  </button>
                )}

                <button
                  className="study-plan-column-action-btn"
                  onClick={() =>
                    setEditingColumnId(editingColumnId === column.id ? null : column.id)
                  }
                  title="Đổi màu cột"
                >
                  <Palette size={14} />
                </button>
              </div>
            </div>

            {editingColumnId === column.id && (
              <div
                style={{
                  padding: '0.5rem',
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  background: 'rgba(0,0,0,0.2)',
                }}
              >
                {COLUMN_COLORS.map((color) => (
                  <div
                    key={color}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: color,
                      cursor: 'pointer',
                      border: '1px solid white',
                    }}
                    onClick={() => handleUpdateColumnColor(column.id, color)}
                  />
                ))}
              </div>
            )}

            <div className="study-plan-task-list">
              {column.tasks.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    color: 'var(--sv-text-muted)',
                    opacity: 0.5,
                    padding: '2rem 0',
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                  }}
                >
                  Chưa có công việc
                </div>
              )}

              {column.tasks.map((task) => (
                <div
                  key={task.id}
                  className="study-plan-task-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onTaskClick(task)}
                  style={
                    { '--card-color': getPriorityColor(task.priority) } as React.CSSProperties
                  }
                >
                  <div className="study-plan-task-title">{task.title}</div>

                  <div
                    className="study-plan-task-status-badge"
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.1)',
                      width: 'fit-content',
                      marginBottom: '0.5rem',
                      color: getPriorityColor(task.priority),
                    }}
                  >
                    {task.status || column.name}
                  </div>

                  {task.description && (
                    <div className="study-plan-task-desc-preview">
                      <ReactMarkdown>{task.description}</ReactMarkdown>
                    </div>
                  )}

                  {task.userNotes && (
                    <div
                      className="study-plan-task-notes"
                      style={{
                        fontSize: '0.75rem',
                        color: '#fbbf24',
                        background: 'rgba(251, 191, 36, 0.1)',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        marginBottom: '0.5rem',
                        fontStyle: 'italic',
                      }}
                    >
                      Ghi chú: {formatRoadmapTaskNote(task.userNotes)}
                    </div>
                  )}

                  {task.userProgress !== undefined && (
                    <div
                      style={{
                        height: '4px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                        marginBottom: '0.5rem',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${task.userProgress}%`,
                          background: getPriorityColor(task.priority),
                        }}
                      />
                    </div>
                  )}

                  <div className="study-plan-task-meta">
                    {task.deadline && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color:
                            new Date(task.deadline) < new Date()
                              ? 'var(--sv-warning)'
                              : 'inherit',
                        }}
                      >
                        <Clock size={12} />{' '}
                        {new Date(task.deadline).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                    <div className="study-plan-task-meta-right">
                      {getSentimentIcon(task.satisfactionLevel)}
                      {renderLinkIcon(task.description)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="study-plan-add-task-btn"
              onClick={() => onAddTask(column.id)}
            >
              <Plus size={16} /> Thêm Công Việc
            </button>
          </div>
        );
      })}

      <div
        className="study-plan-board-column"
        style={{
          background: 'transparent',
          border: '2px dashed var(--sv-border)',
          minWidth: '300px',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isNewColumnModalOpen ? (
          <form onSubmit={handleCreateColumn} style={{ padding: '1rem', width: '100%' }}>
            <input
              className="study-plan-input"
              placeholder="Tên Cột"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              autoFocus
              style={{ marginBottom: '1rem' }}
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                className="study-plan-btn active"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Thêm
              </button>
              <button
                type="button"
                className="study-plan-btn"
                onClick={() => setIsNewColumnModalOpen(false)}
              >
                <X size={14} />
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsNewColumnModalOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--sv-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.1rem',
            }}
          >
            <Plus size={24} /> Thêm Danh Sách
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskBoard;
