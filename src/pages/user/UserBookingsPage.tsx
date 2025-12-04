import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, MessageSquare, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, downloadBookingInvoice, cancelBooking, BookingResponse } from '../../services/bookingService';
import { createReview, getReviewByBookingId, ReviewResponse } from '../../services/reviewService';
import '../../styles/UserBookings.css';

const UserBookingsPage = () => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReview, setExistingReview] = useState<ReviewResponse | null>(null);

  const openReviewModal = async (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setRating(5);
    setComment('');
    setExistingReview(null);
    setIsReviewModalOpen(true);

    // Check if review exists
    try {
      const review = await getReviewByBookingId(bookingId);
      if (review) {
        setExistingReview(review);
        setRating(review.rating);
        setComment(review.comment);
      }
    } catch (error) {
      // No review found, that's fine
    }
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setSelectedBookingId(null);
    setExistingReview(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedBookingId) return;
    if (existingReview) {
      closeReviewModal();
      return;
    }
    try {
      setSubmittingReview(true);
      await createReview({
        bookingId: selectedBookingId,
        rating,
        comment
      });
      alert('Đánh giá của bạn đã được gửi thành công!');
      closeReviewModal();
    } catch (error) {
      console.error('Failed to submit review', error);
      alert('Gửi đánh giá thất bại. Vui lòng thử lại.');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getMyBookings(false); // false = learner view
      setBookings(data.content);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (id: number) => {
    try {
      const blob = await downloadBookingInvoice(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Không thể tải hóa đơn');
    }
  };

  const isMeetingActive = (booking: BookingResponse) => {
    if (booking.status === 'ONGOING') return true;
    if (booking.status !== 'CONFIRMED') return false;
    
    const start = new Date(booking.startTime);
    const end = new Date(start.getTime() + booking.durationMinutes * 60000);
    return currentTime >= start && currentTime <= end;
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?')) {
      try {
        await cancelBooking(id);
        fetchBookings(); // Refresh list
      } catch (error) {
        alert('Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return '#22c55e';
      case 'PENDING': return '#eab308';
      case 'CANCELLED': return '#ef4444';
      case 'COMPLETED': return '#3b82f6';
      case 'REJECTED': return '#ef4444';
      case 'ONGOING': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'PENDING': return 'Chờ xác nhận';
      case 'CANCELLED': return 'Đã hủy';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'REJECTED': return 'Bị từ chối';
      case 'ONGOING': return 'Đang diễn ra';
      default: return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    // Ensure dateString is treated as UTC if it doesn't have timezone info
    const date = dateString.endsWith('Z') ? new Date(dateString) : new Date(dateString + 'Z');
    return {
      date: date.toLocaleDateString('vi-VN'),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="usbk-container">
      <div className="usbk-header">
        <h1 className="usbk-title">Quản Lý Lịch Hẹn</h1>
        <p className="usbk-subtitle">Theo dõi và quản lý các buổi mentorship của bạn</p>
      </div>

      <div className="usbk-content">
        {loading ? (
          <div className="usbk-loading">
            <div className="usbk-spinner"></div>
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="usbk-empty">
            <Calendar size={48} />
            <p>Bạn chưa có lịch hẹn nào.</p>
            <button onClick={() => navigate('/mentorship')} className="usbk-btn-primary">
              Đặt lịch ngay
            </button>
          </div>
        ) : (
          <div className="usbk-grid">
            {bookings.map((booking) => {
              const { date, time } = formatDateTime(booking.startTime);
              return (
                <div key={booking.id} className="usbk-card">
                  <div className="usbk-card-header">
                    <div className="usbk-mentor-info">
                      <img 
                        src={booking.mentorAvatar || 'https://via.placeholder.com/150'} 
                        alt={booking.mentorName || 'Mentor'} 
                        className="usbk-avatar" 
                      />
                      <div>
                        <h3 className="usbk-mentor-name">{booking.mentorName || 'Mentor'}</h3>
                        <span className="usbk-price">{booking.priceVnd?.toLocaleString('vi-VN')} VND</span>
                      </div>
                    </div>
                    <div className="usbk-status" style={{ color: getStatusColor(booking.status), borderColor: getStatusColor(booking.status) }}>
                      {getStatusText(booking.status)}
                    </div>
                  </div>

                  <div className="usbk-card-body">
                    <div className="usbk-info-row">
                      <Calendar size={16} />
                      <span>{date}</span>
                    </div>
                    <div className="usbk-info-row">
                      <Clock size={16} />
                      <span>{time} ({booking.durationMinutes} phút)</span>
                    </div>
                    {booking.meetingLink && isMeetingActive(booking) && (
                      <div className="usbk-meeting-link">
                        <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer">
                          Tham gia cuộc họp
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="usbk-card-footer">
                    <button className="usbk-btn-secondary" onClick={() => navigate('/messages', { state: { openChatWith: booking.mentorId } })}>
                      <MessageSquare size={16} />
                      Nhắn tin
                    </button>
                    {booking.status === 'COMPLETED' && (
                      <button className="usbk-btn-primary" onClick={() => openReviewModal(booking.id)} style={{ backgroundColor: '#eab308', borderColor: '#eab308' }}>
                        <Star size={16} />
                        Đánh giá
                      </button>
                    )}
                    {booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? (
                      <button className="usbk-btn-danger" onClick={() => handleCancel(booking.id)}>Hủy lịch</button>
                    ) : (
                      <button className="usbk-btn-primary" onClick={() => navigate('/mentorship')}>Đặt lại</button>
                    )}
                    {(booking.status === 'COMPLETED' || booking.paymentReference) && (
                      <button className="usbk-btn-secondary" onClick={() => handleDownloadInvoice(booking.id)}>
                        Tải hóa đơn
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="usbk-modal-overlay">
          <div className="usbk-modal">
            <div className="usbk-modal-header">
              <h2>{existingReview ? 'Đánh giá của bạn' : 'Đánh giá Mentor'}</h2>
              <button className="usbk-close-btn" onClick={closeReviewModal}><XCircle size={24} /></button>
            </div>
            <div className="usbk-modal-body">
              <div className="usbk-rating-select">
                <label>Mức độ hài lòng:</label>
                <div className="usbk-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={32} 
                      fill={star <= rating ? "#eab308" : "none"} 
                      color={star <= rating ? "#eab308" : "#94a3b8"}
                      onClick={() => !existingReview && setRating(star)}
                      style={{ cursor: existingReview ? 'default' : 'pointer' }}
                    />
                  ))}
                </div>
              </div>
              <div className="usbk-comment-input">
                <label>Nhận xét của bạn:</label>
                <textarea 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)} 
                  placeholder="Chia sẻ trải nghiệm của bạn về buổi mentorship..."
                  rows={4}
                  disabled={!!existingReview}
                />
              </div>
              {existingReview && existingReview.reply && (
                <div className="usbk-comment-input" style={{ marginTop: '15px' }}>
                  <label style={{ color: '#00f0ff' }}>Phản hồi từ Mentor:</label>
                  <div style={{ 
                    background: 'rgba(0, 240, 255, 0.1)', 
                    padding: '10px', 
                    borderRadius: '8px',
                    color: '#e0f7ff',
                    fontSize: '0.9rem'
                  }}>
                    {existingReview.reply}
                  </div>
                </div>
              )}
            </div>
            <div className="usbk-modal-footer">
              <button className="usbk-btn-secondary" onClick={closeReviewModal}>Đóng</button>
              {!existingReview && (
                <button className="usbk-btn-primary" onClick={handleSubmitReview} disabled={submittingReview}>
                  {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBookingsPage;
