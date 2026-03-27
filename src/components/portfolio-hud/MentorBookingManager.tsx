import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Calendar, Clock, Video, CheckCircle, XCircle,
  User, FileText, DollarSign, TrendingUp, Users,
  CheckSquare, AlertCircle, RefreshCw, X, ChevronDown, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getMyBookings, approveBooking, rejectBooking,
  startMeeting, completeBooking, downloadBookingInvoice, BookingResponse
} from '../../services/bookingService';
import { confirmAction } from '../../context/ConfirmDialogContext';
import { onBookingSyncMessage, broadcastBookingChanged } from '../../utils/bookingSync';
import { showAppError, showAppSuccess } from '../../context/ToastContext';
import './MentorBookingManager.css';

// Recharts custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="mbm-tooltip">
        <p className="mbm-tooltip-label">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const MentorBookingManager: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'history'>('upcoming');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [now, setNow] = useState(new Date());
  const [rejectModalBooking, setRejectModalBooking] = useState<BookingResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [localMentorCompletedIds, setLocalMentorCompletedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    const unsubscribe = onBookingSyncMessage(() => {
      fetchBookings();
    });
    return () => { clearInterval(interval); unsubscribe(); };
  }, []);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [currentPage]);

  // ─── Date helpers ──────────────────────────────────────────────────────────

  const parseBookingDate = (dateStr: string): Date => {
    if (dateStr.endsWith('Z') || dateStr.includes('+07:00')) {
      return new Date(dateStr);
    }
    const [datePart, timePart] = dateStr.split('T');
    return new Date(`${datePart}T${timePart}+07:00`);
  };

  const getBookingEndTime = (booking: BookingResponse): Date => {
    const start = parseBookingDate(booking.startTime);
    return new Date(start.getTime() + (booking.durationMinutes || 60) * 60 * 1000);
  };

  const canStartMeeting = (booking: BookingResponse): boolean => {
    if (booking.status !== 'CONFIRMED') return false;
    const start = parseBookingDate(booking.startTime);
    const end = getBookingEndTime(booking);
    const diffMin = (start.getTime() - now.getTime()) / (1000 * 60);
    return diffMin <= 30 && now.getTime() <= end.getTime();
  };

  const isSessionExpired = (booking: BookingResponse): boolean => {
    if (!['CONFIRMED', 'ONGOING'].includes(booking.status)) return false;
    return now.getTime() > getBookingEndTime(booking).getTime();
  };

  const canComplete = (booking: BookingResponse): boolean => {
    if (booking.status !== 'CONFIRMED' && booking.status !== 'ONGOING') return false;
    return now.getTime() >= getBookingEndTime(booking).getTime();
  };

  // Mentor confirm when learner clicked first: PENDING_COMPLETION but mentorCompletedAt is null
  const canMentorConfirm = (booking: BookingResponse): boolean => {
    return booking.status === 'PENDING_COMPLETION' && !booking.mentorCompletedAt;
  };

  // ─── Stats computation ──────────────────────────────────────────────────────

  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const upcomingCount = bookings.filter(
    (b) => ['CONFIRMED', 'ONGOING', 'PENDING_COMPLETION', 'COMPLETED', 'DISPUTED'].includes(b.status),
  ).length;
  const historyCount = bookings.filter(
    (b) => ['COMPLETED', 'CANCELLED', 'REJECTED', 'REFUNDED'].includes(b.status),
  ).length;
  const completedThisMonth = bookings.filter(b => {
    if (b.status !== 'COMPLETED') return false;
    const d = parseBookingDate(b.startTime);
    const now2 = new Date();
    return d.getMonth() === now2.getMonth() && d.getFullYear() === now2.getFullYear();
  }).length;
  const totalEarnings = bookings
    .filter(b => b.status === 'COMPLETED' || b.status === 'PENDING_COMPLETION')
    .reduce((sum, b) => sum + (b.priceVnd || 0), 0);
  const totalEarningsThisMonth = bookings
    .filter(b => {
      if (b.status !== 'COMPLETED') return false;
      const d = parseBookingDate(b.startTime);
      const now2 = new Date();
      return d.getMonth() === now2.getMonth() && d.getFullYear() === now2.getFullYear();
    })
    .reduce((sum, b) => sum + (b.priceVnd || 0), 0);

  // ─── Chart data ─────────────────────────────────────────────────────────────

  const getMonthlyRevenueData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
      const monthRevenue = bookings
        .filter(b => {
          if (b.status !== 'COMPLETED') return false;
          const bd = parseBookingDate(b.startTime);
          return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
        })
        .reduce((sum, b) => sum + (b.priceVnd || 0) * 0.8, 0);
      months.push({ month: monthLabel, 'Thu nhập': Math.round(monthRevenue) });
    }
    return months;
  };

  const statusDistribution = [
    { name: 'Hoàn thành', value: bookings.filter(b => b.status === 'COMPLETED').length, color: '#22c55e' },
    { name: 'Đang chờ', value: bookings.filter(b => b.status === 'PENDING').length, color: '#f59e0b' },
    { name: 'Sắp tới', value: bookings.filter(b => b.status === 'CONFIRMED').length, color: '#3b82f6' },
    { name: 'Đang học', value: bookings.filter(b => b.status === 'ONGOING').length, color: '#8b5cf6' },
    { name: 'Đã hủy', value: bookings.filter(b => ['CANCELLED', 'REJECTED'].includes(b.status)).length, color: '#64748b' },
  ].filter(d => d.value > 0);

  // ─── Fetch & handlers ──────────────────────────────────────────────────────

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getMyBookings(true, currentPage, 20);
      setBookings(response.content);
      setTotalPages(response.totalPages || 1);
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
      showAppSuccess('Đã duyệt', 'Booking đã được duyệt thành công!');
      fetchBookings();
    } catch (err) {
      showAppError('Không thể duyệt booking', 'Lỗi khi duyệt booking');
    }
  };

  const handleOpenRejectModal = (booking: BookingResponse) => {
    setRejectModalBooking(booking);
    setRejectReason('');
  };

  const handleCloseRejectModal = () => {
    setRejectModalBooking(null);
    setRejectReason('');
    setRejectSubmitting(false);
  };

  const handleRejectSubmit = async () => {
    if (!rejectModalBooking) return;
    if (rejectReason.trim().length < 5) {
      showAppError('Lý do quá ngắn', 'Vui lòng nhập lý do từ chối (ít nhất 5 ký tự).');
      return;
    }
    setRejectSubmitting(true);
    try {
      await rejectBooking(rejectModalBooking.id, rejectReason.trim());
      showAppSuccess('Đã từ chối', 'Booking đã bị từ chối.');
      handleCloseRejectModal();
      fetchBookings();
    } catch (err) {
      showAppError('Không thể từ chối booking', 'Lỗi khi từ chối booking');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleStartMeeting = async (booking: BookingResponse) => {
    try {
      if (booking.meetingLink) {
        window.open(booking.meetingLink, '_blank');
        return;
      }
      const updated = await startMeeting(booking.id);
      if (updated.meetingLink) {
        window.open(updated.meetingLink, '_blank');
      } else {
        window.open(`https://meet.jit.si/SkillVerse-${booking.id}-${booking.mentorId}-${booking.learnerId}`, '_blank');
      }
      fetchBookings();
    } catch (err) {
      showAppError('Không thể bắt đầu buổi học', 'Lỗi khi bắt đầu buổi học');
    }
  };

  const handleComplete = async (id: number) => {
    if (await confirmAction('Xác nhận hoàn thành buổi học?')) {
      // Optimistically update local state immediately
      setLocalMentorCompletedIds(prev => new Set([...prev, id]));
      try {
        await completeBooking(id);
        broadcastBookingChanged(id, 'PENDING_COMPLETION');
        showAppSuccess('Đã hoàn thành', 'Buổi học đã được đánh dấu hoàn thành. Đang chờ learner xác nhận.');
      } catch (err) {
        // Revert on failure
        setLocalMentorCompletedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        showAppError('Không thể hoàn thành booking', 'Lỗi khi hoàn thành booking');
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
      showAppError('Không thể tải hóa đơn', 'Không thể tải hóa đơn');
    }
  };

  // Effective status: use local state if present, otherwise use server status
  const getEffectiveStatus = (b: BookingResponse): string => {
    if (localMentorCompletedIds.has(b.id)) return 'PENDING_COMPLETION';
    return b.status;
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'pending') return b.status === 'PENDING';
    if (activeTab === 'upcoming') return ['CONFIRMED', 'ONGOING', 'PENDING_COMPLETION', 'COMPLETED', 'DISPUTED'].includes(b.status);
    if (activeTab === 'history') return ['COMPLETED', 'CANCELLED', 'REJECTED', 'REFUNDED'].includes(b.status);
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    let date: Date;
    if (dateStr.endsWith('Z') || dateStr.includes('+07:00')) {
      date = new Date(dateStr);
    } else {
      const [datePart, timePart] = dateStr.split('T');
      date = new Date(`${datePart}T${timePart}+07:00`);
    }
    return date.toLocaleString('vi-VN', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // ─── Deadline countdown ────────────────────────────────────────────────────

  const getDeadlineInfo = (booking: BookingResponse): { text: string; urgency: 'urgent' | 'soon' | 'normal' } | null => {
    const start = parseBookingDate(booking.startTime);
    if (booking.status === 'CONFIRMED') {
      const diffMs = start.getTime() - now.getTime();
      const diffMin = diffMs / (1000 * 60);
      const diffHours = diffMin / 60;
      const diffDays = diffHours / 24;
      if (diffMin <= 30 && diffMin > 0) return { text: `Bắt đầu sau ${Math.round(diffMin)} phút`, urgency: 'urgent' };
      if (diffMin > 30 && diffHours <= 1) return { text: `Bắt đầu sau ${Math.round(diffMin)} phút`, urgency: 'soon' };
      if (diffHours <= 24 && diffHours > 0) return { text: `Bắt đầu sau ${Math.round(diffHours)} giờ`, urgency: 'soon' };
      if (diffDays > 0) return { text: `Còn ${Math.round(diffDays)} ngày`, urgency: 'normal' };
    }
    if (booking.status === 'ONGOING') {
      return { text: 'Đang diễn ra', urgency: 'urgent' };
    }
    if (booking.status === 'PENDING') {
      const now2 = new Date();
      if (start < now2) return { text: 'Đã quá giờ hẹn', urgency: 'urgent' };
      const diffHours = (start.getTime() - now2.getTime()) / (1000 * 3600);
      if (diffHours <= 2) return { text: `Hẹn trong ${Math.round(diffHours)} giờ`, urgency: 'soon' };
    }
    return null;
  };

  // ─── Status badge ──────────────────────────────────────────────────────────

  const statusConfig: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'Chờ duyệt', cls: 'pending' },
    CONFIRMED: { label: 'Đã xác nhận', cls: 'confirmed' },
    ONGOING: { label: 'Đang học', cls: 'ongoing' },
    PENDING_COMPLETION: { label: 'Chờ xác nhận', cls: 'mentor-completed' },
    COMPLETED: { label: 'Hoàn thành', cls: 'completed' },
    REJECTED: { label: 'Từ chối', cls: 'rejected' },
    CANCELLED: { label: 'Đã hủy', cls: 'cancelled' },
    DISPUTED: { label: 'Khiếu nại', cls: 'disputed' },
    REFUNDED: { label: 'Đã hoàn tiền', cls: 'refunded' },
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading && bookings.length === 0) {
    return <div className="mbm-loading"><MeowlKuruLoader size="medium" text="" /></div>;
  }
  if (error) return <div className="mbm-error">{error}</div>;

  return (
    <div className="mbm-container">
      {/* ── Header ── */}
      <div className="mbm-header">
        <div className="mbm-header-left">
          <h2 className="mbm-title">Quản Lý Booking</h2>
          <button className="mbm-refresh-btn" onClick={fetchBookings} title="Làm mới">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="mbm-tabs">
          {[
            { key: 'upcoming', label: 'Sắp tới', count: upcomingCount },
            { key: 'pending', label: 'Chờ duyệt', count: pendingCount },
            { key: 'history', label: 'Lịch sử', count: historyCount },
          ].map(t => (
            <button
              key={t.key}
              className={`mbm-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(t.key as any); setCurrentPage(0); }}
            >
              {t.label}
              {t.count > 0 && <span className="mbm-badge">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats Dashboard ── */}
      <div className="mbm-stats-row">
        <div className="mbm-stat-card mbm-stat-card--pending">
          <div className="mbm-stat-icon"><AlertCircle size={22} /></div>
          <div className="mbm-stat-info">
            <span className="mbm-stat-value">{pendingCount}</span>
            <span className="mbm-stat-label">Chờ duyệt</span>
          </div>
        </div>
        <div className="mbm-stat-card mbm-stat-card--upcoming">
          <div className="mbm-stat-icon"><Calendar size={22} /></div>
          <div className="mbm-stat-info">
            <span className="mbm-stat-value">{upcomingCount}</span>
            <span className="mbm-stat-label">Sắp tới</span>
          </div>
        </div>
        <div className="mbm-stat-card mbm-stat-card--completed">
          <div className="mbm-stat-icon"><CheckSquare size={22} /></div>
          <div className="mbm-stat-info">
            <span className="mbm-stat-value">{completedThisMonth}</span>
            <span className="mbm-stat-label">Hoàn thành tháng này</span>
          </div>
        </div>
        <div className="mbm-stat-card mbm-stat-card--earnings">
          <div className="mbm-stat-icon"><TrendingUp size={22} /></div>
          <div className="mbm-stat-info">
            <span className="mbm-stat-value">{formatCurrency(totalEarningsThisMonth * 0.8)}</span>
            <span className="mbm-stat-label">Thu nhập tháng này</span>
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="mbm-charts-grid">
        <div className="mbm-chart-card">
          <div className="mbm-chart-header">
            <TrendingUp size={18} />
            <span>Xu Hướng Thu Nhập (6 tháng)</span>
          </div>
          <div className="mbm-chart-body">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={getMonthlyRevenueData()}>
                <defs>
                  <linearGradient id="mbmIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Thu nhập" stroke="#22c55e" fill="url(#mbmIncomeGrad)" strokeWidth={2} name="Thu nhập" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mbm-chart-card">
          <div className="mbm-chart-header">
            <Users size={18} />
            <span>Phân Bổ Trạng Thái</span>
          </div>
          <div className="mbm-chart-body">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mbm-chart-legend">
              {statusDistribution.map((d, i) => (
                <div key={i} className="mbm-legend-item">
                  <span className="mbm-legend-dot" style={{ background: d.color }} />
                  <span className="mbm-legend-label">{d.name}</span>
                  <span className="mbm-legend-value">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Booking List ── */}
      <div className="mbm-content">
        <AnimatePresence mode="wait">
          {filteredBookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mbm-empty"
            >
              <Calendar size={48} />
              <p>Không có booking nào.</p>
            </motion.div>
          ) : (
            <div className="mbm-grid">
              {filteredBookings.map((booking) => {
                const deadline = getDeadlineInfo(booking);
                const sc = statusConfig[getEffectiveStatus(booking)] || { label: getEffectiveStatus(booking), cls: 'pending' };
                const expired = isSessionExpired(booking);

                return (
                  <motion.div
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`mbm-card ${getEffectiveStatus(booking) === 'ONGOING' ? 'mbm-card--ongoing' : ''} ${expired ? 'mbm-card--expired' : ''}`}
                  >
                    {/* Card Header */}
                    <div className="mbm-card-header">
                      <div className="mbm-card-header-top">
                        <div className="mbm-user-info">
                          <div className="mbm-avatar">
                            {booking.learnerAvatar ? (
                              <img src={booking.learnerAvatar} alt={booking.learnerName || ''} />
                            ) : (
                              <User size={20} />
                            )}
                          </div>
                          <div className="mbm-user-details">
                            <h3 className="mbm-learner-name">
                              {booking.learnerName || `Learner #${booking.learnerId}`}
                            </h3>
                            <span className={`mbm-status ${sc.cls}`}>{sc.label}</span>
                          </div>
                        </div>
                        <div className="mbm-price-tag">
                          <DollarSign size={14} />
                          {formatCurrency(booking.priceVnd)}
                        </div>
                      </div>

                      {/* Deadline banner */}
                      {deadline && (
                        <div className={`mbm-deadline-banner mbm-deadline--${deadline.urgency}`}>
                          <Clock size={13} />
                          {deadline.text}
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="mbm-card-body">
                      <div className="mbm-info-row">
                        <Calendar size={14} />
                        <span>{formatDate(booking.startTime)}</span>
                      </div>
                      <div className="mbm-info-row">
                        <Clock size={14} />
                        <span>{booking.durationMinutes} phút</span>
                      </div>
                      {booking.paymentReference && (
                        <div className="mbm-info-row mbm-info-row--paid">
                          <CheckCircle size={14} />
                          <span>Đã thanh toán</span>
                        </div>
                      )}
                      {booking.meetingLink && (
                        <div className="mbm-info-row mbm-info-row--meeting">
                          <Video size={14} />
                          <span>Phòng họp sẵn sàng</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="mbm-card-actions">
                      {getEffectiveStatus(booking) === 'PENDING' && (
                        <>
                          <button onClick={() => handleApprove(booking.id)} className="mbm-btn mbm-btn-approve">
                            <CheckCircle size={15} /> Duyệt
                          </button>
                          <button onClick={() => handleOpenRejectModal(booking)} className="mbm-btn mbm-btn-reject">
                            <XCircle size={15} /> Từ chối
                          </button>
                        </>
                      )}

                      {/* Vào phòng học — CHỈ hiện khi chưa quá giờ */}
                      {!expired && getEffectiveStatus(booking) === 'CONFIRMED' && canStartMeeting(booking) && (
                        <button
                          onClick={() => handleStartMeeting(booking)}
                          className="mbm-btn mbm-btn-start"
                          style={{ width: '100%' }}
                        >
                          <Video size={15} />
                          {booking.meetingLink ? 'Vào phòng học' : 'Tạo phòng họp'}
                        </button>
                      )}

                      {!expired && getEffectiveStatus(booking) === 'ONGOING' && booking.meetingLink && (
                        <button onClick={() => handleStartMeeting(booking)} className="mbm-btn mbm-btn-start" style={{ width: '100%' }}>
                          <Video size={15} /> Vào phòng học
                        </button>
                      )}

                      {/* Session ended → show complete button for both ONGOING and CONFIRMED */}
                      {canComplete(booking) && !localMentorCompletedIds.has(booking.id) && (
                        <button onClick={() => handleComplete(booking.id)} className="mbm-btn mbm-btn-complete" style={{ width: '100%' }}>
                          <CheckCircle size={15} /> Hoàn thành
                        </button>
                      )}

                      {/* Hiện trạng thái "quá giờ" cho CONFIRMED đã hết session */}
                      {expired && getEffectiveStatus(booking) === 'CONFIRMED' && (
                        <span className="mbm-status-inline mbm-status-inline--orange">
                          <AlertCircle size={14} /> Đã quá giờ — chờ hoàn thành
                        </span>
                      )}

                      {getEffectiveStatus(booking) === 'ONGOING' && (
                        <span className="mbm-status-inline">
                          <span className="mbm-live-dot" />
                          Buổi học đang diễn ra
                        </span>
                      )}

                      {getEffectiveStatus(booking) === 'PENDING_COMPLETION' && canMentorConfirm(booking) && (
                        <button onClick={() => handleComplete(booking.id)} className="mbm-btn mbm-btn-complete" style={{ width: '100%' }}>
                          <CheckCircle size={15} /> Hoàn tất
                        </button>
                      )}

                      {getEffectiveStatus(booking) === 'PENDING_COMPLETION' && !canMentorConfirm(booking) && (
                        <span className="mbm-status-inline mbm-status-inline--purple">
                          <CheckCircle size={14} /> Chờ learner xác nhận
                        </span>
                      )}

                      {getEffectiveStatus(booking) === 'DISPUTED' && (
                        <span className="mbm-status-inline mbm-status-inline--purple">
                          <AlertCircle size={14} /> Đang có tranh chấp
                        </span>
                      )}

                      {(getEffectiveStatus(booking) === 'COMPLETED' || booking.paymentReference) && (
                        <button onClick={() => handleDownloadInvoice(booking.id)} className="mbm-btn mbm-btn-invoice">
                          <FileText size={15} /> Hóa đơn
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                        className="mbm-btn mbm-btn-secondary"
                      >
                        <Eye size={15} /> Chi tiết
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mbm-pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="mbm-btn mbm-btn-secondary"
            >
              ← Trước
            </button>
            <span className="mbm-pagination-info">Trang {currentPage + 1} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="mbm-btn mbm-btn-secondary"
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {/* ── Reject Modal ── */}
      <AnimatePresence>
        {rejectModalBooking && ReactDOM.createPortal(
          <motion.div
            className="mbm-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) handleCloseRejectModal(); }}
          >
            <motion.div
              className="mbm-reject-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="mbm-reject-modal-header">
                <div className="mbm-reject-modal-title">
                  <XCircle size={22} />
                  Từ Chối Booking
                </div>
                <button className="mbm-reject-modal-close" onClick={handleCloseRejectModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="mbm-reject-modal-body">
                <p className="mbm-reject-modal-desc">
                  Bạn đang từ chối booking của <strong>{rejectModalBooking.learnerName || `Learner #${rejectModalBooking.learnerId}`}</strong> vào lúc <strong>{formatDate(rejectModalBooking.startTime)}</strong>.
                </p>

                <div className="mbm-form-group">
                  <label className="mbm-form-label">
                    Lý do từ chối <span className="mbm-form-required">*</span>
                  </label>
                  <textarea
                    className="mbm-form-textarea"
                    placeholder="Nhập lý do từ chối booking (VD: Lịch không phù hợp, lý do cá nhân, v.v.)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <div className="mbm-form-hint">{rejectReason.length}/500 ký tự</div>
                </div>

                <div className="mbm-reject-warning">
                  <AlertCircle size={16} />
                  <span>Người học sẽ nhận được thông báo và được hoàn tiền nếu đã thanh toán.</span>
                </div>
              </div>

              <div className="mbm-reject-modal-footer">
                <button className="mbm-btn mbm-btn-secondary" onClick={handleCloseRejectModal} disabled={rejectSubmitting}>
                  Hủy
                </button>
                <button
                  className="mbm-btn mbm-btn-reject"
                  onClick={handleRejectSubmit}
                  disabled={rejectSubmitting || rejectReason.trim().length < 5}
                >
                  {rejectSubmitting ? (
                    <><RefreshCw size={15} className="mbm-spin" /> Đang xử lý...</>
                  ) : (
                    <><XCircle size={15} /> Xác nhận từ chối</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorBookingManager;
