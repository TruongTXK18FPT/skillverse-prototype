import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ThumbsUp,
  Wallet,
  MessageSquare,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BookingResponse } from '../../services/bookingService';
import {
  AdminBookingDashboardResponse,
  getAdminBookingDashboard,
  getAdminBookingDetail,
  getAdminBookings,
} from '../../services/adminBookingService';
import {
  BookingDispute,
  BookingDisputeEvidence,
  getAdminBookingDisputeDetail,
  getAdminBookingDisputeEvidence,
  resolveBookingDispute,
  reviewAdminBookingDisputeEvidence,
  EvidenceReviewDecision,
  EvidenceReviewStatus,
} from '../../services/bookingDisputeService';
import { getReviewByBookingId } from '../../services/reviewService';
import { ReviewResponse } from '../../services/reviewService';
import { showAppError, showAppSuccess } from '../../context/ToastContext';
import './AdminBookingManagementTab.css';

type DisputeResolution =
  | 'FULL_REFUND'
  | 'FULL_RELEASE'
  | 'PARTIAL_REFUND'
  | 'PARTIAL_RELEASE';

const STATUS_OPTIONS = [
  'TẤT CẢ',
  'PENDING',
  'CONFIRMED',
  'ONGOING',
  'MENTOR_COMPLETED',
  'COMPLETED',
  'DISPUTED',
  'REFUNDED',
  'CANCELLED',
  'REJECTED',
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#22d3ee',
  ONGOING: '#8b5cf6',
  MENTOR_COMPLETED: '#c084fc',
  COMPLETED: '#22c55e',
  DISPUTED: '#f97316',
  REFUNDED: '#94a3b8',
  CANCELLED: '#ef4444',
  REJECTED: '#ef4444',
  OPEN: '#fb923c',
  UNDER_INVESTIGATION: '#f59e0b',
  AWAITING_RESPONSE: '#60a5fa',
  RESOLVED: '#22c55e',
  DISMISSED: '#ef4444',
  ESCALATED: '#a78bfa',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  ONGOING: 'Đang diễn ra',
  MENTOR_COMPLETED: 'Mentor hoàn thành',
  COMPLETED: 'Hoàn thành',
  DISPUTED: 'Tranh chấp',
  REFUNDED: 'Đã hoàn tiền',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Bị từ chối',
  OPEN: 'Mới mở',
  UNDER_INVESTIGATION: 'Đang điều tra',
  AWAITING_RESPONSE: 'Chờ phản hồi',
  RESOLVED: 'Đã giải quyết',
  DISMISSED: 'Đã bác bỏ',
  ESCALATED: 'Đã escalated',
};

const RESOLUTION_LABEL: Record<DisputeResolution, string> = {
  FULL_REFUND: 'Hoàn toàn bộ cho học viên',
  FULL_RELEASE: 'Giải phóng toàn bộ cho mentor',
  PARTIAL_REFUND: 'Hoàn một phần cho học viên',
  PARTIAL_RELEASE: 'Giải phóng một phần cho mentor',
};

const EVIDENCE_REVIEW_LABEL: Record<EvidenceReviewStatus, string> = {
  PENDING: 'Chờ duyệt',
  UNDER_REVIEW: 'Đang điều tra',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
};

const EVIDENCE_REVIEW_COLOR: Record<EvidenceReviewStatus, string> = {
  PENDING: '#94a3b8',
  UNDER_REVIEW: '#f59e0b',
  ACCEPTED: '#22c55e',
  REJECTED: '#ef4444',
};

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

const parseBookingDate = (dateString: string): Date =>
  dateString.endsWith('Z') || dateString.includes('+07:00')
    ? new Date(dateString)
    : new Date(`${dateString}+07:00`);

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return parseBookingDate(dateString).toLocaleString('vi-VN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateString; }
};

const safeDateTime = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '—';
  try { return formatDateTime(dateStr); } catch { return '—'; }
};

const REVIEW_TAG_META: Record<string, { label: string; color: string; bg: string }> = {
  CONTENT_QUALITY: { label: 'Chất lượng nội dung', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  PUNCTUALITY:      { label: 'Đúng giờ',              color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  COMMUNICATION:    { label: 'Giao tiếp tốt',         color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  PREPARATION:      { label: 'Chuẩn bị kỹ',           color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  FRIENDLY:         { label: 'Thân thiện',             color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  KNOWLEDGEABLE:    { label: 'Chuyên môn cao',         color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
};

const parseReviewComment = (comment?: string | null): { tags: string[]; message: string } => {
  const src = (comment || '').trim();
  const match = src.match(/^\[([A-Z_,]+)\]\s*(.*)$/s);
  if (!match) return { tags: [], message: src };
  const tags = match[1].split(',').map(t => t.trim()).filter(t => !!t && REVIEW_TAG_META[t]);
  return { tags, message: match[2].trim() };
};

const AdminBookingManagementTab: React.FC = () => {
  const [dashboard, setDashboard] = useState<AdminBookingDashboardResponse | null>(null);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<BookingDispute | null>(null);
  const [evidence, setEvidence] = useState<BookingDisputeEvidence[]>([]);
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [status, setStatus] = useState('TẤT CẢ');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [resolution, setResolution] = useState<DisputeResolution>('FULL_REFUND');
  const [partialAmount, setPartialAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [reviewingEvidenceId, setReviewingEvidenceId] = useState<number | null>(null);

  useEffect(() => { void loadDashboardAndBookings(); }, [status, fromDate, toDate, page]);

  useEffect(() => {
    if (!selectedBooking && bookings.length > 0) {
      void handleSelectBooking(bookings[0].id);
    }
  }, [bookings, selectedBooking]);

  useEffect(() => {
    if (selectedBooking) { void loadReview(selectedBooking.id); }
  }, [selectedBooking]);

  const filteredBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return bookings;
    return bookings.filter((booking) =>
      [booking.id, booking.mentorName, booking.learnerName, booking.paymentReference, booking.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [bookings, search]);

  const finance = useMemo(() => {
    if (!selectedBooking) return null;
    const price = selectedBooking.priceVnd || 0;
    if (selectedDispute?.resolution) {
      return {
        userSpend: selectedDispute.releasedAmount || 0,
        refund: selectedDispute.refundAmount || 0,
        mentorPay: selectedDispute.mentorPayoutAmount || 0,
        adminFee: selectedDispute.adminCommissionAmount || 0,
        escrow: 0,
      };
    }
    if (selectedBooking.status === 'COMPLETED') {
      return { userSpend: price, refund: 0, mentorPay: price * 0.8, adminFee: price * 0.2, escrow: 0 };
    }
    if (['REFUNDED', 'REJECTED', 'CANCELLED'].includes(selectedBooking.status)) {
      return { userSpend: 0, refund: price, mentorPay: 0, adminFee: 0, escrow: 0 };
    }
    return { userSpend: 0, refund: 0, mentorPay: 0, adminFee: 0, escrow: price };
  }, [selectedBooking, selectedDispute]);

  const loadDashboardAndBookings = async () => {
    setLoading(true);
    try {
      const [dashboardData, bookingPage] = await Promise.all([
        getAdminBookingDashboard(fromDate || undefined, toDate || undefined),
        getAdminBookings({
          status: status === 'TẤT CẢ' ? undefined : status,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          page,
          size: 5,
        }),
      ]);
      setDashboard(dashboardData);
      setBookings(bookingPage.content || []);
      setTotalPages(bookingPage.totalPages || 1);
      if (selectedBooking && !bookingPage.content.some((item) => item.id === selectedBooking.id)) {
        setSelectedBooking(null);
        setSelectedDispute(null);
        setEvidence([]);
        setReview(null);
      }
    } catch (err: any) {
      showAppError('Không thể tải dashboard booking', err?.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBooking = async (bookingId: number) => {
    setDetailLoading(true);
    try {
      const detail = await getAdminBookingDetail(bookingId);
      setSelectedBooking(detail);
      if (detail.disputeId) {
        const dispute = await getAdminBookingDisputeDetail(detail.disputeId);
        setSelectedDispute(dispute);
        setEvidence(await getAdminBookingDisputeEvidence(detail.disputeId));
      } else {
        setSelectedDispute(null);
        setEvidence([]);
      }
      setNotes('');
      setPartialAmount('');
      setResolution('FULL_REFUND');
    } catch (err: any) {
      showAppError('Không thể tải chi tiết booking', err?.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setDetailLoading(false);
    }
  };

  const loadReview = async (bookingId: number) => {
    setReviewLoading(true);
    try {
      const r = await getReviewByBookingId(bookingId);
      setReview(r);
    } catch {
      setReview(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const resolveDisputeNow = async () => {
    if (!selectedDispute || !selectedBooking) return;
    if (['PARTIAL_REFUND', 'PARTIAL_RELEASE'].includes(resolution) && (!partialAmount || Number(partialAmount) <= 0)) {
      showAppError('Thiếu số tiền', 'Nhập số tiền một phần hợp lệ trước khi giải quyết.');
      return;
    }
    setResolving(true);
    try {
      await resolveBookingDispute(selectedDispute.id, resolution, notes || undefined, partialAmount ? Number(partialAmount) : undefined);
      showAppSuccess('Đã giải quyết dispute', 'Quyết định của admin đã được áp dụng.');
      await Promise.all([loadDashboardAndBookings(), handleSelectBooking(selectedBooking.id)]);
    } catch (err: any) {
      showAppError('Không thể giải quyết dispute', err?.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setResolving(false);
    }
  };

  const isImageEvidence = (item: BookingDisputeEvidence) => {
    const source = `${item.fileUrl || ''} ${item.fileName || ''}`.trim();
    if (!source) return false;
    return item.evidenceType === 'IMAGE' || item.evidenceType === 'SCREENSHOT' || IMAGE_EXT_RE.test(source);
  };

  const handleReviewEvidence = async (evidenceId: number, decision: EvidenceReviewDecision) => {
    if (!selectedDispute || !selectedBooking) return;
    setReviewingEvidenceId(evidenceId);
    try {
      await reviewAdminBookingDisputeEvidence(selectedDispute.id, evidenceId, decision, notes || undefined);
      const successMap: Record<EvidenceReviewDecision, string> = {
        MARK_UNDER_REVIEW: 'Đã chuyển bằng chứng sang trạng thái điều tra.',
        ACCEPT_EVIDENCE_REFUND_USER: 'Đã chấp nhận bằng chứng và hoàn toàn bộ cho học viên.',
        REJECT_EVIDENCE_RELEASE_MENTOR: 'Đã từ chối bằng chứng và giải phóng tiền cho mentor.',
      };
      showAppSuccess('Đã cập nhật bằng chứng', successMap[decision]);
      await Promise.all([loadDashboardAndBookings(), handleSelectBooking(selectedBooking.id)]);
    } catch (err: any) {
      showAppError('Không thể duyệt bằng chứng', err?.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setReviewingEvidenceId(null);
    }
  };

  const ratingLabel = (r: number) => {
    if (r >= 5) return 'Tuyệt vời';
    if (r >= 4) return 'Rất hài lòng';
    if (r >= 3) return 'Hài lòng';
    if (r >= 2) return 'Không hài lòng';
    return 'Rất không hài lòng';
  };

  const ratingColor = (r: number) => {
    if (r >= 5) return '#22c55e';
    if (r >= 4) return '#34d399';
    if (r >= 3) return '#fbbf24';
    if (r >= 2) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="abm-container">
      {/* ── Header ── */}
      <div className="abm-header">
        <div className="abm-header-left">
          <div className="abm-kicker">ADMIN BOOKING COMMAND</div>
          <h2>Quản lý Booking toàn hệ thống</h2>
        </div>
        <button className="abm-refresh" onClick={() => void loadDashboardAndBookings()}>
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="abm-filterbar">
        <div className="abm-filter">
          <Filter size={15} />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}>
            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="abm-filter">
          <CalendarRange size={15} />
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(0); }} placeholder="Từ ngày" />
        </div>
        <div className="abm-filter">
          <CalendarRange size={15} />
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(0); }} placeholder="Đến ngày" />
        </div>
        <div className="abm-search">
          <Search size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm ID, mentor, học viên..." />
        </div>
      </div>

      {/* ── Stats Row ── */}
      {!loading && dashboard && (
        <div className="abm-stats">
          <div className="abm-stat-card abm-stat--total">
            <div className="abm-stat-icon"><CalendarRange size={18} /></div>
            <div className="abm-stat-body">
              <div className="abm-stat-value">{dashboard.totalBookings || 0}</div>
              <div className="abm-stat-label">Tổng Booking</div>
            </div>
          </div>
          <div className="abm-stat-card abm-stat--pending">
            <div className="abm-stat-icon"><Clock3 size={18} /></div>
            <div className="abm-stat-body">
              <div className="abm-stat-value">{dashboard.pendingBookings || 0}</div>
              <div className="abm-stat-label">Chờ xác nhận</div>
            </div>
          </div>
          <div className="abm-stat-card abm-stat--active">
            <div className="abm-stat-icon"><CheckCircle2 size={18} /></div>
            <div className="abm-stat-body">
              <div className="abm-stat-value">{dashboard.activeBookings || 0}</div>
              <div className="abm-stat-label">Đang hoạt động</div>
            </div>
          </div>
          <div className="abm-stat-card abm-stat--disputed">
            <div className="abm-stat-icon"><AlertTriangle size={18} /></div>
            <div className="abm-stat-body">
              <div className="abm-stat-value">{dashboard.disputedBookings || 0}</div>
              <div className="abm-stat-label">Tranh chấp</div>
            </div>
          </div>
          <div className="abm-stat-card abm-stat--gross">
            <div className="abm-stat-icon"><Wallet size={18} /></div>
            <div className="abm-stat-body">
              <div className="abm-stat-value">{formatCurrency(dashboard.grossBookingValueVnd)}</div>
              <div className="abm-stat-label">Tổng giá trị Booking</div>
            </div>
          </div>
          <div className="abm-stat-card abm-stat--learner">
            <div className="abm-stat-icon"><ThumbsUp size={18} /></div>
            <div className="abm-stat-body">
              <div className="abm-stat-value">{formatCurrency(dashboard.learnerNetSpendVnd)}</div>
              <div className="abm-stat-label">Học viên chi trả</div>
            </div>
          </div>
          <div className="abm-stat-card abm-stat--mentor">
            <div className="abm-stat-icon"><ShieldAlert size={18} /></div>
            <div className="abm-stat-body">
              <div className="abm-stat-value">{formatCurrency(dashboard.mentorPayoutVnd)}</div>
              <div className="abm-stat-label">Mentor nhận được</div>
            </div>
          </div>
          <div className="abm-stat-card abm-stat--admin">
            <div className="abm-stat-icon"><Wallet size={18} /></div>
            <div className="abm-stat-body">
              <div className="abm-stat-value">{formatCurrency(dashboard.adminCommissionVnd)}</div>
              <div className="abm-stat-label">Phí hệ thống</div>
            </div>
          </div>
          <div className="abm-stat-card abm-stat--refund">
            <div className="abm-stat-icon"><AlertTriangle size={18} /></div>
            <div className="abm-stat-body">
              <div className="abm-stat-value">{formatCurrency(dashboard.learnerRefundedVnd)}</div>
              <div className="abm-stat-label">Đã hoàn tiền</div>
            </div>
          </div>
          <div className="abm-stat-card abm-stat--escrow">
            <div className="abm-stat-icon"><Wallet size={18} /></div>
            <div className="abm-stat-body">
              <div className="abm-stat-value">{formatCurrency(dashboard.escrowHoldingVnd)}</div>
              <div className="abm-stat-label">Đang giữ (Escrow)</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts ── */}
      {!loading && dashboard && (
        <div className="abm-charts">
          <div className="abm-chart-card">
            <div className="abm-card-title">
              <Wallet size={15} /> Dòng tiền booking theo tháng
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dashboard.monthlyRevenue || []}>
                <defs>
                  <linearGradient id="abmLearnerSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="abmMentorPayout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="abmAdminFee" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `${Math.round(Number(v) / 1000000)}M`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="learnerSpendVnd" stroke="#22c55e" fill="url(#abmLearnerSpend)" name="Học viên chi" strokeWidth={2} />
                <Area type="monotone" dataKey="mentorPayoutVnd" stroke="#22d3ee" fill="url(#abmMentorPayout)" name="Mentor nhận" strokeWidth={2} />
                <Area type="monotone" dataKey="adminCommissionVnd" stroke="#f59e0b" fill="url(#abmAdminFee)" name="Phí hệ thống" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="abm-chart-card">
            <div className="abm-card-title">
              <ShieldAlert size={15} /> Phân bổ trạng thái booking
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={(dashboard.statusBreakdown || []) as any}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {(dashboard.statusBreakdown || []).map(item => (
                    <Cell key={item.status} fill={STATUS_COLOR[item.status] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, STATUS_LABEL[String(n)] || n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => STATUS_LABEL[String(v)] || v} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Layout: List + Detail ── */}
      <div className="abm-layout">
        {/* Left: Booking List */}
        <div className="abm-list-panel">
          <div className="abm-card-title">
            <Clock3 size={15} /> Danh sách Booking
            <span className="abm-count-badge">{filteredBookings.length}</span>
          </div>

          {loading ? (
            <div className="abm-loading"><Loader2 className="abm-spin" size={24} /> Đang tải...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="abm-empty-detail">
              <ShieldAlert size={20} /> Không tìm thấy booking nào.
            </div>
          ) : (
            <div className="abm-list">
              {filteredBookings.map(item => (
                <button
                  key={item.id}
                  className={`abm-list-item ${selectedBooking?.id === item.id ? 'is-active' : ''}`}
                  onClick={() => void handleSelectBooking(item.id)}
                >
                  <div className="abm-list-item__top">
                    <strong className="abm-booking-id">#{item.id}</strong>
                    <span className="abm-status-badge" style={{ color: STATUS_COLOR[item.status] || '#cbd5e1', background: `${STATUS_COLOR[item.status]}18`, border: `1px solid ${STATUS_COLOR[item.status]}40` }}>
                      {STATUS_LABEL[item.status] || item.status}
                    </span>
                  </div>
                  <div className="abm-list-item__users">
                    <span className="abm-mentor-tag">👤 {item.mentorName || `Mentor #${item.mentorId}`}</span>
                    <span className="abm-sep">→</span>
                    <span className="abm-learner-tag">👤 {item.learnerName || `Học viên #${item.learnerId}`}</span>
                  </div>
                  <div className="abm-list-item__meta">
                    <span>📅 {formatDateTime(item.startTime)}</span>
                    <span className="abm-duration">⏱ {item.durationMinutes} phút</span>
                  </div>
                  <div className="abm-list-item__bottom">
                    <span className="abm-price">{formatCurrency(item.priceVnd)}</span>
                    {item.disputeId && (
                      <span className="abm-dispute-flag"><AlertTriangle size={11} /> DISPUTE</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="abm-pagination">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="abm-page-btn">‹ Trước</button>
              <span className="abm-page-info">Trang {page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="abm-page-btn">Sau ›</button>
            </div>
          )}
        </div>

        {/* Right: Detail Panel */}
        <div className="abm-detail-panel">
          {!selectedBooking ? (
            <div className="abm-empty-detail"><ShieldAlert size={22} /> Chọn một booking để xem chi tiết.</div>
          ) : detailLoading ? (
            <div className="abm-loading"><Loader2 className="abm-spin" size={24} /> Đang tải chi tiết...</div>
          ) : (
            <>
              {/* Detail Head */}
              <div className="abm-detail-head">
                <div>
                  <div className="abm-kicker">BOOKING #{selectedBooking.id}</div>
                  <h3>📋 {selectedBooking.mentorName || `Mentor #${selectedBooking.mentorId}`}</h3>
                  <p>👤 Học viên: {selectedBooking.learnerName || `Học viên #${selectedBooking.learnerId}`}</p>
                </div>
                <span className="abm-status-badge abm-status-lg" style={{ color: STATUS_COLOR[selectedBooking.status], background: `${STATUS_COLOR[selectedBooking.status]}18`, border: `1px solid ${STATUS_COLOR[selectedBooking.status]}40` }}>
                  {STATUS_LABEL[selectedBooking.status] || selectedBooking.status}
                </span>
              </div>

              {/* Booking Info Grid */}
              <div className="abm-info-grid">
                <div className="abm-info-card abm-info-card--time">
                  <div className="abm-info-card__icon">📅</div>
                  <div className="abm-info-card__body">
                    <span>Lịch học</span>
                    <strong>{formatDateTime(selectedBooking.startTime)}</strong>
                  </div>
                </div>
                <div className="abm-info-card abm-info-card--duration">
                  <div className="abm-info-card__icon">⏱</div>
                  <div className="abm-info-card__body">
                    <span>Thời lượng</span>
                    <strong>{selectedBooking.durationMinutes} phút</strong>
                  </div>
                </div>
                <div className="abm-info-card abm-info-card--created">
                  <div className="abm-info-card__icon">🕐</div>
                  <div className="abm-info-card__body">
                    <span>Ngày tạo</span>
                    <strong>{safeDateTime(selectedBooking.createdAt)}</strong>
                  </div>
                </div>
                <div className="abm-info-card abm-info-card--payment">
                  <div className="abm-info-card__icon">💳</div>
                  <div className="abm-info-card__body">
                    <span>Thanh toán</span>
                    <strong>{selectedBooking.paymentReference || 'Ví / Escrow'}</strong>
                  </div>
                </div>
                <div className="abm-info-card abm-info-card--meeting">
                  <div className="abm-info-card__icon">🎥</div>
                  <div className="abm-info-card__body">
                    <span>Phòng học</span>
                    <strong className={selectedBooking.meetingLink ? 'abm-text-green' : 'abm-text-muted'}>
                      {selectedBooking.meetingLink ? 'Đã tạo phòng' : 'Chưa tạo phòng'}
                    </strong>
                  </div>
                </div>
                <div className="abm-info-card abm-info-card--price">
                  <div className="abm-info-card__icon">💰</div>
                  <div className="abm-info-card__body">
                    <span>Giá trị booking</span>
                    <strong className="abm-text-cyan">{formatCurrency(selectedBooking.priceVnd)}</strong>
                  </div>
                </div>
              </div>

              {/* ── Review Section ── */}
              <div className="abm-section abm-review-section">
                <div className="abm-section-header abm-section-header--yellow">
                  <span className="abm-review-section-glyph">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </span>
                  <h4>Đánh giá từ học viên</h4>
                </div>
                {reviewLoading ? (
                  <div className="abm-loading abm-loading--sm"><Loader2 className="abm-spin" size={18} /></div>
                ) : review ? (
                  <div className="abm-review-card">
                    <div className="abm-review-card__head">
                      <div className="abm-reviewer-info">
                        <div className="abm-reviewer-avatar abm-reviewer-avatar--learner">
                          {review.learnerAvatar
                            ? <img src={review.learnerAvatar} alt={review.learnerName} />
                            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                        </div>
                        <div>
                          <div className="abm-reviewer-name">{review.learnerName || `Học viên #${review.learnerId}`}</div>
                          <div className="abm-review-date">{safeDateTime(review.createdAt)}</div>
                        </div>
                      </div>
                      <div className="abm-review-rating">
                        <div className="abm-review-score" style={{ color: ratingColor(review.rating), borderColor: `${ratingColor(review.rating)}40` }}>
                          <span className="abm-review-score-num">{review.rating}</span>
                          <span className="abm-review-score-of">/5</span>
                        </div>
                        <div className="abm-review-stars">
                          {[1,2,3,4,5].map(s => (
                            <svg key={s} width="14" height="14" viewBox="0 0 24 24"
                              fill={s <= review.rating ? ratingColor(review.rating) : 'none'}
                              stroke={s <= review.rating ? ratingColor(review.rating) : '#475569'}
                              strokeWidth="2">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          ))}
                        </div>
                        <span className="abm-rating-label" style={{ color: ratingColor(review.rating) }}>{ratingLabel(review.rating)}</span>
                      </div>
                    </div>

                    {(() => {
                      const { tags, message } = parseReviewComment(review.comment);
                      return (
                        <>
                          {tags.length > 0 && (
                            <div className="abm-review-tags">
                              {tags.map(tag => {
                                const meta = REVIEW_TAG_META[tag];
                                return meta ? (
                                  <span key={tag} className="abm-review-tag" style={{ color: meta.color, background: meta.bg, borderColor: `${meta.color}40` }}>
                                    {meta.label}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                          {message && (
                            <div className="abm-review-comment">{message}</div>
                          )}
                        </>
                      );
                    })()}

                    {review.reply && (
                      <div className="abm-mentor-reply">
                        <div className="abm-mentor-reply__label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          Phản hồi từ Mentor
                        </div>
                        <div className="abm-mentor-reply__content">{review.reply}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="abm-no-review">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Chưa có đánh giá cho booking này.
                  </div>
                )}
              </div>

              {/* ── Finance Section ── */}
              {finance && (
                <div className="abm-section abm-finance-section">
                  <div className="abm-section-header">
                    <span className="abm-section-icon">💰</span>
                    <h4>Thông tin tài chính</h4>
                  </div>
                  <div className="abm-money-grid">
                    <div className="abm-money-item abm-money-item--learner">
                      <span>Học viên chi trả</span>
                      <strong>{formatCurrency(finance.userSpend)}</strong>
                    </div>
                    <div className="abm-money-item abm-money-item--refund">
                      <span>Hoàn tiền</span>
                      <strong>{formatCurrency(finance.refund)}</strong>
                    </div>
                    <div className="abm-money-item abm-money-item--mentor">
                      <span>Mentor nhận (80%)</span>
                      <strong>{formatCurrency(finance.mentorPay)}</strong>
                    </div>
                    <div className="abm-money-item abm-money-item--admin">
                      <span>Phí hệ thống (20%)</span>
                      <strong>{formatCurrency(finance.adminFee)}</strong>
                    </div>
                    <div className="abm-money-item abm-money-item--escrow">
                      <span>Đang giữ (Escrow)</span>
                      <strong>{formatCurrency(finance.escrow)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Dispute Section ── */}
              {selectedDispute ? (
                <div className="abm-section abm-dispute-section">
                  <div className="abm-section-header abm-section-header--orange">
                    <span className="abm-section-icon">⚠️</span>
                    <h4>Chi tiết tranh chấp</h4>
                    <span className="abm-dispute-status" style={{ color: STATUS_COLOR[selectedDispute.status], background: `${STATUS_COLOR[selectedDispute.status]}18`, border: `1px solid ${STATUS_COLOR[selectedDispute.status]}40` }}>
                      {STATUS_LABEL[selectedDispute.status] || selectedDispute.status}
                    </span>
                  </div>

                  <div className="abm-dispute-summary">
                    <div className="abm-dispute-reason">
                      <strong>Lý do:</strong> {selectedDispute.reason || 'Không có lý do bổ sung.'}
                    </div>
                    {selectedDispute.resolution && (
                      <div className="abm-dispute-resolution">
                        <strong>Quyết định:</strong> {RESOLUTION_LABEL[selectedDispute.resolution]}
                      </div>
                    )}
                    {selectedDispute.resolutionNotes && (
                      <div className="abm-dispute-notes">
                        <strong>Ghi chú:</strong> {selectedDispute.resolutionNotes}
                      </div>
                    )}
                  </div>

                  {/* Dispute money */}
                  <div className="abm-money-grid">
                    <div className="abm-money-item abm-money-item--refund">
                      <span>Đã hoàn</span>
                      <strong>{formatCurrency(selectedDispute.refundAmount)}</strong>
                    </div>
                    <div className="abm-money-item abm-money-item--learner">
                      <span>Đã giải phóng</span>
                      <strong>{formatCurrency(selectedDispute.releasedAmount)}</strong>
                    </div>
                    <div className="abm-money-item abm-money-item--mentor">
                      <span>Mentor nhận</span>
                      <strong>{formatCurrency(selectedDispute.mentorPayoutAmount)}</strong>
                    </div>
                    <div className="abm-money-item abm-money-item--admin">
                      <span>Phí hệ thống</span>
                      <strong>{formatCurrency(selectedDispute.adminCommissionAmount)}</strong>
                    </div>
                  </div>

                  {/* Evidence */}
                  <div className="abm-evidence-list">
                    <div className="abm-card-title"><MessageSquare size={14} /> Bằng chứng ({evidence.length})</div>
                    {evidence.length === 0 ? (
                      <div className="abm-empty-detail">Chưa có bằng chứng nào được nộp.</div>
                    ) : evidence.map(item => {
                      const reviewStatus = item.reviewStatus || 'PENDING';
                      const isResolved = selectedDispute.status === 'RESOLVED';
                      const isReviewingCurrent = reviewingEvidenceId === item.id;
                      const canReview = !isResolved && !isReviewingCurrent;
                      const isImage = isImageEvidence(item);

                      return (
                        <div key={item.id} className="abm-evidence-item">
                          <div className="abm-evidence-item__top">
                            <span className="abm-evidence-type">{item.evidenceType}</span>
                            <span className="abm-evidence-user">User #{item.submittedBy}</span>
                            <span
                              className="abm-evidence-review-status"
                              style={{
                                color: EVIDENCE_REVIEW_COLOR[reviewStatus],
                                background: `${EVIDENCE_REVIEW_COLOR[reviewStatus]}1a`,
                                border: `1px solid ${EVIDENCE_REVIEW_COLOR[reviewStatus]}4d`,
                              }}
                            >
                              {EVIDENCE_REVIEW_LABEL[reviewStatus]}
                            </span>
                            <span className="abm-evidence-date">{safeDateTime(item.createdAt)}</span>
                          </div>

                          {item.content && <p className="abm-evidence-content">{item.content}</p>}
                          {item.description && <p className="abm-evidence-desc">{item.description}</p>}

                          {isImage && item.fileUrl && (
                            <a href={item.fileUrl} target="_blank" rel="noreferrer" className="abm-evidence-image-wrap">
                              <img src={item.fileUrl} alt={item.fileName || `Evidence #${item.id}`} className="abm-evidence-image" />
                            </a>
                          )}

                          {item.fileUrl && (
                            <a href={item.fileUrl} target="_blank" rel="noreferrer" className="abm-evidence-file">{item.fileName || 'Xem tệp'}</a>
                          )}

                          {(item.reviewNotes || item.reviewedAt || item.reviewedBy) && (
                            <div className="abm-evidence-review-meta">
                              <div className="abm-evidence-review-meta__title">Kết quả duyệt</div>
                              {item.reviewNotes && <p>{item.reviewNotes}</p>}
                              <span>
                                {item.reviewedBy ? `Admin #${item.reviewedBy}` : 'Admin'}
                                {item.reviewedAt ? ` • ${safeDateTime(item.reviewedAt)}` : ''}
                              </span>
                            </div>
                          )}

                          {!isResolved && (
                            <div className="abm-evidence-actions">
                              <button
                                type="button"
                                className="abm-evidence-action abm-evidence-action--investigate"
                                disabled={!canReview}
                                onClick={() => void handleReviewEvidence(item.id, 'MARK_UNDER_REVIEW')}
                              >
                                {isReviewingCurrent ? 'Đang xử lý...' : 'Điều tra'}
                              </button>
                              <button
                                type="button"
                                className="abm-evidence-action abm-evidence-action--accept"
                                disabled={!canReview}
                                onClick={() => void handleReviewEvidence(item.id, 'ACCEPT_EVIDENCE_REFUND_USER')}
                              >
                                {isReviewingCurrent ? 'Đang xử lý...' : 'Chấp nhận & hoàn user'}
                              </button>
                              <button
                                type="button"
                                className="abm-evidence-action abm-evidence-action--reject"
                                disabled={!canReview}
                                onClick={() => void handleReviewEvidence(item.id, 'REJECT_EVIDENCE_RELEASE_MENTOR')}
                              >
                                {isReviewingCurrent ? 'Đang xử lý...' : 'Từ chối & trả mentor'}
                              </button>
                            </div>
                          )}

                          {item.responses?.length ? item.responses.map(r => (
                            <div key={r.id} className="abm-evidence-response">
                              <strong>{r.respondedByName || `User #${r.respondedBy}`}</strong>
                              <p>{r.content}</p>
                            </div>
                          )) : null}
                        </div>
                      );
                    })}
                  </div>

                  {/* Resolve Box */}
                  {selectedDispute.status !== 'RESOLVED' && (
                    <div className="abm-resolve-box">
                      <div className="abm-card-title"><CheckCircle2 size={14} /> Giải quyết tranh chấp</div>
                      <div className="abm-resolve-form">
                        <div className="abm-form-group">
                          <label>Quyết định:</label>
                          <select value={resolution} onChange={e => setResolution(e.target.value as DisputeResolution)}>
                            {Object.entries(RESOLUTION_LABEL).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                        </div>
                        {(resolution === 'PARTIAL_REFUND' || resolution === 'PARTIAL_RELEASE') && (
                          <div className="abm-form-group">
                            <label>Số tiền một phần (VND):</label>
                            <input
                              type="number"
                              value={partialAmount}
                              onChange={e => setPartialAmount(e.target.value)}
                              placeholder="Ví dụ: 150000"
                            />
                          </div>
                        )}
                        <div className="abm-form-group">
                          <label>Ghi chú (tùy chọn):</label>
                          <textarea
                            rows={3}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Ghi chú admin cho quyết định này..."
                          />
                        </div>
                        <button className="abm-resolve-button" onClick={() => void resolveDisputeNow()} disabled={resolving}>
                          {resolving ? <><Loader2 className="abm-spin" size={15} /> Đang xử lý...</> : <><CheckCircle2 size={15} /> Xác nhận giải quyết</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="abm-no-dispute">
                  <ShieldAlert size={16} /> Booking này không có tranh chấp.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBookingManagementTab;
