import React, { useState, useEffect } from 'react';
import { Calendar, Trello, Bot, ChevronLeft, ChevronRight, ArrowLeft, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      <div className="study-plan-header-hero">
        <button className="study-plan-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> BACK TO DASHBOARD
        </button>
        
        <div className="study-plan-hero-content">
          <h1 className="study-plan-hero-title">
            <Radio size={40} />
            MISSION CONTROL
          </h1>
          <div className="study-plan-hero-subtitle">
            SYSTEM: ONLINE // MODULE: STUDY_PLANNER // USER: ACTIVE
          </div>
          
          <div className="study-plan-controls">
            <button 
              className="study-plan-btn"
              onClick={() => setIsAIModalOpen(true)}
              style={{ borderColor: 'var(--sv-accent)', color: 'var(--sv-accent)' }}
            >
              <Bot size={18} /> AI STRATEGIST
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`study-plan-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                <Calendar size={18} /> TIMELINE
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
          <span style={{ fontSize: '1.2rem' }}>⚠️</span> 
          ALERT: {overdueCount} CRITICAL TASKS DETECTED. IMMEDIATE ACTION REQUIRED.
        </div>
      )}

      {viewMode === 'calendar' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
          <button className="study-plan-btn" onClick={() => navigateWeek('prev')} style={{ padding: '0.5rem' }}><ChevronLeft size={24} /></button>
          <h2 style={{ 
            minWidth: '300px', 
            textAlign: 'center', 
            fontFamily: 'var(--sv-font-tech)', 
            color: 'var(--sv-primary)',
            textShadow: '0 0 10px var(--sv-primary-glow)',
            fontSize: '1.5rem',
            margin: 0
          }}>
            {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
          </h2>
          <button className="study-plan-btn" onClick={() => navigateWeek('next')} style={{ padding: '0.5rem' }}><ChevronRight size={24} /></button>
        </div>
      )}

      {loading && viewMode === 'calendar' ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--sv-primary)', fontFamily: 'var(--sv-font-tech)' }}>
          INITIALIZING DATA STREAM...
        </div>
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
              onRefresh={fetchData}
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
