import React, { useEffect, useMemo, useState } from 'react';
import { TaskPriority, TaskResponse } from '../../../types/TaskBoard';
import {
  isTaskDone,
  parseRoadmapTaskLink,
  resolvePlannerExecutionState,
} from '../utils/taskSemantics';
import '../styles/StudyPlanner.css';

interface CalendarViewProps {
  sessions: TaskResponse[];
  currentDate: Date;
  onSessionClick: (task: TaskResponse) => void;
  onDateClick?: (date: Date) => void;
  /** Optional: double-click an event to mark it done directly from the calendar */
  onSessionComplete?: (taskId: string) => void;
  focusNodeId?: string | null;
  focusRoadmapSessionId?: number | null;
  focusMode?: 'all' | 'node';
  onFocusModeChange?: (mode: 'all' | 'node') => void;
  preferredFocusDate?: Date | null;
  resolveTaskNodeLabel?: (task: TaskResponse) => string | null;
}

type CalendarTaskMeta = {
  task: TaskResponse;
  startMs: number;
  endMs: number;
  startLabel: string;
  isFocused: boolean;
  isOverdue: boolean;
  isDone: boolean;
  nodeLabel: string | null;
  priorityRank: number;
};

type VisibleTaskMeta = CalendarTaskMeta & {
  lane: number;
};

const MAX_VISIBLE_LANES_PER_CLUSTER = 3;
const MAX_VISIBLE_EVENTS_PER_DAY_GRID = 6;
const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const getExecutionStateLabel = (state: 'todo' | 'in-progress' | 'done'): string => {
  switch (state) {
    case 'in-progress':
      return 'Đang thực hiện';
    case 'done':
      return 'Hoàn thành';
    default:
      return 'Cần làm';
  }
};

const getDateKeyInVietnam = (date: Date): string =>
  date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

const toVietnamHourMinute = (date: Date): { hour: number; minute: number } => {
  const timeText = date.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
  });
  const [hour, minute] = timeText.split(':').map(Number);
  return { hour, minute };
};

const getPriorityRank = (priority: TaskPriority): number => {
  switch (priority) {
    case TaskPriority.HIGH:
      return 3;
    case TaskPriority.MEDIUM:
      return 2;
    case TaskPriority.LOW:
      return 1;
    default:
      return 0;
  }
};

const resolveTaskRange = (task: TaskResponse): { start: Date; end: Date } | null => {
  if (task.startDate && task.endDate) {
    return { start: new Date(task.startDate), end: new Date(task.endDate) };
  }

  if (task.startDate) {
    const start = new Date(task.startDate);
    return { start, end: new Date(start.getTime() + 60 * 60 * 1000) };
  }

  if (task.deadline) {
    const end = new Date(task.deadline);
    return { start: new Date(end.getTime() - 60 * 60 * 1000), end };
  }

  return null;
};

const compareMetaForVisibility = (left: CalendarTaskMeta, right: CalendarTaskMeta): number => {
  if (left.isFocused !== right.isFocused) {
    return left.isFocused ? -1 : 1;
  }

  if (left.isOverdue !== right.isOverdue) {
    return left.isOverdue ? -1 : 1;
  }

  if (left.isDone !== right.isDone) {
    return left.isDone ? 1 : -1;
  }

  if (left.startMs !== right.startMs) {
    return left.startMs - right.startMs;
  }

  if (left.priorityRank !== right.priorityRank) {
    return right.priorityRank - left.priorityRank;
  }

  return left.task.title.localeCompare(right.task.title);
};

const buildDayLayout = (items: CalendarTaskMeta[]) => {
  const laneEndTimes = Array<number>(MAX_VISIBLE_LANES_PER_CLUSTER).fill(-Infinity);
  const visible: VisibleTaskMeta[] = [];
  let overflowCount = 0;

  const sorted = [...items].sort(compareMetaForVisibility);

  sorted.forEach((meta) => {
    if (visible.length >= MAX_VISIBLE_EVENTS_PER_DAY_GRID) {
      overflowCount += 1;
      return;
    }

    const laneIndex = laneEndTimes.findIndex((laneEnd) => meta.startMs >= laneEnd);
    if (laneIndex < 0) {
      overflowCount += 1;
      return;
    }

    laneEndTimes[laneIndex] = meta.endMs;
    visible.push({ ...meta, lane: laneIndex });
  });

  const usedLaneCount = visible.reduce(
    (maxLane, item) => Math.max(maxLane, item.lane + 1),
    1,
  );

  return {
    visible,
    overflowCount,
    usedLaneCount,
  };
};

const CalendarView: React.FC<CalendarViewProps> = ({
  sessions,
  currentDate,
  onSessionClick,
  onDateClick,
  onSessionComplete,
  focusNodeId = null,
  focusRoadmapSessionId = null,
  focusMode = 'all',
  onFocusModeChange,
  preferredFocusDate,
  resolveTaskNodeLabel,
}) => {
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentDate]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const [selectedDate, setSelectedDate] = useState<Date>(() => preferredFocusDate ?? currentDate);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (preferredFocusDate) {
      setSelectedDate(preferredFocusDate);
      return;
    }
    setSelectedDate(currentDate);
  }, [currentDate, preferredFocusDate]);

  const taskMetaById = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, CalendarTaskMeta>();

    sessions.forEach((task) => {
      const range = resolveTaskRange(task);
      if (!range) {
        return;
      }

      const link = parseRoadmapTaskLink(task.userNotes);
      const isFocused = Boolean(
        focusNodeId
          && link
          && link.nodeId === focusNodeId
          && (focusRoadmapSessionId == null || link.roadmapSessionId === focusRoadmapSessionId),
      );
      const execution = resolvePlannerExecutionState(task);
      const isDone = execution === 'done' || isTaskDone(task);
      const nodeLabel = resolveTaskNodeLabel?.(task)
        ?? (link ? `Nút ${link.nodeOrder ?? link.nodeId}` : null);

      map.set(task.id, {
        task,
        startMs: range.start.getTime(),
        endMs: range.end.getTime(),
        startLabel: range.start.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isFocused,
        isOverdue: Boolean(task.deadline && new Date(task.deadline).getTime() < now && !isDone),
        isDone,
        nodeLabel,
        priorityRank: getPriorityRank(task.priority),
      });
    });

    return map;
  }, [focusNodeId, focusRoadmapSessionId, resolveTaskNodeLabel, sessions]);

  const scopedSessions = useMemo(() => {
    if (focusMode !== 'node' || !focusNodeId) {
      return sessions;
    }

    return sessions.filter((task) => taskMetaById.get(task.id)?.isFocused);
  }, [focusMode, focusNodeId, sessions, taskMetaById]);

  const getTasksMetaForDay = useMemo(() => {
    return (date: Date): CalendarTaskMeta[] => {
      const targetDateKey = getDateKeyInVietnam(date);
      return scopedSessions
        .map((task) => taskMetaById.get(task.id))
        .filter((meta): meta is CalendarTaskMeta => Boolean(meta))
        .filter((meta) => getDateKeyInVietnam(new Date(meta.startMs)) === targetDateKey)
        .sort(compareMetaForVisibility);
    };
  }, [scopedSessions, taskMetaById]);

  const selectedDayMeta = useMemo(() => getTasksMetaForDay(selectedDate), [getTasksMetaForDay, selectedDate]);

  const selectedDayNodeCount = useMemo(() => {
    return new Set(
      selectedDayMeta
        .map((meta) => meta.nodeLabel?.trim())
        .filter((label): label is string => Boolean(label)),
    ).size;
  }, [selectedDayMeta]);

  const selectedDayOverdueCount = useMemo(
    () => selectedDayMeta.filter((meta) => meta.isOverdue).length,
    [selectedDayMeta],
  );

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'rgba(251, 113, 133, 0.92)';
      case TaskPriority.MEDIUM:
        return 'rgba(251, 191, 36, 0.9)';
      case TaskPriority.LOW:
        return 'rgba(56, 189, 248, 0.9)';
      default:
        return 'rgba(34, 211, 238, 0.86)';
    }
  };

  const getTaskStyle = (meta: VisibleTaskMeta, laneCount: number) => {
    const start = new Date(meta.startMs);
    const end = new Date(meta.endMs);

    const startTime = toVietnamHourMinute(start);
    const endTime = toVietnamHourMinute(end);

    const startMinute = startTime.hour * 60 + startTime.minute;
    let duration = endTime.hour * 60 + endTime.minute - startMinute;
    if (duration <= 0) {
      duration += 24 * 60;
    }

    const effectiveLaneCount = Math.max(1, Math.min(laneCount, MAX_VISIBLE_LANES_PER_CLUSTER));
    const width = 96 / effectiveLaneCount;
    const left = 2 + width * meta.lane;

    return {
      top: `${startMinute}px`,
      minHeight: '36px',
      height: `${Math.max(duration, 36)}px`,
      width: `${width}%`,
      left: `${left}%`,
      '--event-color': getPriorityColor(meta.task.priority),
      '--event-opacity': meta.isFocused || !focusNodeId ? 1 : 0.52,
    } as React.CSSProperties;
  };

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day);
  };

  return (
    <div className="study-plan-calendar-shell">
      <div className="study-plan-calendar-main">
        {(focusNodeId && onFocusModeChange) && (
          <div className="study-plan-calendar-focus-toolbar">
            <span className="study-plan-calendar-focus-label">Focus hiển thị</span>
            <div className="study-plan-calendar-focus-toggle">
              <button
                type="button"
                className={`study-plan-calendar-focus-btn ${focusMode === 'node' ? 'active' : ''}`}
                onClick={() => onFocusModeChange('node')}
              >
                Chỉ xem node này
              </button>
              <button
                type="button"
                className={`study-plan-calendar-focus-btn ${focusMode === 'all' ? 'active' : ''}`}
                onClick={() => onFocusModeChange('all')}
              >
                Xem tất cả
              </button>
            </div>
          </div>
        )}

          <div className="study-plan-calendar-wrapper">
          <div className="study-plan-calendar-header-row">
            <div className="study-plan-calendar-col-header">GIỜ</div>
            {weekDays.map((day) => {
              const isToday = new Date().toDateString() === day.toDateString();
              const isSelected = getDateKeyInVietnam(day) === getDateKeyInVietnam(selectedDate);
              const dayTasks = getTasksMetaForDay(day);
              const workloadNodeCount = new Set(
                dayTasks
                  .map((item) => item.nodeLabel?.trim())
                  .filter((label): label is string => Boolean(label)),
              ).size;
              const workloadOverdue = dayTasks.filter((item) => item.isOverdue).length;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={`study-plan-calendar-col-header ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectDay(day)}
                >
                  <div style={{ fontWeight: 'bold' }}>
                    {WEEKDAY_LABELS[day.getDay()]}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    {day.getDate()}/{day.getMonth() + 1}
                  </div>
                  <div className="study-plan-day-workload-chip">
                    {dayTasks.length} phiên · {workloadNodeCount} nút
                    {workloadOverdue > 0 ? ` · ${workloadOverdue} quá hạn` : ''}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="study-plan-calendar-body">
            <div className="study-plan-time-grid">
              <div className="study-plan-time-labels-col">
                {hours.map((hour) => (
                  <div key={hour} className="study-plan-time-label">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {weekDays.map((day) => {
                const isToday = new Date().toDateString() === day.toDateString();
                const isSelected = getDateKeyInVietnam(day) === getDateKeyInVietnam(selectedDate);
                const dayTasks = getTasksMetaForDay(day);
                const dayLayout = buildDayLayout(dayTasks);

                return (
                  <div
                    key={day.toISOString()}
                    className={`study-plan-day-col ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectDay(day)}
                  >
                    {hours.map((hour) => (
                      <div key={hour} className="study-plan-time-slot" />
                    ))}

                    {dayLayout.overflowCount > 0 && (
                      <button
                        type="button"
                        className="study-plan-calendar-more"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSelectDay(day);
                        }}
                        title={`Ngày này có thêm ${dayLayout.overflowCount} phiên học. Nhấn để mở lịch trong ngày.`}
                      >
                        +{dayLayout.overflowCount} phiên nữa
                      </button>
                    )}

                    {dayLayout.visible.map((meta) => (
                      <div
                        key={meta.task.id}
                        className={`study-plan-event-item ${meta.isFocused ? 'is-focused' : ''} ${meta.isDone ? 'is-done' : ''} ${focusNodeId && !meta.isFocused ? 'is-dimmed' : ''}`}
                        style={getTaskStyle(meta, dayLayout.usedLaneCount)}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSessionClick(meta.task);
                        }}
                        onDoubleClick={(event) => {
                          event.stopPropagation();
                          if (onSessionComplete && !meta.isDone) {
                            onSessionComplete(meta.task.id);
                          }
                        }}
                        title={meta.task.title}
                      >
                        {/* Priority badge */}
                        {meta.task.priority && (
                          <span className={`study-plan-event-item__priority study-plan-event-item__priority--${meta.task.priority.toLowerCase()}`}>
                            {meta.task.priority === TaskPriority.HIGH ? 'CAO' : meta.task.priority === TaskPriority.MEDIUM ? 'TB' : 'TH'}
                          </span>
                        )}
                        <div className="event-title">{meta.task.title}</div>
                        <div className="event-time">{meta.startLabel}</div>
                        {/* Progress bar */}
                        {meta.task.userProgress != null && meta.task.userProgress > 0 && (
                          <div
                            className="study-plan-event-item__progress-bar"
                            style={{ width: `${meta.task.userProgress}%` }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Single current-time line spanning all day columns */}
              {(() => {
                const today = new Date();
                const isCurrentWeekToday = weekDays.some(
                  (day) => day.toDateString() === today.toDateString()
                );
                if (!isCurrentWeekToday) return null;
                const minute = toVietnamHourMinute(currentTime).hour * 60 + toVietnamHourMinute(currentTime).minute;
                return (
                  <div
                    className="current-time-line"
                    style={{ top: `${minute}px`, left: '60px', right: 0 }}
                    title={`Hiện tại: ${currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <aside className="study-plan-calendar-agenda-panel">
        <div className="study-plan-calendar-agenda-header">
          <h3>
            Lịch trong ngày{' '}
            {selectedDate.toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
            })}
          </h3>
          <p>
            {selectedDayMeta.length} phiên học · {selectedDayNodeCount} nút
            {selectedDayOverdueCount > 0 ? ` · ${selectedDayOverdueCount} quá hạn` : ''}
          </p>
          <div className="study-plan-calendar-agenda-actions">
            <button
              type="button"
              className="study-plan-btn"
              onClick={() => onDateClick?.(selectedDate)}
            >
              Tạo task ngày này
            </button>
          </div>
        </div>

        {selectedDayMeta.length === 0 ? (
          <div className="study-plan-calendar-agenda-empty">
            Ngày này chưa có phiên học nào. Bạn có thể thêm task mới hoặc chuyển sang ngày khác.
          </div>
        ) : (
          <div className="study-plan-calendar-agenda-list">
            {selectedDayMeta.map((meta) => {
              const status = resolvePlannerExecutionState(meta.task);
              return (
                <article
                  key={meta.task.id}
                  className={`study-plan-calendar-agenda-item ${meta.isFocused ? 'is-focused' : ''} ${focusNodeId && !meta.isFocused ? 'is-dimmed' : ''}`}
                >
                  <div className="study-plan-calendar-agenda-time">{meta.startLabel}</div>
                    <div className="study-plan-calendar-agenda-content">
                      <h4>{meta.task.title}</h4>
                      <div className="study-plan-calendar-agenda-meta">
                        {meta.nodeLabel && <span>{meta.nodeLabel}</span>}
                        <span className={`status ${status}`}>
                          {getExecutionStateLabel(status)}
                        </span>
                        {meta.isOverdue && <span className="overdue">Quá hạn</span>}
                      </div>
                    </div>
                  <button
                    type="button"
                    className="study-plan-calendar-agenda-open"
                    onClick={() => onSessionClick(meta.task)}
                  >
                    Mở chi tiết
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </aside>
    </div>
  );
};

export default CalendarView;
