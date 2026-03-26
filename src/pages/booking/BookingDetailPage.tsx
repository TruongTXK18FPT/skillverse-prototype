import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Copy,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  ShieldAlert,
  Star,
  ThumbsUp,
  Clock,
  Video,
  Wallet,
  XCircle,
  ChevronDown,
  Zap,
  Users,
  BookOpen,
  RefreshCw,
  Link as LinkIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  approveBooking,
  BookingResponse,
  cancelBooking,
  completeBooking,
  confirmCompleteBooking,
  downloadBookingInvoice,
  getBookingDetail,
  rejectBooking,
  startMeeting,
} from '../../services/bookingService';
import {
  BookingDispute,
  BookingDisputeEvidence,
  EvidenceType,
  getBookingDisputeByBooking,
  getBookingDisputeEvidence,
  openBookingDispute,
  respondToBookingDisputeEvidence,
  submitBookingDisputeEvidence,
} from '../../services/bookingDisputeService';
import { createReview, getReviewByBookingId, ReviewResponse } from '../../services/reviewService';
import { uploadMedia } from '../../services/mediaService';
import { confirmAction } from '../../context/ConfirmDialogContext';
import { showAppError, showAppSuccess } from '../../context/ToastContext';
import { getStoredUserRaw } from '../../utils/authStorage';
import '../../styles/BookingDetailPage.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewerRole = 'mentor' | 'learner';

const STATUS_META: Record<string, { label: string; tone: string }> = {
  PENDING: { label: 'Chờ duyệt', tone: 'amber' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'cyan' },
  ONGOING: { label: 'Đang diễn ra', tone: 'violet' },
  MENTOR_COMPLETED: { label: 'Chờ xác nhận', tone: 'purple' },
  COMPLETED: { label: 'Hoàn thành', tone: 'green' },
  DISPUTED: { label: 'Đang tranh chấp', tone: 'orange' },
  REFUNDED: { label: 'Đã hoàn tiền', tone: 'slate' },
  CANCELLED: { label: 'Đã hủy', tone: 'red' },
  REJECTED: { label: 'Bị từ chối', tone: 'red' },
};

const DISPUTE_STATUS_META: Record<string, { label: string; tone: string }> = {
  OPEN: { label: 'Mở', tone: 'orange' },
  UNDER_INVESTIGATION: { label: 'Đang điều tra', tone: 'amber' },
  AWAITING_RESPONSE: { label: 'Chờ phản hồi', tone: 'cyan' },
  RESOLVED: { label: 'Đã giải quyết', tone: 'green' },
  DISMISSED: { label: 'Bác bỏ', tone: 'slate' },
  ESCALATED: { label: 'Escalate', tone: 'red' },
};

const DISPUTE_RESOLUTION_META: Record<string, { label: string; tone: string }> = {
  FULL_REFUND: { label: 'Hoàn tiền 100%', tone: 'cyan' },
  FULL_RELEASE: { label: 'Thanh toán mentor', tone: 'green' },
  PARTIAL_REFUND: { label: 'Hoàn tiền 1 phần', tone: 'amber' },
  PARTIAL_RELEASE: { label: 'Thanh toán 1 phần', tone: 'violet' },
};

const EVIDENCE_TYPES: Array<{ value: EvidenceType; label: string }> = [
  { value: 'TEXT', label: 'Văn bản' },
  { value: 'LINK', label: 'Đường dẫn' },
  { value: 'CHAT_LOG', label: 'Chat log' },
  { value: 'IMAGE', label: 'Hình ảnh' },
  { value: 'SCREENSHOT', label: 'Screenshot' },
  { value: 'FILE', label: 'Tập đính kèm' },
];

const EVIDENCE_FILE_ACCEPT = 'image/*,.pdf,.doc,.docx,.txt';
const MAX_EVIDENCE_FILE_SIZE = 20 * 1024 * 1024;

const REVIEW_TAGS = [
  { value: 'CONTENT_QUALITY', label: 'Chất lượng nội dung', icon: BookOpen },
  { value: 'PUNCTUALITY', label: 'Đúng giờ', icon: Clock },
  { value: 'COMMUNICATION', label: 'Giao tiếp tốt', icon: MessageSquare },
  { value: 'PREPARATION', label: 'Chuẩn bị kỹ', icon: CheckSquare },
  { value: 'FRIENDLY', label: 'Thân thiện', icon: Users },
  { value: 'KNOWLEDGEABLE', label: 'Chuyên môn cao', icon: Zap },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageFile = (fileName: string): boolean =>
  /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileName);

const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  TEXT: 'Văn bản',
  LINK: 'Đường dẫn',
  CHAT_LOG: 'Chat log',
  IMAGE: 'Hình ảnh',
  SCREENSHOT: 'Screenshot',
  FILE: 'Tập đính kèm',
};

const EVIDENCE_TYPE_COLORS: Record<EvidenceType, { bg: string; color: string; border: string }> = {
  TEXT:        { bg: 'rgba(96,165,250,0.12)',  color: '#93c5fd', border: 'rgba(96,165,250,0.25)'  },
  LINK:        { bg: 'rgba(52,211,153,0.12)', color: '#6ee7b7', border: 'rgba(52,211,153,0.25)'  },
  CHAT_LOG:    { bg: 'rgba(167,139,250,0.12)',color: '#c4b5fd', border: 'rgba(167,139,250,0.25)' },
  IMAGE:       { bg: 'rgba(251,146,60,0.12)', color: '#fdba74', border: 'rgba(251,146,60,0.25)'  },
  SCREENSHOT:  { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.25)'  },
  FILE:        { bg: 'rgba(148,163,184,0.12)', color: '#cbd5e1', border: 'rgba(148,163,184,0.25)' },
};

const parseBookingDate = (dateString: string): Date =>
  dateString.endsWith('Z') || dateString.includes('+07:00')
    ? new Date(dateString)
    : new Date(`${dateString}+07:00`);

// Safe date formatter — handles ISO strings with +07:00 offset
const safeFormatDate = (dateStr: string | undefined | null, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN', options ?? {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

const isRenderableReview = (review: ReviewResponse | null | undefined): review is ReviewResponse =>
  !!review && Number.isFinite(review.rating) && review.rating >= 1 && review.rating <= 5;

const PAID_BOOKING_STATUSES = ['CONFIRMED', 'ONGOING', 'MENTOR_COMPLETED', 'COMPLETED', 'DISPUTED', 'REFUNDED'] as const;

const REVIEW_TAG_META = Object.fromEntries(
  REVIEW_TAGS.map(tag => [tag.value, tag]),
) as Record<string, (typeof REVIEW_TAGS)[number]>;

const parseReviewPayload = (comment?: string | null) => {
  const source = (comment || '').trim();
  const match = source.match(/^\[([A-Z_,]+)\]\s*(.*)$/s);
  if (!match) {
    return { tags: [] as string[], message: source };
  }

  const tags = match[1]
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => !!tag && REVIEW_TAG_META[tag]);

  return {
    tags,
    message: match[2].trim(),
  };
};

// ─── Component ────────────────────────────────────────────────────────────────

const BookingDetailPage: React.FC = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const composerFileInputRef = useRef<HTMLInputElement>(null);
  const evidenceFileInputRef = useRef<HTMLInputElement>(null);

  const currentUserRaw = getStoredUserRaw();
  let currentUser: any = null;
  try {
    currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
  } catch {
    currentUser = null;
  }
  const currentUserId = currentUser?.userId != null
    ? Number(currentUser.userId)
    : currentUser?.id != null
      ? Number(currentUser.id)
      : null;

  // ── State ──────────────────────────────────────────────────────────────────
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [dispute, setDispute] = useState<BookingDispute | null>(null);
  const [evidence, setEvidence] = useState<BookingDisputeEvidence[]>([]);
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [openComposer, setOpenComposer] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('TEXT');
  const [evidenceContent, setEvidenceContent] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [responseMap, setResponseMap] = useState<Record<number, string>>({});
  const [replyingId, setReplyingId] = useState<number | null>(null);

  // Review form state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewErrors, setReviewErrors] = useState<{ rating?: string; comment?: string }>({});
  const [reviewTouched, setReviewTouched] = useState({ rating: false, comment: false });

  // Tick
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void loadData();
  }, [bookingId]);

  const loadData = async () => {
    if (!bookingId) {
      setLoading(false);
      setError('Booking không hợp lệ.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const bookingData = await getBookingDetail(Number(bookingId));
      setBooking(bookingData);

      // Load review if booking is COMPLETED
      if (bookingData.status === 'COMPLETED') {
        try {
          const reviewData = await getReviewByBookingId(Number(bookingId));
          setReview(isRenderableReview(reviewData) ? reviewData : null);
        } catch {
          setReview(null);
        }
      }

      try {
        const disputeData = await getBookingDisputeByBooking(Number(bookingId));
        setDispute(disputeData);
        setEvidence(await getBookingDisputeEvidence(disputeData.id));
      } catch {
        setDispute(null);
        setEvidence([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải chi tiết booking.');
    } finally {
      setLoading(false);
    }
  };

  const viewerRole: ViewerRole | null = useMemo(() => {
    if (!booking || !currentUserId) return null;
    return currentUserId === booking.mentorId ? 'mentor' : 'learner';
  }, [booking, currentUserId]);

  const counterpartName =
    viewerRole === 'mentor'
      ? booking?.learnerName || `Learner #${booking?.learnerId ?? ''}`
      : booking?.mentorName || `Mentor #${booking?.mentorId ?? ''}`;

  const counterpartAvatar = viewerRole === 'mentor' ? booking?.learnerAvatar : null;

  const startDate = booking ? parseBookingDate(booking.startTime) : null;
  const endDate = booking
    ? new Date(parseBookingDate(booking.startTime).getTime() + (booking.durationMinutes || 60) * 60000)
    : null;
  const sessionEnded = !!endDate && now.getTime() >= endDate.getTime();
  const meetingVisible =
    !!booking?.meetingLink &&
    (booking.status === 'ONGOING' ||
      (booking.status === 'CONFIRMED' && !!startDate && startDate.getTime() - now.getTime() <= 30 * 60 * 1000));
  const canOpenDispute =
    viewerRole === 'learner' &&
    !dispute &&
    !!booking &&
    (booking.status === 'MENTOR_COMPLETED' ||
      ((booking.status === 'CONFIRMED' || booking.status === 'ONGOING') && sessionEnded));
  const canReview =
    viewerRole === 'learner' &&
    booking?.status === 'COMPLETED' &&
    !review;
  const isPaymentSettled = !!booking?.paymentReference || (!!booking && PAID_BOOKING_STATUSES.includes(booking.status as typeof PAID_BOOKING_STATUSES[number]));
  const parsedReview = useMemo(() => parseReviewPayload(review?.comment), [review?.comment]);
  const isFileEvidenceType = ['FILE', 'IMAGE', 'SCREENSHOT'].includes(evidenceType);
  const isTextEvidenceType = ['TEXT', 'LINK', 'CHAT_LOG'].includes(evidenceType);
  const hasEvidenceDraft = isFileEvidenceType
    ? !!evidenceFile
    : evidenceContent.trim().length > 0 || evidenceDescription.trim().length > 0;

  const resetEvidenceDraft = () => {
    setEvidenceType('TEXT');
    setEvidenceContent('');
    setEvidenceDescription('');
    setEvidenceFile(null);
    if (composerFileInputRef.current) composerFileInputRef.current.value = '';
    if (evidenceFileInputRef.current) evidenceFileInputRef.current.value = '';
  };

  const validateEvidenceFile = (file: File) => {
    if (file.size > MAX_EVIDENCE_FILE_SIZE) {
      showAppError('Tệp quá lớn', 'Vui lòng chọn tệp nhỏ hơn hoặc bằng 20MB.');
      return false;
    }
    return true;
  };

  const handleEvidenceFileSelected = (file: File | null) => {
    if (!file) {
      setEvidenceFile(null);
      setSelectedFilePreview(null);
      return;
    }
    if (!validateEvidenceFile(file)) {
      return;
    }
    setEvidenceFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setSelectedFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setSelectedFilePreview(null);
    }
  };

  const validateEvidenceDraft = () => {
    if (isTextEvidenceType && !evidenceContent.trim()) {
      showAppError('Thiếu nội dung', 'Vui lòng nhập nội dung bằng chứng.');
      return false;
    }
    if (isFileEvidenceType && !evidenceFile) {
      showAppError('Chưa chọn tệp', 'Vui lòng chọn tệp cần gửi.');
      return false;
    }
    if (isFileEvidenceType && evidenceFile && !validateEvidenceFile(evidenceFile)) {
      return false;
    }
    return true;
  };

  const submitEvidenceForDispute = async (disputeId: number) => {
    let fileUrl: string | undefined;
    let fileName: string | undefined;

    if (evidenceFile) {
      if (!currentUserId) {
        throw new Error('Không xác định được người dùng để tải tệp lên.');
      }
      const media = await uploadMedia(evidenceFile, currentUserId);
      fileUrl = media.url;
      fileName = evidenceFile.name;
    }

    await submitBookingDisputeEvidence(
      disputeId,
      evidenceType,
      isTextEvidenceType ? evidenceContent.trim() : undefined,
      fileUrl,
      fileName,
      evidenceDescription.trim() || undefined,
    );
  };

  const canSubmitOpenDispute = !!disputeReason.trim() && (!hasEvidenceDraft || (isFileEvidenceType ? !!evidenceFile : !!evidenceContent.trim()));
  const shouldShowEvidenceInputForComposer = isTextEvidenceType;
  const shouldShowFileInputForComposer = isFileEvidenceType;

  const money = useMemo(() => {
    if (!booking) return { userSpend: 0, refund: 0, mentorPay: 0, adminFee: 0, escrow: 0 };
    const price = booking.priceVnd || 0;
    if (dispute?.resolution) {
      return {
        userSpend: dispute.releasedAmount || 0,
        refund: dispute.refundAmount || 0,
        mentorPay: dispute.mentorPayoutAmount || 0,
        adminFee: dispute.adminCommissionAmount || 0,
        escrow: 0,
      };
    }
    if (booking.status === 'COMPLETED') {
      return { userSpend: price, refund: 0, mentorPay: price * 0.8, adminFee: price * 0.2, escrow: 0 };
    }
    if (['REFUNDED', 'REJECTED', 'CANCELLED'].includes(booking.status)) {
      return { userSpend: 0, refund: price, mentorPay: 0, adminFee: 0, escrow: 0 };
    }
    return { userSpend: 0, refund: 0, mentorPay: 0, adminFee: 0, escrow: price };
  }, [booking, dispute]);

  const runAction = async (runner: () => Promise<unknown>, successTitle: string, successMessage: string) => {
    setBusy(true);
    try {
      await runner();
      showAppSuccess(successTitle, successMessage);
      await loadData();
    } catch (err: any) {
      showAppError('Thao tác thất bại', err?.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const handleStartMeeting = async () => {
    if (!booking) return;
    setBusy(true);
    try {
      const updated = booking.meetingLink ? booking : await startMeeting(booking.id);
      const meetingLink = updated.meetingLink || booking.meetingLink;
      if (meetingLink) window.open(meetingLink, '_blank', 'noopener,noreferrer');
      await loadData();
    } catch (err: any) {
      showAppError('Không thể mở phòng học', err?.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenDispute = async () => {
    if (!booking || !disputeReason.trim()) {
      showAppError('Thiếu lý do', 'Vui lòng nhập lý do tranh chấp.');
      return;
    }
    if (hasEvidenceDraft && !validateEvidenceDraft()) {
      return;
    }

    setBusy(true);
    try {
      const newDispute = await openBookingDispute(booking.id, disputeReason.trim());

      if (hasEvidenceDraft) {
        await submitEvidenceForDispute(newDispute.id);
      }

      setDispute(newDispute);
      setEvidence(await getBookingDisputeEvidence(newDispute.id));
      setDisputeReason('');
      setOpenComposer(false);
      resetEvidenceDraft();
      showAppSuccess('Đã mở tranh chấp', hasEvidenceDraft ? 'Đã mở tranh chấp và gửi kèm bằng chứng.' : 'Bạn có thể bổ sung bằng chứng ngay trong lúc này.');
      await loadData();
    } catch (err: any) {
      showAppError('Không thể mở tranh chấp', err?.response?.data?.message || err?.message || 'Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!dispute) return;
    if (!validateEvidenceDraft()) return;

    setBusy(true);
    try {
      await submitEvidenceForDispute(dispute.id);
      setEvidence(await getBookingDisputeEvidence(dispute.id));
      resetEvidenceDraft();
      showAppSuccess('Đã gửi bằng chứng', 'Thông tin tranh chấp đã được cập nhật.');
    } catch (err: any) {
      showAppError('Không thể gửi bằng chứng', err?.response?.data?.message || err?.message || 'Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const handleReply = async (evidenceId: number) => {
    if (!dispute || !responseMap[evidenceId]?.trim()) return;
    setReplyingId(evidenceId);
    try {
      await respondToBookingDisputeEvidence(dispute.id, evidenceId, responseMap[evidenceId].trim());
      setEvidence(await getBookingDisputeEvidence(dispute.id));
      setResponseMap((prev) => ({ ...prev, [evidenceId]: '' }));
      showAppSuccess('Đã gửi phản hồi', 'Phản hồi của bạn đã được ghi nhận.');
    } catch (err: any) {
      showAppError('Không thể gửi phản hồi', err?.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setReplyingId(null);
    }
  };

  // ── Review handlers ─────────────────────────────────────────────────────────

  const toggleReviewTag = (tag: string) => {
    setReviewTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitReview = async () => {
    if (!booking) return;
    setReviewTouched({ rating: true, comment: true });
    const errors: { rating?: string; comment?: string } = {};
    if (reviewRating === 0) errors.rating = 'Vui lòng chọn số sao đánh giá (1–5 sao).';
    if (reviewComment.trim().length < 10) errors.comment = 'Nhận xét phải có ít nhất 10 ký tự.';
    setReviewErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setReviewSubmitting(true);
    try {
      const tagString = reviewTags.join(',');
      const commentText = reviewComment.trim()
        ? `${tagString ? `[${tagString}] ` : ''}${reviewComment.trim()}`
        : tagString;
      const result = await createReview({
        bookingId: booking.id,
        rating: reviewRating,
        comment: commentText,
      });
      setReview(result);
      setReviewOpen(false);
      setReviewRating(0);
      setReviewTags([]);
      setReviewComment('');
      showAppSuccess('Cảm ơn bạn!', 'Đánh giá của bạn đã được gửi thành công.');
    } catch (err: any) {
      showAppError('Không thể gửi đánh giá', err?.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bkd-shell bkd-loading">
        <Loader2 className="bkd-spin" size={32} />
        <span>Đang tải chi tiết booking...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bkd-shell">
        <div className="bkd-error-card">
          <ShieldAlert size={26} />
          <div>
            <h2>Không thể tải booking</h2>
            <p>{error || 'Booking không tồn tại.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const status = STATUS_META[booking.status] || { label: booking.status, tone: 'slate' };
  const toneClass = `bkd-tone-${status.tone}`;

  return (
    <div className="bkd-shell">
      {/* ── Topbar ── */}
      <div className="bkd-topbar">
        <button className="bkd-back" onClick={() => navigate(viewerRole === 'mentor' ? '/mentor' : '/my-bookings')}>
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <div className="bkd-topbar-right">
          <div className={`bkd-status-pill ${toneClass}`}>{status.label}</div>
        </div>
      </div>

      {/* ── Hero Card ── */}
      <section className="bkd-hero-card">
        <div className="bkd-hero-left">
          <div className="bkd-hero-avatar">
            {counterpartAvatar ? (
              <img src={counterpartAvatar} alt={counterpartName} />
            ) : (
              <Users size={28} />
            )}
          </div>
          <div className="bkd-hero-info">
            <div className="bkd-hero-role">
              {viewerRole === 'mentor' ? 'Học viên' : 'Mentor'}
            </div>
            <h1 className="bkd-hero-name">{counterpartName}</h1>
            <div className="bkd-hero-id">Booking #{booking.id}</div>
          </div>
        </div>
        <div className="bkd-hero-right">
          <div className="bkd-price-neon">
            <Wallet size={20} />
            <div>
              <span className="bkd-price-label">Giá trị</span>
              <strong className="bkd-price-value">{formatCurrency(booking.priceVnd)}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── Action Bar ── */}
      <section className="bkd-action-bar">
        <div className="bkd-action-bar__left">
          {viewerRole === 'mentor' && booking.status === 'PENDING' && (
            <>
              <button className="bkd-btn bkd-btn-approve" onClick={() => runAction(() => approveBooking(booking.id), 'Đã duyệt booking', 'Booking đã được xác nhận.')} disabled={busy}>
                <CheckCircle2 size={16} /> Duyệt
              </button>
              <button className="bkd-btn bkd-btn-danger" onClick={async () => { const reason = window.prompt('Lý do từ chối booking', '')?.trim(); if (reason) await runAction(() => rejectBooking(booking.id, reason), 'Đã từ chối booking', 'Booking đã bị từ chối.'); }} disabled={busy}>
                <XCircle size={16} /> Từ chối
              </button>
            </>
          )}
          {meetingVisible && (
            <button className="bkd-btn bkd-btn-meeting" onClick={handleStartMeeting} disabled={busy}>
              <Video size={16} /> {booking.meetingLink ? 'Vào phòng học' : 'Bắt đầu'}
            </button>
          )}
          {viewerRole === 'mentor' && sessionEnded && ['CONFIRMED', 'ONGOING'].includes(booking.status) && (
            <button className="bkd-btn bkd-btn-complete" onClick={() => runAction(() => completeBooking(booking.id), 'Đã đánh dấu hoàn tất', 'Hệ thống đang chờ learner xác nhận.')} disabled={busy}>
              <CheckSquare size={16} /> Hoàn tất
            </button>
          )}
          {viewerRole === 'learner' && ['PENDING', 'CONFIRMED'].includes(booking.status) && (
            <button className="bkd-btn bkd-btn-danger" onClick={async () => { if (await confirmAction('Bạn chắc chắn muốn hủy booking này?')) await runAction(() => cancelBooking(booking.id), 'Đã hủy booking', 'Booking đã được hủy.'); }} disabled={busy}>
              <XCircle size={16} /> Hủy
            </button>
          )}
          {viewerRole === 'learner' && booking.status === 'MENTOR_COMPLETED' && (
            <button className="bkd-btn bkd-btn-approve" onClick={async () => { if (await confirmAction('Xác nhận buổi học đã hoàn tất?')) await runAction(() => confirmCompleteBooking(booking.id), 'Đã xác nhận hoàn tất', 'Thanh toán cho mentor đã được giải phóng.'); }} disabled={busy}>
              <CheckCircle2 size={16} /> Xác nhận hoàn tất
            </button>
          )}
        </div>
        <div className="bkd-action-bar__right">
          <button className="bkd-btn bkd-btn-secondary" onClick={() => navigate('/messages', { state: { openChatWith: viewerRole === 'mentor' ? booking.learnerId : booking.mentorId } })}>
            <MessageSquare size={16} /> Nhắn tin
          </button>
          {(booking.paymentReference || ['COMPLETED', 'MENTOR_COMPLETED'].includes(booking.status)) && (
            <button className="bkd-btn bkd-btn-secondary" onClick={async () => { setBusy(true); try { const blob = await downloadBookingInvoice(booking.id); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `booking-${booking.id}.pdf`; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url); } catch (err: any) { showAppError('Không thể tải hóa đơn', err?.response?.data?.message || 'Vui lòng thử lại.'); } finally { setBusy(false); } }} disabled={busy}>
              <FileText size={16} /> Hóa đơn
            </button>
          )}
          {booking.meetingLink && (
            <button className="bkd-btn bkd-btn-secondary" onClick={async () => { await navigator.clipboard.writeText(booking.meetingLink!); showAppSuccess('Đã sao chép', 'Meeting link đã được copy vào clipboard.'); }}>
              <Copy size={16} /> Copy link
            </button>
          )}
        </div>
      </section>

      {/* ── Main Grid ── */}
      <div className="bkd-grid">

        {/* Session Info */}
        <div className="bkd-card">
          <div className="bkd-card-header">
            <CalendarDays size={18} className="bkd-card-header-icon" />
            <h2>Thông tin buổi học</h2>
          </div>
          <div className="bkd-info-list">
            <div className="bkd-info-row">
              <span className="bkd-info-label">Ngày giờ</span>
              <span className="bkd-info-value">{safeFormatDate(booking.startTime, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="bkd-info-row">
              <span className="bkd-info-label">Giờ bắt đầu</span>
              <span className="bkd-info-value">{startDate?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="bkd-info-row">
              <span className="bkd-info-label">Thời lượng</span>
              <span className="bkd-info-value">{booking.durationMinutes} phút</span>
            </div>
            <div className="bkd-info-row">
              <span className="bkd-info-label">Trạng thái thanh toán</span>
              <span className={`bkd-info-value bkd-info-value--${isPaymentSettled ? 'green' : 'amber'}`}>
                {isPaymentSettled ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
            <div className="bkd-info-row">
              <span className="bkd-info-label">Phòng học</span>
              <span className={`bkd-info-value bkd-info-value--${booking.meetingLink ? 'cyan' : 'slate'}`}>
                {booking.meetingLink ? 'Đã tạo' : 'Chưa tạo'}
              </span>
            </div>
          </div>
        </div>

        {/* Finance */}
        <div className="bkd-card">
          <div className="bkd-card-header">
            <Wallet size={18} className="bkd-card-header-icon" />
            <h2>Tài chính</h2>
          </div>
          <div className="bkd-finance-list">
            <div className="bkd-finance-row bkd-finance-row--highlight">
              <span className="bkd-finance-label">Giá trị booking</span>
              <strong className="bkd-finance-value bkd-finance-value--cyan">{formatCurrency(booking.priceVnd)}</strong>
            </div>
            {viewerRole === 'learner' ? (
              <>
                <div className="bkd-finance-row">
                  <span className="bkd-finance-label">Bạn chi trả</span>
                  <span className="bkd-finance-value">{formatCurrency(money.userSpend)}</span>
                </div>
                <div className="bkd-finance-row">
                  <span className="bkd-finance-label">Hoàn tiền</span>
                  <span className={`bkd-finance-value ${money.refund > 0 ? 'bkd-finance-value--orange' : ''}`}>{formatCurrency(money.refund)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="bkd-finance-row">
                  <span className="bkd-finance-label">Học viên chi trả</span>
                  <span className="bkd-finance-value">{formatCurrency(money.userSpend)}</span>
                </div>
                <div className="bkd-finance-row">
                  <span className="bkd-finance-label">Bạn nhận (80%)</span>
                  <span className="bkd-finance-value bkd-finance-value--green">{formatCurrency(money.mentorPay)}</span>
                </div>
                <div className="bkd-finance-row">
                  <span className="bkd-finance-label">Phí hệ thống (20%)</span>
                  <span className="bkd-finance-value bkd-finance-value--slate">{formatCurrency(money.adminFee)}</span>
                </div>
              </>
            )}
            {money.escrow > 0 && (
              <div className="bkd-finance-row">
                <span className="bkd-finance-label">Đang giữ (Escrow)</span>
                <span className="bkd-finance-value bkd-finance-value--amber">{formatCurrency(money.escrow)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <section className="bkd-card bkd-timeline-card">
        <div className="bkd-card-header">
          <Clock size={18} className="bkd-card-header-icon" />
          <h2>Lịch sử</h2>
        </div>
        <div className="bkd-timeline">
          {booking.createdAt && (
            <div className="bkd-timeline-item bkd-timeline-item--cyan">
              <div className="bkd-timeline-dot" />
              <div className="bkd-timeline-content">
                <strong>Booking được tạo</strong>
                <span>{safeFormatDate(booking.createdAt)}</span>
              </div>
            </div>
          )}
          <div className="bkd-timeline-item bkd-timeline-item--violet">
            <div className="bkd-timeline-dot" />
            <div className="bkd-timeline-content">
              <strong>Buổi học dự kiến</strong>
              <span>{startDate?.toLocaleString('vi-VN')}</span>
            </div>
          </div>
          {booking.mentorCompletedAt && (
            <div className="bkd-timeline-item bkd-timeline-item--purple">
              <div className="bkd-timeline-dot" />
              <div className="bkd-timeline-content">
                <strong>Mentor đánh dấu hoàn tất</strong>
                <span>{safeFormatDate(booking.mentorCompletedAt)}</span>
              </div>
            </div>
          )}
          {booking.learnerConfirmedAt && (
            <div className="bkd-timeline-item bkd-timeline-item--green">
              <div className="bkd-timeline-dot" />
              <div className="bkd-timeline-content">
                <strong>Learner xác nhận hoàn tất</strong>
                <span>{safeFormatDate(booking.learnerConfirmedAt)}</span>
              </div>
            </div>
          )}
          {dispute?.createdAt && (
            <div className="bkd-timeline-item bkd-timeline-item--orange">
              <div className="bkd-timeline-dot" />
              <div className="bkd-timeline-content">
                <strong>Dispute được mở</strong>
                <span>{safeFormatDate(dispute.createdAt)}</span>
              </div>
            </div>
          )}
          {dispute?.resolvedAt && (
            <div className="bkd-timeline-item bkd-timeline-item--amber">
              <div className="bkd-timeline-dot" />
              <div className="bkd-timeline-content">
                <strong>Dispute được giải quyết</strong>
                <span>{safeFormatDate(dispute.resolvedAt)}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Review Section ── */}
      <section className="bkd-review-section">
        {/* Section Header */}
        <div className="bkd-review-header">
          <div className="bkd-review-header-left">
            <div className="bkd-review-header-icon">
              <Star size={22} />
            </div>
            <div>
              <h2 className="bkd-review-title">Đánh giá buổi học</h2>
              <p className="bkd-review-subtitle">
                {viewerRole === 'learner'
                  ? 'Chia sẻ trải nghiệm của bạn để giúp mentor phát triển tốt hơn'
                  : 'Nhận xét từ học viên'}
              </p>
            </div>
          </div>
          {canReview && !reviewOpen && (
            <button className="bkd-btn bkd-btn-review" onClick={() => setReviewOpen(true)}>
              <ThumbsUp size={16} /> Viết đánh giá
            </button>
          )}
        </div>

        {/* Existing review display */}
        {review && (
          <div className="bkd-review-display">
            <div className="bkd-review-display-header">
              <div className="bkd-reviewer-info">
                <div className="bkd-reviewer-avatar">
                  {review.learnerAvatar ? (
                    <img src={review.learnerAvatar} alt={review.learnerName || ''} />
                  ) : (
                    <Users size={18} />
                  )}
                </div>
                <div>
                  <strong>{review.learnerName || 'Học viên'}</strong>
                  <span>{safeFormatDate(review.createdAt, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
              <div className="bkd-review-display-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={18}
                    fill={star <= review.rating ? '#facc15' : 'none'}
                    strokeWidth={1.5}
                    className={star <= review.rating ? 'bkd-star-glow' : 'bkd-star-dim'}
                  />
                ))}
                <span className="bkd-rating-label">
                  {review.rating === 5 ? 'Xuất sắc' :
                   review.rating === 4 ? 'Tốt' :
                   review.rating === 3 ? 'Bình thường' :
                   review.rating === 2 ? 'Không tốt' : 'Rất kém'}
                </span>
              </div>
            </div>
            {(parsedReview.tags.length > 0 || parsedReview.message) && (
              <div className="bkd-review-display-body">
                {parsedReview.tags.length > 0 && (
                  <div className="bkd-review-tag-list">
                    {parsedReview.tags.map(tagValue => {
                      const tag = REVIEW_TAG_META[tagValue];
                      const Icon = tag.icon;
                      return (
                        <span key={tagValue} className="bkd-review-tag-chip">
                          <Icon size={14} />
                          {tag.label}
                        </span>
                      );
                    })}
                  </div>
                )}
                {parsedReview.message && (
                  <p className="bkd-review-display-comment">{parsedReview.message}</p>
                )}
              </div>
            )}
            {review.reply && (
              <div className="bkd-review-reply">
                <div className="bkd-review-reply-header">
                  <CheckCircle2 size={14} />
                  <strong>Phản hồi từ Mentor</strong>
                </div>
                <p>{review.reply}</p>
              </div>
            )}
          </div>
        )}

        {/* Review Form */}
        <AnimatePresence>
          {reviewOpen && (
            <motion.div
              className="bkd-review-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Star Rating */}
              <div className="bkd-review-step">
                <div className="bkd-review-step-header">
                  <div className="bkd-review-step-num bkd-review-step-num--1">1</div>
                  <span>Bạn hài lòng thế nào với buổi học?</span>
                </div>
                <div className={`bkd-star-picker-wrap ${reviewErrors.rating ? 'bkd-star-error' : ''}`}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`bkd-star-btn-large ${star <= reviewRating ? 'active' : ''}`}
                      onClick={() => setReviewRating(star)}
                    >
                      <Star
                        size={44}
                        fill={star <= reviewRating ? '#facc15' : 'none'}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
                <div className="bkd-star-hint-large">
                  {reviewRating === 0 && <span className="bkd-hint-neutral">Chọn số sao để đánh giá</span>}
                  {reviewRating === 1 && <span className="bkd-hint-1">😞 Rất không hài lòng</span>}
                  {reviewRating === 2 && <span className="bkd-hint-2">😕 Không hài lòng</span>}
                  {reviewRating === 3 && <span className="bkd-hint-3">😐 Bình thường</span>}
                  {reviewRating === 4 && <span className="bkd-hint-4">🙂 Hài lòng</span>}
                  {reviewRating === 5 && <span className="bkd-hint-5">😍 Rất hài lòng — tuyệt vời!</span>}
                </div>
                {reviewErrors.rating && (
                  <p className="bkd-field-error">{reviewErrors.rating}</p>
                )}
              </div>

              {/* Step 2: Tags */}
              <div className="bkd-review-step bkd-review-step--tags">
                <div className="bkd-review-step-header">
                  <div className="bkd-review-step-num bkd-review-step-num--2">2</div>
                  <span>Điều gì bạn thích ở buổi học?</span>
                  <span className="bkd-review-step-optional">(chọn nhiều)</span>
                </div>
                <div className="bkd-tag-grid-large">
                  {REVIEW_TAGS.map(tag => {
                    const Icon = tag.icon;
                    const selected = reviewTags.includes(tag.value);
                    return (
                      <button
                        key={tag.value}
                        type="button"
                        className={`bkd-tag-btn-large ${selected ? 'active' : ''}`}
                        onClick={() => toggleReviewTag(tag.value)}
                      >
                        <div className="bkd-tag-icon"><Icon size={20} /></div>
                        <span>{tag.label}</span>
                        {selected && <CheckCircle2 size={14} className="bkd-tag-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Comment */}
              <div className="bkd-review-step bkd-review-step--comment">
                <div className="bkd-review-step-header">
                  <div className="bkd-review-step-num bkd-review-step-num--3">3</div>
                  <span>Nhận xét của bạn</span>
                  <span className="bkd-review-step-optional">(tùy chọn)</span>
                </div>
                <textarea
                  className={`bkd-review-textarea-large ${reviewErrors.comment ? 'bkd-input-error' : ''}`}
                  placeholder="Ví dụ: Buổi học rất bổ ích, mentor giảng giải dễ hiểu và nhiệt tình. Em đã học được nhiều điều mới..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={5}
                  maxLength={1000}
                />
                <div className="bkd-char-count-row">
                  <span className="bkd-char-hint">Tối thiểu 10 ký tự để gửi</span>
                  <span className={`bkd-char-count ${reviewComment.length < 10 ? 'bkd-char-low' : 'bkd-char-ok'}`}>
                    {reviewComment.length}/1000
                  </span>
                </div>
                {reviewErrors.comment && (
                  <p className="bkd-field-error">{reviewErrors.comment}</p>
                )}
              </div>

              {/* Actions */}
              <div className="bkd-review-form-actions">
                <button
                  className="bkd-btn bkd-btn-secondary"
                  onClick={() => { setReviewOpen(false); setReviewRating(0); setReviewTags([]); setReviewComment(''); }}
                >
                  Hủy bỏ
                </button>
                <button
                  className="bkd-btn bkd-btn-review"
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting || reviewRating === 0 || reviewComment.length < 10}
                >
                  {reviewSubmitting ? (
                    <><Loader2 size={16} className="bkd-spin" /> Đang gửi...</>
                  ) : (
                    <><Send size={16} /> Gửi đánh giá</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!review && !canReview && !reviewOpen && (
          <div className="bkd-empty-state bkd-empty-state--review">
            <Star size={28} />
            <p>Đánh giá sẽ xuất hiện sau khi buổi học hoàn thành.</p>
          </div>
        )}
      </section>

      {/* ── Dispute Section ── */}
      <section className="bkd-card bkd-dispute-section">
        <div className="bkd-card-header">
          <AlertTriangle size={18} className="bkd-card-header-icon bkd-card-header-icon--orange" />
          <h2>Tranh chấp & Bằng chứng</h2>
          {canOpenDispute && !openComposer && (
            <button className="bkd-btn bkd-btn-dispute" onClick={() => setOpenComposer(true)}>
              <ShieldAlert size={15} /> Mở tranh chấp
            </button>
          )}
        </div>

        {/* Dispute composer */}
        <AnimatePresence>
          {canOpenDispute && openComposer && (
            <motion.div
              className="bkd-dispute-composer"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bkd-dispute-composer-head">
                <h3>Mở tranh chấp</h3>
                <p>Nêu rõ vấn đề và có thể gửi kèm bằng chứng ngay trong lần gửi đầu tiên.</p>
              </div>

              <div className="bkd-dispute-field">
                <label>Lý do tranh chấp *</label>
                <textarea
                  className="bkd-dispute-textarea"
                  placeholder="Mô tả rõ lý do tranh chấp..."
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="bkd-dispute-evidence-draft">
                <div className="bkd-dispute-evidence-draft__head">
                  <strong>Bằng chứng đính kèm (tùy chọn)</strong>
                  <span>Nếu có, hệ thống sẽ gửi cùng dispute.</span>
                </div>

                <div className="bkd-dispute-field">
                  <label>Loại bằng chứng</label>
                  <select value={evidenceType} onChange={e => setEvidenceType(e.target.value as EvidenceType)}>
                    {EVIDENCE_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>

                {shouldShowEvidenceInputForComposer && (
                  <div className="bkd-dispute-field">
                    <label>Nội dung bằng chứng *</label>
                    <textarea
                      rows={4}
                      value={evidenceContent}
                      onChange={e => setEvidenceContent(e.target.value)}
                      placeholder={evidenceType === 'LINK' ? 'Dán đường dẫn bằng chứng...' : 'Nhập nội dung bằng chứng...'}
                    />
                  </div>
                )}

                {shouldShowFileInputForComposer && (
                  <div className="bkd-dispute-field">
                    <label>Tệp bằng chứng *</label>
                    {!evidenceFile ? (
                      <>
                        <button type="button" className="bkd-upload bkd-upload--full" onClick={() => composerFileInputRef.current?.click()}>
                          <FileText size={15} /> Chọn tệp đính kèm
                        </button>
                        <p className="bkd-upload-hint">Hỗ trợ ảnh, PDF, DOC, DOCX, TXT. Tối đa 20MB.</p>
                      </>
                    ) : (
                      <div className="bkd-file-preview">
                        {selectedFilePreview ? (
                          <div className="bkd-file-preview__image">
                            <img src={selectedFilePreview} alt="Preview" />
                          </div>
                        ) : (
                          <div className="bkd-file-preview__icon">
                            <FileText size={20} />
                          </div>
                        )}
                        <div className="bkd-file-preview__info">
                          <span className="bkd-file-preview__name">{evidenceFile.name}</span>
                          <span className="bkd-file-preview__size">{formatFileSize(evidenceFile.size)}</span>
                        </div>
                        <button type="button" className="bkd-file-preview__remove" onClick={() => handleEvidenceFileSelected(null)} title="Bỏ chọn">
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                    <input
                      ref={composerFileInputRef}
                      type="file"
                      hidden
                      accept={EVIDENCE_FILE_ACCEPT}
                      onChange={e => handleEvidenceFileSelected(e.target.files?.[0] || null)}
                    />
                  </div>
                )}

                <div className="bkd-dispute-field">
                  <label>Mô tả bằng chứng</label>
                  <input
                    type="text"
                    value={evidenceDescription}
                    onChange={e => setEvidenceDescription(e.target.value)}
                    placeholder="Mô tả ngắn cho bằng chứng (không bắt buộc)"
                  />
                </div>
              </div>

              <div className="bkd-dispute-composer-actions">
                <button
                  className="bkd-btn bkd-btn-secondary"
                  onClick={() => {
                    setOpenComposer(false);
                    setDisputeReason('');
                    resetEvidenceDraft();
                  }}
                  disabled={busy}
                >
                  Đóng
                </button>
                <button className="bkd-btn bkd-btn-dispute" onClick={handleOpenDispute} disabled={busy || !canSubmitOpenDispute}>
                  {busy ? <><Loader2 size={15} className="bkd-spin" /> Đang gửi...</> : <><ShieldAlert size={15} /> Gửi dispute</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dispute banner */}
        {dispute && (() => {
          const statusMeta = DISPUTE_STATUS_META[dispute.status] || { label: dispute.status, tone: 'slate' };
          const resolutionMeta = dispute.resolution ? (DISPUTE_RESOLUTION_META[dispute.resolution] || { label: dispute.resolution, tone: 'amber' }) : null;
          return (
            <div className="bkd-dispute-banner">
              <div className="bkd-dispute-banner-left">
                <div className="bkd-kicker">
                  Dispute #{dispute.id}
                  <span className={`bkd-tone-${statusMeta.tone} bkd-dispute-status-pill`}>{statusMeta.label}</span>
                </div>
                <p className="bkd-dispute-reason">{dispute.reason || 'Không có lý do bổ sung.'}</p>
              </div>
              {resolutionMeta && (
                <div className={`bkd-resolution-chip bkd-resolution-chip--${resolutionMeta.tone}`}>
                  <strong>{resolutionMeta.label}</strong>
                  <span>{safeFormatDate(dispute.resolvedAt) || 'Đang xử lý'}</span>
                </div>
              )}
            </div>
          );
        })()}

        {!dispute && !canOpenDispute && (
          <div className="bkd-empty-state">
            <ShieldAlert size={24} />
            <p>Không có tranh chấp nào cho booking này.</p>
          </div>
        )}

        {/* Evidence */}
        {dispute && (
          <div className="bkd-evidence-layout">
            <div className="bkd-evidence-list">
              {evidence.length === 0 && (
                <div className="bkd-empty-state bkd-empty-state--small">
                  <FileText size={20} />
                  <p>Chưa có bằng chứng nào được gửi.</p>
                </div>
              )}
              {evidence.map((item, idx) => {
                const typeMeta = EVIDENCE_TYPE_COLORS[item.evidenceType];
                const isOwn = item.submittedBy === currentUserId;
                return (
                  <motion.article
                    key={item.id}
                    className="bkd-evidence-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.07 }}
                  >
                    <header className="bkd-evidence-card__header">
                      <div className="bkd-evidence-card__header-left">
                        <span
                          className="bkd-evidence-type"
                          style={{ background: typeMeta.bg, color: typeMeta.color, borderColor: typeMeta.border }}
                        >
                          {EVIDENCE_TYPE_LABELS[item.evidenceType] || item.evidenceType}
                        </span>
                        <span className="bkd-evidence-author">
                          {isOwn ? 'Bạn' : `User #${item.submittedBy}`}
                        </span>
                      </div>
                      <div className="bkd-evidence-card__header-right">
                        <span className="bkd-evidence-time">{safeFormatDate(item.createdAt, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                      </div>
                    </header>
                    {item.content && (
                      <div className="bkd-evidence-content">
                        {item.evidenceType === 'LINK' ? (
                          <a href={item.content} target="_blank" rel="noreferrer" className="bkd-evidence-link">
                            <LinkIcon size={14} /> {item.content}
                          </a>
                        ) : (
                          <p>{item.content}</p>
                        )}
                      </div>
                    )}
                    {item.fileUrl && (
                      <div className="bkd-evidence-file-wrap">
                        {isImageFile(item.fileName || item.fileUrl) ? (
                          <a className="bkd-evidence-image-link" href={item.fileUrl} target="_blank" rel="noreferrer">
                            <img src={item.fileUrl} alt={item.fileName || 'Evidence'} />
                          </a>
                        ) : (
                          <a className="bkd-file-link" href={item.fileUrl} target="_blank" rel="noreferrer">
                            <FileText size={14} /> {item.fileName || 'Xem tệp đã gửi'}
                          </a>
                        )}
                      </div>
                    )}
                    {item.description && <p className="bkd-evidence-note">{item.description}</p>}
                    {item.responses?.length ? (
                      <div className="bkd-response-list">
                        {item.responses.map(response => (
                          <div key={response.id} className="bkd-response-item">
                            <div className="bkd-response-header">
                              <strong>{response.respondedByName || `User #${response.respondedBy}`}</strong>
                              <span>{safeFormatDate(response.createdAt, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                            </div>
                            <p>{response.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {dispute.status !== 'RESOLVED' && !isOwn && (
                      <div className="bkd-response-composer">
                        <textarea
                          rows={2}
                          value={responseMap[item.id] || ''}
                          onChange={e => setResponseMap(prev => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="Phản hồi bổ sung..."
                        />
                        <button
                          className="bkd-btn bkd-btn-secondary"
                          onClick={() => handleReply(item.id)}
                          disabled={replyingId === item.id || !responseMap[item.id]?.trim()}
                        >
                          {replyingId === item.id ? <Loader2 size={16} className="bkd-spin" /> : <Send size={16} />} Gửi
                        </button>
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </div>

            {/* Evidence composer */}
            {dispute.status !== 'RESOLVED' && (
              <aside className="bkd-evidence-composer">
                <h3>Bổ sung bằng chứng</h3>
                <select value={evidenceType} onChange={e => setEvidenceType(e.target.value as EvidenceType)}>
                  {EVIDENCE_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                {['TEXT', 'LINK', 'CHAT_LOG'].includes(evidenceType) && (
                  <textarea rows={5} value={evidenceContent} onChange={e => setEvidenceContent(e.target.value)} placeholder="Nhập nội dung bằng chứng..." />
                )}
                {['FILE', 'IMAGE', 'SCREENSHOT'].includes(evidenceType) && (
                  <>
                    {!evidenceFile ? (
                      <>
                        <button className="bkd-upload bkd-upload--full" onClick={() => evidenceFileInputRef.current?.click()}>
                          <FileText size={15} /> Chọn tệp đính kèm
                        </button>
                        <p className="bkd-upload-hint">Hỗ trợ ảnh, PDF, DOC, DOCX, TXT. Tối đa 20MB.</p>
                      </>
                    ) : (
                      <div className="bkd-file-preview">
                        {selectedFilePreview ? (
                          <div className="bkd-file-preview__image">
                            <img src={selectedFilePreview} alt="Preview" />
                          </div>
                        ) : (
                          <div className="bkd-file-preview__icon">
                            <FileText size={20} />
                          </div>
                        )}
                        <div className="bkd-file-preview__info">
                          <span className="bkd-file-preview__name">{evidenceFile.name}</span>
                          <span className="bkd-file-preview__size">{formatFileSize(evidenceFile.size)}</span>
                        </div>
                        <button type="button" className="bkd-file-preview__remove" onClick={() => handleEvidenceFileSelected(null)} title="Bỏ chọn">
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                    <input
                      ref={evidenceFileInputRef}
                      type="file"
                      hidden
                      accept={EVIDENCE_FILE_ACCEPT}
                      onChange={e => handleEvidenceFileSelected(e.target.files?.[0] || null)}
                    />
                  </>
                )}
                <input type="text" value={evidenceDescription} onChange={e => setEvidenceDescription(e.target.value)} placeholder="Mô tả ngắn cho bằng chứng" />
                <button className="bkd-btn bkd-btn-review" onClick={handleSubmitEvidence} disabled={busy}>
                  <Send size={15} /> Gửi bằng chứng
                </button>
              </aside>
            )}
          </div>
        )}

        {dispute?.resolutionNotes && (
          <div className="bkd-resolution-note">
            <strong>Ghi chú giải quyết</strong>
            <p>{dispute.resolutionNotes}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default BookingDetailPage;
