import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Repeat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { addAvailability, getAvailability, deleteAvailability, Availability } from '../../services/availabilityService';
import { getMyBookings, BookingResponse } from '../../services/bookingService';
import './MentorScheduleManager.css';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'available' | 'booked';
  data?: any;
}

const MentorScheduleManager: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [recurrenceEnd, setRecurrenceEnd] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, currentDate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Calculate week range
      const startOfWeek = getStartOfWeek(currentDate);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      const [availabilities, bookingsPage] = await Promise.all([
        getAvailability(user.id, startOfWeek.toISOString(), endOfWeek.toISOString()),
        getMyBookings(true, 0, 100) // Fetch bookings to overlay
      ]);

      const calendarEvents: CalendarEvent[] = [];

      // Map Availability
      availabilities.forEach(a => {
        // Ensure time is treated as UTC
        const startStr = a.startTime.endsWith('Z') ? a.startTime : a.startTime + 'Z';
        const endStr = a.endTime.endsWith('Z') ? a.endTime : a.endTime + 'Z';
        
        calendarEvents.push({
          id: `avail-${a.id}`,
          title: 'Rảnh',
          start: new Date(startStr),
          end: new Date(endStr),
          type: 'available',
          data: a
        });
      });

      // Map Bookings
      bookingsPage.content.forEach(b => {
        if (b.status !== 'CANCELLED' && b.status !== 'REJECTED') {
          // Ensure time is treated as UTC
          const startStr = b.startTime.endsWith('Z') ? b.startTime : b.startTime + 'Z';
          const endStr = b.endTime.endsWith('Z') ? b.endTime : b.endTime + 'Z';

          calendarEvents.push({
            id: `book-${b.id}`,
            title: `Booked: ${b.learnerName || 'Learner'}`,
            start: new Date(startStr),
            end: new Date(endStr),
            type: 'booked',
            data: b
          });
        }
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!user) return;
    try {
      const startDateTime = new Date(`${selectedDate}T${startTime}`);
      const endDateTime = new Date(`${selectedDate}T${endTime}`);
      
      let recurrenceEndDateStr = undefined;
      if (isRecurring && recurrenceEnd) {
        recurrenceEndDateStr = new Date(recurrenceEnd).toISOString();
      }

      await addAvailability({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : 'NONE',
        recurrenceEndDate: recurrenceEndDateStr
      });

      setShowAddModal(false);
      fetchData();
      alert('Đã thêm lịch thành công!');
    } catch (error) {
      console.error('Failed to add availability:', error);
      alert('Lỗi khi thêm lịch.');
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('avail-')) {
      if (confirm('Bạn có chắc muốn xóa lịch rảnh này?')) {
        try {
          const availId = parseInt(id.split('-')[1]);
          await deleteAvailability(availId);
          fetchData();
        } catch (error) {
          alert('Lỗi khi xóa lịch.');
        }
      }
    }
  };

  // Helper functions
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const weekDays = [];
  const startOfWeek = getStartOfWeek(currentDate);
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push(d);
  }

  const hours = Array.from({ length: 24 }, (_, i) => i); // 0:00 to 23:00

  const getEventsForDay = (date: Date) => {
    return events.filter(e => 
      e.start.getDate() === date.getDate() && 
      e.start.getMonth() === date.getMonth() &&
      e.start.getFullYear() === date.getFullYear()
    );
  };

  const getEventStyle = (event: CalendarEvent) => {
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    const duration = endHour - startHour;
    const top = startHour * 60; // 60px per hour
    const height = duration * 60;
    
    return {
      top: `${top}px`,
      height: `${height}px`
    };
  };

  return (
    <div className="msm-container">
      <div className="msm-header">
        <div className="msm-title">
          <CalendarIcon className="w-6 h-6" />
          <span>Quản Lý Lịch Trình</span>
        </div>
        <div className="msm-controls">
          <div className="msm-nav">
            <button className="msm-nav-btn" onClick={() => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() - 7);
              setCurrentDate(d);
            }}>
              <ChevronLeft size={20} />
            </button>
            <span className="msm-current-date">
              {startOfWeek.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </span>
            <button className="msm-nav-btn" onClick={() => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() + 7);
              setCurrentDate(d);
            }}>
              <ChevronRight size={20} />
            </button>
          </div>
          <button className="msm-btn msm-btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Thêm Lịch Rảnh
          </button>
        </div>
      </div>

      <div className="msm-grid">
        <div className="msm-grid-header">
          <div className="msm-day-header"></div> {/* Time column header */}
          {weekDays.map((day, i) => (
            <div key={i} className={`msm-day-header ${day.toDateString() === new Date().toDateString() ? 'today' : ''}`}>
              <div className="msm-day-name">{day.toLocaleDateString('vi-VN', { weekday: 'short' })}</div>
              <div className="msm-day-number">{day.getDate()}</div>
            </div>
          ))}
        </div>
        
        <div className="msm-grid-body">
          {/* Time Column */}
          <div className="msm-time-column">
            {hours.map(h => (
              <div key={h} className="msm-time-slot">
                {h}:00
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {weekDays.map((day, i) => (
            <div key={i} className="msm-day-column">
              {/* Grid lines */}
              {hours.map(h => (
                <div key={h} className="msm-day-slot" onClick={() => {
                  setSelectedDate(day.toISOString().split('T')[0]);
                  setStartTime(`${h.toString().padStart(2, '0')}:00`);
                  setEndTime(`${(h+1).toString().padStart(2, '0')}:00`);
                  setShowAddModal(true);
                }}></div>
              ))}

              {/* Events */}
              {getEventsForDay(day).map(event => (
                <div
                  key={event.id}
                  className={`msm-event ${event.type === 'available' ? 'msm-event-available' : 'msm-event-booked'}`}
                  style={getEventStyle(event)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (event.type === 'available') {
                      handleDelete(event.id);
                    }
                  }}
                  title={event.title}
                >
                  <div className="msm-event-time">
                    {event.start.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - 
                    {event.end.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="msm-event-title">{event.title}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div className="msm-modal-overlay">
          <div className="msm-modal">
            <div className="msm-modal-header">
              <h3>Thêm Lịch Rảnh</h3>
              <button className="msm-modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="msm-modal-body">
              <div className="msm-form-group">
                <label>Ngày bắt đầu</label>
                <input 
                  type="date" 
                  className="msm-form-input" 
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="msm-form-row">
                <div className="msm-form-group">
                  <label>Từ giờ</label>
                  <input 
                    type="time" 
                    className="msm-form-input" 
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>
                <div className="msm-form-group">
                  <label>Đến giờ</label>
                  <input 
                    type="time" 
                    className="msm-form-input" 
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <p className="msm-help-text" style={{ marginTop: '-10px', marginBottom: '16px', color: '#22d3ee' }}>
                * Người học sẽ đặt lịch theo khung 1 tiếng. Bạn có thể tạo khung giờ dài (VD: 13:00 - 17:00) để họ chọn giờ phù hợp.
              </p>

              <div className="msm-form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isRecurring}
                    onChange={e => setIsRecurring(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Lặp lại lịch này</span>
                </label>
              </div>

              {isRecurring && (
                <div className="msm-recurrence-box">
                  <div className="msm-form-group">
                    <label>Tần suất lặp</label>
                    <select 
                      className="msm-form-select"
                      value={recurrenceType}
                      onChange={e => setRecurrenceType(e.target.value as any)}
                    >
                      <option value="DAILY">Hàng ngày (Cả tuần)</option>
                      <option value="WEEKLY">Hàng tuần (Vào thứ này)</option>
                      <option value="MONTHLY">Hàng tháng (Vào ngày này)</option>
                    </select>
                  </div>
                  <div className="msm-form-group">
                    <label>Kết thúc lặp vào ngày</label>
                    <input 
                      type="date" 
                      className="msm-form-input"
                      value={recurrenceEnd}
                      onChange={e => setRecurrenceEnd(e.target.value)}
                    />
                    <p className="msm-help-text">Nếu để trống, sẽ mặc định lặp trong 3 tháng.</p>
                  </div>
                </div>
              )}

            </div>
            <div className="msm-modal-footer">
              <button className="msm-btn msm-btn-secondary" onClick={() => setShowAddModal(false)}>Hủy</button>
              <button className="msm-btn msm-btn-primary" onClick={handleAdd}>Lưu Lịch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorScheduleManager;
