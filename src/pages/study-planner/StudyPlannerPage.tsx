import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Trello,
  Bot,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Radio,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { taskBoardService } from '../../services/taskBoardService';
import {
  TaskResponse,
  TaskColumnResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../../types/TaskBoard';
import CalendarView from './components/CalendarView';
import TaskBoard from './components/TaskBoard';
import AIAgentPlanner from './components/AIAgentPlanner';
import TaskDetailModal from './components/TaskDetailModal';
import ClearOverdueConfirmModal from './components/ClearOverdueConfirmModal';
import './styles/StudyPlanner.css';

const OVERDUE_CLEAR_DAYS = 30;
const FEEDBACK_HIDE_DELAY_MS = 4000;

type ClearOverdueTarget = {
  columnId?: string;
  columnName?: string;
  targetCount: number;
};

const StudyPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'calendar' | 'board'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const [columns, setColumns] = useState<TaskColumnResponse[]>([]);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [oldOverdueCount, setOldOverdueCount] = useState(0);
  const [isClearingOverdue, setIsClearingOverdue] = useState(false);
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
  const [selectedTask, setSelectedTask] = useState<TaskResponse | undefined>(
    undefined,
  );
  const [targetColumnId, setTargetColumnId] = useState<string | undefined>(
    undefined,
  );
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const boardData = await taskBoardService.getBoard();
      setColumns(boardData);

      const allTasks = boardData.flatMap((column) => column.tasks);
      setTasks(allTasks);

      const now = new Date();
      const overdueTasks = allTasks.filter(
        (task) =>
          task.deadline &&
          new Date(task.deadline) < now &&
          (task.userProgress === undefined || task.userProgress < 100),
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
          (task.userProgress === undefined || task.userProgress < 100) &&
          task.status?.toLowerCase() !== 'done',
      );
      setOldOverdueCount(oldOverdueTasks.length);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: TaskResponse) => {
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
    try {
      if (selectedTask) {
        await taskBoardService.updateTask(selectedTask.id, data as UpdateTaskRequest);
      } else {
        await taskBoardService.createTask(data as CreateTaskRequest);
      }
      await fetchData();
      setIsTaskModalOpen(false);
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
    setViewMode('board');
    setPlanFeedback({
      type: 'success',
      message:
        result && result.createdCount > 0
          ? `Đã tạo ${result.createdCount} phiên học cho ${result.subjectName}. Study plan đã được áp dụng vào bảng của bạn.`
          : 'Study plan đã được áp dụng vào bảng của bạn.',
    });
  };

  return (
    <div className="study-plan-container">
      <div className="study-plan-header-hero">
        <button
          className="study-plan-back-btn"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} /> QUAY LẠI DASHBOARD
        </button>

        <div className="study-plan-hero-content">
          <h1 className="study-plan-hero-title">
            <Radio size={40} />
            KẾ HOẠCH HỌC TẬP
          </h1>
          <div className="study-plan-hero-subtitle">
            Lập kế hoạch học tập thông minh và quản lý công việc hiệu quả với công
            cụ AI tích hợp.
          </div>

          <div className="study-plan-controls">
            <button
              className="study-plan-btn"
              onClick={() => setIsAIModalOpen(true)}
              style={{ borderColor: 'var(--sv-accent)', color: 'var(--sv-accent)' }}
            >
              <Bot size={18} /> TRỢ LÝ AI
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`study-plan-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                <Calendar size={18} /> LỊCH
              </button>
              <button
                className={`study-plan-btn ${viewMode === 'board' ? 'active' : ''}`}
                onClick={() => setViewMode('board')}
              >
                <Trello size={18} /> KANBAN
              </button>
            </div>
          </div>
        </div>
      </div>

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

      {planFeedback && (
        <div
          className={`study-plan-overdue-feedback study-plan-overdue-feedback--${planFeedback.type}`}
        >
          {planFeedback.message}
        </div>
      )}

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
            />
          )}
        </>
      )}

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
