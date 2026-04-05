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
import {
  type PlannerTaskKind,
  resolvePlannerExecutionState,
} from '../utils/taskSemantics';
import '../styles/StudyPlanner.css';

interface TaskDetailModalProps {
  task?: TaskResponse;
  taskKind?: PlannerTaskKind;
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

/** Format ms -> "còn X giờ", "quá hạn Y ngày" etc. */
const formatRelativeDeadline = (deadline: string): string | null => {
  if (!deadline) return null;
  const deadlineDate = new Date(deadline.replace(' ', 'T'));
  if (Number.isNaN(deadlineDate.getTime())) return null;

  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffMs < 0) {
    const overdueDays = Math.floor(Math.abs(diffDays));
    if (overdueDays === 0) return `quá hạn ${Math.floor(Math.abs(diffHours))} giờ`;
    if (overdueDays === 1) return 'quá hạn 1 ngày';
    return `quá hạn ${overdueDays} ngày`;
  }

  if (diffHours < 1) return 'sắp đến hạn';
  if (diffHours < 6) return `còn ${Math.floor(diffHours)} giờ`;
  if (diffHours < 24) return `còn ${Math.floor(diffHours)} giờ`;
  if (diffDays < 1) return 'hết hạn hôm nay';
  if (diffDays < 2) return 'còn 1 ngày';
  if (diffDays < 7) return `còn ${Math.floor(diffDays)} ngày`;
  return null;
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]: 'Cao',
  [TaskPriority.MEDIUM]: 'Trung bình',
  [TaskPriority.LOW]: 'Thấp',
};

const DEADLINE_PRESETS = [
  { label: '1 giờ', hours: 1, hint: '+1 tiếng từ giờ' },
  { label: '3 giờ', hours: 3, hint: '+3 tiếng từ giờ' },
  { label: 'Hôm nay', hours: 0, endOfDay: true, hint: '23:59 hôm nay' },
  { label: 'Ngày mai', hours: 24, hint: '23:59 ngày mai' },
  { label: '3 ngày', hours: 72, hint: '23:59 sau 3 ngày' },
  { label: '1 tuần', hours: 168, hint: '23:59 sau 1 tuần' },
];

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
  taskKind = 'manual',
  columnId,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<CreateTaskRequest>(() => buildDefaultForm(columnId || ''));
  const [isPreview, setIsPreview] = useState(true);
  const isRoadmapLinkedTask = taskKind === 'roadmap-course' || taskKind === 'roadmap-fallback';
  const roadmapExecutionState = resolvePlannerExecutionState(task);

  // Validation state
  const deadlineError = useMemo(() => {
    if (!formData.startDate || !formData.deadline) return null;
    const start = new Date(formData.startDate.replace(' ', 'T'));
    const end = new Date(formData.deadline.replace(' ', 'T'));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    if (end < start) return 'Hạn chót phải sau thời gian bắt đầu';
    return null;
  }, [formData.startDate, formData.deadline]);

  const relativeDeadline = useMemo(
    () => formatRelativeDeadline(formData.deadline || ''),
    [formData.deadline],
  );

  const isOverdue = useMemo(() => {
    if (!formData.deadline) return false;
    const deadlineDate = new Date(formData.deadline.replace(' ', 'T'));
    return deadlineDate < new Date();
  }, [formData.deadline]);

  const applyDeadlinePreset = (preset: typeof DEADLINE_PRESETS[0]) => {
    const now = new Date();
    let newDeadline: Date;
    if (preset.endOfDay) {
      newDeadline = new Date(now);
      newDeadline.setHours(23, 59, 0, 0);
    } else {
      newDeadline = new Date(now.getTime() + preset.hours * 60 * 60 * 1000);
    }
    const deadlineValue = toDateTimeLocal(newDeadline);
    const startValue = toDateTimeLocal(now); // auto-set start to now
    setFormData({
      ...formData,
      deadline: deadlineValue,
      endDate: deadlineValue,
      startDate: startValue,
    });
  };

  useEffect(() => {
    // Panel handles its own scroll — no body lock needed
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
    if (deadlineError) return;
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

  const handleQuickRoadmapStatus = async (targetState: 'in-progress' | 'done') => {
    if (!task) {
      return;
    }

    const done = targetState === 'done';

    await onSave({
      status: done ? 'DONE' : 'IN_PROGRESS',
      userProgress: done ? 100 : 0,
      satisfactionLevel: done
        ? formData.satisfactionLevel || 'Satisfied'
        : formData.satisfactionLevel || 'Neutral',
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="study-plan-task-detail-backdrop open" onClick={onClose} />

      {/* Centered Panel */}
      <div className="study-plan-task-detail-panel open">
        <div className="study-plan-modal-header study-plan-task-detail-header">
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
                    className={`study-plan-input ${deadlineError ? 'study-plan-input--error' : ''} ${isOverdue ? 'study-plan-input--overdue' : ''}`}
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deadline: e.target.value,
                        endDate: e.target.value,
                      })
                    }
                  />
                  {deadlineError && (
                    <span className="study-plan-field-error">{deadlineError}</span>
                  )}
                  {!deadlineError && relativeDeadline && (
                    <span className={`study-plan-relative-time ${isOverdue ? 'study-plan-relative-time--overdue' : ''}`}>
                      {isOverdue ? '⏱ ' : '⏱ '}{relativeDeadline}
                    </span>
                  )}
                  {/* Quick presets */}
                  <div className="study-plan-deadline-presets-wrapper">
                    <span className="study-plan-deadline-helper">
                      Đặt nhanh hạn chót:
                    </span>
                    <div className="study-plan-deadline-presets">
                      {DEADLINE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          className="study-plan-deadline-preset-btn"
                          onClick={() => applyDeadlinePreset(preset)}
                          data-hint={preset.hint}
                          title={preset.hint}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Priority — chips for manual tasks, read-only badge for roadmap tasks */}
                <div className="study-plan-form-group">
                  <label className="study-plan-label">
                    <Flag size={14} /> Ưu tiên
                  </label>
                  {isRoadmapLinkedTask ? (
                    <div className={`study-plan-priority-chip study-plan-priority-chip--${formData.priority.toLowerCase()} study-plan-priority-chip--readonly`}>
                      <span className="study-plan-priority-chip__dot" />
                      {PRIORITY_LABELS[formData.priority]}
                      <span className="study-plan-priority-chip__hint">(AI đã gán)</span>
                    </div>
                  ) : (
                    <div className="study-plan-priority-chips">
                      {([TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW] as TaskPriority[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={`study-plan-priority-chip study-plan-priority-chip--${p.toLowerCase()} ${formData.priority === p ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, priority: p })}
                        >
                          <span className="study-plan-priority-chip__dot" />
                          {PRIORITY_LABELS[p]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {task && (
                <div className="study-plan-task-progress-section">
                  {isRoadmapLinkedTask ? (
                    <div className="study-plan-roadmap-task-status-panel">
                      <div className="study-plan-roadmap-task-kind-badge">
                        {taskKind === 'roadmap-course'
                          ? 'Roadmap task: Có khóa học'
                          : 'Roadmap task: Không có khóa học'}
                      </div>
                    </div>
                  ) : (
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
                  )}

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
              {task && isRoadmapLinkedTask ? (
                <>
                  {roadmapExecutionState === 'todo' && (
                    <button
                      type="button"
                      className="study-plan-btn active"
                      style={{
                        background: 'var(--sv-primary)',
                        color: '#0f172a',
                        borderColor: 'var(--sv-primary)',
                      }}
                      onClick={() => {
                        void handleQuickRoadmapStatus('in-progress');
                      }}
                    >
                      Bắt đầu
                    </button>
                  )}
                  {roadmapExecutionState === 'in-progress' && (
                    <button
                      type="button"
                      className="study-plan-btn active"
                      style={{
                        background: 'var(--sv-primary)',
                        color: '#0f172a',
                        borderColor: 'var(--sv-primary)',
                      }}
                      onClick={() => {
                        void handleQuickRoadmapStatus('done');
                      }}
                    >
                      Mark done
                    </button>
                  )}
                  {roadmapExecutionState === 'done' && (
                    <button
                      type="button"
                      className="study-plan-btn"
                      onClick={() => {
                        void handleQuickRoadmapStatus('in-progress');
                      }}
                    >
                      Undo done
                    </button>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default TaskDetailModal;
