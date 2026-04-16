import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  DollarSign,
  Plus,
  Send,
  UserCheck,
  XCircle,
} from "lucide-react";
import { JobApplicationResponse, JobApplicationStatus } from "../../data/jobDTOs";
import jobService from "../../services/jobService";
import { getApplicantDisplayName, getApplicantInitials } from "../../utils/recruitmentUi";

interface FullTimeJobOffersTabProps {
  job: { isRemote: boolean; isNegotiable: boolean; id: number; minBudget?: number; maxBudget?: number };
  applications: JobApplicationResponse[];
  onRefresh: () => void;
}

type OfferFilter = "all" | "round1" | "round2";

const OFFER_STATUS_COLORS: Record<string, string> = {
  OFFER_SENT: "#a78bfa",
  OFFER_ACCEPTED: "#10b981",
  OFFER_REJECTED: "#f87171",
};

const OFFER_STATUS_LABELS: Record<string, string> = {
  OFFER_SENT: "Chờ phản hồi",
  OFFER_ACCEPTED: "Đã chấp nhận",
  OFFER_REJECTED: "Đã từ chối / Phản đề nghị",
};

export default function FullTimeJobOffersTab({
  job,
  applications,
  onRefresh,
}: FullTimeJobOffersTabProps) {
  const [filter, setFilter] = useState<OfferFilter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sendOfferModalAppId, setSendOfferModalAppId] = useState<number | null>(null);
  const [offerSalary, setOfferSalary] = useState<string>("");
  const [offerAdditionalReqs, setOfferAdditionalReqs] = useState<string>("");

  // Derive offer applications
  const offerApps = useMemo(() => {
    return applications.filter((a) =>
      [JobApplicationStatus.OFFER_SENT, JobApplicationStatus.OFFER_ACCEPTED, JobApplicationStatus.OFFER_REJECTED].includes(a.status as JobApplicationStatus)
    );
  }, [applications]);

  // Ready pool: interviewed candidates who haven't received an offer yet
  const readyPool = useMemo(() => {
    return applications.filter(
      (a) => a.status === JobApplicationStatus.INTERVIEWED
    );
  }, [applications]);

  // Group by round
  const round1Apps = useMemo(
    () => offerApps.filter((a) => a.offerRound === 1),
    [offerApps]
  );
  const round2Apps = useMemo(
    () => offerApps.filter((a) => a.offerRound === 2),
    [offerApps]
  );

  // Filtered list
  const filteredApps = useMemo(() => {
    if (filter === "round1") return round1Apps;
    if (filter === "round2") return round2Apps;
    return offerApps;
  }, [filter, round1Apps, round2Apps]);

  // Selected application
  const selectedApp = useMemo(
    () => offerApps.find((a) => a.id === selectedId) ?? null,
    [offerApps, selectedId]
  );

  // Auto-select first offer when list changes
  useEffect(() => {
    if (selectedId === null && offerApps.length > 0) {
      setSelectedId(offerApps[0].id);
    }
  }, [offerApps]);

  const handleSendOffer = async () => {
    if (sendOfferModalAppId === null) return;
    const app = applications.find((a) => a.id === sendOfferModalAppId);
    if (!app) return;
    const salary = offerSalary ? parseInt(offerSalary.replace(/[^0-9]/g, "")) : undefined;
    try {
      await jobService.updateApplicationStatus(app.id, {
        status: JobApplicationStatus.OFFER_SENT,
        offerSalary: salary,
        offerAdditionalRequirements: offerAdditionalReqs.trim() || undefined,
        offerDetails: offerAdditionalReqs.trim() || undefined,
      });
      setSendOfferModalAppId(null);
      setOfferSalary("");
      setOfferAdditionalReqs("");
      onRefresh();
    } catch (err) {
      console.error("Failed to send offer:", err);
    }
  };

  const handleSendOfferRound2 = (app: JobApplicationResponse) => {
    setSendOfferModalAppId(app.id);
    setOfferSalary(app.offerSalary ? String(app.offerSalary) : "");
    setOfferAdditionalReqs(app.offerAdditionalRequirements ?? app.offerDetails ?? "");
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "OFFER_SENT": return "ftj-offer-card__status-row--pending";
      case "OFFER_ACCEPTED": return "ftj-offer-card__status-row--accepted";
      case "OFFER_REJECTED": return "ftj-offer-card__status-row--rejected";
      default: return "";
    }
  };

  return (
    <div className="ftj-offers">
      {/* Hero */}
      <div className="ftj-offers__hero">
        <div className="ftj-offers__hero-left">
          <div className="ftj-offers__hero-title">
            <Send size={16} />
            Đề nghị tuyển dụng
          </div>
          <div className="ftj-offers__hero-sub">
            Quản lý và theo dõi các đề nghị cho job này
          </div>
        </div>
        <div className="ftj-offers__hero-stats">
          <div className="ftj-offers__hero-stat">
            <div className="ftj-offers__hero-stat-val">{offerApps.length}</div>
            <div className="ftj-offers__hero-stat-lbl">Tổng</div>
          </div>
          <div className="ftj-offers__hero-stat">
            <div className="ftj-offers__hero-stat-val ftj-offers__hero-stat-val--amber">
              {offerApps.filter((a) => a.status === JobApplicationStatus.OFFER_SENT).length}
            </div>
            <div className="ftj-offers__hero-stat-lbl">Chờ</div>
          </div>
          <div className="ftj-offers__hero-stat">
            <div className="ftj-offers__hero-stat-val ftj-offers__hero-stat-val--green">
              {offerApps.filter((a) => a.status === JobApplicationStatus.OFFER_ACCEPTED).length}
            </div>
            <div className="ftj-offers__hero-stat-lbl">Nhận</div>
          </div>
          <div className="ftj-offers__hero-stat">
            <div className="ftj-offers__hero-stat-val ftj-offers__hero-stat-val--red">
              {offerApps.filter((a) => a.status === JobApplicationStatus.OFFER_REJECTED).length}
            </div>
            <div className="ftj-offers__hero-stat-lbl">Từ chối</div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="ftj-offers__layout">
        {/* Rail */}
        <div className="ftj-offers__rail">
          {/* Filters */}
          <div className="ftj-offers__rail-filters">
            {(["all", "round1", "round2"] as OfferFilter[]).map((f) => {
              const count =
                f === "all"
                  ? offerApps.length
                  : f === "round1"
                  ? round1Apps.length
                  : round2Apps.length;
              return (
                <button
                  key={f}
                  className={`ftj-offers__rail-filter ${filter === f ? "is-active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "Tất cả" : f === "round1" ? "Vòng 1" : "Vòng 2"} ({count})
                </button>
              );
            })}
          </div>

          {/* Offer list */}
          <div className="ftj-offers__rail-list">
            {filteredApps.length === 0 ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "#475569", fontSize: "0.8rem" }}>
                Chưa có đề nghị nào
              </div>
            ) : (
              filteredApps.map((app) => (
                <button
                  key={app.id}
                  className={`ftj-offer-card ${selectedId === app.id ? "is-active" : ""}`}
                  onClick={() => setSelectedId(app.id)}
                >
                  <div className="ftj-offer-card__top">
                    <span className="ftj-offer-card__name">
                      {getApplicantDisplayName(app.userFullName, app.userEmail)}
                    </span>
                    <span
                      className={`ftj-offer-card__badge ${
                        app.offerRound === 2
                          ? "ftj-offer-card__badge--r2"
                          : "ftj-offer-card__badge--r1"
                      }`}
                    >
                      V{app.offerRound ?? 1}
                    </span>
                  </div>
                  <div className={`ftj-offer-card__status-row ${getStatusClass(app.status)}`}>
                    {app.status === JobApplicationStatus.OFFER_SENT && <Clock3 size={11} />}
                    {app.status === JobApplicationStatus.OFFER_ACCEPTED && <CheckCircle2 size={11} />}
                    {app.status === JobApplicationStatus.OFFER_REJECTED && <XCircle size={11} />}
                    <span>{OFFER_STATUS_LABELS[app.status] ?? app.status}</span>
                  </div>
                  <div className="ftj-offer-card__meta">
                    {formatDate(app.processedAt ?? app.appliedAt)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="ftj-offer-detail">
          {selectedApp === null ? (
            <div className="ftj-offer-detail__empty">
              <Send size={40} />
              <p>Chọn một đề nghị để xem chi tiết</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="ftj-offer-detail__header">
                <div className="ftj-offer-detail__candidate">
                  <div className="ftj-offer-detail__avatar">
                    {getApplicantInitials(selectedApp.userFullName, selectedApp.userEmail)}
                  </div>
                  <div className="ftj-offer-detail__candidate-info">
                    <span className="ftj-offer-detail__candidate-name">
                      {getApplicantDisplayName(selectedApp.userFullName, selectedApp.userEmail)}
                    </span>
                    <span className="ftj-offer-detail__candidate-title">
                      {selectedApp.userProfessionalTitle ?? "Ứng viên"}
                    </span>
                  </div>
                </div>
                <span
                  className={`ftj-offer-detail__round-badge ${
                    selectedApp.offerRound === 2
                      ? "ftj-offer-detail__round-badge--r2"
                      : "ftj-offer-detail__round-badge--r1"
                  }`}
                >
                  {selectedApp.offerRound === 2 ? (
                    <>
                      <AlertTriangle size={11} />
                      Vòng cuối
                    </>
                  ) : (
                    <>
                      <Send size={11} />
                      Vòng {selectedApp.offerRound ?? 1}
                    </>
                  )}
                </span>
              </div>

              {/* Round 2 warning */}
              {selectedApp.status === JobApplicationStatus.OFFER_REJECTED &&
                selectedApp.offerRound === 2 && (
                  <div className="ftj-offer-detail__round2-warning">
                    <AlertTriangle size={13} />
                    <span>
                      Ứng viên đã từ chối cả 2 lần đề nghị. Không thể gửi thêm đề nghị.
                    </span>
                  </div>
                )}

              {/* Body */}
              <div className="ftj-offer-detail__body">
                {/* Recruiter's offered salary */}
                {selectedApp.offerSalary && (
                  <div className="ftj-offer-detail__section">
                    <div className="ftj-offer-detail__section-label">Mức lương đề nghị</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#10b981" }}>
                      {Number(selectedApp.offerSalary).toLocaleString("vi-VN")} VND/tháng
                    </div>
                  </div>
                )}

                {/* Offer details */}
                {selectedApp.offerDetails && (
                  <div className="ftj-offer-detail__section">
                    <div className="ftj-offer-detail__section-label">Điều khoản bổ sung</div>
                    <div className="ftj-offer-detail__offer-text">
                      {selectedApp.offerDetails}
                    </div>
                  </div>
                )}

                {/* Additional requirements from recruiter */}
                {selectedApp.offerAdditionalRequirements && (
                  <div className="ftj-offer-detail__section">
                    <div className="ftj-offer-detail__section-label">Yêu cầu bổ sung</div>
                    <div style={{ fontSize: "0.85rem", color: "#94a3b8", padding: "0.5rem 0.75rem", background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.12)", borderRadius: 8 }}>
                      {selectedApp.offerAdditionalRequirements}
                    </div>
                  </div>
                )}

                {/* Candidate's counter-offer */}
                {(selectedApp.counterSalaryAmount || selectedApp.counterAdditionalRequirements) && (
                  <div className="ftj-offer-detail__section">
                    <div className="ftj-offer-detail__section-label" style={{ color: "#fbbf24" }}>
                      Phản đề nghị từ ứng viên
                    </div>
                    {selectedApp.counterSalaryAmount && (
                      <div style={{ fontSize: "1rem", fontWeight: 600, color: "#fbbf24", marginBottom: "0.4rem" }}>
                        Yêu cầu: {Number(selectedApp.counterSalaryAmount).toLocaleString("vi-VN")} VND/tháng
                      </div>
                    )}
                    {selectedApp.counterAdditionalRequirements && (
                      <div style={{ fontSize: "0.85rem", color: "#94a3b8", padding: "0.5rem 0.75rem", background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 8 }}>
                        {selectedApp.counterAdditionalRequirements}
                      </div>
                    )}
                  </div>
                )}

                {/* Candidate response (legacy/free-text) */}
                {selectedApp.candidateOfferResponse && !selectedApp.counterSalaryAmount && (
                  <div className="ftj-offer-detail__section">
                    <div className="ftj-offer-detail__section-label">
                      Phản hồi của ứng viên
                    </div>
                    <div
                      className={`ftj-offer-detail__response ${
                        selectedApp.status === JobApplicationStatus.OFFER_ACCEPTED
                          ? "ftj-offer-detail__response--accepted"
                          : "ftj-offer-detail__response--counter"
                      }`}
                    >
                      {selectedApp.candidateOfferResponse}
                    </div>
                  </div>
                )}

                {/* Status indicator */}
                <div className="ftj-offer-detail__section">
                  <div className="ftj-offer-detail__section-label">Trạng thái</div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.3rem 0.75rem",
                      borderRadius: "8px",
                      background: `${OFFER_STATUS_COLORS[selectedApp.status]}18`,
                      border: `1px solid ${OFFER_STATUS_COLORS[selectedApp.status]}40`,
                      color: OFFER_STATUS_COLORS[selectedApp.status],
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    {selectedApp.status === JobApplicationStatus.OFFER_SENT && <Clock3 size={13} />}
                    {selectedApp.status === JobApplicationStatus.OFFER_ACCEPTED && <CheckCircle2 size={13} />}
                    {selectedApp.status === JobApplicationStatus.OFFER_REJECTED && <XCircle size={13} />}
                    {OFFER_STATUS_LABELS[selectedApp.status] ?? selectedApp.status}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedApp.status === JobApplicationStatus.OFFER_REJECTED &&
                selectedApp.offerRound === 1 && (
                  <div className="ftj-offer-detail__actions">
                    <button
                      className="ftj-btn ftj-btn--primary"
                      onClick={() => handleSendOfferRound2(selectedApp)}
                    >
                      <Send size={13} />
                      Gửi đề nghị lần 2
                    </button>
                    <button className="ftj-btn ftj-btn--danger">
                      <XCircle size={13} />
                      Kết thúc
                    </button>
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {/* Ready pool */}
      <div className="ftj-ready-pool">
        <div className="ftj-ready-pool__header">
          <UserCheck size={14} />
          Ứng viên sẵn sàng nhận đề nghị ({readyPool.length})
        </div>
        {readyPool.length === 0 ? (
          <div className="ftj-ready-pool__empty">
            Không có ứng viên nào đang chờ nhận đề nghị
          </div>
        ) : (
          <div className="ftj-ready-pool__list">
            {readyPool.map((app) => (
              <div key={app.id} className="ftj-ready-pool__item">
                <div className="ftj-ready-pool__item-left">
                  <div className="ftj-ready-pool__item-avatar">
                    {getApplicantInitials(app.userFullName, app.userEmail)}
                  </div>
                  <div>
                    <div className="ftj-ready-pool__item-name">
                      {getApplicantDisplayName(app.userFullName, app.userEmail)}
                    </div>
                    <div className="ftj-ready-pool__item-title">
                      {app.userProfessionalTitle ?? "Ứng viên"}
                    </div>
                  </div>
                </div>
                <button
                  className="ftj-btn ftj-btn--cyan"
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.72rem" }}
                  onClick={() => {
                    setSendOfferModalAppId(app.id);
                    setOfferSalary("");
                    setOfferAdditionalReqs("");
                  }}
                >
                  <Send size={12} />
                  Gửi đề nghị
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send offer modal */}
      {sendOfferModalAppId !== null && (
        <div className="ftj-modal-overlay" onClick={() => setSendOfferModalAppId(null)}>
          <div className="ftj-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ftj-modal__header">
              <div className="ftj-modal__title">
                <Send size={16} />
                Gửi đề nghị tuyển dụng
              </div>
              <button
                className="ftj-modal__close"
                onClick={() => setSendOfferModalAppId(null)}
              >
                ×
              </button>
            </div>
            <div className="ftj-modal__body">
              <div className="ftj-modal__field">
                <label className="ftj-modal__label">
                  <DollarSign size={13} />
                  Mức lương đề nghị (VND) <span className="ftj-required">*</span>
                </label>
                <input
                  type="text"
                  className="ftj-modal__input"
                  value={offerSalary}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setOfferSalary(raw ? parseInt(raw).toLocaleString("vi-VN") : "");
                  }}
                  placeholder={(() => {
                    if (job.minBudget && job.maxBudget) {
                      return `${job.minBudget.toLocaleString("vi-VN")} - ${job.maxBudget.toLocaleString("vi-VN")} VND`;
                    }
                    return "Ví dụ: 25.000.000";
                  })()}
                />
                {offerSalary && (
                  <span className="ftj-modal__field-hint">
                    = {parseInt(offerSalary.replace(/[^0-9]/g, "")).toLocaleString("vi-VN")} VND/tháng
                  </span>
                )}
              </div>
              <div className="ftj-modal__field">
                <label className="ftj-modal__label">
                  <Plus size={13} />
                  Yêu cầu &amp; điều kiện bổ sung
                </label>
                <textarea
                  className="ftj-modal__textarea"
                  rows={5}
                  value={offerAdditionalReqs}
                  onChange={(e) => setOfferAdditionalReqs(e.target.value)}
                  placeholder="Mô tả thêm các điều kiện: thời hạn thử việc, quyền lợi, lịch làm việc, địa điểm, yêu cầu kỹ năng bổ sung..."
                />
              </div>
            </div>
            <div className="ftj-modal__footer">
              <button
                className="ftj-btn ftj-btn--ghost"
                onClick={() => setSendOfferModalAppId(null)}
              >
                Hủy
              </button>
              <button
                className="ftj-btn ftj-btn--primary"
                onClick={handleSendOffer}
                disabled={!offerSalary.trim()}
              >
                <Send size={13} />
                Gửi đề nghị
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
