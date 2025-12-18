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
    return sessions.filter(task => {
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
  };

  const getTaskStyle = (task: TaskResponse) => {
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
    
    const top = (startTime.h * 60 + startTime.m); 
    let duration = (endTime.h * 60 + endTime.m) - (startTime.h * 60 + startTime.m);
    
    if (duration < 0) {
       duration += 24 * 60;
    }
    
    return {
      top: `${top}px`,
      height: `${Math.max(duration, 30)}px`, // Min height 30px
      backgroundColor: getPriorityColor(task.priority),
    };
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
                
                {getTasksForDay(day).map(task => (
                  <div
                    key={task.id}
                    className="study-plan-event-item"
                    style={getTaskStyle(task)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSessionClick(task);
                    }}
                    title={`${task.title}`}
                  >
                    <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                      {task.startDate ? new Date(task.startDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
