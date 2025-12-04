import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Video, CheckCircle, XCircle, 
  User, DollarSign, FileText 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getMyBookings, approveBooking, rejectBooking, 
  startMeeting, completeBooking, downloadBookingInvoice, BookingResponse 
} from '../../services/bookingService';
import './MentorBookingManager.css';

const MentorBookingManager: React.FC = () => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'history'>('upcoming');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getMyBookings(true, 0, 100); // Fetch mentor bookings
      setBookings(response.content);
    } catch (err) {
      setError('Không thể tải danh sách booking.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveBooking(id);
      fetchBookings();
    } catch (err) {
      alert('Lỗi khi duyệt booking');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (reason) {
      try {
        await rejectBooking(id, reason);
        fetchBookings();
      } catch (err) {
        alert('Lỗi khi từ chối booking');
      }
    }
  };

  const handleStartMeeting = async (booking: BookingResponse) => {
    try {
      // If link exists, use it. If not, generate one.
      let link = booking.meetingLink;
      if (!link) {
        // Generate Jitsi link if backend didn't provide one (fallback)
        link = `https://meet.jit.si/SkillVerse-${booking.id}-${booking.mentorId}-${booking.learnerId}`;
        // Ideally call startMeeting to save this link to backend if needed, 
        // but startMeeting endpoint might generate it.
      }
      
      // Call backend to update status to IN_PROGRESS
      await startMeeting(booking.id);
      
      // Open Jitsi
      window.open(link, '_blank');
      fetchBookings();
    } catch (err) {
      alert('Lỗi khi bắt đầu buổi học');
    }
  };

  const handleComplete = async (id: number) => {
    if (confirm('Xác nhận hoàn thành buổi học?')) {
      try {
        await completeBooking(id);
        fetchBookings();
      } catch (err) {
        alert('Lỗi khi hoàn thành booking');
      }
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
    } catch (err) {
      alert('Không thể tải hóa đơn');
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'pending') return b.status === 'PENDING';
    if (activeTab === 'upcoming') return b.status === 'CONFIRMED' || b.status === 'ONGOING';
    if (activeTab === 'history') return ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status);
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    // Backend sends UTC time (e.g., "2025-12-04T17:00:00") but might miss 'Z'.
    // We append 'Z' to ensure it's treated as UTC, then convert to local (VN) time.
    const date = dateStr.endsWith('Z') ? new Date(dateStr) : new Date(dateStr + 'Z');
    return date.toLocaleString('vi-VN', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div className="mbm-loading"><div className="mbm-spinner"></div></div>;
  if (error) return <div className="mbm-error">{error}</div>;

  return (
    <div className="mbm-container">
      <div className="mbm-header">
        <h2 className="mbm-title">Quản Lý Booking</h2>
        <div className="mbm-tabs">
          <button 
            className={`mbm-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Sắp tới
          </button>
          <button 
            className={`mbm-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Chờ duyệt
            {bookings.filter(b => b.status === 'PENDING').length > 0 && (
              <span className="mbm-badge">{bookings.filter(b => b.status === 'PENDING').length}</span>
            )}
          </button>
          <button 
            className={`mbm-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Lịch sử
          </button>
        </div>
      </div>

      <div className="mbm-content">
        <AnimatePresence mode="wait">
          {filteredBookings.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mbm-empty"
            >
              <Calendar size={48} />
              <p>Không có booking nào trong danh mục này.</p>
            </motion.div>
          ) : (
            <div className="mbm-grid">
              {filteredBookings.map((booking) => (
                <motion.div 
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mbm-card"
                >
                  <div className="mbm-card-header">
                    <div className="mbm-user-info">
                      <div className="mbm-avatar">
                        {booking.learnerAvatar ? (
                          <img src={booking.learnerAvatar} alt="Learner" />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div>
                        <h3 className="mbm-learner-name">{booking.learnerName || `Learner #${booking.learnerId}`}</h3>
                        <span className={`mbm-status ${booking.status.toLowerCase()}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                    <div className="mbm-price">
                      <DollarSign size={14} />
                      {formatCurrency(booking.priceVnd)}
                    </div>
                  </div>

                  <div className="mbm-card-body">
                    <div className="mbm-info-row">
                      <Clock size={16} />
                      <span>{formatDate(booking.startTime)}</span>
                    </div>
                    <div className="mbm-info-row">
                      <Clock size={16} />
                      <span>{booking.durationMinutes} phút</span>
                    </div>
                    {booking.paymentReference && (
                      <div className="mbm-info-row">
                        <CheckCircle size={16} />
                        <span>Đã thanh toán</span>
                      </div>
                    )}
                  </div>

                  <div className="mbm-card-actions">
                    {booking.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleApprove(booking.id)} className="mbm-btn mbm-btn-approve">
                          <CheckCircle size={16} /> Duyệt
                        </button>
                        <button onClick={() => handleReject(booking.id)} className="mbm-btn mbm-btn-reject">
                          <XCircle size={16} /> Từ chối
                        </button>
                      </>
                    )}

                    {booking.status === 'CONFIRMED' && (
                      <button onClick={() => handleStartMeeting(booking)} className="mbm-btn mbm-btn-start">
                        <Video size={16} /> Vào phòng học (Jitsi)
                      </button>
                    )}

                    {/* Assuming status might change to IN_PROGRESS if backend supports it, 
                        or we just allow completing from APPROVED if started */}
                    {(booking.status === 'CONFIRMED' || booking.status === 'ONGOING') && (
                       <button onClick={() => handleComplete(booking.id)} className="mbm-btn mbm-btn-complete">
                         <CheckCircle size={16} /> Hoàn thành
                       </button>
                    )}
                    {(booking.status === 'COMPLETED' || booking.paymentReference) && (
                      <button onClick={() => handleDownloadInvoice(booking.id)} className="mbm-btn">
                        <FileText size={16} /> Tải hóa đơn
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MentorBookingManager;
