import React, { useState, useEffect } from 'react';
import { Calendar, Trello, Bot, ChevronLeft, ChevronRight } from 'lucide-react';
import { studyPlanService } from '../../services/studyPlanService';
import { taskBoardService } from '../../services/taskBoardService';
import { StudySessionResponse, StudySessionStatus } from '../../types/StudyPlan';
import { TaskResponse, TaskColumnResponse, CreateTaskRequest, UpdateTaskRequest } from '../../types/TaskBoard';
import CalendarView from './components/CalendarView';
import TaskBoard from './components/TaskBoard';
import AIAgentPlanner from './components/AIAgentPlanner';
import TaskDetailModal from './components/TaskDetailModal';
import './styles/StudyPlanner.css';

const StudyPlannerPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'calendar' | 'board'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [columns, setColumns] = useState<TaskColumnResponse[]>([]);
  const [tasks, setTasks] = useState<TaskResponse[]>([]); // Flattened tasks for Calendar
  const [overdueCount, setOverdueCount] = useState(0);

  // Modal State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | undefined>(undefined);
  const [targetColumnId, setTargetColumnId] = useState<string | undefined>(undefined);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    // Hide footer on mount
    const footer = document.querySelector('footer');
    if (footer) footer.style.display = 'none';
    return () => {
      // Show footer on unmount
      if (footer) footer.style.display = '';
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Board Data (Source of Truth)
      const boardData = await taskBoardService.getBoard();
      setColumns(boardData);
      
      // Flatten tasks for Calendar
      const allTasks = boardData.flatMap(col => col.tasks);
      setTasks(allTasks);

      // Check for overdue tasks
      const now = new Date();
      const overdue = allTasks.filter(t => 
        t.deadline && 
        new Date(t.deadline) < now && 
        (t.userProgress === undefined || t.userProgress < 100)
      ).length;
      setOverdueCount(overdue);
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

  const handleDateClick = (date: Date) => {
    const defaultColumn = columns[0];
    if (defaultColumn) {
      setSelectedTask(undefined);
      setTargetColumnId(defaultColumn.id);
      // Ideally pass date to modal, but for now just open it.
      // We can use a context or modify modal to accept initialDate if needed.
      // For this iteration, user just wants "direct selection", opening modal is step 1.
      // To be perfect, we should set a temporary "newTaskDefaults" state.
      setIsTaskModalOpen(true);
    }
  };

  const handleSaveTask = async (data: CreateTaskRequest | UpdateTaskRequest) => {
    try {
      if (selectedTask) {
        await taskBoardService.updateTask(selectedTask.id, data as UpdateTaskRequest);
      } else {
        await taskBoardService.createTask(data as CreateTaskRequest);
      }
      fetchData();
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskBoardService.deleteTask(taskId);
      fetchData();
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  // Map Tasks to Sessions for CalendarView
  const calendarSessions: TaskResponse[] = tasks;

  return (
    <div className="study-plan-container">
      <div className="study-plan-header">
        <div className="study-plan-title">
          <Calendar size={32} />
          Lập Kế Hoạch Học Tập
        </div>
        
        <div className="study-plan-controls">
          <button 
            className="study-plan-btn study-plan-ai-btn"
            onClick={() => setIsAIModalOpen(true)}
          >
            <Bot size={18} /> Trợ Lý AI
          </button>
          <div className="study-plan-view-toggle">
            <button 
              className={`study-plan-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <Calendar size={18} /> Lịch
            </button>
            <button 
              className={`study-plan-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
            >
              <Trello size={18} /> Bảng
            </button>
          </div>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="study-plan-alert">
          ⚠️ Cảnh báo: Có {overdueCount} nhiệm vụ quá hạn hoặc chưa hoàn thành. Cần hành động ngay.
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="study-plan-month-nav" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button className="study-plan-btn" onClick={() => navigateWeek('prev')}><ChevronLeft size={20} /></button>
          <h2 style={{ minWidth: '200px', textAlign: 'center' }}>
            {currentDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}
          </h2>
          <button className="study-plan-btn" onClick={() => navigateWeek('next')}><ChevronRight size={20} /></button>
        </div>
      )}

      {loading && viewMode === 'calendar' ? (
        <div className="study-plan-loading">Đang tải dữ liệu...</div>
      ) : (
        <>
          {viewMode === 'calendar' ? (
            <CalendarView 
              sessions={calendarSessions} 
              currentDate={currentDate}
              onSessionClick={(task) => handleTaskClick(task)}
              onDateClick={handleDateClick}
            />
          ) : (
            <TaskBoard 
              columns={columns}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
              onColumnsChange={setColumns}
            />
          )}
        </>
      )}

      {isAIModalOpen && (
        <AIAgentPlanner 
          isOpen={true}
          onClose={() => setIsAIModalOpen(false)}
          onPlanGenerated={() => {
            fetchData();
            setViewMode('board');
          }}
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
    </div>
  );
};

export default StudyPlannerPage;
