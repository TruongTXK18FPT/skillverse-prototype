import React, { useState } from 'react';
import { Booking } from '../../pages/main/MentorPage';
import './BookingManagerTab.css';

interface BookingManagerTabProps {
  bookings: Booking[];
  onApprove: (bookingId: string) => void;
  onReject: (bookingId: string) => void;
  onMarkAsDone: (bookingId: string) => void;
}

const BookingManagerTab: React.FC<BookingManagerTabProps> = ({
  bookings,
  onApprove,
  onReject,
  onMarkAsDone
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'date-desc' | 'student' | 'student-desc' | 'price' | 'price-desc'>('date');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [processingBookings, setProcessingBookings] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  const filteredBookings = bookings
    .filter(booking => 
      statusFilter === 'all' || booking.status.toLowerCase() === statusFilter
    )
    .filter(booking =>
      booking.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.topic?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'student':
          return a.studentName.localeCompare(b.studentName);
        case 'student-desc':
          return b.studentName.localeCompare(a.studentName);
        case 'price':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'date-desc':
          return new Date(b.bookingTime).getTime() - new Date(a.bookingTime).getTime();
        case 'date':
        default:
          return new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime();
      }
    });

  const handleBookingAction = (bookingId: string, action: 'approve' | 'reject' | 'done') => {
    setProcessingBookings(prev => [...prev, bookingId]);
    
    // Simulate processing delay for better UX
    setTimeout(() => {
      switch (action) {
        case 'approve':
          onApprove(bookingId);
          break;
        case 'reject':
          onReject(bookingId);
          break;
        case 'done':
          onMarkAsDone(bookingId);
          break;
      }
      setProcessingBookings(prev => prev.filter(id => id !== bookingId));
    }, 800);
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('vi-VN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Miễn Phí';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusBadge = (status: Booking['status']) => {
    const statusClasses = {
      'Pending': 'mentor-booking-status-pending',
      'Confirmed': 'mentor-booking-status-confirmed',
      'Completed': 'mentor-booking-status-completed'
    };
    return statusClasses[status] || 'mentor-booking-status-pending';
  };

  const getStatusCounts = () => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'Pending').length,
      confirmed: bookings.filter(b => b.status === 'Confirmed').length,
      completed: bookings.filter(b => b.status === 'Completed').length
    };
  };

  const counts = getStatusCounts();

  const exportBookings = () => {
    const csvContent = filteredBookings.map(booking => 
      `${booking.studentName},${booking.bookingTime},${booking.topic ?? 'Không có chủ đề'},${booking.status},${booking.price}`
    ).join('\n');
    
    const header = 'Tên Học Viên,Ngày & Giờ,Chủ Đề,Trạng Thái,Giá\n';
    const csv = header + csvContent;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'danh-sach-dat-lich.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="mentor-booking-manager-tab">
      <div className="mentor-booking-tab-header">
        <div className="mentor-booking-header-content">
          <h2>📋 Quản Lý Đặt Lịch</h2>
          <p>Quản lý lịch đặt của học viên và yêu cầu buổi học với các công cụ mạnh mẽ</p>
        </div>
        <div className="mentor-booking-header-actions">
          <button 
            className="mentor-booking-export-btn"
            onClick={exportBookings}
            title="Xuất danh sách đặt lịch ra CSV"
          >
            📊 Xuất File
          </button>
          <div className="mentor-booking-view-toggle">
            <button
              className={`mentor-booking-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Xem dạng danh sách"
            >
              ☰
            </button>
            <button
              className={`mentor-booking-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Xem dạng thẻ"
            >
              ⊞
            </button>
          </div>
        </div>
      </div>

      <div className="mentor-booking-stats-cards">
        <div className="mentor-booking-stat-card total">
          <div className="mentor-booking-stat-icon">📋</div>
          <div className="mentor-booking-stat-content">
            <div className="mentor-booking-stat-value">{counts.total}</div>
            <div className="mentor-booking-stat-label">Tổng Đặt Lịch</div>
          </div>
        </div>
        <div className="mentor-booking-stat-card pending">
          <div className="mentor-booking-stat-icon">⏳</div>
          <div className="mentor-booking-stat-content">
            <div className="mentor-booking-stat-value">{counts.pending}</div>
            <div className="mentor-booking-stat-label">Chờ Duyệt</div>
          </div>
        </div>
        <div className="mentor-booking-stat-card confirmed">
          <div className="mentor-booking-stat-icon">✅</div>
          <div className="mentor-booking-stat-content">
            <div className="mentor-booking-stat-value">{counts.confirmed}</div>
            <div className="mentor-booking-stat-label">Đã Xác Nhận</div>
          </div>
        </div>
        <div className="mentor-booking-stat-card completed">
          <div className="mentor-booking-stat-icon">🎉</div>
          <div className="mentor-booking-stat-content">
            <div className="mentor-booking-stat-value">{counts.completed}</div>
            <div className="mentor-booking-stat-label">Đã Hoàn Thành</div>
          </div>
        </div>
      </div>

      <div className="mentor-booking-controls">
        <div className="mentor-booking-filter-section">
          <div className="mentor-booking-filter-group">
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mentor-booking-filter-select"
            >
              <option value="all">Tất Cả Trạng Thái</option>
              <option value="pending">Chờ Duyệt</option>
              <option value="confirmed">Đã Xác Nhận</option>
              <option value="completed">Đã Hoàn Thành</option>
            </select>
          </div>
          
          <div className="mentor-booking-filter-group">
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="mentor-booking-filter-select"
            >
              <option value="date">Ngày (Cũ nhất trước)</option>
              <option value="date-desc">Ngày (Mới nhất trước)</option>
              <option value="student">Học Viên A-Z</option>
              <option value="student-desc">Học Viên Z-A</option>
              <option value="price">Giá (Thấp đến Cao)</option>
              <option value="price-desc">Giá (Cao đến Thấp)</option>
            </select>
          </div>
        </div>

        <div className="mentor-booking-search-section">
          <div className="mentor-booking-search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên học viên hoặc chủ đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mentor-booking-search-input"
            />
            <span className="mentor-booking-search-icon">🔍</span>
          </div>
        </div>

        <div className="mentor-booking-results-info">
          <span className="mentor-booking-results-count">
            {filteredBookings.length} kết quả
          </span>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="mentor-booking-empty-state">
          <div className="mentor-booking-empty-icon">📋</div>
          <h3>Không tìm thấy đặt lịch nào</h3>
          <p>
            {statusFilter === 'all' 
              ? "Bạn chưa có đặt lịch nào. Học viên sẽ hiển thị ở đây khi họ đặt lịch học với bạn."
              : `Không tìm thấy đặt lịch với trạng thái "${statusFilter}".`
            }
            {searchTerm && ` Thử điều chỉnh từ khóa tìm kiếm "${searchTerm}".`}
          </p>
          {(statusFilter !== 'all' || searchTerm) && (
            <button 
              className="mentor-booking-clear-filters-btn"
              onClick={() => {
                setStatusFilter('all');
                setSearchTerm('');
              }}
            >
              Xóa Bộ Lọc
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="mentor-booking-bookings-cards">
          {filteredBookings.map((booking, index) => {
            const { date, time } = formatDateTime(booking.bookingTime);
            const isProcessing = processingBookings.includes(booking.id);
            
            return (
              <div 
                key={booking.id} 
                className={`mentor-booking-card ${isProcessing ? 'processing' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mentor-booking-card-header">
                  <div className="mentor-booking-student-info">
                    <div className="mentor-booking-student-avatar">
                      {booking.studentAvatar ? (
                        <img src={booking.studentAvatar} alt={booking.studentName} />
                      ) : (
                        <div className="mentor-booking-avatar-placeholder">
                          {booking.studentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="mentor-booking-student-details">
                      <h4 className="mentor-booking-student-name">{booking.studentName}</h4>
                      <span className={`mentor-booking-status-badge ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                  <div className="mentor-booking-price">{formatPrice(booking.price)}</div>
                </div>

                <div className="mentor-booking-card-content">
                  <div className="mentor-booking-details">
                    <div className="mentor-booking-detail-item">
                      <span className="mentor-booking-detail-icon">📅</span>
                      <span className="mentor-booking-detail-text">{date}</span>
                    </div>
                    <div className="mentor-booking-detail-item">
                      <span className="mentor-booking-detail-icon">🕒</span>
                      <span className="mentor-booking-detail-text">{time}</span>
                    </div>
                    <div className="mentor-booking-detail-item">
                      <span className="mentor-booking-detail-icon">📚</span>
                      <span className="mentor-booking-detail-text">
                        {booking.topic ?? <span className="mentor-booking-no-topic">Chưa có chủ đề</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mentor-booking-card-actions">
                  {booking.status === 'Pending' && (
                    <>
                      <button
                        className="mentor-booking-action-btn mentor-booking-approve-btn"
                        onClick={() => handleBookingAction(booking.id, 'approve')}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <span className="mentor-booking-loading">⟳</span> : '✅'} Duyệt
                      </button>
                      <button
                        className="mentor-booking-action-btn mentor-booking-reject-btn"
                        onClick={() => handleBookingAction(booking.id, 'reject')}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <span className="mentor-booking-loading">⟳</span> : '❌'} Từ Chối
                      </button>
                    </>
                  )}
                  {booking.status === 'Confirmed' && (
                    <button
                      className="mentor-booking-action-btn mentor-booking-complete-btn"
                      onClick={() => handleBookingAction(booking.id, 'done')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <span className="mentor-booking-loading">⟳</span> : '🎉'} Hoàn Thành
                    </button>
                  )}
                  {booking.status === 'Completed' && (
                    <span className="mentor-booking-completed-text">✨ Buổi Học Hoàn Thành</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mentor-booking-bookings-table-container">
          <table className="mentor-booking-bookings-table">
            <thead>
              <tr>
                <th>Học Viên</th>
                <th>Ngày & Giờ</th>
                <th>Chủ Đề</th>
                <th>Trạng Thái</th>
                <th>Giá</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking, index) => {
                const { date, time } = formatDateTime(booking.bookingTime);
                const isProcessing = processingBookings.includes(booking.id);
                
                return (
                  <tr 
                    key={booking.id}
                    className={`mentor-booking-table-row ${isProcessing ? 'processing' : ''}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td>
                      <div className="mentor-booking-student-info">
                        <div className="mentor-booking-student-avatar">
                          {booking.studentAvatar ? (
                            <img src={booking.studentAvatar} alt={booking.studentName} />
                          ) : (
                            <div className="mentor-booking-avatar-placeholder">
                              {booking.studentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="mentor-booking-student-details">
                          <div className="mentor-booking-student-name">{booking.studentName}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="mentor-booking-datetime">
                        <div className="mentor-booking-date">{date}</div>
                        <div className="mentor-booking-time">{time}</div>
                      </div>
                    </td>
                    <td>
                      <div className="mentor-booking-topic">
                        {booking.topic ?? <span className="mentor-booking-no-topic">Chưa có chủ đề</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`mentor-booking-status-badge ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <div className="mentor-booking-price">{formatPrice(booking.price)}</div>
                    </td>
                    <td>
                      <div className="mentor-booking-action-buttons">
                        {booking.status === 'Pending' && (
                          <>
                            <button
                              className="mentor-booking-action-btn mentor-booking-approve-btn"
                              onClick={() => handleBookingAction(booking.id, 'approve')}
                              disabled={isProcessing}
                              title="Duyệt Đặt Lịch"
                            >
                              {isProcessing ? <span className="mentor-booking-loading">⟳</span> : 'Duyệt'}
                            </button>
                            <button
                              className="mentor-booking-action-btn mentor-booking-reject-btn"
                              onClick={() => handleBookingAction(booking.id, 'reject')}
                              disabled={isProcessing}
                              title="Từ Chối Đặt Lịch"
                            >
                              {isProcessing ? <span className="mentor-booking-loading">⟳</span> : 'Từ Chối'}
                            </button>
                          </>
                        )}
                        {booking.status === 'Confirmed' && (
                          <button
                            className="mentor-booking-action-btn mentor-booking-complete-btn"
                            onClick={() => handleBookingAction(booking.id, 'done')}
                            disabled={isProcessing}
                            title="Đánh Dấu Hoàn Thành"
                          >
                            {isProcessing ? <span className="mentor-booking-loading">⟳</span> : 'Hoàn Thành'}
                          </button>
                        )}
                        {booking.status === 'Completed' && (
                          <span className="mentor-booking-completed-text">Buổi Học Hoàn Thành</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BookingManagerTab;
