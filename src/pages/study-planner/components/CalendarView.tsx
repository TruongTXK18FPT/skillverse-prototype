import React from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { TaskResponse, TaskPriority } from '../../../types/TaskBoard';
import '../styles/StudyPlanner.css';

interface CalendarViewProps {
  sessions: TaskResponse[]; // Reusing TaskResponse as sessions for now
  currentDate: Date;
  onSessionClick: (task: TaskResponse) => void;
  onDateClick?: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ sessions, currentDate, onSessionClick, onDateClick }) => {
  // Generate week days based on currentDate
  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getTasksForDay = (date: Date) => {
    const targetDateStr = date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const dayTasks = sessions.filter(task => {
      // If task has startDate, use it
      if (task.startDate) {
        const taskDate = new Date(task.startDate);
        return taskDate.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) === targetDateStr;
      }
      // Fallback: If task only has deadline, show it on the deadline day
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        return deadlineDate.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) === targetDateStr;
      }
      return false;
    });

    // Sort by start time
    return dayTasks.sort((a, b) => {
      const timeA = a.startDate ? new Date(a.startDate).getTime() : (a.deadline ? new Date(a.deadline).getTime() : 0);
      const timeB = b.startDate ? new Date(b.startDate).getTime() : (b.deadline ? new Date(b.deadline).getTime() : 0);
      return timeA - timeB;
    });
  };

  // Calculate layout for overlapping events
  const calculateEventLayout = (tasks: TaskResponse[]) => {
    const layout: { [key: string]: { width: string, left: string } } = {};
    
    // Simple overlap detection: 
    // If tasks overlap in time, they share width.
    // This is a simplified version. For full calendar logic, we'd need a more complex algorithm.
    // Here we just check if a task overlaps with the previous one.
    
    const groups: TaskResponse[][] = [];
    let currentGroup: TaskResponse[] = [];
    
    tasks.forEach((task, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(task);
      } else {
        const lastTask = currentGroup[currentGroup.length - 1];
        const lastEnd = getTaskEndTime(lastTask);
        const currentStart = getTaskStartTime(task);
        
        if (currentStart < lastEnd) {
          currentGroup.push(task);
        } else {
          groups.push([...currentGroup]);
          currentGroup = [task];
        }
      }
    });
    if (currentGroup.length > 0) groups.push(currentGroup);
    
    groups.forEach(group => {
      const width = 100 / group.length;
      group.forEach((task, index) => {
        layout[task.id] = {
          width: `${width}%`,
          left: `${index * width}%`
        };
      });
    });
    
    return layout;
  };

  const getTaskStartTime = (task: TaskResponse) => {
    if (task.startDate) return new Date(task.startDate).getTime();
    if (task.deadline) return new Date(task.deadline).getTime() - 60 * 60 * 1000;
    return 0;
  };

  const getTaskEndTime = (task: TaskResponse) => {
    if (task.endDate) return new Date(task.endDate).getTime();
    if (task.deadline) return new Date(task.deadline).getTime();
    if (task.startDate) return new Date(task.startDate).getTime() + 60 * 60 * 1000; // Default 1h
    return 0;
  };

  const getTaskStyle = (task: TaskResponse, layoutStyle?: { width: string, left: string }) => {
    let start, end;

    if (task.startDate && task.endDate) {
      start = new Date(task.startDate);
      end = new Date(task.endDate);
    } else if (task.deadline) {
      // Fallback for deadline-only tasks: Show as 1-hour block ending at deadline
      end = new Date(task.deadline);
      start = new Date(end.getTime() - 60 * 60 * 1000); // 1 hour before
    } else {
      return {};
    }
    
    const getVietnamTime = (d: Date) => {
      const timeStr = d.toLocaleTimeString('en-GB', { 
        timeZone: 'Asia/Ho_Chi_Minh', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const [h, m] = timeStr.split(':').map(Number);
      return { h, m };
    };

    const startTime = getVietnamTime(start);
    const endTime = getVietnamTime(end);
    
    // Each hour is 60px in CSS (.study-plan-time-slot height)
    const top = (startTime.h * 60 + startTime.m); 
    let duration = (endTime.h * 60 + endTime.m) - (startTime.h * 60 + startTime.m);
    
    if (duration < 0) {
       duration += 24 * 60;
    }
    
    return {
      top: `${top}px`,
      minHeight: '40px',
      height: `${duration}px`,
      '--event-color': getPriorityColor(task.priority),
      width: layoutStyle?.width || '96%',
      left: layoutStyle?.left || '2%',
    } as React.CSSProperties;
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH: return 'rgba(255, 77, 77, 0.8)';
      case TaskPriority.MEDIUM: return 'rgba(255, 170, 0, 0.8)';
      case TaskPriority.LOW: return 'rgba(0, 255, 157, 0.8)';
      default: return 'rgba(0, 240, 255, 0.8)';
    }
  };

  return (
    <div className="study-plan-calendar-wrapper">
      <div className="study-plan-calendar-header-row">
        <div className="study-plan-calendar-col-header">TIME</div>
        {weekDays.map(day => {
          const isToday = new Date().toDateString() === day.toDateString();
          return (
            <div key={day.toISOString()} className={`study-plan-calendar-col-header ${isToday ? 'today' : ''}`}>
              <div style={{ fontWeight: 'bold' }}>{day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{day.getDate()}/{day.getMonth() + 1}</div>
            </div>
          );
        })}
      </div>

      <div className="study-plan-calendar-body">
        <div className="study-plan-time-grid">
          <div className="study-plan-time-labels-col">
            {hours.map(hour => (
              <div key={hour} className="study-plan-time-label">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          
          {weekDays.map(day => {
            const isToday = new Date().toDateString() === day.toDateString();
            return (
              <div 
                key={day.toISOString()} 
                className={`study-plan-day-col ${isToday ? 'today' : ''}`}
                onClick={() => onDateClick && onDateClick(day)}
              >
                {hours.map(hour => (
                  <div key={hour} className="study-plan-time-slot" />
                ))}
                
                {(() => {
                  const dayTasks = getTasksForDay(day);
                  const layout = calculateEventLayout(dayTasks);
                  
                  return dayTasks.map(task => (
                    <div
                      key={task.id}
                      className="study-plan-event-item"
                      style={getTaskStyle(task, layout[task.id])}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionClick(task);
                      }}
                      title={`${task.title}`}
                    >
                      <div className="event-title">
                        {task.title}
                      </div>
                      <div className="event-time">
                        {task.startDate ? new Date(task.startDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
