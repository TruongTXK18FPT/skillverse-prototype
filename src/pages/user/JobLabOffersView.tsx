import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  DollarSign,
  FileText,
  Plus,
  Send,
  X,
  XCircle,
} from "lucide-react";
import { JobApplicationStatus } from "../../data/jobDTOs";
import jobService from "../../services/jobService";
import type { AppItem } from "./JobLabPage";
import "../../styles/JobLabWorkspace.css";

interface JobLabOffersViewProps {
  applications: AppItem[];
  onRefresh: () => void;
}

type OfferFilter = "all" | "pending" | "accepted" | "rejected";

const STATUS_COLORS: Record<string, string> = {
  OFFER_SENT: "#a78bfa",
  OFFER_ACCEPTED: "#10b981",
  OFFER_REJECTED: "#f87171",
};

const STATUS_LABELS: Record<string, string> = {
  OFFER_SENT: "Chờ phản hồi",
  OFFER_ACCEPTED: "Đã chấp nhận",
  OFFER_REJECTED: "Đã từ chối",
};

const FILTER_TABS: Array<{ key: OfferFilter; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ phản hồi" },
  { key: "accepted", label: "Đã nhận" },
  { key: "rejected", label: "Đã từ chối" },
];

function formatCurrency(amount?: number | null) {
  if (amount == null) return "Chưa cập nhật";
  return `${amount.toLocaleString("vi-VN")} VND/tháng`;
}

function getOfferDescription(app?: AppItem | null) {
  if (!app?.offerDetails?.trim())
    return "Nhà tuyển dụng chưa bổ sung mô tả chi tiết.";
  return app.offerDetails.trim();
}

function getOfferRoundLabel(round?: number) {
  return `Vòng ${round && round > 0 ? round : 1}`;
}

function OfferOverview({ app }: { app: AppItem }) {
  return (
    <div className="jlx-modal__stack">
      <div className="jlx-modal__summary">
        <div className="jlx-modal__summary-card">
          <span className="jlx-modal__summary-label">Công ty</span>
          <strong className="jlx-modal__summary-value">{app.company}</strong>
        </div>
        <div className="jlx-modal__summary-card">
          <span className="jlx-modal__summary-label">Vị trí</span>
          <strong className="jlx-modal__summary-value">{app.title}</strong>
        </div>
        <div className="jlx-modal__summary-card">
          <span className="jlx-modal__summary-label">Đợt đề nghị</span>
          <strong className="jlx-modal__summary-value">
            {getOfferRoundLabel(app.offerRound)}
          </strong>
        </div>
      </div>

      {app.offerSalary != null && (
        <div className="jlx-modal__salary-card">
          <span className="jlx-modal__salary-label">Mức lương đề nghị</span>
          <strong className="jlx-modal__salary-value">
            {formatCurrency(app.offerSalary)}
          </strong>
        </div>
      )}

      <div className="jlx-offer-modal-content">
        <div className="jlx-offer-details">
          <div className="jlx-offer-details__label">
            <FileText size={12} />
            Nội dung đề nghị
          </div>
          <div className="jlx-offer-details__content">
            {getOfferDescription(app)}
          </div>
        </div>
      </div>

      {app.offerAdditionalRequirements?.trim() && (
        <div className="jlx-modal__note-card">
          <div className="jlx-modal__note-label">Yêu cầu bổ sung</div>
          <div className="jlx-modal__note-content">
            {app.offerAdditionalRequirements.trim()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobLabOffersView({
  applications,
  onRefresh,
}: JobLabOffersViewProps) {
  const [filter, setFilter] = useState<OfferFilter>("all");
  const [counterAppId, setCounterAppId] = useState<string | null>(null);
  const [counterSalary, setCounterSalary] = useState("");
  const [counterAdditionalReqs, setCounterAdditionalReqs] = useState("");
  const [viewAppId, setViewAppId] = useState<string | null>(null);
  const [viewText, setViewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const modalRoot = typeof document !== "undefined" ? document.body : null;

  const offerApps = useMemo(() => {
    return applications.filter(
      (application) =>
        application.type === "REGULAR" &&
        [
          JobApplicationStatus.OFFER_SENT,
          JobApplicationStatus.OFFER_ACCEPTED,
          JobApplicationStatus.OFFER_REJECTED,
        ].includes(application.status as JobApplicationStatus),
    );
  }, [applications]);

  const stats = useMemo(
    () => ({
      total: offerApps.length,
      pending: offerApps.filter(
        (app) => app.status === JobApplicationStatus.OFFER_SENT,
      ).length,
      accepted: offerApps.filter(
        (app) => app.status === JobApplicationStatus.OFFER_ACCEPTED,
      ).length,
      rejected: offerApps.filter(
        (app) => app.status === JobApplicationStatus.OFFER_REJECTED,
      ).length,
    }),
    [offerApps],
  );

  const filteredApps = useMemo(() => {
    if (filter === "pending") {
      return offerApps.filter(
        (app) => app.status === JobApplicationStatus.OFFER_SENT,
      );
    }
    if (filter === "accepted") {
      return offerApps.filter(
        (app) => app.status === JobApplicationStatus.OFFER_ACCEPTED,
      );
    }
    if (filter === "rejected") {
      return offerApps.filter(
        (app) => app.status === JobApplicationStatus.OFFER_REJECTED,
      );
    }
    return offerApps;
  }, [filter, offerApps]);

  const groupedByJob = useMemo(() => {
    const groups: Record<string, AppItem[]> = {};
    filteredApps.forEach((app) => {
      if (!groups[app.id]) groups[app.id] = [];
      groups[app.id].push(app);
    });
    return groups;
  }, [filteredApps]);

  const activeViewApp = useMemo(
    () => applications.find((app) => app.id === viewAppId) ?? null,
    [applications, viewAppId],
  );
  const activeCounterApp = useMemo(
    () => applications.find((app) => app.id === counterAppId) ?? null,
    [applications, counterAppId],
  );
  const hasOpenModal = activeViewApp !== null || activeCounterApp !== null;

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    if (!hasOpenModal) return undefined;

    document.body.classList.add("jlx-modal-open");
    return () => {
      document.body.classList.remove("jlx-modal-open");
    };
  }, [hasOpenModal]);

  const closeAcceptModal = () => {
    setViewAppId(null);
    setViewText("");
  };

  const closeCounterModal = () => {
    setCounterAppId(null);
    setCounterSalary("");
    setCounterAdditionalReqs("");
  };

  const handleAccept = (app: AppItem) => {
    setViewText("");
    setViewAppId(app.id);
  };

  const handleAcceptSubmit = async () => {
    if (!activeViewApp) return;

    try {
      setSubmitting(true);
      await jobService.updateApplicationStatus(activeViewApp.applicationId, {
        status: JobApplicationStatus.OFFER_ACCEPTED,
        candidateOfferResponse: viewText.trim() || undefined,
      });
      closeAcceptModal();
      onRefresh();
    } catch (error) {
      console.error("Accept offer failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCounter = async () => {
    if (!activeCounterApp || !counterSalary.trim()) return;

    const salary =
      parseInt(counterSalary.replace(/[^0-9]/g, ""), 10) || undefined;

    try {
      setSubmitting(true);
      await jobService.updateApplicationStatus(activeCounterApp.applicationId, {
        status: JobApplicationStatus.OFFER_REJECTED,
        counterSalaryAmount: salary,
        counterAdditionalRequirements:
          counterAdditionalReqs.trim() || undefined,
      });
      closeCounterModal();
      onRefresh();
    } catch (error) {
      console.error("Counter offer failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const acceptModal =
    modalRoot && activeViewApp
      ? createPortal(
          <div className="jlx-modal-overlay" onClick={closeAcceptModal}>
            <div
              className="jlx-modal jlx-modal--offer"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="jlx-offer-accept-title"
            >
              <div className="jlx-modal__header">
                <div className="jlx-modal__header-left">
                  <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
                  <div className="jlx-modal__title-group">
                    <span className="jlx-modal__eyebrow">Phản hồi đề nghị</span>
                    <h3 id="jlx-offer-accept-title">Chấp nhận đề nghị</h3>
                  </div>
                </div>
                <button
                  className="jlx-modal__close"
                  onClick={closeAcceptModal}
                  aria-label="Đóng"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="jlx-modal__body">
                <p className="jlx-modal__desc">
                  Xác nhận lại đề nghị tuyển dụng trước khi gửi phản hồi chính
                  thức cho nhà tuyển dụng.
                </p>

                <OfferOverview app={activeViewApp} />

                <div className="jlx-field">
                  <label className="jlx-field__label">
                    Lời nhắn kèm theo (tùy chọn)
                  </label>
                  <textarea
                    className="jlx-textarea"
                    rows={4}
                    value={viewText}
                    onChange={(event) => setViewText(event.target.value)}
                    placeholder="Ví dụ: Tôi đồng ý với đề nghị và có thể bắt đầu theo thời gian hai bên đã thống nhất."
                  />
                </div>
              </div>

              <div className="jlx-modal__actions">
                <button
                  className="jlx-btn jlx-btn--ghost"
                  onClick={closeAcceptModal}
                >
                  Hủy
                </button>
                <button
                  className="jlx-btn jlx-btn--primary"
                  onClick={handleAcceptSubmit}
                  disabled={submitting}
                >
                  <CheckCircle2 size={14} />
                  {submitting ? "Đang gửi phản hồi..." : "Xác nhận chấp nhận"}
                </button>
              </div>
            </div>
          </div>,
          modalRoot,
        )
      : null;

  const counterModal =
    modalRoot && activeCounterApp
      ? createPortal(
          <div className="jlx-modal-overlay" onClick={closeCounterModal}>
            <div
              className="jlx-modal jlx-modal--counter"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="jlx-offer-counter-title"
            >
              <div className="jlx-modal__header">
                <div className="jlx-modal__header-left">
                  <AlertTriangle size={18} style={{ color: "#fbbf24" }} />
                  <div className="jlx-modal__title-group">
                    <span className="jlx-modal__eyebrow">Thương lượng lại</span>
                    <h3 id="jlx-offer-counter-title">Gửi phản đề nghị</h3>
                  </div>
                </div>
                <button
                  className="jlx-modal__close"
                  onClick={closeCounterModal}
                  aria-label="Đóng"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="jlx-modal__body">
                <p className="jlx-modal__desc">
                  Cập nhật mức lương mong muốn và các điều kiện bạn cần để tiếp
                  tục tiến trình tuyển dụng.
                </p>

                {activeCounterApp.offerRound === 2 && (
                  <div className="jlx-modal__notice jlx-modal__notice--warning">
                    <AlertTriangle size={14} />
                    <span>
                      Đây là vòng đề nghị cuối cùng. Nếu tiếp tục từ chối, quy
                      trình thương lượng có thể kết thúc.
                    </span>
                  </div>
                )}

                <OfferOverview app={activeCounterApp} />

                <div className="jlx-field">
                  <label className="jlx-field__label">
                    <DollarSign size={12} style={{ color: "#22c55e" }} />
                    Mức lương mong muốn (VND){" "}
                    <span className="jlx-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="jlx-input"
                    value={counterSalary}
                    onChange={(event) => {
                      const raw = event.target.value.replace(/[^0-9]/g, "");
                      setCounterSalary(
                        raw ? parseInt(raw, 10).toLocaleString("vi-VN") : "",
                      );
                    }}
                    placeholder="Ví dụ: 28.000.000"
                  />
                  {counterSalary && (
                    <span className="jlx-field__hint">
                      {parseInt(
                        counterSalary.replace(/[^0-9]/g, ""),
                        10,
                      ).toLocaleString("vi-VN")}{" "}
                      VND/tháng
                    </span>
                  )}
                </div>

                <div className="jlx-field">
                  <label className="jlx-field__label">
                    <Plus size={12} style={{ color: "#00f5ff" }} />
                    Điều kiện bổ sung
                  </label>
                  <textarea
                    className="jlx-textarea"
                    rows={4}
                    value={counterAdditionalReqs}
                    onChange={(event) =>
                      setCounterAdditionalReqs(event.target.value)
                    }
                    placeholder="Ví dụ: Tôi mong muốn làm việc remote toàn thời gian, hỗ trợ thiết bị và thời gian nghỉ phép rõ ràng."
                  />
                </div>
              </div>

              <div className="jlx-modal__actions">
                <button
                  className="jlx-btn jlx-btn--ghost"
                  onClick={closeCounterModal}
                >
                  Hủy
                </button>
                <button
                  className="jlx-btn jlx-btn--danger"
                  onClick={handleCounter}
                  disabled={submitting || !counterSalary.trim()}
                >
                  <AlertTriangle size={14} />
                  {submitting ? "Đang gửi phản đề nghị..." : "Gửi phản đề nghị"}
                </button>
              </div>
            </div>
          </div>,
          modalRoot,
        )
      : null;

  return (
    <div className="jlx-offers-view">
      <div className="jlx-offers-view__hero">
        <div className="jlx-offers-view__hero-left">
          <div className="jlx-offers-view__hero-title">
            <Send size={16} />
            Các đề nghị đã nhận
          </div>
          <div className="jlx-offers-view__hero-sub">
            Xem, so sánh và phản hồi đề nghị tuyển dụng từ nhà tuyển dụng.
          </div>
        </div>
        <div className="jlx-offers-stats">
          <div className="jlx-offers-stat">
            <div className="jlx-offers-stat__val">{stats.total}</div>
            <div className="jlx-offers-stat__lbl">Tổng</div>
          </div>
          <div className="jlx-offers-stat">
            <div className="jlx-offers-stat__val jlx-offers-stat__val--pending">
              {stats.pending}
            </div>
            <div className="jlx-offers-stat__lbl">Chờ</div>
          </div>
          <div className="jlx-offers-stat">
            <div className="jlx-offers-stat__val jlx-offers-stat__val--accepted">
              {stats.accepted}
            </div>
            <div className="jlx-offers-stat__lbl">Nhận</div>
          </div>
          <div className="jlx-offers-stat">
            <div className="jlx-offers-stat__val jlx-offers-stat__val--rejected">
              {stats.rejected}
            </div>
            <div className="jlx-offers-stat__lbl">Từ chối</div>
          </div>
        </div>
      </div>

      <div className="jlx-offers-tabs">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? stats.total
              : tab.key === "pending"
                ? stats.pending
                : tab.key === "accepted"
                  ? stats.accepted
                  : stats.rejected;

          return (
            <button
              key={tab.key}
              className={`jlx-offers-tab ${filter === tab.key ? "is-active" : ""}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
              <span className="jlx-offers-tab__count">{count}</span>
            </button>
          );
        })}
      </div>

      {offerApps.length === 0 ? (
        <div className="jlx-offers-empty">
          <FileText size={48} />
          <p>
            Chưa có đề nghị nào. Khi nhà tuyển dụng gửi đề nghị, hệ thống sẽ
            hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="jlx-offers-list">
          {Object.entries(groupedByJob).map(([appId, apps]) => {
            const primary = apps[0];

            return (
              <div key={appId} className="jlx-offer-group">
                <div className="jlx-offer-group__header">
                  <div className="jlx-offer-group__job">
                    <div className="jlx-offer-group__job-icon">
                      <Briefcase size={15} />
                    </div>
                    <div className="jlx-offer-group__job-info">
                      <div className="jlx-offer-group__job-title">
                        {primary.title}
                      </div>
                      <div className="jlx-offer-group__company">
                        {primary.company}
                      </div>
                    </div>
                  </div>
                  {apps.length > 1 && (
                    <span className="jlx-offers-tab__count">
                      {apps.length} đề nghị
                    </span>
                  )}
                </div>

                <div className="jlx-offer-group__body">
                  {apps.map((app) => (
                    <OfferItem
                      key={app.applicationId}
                      app={app}
                      onAccept={() => handleAccept(app)}
                      onCounter={() => {
                        setCounterAppId(app.id);
                        setCounterSalary("");
                        setCounterAdditionalReqs("");
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {acceptModal}
      {counterModal}
    </div>
  );
}

function OfferItem({
  app,
  onAccept,
  onCounter,
}: {
  app: AppItem;
  onAccept: () => void;
  onCounter: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusClass =
    app.status === JobApplicationStatus.OFFER_ACCEPTED
      ? "is-accepted"
      : app.status === JobApplicationStatus.OFFER_REJECTED
        ? "is-rejected"
        : "";

  const statusStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.18rem 0.5rem",
    borderRadius: "6px",
    background: `${STATUS_COLORS[app.status]}18`,
    color: STATUS_COLORS[app.status],
    border: `1px solid ${STATUS_COLORS[app.status]}40`,
  };

  return (
    <div className={`jlx-offer-item ${statusClass}`}>
      <div className="jlx-offer-item__top">
        <div className="jlx-offer-item__left">
          <span
            className={`jlx-offer-item__round ${app.offerRound === 2 ? "jlx-offer-item__round--r2" : "jlx-offer-item__round--r1"}`}
          >
            V{app.offerRound ?? 1}
          </span>
          <span style={statusStyle}>
            {app.status === JobApplicationStatus.OFFER_SENT && (
              <Clock3 size={11} />
            )}
            {app.status === JobApplicationStatus.OFFER_ACCEPTED && (
              <CheckCircle2 size={11} />
            )}
            {app.status === JobApplicationStatus.OFFER_REJECTED && (
              <XCircle size={11} />
            )}
            {STATUS_LABELS[app.status]}
          </span>
        </div>
      </div>

      {app.offerSalary != null && (
        <div
          className="jlx-offer-item__details"
          style={{
            borderLeft: "3px solid #10b981",
            paddingLeft: "0.6rem",
            marginBottom: "0.4rem",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              color: "#64748b",
              marginBottom: "0.15rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Mức lương đề nghị
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#10b981" }}>
            {formatCurrency(app.offerSalary)}
          </div>
        </div>
      )}

      {app.offerDetails && (
        <div className="jlx-offer-item__details">
          <div
            style={{
              fontSize: "0.7rem",
              color: "#64748b",
              marginBottom: "0.15rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Điều khoản
          </div>
          {app.offerDetails.length > 150 && !expanded
            ? `${app.offerDetails.substring(0, 150)}...`
            : app.offerDetails}
          {app.offerDetails.length > 150 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "none",
                border: "none",
                color: "#00f5ff",
                cursor: "pointer",
                fontSize: "0.72rem",
                padding: "0.25rem 0",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Thu gọn" : "Xem thêm"}
            </button>
          )}
        </div>
      )}

      {app.offerAdditionalRequirements && (
        <div
          style={{
            fontSize: "0.72rem",
            color: "#94a3b8",
            marginTop: "0.3rem",
            paddingLeft: "0.3rem",
            borderLeft: "2px solid rgba(0,245,255,0.3)",
          }}
        >
          <span
            style={{
              color: "#64748b",
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Yêu cầu bổ sung:
          </span>{" "}
          {app.offerAdditionalRequirements}
        </div>
      )}

      {app.status === JobApplicationStatus.OFFER_REJECTED &&
        app.offerRound === 2 && (
          <div className="jlx-offer-rejected-notice">
            <AlertTriangle size={13} />
            <p>
              Đây là vòng cuối. Bạn không thể gửi thêm phản đề nghị sau lần này.
            </p>
          </div>
        )}

      {app.status === JobApplicationStatus.OFFER_SENT && (
        <div className="jlx-offer-item__actions">
          <button className="jlx-btn jlx-btn--primary" onClick={onAccept}>
            <CheckCircle2 size={13} />
            Chấp nhận
          </button>
          <button className="jlx-btn jlx-btn--ghost" onClick={onCounter}>
            <AlertTriangle size={13} />
            {app.offerRound === 2 ? "Từ chối" : "Phản đề nghị"}
          </button>
        </div>
      )}

      {(app.counterSalaryAmount ||
        app.counterAdditionalRequirements ||
        app.candidateOfferResponse) && (
        <div className="jlx-offer-item__history">
          <div className="jlx-offer-history">
            <div className="jlx-offer-history__item">
              <div className="jlx-offer-history__item-header">
                <Clock3 size={11} />
                <span>Phản hồi của bạn</span>
              </div>
              {app.counterSalaryAmount && (
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#fbbf24",
                    marginBottom: "0.25rem",
                  }}
                >
                  Yêu cầu: {formatCurrency(app.counterSalaryAmount)}
                </div>
              )}
              {app.counterAdditionalRequirements && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#94a3b8",
                    marginBottom: "0.2rem",
                  }}
                >
                  {app.counterAdditionalRequirements}
                </div>
              )}
              {app.candidateOfferResponse && (
                <div className="jlx-offer-history__item-text">
                  {app.candidateOfferResponse}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
