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
      'available': 'mentor-schedule-event-available',
      'booked': 'mentor-schedule-event-booked',
      'blocked': 'mentor-schedule-event-blocked'
    };
    return typeClasses[type] || 'mentor-schedule-event-available';
  };

  const weekDays = getWeekDays(currentDate);

  return (
    <div className="mentor-schedule-tab">
      <div className="mentor-schedule-tab-header">
        <h2>📅 Lịch Của Tôi</h2>
        <p>Quản lý thời gian rảnh và xem các buổi học sắp tới</p>
      </div>

      <div className="mentor-schedule-controls">
        <div className="mentor-schedule-view-controls">
          <button 
            className={`mentor-schedule-view-btn ${view === 'week' ? 'active' : ''}`}
            onClick={() => setView('week')}
          >
            Tuần
          </button>
          <button 
            className={`mentor-schedule-view-btn ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            Tháng
          </button>
        </div>

        <div className="mentor-schedule-navigation">
          <button 
            className="mentor-schedule-nav-btn" 
            onClick={() => view === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
          >
            &lt;
          </button>
          <span className="mentor-schedule-current-period">
            {view === 'week' 
              ? `${weekDays[0].getDate()}/${weekDays[0].getMonth() + 1} - ${weekDays[6].getDate()}/${weekDays[6].getMonth() + 1}, ${weekDays[6].getFullYear()}`
              : currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
            }
          </span>
          <button 
            className="mentor-schedule-nav-btn" 
            onClick={() => view === 'week' ? navigateWeek('next') : navigateMonth('next')}
          >
            &gt;
          </button>
        </div>

        <div className="mentor-schedule-action-buttons">
          <button className="mentor-schedule-action-btn mentor-schedule-add-btn" onClick={handleAddAvailability}>
            + Thêm Lịch Rảnh
          </button>
          <button className="mentor-schedule-action-btn mentor-schedule-export-btn" onClick={handleExportCalendar}>
            📥 Xuất Lịch
          </button>
        </div>
      </div>

      {view === 'week' ? (
        <div className="mentor-schedule-week-view">
          <div className="mentor-schedule-week-header">
            {weekDays.map((day, index) => (
              <div key={index} className="mentor-schedule-day-header">
                <div className="mentor-schedule-day-name">
                  {day.toLocaleDateString('vi-VN', { weekday: 'short' })}
                </div>
                <div className="mentor-schedule-day-number">
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>
          <div className="mentor-schedule-week-grid">
            {weekDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              return (
                <div key={index} className="mentor-schedule-day-column">
                  {dayEvents.length > 0 ? (
                    dayEvents.map(event => (
                      <div key={event.id} className={`mentor-schedule-event ${getEventTypeClass(event.type)}`}>
                        <div className="mentor-schedule-event-time">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </div>
                        <div className="mentor-schedule-event-title">{event.title}</div>
                        {event.topic && <div className="mentor-schedule-event-topic">{event.topic}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="mentor-schedule-empty-day">Trống</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mentor-schedule-month-view">
          <div className="mentor-schedule-month-calendar">
            <div className="mentor-schedule-month-header">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                <div key={day} className="mentor-schedule-month-day-header">{day}</div>
              ))}
            </div>
            {/* Month grid implementation would go here - simplified for prototype */}
            <div className="mentor-schedule-month-coming-soon">
              <h3>Lịch Tháng</h3>
              <p>Chế độ xem lịch tháng đầy đủ sẽ sớm ra mắt.</p>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="mentor-schedule-modal-overlay">
          <div className="mentor-schedule-modal-content">
            <div className="mentor-schedule-modal-header">
              <h3>Thêm Lịch Rảnh</h3>
              <button className="mentor-schedule-close-modal" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="mentor-schedule-modal-body">
              <div className="mentor-schedule-form-group">
                <label>Ngày</label>
                <input type="date" className="mentor-schedule-form-input" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="mentor-schedule-form-row">
                <div className="mentor-schedule-form-group">
                  <label>Từ Giờ</label>
                  <input type="time" className="mentor-schedule-form-input" defaultValue="09:00" />
                </div>
                <div className="mentor-schedule-form-group">
                  <label>Đến Giờ</label>
                  <input type="time" className="mentor-schedule-form-input" defaultValue="10:00" />
                </div>
              </div>
              <div className="mentor-schedule-form-group">
                <label>Lặp Lại</label>
                <select className="mentor-schedule-form-input">
                  <option value="none">Không lặp lại</option>
                  <option value="daily">Hàng ngày</option>
                  <option value="weekly">Hàng tuần</option>
                </select>
              </div>
              <div className="mentor-schedule-form-actions">
                <button className="mentor-schedule-cancel-btn" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button className="mentor-schedule-save-btn" onClick={() => {
                  alert('Đã thêm lịch rảnh!');
                  setShowAddModal(false);
                }}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyScheduleTab;
