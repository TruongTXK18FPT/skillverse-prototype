import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Trello,
  Bot,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import aiRoadmapService from '../../services/aiRoadmapService';
import { taskBoardService } from '../../services/taskBoardService';
import {
  TaskResponse,
  TaskColumnResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../../types/TaskBoard';
import { RoadmapNode } from '../../types/Roadmap';
import CalendarView from './components/CalendarView.tsx';
import TaskBoard from './components/TaskBoard';
import AIAgentPlanner from './components/AIAgentPlanner';
import TaskDetailModal from './components/TaskDetailModal';
import ClearOverdueConfirmModal from './components/ClearOverdueConfirmModal';
import {
  getPlannerTaskKind,
  isTaskDone,
  parseRoadmapTaskLink,
} from './utils/taskSemantics';
import { buildRoadmapPlanningPath } from '../../utils/plannerNavigation';
import './styles/StudyPlanner.css';

const OVERDUE_CLEAR_DAYS = 30;
const FEEDBACK_HIDE_DELAY_MS = 4000;

type FilterOption = {
  id: number | 'current' | 'all';
  label: string;
  taskCount?: number;
};

type ClearOverdueTarget = {
  columnId?: string;
  columnName?: string;
  targetCount: number;
};

type PlannerExecutionState = 'todo' | 'in-progress' | 'done';

const normalizeExecutionToken = (value?: string | null): string =>
  (value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, '');

const TODO_TOKENS = new Set(['todo', 'backlog', 'pending']);
const IN_PROGRESS_TOKENS = new Set(['inprogress', 'doing', 'ongoing']);
const DONE_TOKENS = new Set(['done', 'completed', 'finished']);

const StudyPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const roadmapSessionId = searchParams.get('roadmapSessionId');
  const nodeId = searchParams.get('nodeId');
  const taskId = searchParams.get('taskId');
  const requestedView = searchParams.get('view');
  const source = searchParams.get('source');
  const isRoadmapNodeSource = source === 'roadmap-node';
  const focusRoadmapSessionId = useMemo(() => {
    if (!roadmapSessionId) {
      return null;
    }
    const parsed = Number(roadmapSessionId);
    return Number.isFinite(parsed) ? parsed : null;
  }, [roadmapSessionId]);
  const [viewMode, setViewMode] = useState<'calendar' | 'board'>(() => {
    if (requestedView === 'board') {
      return 'board';
    }
    if (requestedView === 'calendar') {
      return 'calendar';
    }
    if (isRoadmapNodeSource) {
      return 'calendar';
    }
    return taskId ? 'board' : 'calendar';
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarFocusMode, setCalendarFocusMode] = useState<'all' | 'node'>(() =>
    nodeId ? 'all' : 'all',
  );
  const [loading, setLoading] = useState(true);
  const consumedTaskContextRef = useRef<Set<string>>(new Set());
  const roadmapLoadInFlightRef = useRef<Set<number>>(new Set());
  const calendarFocusAlignedKeyRef = useRef<string>('');

  const [columns, setColumns] = useState<TaskColumnResponse[]>([]);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [roadmapNodesBySessionId, setRoadmapNodesBySessionId] = useState<
    Record<number, Record<string, RoadmapNode>>
  >({});
  const [overdueCount, setOverdueCount] = useState(0);
  const [oldOverdueCount, setOldOverdueCount] = useState(0);
  const [isClearingOverdue, setIsClearingOverdue] = useState(false);
  const [isSpSidebarCollapsed, setIsSpSidebarCollapsed] = useState(false);
  const [clearOverdueTarget, setClearOverdueTarget] =
    useState<ClearOverdueTarget | null>(null);
  const [clearOverdueFeedback, setClearOverdueFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [planFeedback, setPlanFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | undefined>(
    undefined,
  );
  const [targetColumnId, setTargetColumnId] = useState<string | undefined>(
    undefined,
  );
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeRoadmapFilter, setActiveRoadmapFilter] = useState<number | 'current' | 'all'>('current');

  const ensureRoadmapNodesLoaded = useCallback(async (sessionId: number) => {
    if (!Number.isFinite(sessionId)) {
      return;
    }

    if (roadmapNodesBySessionId[sessionId]) {
      return;
    }

    if (roadmapLoadInFlightRef.current.has(sessionId)) {
      return;
    }

    roadmapLoadInFlightRef.current.add(sessionId);
    try {
      const roadmap = await aiRoadmapService.getRoadmapById(sessionId);
      const nodeMap = (roadmap.roadmap || []).reduce<Record<string, RoadmapNode>>(
        (acc, node) => {
          if (node?.id) {
            acc[node.id] = node;
          }
          return acc;
        },
        {},
      );

      setRoadmapNodesBySessionId((prev) => {
        if (prev[sessionId]) {
          return prev;
        }
        return {
          ...prev,
          [sessionId]: nodeMap,
        };
      });
    } catch (error) {
      console.warn('Failed to load roadmap node semantics for planner task:', error);
    } finally {
      roadmapLoadInFlightRef.current.delete(sessionId);
    }
  }, [roadmapNodesBySessionId]);

  const updateViewModeAndUrl = useCallback((
    nextView: 'calendar' | 'board',
    options?: { clearTaskId?: boolean },
  ) => {
    if (viewMode !== nextView) {
      setViewMode(nextView);
    }

    const nextParams = new URLSearchParams(location.search);
    nextParams.set('view', nextView);
    if (options?.clearTaskId) {
      nextParams.delete('taskId');
    }

    const nextQuery = nextParams.toString();
    const nextPath = nextQuery
      ? `${location.pathname}?${nextQuery}`
      : location.pathname;
    const currentPath = `${location.pathname}${location.search}`;

    if (nextPath !== currentPath) {
      navigate(nextPath, { replace: true });
    }
  }, [location.pathname, location.search, navigate, viewMode]);

  const selectedTaskLink = useMemo(
    () => (selectedTask ? parseRoadmapTaskLink(selectedTask.userNotes) : null),
    [selectedTask],
  );

  const selectedTaskLinkedNode = useMemo(() => {
    if (!selectedTaskLink) {
      return null;
    }
    return (
      roadmapNodesBySessionId[selectedTaskLink.roadmapSessionId]?.[
        selectedTaskLink.nodeId
      ] ?? null
    );
  }, [roadmapNodesBySessionId, selectedTaskLink]);

  const selectedTaskKind = useMemo(() => {
    if (!selectedTask) {
      return 'manual';
    }
    return getPlannerTaskKind(selectedTask, selectedTaskLinkedNode);
  }, [selectedTask, selectedTaskLinkedNode]);

  const resolveColumnIdByExecutionState = useCallback((state: PlannerExecutionState) => {
    const tokens =
      state === 'todo'
        ? TODO_TOKENS
        : state === 'in-progress'
          ? IN_PROGRESS_TOKENS
          : DONE_TOKENS;

    const matchedColumn = columns.find((column) =>
      tokens.has(normalizeExecutionToken(column.name)),
    );
    return matchedColumn?.id;
  }, [columns]);

  const resolveStateFromTaskUpdate = (
    update: UpdateTaskRequest,
  ): PlannerExecutionState | null => {
    const normalizedStatus = normalizeExecutionToken(update.status);
    if (DONE_TOKENS.has(normalizedStatus)) {
      return 'done';
    }
    if (IN_PROGRESS_TOKENS.has(normalizedStatus)) {
      return 'in-progress';
    }
    if (TODO_TOKENS.has(normalizedStatus)) {
      return 'todo';
    }
    return null;
  };

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (footer) footer.style.display = 'none';
    return () => {
      if (footer) footer.style.display = '';
    };
  }, []);

  useEffect(() => {
    void fetchData();
  }, [currentDate]);

  // Load available roadmap sessions for the filter panel
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const summaries = await aiRoadmapService.getAllRoadmaps();
        const options: FilterOption[] = summaries.map((r: any) => ({
          id: r.id as number,
          label: r.title || r.metadata?.title || `Roadmap #${r.id}`,
          taskCount: undefined as undefined,
        }));
        setFilterOptions(options);
      } catch (err) {
        console.warn('Failed to load roadmap filter options:', err);
      }
    };
    void loadFilterOptions();
  }, []);

  useEffect(() => {
    if (!roadmapSessionId) {
      return;
    }

    const parsedRoadmapSessionId = Number(roadmapSessionId);
    if (!Number.isFinite(parsedRoadmapSessionId)) {
      return;
    }

    void ensureRoadmapNodesLoaded(parsedRoadmapSessionId);
  }, [ensureRoadmapNodesLoaded, roadmapSessionId]);

  // When roadmap session changes (navigation), reset filter to "current".
  useEffect(() => {
    setActiveRoadmapFilter('current');
  }, [focusRoadmapSessionId]);

  // Re-fetch when filter changes.
  useEffect(() => {
    void fetchData();
  }, [activeRoadmapFilter]);

  useEffect(() => {
    if (!nodeId) {
      setCalendarFocusMode('all');
    }
  }, [nodeId]);

  useEffect(() => {
    if (!clearOverdueFeedback) return;
    const timer = window.setTimeout(
      () => setClearOverdueFeedback(null),
      FEEDBACK_HIDE_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [clearOverdueFeedback]);

  useEffect(() => {
    if (!planFeedback) return;
    const timer = window.setTimeout(
      () => setPlanFeedback(null),
      FEEDBACK_HIDE_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [planFeedback]);

  useEffect(() => {
    if (requestedView === 'board' && viewMode !== 'board') {
      setViewMode('board');
      return;
    }

    if (requestedView === 'calendar' && viewMode !== 'calendar') {
      setViewMode('calendar');
      return;
    }

    if (!requestedView) {
      const fallbackMode: 'calendar' | 'board' = isRoadmapNodeSource
        ? 'calendar'
        : taskId
          ? 'board'
          : 'calendar';
      if (viewMode !== fallbackMode) {
        setViewMode(fallbackMode);
      }
    }
  }, [isRoadmapNodeSource, requestedView, taskId, viewMode]);

  useEffect(() => {
    if (!taskId || loading || tasks.length === 0) {
      return;
    }

    if (isRoadmapNodeSource && requestedView !== 'board') {
      const nextParams = new URLSearchParams(location.search);
      nextParams.delete('taskId');
      if (!nextParams.get('view')) {
        nextParams.set('view', 'calendar');
      }
      const nextQuery = nextParams.toString();
      navigate(nextQuery ? `${location.pathname}?${nextQuery}` : location.pathname, {
        replace: true,
      });
      return;
    }

    const contextKey = [
      roadmapSessionId || 'none',
      nodeId || 'none',
      taskId,
    ].join('|');

    if (consumedTaskContextRef.current.has(contextKey)) {
      return;
    }

    const matchedTask = tasks.find((task) => String(task.id) === taskId);
    if (!matchedTask) {
      return;
    }

    consumedTaskContextRef.current.add(contextKey);
    setViewMode('board');
    setSelectedTask(matchedTask);
    setTargetColumnId(matchedTask.columnId);
    setIsTaskModalOpen(true);

    const nextParams = new URLSearchParams(location.search);
    nextParams.delete('taskId');
    if (!nextParams.get('view')) {
      nextParams.set('view', 'board');
    }
    const nextQuery = nextParams.toString();
    navigate(nextQuery ? `${location.pathname}?${nextQuery}` : location.pathname, {
      replace: true,
    });
  }, [isRoadmapNodeSource, loading, location.pathname, location.search, navigate, nodeId, requestedView, roadmapSessionId, taskId, tasks]);

  useEffect(() => {
    if (!selectedTaskLink) {
      return;
    }

    void ensureRoadmapNodesLoaded(selectedTaskLink.roadmapSessionId);
  }, [ensureRoadmapNodesLoaded, selectedTaskLink]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // When filter is "current" and we have a roadmapSessionId, scope the board to that roadmap.
      // When filter is a number (specific roadmapSessionId), use that.
      // When filter is "all", show all non-archived tasks.
      let effectiveRoadmapSessionId: number | undefined;
      if (activeRoadmapFilter === 'current' && focusRoadmapSessionId) {
        effectiveRoadmapSessionId = focusRoadmapSessionId;
      } else if (activeRoadmapFilter === 'all') {
        effectiveRoadmapSessionId = undefined;
      } else if (typeof activeRoadmapFilter === 'number') {
        effectiveRoadmapSessionId = activeRoadmapFilter;
      }
      const boardData = await taskBoardService.getBoard(effectiveRoadmapSessionId);
      setColumns(boardData);

      const allTasks = boardData.flatMap((column) => column.tasks);
      setTasks(allTasks);

      const now = new Date();
      const overdueTasks = allTasks.filter(
        (task) =>
          task.deadline &&
          new Date(task.deadline) < now &&
          !isTaskDone(task),
      );
      setOverdueCount(overdueTasks.length);

      const oldOverdueThreshold = new Date(now);
      oldOverdueThreshold.setDate(
        oldOverdueThreshold.getDate() - OVERDUE_CLEAR_DAYS,
      );
      const oldOverdueTasks = allTasks.filter(
        (task) =>
          task.deadline &&
          new Date(task.deadline) < oldOverdueThreshold &&
          !isTaskDone(task),
      );
      setOldOverdueCount(oldOverdueTasks.length);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: TaskResponse) => {
    const link = parseRoadmapTaskLink(task.userNotes);
    if (link) {
      void ensureRoadmapNodesLoaded(link.roadmapSessionId);
    }
    setSelectedTask(task);
    setTargetColumnId(task.columnId);
    setIsTaskModalOpen(true);
  };

  const handleAddTask = (columnId: string) => {
    setSelectedTask(undefined);
    setTargetColumnId(columnId);
    setIsTaskModalOpen(true);
  };

  const handleDateClick = (_date: Date) => {
    const defaultColumn = columns[0];
    if (!defaultColumn) return;
    setSelectedTask(undefined);
    setTargetColumnId(defaultColumn.id);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (data: CreateTaskRequest | UpdateTaskRequest) => {
    let shouldRedirectToKanban = false;

    try {
      if (selectedTask) {
        const updatePayload = { ...(data as UpdateTaskRequest) };
        const targetState = resolveStateFromTaskUpdate(updatePayload);
        const targetColumnId = targetState
          ? resolveColumnIdByExecutionState(targetState)
          : undefined;

        // If user starts a task from Calendar, move them to Kanban for execution flow.
        shouldRedirectToKanban =
          viewMode === 'calendar' && targetState === 'in-progress';

        if (targetState === 'done' && updatePayload.userProgress === undefined) {
          updatePayload.userProgress = 100;
        }
        if (targetState === 'todo' && updatePayload.userProgress === undefined) {
          updatePayload.userProgress = 0;
        }

        if (targetColumnId) {
          updatePayload.columnId = targetColumnId;
        }

        await taskBoardService.updateTask(selectedTask.id, updatePayload);

        if (
          targetColumnId &&
          selectedTask.columnId !== targetColumnId
        ) {
          await taskBoardService.moveTask(selectedTask.id, targetColumnId);
        }
      } else {
        await taskBoardService.createTask(data as CreateTaskRequest);
      }
      await fetchData();
      setIsTaskModalOpen(false);

      if (shouldRedirectToKanban) {
        updateViewModeAndUrl('board', { clearTaskId: true });
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskBoardService.deleteTask(taskId);
      await fetchData();
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  /** Quick-complete a task directly from the calendar (double-click) */
  const handleTaskComplete = useCallback(async (taskId: string) => {
    try {
      await taskBoardService.updateTask(taskId, {
        userProgress: 100,
        status: 'done',
        columnId: resolveColumnIdByExecutionState('done'),
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  }, [fetchData]);

  const handleClearOverdueTasks = (
    columnId?: string,
    columnName?: string,
    columnOverdueCount?: number,
  ) => {
    const targetCount = columnOverdueCount ?? oldOverdueCount;
    if (targetCount <= 0) return;
    setClearOverdueTarget({ columnId, columnName, targetCount });
  };

  const executeClearOverdueTasks = async () => {
    if (!clearOverdueTarget) return;

    try {
      setIsClearingOverdue(true);
      const result = await taskBoardService.clearOverdueTasks(
        OVERDUE_CLEAR_DAYS,
        clearOverdueTarget.columnId,
      );
      await fetchData();
      setClearOverdueFeedback({
        type: 'success',
        message: `Đã xóa ${result.deletedCount} task overdue cũ.`,
      });
    } catch (error) {
      console.error('Failed to clear old overdue tasks:', error);
      setClearOverdueFeedback({
        type: 'error',
        message: 'Không thể xóa nhanh task overdue lúc này. Vui lòng thử lại.',
      });
    } finally {
      setIsClearingOverdue(false);
      setClearOverdueTarget(null);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const handlePlanGenerated = async (result?: {
    createdCount: number;
    subjectName: string;
  }) => {
    await fetchData();
    updateViewModeAndUrl('board', { clearTaskId: true });
    setPlanFeedback({
      type: 'success',
      message:
        result && result.createdCount > 0
          ? `Đã tạo ${result.createdCount} phiên học cho ${result.subjectName}. Study plan đã được áp dụng vào bảng của bạn.`
          : 'Study plan đã được áp dụng vào bảng của bạn.',
    });
  };

  const resolveTaskNodeLabel = useCallback((task: TaskResponse): string | null => {
    const link = parseRoadmapTaskLink(task.userNotes);
    if (!link) {
      return null;
    }

    const mappedNode = roadmapNodesBySessionId[link.roadmapSessionId]?.[link.nodeId];
    if (mappedNode?.title) {
      return mappedNode.title;
    }

    return link.nodeOrder ? `Node ${link.nodeOrder}` : `Node ${link.nodeId}`;
  }, [roadmapNodesBySessionId]);

  const preferredFocusDate = useMemo(() => {
    if (!nodeId) {
      return null;
    }

    const matchedDates = tasks
      .map((task) => {
        const link = parseRoadmapTaskLink(task.userNotes);
        if (!link || link.nodeId !== nodeId) {
          return null;
        }
        if (focusRoadmapSessionId != null && link.roadmapSessionId !== focusRoadmapSessionId) {
          return null;
        }

        const dateValue = task.startDate ?? task.deadline;
        if (!dateValue) {
          return null;
        }

        return new Date(dateValue);
      })
      .filter((value): value is Date => Boolean(value))
      .sort((left, right) => left.getTime() - right.getTime());

    return matchedDates[0] ?? null;
  }, [focusRoadmapSessionId, nodeId, tasks]);

  useEffect(() => {
    if (!nodeId || !preferredFocusDate) {
      return;
    }

    const alignmentKey = `${focusRoadmapSessionId ?? 'any'}:${nodeId}:${preferredFocusDate.toISOString()}`;
    if (calendarFocusAlignedKeyRef.current === alignmentKey) {
      return;
    }

    calendarFocusAlignedKeyRef.current = alignmentKey;
    setCurrentDate(preferredFocusDate);
  }, [focusRoadmapSessionId, nodeId, preferredFocusDate]);

  return (
    <div className="study-plan-container">
      {/* ===== LEFT SIDEBAR ===== */}
      <div className={`study-plan-sp-sidebar${isSpSidebarCollapsed ? ' collapsed' : ''}`}>
        {/* Toggle */}
        <button
          className="study-plan-sp-sidebar-toggle"
          onClick={() => setIsSpSidebarCollapsed((v) => !v)}
          title={isSpSidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {isSpSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {!isSpSidebarCollapsed && (
          <>
            {/* Brand */}
            <div className="study-plan-sp-brand">
              <Radio size={22} />
              <div className="study-plan-sp-brand-text">
                <span className="study-plan-sp-brand-title">KẾ HOẠCH</span>
                <span className="study-plan-sp-brand-title">HỌC TẬP</span>
              </div>
            </div>

            {/* Nav */}
            <div className="study-plan-sp-sidebar-nav">
              <button
                className="study-plan-sp-sidebar-link"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft size={14} /> Dashboard
              </button>
              {roadmapSessionId && (
                <button
                  className="study-plan-sp-sidebar-link"
                  onClick={() => {
                    const navUrl = buildRoadmapPlanningPath(roadmapSessionId, {
                      nodeId: nodeId,
                      expandedIds: nodeId ? [nodeId] : undefined,
                    });
                    navigate(navUrl);
                  }}
                >
                  <ArrowLeft size={14} /> Node
                </button>
              )}
            </div>

            {/* View mode */}
            <div className="study-plan-sp-sidebar-section">Chế độ xem</div>
            <div className="study-plan-sp-sidebar-view-btns">
              <button
                className={`study-plan-sp-sidebar-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => updateViewModeAndUrl('calendar', { clearTaskId: true })}
              >
                <Calendar size={16} />
                <span>Lịch</span>
              </button>
              <button
                className={`study-plan-sp-sidebar-btn ${viewMode === 'board' ? 'active' : ''}`}
                onClick={() => updateViewModeAndUrl('board', { clearTaskId: true })}
              >
                <Trello size={16} />
                <span>Kanban</span>
              </button>
            </div>

            {/* AI */}
            <button
              className="study-plan-sp-sidebar-btn study-plan-sp-sidebar-btn--ai"
              onClick={() => setIsAIModalOpen(true)}
            >
              <Bot size={16} />
              <span>Trợ lý AI</span>
            </button>
          </>
        )}
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="study-plan-sp-main">
        {overdueCount > 0 && (
        <div className="study-plan-alert">
          <span style={{ fontSize: '1.2rem' }}>!</span>
          <div className="study-plan-alert-content">
            <span>CẢNH BÁO: {overdueCount} CÔNG VIỆC QUÁ HẠN CẦN XỬ LÝ NGAY.</span>
            {oldOverdueCount > 0 && (
              <button
                className="study-plan-alert-clear-btn"
                onClick={() => handleClearOverdueTasks()}
                disabled={isClearingOverdue}
              >
                {isClearingOverdue
                  ? 'Đang xóa...'
                  : `Xóa nhanh ${oldOverdueCount} task > ${OVERDUE_CLEAR_DAYS} ngày`}
              </button>
            )}
          </div>
        </div>
      )}

      {clearOverdueFeedback && (
        <div
          className={`study-plan-overdue-feedback study-plan-overdue-feedback--${clearOverdueFeedback.type}`}
        >
          {clearOverdueFeedback.message}
        </div>
      )}

      {/* ===== FEEDBACK TOASTS ===== */}
      {planFeedback && (
        <div
          className={`study-plan-overdue-feedback study-plan-overdue-feedback--${planFeedback.type}`}
        >
          {planFeedback.message}
        </div>
      )}

      {/* ===== BOARD / CALENDAR AREA ===== */}
      <div className="study-plan-board-area">
        {viewMode === 'calendar' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2rem',
              marginBottom: '1.5rem',
            }}
          >
            <button
              className="study-plan-btn"
              onClick={() => navigateWeek('prev')}
              style={{ padding: '0.5rem' }}
            >
              <ChevronLeft size={24} />
            </button>

            <h2
              style={{
                minWidth: '300px',
                textAlign: 'center',
                fontFamily: 'var(--sv-font-tech)',
                color: 'var(--sv-primary)',
                textShadow: '0 0 10px var(--sv-primary-glow)',
                fontSize: '1.5rem',
                margin: 0,
              }}
            >
              {currentDate
                .toLocaleString('en-US', { month: 'long', year: 'numeric' })
                .toUpperCase()}
            </h2>

            <button
              className="study-plan-btn"
              onClick={() => navigateWeek('next')}
              style={{ padding: '0.5rem' }}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}

        {loading && viewMode === 'calendar' ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem',
              color: 'var(--sv-primary)',
              fontFamily: 'var(--sv-font-tech)',
            }}
          >
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
            {viewMode === 'calendar' ? (
              <CalendarView
                sessions={tasks}
                currentDate={currentDate}
                onSessionClick={handleTaskClick}
                onDateClick={handleDateClick}
                onSessionComplete={handleTaskComplete}
                focusNodeId={nodeId}
                focusRoadmapSessionId={focusRoadmapSessionId}
                focusMode={calendarFocusMode}
                onFocusModeChange={setCalendarFocusMode}
                preferredFocusDate={preferredFocusDate}
                resolveTaskNodeLabel={resolveTaskNodeLabel}
              />
            ) : (
              <TaskBoard
                columns={columns}
                onTaskClick={handleTaskClick}
                onAddTask={handleAddTask}
                onColumnsChange={setColumns}
                onRefresh={fetchData}
                onClearColumnOverdue={handleClearOverdueTasks}
                overdueDaysThreshold={OVERDUE_CLEAR_DAYS}
                isClearingOverdue={isClearingOverdue}
                filterOptions={[]}
                selectedFilter={activeRoadmapFilter}
                onFilterChange={setActiveRoadmapFilter}
              />
            )}
          </>
        )}
      </div>
      </div>

      {/* ===== MODALS ===== */}

      {isAIModalOpen && (
        <AIAgentPlanner
          isOpen
          onClose={() => setIsAIModalOpen(false)}
          onPlanGenerated={handlePlanGenerated}
        />
      )}

      {isTaskModalOpen && (
        <TaskDetailModal
          task={selectedTask}
          taskKind={selectedTaskKind}
          columnId={targetColumnId}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}

      <ClearOverdueConfirmModal
        isOpen={Boolean(clearOverdueTarget)}
        targetCount={clearOverdueTarget?.targetCount ?? 0}
        overdueDays={OVERDUE_CLEAR_DAYS}
        scopeLabel={
          clearOverdueTarget?.columnName
            ? `cột "${clearOverdueTarget.columnName}"`
            : 'toàn bộ bảng'
        }
        isSubmitting={isClearingOverdue}
        onCancel={() => setClearOverdueTarget(null)}
        onConfirm={executeClearOverdueTasks}
      />
    </div>
  );
};

export default StudyPlannerPage;
