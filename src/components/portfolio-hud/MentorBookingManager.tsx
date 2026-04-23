import React, { useState, useEffect, useMemo, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  User,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  CheckSquare,
  AlertCircle,
  RefreshCw,
  X,
  Eye,
  LayoutList,
  Grid3X3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import { motion, AnimatePresence } from "framer-motion";
import {
  getMyBookings,
  approveBooking,
  rejectBooking,
  startMeeting,
  completeBooking,
  downloadBookingInvoice,
  BookingResponse,
} from "../../services/bookingService";
import NodeMentoringWorkspace from "../../components/mentor/NodeMentoringWorkspace";
import { confirmAction } from "../../context/ConfirmDialogContext";
import {
  onBookingSyncMessage,
  broadcastBookingChanged,
} from "../../utils/bookingSync";
import { showAppError, showAppSuccess } from "../../context/ToastContext";
import "./MentorBookingManager.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "pending" | "upcoming" | "history";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  getCount: (b: BookingResponse[]) => number;
}

type ViewMode = "grid" | "list";

// ─── Helpers ────────────────────────────────────────────────────────────────

const parseBookingDate = (dateStr: string): Date => {
  if (dateStr.endsWith("Z") || dateStr.includes("+07:00"))
    return new Date(dateStr);
  const [datePart, timePart] = dateStr.split("T");
  return new Date(`${datePart}T${timePart}+07:00`);
};

const getBookingEndTime = (b: BookingResponse): Date => {
  const start = parseBookingDate(b.startTime);
  return new Date(start.getTime() + (b.durationMinutes || 60) * 60 * 1000);
};

const sortBookings = (
  list: BookingResponse[],
  now: Date,
  tab: TabId,
): BookingResponse[] => {
  const urgency = (b: BookingResponse): number => {
    if (tab === "pending") {
      // PENDING: oldest first (waiting longest = most urgent)
      return -parseBookingDate(b.startTime).getTime();
    }
    // Upcoming: soonest first
    return parseBookingDate(b.startTime).getTime() - now.getTime();
  };
  return [...list].sort((a, b) => urgency(a) - urgency(b));
};

const statusConfig: Record<
  string,
  { label: string; cls: string; accent: string }
> = {
  PENDING: { label: "Chờ duyệt", cls: "pending", accent: "#f59e0b" },
  CONFIRMED: { label: "Đã xác nhận", cls: "confirmed", accent: "#3b82f6" },
  ONGOING: { label: "Đang học", cls: "ongoing", accent: "#8b5cf6" },
  MENTORING_ACTIVE: {
    label: "Đang mentoring",
    cls: "mentoring-active",
    accent: "#06b6d4",
  },
  PENDING_COMPLETION: {
    label: "Chờ xác nhận",
    cls: "pending-completion",
    accent: "#a855f7",
  },
  COMPLETED: { label: "Hoàn thành", cls: "completed", accent: "#22c55e" },
  REJECTED: { label: "Từ chối", cls: "rejected", accent: "#ef4444" },
  CANCELLED: { label: "Đã hủy", cls: "cancelled", accent: "#64748b" },
  DISPUTED: { label: "Khiếu nại", cls: "disputed", accent: "#fb923c" },
  REFUNDED: { label: "Đã hoàn tiền", cls: "refunded", accent: "#475569" },
};

const BOOKING_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  ROADMAP_MENTORING: {
    label: "Đồng hành Roadmap",
    icon: "🗺️",
    color: "#06b6d4",
  },
  NODE_MENTORING: { label: "Node Mentoring", icon: "🎯", color: "#8b5cf6" },
  JOURNEY_MENTORING: {
    label: "Journey Mentoring",
    icon: "🚀",
    color: "#f59e0b",
  },
  GENERAL: { label: "1:1 Mentoring", icon: "👤", color: "#3b82f6" },
};

const PENDING_AUTO_CANCEL_HOURS = 24;

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
  if (remainingMs <= 0) return { text: "Sắp tự động hủy", level: "critical" };
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
  return { text: `Còn ${remainingHours}h để duyệt`, level: "normal" };
};

const isRoadmapMentoring = (b: BookingResponse): boolean =>
  b.bookingType === "ROADMAP_MENTORING";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n,
  );

const formatDate = (str: string) => {
  const d = parseBookingDate(str);
  return d.toLocaleString("vi-VN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateFull = (str: string) => {
  const d = parseBookingDate(str);
  return d.toLocaleString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Recharts tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="mbm-tooltip">
      <p className="mbm-tooltip-label">{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ color: e.color }}>
          {e.name}:{" "}
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(e.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Component ──────────────────────────────────────────────────────────────

const MentorBookingManager: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [now, setNow] = useState(new Date());
  const [rejectModal, setRejectModal] = useState<BookingResponse | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [localMentorCompleted, setLocalMentorCompleted] = useState<Set<number>>(
    new Set(),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  // ── Node Mentoring Workspace state ─────────────────────────────────────────
  const [mentoringWorkspace, setMentoringWorkspace] = useState<{
    isOpen: boolean;
    booking: BookingResponse | null;
  }>({ isOpen: false, booking: null });

  // Helper: Check if booking has node/journey context
  const hasMentoringContext = (b: BookingResponse): boolean => {
    return !!(
      b.journeyId &&
      (b.nodeId || b.bookingType === "JOURNEY_MENTORING")
    );
  };

  // Helper: Get booking type config
  const getBookingTypeConfig = (b: BookingResponse) => {
    return (
      BOOKING_TYPE_CONFIG[b.bookingType || "GENERAL"] ||
      BOOKING_TYPE_CONFIG.GENERAL
    );
  };

  // ── Live clock + sync ──────────────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30000);
    const unsub = onBookingSyncMessage(fetchBookings);
    return () => {
      clearInterval(tick);
      unsub();
    };
  }, []);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let page = 0,
        total = 1;
      const all: BookingResponse[] = [];
      do {
        const r = await getMyBookings(true, page, 100);
        all.push(...(r.content || []));
        total = r.totalPages || 1;
        page++;
      } while (page < total);
      setBookings(all);
    } catch {
      setError("Không thể tải danh sách booking.");
    } finally {
      setLoading(false);
    }
  };

  // ── Effective status (local override for optimistic complete) ─────────────
  const getStatus = useCallback(
    (b: BookingResponse) =>
      localMentorCompleted.has(b.id) ? "PENDING_COMPLETION" : b.status,
    [localMentorCompleted],
  );

  // ── Booking helpers ───────────────────────────────────────────────────────
  const canStart = (b: BookingResponse): boolean => {
    if (getStatus(b) !== "CONFIRMED") return false;
    const diff =
      (parseBookingDate(b.startTime).getTime() - now.getTime()) / 60000;
    return diff <= 30 && now.getTime() <= getBookingEndTime(b).getTime();
  };

  const isExpired = (b: BookingResponse): boolean => {
    if (!["CONFIRMED", "ONGOING"].includes(getStatus(b))) return false;
    return now.getTime() > getBookingEndTime(b).getTime();
  };

  const canComplete = (b: BookingResponse): boolean =>
    ["CONFIRMED", "ONGOING"].includes(getStatus(b)) &&
    now.getTime() >= getBookingEndTime(b).getTime() &&
    !localMentorCompleted.has(b.id);

  const canMentorConfirm = (b: BookingResponse): boolean =>
    getStatus(b) === "PENDING_COMPLETION" && !b.mentorCompletedAt;

  const getDeadlineInfo = (b: BookingResponse) => {
    const start = parseBookingDate(b.startTime);
    const status = getStatus(b);

    if (status === "ONGOING") return { text: "Đang diễn ra", level: "live" };

    if (status === "CONFIRMED") {
      const diffMs = start.getTime() - now.getTime();
      const diffMin = diffMs / 60000;
      const diffH = diffMin / 60;
      const diffD = diffH / 24;
      if (diffMin <= 15 && diffMin > 0)
        return {
          text: `Bắt đầu sau ${Math.round(diffMin)} phút`,
          level: "critical",
        };
      if (diffH <= 1)
        return {
          text: `Bắt đầu sau ${Math.round(diffMin)} phút`,
          level: "urgent",
        };
      if (diffH <= 24)
        return {
          text: `Bắt đầu sau ${Math.round(diffH)} giờ`,
          level: "warning",
        };
      if (diffD > 0)
        return { text: `Còn ${Math.round(diffD)} ngày`, level: "normal" };
    }

    if (status === "PENDING") {
      const diffH = (start.getTime() - now.getTime()) / 3600000;
      if (diffH <= 2)
        return { text: `Hẹn trong ${Math.round(diffH)} giờ`, level: "urgent" };
    }

    return null;
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const pending = bookings.filter((b) => b.status === "PENDING");
  const upcoming = bookings.filter((b) =>
    ["CONFIRMED", "ONGOING", "PENDING_COMPLETION"].includes(b.status),
  );
  const thisMonth = bookings.filter((b) => {
    if (b.status !== "COMPLETED") return false;
    const d = parseBookingDate(b.startTime);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const earnings = thisMonth.reduce((s, b) => s + (b.priceVnd || 0), 0);

  // ── Revenue chart data ────────────────────────────────────────────────────
  const revenueData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const label = d.toLocaleDateString("vi-VN", {
        month: "short",
        year: "2-digit",
      });
      const val = bookings
        .filter(
          (b) =>
            b.status === "COMPLETED" &&
            parseBookingDate(b.startTime).getMonth() === d.getMonth(),
        )
        .reduce((s, b) => s + (b.priceVnd || 0) * 0.8, 0);
      return { month: label, "Thu nhập": Math.round(val) };
    });
  }, [bookings]);

  // ── Pie data ───────────────────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const rows: { name: string; value: number; color: string }[] = [
      {
        name: "Hoàn thành",
        value: bookings.filter((b) => b.status === "COMPLETED").length,
        color: "#22c55e",
      },
      {
        name: "Chờ duyệt",
        value: bookings.filter((b) => b.status === "PENDING").length,
        color: "#f59e0b",
      },
      {
        name: "Đã xác nhận",
        value: bookings.filter((b) => b.status === "CONFIRMED").length,
        color: "#3b82f6",
      },
      {
        name: "Đang học",
        value: bookings.filter((b) => b.status === "ONGOING").length,
        color: "#8b5cf6",
      },
      {
        name: "Chờ xác nhận",
        value: bookings.filter((b) => b.status === "PENDING_COMPLETION").length,
        color: "#a855f7",
      },
      {
        name: "Từ chối",
        value: bookings.filter((b) => b.status === "REJECTED").length,
        color: "#ef4444",
      },
      {
        name: "Đã hủy",
        value: bookings.filter((b) => b.status === "CANCELLED").length,
        color: "#64748b",
      },
      {
        name: "Khiếu nại",
        value: bookings.filter((b) => b.status === "DISPUTED").length,
        color: "#fb923c",
      },
      {
        name: "Đã hoàn tiền",
        value: bookings.filter((b) => b.status === "REFUNDED").length,
        color: "#94a3b8",
      },
    ];
    return rows.filter((d) => d.value > 0);
  }, [bookings]);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const tabs: Tab[] = useMemo(
    () => [
      {
        id: "pending",
        label: "Cần duyệt",
        icon: <AlertCircle size={17} />,
        getCount: (list) => list.filter((b) => b.status === "PENDING").length,
      },
      {
        id: "upcoming",
        label: "Sắp diễn ra",
        icon: <Calendar size={17} />,
        getCount: (list) =>
          list.filter((b) =>
            ["CONFIRMED", "ONGOING", "PENDING_COMPLETION"].includes(b.status),
          ).length,
      },
      {
        id: "history",
        label: "Lịch sử",
        icon: <CheckSquare size={17} />,
        getCount: (list) =>
          list.filter((b) =>
            [
              "COMPLETED",
              "CANCELLED",
              "REJECTED",
              "REFUNDED",
              "DISPUTED",
            ].includes(b.status),
          ).length,
      },
    ],
    [],
  );

  // ── Filtered bookings ────────────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = bookings.filter((b) => {
      const s = getStatus(b);
      const tabCond =
        activeTab === "pending"
          ? s === "PENDING"
          : activeTab === "upcoming"
            ? ["CONFIRMED", "ONGOING", "PENDING_COMPLETION"].includes(s)
            : [
                "COMPLETED",
                "CANCELLED",
                "REJECTED",
                "REFUNDED",
                "DISPUTED",
              ].includes(s);
      if (!tabCond) return false;
      if (!term) return true;
      return (
        (b.learnerName || "").toLowerCase().includes(term) ||
        (b.paymentReference || "").toLowerCase().includes(term) ||
        `#${b.id}`.includes(term)
      );
    });
    return sortBookings(base, now, activeTab);
  }, [bookings, activeTab, searchTerm, now, getStatus]);

  // ── Action handlers ──────────────────────────────────────────────────────
  const handleApprove = async (id: number) => {
    try {
      await approveBooking(id);
      showAppSuccess("Đã duyệt", "Booking đã được duyệt!");
      fetchBookings();
    } catch {
      showAppError("Lỗi duyệt", "Không thể duyệt booking");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal || rejectReason.trim().length < 5) return;
    setRejectSubmitting(true);
    try {
      await rejectBooking(rejectModal.id, rejectReason.trim());
      showAppSuccess("Đã từ chối", "Booking đã bị từ chối.");
      setRejectModal(null);
      fetchBookings();
    } catch {
      showAppError("Lỗi", "Không thể từ chối");
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleStart = async (b: BookingResponse) => {
    if (b.meetingLink) {
      window.open(b.meetingLink, "_blank");
      return;
    }
    try {
      const upd = await startMeeting(b.id);
      const link = upd.meetingLink || `https://meet.jit.si/SkillVerse-${b.id}`;
      window.open(link, "_blank");
      fetchBookings();
    } catch {
      showAppError("Lỗi", "Không thể bắt đầu buổi học");
    }
  };

  const handleComplete = async (id: number) => {
    if (!(await confirmAction("Xác nhận hoàn thành buổi học?"))) return;
    setLocalMentorCompleted((p) => new Set([...p, id]));
    try {
      await completeBooking(id);
      broadcastBookingChanged(id, "PENDING_COMPLETION");
      showAppSuccess(
        "Đã hoàn thành",
        "Buổi học đã hoàn thành. Chờ learner xác nhận.",
      );
    } catch {
      setLocalMentorCompleted((p) => {
        const n = new Set(p);
        n.delete(id);
        return n;
      });
      showAppError("Lỗi", "Không thể hoàn thành booking");
    }
  };

  const handleInvoice = async (id: number) => {
    try {
      const blob = await downloadBookingInvoice(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `booking-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showAppError("Lỗi", "Không thể tải hóa đơn");
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderCard = (b: BookingResponse) => {
    const deadline = getDeadlineInfo(b);
    const status = getStatus(b);
    const sc = statusConfig[status] || {
      label: status,
      cls: "pending",
      accent: "#64748b",
    };
    const expired = isExpired(b);
    const live = status === "ONGOING";

    return (
      <motion.div
        key={b.id}
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={[
          "mbm-card",
          live ? "mbm-card--live" : "",
          expired ? "mbm-card--expired" : "",
          status === "PENDING" ? "mbm-card--pending" : "",
          status === "CONFIRMED" && canStart(b) ? "mbm-card--ready" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Live top bar */}
        {live && (
          <div className="mbm-card-live-bar">
            <span className="mbm-live-dot" />
            Đang diễn ra
          </div>
        )}

        {/* Booking Type Badge */}
        {(() => {
          const typeConfig = getBookingTypeConfig(b);
          const isRoadmap = isRoadmapMentoring(b);
          return (
            <div
              className={`mbm-card-type-badge ${isRoadmap ? "mbm-card-type-badge--roadmap" : ""}`}
              style={
                { "--type-color": typeConfig.color } as React.CSSProperties
              }
            >
              <span className="mbm-type-icon">{typeConfig.icon}</span>
              <span className="mbm-type-label">{typeConfig.label}</span>
            </div>
          );
        })()}

        {/* Header */}
        <div className="mbm-card-hdr">
          <div className="mbm-card-hdr-left">
            <div className="mbm-avatar">
              {b.learnerAvatar ? (
                <img src={b.learnerAvatar} alt="" />
              ) : (
                <User size={20} />
              )}
            </div>
            <div className="mbm-card-hdr-info">
              <h3 className="mbm-card-name">
                {b.learnerName || `Learner #${b.learnerId}`}
              </h3>
              <div className="mbm-card-id">#{b.id}</div>
            </div>
          </div>
          <div className="mbm-card-hdr-right">
            <span className={`mbm-badge mbm-badge--${sc.cls}`}>{sc.label}</span>
            <div className="mbm-card-price">
              <DollarSign size={13} />
              {formatCurrency(b.priceVnd)}
            </div>
          </div>
        </div>

        {/* Auto-cancel countdown for PENDING */}
        {(() => {
          const autoRelease = getAutoReleaseCountdown(b, now);
          if (!autoRelease) return null;
          return (
            <div
              className={`mbm-card-auto-release mbm-auto-release--${autoRelease.level}`}
            >
              <AlertCircle size={12} />
              <span>{autoRelease.text} để duyệt</span>
            </div>
          );
        })()}

        {/* Deadline ribbon */}
        {deadline && (
          <div className={`mbm-card-deadline mbm-deadline--${deadline.level}`}>
            <Clock size={12} />
            {deadline.text}
          </div>
        )}

        {/* Body */}
        <div className="mbm-card-body">
          {/* Node/Journey Context */}
          {hasMentoringContext(b) && (
            <div className="mbm-card-context">
              <div className="mbm-context-item">
                <span className="mbm-context-badge">Node Mentoring</span>
                {b.journeyId && (
                  <span className="mbm-context-detail">
                    Journey #{b.journeyId}
                  </span>
                )}
                {b.nodeId && (
                  <span className="mbm-context-detail">Node: {b.nodeId}</span>
                )}
              </div>
            </div>
          )}

          <div className="mbm-card-datetime">
            <Calendar size={14} />
            <span>{formatDate(b.startTime)}</span>
          </div>
          <div className="mbm-card-meta">
            <Clock size={14} />
            <span>
              {isRoadmapMentoring(b)
                ? "Đến khi hoàn thành roadmap"
                : `${b.durationMinutes} phút`}
            </span>
            {b.meetingLink && !isRoadmapMentoring(b) && (
              <>
                <Video size={14} className="mbm-meta-video" />
                <span className="mbm-meta-ready">Phòng họp sẵn sàng</span>
              </>
            )}
            {b.paymentReference && (
              <>
                <CheckCircle size={14} className="mbm-meta-paid" />
                <span className="mbm-meta-ready">Đã thanh toán</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mbm-card-actions">
          {status === "PENDING" && (
            <>
              <button
                className="mbm-btn mbm-btn-approve"
                onClick={() => handleApprove(b.id)}
              >
                <CheckCircle size={14} /> Duyệt
              </button>
              <button
                className="mbm-btn mbm-btn-reject"
                onClick={() => setRejectModal(b)}
              >
                <XCircle size={14} /> Từ chối
              </button>
            </>
          )}

          {status === "CONFIRMED" && canStart(b) && (
            <button
              className="mbm-btn mbm-btn-join"
              onClick={() => handleStart(b)}
            >
              <Video size={14} />
              {b.meetingLink ? "Vào phòng học" : "Tạo phòng họp"}
            </button>
          )}

          {status === "ONGOING" && b.meetingLink && (
            <button
              className="mbm-btn mbm-btn-join"
              onClick={() => handleStart(b)}
            >
              <Video size={14} /> Vào phòng học
            </button>
          )}

          {canComplete(b) && (
            <button
              className="mbm-btn mbm-btn-complete"
              onClick={() => handleComplete(b.id)}
            >
              <CheckCircle size={14} /> Hoàn thành
            </button>
          )}

          {expired && status === "CONFIRMED" && (
            <span className="mbm-card-expired-hint">
              <AlertCircle size={13} /> Đã quá giờ
            </span>
          )}

          {status === "PENDING_COMPLETION" && canMentorConfirm(b) && (
            <button
              className="mbm-btn mbm-btn-complete"
              onClick={() => handleComplete(b.id)}
            >
              <CheckCircle size={14} /> Hoàn tất
            </button>
          )}

          {status === "PENDING_COMPLETION" && !canMentorConfirm(b) && (
            <span className="mbm-card-waiting-hint">
              <Clock size={13} /> Chờ learner xác nhận
            </span>
          )}

          {status === "DISPUTED" && (
            <span className="mbm-card-disputed-hint">
              <AlertCircle size={13} /> Đang có tranh chấp
            </span>
          )}

          {(status === "COMPLETED" || b.paymentReference) && (
            <button
              className="mbm-btn mbm-btn-ghost"
              onClick={() => handleInvoice(b.id)}
            >
              <FileText size={14} /> Hóa đơn
            </button>
          )}

          {/* Mentoring Workspace button for node/journey bookings */}
          {hasMentoringContext(b) && (
            <button
              className="mbm-btn mbm-btn-mentoring"
              onClick={() =>
                setMentoringWorkspace({ isOpen: true, booking: b })
              }
              title="Mở Node Mentoring Workspace"
            >
              <span className="mbm-mentoring-icon">🎯</span> Mentoring
            </button>
          )}

          <button
            className="mbm-btn mbm-btn-ghost"
            onClick={() => navigate(`/bookings/${b.id}`)}
          >
            <Eye size={14} /> Chi tiết
          </button>
        </div>
      </motion.div>
    );
  };

  const renderListRow = (b: BookingResponse) => {
    const deadline = getDeadlineInfo(b);
    const status = getStatus(b);
    const sc = statusConfig[status] || {
      label: status,
      cls: "pending",
      accent: "#64748b",
    };
    const live = status === "ONGOING";

    return (
      <motion.div
        key={b.id}
        layout
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        className={[
          "mbm-list-row",
          live ? "mbm-list-row--live" : "",
          status === "PENDING" ? "mbm-list-row--pending" : "",
          status === "CONFIRMED" && canStart(b) ? "mbm-list-row--ready" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Col 1: Avatar + Name */}
        <div className="mbm-list-col mbm-list-col--learner">
          <div className="mbm-list-avatar">
            {b.learnerAvatar ? (
              <img src={b.learnerAvatar} alt="" />
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="mbm-list-name">
            <span className="mbm-list-name-text">
              {b.learnerName || `Learner #${b.learnerId}`}
            </span>
            <span className="mbm-list-id">#{b.id}</span>
          </div>
        </div>

        {/* Col 2: Date + time */}
        <div className="mbm-list-col mbm-list-col--datetime">
          <div className="mbm-list-row-meta">
            <Calendar size={12} />
            <span>{formatDate(b.startTime)}</span>
          </div>
          <div className="mbm-list-row-meta mbm-list-row-meta--dim">
            <Clock size={12} />
            <span>{b.durationMinutes} phút</span>
          </div>
        </div>

        {/* Col 3: Status */}
        <div className="mbm-list-col mbm-list-col--status">
          <span className={`mbm-badge mbm-badge--${sc.cls}`}>{sc.label}</span>
          {deadline && (
            <span
              className={`mbm-list-deadline mbm-deadline--${deadline.level}`}
            >
              {deadline.text}
            </span>
          )}
          {live && <span className="mbm-list-live-dot" />}
        </div>

        {/* Col 4: Price */}
        <div className="mbm-list-col mbm-list-col--price">
          <span className="mbm-list-price">{formatCurrency(b.priceVnd)}</span>
        </div>

        {/* Col 5: Actions */}
        <div className="mbm-list-col mbm-list-col--actions">
          {status === "PENDING" && (
            <>
              <button
                className="mbm-btn mbm-btn-approve mbm-btn-sm"
                onClick={() => handleApprove(b.id)}
                title="Duyệt"
              >
                <CheckCircle size={13} />
              </button>
              <button
                className="mbm-btn mbm-btn-reject mbm-btn-sm"
                onClick={() => setRejectModal(b)}
                title="Từ chối"
              >
                <XCircle size={13} />
              </button>
            </>
          )}
          {status === "CONFIRMED" && canStart(b) && (
            <button
              className="mbm-btn mbm-btn-join mbm-btn-sm"
              onClick={() => handleStart(b)}
              title="Vào phòng học"
            >
              <Video size={13} />
            </button>
          )}
          {canComplete(b) && (
            <button
              className="mbm-btn mbm-btn-complete mbm-btn-sm"
              onClick={() => handleComplete(b.id)}
              title="Hoàn thành"
            >
              <CheckCircle size={13} />
            </button>
          )}
          <button
            className="mbm-btn mbm-btn-ghost mbm-btn-sm"
            onClick={() => navigate(`/bookings/${b.id}`)}
            title="Chi tiết"
          >
            <Eye size={13} />
          </button>
        </div>
      </motion.div>
    );
  };

  const totalCount = tabs.reduce((acc, t) => acc + t.getCount(bookings), 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mbm-container">
      {/* Header */}
      <div className="mbm-header">
        <div className="mbm-header-title">
          <LayoutList size={22} className="mbm-header-icon" />
          <h2>Quản Lý Booking</h2>
          <span className="mbm-header-total">{totalCount} booking</span>
        </div>
        <button
          className="mbm-refresh-btn"
          onClick={fetchBookings}
          title="Làm mới"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Stats row */}
      <div className="mbm-stats-row">
        <div
          className="mbm-stat-card mbm-stat-card--pending"
          onClick={() => setActiveTab("pending")}
        >
          <div className="mbm-stat-icon">
            <AlertCircle size={22} />
          </div>
          <div className="mbm-stat-body">
            <span className="mbm-stat-num">{pending.length}</span>
            <span className="mbm-stat-lbl">Chờ duyệt</span>
          </div>
          {pending.length > 0 && <div className="mbm-stat-pulse" />}
        </div>

        <div
          className="mbm-stat-card mbm-stat-card--upcoming"
          onClick={() => setActiveTab("upcoming")}
        >
          <div className="mbm-stat-icon">
            <Calendar size={22} />
          </div>
          <div className="mbm-stat-body">
            <span className="mbm-stat-num">{upcoming.length}</span>
            <span className="mbm-stat-lbl">Sắp diễn ra</span>
          </div>
        </div>

        <div
          className="mbm-stat-card mbm-stat-card--done"
          onClick={() => setActiveTab("history")}
        >
          <div className="mbm-stat-icon">
            <CheckSquare size={22} />
          </div>
          <div className="mbm-stat-body">
            <span className="mbm-stat-num">{thisMonth.length}</span>
            <span className="mbm-stat-lbl">Hoàn thành tháng này</span>
          </div>
        </div>

        <div className="mbm-stat-card mbm-stat-card--income">
          <div className="mbm-stat-icon">
            <TrendingUp size={22} />
          </div>
          <div className="mbm-stat-body">
            <span className="mbm-stat-num">
              {formatCurrency(earnings * 0.8)}
            </span>
            <span className="mbm-stat-lbl">Thu nhập tháng này</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mbm-charts-grid">
        <div className="mbm-chart-card">
          <div className="mbm-chart-hdr">
            <TrendingUp size={16} />
            <span>Xu Hướng Thu Nhập (6 tháng)</span>
          </div>
          <div className="mbm-chart-body">
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="mbmIG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="2 2"
                  stroke="rgba(255,255,255,0.04)"
                />
                <XAxis dataKey="month" stroke="#475569" fontSize={11} />
                <YAxis
                  stroke="#475569"
                  fontSize={10}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Thu nhập"
                  stroke="#06b6d4"
                  fill="url(#mbmIG)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mbm-chart-card">
          <div className="mbm-chart-hdr">
            <Users size={16} />
            <span>Phân Bổ Trạng Thái</span>
          </div>
          <div className="mbm-chart-body">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mbm-pie-legend">
              {pieData.map((e, i) => (
                <div key={i} className="mbm-pie-item">
                  <span
                    className="mbm-pie-dot"
                    style={{ background: e.color }}
                  />
                  <span className="mbm-pie-lbl">{e.name}</span>
                  <span className="mbm-pie-val">{e.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mbm-tabs-wrap">
        <div className="mbm-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`mbm-tab ${activeTab === t.id ? "mbm-tab--active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
              <span
                className={`mbm-tab-count ${t.getCount(bookings) > 0 ? "mbm-tab-count--hot" : ""}`}
              >
                {t.getCount(bookings)}
              </span>
            </button>
          ))}
        </div>

        <div className="mbm-tabs-right">
          <input
            className="mbm-search"
            placeholder="Tìm học viên, mã booking..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="mbm-view-toggle">
            <button
              className={`mbm-view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Lưới"
            >
              <Grid3X3 size={15} />
            </button>
            <button
              className={`mbm-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="Danh sách"
            >
              <LayoutList size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mbm-content">
        {loading && bookings.length === 0 ? (
          <div className="mbm-loading">
            <MeowlKuruLoader size="medium" text="" />
          </div>
        ) : error ? (
          <div className="mbm-error">{error}</div>
        ) : filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mbm-empty"
          >
            <Calendar size={52} />
            <p>Không có booking nào trong mục này.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {(() => {
              const totalPages = Math.max(
                1,
                Math.ceil(filteredBookings.length / PAGE_SIZE),
              );
              const safePage = Math.min(currentPage, totalPages);
              const pageSlice = filteredBookings.slice(
                (safePage - 1) * PAGE_SIZE,
                safePage * PAGE_SIZE,
              );
              const start = (safePage - 1) * PAGE_SIZE + 1;
              const end = Math.min(
                safePage * PAGE_SIZE,
                filteredBookings.length,
              );

              return (
                <>
                  {viewMode === "grid" ? (
                    <div className="mbm-grid">{pageSlice.map(renderCard)}</div>
                  ) : (
                    <div className="mbm-list">
                      <div className="mbm-list-head">
                        <span>
                          <User size={12} /> Học viên
                        </span>
                        <span>
                          <Calendar size={12} /> Thời gian
                        </span>
                        <span>
                          <AlertCircle size={12} /> Trạng thái
                        </span>
                        <span>
                          <DollarSign size={12} /> Giá
                        </span>
                        <span>
                          <Eye size={12} /> Thao tác
                        </span>
                      </div>
                      {pageSlice.map(renderListRow)}
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="mbm-pagination">
                      <button
                        className="mbm-btn mbm-btn-ghost mbm-btn-sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={safePage === 1}
                      >
                        ← Trước
                      </button>
                      <div className="mbm-pagination-pages">
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((p) => (
                          <button
                            key={p}
                            className={`mbm-pagination-page ${p === safePage ? "active" : ""}`}
                            onClick={() => setCurrentPage(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <button
                        className="mbm-btn mbm-btn-ghost mbm-btn-sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={safePage >= totalPages}
                      >
                        Sau →
                      </button>
                      <span className="mbm-pagination-info">
                        {filteredBookings.length > 0
                          ? `${start}–${end} / ${filteredBookings.length}`
                          : "0 / 0"}
                      </span>
                    </div>
                  )}
                </>
              );
            })()}
          </AnimatePresence>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal &&
          ReactDOM.createPortal(
            <motion.div
              className="mbm-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setRejectModal(null);
              }}
            >
              <motion.div
                className="mbm-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="mbm-modal-hdr">
                  <div className="mbm-modal-title">
                    <XCircle size={20} />
                    Từ Chối Booking
                  </div>
                  <button
                    className="mbm-modal-close"
                    onClick={() => setRejectModal(null)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mbm-modal-body">
                  <p className="mbm-modal-desc">
                    Từ chối booking của{" "}
                    <strong>
                      {rejectModal.learnerName ||
                        `Learner #${rejectModal.learnerId}`}
                    </strong>{" "}
                    —{formatDateFull(rejectModal.startTime)} —{" "}
                    <strong>{formatCurrency(rejectModal.priceVnd)}</strong>.
                  </p>
                  <div className="mbm-form-group">
                    <label className="mbm-form-label">
                      Lý do từ chối <span className="mbm-req">*</span>
                    </label>
                    <textarea
                      className="mbm-form-textarea"
                      placeholder="Nhập lý do từ chối (VD: Lịch không phù hợp, lý do cá nhân, thay đổi đột xuất...)"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={4}
                      maxLength={500}
                    />
                    <div className="mbm-form-hint">
                      {rejectReason.length}/500
                    </div>
                  </div>
                  <div className="mbm-warning">
                    <AlertCircle size={15} />
                    <span>
                      Học viên sẽ được thông báo và hoàn tiền nếu đã thanh toán.
                    </span>
                  </div>
                </div>

                <div className="mbm-modal-footer">
                  <button
                    className="mbm-btn mbm-btn-ghost"
                    onClick={() => setRejectModal(null)}
                    disabled={rejectSubmitting}
                  >
                    Hủy
                  </button>
                  <button
                    className="mbm-btn mbm-btn-reject"
                    onClick={handleRejectSubmit}
                    disabled={
                      rejectSubmitting || rejectReason.trim().length < 5
                    }
                  >
                    {rejectSubmitting ? (
                      <>
                        <RefreshCw size={14} className="mbm-spin" /> Đang xử
                        lý...
                      </>
                    ) : (
                      <>
                        <XCircle size={14} /> Xác nhận từ chối
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>,
            document.body,
          )}
      </AnimatePresence>

      {/* Node Mentoring Workspace Modal */}
      <AnimatePresence>
        {mentoringWorkspace.isOpen &&
          mentoringWorkspace.booking &&
          ReactDOM.createPortal(
            <motion.div
              className="mbm-modal-overlay mbm-modal-overlay--large"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setMentoringWorkspace({ isOpen: false, booking: null });
                }
              }}
            >
              <motion.div
                className="mbm-modal mbm-modal--large"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mbm-modal-hdr">
                  <div className="mbm-modal-title">
                    <span>🎯</span> Node Mentoring Workspace
                  </div>
                  <button
                    className="mbm-modal-close"
                    onClick={() =>
                      setMentoringWorkspace({ isOpen: false, booking: null })
                    }
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="mbm-modal-body mbm-modal-body--nopad">
                  <NodeMentoringWorkspace
                    booking={mentoringWorkspace.booking}
                    onActionComplete={() => {
                      fetchBookings();
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>,
            document.body,
          )}
      </AnimatePresence>
    </div>
  );
};

export default MentorBookingManager;
