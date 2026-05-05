import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Repeat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { confirmAction } from '../../context/ConfirmDialogContext';
import { showAppError, showAppSuccess } from '../../context/ToastContext';
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

  // Part 10b: Get today's date string for min date validation
  const todayStr = new Date().toISOString().split('T')[0];
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [recurrenceEnd, setRecurrenceEnd] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, currentDate]);

  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal]);

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
        // Backend returns LocalDateTime without timezone (e.g. "2026-03-26T09:00:00").
        // Treat these as VN wall-clock time — append +07:00 so JavaScript displays correctly.
        const startStr = a.startTime.endsWith('Z') || a.startTime.includes('+07:00')
          ? a.startTime
          : a.startTime + '+07:00';
        const endStr = a.endTime.endsWith('Z') || a.endTime.includes('+07:00')
          ? a.endTime
          : a.endTime + '+07:00';

        calendarEvents.push({
          id: `avail-${a.id}`,
          title: 'Rảnh',
          start: new Date(startStr),
          end: new Date(endStr),
          type: 'available',
          data: a
        });
      });

      // Map Bookings — exclude ROADMAP_MENTORING since it has no fixed time slot
      // and its sentinel endTime (2099-12-31) would render a huge block on the calendar
      bookingsPage.content.forEach(b => {
        if (b.status !== 'CANCELLED' && b.status !== 'REJECTED' && b.bookingType !== 'ROADMAP_MENTORING') {
          // Treat as VN wall-clock time — append +07:00 so JS displays correctly in VN
          const startStr = b.startTime.endsWith('Z') || b.startTime.includes('+07:00')
            ? b.startTime
            : b.startTime + '+07:00';
          const endStr = b.endTime.endsWith('Z') || b.endTime.includes('+07:00')
            ? b.endTime
            : b.endTime + '+07:00';

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
      // Parse date/time as local timezone (not UTC) to avoid timezone offset issues
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const [year, month, day] = selectedDate.split('-').map(Number);

      const startDateTime = new Date(year, month - 1, day, startHour, startMin);
      const endDateTime = new Date(year, month - 1, day, endHour, endMin);

      // Part 10b: Validate endTime > startTime
      if (endDateTime <= startDateTime) {
        showAppError('Khoảng thời gian không hợp lệ', 'Thời gian kết thúc phải sau thời gian bắt đầu.');
        return;
      }

      // Part 10b: Validate duration >= 1 hour
      const durationMs = endDateTime.getTime() - startDateTime.getTime();
      if (durationMs < 60 * 60 * 1000) {
        showAppError('Khoảng thời gian không hợp lệ', 'Khung giờ phải kéo dài ít nhất 1 tiếng.');
        return;
      }

      // Part 10b: Validate not in the past — compare by local time components
      // to avoid UTC offset causing false "in the past" errors
      const now = new Date();
      const nowYear = now.getFullYear();
      const nowMonth = now.getMonth();
      const nowDate = now.getDate();
      const nowHour = now.getHours();

      const startYear = startDateTime.getFullYear();
      const startMonth = startDateTime.getMonth();
      const startD = startDateTime.getDate();
      const startH = startDateTime.getHours();

      const isPast =
        startYear < nowYear ||
        (startYear === nowYear && startMonth < nowMonth) ||
        (startYear === nowYear && startMonth === nowMonth && startD < nowDate) ||
        (startYear === nowYear && startMonth === nowMonth && startD === nowDate && startH <= nowHour);

      if (isPast) {
        showAppError('Khoảng thời gian không hợp lệ', 'Không thể tạo lịch trong quá khứ.');
        return;
      }

      // Convert local datetime → Vietnam time (+07:00) string for the backend.
      // The date object is in local browser time. We format its local components
      // as a VN-local wall-clock time with an explicit +07:00 offset.
      // This way the backend (Jackson, Asia/Ho_Chi_Minh) parses it correctly
      // regardless of the browser's own timezone.
      const toLocalISO = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        // Use local getters (browser's local time = the user's selected time)
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000+07:00`;
      };

      let recurrenceEndDateStr = undefined;
      if (isRecurring && recurrenceEnd) {
        const reDate = new Date(recurrenceEnd);
        recurrenceEndDateStr = toLocalISO(reDate);
      }

      await addAvailability({
        startTime: toLocalISO(startDateTime),
        endTime: toLocalISO(endDateTime),
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : 'NONE',
        recurrenceEndDate: recurrenceEndDateStr
      });

      setShowAddModal(false);
      fetchData();
      showAppSuccess('Đã thêm lịch', 'Đã thêm lịch thành công!');
    } catch (error) {
      console.error('Failed to add availability:', error);
      showAppError('Không thể thêm lịch', 'Lỗi khi thêm lịch.');
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('avail-')) {
      if (await confirmAction('Bạn có chắc muốn xóa lịch rảnh này?')) {
        try {
          const availId = parseInt(id.split('-')[1]);
          await deleteAvailability(availId);
          fetchData();
        } catch (error) {
          showAppError('Không thể xóa lịch', 'Lỗi khi xóa lịch.');
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
          {weekDays.map((day, i) => {
            const isPastDay = day.toDateString() < new Date().toDateString();
            return (
            <div key={i} className={`msm-day-header ${day.toDateString() === new Date().toDateString() ? 'today' : ''} ${isPastDay ? 'past-day' : ''}`}>
              <div className="msm-day-name">{day.toLocaleDateString('vi-VN', { weekday: 'short' })}</div>
              <div className="msm-day-number">{day.getDate()}</div>
            </div>
          );})}
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
          {weekDays.map((day, i) => {
            // Compute once per render to avoid stale Date() calls
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
            const isPastDay = dayStart < todayStart;
            const isToday = dayStart === todayStart;
            const currentHour = now.getHours();

            return (
            <div key={i} className={`msm-day-column ${isPastDay ? 'past-day-column' : ''}`}>
              {/* Grid lines */}
              {hours.map(h => {
                const isPastSlot = isPastDay || (isToday && h <= currentHour);
                return (
                <div
                  key={h}
                  className={`msm-day-slot ${isPastSlot ? 'past-slot' : ''}`}
                  onClick={() => {
                    if (isPastSlot) {
                      showAppError('Không thể đặt lịch', 'Không thể đặt lịch trong quá khứ.');
                      return;
                    }
                    // Check if this slot already has an availability event
                    const slotEvents = getEventsForDay(day).filter(e => {
                      const evStartHour = e.start.getHours() + e.start.getMinutes() / 60;
                      const evEndHour = e.end.getHours() + e.end.getMinutes() / 60;
                      return h >= evStartHour && h < evEndHour && e.type === 'available';
                    });
                    if (slotEvents.length > 0) {
                      showAppError('Lịch đã tồn tại', 'Khung giờ này đã có lịch rảnh. Vui lòng chọn khung giờ khác.');
                      return;
                    }
                    setSelectedDate(`${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`);
                    setStartTime(`${h.toString().padStart(2, '0')}:00`);
                    setEndTime(`${(h+1).toString().padStart(2, '0')}:00`);
                    setShowAddModal(true);
                  }}
                >
                  {isPastSlot && (
                    <div className="msm-slot-overlay">
                      <div className="msm-slot-overlay-x">✕</div>
                    </div>
                  )}
                </div>
                );
              })}

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
          );
        })}
        </div>
      </div>

      {showAddModal && ReactDOM.createPortal(
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
                  min={todayStr}
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default MentorScheduleManager;



