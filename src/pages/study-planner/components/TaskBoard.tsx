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
  Funnel,
  Check,
} from 'lucide-react';
import { FaYoutube } from 'react-icons/fa';
import { SiGooglemeet } from 'react-icons/si';
import {
  TaskColumnResponse,
  TaskResponse,
  TaskPriority,
} from '../../../types/TaskBoard';
import { taskBoardService } from '../../../services/taskBoardService';
import {
  isTaskDone,
  parseRoadmapTaskLink,
  resolvePlannerExecutionState,
} from '../utils/taskSemantics';
import '../styles/StudyPlanner.css';

interface FilterOption {
  id: number | 'current' | 'all';
  label: string;
  taskCount?: number;
}

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
  /** Filter panel: which roadmap sessions are available to filter by */
  filterOptions: FilterOption[];
  /** Filter panel: currently selected filter */
  selectedFilter: number | 'current' | 'all';
  /** Filter panel: callback when user changes filter */
  onFilterChange: (filterId: number | 'current' | 'all') => void;
}

const COLUMN_COLORS = [
  '#00f0ff',
  '#00ff9d',
  '#ff4d4d',
  '#ffaa00',
  '#d946ef',
  '#8b5cf6',
];

const KANBAN_VISIBLE_TASKS = 10;

const normalizePlannerLabelToken = (value?: string | null): string =>
  (value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, '');

const PLANNER_LABELS_BY_TOKEN: Record<string, string> = {
  todo: 'Cần làm',
  backlog: 'Tồn đọng',
  pending: 'Chờ xử lý',
  inprogress: 'Đang thực hiện',
  doing: 'Đang thực hiện',
  ongoing: 'Đang thực hiện',
  done: 'Hoàn thành',
  completed: 'Hoàn thành',
  finished: 'Hoàn thành',
  overdue: 'Quá hạn',
  schedule: 'Lịch học',
};

const getPlannerDisplayLabel = (value?: string | null): string => {
  const normalized = normalizePlannerLabelToken(value);
  return PLANNER_LABELS_BY_TOKEN[normalized] || value || 'Chưa đặt tên';
};

const RoadmapFilterPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  options: FilterOption[];
  selected: number | 'current' | 'all';
  onSelect: (id: number | 'current' | 'all') => void;
}> = ({ isOpen, onClose, options, selected, onSelect }) => {
  if (!isOpen) return null;

  const ALL_OPT = { id: 'all' as const, label: 'Tất cả lộ trình' };
  const CURRENT_OPT = { id: 'current' as const, label: 'Lộ trình hiện tại' };
  const fixedOptions = [ALL_OPT, CURRENT_OPT, ...options];

  return (
    <div className="roadmap-filter-panel">
      <div className="roadmap-filter-panel-header">
        <span className="roadmap-filter-panel-title">Lọc theo lộ trình</span>
        <button className="roadmap-filter-panel-close" onClick={onClose} title="Đóng">
          <X size={14} />
        </button>
      </div>
      <div className="roadmap-filter-panel-list">
        {fixedOptions.map((opt) => (
          <button
            key={String(opt.id)}
            className={`roadmap-filter-option ${selected === opt.id ? 'active' : ''}`}
            onClick={() => { onSelect(opt.id); onClose(); }}
          >
            <span className="roadmap-filter-option-check">
              {selected === opt.id && <Check size={12} />}
            </span>
            <span className="roadmap-filter-option-label">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ROADMAP_NOTE_MARKER_PATTERN =
  /\[ROADMAP_NODE_LINK\](?:\s+journey=(\d+))?\s+roadmap=(\d+)\s+node=([^\s]+)(?:\s+nodeOrder=([^\s]+))?(?:\s+step=([^\s]+))?/i;

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
  const nodeLabel = nodeOrder ? `Nút ${nodeOrder}` : `Nút ${nodeId}`;
  const taskLabel = step ? `Công việc ${step}` : 'Công việc lộ trình';
  const sourceParts = [nodeLabel, taskLabel];
  if (journeyId) {
    sourceParts.push(`Hành trình #${journeyId}`);
  }
  sourceParts.push(`Lộ trình #${roadmapId}`);
  return sourceParts.join(' • ');
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
  filterOptions,
  selectedFilter,
  onFilterChange,
}) => {
  const [isNewColumnModalOpen, setIsNewColumnModalOpen] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, targetColId: string, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== targetColId || dragOverIndex !== index) {
      setDragOverColumnId(targetColId);
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumnId(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string, dropIndex: number) => {
    e.preventDefault();
    setDraggedTaskId(null);
    setDragOverColumnId(null);
    setDragOverIndex(null);
    const taskId = e.dataTransfer.getData('taskId');

    if (taskId && targetColId) {
      const sourceCol = columns.find((col) =>
        col.tasks.some((task) => task.id === taskId),
      );
      if (!sourceCol) return;

      const taskIndex = sourceCol.tasks.findIndex((item) => item.id === taskId);
      const task = sourceCol.tasks[taskIndex];
      if (!task) return;

      const targetCol = columns.find(c => c.id === targetColId);
      if (!targetCol) return;

      // Ensure local state update happens correctly
      let newColumns = [...columns];
      let newTasksInTarget = [...targetCol.tasks];
      
      // Compute previous and next orderIndex
      let previousOrderIndex: number | undefined = undefined;
      let nextOrderIndex: number | undefined = undefined;

      if (sourceCol.id === targetColId) {
        // Handling moving within the same column
        newTasksInTarget = newTasksInTarget.filter(t => t.id !== taskId);
        
        let localDropIndex = dropIndex;
        if (taskIndex < dropIndex) {
            localDropIndex -= 1;
        }

        const prevTask = newTasksInTarget[localDropIndex - 1];
        const nextTask = newTasksInTarget[localDropIndex];
        previousOrderIndex = prevTask?.orderIndex;
        nextOrderIndex = nextTask?.orderIndex;

        newTasksInTarget.splice(localDropIndex, 0, task);
        
        newColumns = newColumns.map((col) => 
            col.id === targetColId ? { ...col, tasks: newTasksInTarget } : col
        );
      } else {
        // Handling moving to a different column
        const newTasksInSource = sourceCol.tasks.filter((item) => item.id !== taskId);
        
        const prevTask = newTasksInTarget[dropIndex - 1];
        const nextTask = newTasksInTarget[dropIndex];
        previousOrderIndex = prevTask?.orderIndex;
        nextOrderIndex = nextTask?.orderIndex;

        newTasksInTarget.splice(dropIndex, 0, { ...task, columnId: targetColId });

        newColumns = newColumns.map((col) => {
            if (col.id === sourceCol.id) return { ...col, tasks: newTasksInSource };
            if (col.id === targetColId) return { ...col, tasks: newTasksInTarget };
            return col;
        });
      }

      onColumnsChange(newColumns);

      try {
        await taskBoardService.reorderTask(taskId, targetColId, previousOrderIndex, nextOrderIndex);
        onRefresh(); // trigger refresh to sync actual orderIndex from backend
      } catch (error) {
        console.error('Failed to reorder task:', error);
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
    return taskDeadline < cutoffDate && !isTaskDone(task);
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
    <div className="study-plan-board-wrapper">
      <RoadmapFilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        options={filterOptions}
        selected={selectedFilter}
        onSelect={onFilterChange}
      />
      <div className="study-plan-board-header-row">
        <button
          className={`roadmap-filter-toggle ${showFilterPanel ? 'active' : ''}`}
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          title="Lọc theo lộ trình"
        >
          <Funnel size={16} />
          Lọc
        </button>
      </div>
      <div className="study-plan-board-container">
      {columns.map((column) => {
        const oldOverdueCount = column.tasks.filter(isTaskOldOverdue).length;
        const hasOverflowTasks = column.tasks.length > KANBAN_VISIBLE_TASKS;
        const displayColumnName = getPlannerDisplayLabel(column.name);

        return (
          <div
            key={column.id}
            className="study-plan-board-column"
            onDragOver={(e) => handleDragOver(e, column.id, column.tasks.length)}
            onDrop={(e) => handleDrop(e, column.id, column.tasks.length)}
            style={{ borderColor: column.color || 'var(--sv-border)' }}
          >
            <div
              className="study-plan-column-header"
              style={{ borderBottomColor: column.color || 'var(--sv-border)' }}
            >
              <div className="study-plan-column-heading">
                <div
                  className="study-plan-column-title"
                  style={{ color: column.color || 'var(--sv-primary)' }}
                >
                  {displayColumnName}{' '}
                  <span style={{ opacity: 0.5, fontSize: '0.8em' }}>
                    ({column.tasks.length})
                  </span>
                </div>
                {hasOverflowTasks && (
                  <span className="study-plan-column-overflow-note">
                    Hiển thị 10 công việc, cuộn để xem thêm
                  </span>
                )}
              </div>

              <div className="study-plan-column-header-actions">
                {oldOverdueCount > 0 && (
                  <button
                    className="study-plan-column-action-btn study-plan-column-action-btn--danger"
                    onClick={() =>
                      onClearColumnOverdue(column.id, displayColumnName, oldOverdueCount)
                    }
                    title={`Xóa ${oldOverdueCount} công việc quá hạn hơn ${overdueDaysThreshold} ngày`}
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

            <div
              className={`study-plan-task-list ${hasOverflowTasks ? 'study-plan-task-list--scrollable' : ''}`}
            >
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

              {column.tasks.map((task, index) => {
                const roadmapLink = parseRoadmapTaskLink(task.userNotes);
                const isRoadmapLinkedTask = Boolean(roadmapLink);
                const executionState = resolvePlannerExecutionState(task);
                const roadmapTaskStatusText =
                  executionState === 'done'
                    ? 'Hoàn thành'
                    : executionState === 'in-progress'
                      ? 'Đang học'
                      : 'Cần làm';
                const displayTaskStatus = getPlannerDisplayLabel(task.status || column.name);

                return (
                <React.Fragment key={task.id}>
                  {dragOverColumnId === column.id && dragOverIndex === index && (
                    <div
                      className="study-plan-drop-indicator"
                      onDragOver={(e) => {
                        e.stopPropagation();
                        handleDragOver(e, column.id, index);
                      }}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleDrop(e, column.id, index);
                      }}
                      style={{
                        height: '100px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '0.5rem',
                        border: '2px dashed rgba(255, 255, 255, 0.2)',
                        marginBottom: '1rem',
                        transition: 'all 0.2s',
                      }}
                    />
                  )}
                  <div
                    className="study-plan-task-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => {
                      e.stopPropagation();
                      handleDragOver(e, column.id, index);
                    }}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleDrop(e, column.id, index);
                    }}
                    onClick={() => onTaskClick(task)}
                    style={
                      { '--card-color': getPriorityColor(task.priority), opacity: draggedTaskId === task.id ? 0.35 : 1 } as React.CSSProperties
                    }
                  >
                  <div className="study-plan-task-title">{task.title}</div>

                  {!isRoadmapLinkedTask && (
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
                      {displayTaskStatus}
                    </div>
                  )}

                  {/* {task.userNotes && (
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
                      {formatRoadmapTaskNote(task.userNotes)}
                    </div>
                  )} */}

                  {isRoadmapLinkedTask && (
                    <div
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.45rem',
                        borderRadius: '999px',
                        width: 'fit-content',
                        marginBottom: '0.45rem',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color:
                          executionState === 'done'
                            ? '#67e8f9'
                            : executionState === 'in-progress'
                              ? '#fbbf24'
                              : '#cbd5e1',
                        background: 'rgba(15, 23, 42, 0.4)',
                      }}
                    >
                      {roadmapTaskStatusText}
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
                        {new Date(task.deadline).toLocaleDateString('vi-VN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
                </React.Fragment>
                );
              })}
              
              {dragOverColumnId === column.id && dragOverIndex === column.tasks.length && (
                <div
                  className="study-plan-drop-indicator"
                  onDragOver={(e) => {
                    e.stopPropagation();
                    handleDragOver(e, column.id, column.tasks.length);
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDrop(e, column.id, column.tasks.length);
                  }}
                  style={{
                    height: '100px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.5rem',
                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                    marginBottom: '1rem',
                  }}
                />
              )}
            </div>

            <div className="study-plan-column-footer">
              <button
                className="study-plan-add-task-btn"
                onClick={() => onAddTask(column.id)}
              >
                <Plus size={16} /> Thêm công việc
              </button>
            </div>
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
              placeholder="Tên cột"
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
            <Plus size={24} /> Thêm danh sách
          </button>
        )}
      </div>
      </div>
    </div>
  );
};

export default TaskBoard;
