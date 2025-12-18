import React, { useState, useEffect } from 'react';
import { Plus, Palette, X, Smile, Meh, Frown, Link as LinkIcon, Calendar, Clock } from 'lucide-react';
import { TaskColumnResponse, TaskResponse, TaskPriority } from '../../../types/TaskBoard';
import { taskBoardService } from '../../../services/taskBoardService';
import '../styles/StudyPlanner.css';

interface TaskBoardProps {
  columns: TaskColumnResponse[];
  onTaskClick: (task: TaskResponse) => void;
  onAddTask: (columnId: string) => void;
  onColumnsChange: (columns: TaskColumnResponse[]) => void;
}

const COLUMN_COLORS = ['#00f0ff', '#00ff9d', '#ff4d4d', '#ffaa00', '#d946ef', '#8b5cf6'];

const TaskBoard: React.FC<TaskBoardProps> = ({ columns, onTaskClick, onAddTask, onColumnsChange }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isNewColumnModalOpen, setIsNewColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
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
      // Optimistic Update
      const sourceCol = columns.find(col => col.tasks.some(t => t.id === taskId));
      if (!sourceCol || sourceCol.id === targetColId) return;

      const task = sourceCol.tasks.find(t => t.id === taskId);
      if (!task) return;

      const newColumns = columns.map(col => {
        if (col.id === sourceCol.id) {
          return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
        }
        if (col.id === targetColId) {
          return { ...col, tasks: [...col.tasks, { ...task, columnId: targetColId }] };
        }
        return col;
      });

      onColumnsChange(newColumns);

      try {
        await taskBoardService.moveTask(taskId, targetColId);
      } catch (error) {
        console.error('Failed to move task:', error);
        // Parent should handle revert if needed, or we just re-fetch in parent
      }
    }
    setDraggedTaskId(null);
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    try {
      await taskBoardService.createColumn(newColumnName);
      setNewColumnName('');
      setIsNewColumnModalOpen(false);
      window.location.reload(); // Temporary fix for column creation sync
    } catch (error) {
      console.error('Failed to create column:', error);
    }
  };

  const handleUpdateColumnColor = async (columnId: string, color: string) => {
    try {
      const column = columns.find(c => c.id === columnId);
      if (column) {
        const newColumns = columns.map(c => c.id === columnId ? { ...c, color } : c);
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
      case TaskPriority.HIGH: return '#ff4d4d';
      case TaskPriority.MEDIUM: return '#ffaa00';
      case TaskPriority.LOW: return '#00ff9d';
      default: return '#00f0ff';
    }
  };

  const getSentimentIcon = (level?: string) => {
    if (level === 'Satisfied') return <Smile size={14} className="study-plan-sentiment-icon satisfied" />;
    if (level === 'Neutral') return <Meh size={14} className="study-plan-sentiment-icon neutral" />;
    if (level === 'Unsatisfied') return <Frown size={14} className="study-plan-sentiment-icon unsatisfied" />;
    return null;
  };

  const hasLink = (text?: string) => {
    return text && (text.includes('http') || text.includes('www.'));
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

  return (
    <div className="study-plan-board-container">
      <div className="study-plan-board">
        {columns.map(column => (
          <div
            key={column.id}
            className="study-plan-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            style={{ borderColor: column.color || 'rgba(0, 240, 255, 0.2)' }}
          >
            <div className="study-plan-column-header" style={{ color: column.color || '#00f0ff' }}>
              <div className="study-plan-column-header-left">
                <span className="study-plan-column-title">{column.name}</span>
                <span className="study-plan-column-count">{column.tasks.length}</span>
              </div>
              <div className="study-plan-column-header-actions">
                <button 
                  className="study-plan-column-action-btn"
                  onClick={() => setEditingColumnId(editingColumnId === column.id ? null : column.id)}
                >
                  <Palette size={14} />
                </button>
              </div>
            </div>

            {editingColumnId === column.id && (
              <div className="study-plan-column-color-picker">
                {COLUMN_COLORS.map(color => (
                  <div 
                    key={color} 
                    className="study-plan-color-swatch" 
                    style={{ background: color }}
                    onClick={() => handleUpdateColumnColor(column.id, color)}
                  />
                ))}
              </div>
            )}
            
            <div className="study-plan-column-content">
              {column.tasks.map(task => (
                <div
                  key={task.id}
                  className="study-plan-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onTaskClick(task)}
                  style={{ 
                    border: `1px solid ${column.color || 'rgba(255, 255, 255, 0.1)'}`,
                    borderLeft: `3px solid ${getPriorityColor(task.priority)}`
                  }}
                >
                  <div className="study-plan-card-header">
                    <div className="study-plan-card-title">{task.title}</div>
                    {getSentimentIcon(task.satisfactionLevel)}
                  </div>
                  
                  {task.userProgress !== undefined && (
                    <div className="study-plan-task-progress-container">
                      <div className="study-plan-task-progress-bar-loading">
                        <div 
                          className="study-plan-task-progress-fill-loading" 
                          style={{ 
                            width: `${task.userProgress}%`, 
                            background: getPriorityColor(task.priority) 
                          }} 
                        />
                      </div>
                      <span className="study-plan-task-progress-text">{task.userProgress}%</span>
                    </div>
                  )}
                  {task.userNotes && (
                    <div className="study-plan-card-notes-preview">
                      {task.userNotes}
                    </div>
                  )}

                  <div className="study-plan-card-footer">
                    <div className="study-plan-card-meta-left">
                      {task.deadline && (
                        <span className={`study-plan-card-date ${new Date(task.deadline) < new Date() ? 'overdue' : ''}`}>
                          <Clock size={12} /> {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    
                    <div className="study-plan-card-badges">
                      {hasLink(task.description) && (
                        <button 
                          className="study-plan-card-icon-btn"
                          onClick={(e) => handleLinkClick(e, task.description)}
                          title="Open Link"
                        >
                          <LinkIcon size={12} />
                        </button>
                      )}
                      {task.description && <span className="study-plan-card-badge" title="Has description">📝</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="study-plan-add-card-btn"
              onClick={() => onAddTask(column.id)}
            >
              <Plus size={16} /> Thêm Nhiệm Vụ
            </button>
          </div>
        ))}

        {/* Add Column Button */}
        <div className="study-plan-column study-plan-add-column-wrapper">
          {isNewColumnModalOpen ? (
            <form onSubmit={handleCreateColumn} className="study-plan-add-column-form">
              <input
                className="study-plan-input"
                placeholder="Tên Cột"
                value={newColumnName}
                onChange={e => setNewColumnName(e.target.value)}
                autoFocus
              />
              <div className="study-plan-add-column-actions">
                <button type="submit" className="study-plan-btn active small">Thêm</button>
                <button 
                  type="button" 
                  className="study-plan-btn small"
                  onClick={() => setIsNewColumnModalOpen(false)}
                >
                  <X size={14} />
                </button>
              </div>
            </form>
          ) : (
            <button 
              className="study-plan-add-column-btn"
              onClick={() => setIsNewColumnModalOpen(true)}
            >
              <Plus size={20} /> Thêm Danh Sách
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;
