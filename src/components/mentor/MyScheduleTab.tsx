import React, { useState } from 'react';
import { ScheduleEvent } from '../../pages/main/MentorPage';
import './MyScheduleTab.css';

const MyScheduleTab: React.FC = () => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock schedule data
  const [events] = useState<ScheduleEvent[]>([
    {
      id: '1',
      title: 'Rảnh',
      date: '2025-07-03',
      startTime: '09:00',
      endTime: '10:00',
      type: 'available'
    },
    {
      id: '2',
      title: 'Buổi học React với Nguyễn Văn An',
      date: '2025-07-03',
      startTime: '14:00',
      endTime: '15:00',
      type: 'booked',
      studentName: 'Nguyễn Văn An',
      topic: 'Thực Hành Tốt Nhất React'
    },
    {
      id: '3',
      title: 'Rảnh',
      date: '2025-07-04',
      startTime: '10:00',
      endTime: '11:00',
      type: 'available'
    },
    {
      id: '4',
      title: 'Tư vấn nghề nghiệp với Trần Thị Bình',
      date: '2025-07-04',
      startTime: '10:00',
      endTime: '11:00',
      type: 'booked',
      studentName: 'Trần Thị Bình',
      topic: 'Hướng Dẫn Nghề Nghiệp'
    }
  ]);

  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    start.setDate(diff);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const handleAddAvailability = () => {
    setShowAddModal(true);
  };

  const handleExportCalendar = () => {
    alert('Chức năng xuất lịch sẽ được triển khai ở đây');
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getEventTypeClass = (type: ScheduleEvent['type']) => {
    const typeClasses = {
      'available': 'mst-event-available',
      'booked': 'mst-event-booked',
      'blocked': 'mst-event-blocked'
    };
    return typeClasses[type] || 'mst-event-available';
  };

  const weekDays = getWeekDays(currentDate);

  return (
    <div className="mst-schedule-tab">
      <div className="mst-tab-header">
        <h2>📆 Lịch Trình Của Tôi</h2>
        <p>Quản lý thời gian rảnh và xem các buổi học sắp tới</p>
      </div>

      <div className="mst-schedule-controls">
        <div className="mst-view-controls">
          <button
            className={`mst-view-btn ${view === 'week' ? 'active' : ''}`}
            onClick={() => setView('week')}
          >
            Xem Tuần
          </button>
          <button
            className={`mst-view-btn ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            Xem Tháng
          </button>
        </div>

        <div className="mst-navigation">
          <button
            className="mst-nav-btn"
            onClick={() => view === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
          >
            ‹
          </button>
          <span className="mst-current-period">
            {view === 'week' 
              ? `${weekDays[0].toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
            }
          </span>
          <button
            className="mst-nav-btn"
            onClick={() => view === 'week' ? navigateWeek('next') : navigateMonth('next')}
          >
            ›
          </button>
        </div>

        <div className="mst-action-buttons">
          <button className="mst-action-btn mst-add-btn" onClick={handleAddAvailability}>
            Thêm Thời Gian Rảnh
          </button>
          <button className="mst-action-btn mst-export-btn" onClick={handleExportCalendar}>
            Xuất Lịch
          </button>
        </div>
      </div>

      {view === 'week' && (
        <div className="mst-week-view">
          <div className="mst-week-header">
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="mst-day-header">
                <div className="mst-day-name">
                  {day.toLocaleDateString('vi-VN', { weekday: 'short' })}
                </div>
                <div className="mst-day-number">
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mst-week-grid">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDate(day);
              return (
                <div key={day.toISOString()} className="mst-day-column">
                  {dayEvents.length === 0 ? (
                    <div className="mst-empty-day">
                      <span>Không có sự kiện</span>
                    </div>
                  ) : (
                    dayEvents.map(event => (
                      <div
                        key={event.id}
                        className={`mst-event ${getEventTypeClass(event.type)}`}
                        title={event.type === 'booked' ? `${event.studentName} - ${event.topic}` : event.title}
                      >
                        <div className="mst-event-time">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </div>
                        <div className="mst-event-title">
                          {event.type === 'booked' ? event.studentName : 'Rảnh'}
                        </div>
                        {event.topic && (
                          <div className="mst-event-topic">{event.topic}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'month' && (
        <div className="mst-month-view">
          <div className="mst-month-calendar">
            <div className="mst-month-header">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                <div key={day} className="mst-month-day-header">{day}</div>
              ))}
            </div>
            <div className="mst-month-grid">
              {/* Simplified month view - would need more complex logic for full calendar */}
              <div className="mst-month-coming-soon">
                <h3>Xem Tháng</h3>
                <p>Chế độ xem lịch tháng đầy đủ sẽ được triển khai ở đây với tính toán ngày phù hợp</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Availability Modal */}
      {showAddModal && (
        <div className="mst-modal-overlay">
          <div className="mst-modal-content">
            <div className="mst-modal-header">
              <h3>Thêm Thời Gian Rảnh</h3>
              <button className="mst-close-modal" onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>
            <div className="mst-modal-body">
              <div className="mst-form-group">
                <label htmlFor="availability-date">Ngày</label>
                <input type="date" id="availability-date" className="mst-form-input" />
              </div>
              <div className="mst-form-row">
                <div className="mst-form-group">
                  <label htmlFor="start-time">Giờ Bắt Đầu</label>
                  <input type="time" id="start-time" className="mst-form-input" />
                </div>
                <div className="mst-form-group">
                  <label htmlFor="end-time">Giờ Kết Thúc</label>
                  <input type="time" id="end-time" className="mst-form-input" />
                </div>
              </div>
              <div className="mst-form-actions">
                <button className="mst-action-btn mst-cancel-btn" onClick={() => setShowAddModal(false)}>
                  Hủy
                </button>
                <button className="mst-action-btn mst-save-btn">
                  Thêm Thời Gian Rảnh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyScheduleTab;
