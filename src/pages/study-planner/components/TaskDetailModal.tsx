import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, Save, Trash2, Smile, Frown, Meh, Activity, Eye, Edit2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TaskResponse, TaskPriority, UpdateTaskRequest, CreateTaskRequest } from '../../../types/TaskBoard';
import '../styles/StudyPlanner.css';

interface TaskDetailModalProps {
  task?: TaskResponse; // If null, we are creating a new task
  columnId?: string;   // Required if creating a new task
  onClose: () => void;
  onSave: (task: CreateTaskRequest | UpdateTaskRequest) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, 
  columnId, 
  onClose, 
  onSave,
  onDelete 
}) => {
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    deadline: '',
    priority: TaskPriority.MEDIUM,
    userProgress: 0,
    satisfactionLevel: 'Neutral',
    userNotes: '',
    columnId: columnId || '',
    linkedSessionIds: []
  });

  const [isPreview, setIsPreview] = useState(true); // Default to Preview mode

  useEffect(() => {
    // Lock body scroll
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        startDate: task.startDate || '',
        endDate: task.endDate || '',
        deadline: task.deadline || '',
        priority: task.priority,
        userProgress: task.userProgress || 0,
        satisfactionLevel: task.satisfactionLevel || 'Neutral',
        userNotes: task.userNotes || '',
        columnId: task.columnId,
        linkedSessionIds: task.linkedSessionIds || []
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };

  const handleDelete = async () => {
    if (task && onDelete) {
      if (window.confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
        await onDelete(task.id);
        onClose();
      }
    }
  };

  return (
    <div className="study-plan-modal-overlay" onClick={onClose}>
      <div className="study-plan-modal study-plan-task-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="study-plan-modal-header">
          <h3 className="study-plan-modal-title">
            {task ? 'Chi Tiết Công Việc' : 'Công Việc Mới'}
          </h3>
          <button className="study-plan-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="study-plan-modal-form">
          <div className="study-plan-modal-content study-plan-task-modal-grid-layout">
            <div className="study-plan-task-modal-left">
              <div className="study-plan-form-group">
                <input 
                  className="study-plan-input study-plan-task-title-input"
                  placeholder="Tên công việc"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                  autoFocus
                />
              </div>

              <div className="study-plan-task-meta-grid-compact">
                <div className="study-plan-form-group">
                  <label className="study-plan-label"><Calendar size={14} /> Bắt Đầu</label>
                  <input 
                    type="datetime-local"
                    className="study-plan-input"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                {/* End Date removed as it is redundant with Deadline */}
                <div className="study-plan-form-group">
                  <label className="study-plan-label"><Flag size={14} /> Hạn Chót</label>
                  <input 
                    type="datetime-local"
                    className="study-plan-input"
                    value={formData.deadline}
                    onChange={e => setFormData({...formData, deadline: e.target.value, endDate: e.target.value})}
                  />
                </div>

                <div className="study-plan-form-group">
                  <label className="study-plan-label"><Flag size={14} /> Ưu Tiên</label>
                  <select 
                    className="study-plan-input"
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})}
                  >
                    <option value={TaskPriority.LOW}>Thấp</option>
                    <option value={TaskPriority.MEDIUM}>Trung Bình</option>
                    <option value={TaskPriority.HIGH}>Cao</option>
                  </select>
                </div>
              </div>

              {task && (
                <div className="study-plan-task-progress-section">
                  <div className="study-plan-form-group">
                    <label className="study-plan-label">
                      <Activity size={14} /> Tiến Độ: {formData.userProgress}%
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      className="study-plan-range"
                      value={formData.userProgress}
                      onChange={e => setFormData({...formData, userProgress: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="study-plan-form-group">
                    <label className="study-plan-label">Mức Độ Hài Lòng</label>
                    <div className="study-plan-satisfaction-options">
                      {['Satisfied', 'Neutral', 'Unsatisfied'].map(level => (
                        <button
                          key={level}
                          type="button"
                          className={`study-plan-satisfaction-btn ${formData.satisfactionLevel === level ? 'active' : ''}`}
                          onClick={() => setFormData({...formData, satisfactionLevel: level})}
                          title={level}
                        >
                          {level === 'Satisfied' && <Smile size={18} />}
                          {level === 'Neutral' && <Meh size={18} />}
                          {level === 'Unsatisfied' && <Frown size={18} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="study-plan-task-modal-right">
              <div className="study-plan-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="study-plan-label" style={{ marginBottom: 0 }}>Mô Tả & Tài Nguyên</label>
                  <button 
                    type="button" 
                    onClick={() => setIsPreview(!isPreview)}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      cursor: 'pointer', 
                      color: 'var(--sv-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--sv-font-tech)'
                    }}
                  >
                    {isPreview ? <><Edit2 size={14} /> SOẠN THẢO</> : <><Eye size={14} /> XEM TRƯỚC</>}
                  </button>
                </div>

                {isPreview ? (
                  <div 
                    className="study-plan-textarea study-plan-description-area study-plan-markdown-preview"
                  >
                    <ReactMarkdown>{formData.description || '*Chưa có mô tả*'}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea 
                    className="study-plan-textarea study-plan-description-area"
                    placeholder="Thêm mô tả chi tiết, liên kết hoặc danh sách kiểm tra... (Hỗ trợ Markdown)"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    style={{ flex: 1 }}
                  />
                )}
              </div>

              <div className="study-plan-form-group">
                <label className="study-plan-label">Ghi Chú Cá Nhân</label>
                <textarea 
                  className="study-plan-textarea"
                  placeholder="Suy ngẫm, trở ngại hoặc ghi chú nhanh..."
                  value={formData.userNotes}
                  onChange={e => setFormData({...formData, userNotes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="study-plan-task-modal-footer">
            {task && (
              <button type="button" className="study-plan-btn study-plan-delete-btn" onClick={handleDelete} style={{ color: 'var(--sv-warning)', borderColor: 'var(--sv-warning)' }}>
                <Trash2 size={16} /> Xóa
              </button>
            )}
            
            <div className="study-plan-footer-actions">
               <button type="button" className="study-plan-btn" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="study-plan-btn active" style={{ background: 'var(--sv-primary)', color: '#0f172a', borderColor: 'var(--sv-primary)' }}>
                <Save size={16} /> {task ? 'Lưu Thay Đổi' : 'Tạo Công Việc'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDetailModal;
