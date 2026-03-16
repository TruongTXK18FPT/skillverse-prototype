import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Calendar,
  Flag,
  Save,
  Trash2,
  Smile,
  Frown,
  Meh,
  Activity,
  Eye,
  Edit2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  TaskResponse,
  TaskPriority,
  UpdateTaskRequest,
  CreateTaskRequest,
} from '../../../types/TaskBoard';
import '../styles/StudyPlanner.css';

interface TaskDetailModalProps {
  task?: TaskResponse;
  columnId?: string;
  onClose: () => void;
  onSave: (task: CreateTaskRequest | UpdateTaskRequest) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

const DEFAULT_DURATION_HOURS = 24;
const DATETIME_LOCAL_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const pad2 = (value: number) => String(value).padStart(2, '0');

const toDateTimeLocal = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`;

const buildDefaultForm = (targetColumnId: string): CreateTaskRequest => {
  const now = new Date();
  const deadline = new Date(now.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);
  const startValue = toDateTimeLocal(now);
  const deadlineValue = toDateTimeLocal(deadline);

  return {
    title: '',
    description: '',
    startDate: startValue,
    endDate: deadlineValue,
    deadline: deadlineValue,
    priority: TaskPriority.MEDIUM,
    userProgress: 0,
    satisfactionLevel: 'Neutral',
    userNotes: '',
    columnId: targetColumnId,
    linkedSessionIds: [],
  };
};

const normalizeDateTimeLocal = (raw?: string): string => {
  if (!raw) return '';

  const value = raw.trim();
  if (!value) return '';

  if (DATETIME_LOCAL_REGEX.test(value)) {
    return value;
  }

  const noTzValue = value.replace(' ', 'T').replace(/([+-]\d{2}:\d{2}|Z)$/i, '');
  const basicMatch = noTzValue.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (basicMatch) {
    return `${basicMatch[1]}T${basicMatch[2]}`;
  }

  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return toDateTimeLocal(parsedDate);
  }

  return '';
};

const buildPreviewMarkdown = (description: string): string => {
  if (!description.trim()) return '*Chưa có mô tả*';

  return description
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      const isSectionTitle = /^[\p{L}\p{N}\s&/()-]{3,72}:\s*$/u.test(trimmed);
      return isSectionTitle ? `### ${trimmed.slice(0, -1)}` : line;
    })
    .join('\n');
};

const mapTaskToFormData = (task: TaskResponse): CreateTaskRequest => {
  const normalizedStart = normalizeDateTimeLocal(task.startDate);
  const normalizedDeadline = normalizeDateTimeLocal(task.deadline || task.endDate);
  const fallbackStart = normalizedStart || toDateTimeLocal(new Date());
  const fallbackDeadline =
    normalizedDeadline ||
    toDateTimeLocal(new Date(new Date(fallbackStart).getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000));

  return {
    title: task.title,
    description: task.description || '',
    startDate: fallbackStart,
    endDate: fallbackDeadline,
    deadline: fallbackDeadline,
    priority: task.priority,
    userProgress: task.userProgress || 0,
    satisfactionLevel: task.satisfactionLevel || 'Neutral',
    userNotes: task.userNotes || '',
    columnId: task.columnId,
    linkedSessionIds: task.linkedSessionIds || [],
  };
};

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  columnId,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<CreateTaskRequest>(() => buildDefaultForm(columnId || ''));
  const [isPreview, setIsPreview] = useState(true);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  useEffect(() => {
    if (task) {
      setFormData(mapTaskToFormData(task));
      return;
    }

    setFormData(buildDefaultForm(columnId || ''));
  }, [task, columnId]);

  const previewMarkdown = useMemo(
    () => buildPreviewMarkdown(formData.description || ''),
    [formData.description],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };

  const handleDelete = async () => {
    if (task && onDelete) {
      if (await confirmAction('Bạn có chắc chắn muốn xóa công việc này không?')) {
        await onDelete(task.id);
        onClose();
      }
    }
  };

  return (
    <div className="study-plan-modal-overlay" onClick={onClose}>
      <div className="study-plan-modal study-plan-task-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="study-plan-modal-header">
          <h3 className="study-plan-modal-title">{task ? 'Chi tiết công việc' : 'Công việc mới'}</h3>
          <button className="study-plan-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="study-plan-modal-form">
          <div className="study-plan-modal-content study-plan-task-detail-grid">
            <aside className="study-plan-task-detail-sidebar">
              <div className="study-plan-form-group">
                <input
                  className="study-plan-input study-plan-task-title-input"
                  placeholder="Tên công việc"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="study-plan-task-detail-meta-grid">
                <div className="study-plan-form-group">
                  <label className="study-plan-label">
                    <Calendar size={14} /> Bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    className="study-plan-input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="study-plan-form-group">
                  <label className="study-plan-label">
                    <Flag size={14} /> Hạn chót
                  </label>
                  <input
                    type="datetime-local"
                    className="study-plan-input"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deadline: e.target.value,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="study-plan-form-group">
                  <label className="study-plan-label">
                    <Flag size={14} /> Ưu tiên
                  </label>
                  <select
                    className="study-plan-input"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                  >
                    <option value={TaskPriority.LOW}>Thấp</option>
                    <option value={TaskPriority.MEDIUM}>Trung bình</option>
                    <option value={TaskPriority.HIGH}>Cao</option>
                  </select>
                </div>
              </div>

              {task && (
                <div className="study-plan-task-progress-section">
                  <div className="study-plan-form-group">
                    <label className="study-plan-label">
                      <Activity size={14} /> Tiến độ: {formData.userProgress}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="study-plan-range"
                      value={formData.userProgress}
                      onChange={(e) =>
                        setFormData({ ...formData, userProgress: parseInt(e.target.value, 10) })
                      }
                    />
                  </div>

                  <div className="study-plan-form-group">
                    <label className="study-plan-label">Mức độ hài lòng</label>
                    <div className="study-plan-satisfaction-options">
                      {['Satisfied', 'Neutral', 'Unsatisfied'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          className={`study-plan-satisfaction-btn ${formData.satisfactionLevel === level ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, satisfactionLevel: level })}
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
            </aside>

            <section className="study-plan-task-detail-content">
              <div className="study-plan-form-group study-plan-task-detail-description-group">
                <div className="study-plan-task-detail-editor-header">
                  <label className="study-plan-label study-plan-task-detail-editor-label">Mô tả và tài nguyên</label>
                  <button
                    type="button"
                    className="study-plan-task-detail-mode-btn"
                    onClick={() => setIsPreview(!isPreview)}
                  >
                    {isPreview ? (
                      <>
                        <Edit2 size={14} /> Soạn thảo
                      </>
                    ) : (
                      <>
                        <Eye size={14} /> Xem trước
                      </>
                    )}
                  </button>
                </div>

                {isPreview ? (
                  <div className="study-plan-task-detail-preview">
                    <ReactMarkdown>{previewMarkdown}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    className="study-plan-textarea study-plan-description-area"
                    placeholder="Thêm mô tả chi tiết, liên kết học liệu hoặc checklist công việc... (hỗ trợ Markdown)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                )}
              </div>

              <div className="study-plan-form-group study-plan-task-detail-notes-group">
                <label className="study-plan-label">Ghi chú cá nhân</label>
                <textarea
                  className="study-plan-textarea study-plan-task-detail-notes"
                  placeholder="Ghi nhanh rào cản, việc cần nhờ hỗ trợ hoặc lưu ý cho lần học tiếp theo..."
                  value={formData.userNotes}
                  onChange={(e) => setFormData({ ...formData, userNotes: e.target.value })}
                  rows={4}
                />
              </div>
            </section>
          </div>

          <div className="study-plan-task-modal-footer">
            {task && (
              <button
                type="button"
                className="study-plan-btn study-plan-delete-btn"
                onClick={handleDelete}
                style={{ color: 'var(--sv-warning)', borderColor: 'var(--sv-warning)' }}
              >
                <Trash2 size={16} /> Xóa
              </button>
            )}

            <div className="study-plan-footer-actions">
              <button type="button" className="study-plan-btn" onClick={onClose}>
                Hủy
              </button>
              <button
                type="submit"
                className="study-plan-btn active"
                style={{
                  background: 'var(--sv-primary)',
                  color: '#0f172a',
                  borderColor: 'var(--sv-primary)',
                }}
              >
                <Save size={16} /> {task ? 'Lưu thay đổi' : 'Tạo công việc'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDetailModal;
