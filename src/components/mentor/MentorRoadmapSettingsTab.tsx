import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  DollarSign,
  CheckCircle,
  Save,
  Info,
  ListChecks,
  Inbox,
  ExternalLink,
  Clock,
  Zap,
  History,
  RefreshCw,
  CheckCircle2,
  XCircle,
  User,
  CalendarDays,
  Hash,
  AlertTriangle,
  ChevronRight,
  X,
  Map,
} from "lucide-react";
import { portfolioService } from "../../services/portfolioService";
import { mentorRoadmapWorkspaceService } from "../../services/mentorRoadmapWorkspaceService";
import type { BookingResponse } from "../../services/bookingService";
import { approveBooking, rejectBooking } from "../../services/bookingService";
import { useAppToast } from "../../context/ToastContext";
import "./MentorRoadmapSettingsTab.css";

type HubSection = "settings" | "bookings";
type BookingFilter = "all" | "pending" | "active" | "history";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  CONFIRMED: "Đã xác nhận",
  MENTORING_ACTIVE: "Đang mentoring",
  PENDING_COMPLETION: "Chờ hoàn tất",
  COMPLETED: "Đã hoàn thành",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
  DISPUTED: "Đang tranh chấp",
};

const MentorRoadmapSettingsTab: React.FC = () => {
  const navigate = useNavigate();
  const [section, setSection] = useState<HubSection>("settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roadmapMentoringPrice, setRoadmapMentoringPrice] = useState<
    number | ""
  >("");
  const [isActive, setIsActive] = useState(false);
  const { showSuccess, showError } = useAppToast();

  // Booking list state
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>("all");

  // Action state
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    bookingId: number | null;
  }>({ open: false, bookingId: null });
  const [rejectReason, setRejectReason] = useState("");

  // ── Settings: load profile ──────────────────────────────────

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await portfolioService.getProfile();
      if (profile.roadmapMentoringPrice && profile.roadmapMentoringPrice > 0) {
        setRoadmapMentoringPrice(profile.roadmapMentoringPrice);
        setIsActive(true);
      } else {
        setRoadmapMentoringPrice("");
        setIsActive(false);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const priceToSave = isActive ? Number(roadmapMentoringPrice) || 0 : 0;

      if (isActive && priceToSave <= 0) {
        showError(
          "Lỗi",
          "Vui lòng nhập mức giá hợp lệ lớn hơn 0 để kích hoạt.",
        );
        return;
      }

      await portfolioService.updateProfile({
        roadmapMentoringPrice: priceToSave,
      });

      showSuccess("Thành công", "Đã cập nhật cài đặt Đồng hành Roadmap.");
      loadProfile();
    } catch (err) {
      console.error(err);
      showError("Thất bại", "Không thể lưu cài đặt. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // ── Bookings: load / reload ──────────────────────────────────

  const loadBookings = useCallback(
    async (force = false) => {
      if (bookingsLoaded && !force) return;
      try {
        setBookingsLoading(true);
        const data =
          await mentorRoadmapWorkspaceService.getMentorRoadmapBookings();
        setBookings(data);
        setBookingsLoaded(true);
      } catch (err) {
        console.error("Failed to load roadmap bookings:", err);
        showError("Lỗi", "Không thể tải danh sách booking roadmap.");
      } finally {
        setBookingsLoading(false);
      }
    },
    [bookingsLoaded, showError],
  );

  const handleSectionSwitch = (target: HubSection) => {
    setSection(target);
    if (target === "bookings" && !bookingsLoaded) {
      loadBookings();
    }
  };

  const handleOpenWorkspace = (bookingId: number) => {
    navigate(`/mentor/roadmap-workspace/${bookingId}`);
  };

  // ── Approve / Reject ──────────────────────────────────────────

  const handleApprove = async (bookingId: number) => {
    try {
      setActionLoadingId(bookingId);
      await approveBooking(bookingId);
      showSuccess("Đã duyệt", "Booking đã được phê duyệt thành công.");
      loadBookings(true);
    } catch (err: any) {
      showError(
        "Lỗi",
        err?.response?.data?.message || "Không thể duyệt booking.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (bookingId: number) => {
    setRejectReason("");
    setRejectModal({ open: true, bookingId });
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal.bookingId) return;
    try {
      setActionLoadingId(rejectModal.bookingId);
      await rejectBooking(rejectModal.bookingId, rejectReason || undefined);
      showSuccess("Đã từ chối", "Booking đã bị từ chối.");
      setRejectModal({ open: false, bookingId: null });
      loadBookings(true);
    } catch (err: any) {
      showError(
        "Lỗi",
        err?.response?.data?.message || "Không thể từ chối booking.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Loading state ────────────────────────────────────────

  if (loading) {
    return (
      <div className="mentor-roadmap-settings-loading">
        <div className="spinner"></div>
        <p>Đang tải cấu hình...</p>
      </div>
    );
  }

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const activeCount = bookings.filter(
    (b) => b.status === "MENTORING_ACTIVE" || b.status === "PENDING_COMPLETION",
  ).length;
  const activeBookingsCount = pendingCount + activeCount;

  const FILTER_STATUSES: Record<BookingFilter, string[]> = {
    all: [],
    pending: ["PENDING"],
    active: ["MENTORING_ACTIVE", "PENDING_COMPLETION", "CONFIRMED"],
    history: ["COMPLETED", "REJECTED", "CANCELLED", "REFUNDED", "DISPUTED"],
  };

  const filteredBookings =
    bookingFilter === "all"
      ? bookings
      : bookings.filter((b) =>
          FILTER_STATUSES[bookingFilter].includes(b.status),
        );

  return (
    <div className="mentor-roadmap-settings-container">
      {/* ─── Reject Confirmation Modal ───────────────────────── */}
      {rejectModal.open && (
        <div
          className="mr-modal-overlay"
          onClick={() => setRejectModal({ open: false, bookingId: null })}
        >
          <div className="mr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mr-modal__header">
              <div className="mr-modal__title-row">
                <AlertTriangle size={20} className="mr-modal__warn-icon" />
                <h3>Từ chối yêu cầu</h3>
              </div>
              <button
                className="mr-modal__close"
                onClick={() => setRejectModal({ open: false, bookingId: null })}
              >
                <X size={18} />
              </button>
            </div>
            <p className="mr-modal__desc">
              Bạn có chắc muốn từ chối booking #{rejectModal.bookingId}? Hành
              động này không thể hoàn tác.
            </p>
            <div className="mr-modal__field">
              <label>
                Lý do từ chối <span>(tuỳ chọn)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do để học viên biết..."
                rows={3}
              />
            </div>
            <div className="mr-modal__actions">
              <button
                className="mr-modal__cancel-btn"
                onClick={() => setRejectModal({ open: false, bookingId: null })}
              >
                Huỷ bỏ
              </button>
              <button
                className="mr-modal__reject-btn"
                onClick={handleRejectConfirm}
                disabled={actionLoadingId === rejectModal.bookingId}
              >
                {actionLoadingId === rejectModal.bookingId
                  ? "Đang xử lý..."
                  : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Hub Tab Navigation ─────────────────────────────── */}
      <div className="mr-hub-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={section === "settings"}
          className={`mr-hub-tab ${section === "settings" ? "mr-hub-tab--active" : ""}`}
          onClick={() => handleSectionSwitch("settings")}
        >
          <Target size={16} /> Cài đặt dịch vụ
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === "bookings"}
          className={`mr-hub-tab ${section === "bookings" ? "mr-hub-tab--active" : ""}`}
          onClick={() => handleSectionSwitch("bookings")}
        >
          <ListChecks size={16} /> Quản lý Booking
          {activeBookingsCount > 0 && (
            <span className="mr-hub-tab__badge">{activeBookingsCount}</span>
          )}
        </button>
      </div>

      {/* ═══ Section: Cài đặt dịch vụ ═══════════════════════ */}
      {section === "settings" && (
        <>
          <div className="mrs-header">
            <div className="mrs-icon-wrapper">
              <Target size={32} className="mrs-icon" />
            </div>
            <div>
              <h2>Đồng Hành Roadmap Mentoring</h2>
              <p>
                Thiết lập dịch vụ theo sát và hướng dẫn học viên hoàn thành toàn
                bộ lộ trình học tập chuyên sâu.
              </p>
            </div>
          </div>

          <div className="mrs-card">
            <div className="mrs-status-section">
              <div className="mrs-status-info">
                <h3>Trạng thái Dịch vụ</h3>
                <p
                  className={
                    isActive ? "mrs-status-active" : "mrs-status-inactive"
                  }
                >
                  {isActive
                    ? "Dịch vụ đang ĐƯỢC KÍCH HOẠT. Học viên có thể đặt lịch đồng hành cùng bạn."
                    : "Dịch vụ đang TẠM NGƯNG. Học viên không thể đặt lịch đồng hành roadmap."}
                </p>
              </div>
              <label className="mrs-toggle-switch">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="mrs-toggle-slider"></span>
              </label>
            </div>

            <div className={`mrs-price-section ${!isActive ? "disabled" : ""}`}>
              <div className="mrs-price-input-group">
                <label>Mức phí trọn gói (VND)</label>
                <div className="mrs-input-wrapper">
                  <DollarSign size={20} className="mrs-input-icon" />
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={roadmapMentoringPrice}
                    onChange={(e) =>
                      setRoadmapMentoringPrice(Number(e.target.value))
                    }
                    placeholder="Nhập mức phí (VD: 5000000)"
                    disabled={!isActive}
                  />
                  <span className="mrs-currency-suffix">VNĐ</span>
                </div>
                {roadmapMentoringPrice && Number(roadmapMentoringPrice) > 0 && (
                  <p className="mrs-price-preview">
                    Hiển thị:{" "}
                    <strong>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(Number(roadmapMentoringPrice))}
                    </strong>
                  </p>
                )}
                <div className="mrs-price-help-alert">
                  <Info size={16} />
                  <span>
                    Học viên sẽ thanh toán một lần. Tiền sẽ được hệ thống tạm
                    giữ (Escrow) và chỉ giải ngân cho Mentor sau khi học viên
                    PASS buổi bảo vệ lộ trình cuối cùng.
                  </span>
                </div>
              </div>
            </div>

            <div className="mrs-actions">
              <button
                className="mrs-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={18} />
                {saving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
            </div>
          </div>

          <div className="mrs-guidelines">
            <h3>
              <CheckCircle size={20} className="mrs-guideline-icon" /> Quy trình
              hoạt động Roadmap Mentoring
            </h3>
            <div className="mrs-guideline-steps">
              <div className="mrs-guideline-step">
                <div className="mrs-step-number">1</div>
                <div className="mrs-step-content">
                  <h4>Học viên đặt lịch</h4>
                  <p>
                    Học viên gửi yêu cầu đồng hành kèm theo một Roadmap cụ thể
                    mà họ muốn theo đuổi.
                  </p>
                </div>
              </div>
              <div className="mrs-guideline-step">
                <div className="mrs-step-number">2</div>
                <div className="mrs-step-content">
                  <h4>Mentor phê duyệt & Escrow</h4>
                  <p>
                    Mentor xem xét roadmap. Nếu đồng ý, học viên thanh toán 100%
                    chi phí vào ví Escrow của hệ thống.
                  </p>
                </div>
              </div>
              <div className="mrs-guideline-step">
                <div className="mrs-step-number">3</div>
                <div className="mrs-step-content">
                  <h4>Theo sát & Cập nhật</h4>
                  <p>
                    Mentor có thể theo dõi tiến độ, tùy chỉnh các node bài tập,
                    cập nhật assignment liên tục để hỗ trợ học viên.
                  </p>
                </div>
              </div>
              <div className="mrs-guideline-step">
                <div className="mrs-step-number">4</div>
                <div className="mrs-step-content">
                  <h4>Bảo vệ & Giải ngân</h4>
                  <p>
                    Sau khi hoàn thành Roadmap, tiến hành xác thực (verify). Nếu
                    Pass, hệ thống giải ngân chi phí từ ví Escrow sang ví khả
                    dụng của Mentor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ Section: Quản lý Booking ═══════════════════════ */}
      {section === "bookings" && (
        <div>
          {/* Header row */}
          <div className="mr-bookings-header">
            <div className="mrs-header" style={{ marginBottom: 0 }}>
              <div className="mrs-icon-wrapper">
                <ListChecks size={28} className="mrs-icon" />
              </div>
              <div>
                <h2>Quản lý Booking Roadmap</h2>
                <p>Duyệt yêu cầu, theo dõi tiến độ và xem lịch sử hợp tác.</p>
              </div>
            </div>
            <button
              className="mr-refresh-btn"
              onClick={() => loadBookings(true)}
              disabled={bookingsLoading}
              title="Tải lại danh sách"
            >
              <RefreshCw
                size={15}
                className={bookingsLoading ? "mr-spin" : ""}
              />
              Làm mới
            </button>
          </div>

          {/* Stats strip */}
          <div className="mr-stats-strip">
            <div className="mr-stat-chip mr-stat-chip--pending">
              <Clock size={14} />
              <span>
                <strong>{pendingCount}</strong> Chờ duyệt
              </span>
            </div>
            <div className="mr-stat-chip mr-stat-chip--active">
              <Zap size={14} />
              <span>
                <strong>{activeCount}</strong> Đang mentoring
              </span>
            </div>
            <div className="mr-stat-chip mr-stat-chip--history">
              <History size={14} />
              <span>
                <strong>
                  {
                    bookings.filter((b) =>
                      [
                        "COMPLETED",
                        "REJECTED",
                        "CANCELLED",
                        "REFUNDED",
                      ].includes(b.status),
                    ).length
                  }
                </strong>{" "}
                Lịch sử
              </span>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="mr-filter-tabs">
            {(
              [
                { key: "all", label: "Tất cả", count: bookings.length },
                { key: "pending", label: "Chờ duyệt", count: pendingCount },
                { key: "active", label: "Đang mentoring", count: activeCount },
                {
                  key: "history",
                  label: "Lịch sử",
                  count: bookings.filter((b) =>
                    [
                      "COMPLETED",
                      "REJECTED",
                      "CANCELLED",
                      "REFUNDED",
                      "DISPUTED",
                    ].includes(b.status),
                  ).length,
                },
              ] as { key: BookingFilter; label: string; count: number }[]
            ).map((f) => (
              <button
                key={f.key}
                className={`mr-filter-tab ${bookingFilter === f.key ? "mr-filter-tab--active" : ""}`}
                onClick={() => setBookingFilter(f.key)}
              >
                {f.label}
                {f.count > 0 && (
                  <span className="mr-filter-tab__count">{f.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          {bookingsLoading ? (
            <div
              className="mentor-roadmap-settings-loading"
              style={{ minHeight: 200 }}
            >
              <div className="spinner"></div>
              <p>Đang tải danh sách booking...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="mr-empty-state">
              <Inbox size={44} />
              <h4>
                {bookings.length === 0
                  ? "Chưa có booking roadmap nào"
                  : "Không có booking trong bộ lọc này"}
              </h4>
              <p>
                {bookings.length === 0
                  ? "Khi học viên đặt dịch vụ đồng hành roadmap, booking sẽ xuất hiện tại đây."
                  : "Hãy thử chọn bộ lọc khác."}
              </p>
            </div>
          ) : (
            <div className="mr-booking-list">
              {filteredBookings.map((booking) => {
                const isPending = booking.status === "PENDING";
                const isWorkspaceReady = [
                  "MENTORING_ACTIVE",
                  "PENDING_COMPLETION",
                  "COMPLETED",
                ].includes(booking.status);
                const isHistory = [
                  "COMPLETED",
                  "REJECTED",
                  "CANCELLED",
                  "REFUNDED",
                  "DISPUTED",
                ].includes(booking.status);
                const isActioning = actionLoadingId === booking.id;
                return (
                  <div
                    key={booking.id}
                    className={`mr-booking-card mr-booking-card--${booking.status} ${isPending ? "mr-booking-card--highlight" : ""}`}
                  >
                    {/* Left: learner info */}
                    <div className="mr-booking-info">
                      <div className="mr-booking-info__top">
                        <div className="mr-booking-avatar">
                          <User size={16} />
                        </div>
                        <div>
                          <h4>
                            {booking.learnerName ||
                              `Học viên #${booking.learnerId}`}
                          </h4>
                          <div className="mr-booking-meta">
                            <span>
                              <Hash size={11} />
                              {booking.id}
                            </span>
                            {booking.journeyId && (
                              <span>
                                <Map size={11} />
                                Hành trình #{booking.journeyId}
                              </span>
                            )}
                            <span>
                              <CalendarDays size={11} />
                              {booking.createdAt
                                ? new Date(
                                    booking.createdAt,
                                  ).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                      {booking.priceVnd != null && (
                        <div className="mr-booking-price">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(booking.priceVnd)}
                        </div>
                      )}
                    </div>

                    {/* Right: status + actions */}
                    <div className="mr-booking-actions">
                      <span
                        className={`mr-booking-status mr-booking-status--${booking.status}`}
                      >
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>

                      {isPending && (
                        <div className="mr-booking-btns">
                          <button
                            className="mr-approve-btn"
                            onClick={() => handleApprove(booking.id)}
                            disabled={isActioning}
                          >
                            {isActioning ? (
                              <RefreshCw size={13} className="mr-spin" />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                            Duyệt
                          </button>
                          <button
                            className="mr-reject-btn"
                            onClick={() => openRejectModal(booking.id)}
                            disabled={isActioning}
                          >
                            <XCircle size={13} /> Từ chối
                          </button>
                        </div>
                      )}

                      {isWorkspaceReady && (
                        <button
                          className="mr-open-workspace-btn"
                          onClick={() => handleOpenWorkspace(booking.id)}
                        >
                          <ExternalLink size={13} /> Mở Workspace{" "}
                          <ChevronRight size={12} />
                        </button>
                      )}

                      {isHistory && !isWorkspaceReady && (
                        <span className="mr-booking-history-label">
                          <History size={12} /> Lưu trữ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentorRoadmapSettingsTab;
