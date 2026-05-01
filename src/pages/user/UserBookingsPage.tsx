import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Star,
  Video,
  FileText,
  AlertTriangle,
  CheckSquare,
  ArrowRight,
  Sparkles,
  History,
  TrendingUp,
  CalendarDays,
  SlidersHorizontal,
  X,
  Map,
  Target,
  Rocket,
  User,
} from "lucide-react";
import MeowlKuruLoader from "../../components/kuru-loader/MeowlKuruLoader";
import { useNavigate } from "react-router-dom";
import {
  getMyBookings,
  downloadBookingInvoice,
  cancelBooking,
  confirmCompleteBooking,
  BookingResponse,
} from "../../services/bookingService";
import { getMyStudentReviews } from "../../services/reviewService";
import { showAppError, showAppSuccess } from "../../context/ToastContext";
import { confirmAction } from "../../context/ConfirmDialogContext";
import "../../styles/UserBookings.css";
import { useScrollToListTopOnPagination } from "../../hooks/useScrollToListTopOnPagination";

type ViewTab = "upcoming" | "history";
const USER_BOOKINGS_PAGE_SIZE = 10;
const PENDING_AUTO_CANCEL_HOURS = 24;

const BOOKING_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  ROADMAP_MENTORING: {
    label: "Đồng hành Journey",
    icon: <Map size={13} />,
    color: "#06b6d4",
  },
  NODE_MENTORING: {
    label: "Node Mentoring",
    icon: <Target size={13} />,
    color: "#8b5cf6",
  },
  JOURNEY_MENTORING: {
    label: "Journey Mentoring",
    icon: <Rocket size={13} />,
    color: "#f59e0b",
  },
  GENERAL: {
    label: "1:1 Mentoring",
    icon: <User size={13} />,
    color: "#3b82f6",
  },
};

const isRoadmapMentoring = (b: BookingResponse): boolean =>
  b.bookingType === "ROADMAP_MENTORING";

const getAutoReleaseCountdown = (
  booking: BookingResponse,
  now: Date,
): { text: string; level: "critical" | "warning" | "normal" } | null => {
  if (booking.status !== "PENDING" || !booking.createdAt) return null;
  const createdAt = new Date(booking.createdAt);
  const deadline = new Date(
    createdAt.getTime() + PENDING_AUTO_CANCEL_HOURS * 60 * 60 * 1000,
  );
  const remainingMs = deadline.getTime() - now.getTime();
  if (remainingMs <= 0)
    return { text: "Sắp tự động hoàn tiền", level: "critical" };
  const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
  const remainingMinutes = Math.floor(
    (remainingMs % (60 * 60 * 1000)) / (60 * 1000),
  );
  if (remainingHours < 2)
    return {
      text: `Còn ${remainingHours}h ${remainingMinutes}m`,
      level: "critical",
    };
  if (remainingHours < 6)
    return {
      text: `Còn ${remainingHours}h ${remainingMinutes}m`,
      level: "warning",
    };
  return { text: `Còn ${remainingHours}h chờ mentor`, level: "normal" };
};

const UserBookingsPage: React.FC = () => {
  const [viewTab, setViewTab] = useState<ViewTab>("upcoming");
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<number>>(
    new Set(),
  );
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const navigate = useNavigate();

  // Sort & Filter State
  type SortOption = "nearest" | "latest" | "price-high" | "price-low";
  const [sortBy, setSortBy] = useState<SortOption>("nearest");
  const [filterDate, setFilterDate] = useState<string>("");
  const { withPaginationScroll } = useScrollToListTopOnPagination();

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "nearest", label: "Gần nhất" },
    { value: "latest", label: "Xa nhất" },
    { value: "price-high", label: "Giá cao đến thấp" },
    { value: "price-low", label: "Giá thấp đến cao" },
  ];

  const parseBookingDate = (dateString: string): Date => {
    if (dateString.endsWith("Z") || dateString.includes("+07:00")) {
      return new Date(dateString);
    }
    return new Date(`${dateString}+07:00`);
  };

  const hasLearnerCompleted = (booking: BookingResponse) =>
    Boolean(booking.learnerCompletedAt || booking.confirmedByLearner);

  useEffect(() => {
    fetchBookings();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [currentPage]);

  // Split into upcoming vs history
  const now = currentTime;
  const upcomingBookings = bookings.filter((b) =>
    [
      "PENDING",
      "CONFIRMED",
      "ONGOING",
      "PENDING_COMPLETION",
      "DISPUTED",
    ].includes(b.status),
  );
  const historyBookings = bookings.filter((b) =>
    ["COMPLETED", "CANCELLED", "REJECTED", "REFUNDED"].includes(b.status),
  );
  const displayBookings =
    viewTab === "upcoming"
      ? (() => {
          let result = [...upcomingBookings];
          if (filterDate) {
            result = result.filter((b) => {
              const d = parseBookingDate(b.startTime);
              const startOfDay = new Date(filterDate + "T00:00:00+07:00");
              const endOfDay = new Date(filterDate + "T23:59:59+07:00");
              return d >= startOfDay && d <= endOfDay;
            });
          }
          result.sort((a, b) => {
            const timeA = parseBookingDate(a.startTime).getTime();
            const timeB = parseBookingDate(b.startTime).getTime();
            switch (sortBy) {
              case "nearest":
                return timeA - timeB;
              case "latest":
                return timeB - timeA;
              case "price-high":
                return (b.priceVnd || 0) - (a.priceVnd || 0);
              case "price-low":
                return (a.priceVnd || 0) - (b.priceVnd || 0);
              default:
                return 0;
            }
          });
          return result;
        })()
      : historyBookings.sort(
          (a, b) =>
            parseBookingDate(b.startTime).getTime() -
            parseBookingDate(a.startTime).getTime(),
        );
  const activeBookings = viewTab === "upcoming";

  const stats = {
    upcoming: upcomingBookings.length,
    pending: bookings.filter((b) => b.status === "PENDING").length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    completed: historyBookings.length,
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getMyBookings(
        false,
        currentPage,
        USER_BOOKINGS_PAGE_SIZE,
      );
      setBookings(data.content);
      setTotalPages(data.totalPages || 1);

      // Fetch reviews for completed bookings to show "Đã đánh giá" badge
      const completedIds = data.content
        .filter((b) => b.status === "COMPLETED")
        .map((b) => b.id);
      if (completedIds.length > 0) {
        try {
          const reviews = await getMyStudentReviews();
          const reviewedIds = new Set(reviews.map((r) => r.bookingId));
          setReviewedBookingIds(reviewedIds);
        } catch {
          // reviews not critical — fail silently
        }
      }
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (id: number) => {
    try {
      const blob = await downloadBookingInvoice(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `booking-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showAppError("Không thể tải hóa đơn", "Vui lòng thử lại.");
    }
  };

  const handleCancel = async (id: number) => {
    if (await confirmAction("Bạn có chắc chắn muốn hủy lịch hẹn này không?")) {
      try {
        await cancelBooking(id);
        fetchBookings();
      } catch {
        showAppError("Không thể hủy lịch hẹn", "Vui lòng thử lại sau.");
      }
    }
  };

  const handleLearnerComplete = async (id: number) => {
    if (await confirmAction("Xác nhận hoàn tất buổi học?")) {
      setConfirmingId(id);
      try {
        await confirmCompleteBooking(id);
        showAppSuccess(
          "Đã hoàn tất",
          "Buổi học đã được đánh dấu hoàn tất. Đang chờ mentor xác nhận.",
        );
        fetchBookings();
      } catch (err: any) {
        showAppError(
          "Không thể hoàn tất",
          err?.response?.data?.message || "Vui lòng thử lại sau.",
        );
      } finally {
        setConfirmingId(null);
      }
    }
  };

  const openBookingDetail = (bookingId: number) => {
    navigate(`/bookings/${bookingId}`);
  };

  const formatDateTime = (dateString: string) => {
    const date = parseBookingDate(dateString);
    return {
      date: date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "short",
      }),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      full: date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    };
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return {
          label: "Đã xác nhận",
          color: "#22c55e",
          bg: "rgba(34,197,94,0.12)",
          border: "rgba(34,197,94,0.25)",
        };
      case "PENDING":
        return {
          label: "Chờ xác nhận",
          color: "#f59e0b",
          bg: "rgba(245,158,11,0.12)",
          border: "rgba(245,158,11,0.25)",
        };
      case "CANCELLED":
        return {
          label: "Đã hủy",
          color: "#ef4444",
          bg: "rgba(239,68,68,0.1)",
          border: "rgba(239,68,68,0.2)",
        };
      case "COMPLETED":
        return {
          label: "Đã hoàn thành",
          color: "#3b82f6",
          bg: "rgba(59,130,246,0.12)",
          border: "rgba(59,130,246,0.25)",
        };
      case "REJECTED":
        return {
          label: "Bị từ chối",
          color: "#ef4444",
          bg: "rgba(239,68,68,0.1)",
          border: "rgba(239,68,68,0.2)",
        };
      case "ONGOING":
        return {
          label: "Đang diễn ra",
          color: "#8b5cf6",
          bg: "rgba(139,92,246,0.15)",
          border: "rgba(139,92,246,0.3)",
        };
      case "PENDING_COMPLETION":
        return {
          label: "Chờ xác nhận hoàn tất",
          color: "#a855f7",
          bg: "rgba(168,85,247,0.15)",
          border: "rgba(168,85,247,0.3)",
        };
      case "DISPUTED":
        return {
          label: "Đang tranh chấp",
          color: "#f97316",
          bg: "rgba(249,115,22,0.12)",
          border: "rgba(249,115,22,0.25)",
        };
      case "REFUNDED":
        return {
          label: "Đã hoàn tiền",
          color: "#94a3b8",
          bg: "rgba(148,163,184,0.1)",
          border: "rgba(148,163,184,0.15)",
        };
      default:
        return {
          label: status,
          color: "#94a3b8",
          bg: "rgba(148,163,184,0.1)",
          border: "rgba(148,163,184,0.15)",
        };
    }
  };

  const isMeetingVisible = (booking: BookingResponse): boolean => {
    if (!booking.meetingLink) return false;
    if (booking.status === "ONGOING") return true;
    if (booking.status !== "CONFIRMED") return false;
    const start = parseBookingDate(booking.startTime);
    const diffMs = start.getTime() - now.getTime();
    return diffMs <= 30 * 60 * 1000; // 30 minutes before
  };

  const getMeetingCountdown = (booking: BookingResponse): string | null => {
    if (booking.status === "ONGOING") return "Đang diễn ra";
    if (!booking.meetingLink || booking.status !== "CONFIRMED") return null;
    const start = parseBookingDate(booking.startTime);
    const diffMs = start.getTime() - now.getTime();
    if (diffMs <= 0) return "Đã đến giờ!";
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `Mở sau ${diffMin} phút`;
    const diffHours = Math.floor(diffMin / 60);
    const remainingMin = diffMin % 60;
    return `Mở sau ${diffHours}h ${remainingMin}m`;
  };

  // Check if session has ended — show complete button instead of meeting button
  const isSessionEnded = (booking: BookingResponse): boolean => {
    const end = new Date(
      parseBookingDate(booking.startTime).getTime() +
        (booking.durationMinutes || 60) * 60000,
    );
    return now.getTime() >= end.getTime();
  };

  const isUpcomingSoon = (booking: BookingResponse): boolean => {
    if (!["CONFIRMED", "PENDING"].includes(booking.status)) return false;
    const start = parseBookingDate(booking.startTime);
    const diffMs = start.getTime() - now.getTime();
    return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000; // within 24 hours
  };

  return (
    <div className="usbk-page">
      {/* Page Header */}
      <div className="usbk-page-header">
        <div className="usbk-hero">
          <div className="usbk-hero-main">
            <div className="usbk-hero-status">
              <span className="usbk-hero-status-dot" />
              Điều phối lịch hẹn đang hoạt động
            </div>
            <h2 className="usbk-hero-title">
              <Sparkles size={18} />
              Trung tâm lịch hẹn mentorship
            </h2>
            <p className="usbk-hero-description">
              Theo dõi toàn bộ phiên học, ưu tiên lịch sắp diễn ra và xử lý
              nhanh các hành động cần thiết trong một màn hình.
            </p>
          </div>
          <div className="usbk-hero-side">
            <div className="usbk-hero-chip">
              <Clock size={15} />
              Ưu tiên 24h tới
            </div>
            <div className="usbk-hero-chip">
              <CheckCircle size={15} />
              Đồng bộ trạng thái tự động
            </div>
            <button
              className="usbk-btn-primary usbk-hero-cta"
              onClick={() => navigate("/mentorship")}
            >
              Tìm mentor mới
            </button>
          </div>
        </div>

        <div className="usbk-page-header-inner">
          <div className="usbk-page-title-group">
            <h1 className="usbk-page-title">
              <Calendar size={28} />
              Lịch hẹn Mentorship
            </h1>
            <p className="usbk-page-subtitle">
              Theo dõi và quản lý các buổi học của bạn
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="usbk-stats-row">
          <div className="usbk-stat-card usbk-stat--pending">
            <div className="usbk-stat-icon">
              <Clock size={20} />
            </div>
            <div className="usbk-stat-info">
              <div className="usbk-stat-value">{stats.pending}</div>
              <div className="usbk-stat-label">Chờ xác nhận</div>
            </div>
          </div>
          <div className="usbk-stat-card usbk-stat--confirmed">
            <div className="usbk-stat-icon">
              <CheckCircle size={20} />
            </div>
            <div className="usbk-stat-info">
              <div className="usbk-stat-value">{stats.confirmed}</div>
              <div className="usbk-stat-label">Đã xác nhận</div>
            </div>
          </div>
          <div className="usbk-stat-card usbk-stat--upcoming">
            <div className="usbk-stat-icon">
              <TrendingUp size={20} />
            </div>
            <div className="usbk-stat-info">
              <div className="usbk-stat-value">{stats.upcoming}</div>
              <div className="usbk-stat-label">Sắp tới</div>
            </div>
          </div>
          <div className="usbk-stat-card usbk-stat--completed">
            <div className="usbk-stat-icon">
              <History size={20} />
            </div>
            <div className="usbk-stat-info">
              <div className="usbk-stat-value">{stats.completed}</div>
              <div className="usbk-stat-label">Đã hoàn thành</div>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="usbk-view-tabs">
          <button
            className={`usbk-view-tab ${viewTab === "upcoming" ? "active" : ""}`}
            onClick={() => setViewTab("upcoming")}
          >
            <ArrowRight size={16} />
            Sắp tới
            {stats.upcoming > 0 && (
              <span className="usbk-tab-badge">{stats.upcoming}</span>
            )}
          </button>
          <button
            className={`usbk-view-tab ${viewTab === "history" ? "active" : ""}`}
            onClick={() => setViewTab("history")}
          >
            <History size={16} />
            Lịch sử
          </button>
        </div>

        {/* Sort & Filter Bar — only on upcoming tab */}
        {viewTab === "upcoming" && (
          <div className="usbk-filter-bar">
            {/* Date filter */}
            <div className="usbk-filter-group">
              <CalendarDays size={14} />
              <input
                type="date"
                className="usbk-date-input"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                placeholder="Lọc theo ngày"
              />
              {filterDate && (
                <button
                  className="usbk-filter-clear"
                  onClick={() => setFilterDate("")}
                  title="Xóa lọc"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="usbk-filter-group usbk-filter-group--sort">
              <SlidersHorizontal size={14} />
              <div className="usbk-sort-row">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`usbk-sort-chip ${sortBy === opt.value ? "active" : ""}`}
                    onClick={() => setSortBy(opt.value)}
                  >
                    {opt.label}
                    {sortBy === opt.value && <CheckCircle size={12} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Active filter indicator */}
            {filterDate && (
              <div className="usbk-filter-tag">
                <CalendarDays size={11} />
                {new Date(filterDate + "T00:00:00+07:00").toLocaleDateString(
                  "vi-VN",
                  { day: "2-digit", month: "short" },
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="usbk-content">
        {loading ? (
          <div className="usbk-loading">
            <MeowlKuruLoader size="small" text="" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="usbk-empty">
            <Calendar size={56} strokeWidth={1.2} />
            <p>
              {activeBookings
                ? "Bạn chưa có lịch hẹn nào sắp tới."
                : "Chưa có lịch sử đặt lịch."}
            </p>
            {activeBookings && (
              <button
                className="usbk-btn-primary"
                onClick={() => navigate("/mentorship")}
              >
                Tìm Mentor ngay
              </button>
            )}
          </div>
        ) : (
          <div className="usbk-booking-list">
            {displayBookings.map((booking) => {
              const { time, full } = formatDateTime(booking.startTime);
              const learnerCompleted = hasLearnerCompleted(booking);
              const statusConfig =
                booking.status === "PENDING_COMPLETION"
                  ? {
                      ...getStatusConfig(booking.status),
                      label: learnerCompleted
                        ? "Chờ mentor xác nhận"
                        : "Chờ bạn xác nhận",
                    }
                  : getStatusConfig(booking.status);
              const meetingVisible = isMeetingVisible(booking);
              const meetingCountdown = getMeetingCountdown(booking);
              const soonBadge = isUpcomingSoon(booking);
              const isHistory = !activeBookings;
              const hasReviewed = reviewedBookingIds.has(booking.id);

              return (
                <div
                  key={booking.id}
                  className={`usbk-booking-card ${booking.status === "ONGOING" ? "usbk-card--ongoing" : ""} ${isHistory ? "usbk-card--history" : ""}`}
                >
                  {/* Card Left — Mentor Info */}
                  <div className="usbk-card-left">
                    <img
                      src={
                        booking.mentorAvatar ||
                        "https://via.placeholder.com/150"
                      }
                      alt={booking.mentorName || "Mentor"}
                      className="usbk-card-avatar"
                    />
                    <div className="usbk-card-mentor">
                      <div className="usbk-card-mentor-name">
                        {booking.mentorName || "Mentor"}
                      </div>
                      <div className="usbk-card-price">
                        {booking.priceVnd?.toLocaleString("vi-VN")} VND
                      </div>
                    </div>
                  </div>

                  {/* Card Center — Date/Time */}
                  <div className="usbk-card-center">
                    {/* Booking Type Badge */}
                    {(() => {
                      const typeConfig =
                        BOOKING_TYPE_CONFIG[booking.bookingType || "GENERAL"] ||
                        BOOKING_TYPE_CONFIG.GENERAL;
                      const isRoadmap = isRoadmapMentoring(booking);
                      return (
                        <div
                          className={`usbk-type-badge ${isRoadmap ? "usbk-type-badge--roadmap" : ""}`}
                          style={
                            {
                              "--type-color": typeConfig.color,
                            } as React.CSSProperties
                          }
                        >
                          {typeConfig.icon}
                          <span>{typeConfig.label}</span>
                        </div>
                      );
                    })()}

                    <div className="usbk-card-date">{full}</div>
                    <div className="usbk-card-time">
                      <Clock size={14} />
                      {isRoadmapMentoring(booking)
                        ? "Đến khi hoàn thành roadmap"
                        : `${time} · ${booking.durationMinutes} phút`}
                    </div>

                    {/* Auto-cancel countdown for PENDING */}
                    {(() => {
                      const autoRelease = getAutoReleaseCountdown(booking, now);
                      if (!autoRelease) return null;
                      return (
                        <div
                          className={`usbk-auto-release usbk-auto-release--${autoRelease.level}`}
                        >
                          <Clock size={11} />
                          <span>{autoRelease.text}</span>
                        </div>
                      );
                    })()}

                    {soonBadge && !isRoadmapMentoring(booking) && (
                      <div className="usbk-card-soon-badge">
                        <AlertTriangle size={12} />
                        Sắp diễn ra
                      </div>
                    )}
                  </div>

                  {/* Card Right — Status + Actions */}
                  <div className="usbk-card-right">
                    {/* Status badge */}
                    <span
                      className="usbk-status-badge"
                      style={{
                        color: statusConfig.color,
                        background: statusConfig.bg,
                        borderColor: statusConfig.border,
                      }}
                    >
                      {statusConfig.label}
                    </span>

                    {/* Meeting countdown */}
                    {meetingCountdown && (
                      <div className="usbk-meeting-countdown">
                        <Video size={13} />
                        {meetingCountdown}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="usbk-card-actions">
                      {/* Meeting link visible → show join button */}
                      {meetingVisible && (
                        <a
                          href={booking.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="usbk-btn-meeting"
                        >
                          <Video size={14} />
                          Vào phòng học
                        </a>
                      )}

                      {/* ONGOING → always show join */}
                      {booking.status === "ONGOING" && !meetingVisible && (
                        <a
                          href={booking.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="usbk-btn-meeting"
                        >
                          <Video size={14} />
                          Vào phòng học
                        </a>
                      )}

                      {/* CONFIRMED but not time yet, not ended */}
                      {booking.status === "CONFIRMED" &&
                        !meetingVisible &&
                        !isSessionEnded(booking) && (
                          <button className="usbk-btn-secondary" disabled>
                            <Clock size={14} />
                            Chờ đến giờ
                          </button>
                        )}

                      {/* Learner complete button — session ended but not yet in PENDING_COMPLETION */}
                      {(booking.status === "ONGOING" ||
                        booking.status === "CONFIRMED") &&
                        isSessionEnded(booking) && (
                          <button
                            className="usbk-btn-primary"
                            onClick={() => handleLearnerComplete(booking.id)}
                            disabled={confirmingId === booking.id}
                          >
                            <CheckCircle size={14} />
                            {confirmingId === booking.id
                              ? "Đang xử lý..."
                              : "Hoàn thành"}
                          </button>
                        )}

                      {booking.status === "PENDING" && (
                        <button
                          className="usbk-btn-danger"
                          onClick={() => handleCancel(booking.id)}
                        >
                          <XCircle size={14} />
                          Hủy
                        </button>
                      )}

                      {booking.status === "CONFIRMED" && (
                        <button
                          className="usbk-btn-danger"
                          onClick={() => handleCancel(booking.id)}
                        >
                          <XCircle size={14} />
                          Hủy
                        </button>
                      )}

                      {booking.status === "PENDING_COMPLETION" && (
                        <>
                          {learnerCompleted && (
                            <span
                              className="usbk-status-badge"
                              style={{
                                color: statusConfig.color,
                                background: statusConfig.bg,
                                borderColor: statusConfig.border,
                              }}
                            >
                              Chờ mentor xác nhận
                            </span>
                          )}
                          {!learnerCompleted && (
                            <button
                              className="usbk-btn-primary"
                              onClick={() => handleLearnerComplete(booking.id)}
                              disabled={confirmingId === booking.id}
                            >
                              <CheckCircle size={14} />
                              {confirmingId === booking.id
                                ? "Đang xử lý..."
                                : "Xác nhận hoàn tất"}
                            </button>
                          )}
                          <button
                            className="usbk-btn-dispute"
                            onClick={() => openBookingDetail(booking.id)}
                          >
                            <AlertTriangle size={14} />
                            Tranh chấp
                          </button>
                        </>
                      )}

                      {booking.status === "COMPLETED" && (
                        <>
                          {hasReviewed ? (
                            <span className="usbk-reviewed-badge">
                              <CheckSquare size={13} />
                              Đã đánh giá
                            </span>
                          ) : (
                            <button
                              className="usbk-btn-review"
                              onClick={() => openBookingDetail(booking.id)}
                            >
                              <Star size={14} />
                              Đánh giá
                            </button>
                          )}
                          <button
                            className="usbk-btn-secondary"
                            onClick={() => handleDownloadInvoice(booking.id)}
                          >
                            <FileText size={14} />
                            Hóa đơn
                          </button>
                        </>
                      )}

                      {booking.status === "DISPUTED" && (
                        <button
                          className="usbk-btn-secondary"
                          onClick={() => openBookingDetail(booking.id)}
                        >
                          <AlertTriangle size={14} />
                          Xem tranh chấp
                        </button>
                      )}

                      {booking.paymentReference && (
                        <button
                          className="usbk-btn-secondary"
                          onClick={() => handleDownloadInvoice(booking.id)}
                        >
                          <FileText size={14} />
                          Hóa đơn
                        </button>
                      )}

                      <button
                        className="usbk-btn-secondary"
                        onClick={() => openBookingDetail(booking.id)}
                      >
                        <ArrowRight size={14} />
                        Chi tiết
                      </button>

                      <button
                        className="usbk-btn-message"
                        onClick={() =>
                          navigate("/messages", {
                            state: {
                              openChatWith: booking.id,
                              bookingId: booking.id,
                              counterpartId: booking.mentorId,
                              name: booking.mentorName,
                              avatar: booking.mentorAvatar,
                              type: "MENTOR",
                              chatEnabled: booking.chatAllowed,
                              bookingStatus: booking.status,
                              bookingStartTime: booking.startTime,
                              bookingEndTime: booking.endTime,
                            },
                          })
                        }
                        disabled={!booking.chatAllowed}
                        title={
                          booking.chatAllowed
                            ? "Mo mentor chat"
                            : "Booking da dong chat"
                        }
                      >
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="usbk-pagination">
            <button
              onClick={withPaginationScroll(() =>
                setCurrentPage((p) => Math.max(0, p - 1)),
              )}
              disabled={currentPage === 0}
              className="usbk-pagination-btn"
            >
              ← Trước
            </button>
            <span className="usbk-pagination-info">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={withPaginationScroll(() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              )}
              disabled={currentPage >= totalPages - 1}
              className="usbk-pagination-btn"
            >
              Sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBookingsPage;
