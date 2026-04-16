import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Link2,
  MapPin,
  Phone,
  Video,
  Calendar,
  Clock3,
  Building2,
  Search,
  Send,
  SlidersHorizontal,
  LayoutGrid,
  Table2,
  X,
} from "lucide-react";
import interviewService, {
  InterviewScheduleResponse,
  InterviewStatus,
  MeetingType,
} from "../../services/interviewService";
import { useToast } from "../../hooks/useToast";
import "./InterviewListPanel.css";

type InterviewTimeFilter = "ALL" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";
type InterviewPanelTab = "UPCOMING" | "HISTORY";
type InterviewViewMode = "GRID" | "TABLE";

const PAGE_SIZE = 8;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Không đến",
};

const STATUS_TONE: Record<string, string> = {
  PENDING: "amber",
  CONFIRMED: "cyan",
  COMPLETED: "green",
  CANCELLED: "slate",
  NO_SHOW: "red",
};

const MEETING_ICONS: Record<string, React.ReactNode> = {
  GOOGLE_MEET: <Video size={14} />,
  ZOOM: <Video size={14} />,
  MICROSOFT_TEAMS: <Video size={14} />,
  SKILLVERSE_ROOM: <Video size={14} />,
  PHONE_CALL: <Phone size={14} />,
  ONSITE: <MapPin size={14} />,
};

const MEETING_LABELS: Record<string, string> = {
  GOOGLE_MEET: "Google Meet",
  ZOOM: "Zoom",
  MICROSOFT_TEAMS: "Microsoft Teams",
  SKILLVERSE_ROOM: "SkillVerse Room",
  PHONE_CALL: "Cuộc gọi điện thoại",
  ONSITE: "Phỏng vấn trực tiếp",
};

const formatDateTime = (date?: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCountdown = (date?: string): string => {
  if (!date) return "";
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return "Đã qua";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days} ngày ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

const getStartOfWeek = (date: Date) => {
  const base = startOfDay(date);
  const day = base.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + delta);
  return base;
};

const matchInterviewTimeFilter = (
  dateValue: string,
  filter: InterviewTimeFilter,
  fromDate?: string,
  toDate?: string,
) => {
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return false;

  if (filter === "ALL") return true;

  const now = new Date();

  if (filter === "THIS_WEEK") {
    const start = getStartOfWeek(now);
    const end = endOfDay(now);
    return target >= start && target <= end;
  }

  if (filter === "THIS_MONTH") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endOfDay(now);
    return target >= start && target <= end;
  }

  if (filter === "CUSTOM") {
    if (fromDate) {
      const from = new Date(`${fromDate}T00:00:00`);
      if (target < from) return false;
    }

    if (toDate) {
      const to = new Date(`${toDate}T23:59:59.999`);
      if (target > to) return false;
    }
    return true;
  }

  return true;
};

interface InterviewListPanelProps {
  applicationId?: number;
}

const InterviewListPanel: React.FC<InterviewListPanelProps> = ({
  applicationId,
}) => {
  const { showError, showSuccess } = useToast();
  const [interviews, setInterviews] = useState<InterviewScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [interviewActionId, setInterviewActionId] = useState<number | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | "ALL">(
    "ALL",
  );
  const [meetingFilter, setMeetingFilter] = useState<MeetingType | "ALL">(
    "ALL",
  );
  const [timeFilter, setTimeFilter] = useState<InterviewTimeFilter>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const [activeTab, setActiveTab] = useState<InterviewPanelTab>("UPCOMING");
  const [viewMode, setViewMode] = useState<InterviewViewMode>("GRID");
  const [declineModalInterview, setDeclineModalInterview] =
    useState<InterviewScheduleResponse | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const modalRoot = typeof document !== "undefined" ? document.body : null;

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let data: InterviewScheduleResponse[];
      if (applicationId) {
        data = await interviewService
          .getInterviewByApplication(applicationId)
          .then((response) => [response]);
      } else {
        data = await interviewService.getMyInterviews();
      }
      setInterviews(data);
    } catch (errorValue: unknown) {
      setError(
        errorValue instanceof Error
          ? errorValue.message
          : "Không thể tải lịch phỏng vấn.",
      );
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void loadInterviews();
  }, [loadInterviews]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    if (!declineModalInterview) return undefined;

    document.body.classList.add("ilp-modal-open");
    return () => {
      document.body.classList.remove("ilp-modal-open");
    };
  }, [declineModalInterview]);

  const handleConfirmInterview = async (interviewId: number) => {
    try {
      setInterviewActionId(interviewId);
      await interviewService.confirmInterview(interviewId);
      await loadInterviews();
      showSuccess("Đã xác nhận", "Bạn đã xác nhận tham gia phỏng vấn.");
    } catch (errorValue: unknown) {
      showError(
        "Không thể xác nhận",
        errorValue instanceof Error ? errorValue.message : "Vui lòng thử lại.",
      );
    } finally {
      setInterviewActionId(null);
    }
  };

  const handleDeclineInterview = async (interviewId: number) => {
    const interview = interviews.find((item) => item.id === interviewId);
    if (!interview) {
      showError(
        "Không tìm thấy lịch",
        "Lịch phỏng vấn không tồn tại hoặc đã được cập nhật.",
      );
      return;
    }

    setDeclineReason("");
    setDeclineModalInterview(interview);
  };

  const submitDeclineInterview = async () => {
    if (!declineModalInterview) return;

    const reason = declineReason.trim();
    if (reason.length < 10) {
      showError(
        "Lý do chưa đủ chi tiết",
        "Vui lòng nhập lý do từ chối tối thiểu 10 ký tự.",
      );
      return;
    }

    try {
      setInterviewActionId(declineModalInterview.id);
      await interviewService.declineInterview(declineModalInterview.id, reason);
      await loadInterviews();
      setDeclineModalInterview(null);
      setDeclineReason("");
      showSuccess(
        "Đã từ chối lịch",
        "Hệ thống đã ghi nhận từ chối và cập nhật hồ sơ của bạn.",
      );
    } catch (errorValue: unknown) {
      showError(
        "Không thể từ chối",
        errorValue instanceof Error ? errorValue.message : "Vui lòng thử lại.",
      );
    } finally {
      setInterviewActionId(null);
    }
  };

  const filteredInterviews = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return interviews.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      const matchesMeeting =
        meetingFilter === "ALL" || item.meetingType === meetingFilter;
      const matchesTime = matchInterviewTimeFilter(
        item.scheduledAt,
        timeFilter,
        fromDate,
        toDate,
      );

      const matchesQuery =
        !query ||
        [item.jobTitle, item.interviewerName, item.location, item.candidateName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesMeeting && matchesTime && matchesQuery;
    });
  }, [
    interviews,
    searchTerm,
    statusFilter,
    meetingFilter,
    timeFilter,
    fromDate,
    toDate,
  ]);

  const upcoming = useMemo(
    () =>
      filteredInterviews
        .filter((item) =>
          [InterviewStatus.PENDING, InterviewStatus.CONFIRMED].includes(
            item.status as InterviewStatus,
          ),
        )
        .sort(
          (left, right) =>
            new Date(left.scheduledAt).getTime() -
            new Date(right.scheduledAt).getTime(),
        ),
    [filteredInterviews],
  );

  const past = useMemo(
    () =>
      filteredInterviews
        .filter((item) =>
          [
            InterviewStatus.COMPLETED,
            InterviewStatus.CANCELLED,
            InterviewStatus.NO_SHOW,
          ].includes(item.status as InterviewStatus),
        )
        .sort(
          (left, right) =>
            new Date(right.scheduledAt).getTime() -
            new Date(left.scheduledAt).getTime(),
        ),
    [filteredInterviews],
  );

  const upcomingTotalPages = Math.max(
    1,
    Math.ceil(upcoming.length / PAGE_SIZE),
  );
  const pastTotalPages = Math.max(1, Math.ceil(past.length / PAGE_SIZE));

  const pagedUpcoming = useMemo(() => {
    const start = (upcomingPage - 1) * PAGE_SIZE;
    return upcoming.slice(start, start + PAGE_SIZE);
  }, [upcoming, upcomingPage]);

  const pagedPast = useMemo(() => {
    const start = (pastPage - 1) * PAGE_SIZE;
    return past.slice(start, start + PAGE_SIZE);
  }, [past, pastPage]);

  useEffect(() => {
    setUpcomingPage(1);
    setPastPage(1);
  }, [searchTerm, statusFilter, meetingFilter, timeFilter, fromDate, toDate]);

  useEffect(() => {
    setUpcomingPage((page) => Math.min(page, upcomingTotalPages));
  }, [upcomingTotalPages]);

  useEffect(() => {
    setPastPage((page) => Math.min(page, pastTotalPages));
  }, [pastTotalPages]);

  if (loading) {
    return (
      <div className="ilp-loading">
        <div className="ilp-spinner" />
        <span>Đang tải lịch phỏng vấn...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ilp-empty">
        <Calendar size={32} />
        <div>
          <strong>Lỗi tải dữ liệu</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!interviews.length) {
    return (
      <div className="ilp-empty">
        <Calendar size={32} />
        <div>
          <strong>Chưa có lịch phỏng vấn nào</strong>
          <p>Bạn sẽ nhận thông báo khi nhà tuyển dụng xếp lịch phỏng vấn.</p>
        </div>
      </div>
    );
  }

  const activeInterviews = activeTab === "UPCOMING" ? pagedUpcoming : pagedPast;
  const activeCount = activeTab === "UPCOMING" ? upcoming.length : past.length;
  const activePage = activeTab === "UPCOMING" ? upcomingPage : pastPage;
  const activeTotalPages =
    activeTab === "UPCOMING" ? upcomingTotalPages : pastTotalPages;
  const activeTitle =
    activeTab === "UPCOMING" ? "Lịch sắp tới" : "Lịch sử phỏng vấn";
  const activeEmptyText =
    activeTab === "UPCOMING"
      ? "Không có lịch sắp tới phù hợp bộ lọc."
      : "Không có lịch sử phỏng vấn phù hợp bộ lọc.";

  const onPreviousPage = () => {
    if (activeTab === "UPCOMING") {
      setUpcomingPage((page) => Math.max(1, page - 1));
      return;
    }
    setPastPage((page) => Math.max(1, page - 1));
  };

  const onNextPage = () => {
    if (activeTab === "UPCOMING") {
      setUpcomingPage((page) => Math.min(upcomingTotalPages, page + 1));
      return;
    }
    setPastPage((page) => Math.min(pastTotalPages, page + 1));
  };

  return (
    <>
      <div className="ilp-root">
        <section className="ilp-toolbar">
          <label className="ilp-search">
            <Search size={14} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo công việc, người phỏng vấn, địa điểm..."
            />
          </label>

          <div className="ilp-filter-row">
            <label className="ilp-filter">
              <SlidersHorizontal size={13} />
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as InterviewStatus | "ALL")
                }
              >
                <option value="ALL">Mọi trạng thái</option>
                {Object.values(InterviewStatus).map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status] || status}
                  </option>
                ))}
              </select>
            </label>

            <label className="ilp-filter">
              <Video size={13} />
              <select
                value={meetingFilter}
                onChange={(event) =>
                  setMeetingFilter(event.target.value as MeetingType | "ALL")
                }
              >
                <option value="ALL">Mọi hình thức</option>
                {Object.values(MeetingType).map((meetingType) => (
                  <option key={meetingType} value={meetingType}>
                    {MEETING_LABELS[meetingType] || meetingType}
                  </option>
                ))}
              </select>
            </label>

            <label className="ilp-filter">
              <Calendar size={13} />
              <select
                value={timeFilter}
                onChange={(event) => {
                  const nextFilter = event.target.value as InterviewTimeFilter;
                  setTimeFilter(nextFilter);
                  if (nextFilter !== "CUSTOM") {
                    setFromDate("");
                    setToDate("");
                  }
                }}
              >
                <option value="ALL">Mọi thời gian</option>
                <option value="THIS_WEEK">Tuần này</option>
                <option value="THIS_MONTH">Tháng này</option>
                <option value="CUSTOM">Trong khoảng</option>
              </select>
            </label>

            {timeFilter === "CUSTOM" && (
              <div className="ilp-date-range">
                <label>
                  <span>Từ</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                  />
                </label>
                <label>
                  <span>Đến</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    min={fromDate || undefined}
                  />
                </label>
              </div>
            )}
          </div>
        </section>

        <section className="ilp-panel-controls">
          <div
            className="ilp-tabs"
            role="tablist"
            aria-label="Bộ lọc trạng thái lịch phỏng vấn"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "UPCOMING"}
              className={`ilp-tab${activeTab === "UPCOMING" ? " is-active" : ""}`}
              onClick={() => setActiveTab("UPCOMING")}
            >
              <Calendar size={14} />
              <span>Lịch sắp tới</span>
              <span className="ilp-tab__count">{upcoming.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "HISTORY"}
              className={`ilp-tab${activeTab === "HISTORY" ? " is-active" : ""}`}
              onClick={() => setActiveTab("HISTORY")}
            >
              <Clock3 size={14} />
              <span>Lịch sử</span>
              <span className="ilp-tab__count">{past.length}</span>
            </button>
          </div>

          <div
            className="ilp-view-switch"
            aria-label="Chế độ hiển thị lịch phỏng vấn"
          >
            <button
              type="button"
              className={`ilp-view-switch__btn${viewMode === "GRID" ? " is-active" : ""}`}
              onClick={() => setViewMode("GRID")}
              title="Xem dạng lưới"
            >
              <LayoutGrid size={14} />
              <span>Lưới</span>
            </button>
            <button
              type="button"
              className={`ilp-view-switch__btn${viewMode === "TABLE" ? " is-active" : ""}`}
              onClick={() => setViewMode("TABLE")}
              title="Xem dạng bảng"
            >
              <Table2 size={14} />
              <span>Bảng</span>
            </button>
          </div>
        </section>

        <section className="ilp-section">
          <div className="ilp-section__head">
            {activeTab === "UPCOMING" ? (
              <Calendar size={14} />
            ) : (
              <Clock3 size={14} />
            )}
            <span>{activeTitle}</span>
            <span className="ilp-section__count">{activeCount}</span>
            <span className="ilp-section__meta">{PAGE_SIZE} lịch/trang</span>
          </div>

          {viewMode === "GRID" ? (
            <div className="ilp-grid-list">
              {activeInterviews.length ? (
                activeInterviews.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    interviewActionId={interviewActionId}
                    onConfirmInterview={handleConfirmInterview}
                    onDeclineInterview={handleDeclineInterview}
                  />
                ))
              ) : (
                <div className="ilp-empty-inline">{activeEmptyText}</div>
              )}
            </div>
          ) : activeInterviews.length ? (
            <InterviewTable
              interviews={activeInterviews}
              activeTab={activeTab}
              interviewActionId={interviewActionId}
              onConfirmInterview={handleConfirmInterview}
              onDeclineInterview={handleDeclineInterview}
            />
          ) : (
            <div className="ilp-empty-inline">{activeEmptyText}</div>
          )}

          {activeTotalPages > 1 && (
            <div className="ilp-pagination">
              <button
                type="button"
                onClick={onPreviousPage}
                disabled={activePage === 1}
              >
                Trước
              </button>
              <span>
                Trang {activePage}/{activeTotalPages}
              </span>
              <button
                type="button"
                onClick={onNextPage}
                disabled={activePage >= activeTotalPages}
              >
                Sau
              </button>
            </div>
          )}
        </section>
      </div>

      {modalRoot &&
        declineModalInterview &&
        createPortal(
          <div
            className="ilp-modal-overlay"
            onClick={() => setDeclineModalInterview(null)}
          >
            <div
              className="ilp-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="ilp-modal__header">
                <div>
                  <span className="ilp-modal__eyebrow">Từ chối phỏng vấn</span>
                  <h3>Từ chối lịch phỏng vấn này?</h3>
                </div>
                <button
                  type="button"
                  className="ilp-modal__close"
                  onClick={() => setDeclineModalInterview(null)}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="ilp-modal__body">
                <p className="ilp-modal__desc">
                  <AlertTriangle size={14} />
                  Lý do sẽ được gửi cho nhà tuyển dụng và dùng để cập nhật trạng
                  thái hồ sơ.
                </p>

                <div className="ilp-modal__summary">
                  <span>{declineModalInterview.jobTitle}</span>
                  <span>
                    {formatDateTime(declineModalInterview.scheduledAt)}
                  </span>
                </div>

                <label
                  className="ilp-modal__label"
                  htmlFor="ilp-decline-reason"
                >
                  Lý do từ chối <span>*</span>
                </label>
                <textarea
                  id="ilp-decline-reason"
                  className={`ilp-modal__textarea${
                    declineReason.trim().length > 0 &&
                    declineReason.trim().length < 10
                      ? " is-error"
                      : ""
                  }`}
                  rows={4}
                  maxLength={250}
                  value={declineReason}
                  onChange={(event) => setDeclineReason(event.target.value)}
                  placeholder="Ví dụ: Tôi bận lịch học vào khung giờ này, mong muốn đổi sang thời gian khác..."
                />
                <div className="ilp-modal__hint">
                  {declineReason.trim().length}/250 ký tự
                </div>
              </div>

              <div className="ilp-modal__actions">
                <button
                  type="button"
                  className="ilp-modal-btn is-ghost"
                  onClick={() => setDeclineModalInterview(null)}
                  disabled={interviewActionId === declineModalInterview.id}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="ilp-modal-btn is-danger"
                  onClick={submitDeclineInterview}
                  disabled={interviewActionId === declineModalInterview.id}
                >
                  <Send size={13} />
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>,
          modalRoot,
        )}
    </>
  );
};

const InterviewTable: React.FC<{
  interviews: InterviewScheduleResponse[];
  activeTab: InterviewPanelTab;
  interviewActionId: number | null;
  onConfirmInterview: (interviewId: number) => void;
  onDeclineInterview: (interviewId: number) => void;
}> = ({
  interviews,
  activeTab,
  interviewActionId,
  onConfirmInterview,
  onDeclineInterview,
}) => {
  return (
    <div className="ilp-table-wrap">
      <table className="ilp-table">
        <thead>
          <tr>
            <th>Hình thức</th>
            <th>Công việc</th>
            <th>Thời gian</th>
            <th>Thời lượng</th>
            <th>Trạng thái</th>
            <th>Địa điểm / Link</th>
            <th>Người phỏng vấn</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {interviews.map((interview) => {
            const tone = STATUS_TONE[interview.status] || "slate";
            const label = STATUS_LABELS[interview.status] || interview.status;
            const meetingLabel =
              MEETING_LABELS[interview.meetingType] || interview.meetingType;
            const meetingIcon = MEETING_ICONS[interview.meetingType] || (
              <Calendar size={14} />
            );
            const countdown = getCountdown(interview.scheduledAt);
            const canRespond = interview.status === InterviewStatus.PENDING;

            return (
              <tr key={interview.id}>
                <td>
                  <div className="ilp-table__meeting">
                    <span className="ilp-table__meeting-icon">
                      {meetingIcon}
                    </span>
                    <span>{meetingLabel}</span>
                  </div>
                </td>
                <td>
                  <span className="ilp-table__job">{interview.jobTitle}</span>
                </td>
                <td>
                  <div className="ilp-table__time">
                    <span>{formatDateTime(interview.scheduledAt)}</span>
                    {activeTab === "UPCOMING" && countdown && (
                      <small>Còn {countdown}</small>
                    )}
                  </div>
                </td>
                <td>{interview.durationMinutes} phút</td>
                <td>
                  <span className={`ilp-status is-${tone}`}>{label}</span>
                </td>
                <td>
                  {interview.meetingLink ? (
                    <a
                      href={interview.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="ilp-table__link"
                    >
                      Mở link
                    </a>
                  ) : (
                    <span className="ilp-table__muted">
                      {interview.location || "—"}
                    </span>
                  )}
                </td>
                <td>
                  <span className="ilp-table__muted">
                    {interview.interviewerName || "—"}
                  </span>
                </td>
                <td>
                  {canRespond ? (
                    <div className="ilp-table__actions">
                      <button
                        type="button"
                        className="ilp-action-btn is-confirm"
                        disabled={interviewActionId === interview.id}
                        onClick={() => onConfirmInterview(interview.id)}
                      >
                        Xác nhận
                      </button>
                      <button
                        type="button"
                        className="ilp-action-btn is-decline"
                        disabled={interviewActionId === interview.id}
                        onClick={() => onDeclineInterview(interview.id)}
                      >
                        Từ chối
                      </button>
                    </div>
                  ) : (
                    <span className="ilp-table__muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const InterviewCard: React.FC<{
  interview: InterviewScheduleResponse;
  interviewActionId: number | null;
  onConfirmInterview: (interviewId: number) => void;
  onDeclineInterview: (interviewId: number) => void;
}> = ({
  interview,
  interviewActionId,
  onConfirmInterview,
  onDeclineInterview,
}) => {
  const tone = STATUS_TONE[interview.status] || "slate";
  const label = STATUS_LABELS[interview.status] || interview.status;
  const meetingLabel =
    MEETING_LABELS[interview.meetingType] || interview.meetingType;
  const meetingIcon = MEETING_ICONS[interview.meetingType] || (
    <Calendar size={14} />
  );
  const countdown = getCountdown(interview.scheduledAt);
  const isUpcoming = [
    InterviewStatus.PENDING,
    InterviewStatus.CONFIRMED,
  ].includes(interview.status as InterviewStatus);
  const isPast = [
    InterviewStatus.COMPLETED,
    InterviewStatus.CANCELLED,
    InterviewStatus.NO_SHOW,
  ].includes(interview.status as InterviewStatus);
  const canRespond = interview.status === InterviewStatus.PENDING;

  return (
    <article
      className={`ilp-card ilp-card--${tone}${isPast ? " ilp-card--past" : ""}`}
    >
      <div className="ilp-card__head">
        <div className="ilp-card__meeting-type">
          <span className="ilp-card__meeting-icon">{meetingIcon}</span>
          <span>{meetingLabel}</span>
        </div>
        <span className={`ilp-status is-${tone}`}>{label}</span>
      </div>

      <div className="ilp-card__job">
        <Building2 size={13} />
        <span>{interview.jobTitle}</span>
      </div>

      <div className="ilp-card__meta">
        <div className="ilp-card__meta-item">
          <Calendar size={13} />
          <span>{formatDateTime(interview.scheduledAt)}</span>
        </div>
        <div className="ilp-card__meta-item">
          <Clock3 size={13} />
          <span>{interview.durationMinutes} phút</span>
        </div>
      </div>

      {isUpcoming && countdown && (
        <div className="ilp-card__countdown">
          <span className="ilp-countdown-dot" />
          <span>Còn {countdown}</span>
        </div>
      )}

      {canRespond && interview.responseDeadlineAt && (
        <div className="ilp-card__meta-item ilp-card__meta-item--deadline">
          <Clock3 size={12} />
          <span>
            Hạn xác nhận: {formatDateTime(interview.responseDeadlineAt)}
          </span>
        </div>
      )}

      {canRespond && (
        <div className="ilp-card__actions">
          <button
            type="button"
            className="ilp-action-btn is-confirm"
            disabled={interviewActionId === interview.id}
            onClick={() => onConfirmInterview(interview.id)}
          >
            Xác nhận tham gia
          </button>
          <button
            type="button"
            className="ilp-action-btn is-decline"
            disabled={interviewActionId === interview.id}
            onClick={() => onDeclineInterview(interview.id)}
          >
            Từ chối lịch
          </button>
        </div>
      )}

      {interview.location && (
        <div className="ilp-card__location">
          <MapPin size={12} />
          <span>{interview.location}</span>
        </div>
      )}

      {interview.meetingLink && (
        <div className="ilp-card__link">
          <Link2 size={12} />
          <a href={interview.meetingLink} target="_blank" rel="noreferrer">
            {interview.meetingLink}
          </a>
        </div>
      )}

      {interview.interviewerName && (
        <div className="ilp-card__interviewer">
          <span>
            Người phỏng vấn: <strong>{interview.interviewerName}</strong>
          </span>
        </div>
      )}
    </article>
  );
};

export default InterviewListPanel;
