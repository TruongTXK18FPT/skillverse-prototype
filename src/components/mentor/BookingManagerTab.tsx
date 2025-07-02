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
      'Pending': 'bmt-status-pending',
      'Confirmed': 'bmt-status-confirmed',
      'Completed': 'bmt-status-completed'
    };
    return statusClasses[status] || 'bmt-status-pending';
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
    <div className="bmt-booking-manager-tab">
      <div className="bmt-tab-header">
        <div className="bmt-header-content">
          <h2>📋 Quản Lý Đặt Lịch</h2>
          <p>Quản lý lịch đặt của học viên và yêu cầu buổi học với các công cụ mạnh mẽ</p>
        </div>
        <div className="bmt-header-actions">
          <button 
            className="bmt-export-btn"
            onClick={exportBookings}
            title="Xuất danh sách đặt lịch ra CSV"
          >
            📊 Xuất File
          </button>
          <div className="bmt-view-toggle">
            <button
              className={`bmt-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Xem dạng danh sách"
            >
              ☰
            </button>
            <button
              className={`bmt-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Xem dạng thẻ"
            >
              ⊞
            </button>
          </div>
        </div>
      </div>

      <div className="bmt-stats-cards">
        <div className="bmt-stat-card total">
          <div className="bmt-stat-icon">📋</div>
          <div className="bmt-stat-content">
            <div className="bmt-stat-value">{counts.total}</div>
            <div className="bmt-stat-label">Tổng Đặt Lịch</div>
          </div>
        </div>
        <div className="bmt-stat-card pending">
          <div className="bmt-stat-icon">⏳</div>
          <div className="bmt-stat-content">
            <div className="bmt-stat-value">{counts.pending}</div>
            <div className="bmt-stat-label">Chờ Duyệt</div>
          </div>
        </div>
        <div className="bmt-stat-card confirmed">
          <div className="bmt-stat-icon">✅</div>
          <div className="bmt-stat-content">
            <div className="bmt-stat-value">{counts.confirmed}</div>
            <div className="bmt-stat-label">Đã Xác Nhận</div>
          </div>
        </div>
        <div className="bmt-stat-card completed">
          <div className="bmt-stat-icon">🎉</div>
          <div className="bmt-stat-content">
            <div className="bmt-stat-value">{counts.completed}</div>
            <div className="bmt-stat-label">Đã Hoàn Thành</div>
          </div>
        </div>
      </div>

      <div className="bmt-controls">
        <div className="bmt-filter-section">
          <div className="bmt-filter-group">
            <label htmlFor="status-filter">Lọc:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bmt-filter-select"
            >
              <option value="all">Tất Cả Trạng Thái</option>
              <option value="pending">Chờ Duyệt</option>
              <option value="confirmed">Đã Xác Nhận</option>
              <option value="completed">Đã Hoàn Thành</option>
            </select>
          </div>
          
          <div className="bmt-filter-group">
            <label htmlFor="sort-select">Sắp Xếp:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bmt-filter-select"
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

        <div className="bmt-search-section">
          <div className="bmt-search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên học viên hoặc chủ đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bmt-search-input"
            />
            <span className="bmt-search-icon">🔍</span>
          </div>
        </div>

        <div className="bmt-results-info">
          <span className="bmt-results-count">
            {filteredBookings.length} kết quả
          </span>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bmt-empty-state">
          <div className="bmt-empty-icon">📋</div>
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
              className="bmt-clear-filters-btn"
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
        <div className="bmt-bookings-cards">
          {filteredBookings.map((booking, index) => {
            const { date, time } = formatDateTime(booking.bookingTime);
            const isProcessing = processingBookings.includes(booking.id);
            
            return (
              <div 
                key={booking.id} 
                className={`bmt-booking-card ${isProcessing ? 'processing' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bmt-card-header">
                  <div className="bmt-student-info">
                    <div className="bmt-student-avatar">
                      {booking.studentAvatar ? (
                        <img src={booking.studentAvatar} alt={booking.studentName} />
                      ) : (
                        <div className="bmt-avatar-placeholder">
                          {booking.studentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="bmt-student-details">
                      <h4 className="bmt-student-name">{booking.studentName}</h4>
                      <span className={`bmt-status-badge ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                  <div className="bmt-price">{formatPrice(booking.price)}</div>
                </div>

                <div className="bmt-card-content">
                  <div className="bmt-booking-details">
                    <div className="bmt-detail-item">
                      <span className="bmt-detail-icon">📅</span>
                      <span className="bmt-detail-text">{date}</span>
                    </div>
                    <div className="bmt-detail-item">
                      <span className="bmt-detail-icon">🕒</span>
                      <span className="bmt-detail-text">{time}</span>
                    </div>
                    <div className="bmt-detail-item">
                      <span className="bmt-detail-icon">📚</span>
                      <span className="bmt-detail-text">
                        {booking.topic ?? <span className="bmt-no-topic">Chưa có chủ đề</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bmt-card-actions">
                  {booking.status === 'Pending' && (
                    <>
                      <button
                        className="bmt-action-btn bmt-approve-btn"
                        onClick={() => handleBookingAction(booking.id, 'approve')}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <span className="bmt-loading">⟳</span> : '✅'} Duyệt
                      </button>
                      <button
                        className="bmt-action-btn bmt-reject-btn"
                        onClick={() => handleBookingAction(booking.id, 'reject')}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <span className="bmt-loading">⟳</span> : '❌'} Từ Chối
                      </button>
                    </>
                  )}
                  {booking.status === 'Confirmed' && (
                    <button
                      className="bmt-action-btn bmt-complete-btn"
                      onClick={() => handleBookingAction(booking.id, 'done')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <span className="bmt-loading">⟳</span> : '🎉'} Hoàn Thành
                    </button>
                  )}
                  {booking.status === 'Completed' && (
                    <span className="bmt-completed-text">✨ Buổi Học Hoàn Thành</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bmt-bookings-table-container">
          <table className="bmt-bookings-table">
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
                    className={`bmt-table-row ${isProcessing ? 'processing' : ''}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td>
                      <div className="bmt-student-info">
                        <div className="bmt-student-avatar">
                          {booking.studentAvatar ? (
                            <img src={booking.studentAvatar} alt={booking.studentName} />
                          ) : (
                            <div className="bmt-avatar-placeholder">
                              {booking.studentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="bmt-student-details">
                          <div className="bmt-student-name">{booking.studentName}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="bmt-datetime">
                        <div className="bmt-date">{date}</div>
                        <div className="bmt-time">{time}</div>
                      </div>
                    </td>
                    <td>
                      <div className="bmt-topic">
                        {booking.topic ?? <span className="bmt-no-topic">Chưa có chủ đề</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`bmt-status-badge ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <div className="bmt-price">{formatPrice(booking.price)}</div>
                    </td>
                    <td>
                      <div className="bmt-action-buttons">
                        {booking.status === 'Pending' && (
                          <>
                            <button
                              className="bmt-action-btn bmt-approve-btn"
                              onClick={() => handleBookingAction(booking.id, 'approve')}
                              disabled={isProcessing}
                              title="Duyệt Đặt Lịch"
                            >
                              {isProcessing ? <span className="bmt-loading">⟳</span> : 'Duyệt'}
                            </button>
                            <button
                              className="bmt-action-btn bmt-reject-btn"
                              onClick={() => handleBookingAction(booking.id, 'reject')}
                              disabled={isProcessing}
                              title="Từ Chối Đặt Lịch"
                            >
                              {isProcessing ? <span className="bmt-loading">⟳</span> : 'Từ Chối'}
                            </button>
                          </>
                        )}
                        {booking.status === 'Confirmed' && (
                          <button
                            className="bmt-action-btn bmt-complete-btn"
                            onClick={() => handleBookingAction(booking.id, 'done')}
                            disabled={isProcessing}
                            title="Đánh Dấu Hoàn Thành"
                          >
                            {isProcessing ? <span className="bmt-loading">⟳</span> : 'Hoàn Thành'}
                          </button>
                        )}
                        {booking.status === 'Completed' && (
                          <span className="bmt-completed-text">Buổi Học Hoàn Thành</span>
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
