import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileCheck,
  FileSignature,
  FileText,
  Globe,
  Link2,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Send,
  Video,
  XCircle,
} from "lucide-react";
import interviewService, {
  InterviewScheduleResponse,
  InterviewStatus,
} from "../../services/interviewService";
import { JobApplicationStatus } from "../../data/jobDTOs";
import type { AppItem } from "./JobLabPage";
import jobService from "../../services/jobService";
import { showAppError, showAppSuccess } from "../../context/ToastContext";
import "../../styles/JobLabWorkspace.css";
import CandidateOnboardingPanel from "../../components/business-hud/CandidateOnboardingPanel";

interface JobLabFullTimeInlineViewProps {
  app: AppItem;
  onBack: () => void;
  onRefresh: () => void;
}

type FullTimeTab = "overview" | "interviews" | "contracts" | "offers" | "onboarding";

const APP_STATUS_LABELS: Record<string, string> = {
  PENDING: "Mới nộp",
  REVIEWED: "Đã xem",
  ACCEPTED: "Được chọn",
  INTERVIEW_SCHEDULED: "Lịch phỏng vấn",
  INTERVIEWED: "Đã phỏng vấn",
  OFFER_SENT: "Đã gửi đề nghị",
  OFFER_ACCEPTED: "Nhận đề nghị",
  OFFER_REJECTED: "Từ chối đề nghị",
  AWAITING_ONBOARDING_INFO: "Đang cung cấp thông tin",
  HIRED: "Đã tuyển dụng",
  CONTRACT_SIGNED: "Đã ký hợp đồng",
  REJECTED: "Từ chối",
};

const TIMELINE_STEPS = [
  { status: "PENDING", label: "Đã nộp" },
  { status: "REVIEWED", label: "Đã xem" },
  { status: "INTERVIEW_SCHEDULED", label: "Lịch phỏng vấn" },
  { status: "INTERVIEWED", label: "Đã phỏng vấn" },
  { status: "OFFER_SENT", label: "Đề nghị" },
  { status: "OFFER_ACCEPTED", label: "Nhận đề nghị" },
  { status: "AWAITING_ONBOARDING_INFO", label: "Cung cấp thông tin" },
];

const STATUS_ORDER = [
  "PENDING",
  "REVIEWED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "OFFER_SENT",
  "OFFER_ACCEPTED",
  "AWAITING_ONBOARDING_INFO",
];

export default function JobLabFullTimeInlineView({
  app,
  onBack,
  onRefresh,
}: JobLabFullTimeInlineViewProps) {
  const showToastError = (title: string, message: string) => showAppError(title, message);
const showToastSuccess = (title: string, message: string, autoCloseDelay?: number) => showAppSuccess(title, message, autoCloseDelay ?? 5);
  const [activeTab, setActiveTab] = useState<FullTimeTab>("overview");
  const [interviews, setInterviews] = useState<InterviewScheduleResponse[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [interviewActionId, setInterviewActionId] = useState<number | null>(
    null,
  );
  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [acceptOfferLoading, setAcceptOfferLoading] = useState(false);
  const [counterAppId, setCounterAppId] = useState<string | null>(null);
  const [counterSalary, setCounterSalary] = useState<string>("");
  const [counterAdditionalReqs, setCounterAdditionalReqs] =
    useState<string>("");
  const [declineModalInterview, setDeclineModalInterview] =
    useState<InterviewScheduleResponse | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const modalRoot = typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    if (!counterAppId && !declineModalInterview) return undefined;

    document.body.classList.add("jlx-modal-open");
    return () => {
      document.body.classList.remove("jlx-modal-open");
    };
  }, [counterAppId, declineModalInterview]);

  const loadMyInterviews = useCallback(async () => {
    setLoadingInterviews(true);
    try {
      const data = await interviewService.getMyInterviews();
      setInterviews(data.filter((i) => i.applicationId === app.applicationId));
    } catch {
      setInterviews([]);
    } finally {
      setLoadingInterviews(false);
    }
  }, [app.applicationId]);

  // Load interviews for this application (filter by applicationId)
  useEffect(() => {
    if (activeTab !== "interviews") return;
    void loadMyInterviews();
  }, [activeTab, loadMyInterviews]);

  useEffect(() => {
    if (typeof window === "undefined" || activeTab !== "interviews")
      return undefined;
    const refreshInterval = window.setInterval(() => {
      void loadMyInterviews();
    }, 300000);
    return () => window.clearInterval(refreshInterval);
  }, [activeTab, loadMyInterviews]);

  // Load contracts for this application (filter by applicationId)
  useEffect(() => {
    if (activeTab !== "contracts") return;
    setLoadingContracts(true);
    import("../../services/contractService").then((svc) => {
      svc.default
        .getMyContracts("CANDIDATE")
        .then((data: any[]) => {
          setContracts(
            data.filter((c) => c.applicationId === app.applicationId),
          );
          setLoadingContracts(false);
        })
        .catch(() => {
          setContracts([]);
          setLoadingContracts(false);
        });
    });
  }, [activeTab, app.applicationId]);

  const isNegotiable = app.isNegotiable;
  const isRemote = app.isRemote;
  const showContracts = isRemote;
  const showOffers = isRemote && isNegotiable;
  // Show onboarding tab for Remote jobs when status is right
  const showOnboarding =
    isRemote &&
    [
      "OFFER_ACCEPTED",
      "INTERVIEWED", // non-negotiable remote → goes directly to onboarding
      "AWAITING_ONBOARDING_INFO",
    ].includes(app.status);

  const tabs: Array<{
    key: FullTimeTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: "overview", label: "Tổng quan", icon: <FileText size={13} /> },
    { key: "interviews", label: "Phỏng vấn", icon: <Calendar size={13} /> },
    ...(showOnboarding
      ? [
          {
            key: "onboarding" as FullTimeTab,
            label: "Thông tin nhân sự",
            icon: <FileCheck size={13} />,
          },
        ]
      : []),
    ...(showContracts
      ? [
          {
            key: "contracts" as FullTimeTab,
            label: "Hợp đồng",
            icon: <FileSignature size={13} />,
          },
        ]
      : []),
    ...(showOffers
      ? [
          {
            key: "offers" as FullTimeTab,
            label: "Đề nghị",
            icon: <Send size={13} />,
          },
        ]
      : []),
  ];

  const currentStepIdx = STATUS_ORDER.indexOf(app.status);
  const getStepState = (stepIdx: number) => {
    if (stepIdx < currentStepIdx) return "done";
    if (stepIdx === currentStepIdx) return "active";
    return "pending";
  };

  const handleAcceptOffer = async () => {
    try {
      setAcceptOfferLoading(true);
      await jobService.updateApplicationStatus(app.applicationId, {
        status: JobApplicationStatus.OFFER_ACCEPTED,
      });
      onRefresh();
    } catch (err) {
      console.error("Accept offer failed:", err);
    } finally {
      setAcceptOfferLoading(false);
    }
  };

  const handleCounterSubmit = async () => {
    if (!counterSalary.trim()) return;
    const salary = parseInt(counterSalary.replace(/[^0-9]/g, "")) || undefined;
    try {
      setSubmitting(true);
      await jobService.updateApplicationStatus(app.applicationId, {
        status: JobApplicationStatus.OFFER_REJECTED,
        counterSalaryAmount: salary,
        counterAdditionalRequirements:
          counterAdditionalReqs.trim() || undefined,
      });
      setCounterAppId(null);
      setCounterSalary("");
      setCounterAdditionalReqs("");
      onRefresh();
    } catch (err) {
      console.error("Counter offer failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const closeCounterModal = () => {
    setCounterAppId(null);
    setCounterSalary("");
    setCounterAdditionalReqs("");
  };

  const handleConfirmInterview = async (interviewId: number) => {
    try {
      setInterviewActionId(interviewId);
      await interviewService.confirmInterview(interviewId);
      await loadMyInterviews();
      onRefresh();
      showToastSuccess("Đã xác nhận", "Bạn đã xác nhận tham gia phỏng vấn.");
    } catch (error) {
      showToastError(
        "Không thể xác nhận",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setInterviewActionId(null);
    }
  };

  const handleDeclineInterview = async (interviewId: number) => {
    const interview = interviews.find((item) => item.id === interviewId);
    if (!interview) {
      showToastError(
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
      showToastError(
        "Lý do chưa đủ chi tiết",
        "Vui lòng nhập lý do từ chối tối thiểu 10 ký tự.",
      );
      return;
    }

    try {
      setInterviewActionId(declineModalInterview.id);
      await interviewService.declineInterview(declineModalInterview.id, reason);
      await loadMyInterviews();
      onRefresh();
      setDeclineModalInterview(null);
      setDeclineReason("");
      showToastSuccess(
        "Đã từ chối lịch",
        "Hệ thống đã ghi nhận từ chối và cập nhật hồ sơ của bạn.",
      );
    } catch (error) {
      showToastError(
        "Không thể từ chối",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setInterviewActionId(null);
    }
  };

  const formatDateTime = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  };

  const getCountdown = (scheduledAt: string) => {
    const diff = new Date(scheduledAt).getTime() - Date.now();
    if (diff < 0) return { label: "Đã quá hạn", urgency: "overdue" as const };
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 3)
      return { label: `Còn ${days} ngày`, urgency: "normal" as const };
    return {
      label: `Còn ${days > 0 ? `${days}d ` : ""}${hours}h`,
      urgency:
        days === 0 && hours < 2 ? ("urgent" as const) : ("normal" as const),
    };
  };

  const getMeetingIcon = (type: string) => {
    switch (type) {
      case "PHONE_CALL":
        return <Phone size={13} />;
      case "ONSITE":
        return <MapPin size={13} />;
      default:
        return <Video size={13} />;
    }
  };

  const getMeetingLabel = (type: string) => {
    switch (type) {
      case "PHONE_CALL":
        return "Điện thoại";
      case "ONSITE":
        return "Trực tiếp";
      case "GOOGLE_MEET":
        return "Google Meet";
      case "ZOOM":
        return "Zoom";
      case "MICROSOFT_TEAMS":
        return "MS Teams";
      case "SKILLVERSE_ROOM":
        return "SkillVerse Room";
      default:
        return type;
    }
  };

  const getInterviewStatusClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "jlx-ft-interview-card__status--pending";
      case "CONFIRMED":
        return "jlx-ft-interview-card__status--confirmed";
      case "COMPLETED":
        return "jlx-ft-interview-card__status--completed";
      case "CANCELLED":
        return "jlx-ft-interview-card__status--cancelled";
      default:
        return "jlx-ft-interview-card__status--pending";
    }
  };

  return (
    <div className="jlx-fulltime-view">
      {/* Back bar */}
      <div className="jlx-fulltime-bar">
        <button className="jlx-fulltime-bar__back" onClick={onBack}>
          <ArrowLeft size={14} />
          Quay lại
        </button>
        <div className="jlx-fulltime-bar__job">
          <div className="jlx-fulltime-bar__job-icon">
            <Briefcase size={14} />
          </div>
          <span className="jlx-fulltime-bar__job-title">{app.title}</span>
        </div>
        <span
          className="jlx-fulltime-bar__status"
          style={{
            background: "rgba(0,245,255,0.1)",
            color: "#00f5ff",
            border: "1px solid rgba(0,245,255,0.2)",
          }}
        >
          {APP_STATUS_LABELS[app.status] ?? app.status}
        </span>
      </div>

      {/* Subtab nav */}
      <div className="jlx-fulltime-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`jlx-fulltime-tab ${activeTab === tab.key ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="jlx-fulltime-tab__icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="jlx-fulltime-content">
        {activeTab === "overview" && (
          <div className="jlx-ft-overview">
            {/* Job info card */}
            <div className="jlx-ft-overview__job-card">
              <div className="jlx-ft-overview__job-header">
                <div className="jlx-ft-overview__job-logo">
                  <Briefcase size={18} />
                </div>
                <div className="jlx-ft-overview__job-info">
                  <div className="jlx-ft-overview__job-title">{app.title}</div>
                  <div className="jlx-ft-overview__company">{app.company}</div>
                </div>
              </div>
              <div className="jlx-ft-overview__badges">
                {app.isRemote ? (
                  <span className="jlx-ft-overview__badge jlx-ft-overview__badge--remote">
                    <Globe size={11} />
                    Remote
                  </span>
                ) : (
                  <span className="jlx-ft-overview__badge jlx-ft-overview__badge--onsite">
                    <MapPin size={11} />
                    {app.location || "Onsite"}
                  </span>
                )}
                {app.isNegotiable ? (
                  <span className="jlx-ft-overview__badge jlx-ft-overview__badge--negotiable">
                    Thỏa thuận lương
                  </span>
                ) : (
                  <span className="jlx-ft-overview__badge jlx-ft-overview__badge--fixed">
                    Lương cố định
                  </span>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="jlx-ft-timeline">
              {TIMELINE_STEPS.map((step, idx) => {
                const state = getStepState(idx);
                const isLast = idx === TIMELINE_STEPS.length - 1;
                return (
                  <div key={step.status} className={`jlx-ft-step is-${state}`}>
                    <div className="jlx-ft-step__dot">
                      {state === "done" ? (
                        <CheckCircle2 size={12} />
                      ) : state === "active" ? (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#00f5ff",
                          }}
                        />
                      ) : null}
                    </div>
                    {!isLast && <div className="jlx-ft-step__connector" />}
                    <div className="jlx-ft-step__info">
                      <div className="jlx-ft-step__label">{step.label}</div>
                      {state === "active" && (
                        <div className="jlx-ft-step__time">
                          Trạng thái hiện tại
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "interviews" && (
          <div className="jlx-ft-interviews">
            {loadingInterviews ? (
              <div className="jlx-ft-interview-card__empty">
                <div
                  style={{
                    width: 24,
                    height: 24,
                    border: "2px solid rgba(0,245,255,0.2)",
                    borderTopColor: "#00f5ff",
                    borderRadius: "50%",
                    animation: "jlx-spin 0.8s linear infinite",
                  }}
                />
                <p>Đang tải lịch phỏng vấn...</p>
              </div>
            ) : interviews.length === 0 ? (
              <div className="jlx-ft-interview-card__empty">
                <Calendar size={40} />
                <p>Chưa có lịch phỏng vấn cho công việc này</p>
              </div>
            ) : (
              <InterviewsList
                interviews={interviews}
                formatDateTime={formatDateTime}
                getCountdown={getCountdown}
                getMeetingIcon={getMeetingIcon}
                getMeetingLabel={getMeetingLabel}
                getInterviewStatusClass={getInterviewStatusClass}
                interviewActionId={interviewActionId}
                onConfirmInterview={handleConfirmInterview}
                onDeclineInterview={handleDeclineInterview}
              />
            )}
          </div>
        )}

        {activeTab === "onboarding" && (
          <div className="jlx-ft-onboarding">
            <CandidateOnboardingPanel
              applicationId={app.applicationId}
              onComplete={() => {
                onRefresh();
                setActiveTab("contracts");
              }}
              onCancel={() => setActiveTab("overview")}
            />
          </div>
        )}

        {activeTab === "contracts" && (
          <div className="jlx-ft-contracts">
            {loadingContracts ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#475569",
                }}
              >
                Đang tải hợp đồng...
              </div>
            ) : contracts.length === 0 ? (
              <div
                style={{
                  padding: "3rem",
                  textAlign: "center",
                  color: "#334155",
                }}
              >
                <FileSignature size={40} style={{ opacity: 0.3 }} />
                <p
                  style={{
                    marginTop: "0.75rem",
                    fontSize: "0.85rem",
                    color: "#475569",
                  }}
                >
                  Chưa có hợp đồng nào cho đơn này
                </p>
              </div>
            ) : (
              contracts.map((contract) => (
                <div key={contract.id} className="jlx-ft-contract-card">
                  <div className="jlx-ft-contract-card__info">
                    <div className="jlx-ft-contract-card__icon">
                      <FileSignature size={14} />
                    </div>
                    <div>
                      <div className="jlx-ft-contract-card__name">
                        Hợp đồng #{contract.contractNumber ?? contract.id}
                      </div>
                      <div className="jlx-ft-contract-card__meta">
                        {contract.type?.replace(/_/g, " ") || "Lao động"}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`jlx-ft-contract-card__status jlx-ft-contract-card__status--${(contract.status || "draft").toLowerCase()}`}
                  >
                    {contract.status === "SIGNED"
                      ? "Đã ký"
                      : contract.status === "PENDING_SIGNER"
                        ? "Chờ ký"
                        : contract.status === "PENDING_EMPLOYER"
                          ? "Chờ NTD"
                          : contract.status === "DRAFT"
                            ? "Bản nháp"
                            : (contract.status ?? "—")}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "offers" && (
          <OfferTab
            app={app}
            onAccept={handleAcceptOffer}
            acceptOfferLoading={acceptOfferLoading}
            onCounter={() => {
              setCounterSalary("");
              setCounterAdditionalReqs("");
              setCounterAppId(app.id);
            }}
          />
        )}
      </div>

      {/* Counter modal */}
      {modalRoot &&
        counterAppId !== null &&
        createPortal(
          <div className="jlx-modal-overlay" onClick={closeCounterModal}>
            <div
              className="jlx-modal jlx-modal--counter"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="jlx-inline-counter-title"
            >
              <div className="jlx-modal__header">
                <div className="jlx-modal__header-left">
                  <AlertTriangle size={18} style={{ color: "#fbbf24" }} />
                  <div className="jlx-modal__title-group">
                    <span className="jlx-modal__eyebrow">Thương lượng lại</span>
                    <h3 id="jlx-inline-counter-title">Gửi phản đề nghị</h3>
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#e2e8f0",
                    }}
                  >
                    Phản đề nghị
                  </h3>
                </div>
                <button
                  className="jlx-modal__close"
                  onClick={() => setCounterAppId(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontSize: "1.4rem",
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
              <button
                className="jlx-modal__close"
                onClick={closeCounterModal}
                aria-label="Đóng"
                style={{
                  position: "absolute",
                  top: "1.15rem",
                  right: "1.35rem",
                  zIndex: 5,
                }}
              >
                <XCircle size={16} />
              </button>
              <div className="jlx-modal__body">
                <p className="jlx-modal__desc">
                  Điều chỉnh mức lương mong muốn và điều kiện làm việc trước khi
                  gửi phản hồi cho nhà tuyển dụng.
                </p>
                {app.offerRound === 2 && (
                  <div className="jlx-modal__notice jlx-modal__notice--warning">
                    <AlertTriangle size={14} />
                    <span>
                      Đây là vòng đề nghị cuối cùng. Sau lần này bạn sẽ không
                      thể gửi thêm phản đề nghị.
                    </span>
                  </div>
                )}
                {app.offerRound === 2 && (
                  <div
                    style={{
                      padding: "0.6rem 0.75rem",
                      background: "rgba(251,191,36,0.08)",
                      border: "1px solid rgba(251,191,36,0.2)",
                      borderRadius: 8,
                      color: "#fbbf24",
                      fontSize: "0.78rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Đây là vòng cuối. Không thể gửi thêm đề nghị sau lần này.
                  </div>
                )}
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#94a3b8",
                    margin: "0 0 1rem",
                  }}
                >
                  Nhập mức lương kỳ vọng và điều kiện bổ sung của bạn.
                </p>

                {/* Salary input */}
                <div className="jlx-field">
                  <label className="jlx-field__label">
                    <DollarSign size={12} style={{ color: "#10b981" }} />
                    Mức lương kỳ vọng (VND){" "}
                    <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="jlx-input"
                    value={counterSalary}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setCounterSalary(
                        raw ? parseInt(raw).toLocaleString("vi-VN") : "",
                      );
                    }}
                    placeholder="Ví dụ: 28.000.000"
                  />
                  {counterSalary && (
                    <span
                      className="jlx-field__hint"
                      style={{ color: "#10b981" }}
                    >
                      ={" "}
                      {parseInt(
                        counterSalary.replace(/[^0-9]/g, ""),
                      ).toLocaleString("vi-VN")}{" "}
                      VND/tháng
                    </span>
                  )}
                </div>

                {/* Additional requirements */}
                <div className="jlx-field">
                  <label className="jlx-field__label">
                    <Plus size={12} style={{ color: "#00f5ff" }} />
                    Yêu cầu bổ sung
                  </label>
                  <textarea
                    className="jlx-textarea"
                    rows={4}
                    value={counterAdditionalReqs}
                    onChange={(e) => setCounterAdditionalReqs(e.target.value)}
                    placeholder="Ví dụ: Em muốn làm việc remote hoàn toàn, cần hỗ trợ thiết bị làm việc, thời gian nghỉ phép..."
                  />
                </div>
              </div>
              <div className="jlx-modal__actions">
                <button
                  className="jlx-btn jlx-btn--ghost"
                  onClick={() => setCounterAppId(null)}
                >
                  Hủy
                </button>
                <button
                  className="jlx-btn jlx-btn--danger"
                  onClick={handleCounterSubmit}
                  disabled={submitting || !counterSalary.trim()}
                >
                  {submitting ? "Đang gửi..." : "Gửi phản đề nghị"}
                </button>
              </div>
            </div>
          </div>,
          modalRoot,
        )}

      {/* Decline interview modal */}
      {modalRoot &&
        declineModalInterview &&
        createPortal(
          <div
            className="jlx-modal-overlay"
            onClick={() => setDeclineModalInterview(null)}
          >
            <div
              className="jlx-modal jlx-modal--decline"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="jlx-inline-decline-title"
            >
              <div className="jlx-modal__header">
                <div className="jlx-modal__header-left">
                  <AlertTriangle size={18} style={{ color: "#f87171" }} />
                  <div className="jlx-modal__title-group">
                    <span className="jlx-modal__eyebrow">
                      Từ chối phỏng vấn
                    </span>
                    <h3 id="jlx-inline-decline-title">Nhập lý do từ chối</h3>
                  </div>
                </div>
                <button
                  className="jlx-modal__close"
                  onClick={() => setDeclineModalInterview(null)}
                  aria-label="Đóng"
                >
                  <XCircle size={16} />
                </button>
              </div>

              <div className="jlx-modal__body">
                <p className="jlx-modal__desc jlx-modal__desc--danger">
                  Lý do này sẽ được gửi cho nhà tuyển dụng và dùng để cập nhật
                  trạng thái hồ sơ.
                </p>

                <div className="jlx-modal__interview-brief">
                  <span>{declineModalInterview.jobTitle}</span>
                  <span>
                    {formatDateTime(declineModalInterview.scheduledAt)}
                  </span>
                </div>

                <div className="jlx-field">
                  <label className="jlx-field__label">
                    <MessageSquare size={12} />
                    Lý do từ chối <span className="jlx-required">*</span>
                  </label>
                  <textarea
                    className={`jlx-textarea${
                      declineReason.trim().length > 0 &&
                      declineReason.trim().length < 10
                        ? " has-error"
                        : ""
                    }`}
                    rows={4}
                    maxLength={250}
                    value={declineReason}
                    onChange={(event) => setDeclineReason(event.target.value)}
                    placeholder="Ví dụ: Mình bận lịch học trong khung giờ này, mong muốn đổi sang thời gian khác."
                  />
                  <div className="jlx-modal__reason-counter">
                    {declineReason.trim().length}/250 ký tự
                  </div>
                </div>
              </div>

              <div className="jlx-modal__actions">
                <button
                  className="jlx-btn jlx-btn--ghost"
                  onClick={() => setDeclineModalInterview(null)}
                  disabled={interviewActionId === declineModalInterview.id}
                >
                  Hủy
                </button>
                <button
                  className="jlx-btn jlx-btn--danger"
                  onClick={submitDeclineInterview}
                  disabled={interviewActionId === declineModalInterview.id}
                >
                  Từ chối lịch
                </button>
              </div>
            </div>
          </div>,
          modalRoot,
        )}
    </div>
  );
}

// ─── Offer Tab ────────────────────────────────────────────────────────────────

function OfferTab({
  app,
  onAccept,
  acceptOfferLoading,
  onCounter,
}: {
  app: AppItem;
  onAccept: () => void;
  acceptOfferLoading: boolean;
  onCounter: () => void;
}) {
  return (
    <div className="jlx-ft-offers">
      {app.status === "OFFER_SENT" && (
        <article className="jlx-panel jlx-panel--offer">
          <div className="jlx-offer-panel">
            <div className="jlx-offer-round-badge">
              {app.offerRound === 2 ? (
                <span className="jlx-offer-round-badge__final">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Vòng cuối — từ chối sẽ kết thúc
                </span>
              ) : (
                <span className="jlx-offer-round-badge__normal">
                  <FileText size={12} />
                  Đề nghị lần {app.offerRound ?? 1}
                </span>
              )}
            </div>
            <div className="jlx-offer-panel__header">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <div>
                <strong>Đề nghị từ {app.company}</strong>
                <span>Xem chi tiết và phản hồi đề nghị</span>
              </div>
            </div>
            {app.offerSalary && (
              <div
                style={{
                  padding: "0.75rem",
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 10,
                  marginBottom: "0.75rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#64748b",
                    marginBottom: "0.2rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Mức lương đề nghị
                </div>
                <div
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    color: "#10b981",
                  }}
                >
                  {app.offerSalary.toLocaleString("vi-VN")} VND/tháng
                </div>
              </div>
            )}
            {app.offerDetails && (
              <div className="jlx-offer-details">
                <div className="jlx-offer-details__label">
                  <FileText size={12} />
                  Điều khoản bổ sung
                </div>
                <div className="jlx-offer-details__content">
                  {app.offerDetails}
                </div>
              </div>
            )}
            {app.offerAdditionalRequirements && (
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.6rem 0.75rem",
                  background: "rgba(0,245,255,0.04)",
                  border: "1px solid rgba(0,245,255,0.12)",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#64748b",
                    marginBottom: "0.2rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Yêu cầu bổ sung
                </div>
                <div style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                  {app.offerAdditionalRequirements}
                </div>
              </div>
            )}
            <div className="jlx-offer-panel__actions">
              <button
                className="jlx-btn jlx-btn--primary"
                onClick={onAccept}
                disabled={acceptOfferLoading}
              >
                {acceptOfferLoading ? "Đang xử lý..." : "Chấp nhận đề nghị"}
              </button>
              <button className="jlx-btn jlx-btn--ghost" onClick={onCounter}>
                {app.offerRound === 2 ? "Từ chối" : "Phản đề nghị"}
              </button>
            </div>
          </div>
        </article>
      )}

      {app.status === "OFFER_REJECTED" && (
        <article className="jlx-panel jlx-panel--offer-rejected">
          <div className="jlx-offer-panel">
            <div className="jlx-offer-panel__header">
              <Clock3 size={16} />
              <div>
                <strong>Chờ phản hồi từ Nhà tuyển dụng</strong>
                <span>Phản đề nghị của bạn đã được gửi</span>
              </div>
            </div>
            {app.offerRound === 2 && (
              <div className="jlx-offer-rejected-notice">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p>
                  Đây là vòng cuối. Nhà tuyển dụng có thể gửi lại hoặc kết thúc.
                </p>
              </div>
            )}
            {(app.counterSalaryAmount ||
              app.counterAdditionalRequirements ||
              app.candidateOfferResponse) && (
              <div style={{ marginTop: "0.75rem" }}>
                <div
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: "0.3rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Phản hồi của bạn
                </div>
                {app.counterSalaryAmount && (
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#fbbf24",
                      marginBottom: "0.3rem",
                    }}
                  >
                    Yêu cầu: {app.counterSalaryAmount.toLocaleString("vi-VN")}{" "}
                    VND/tháng
                  </div>
                )}
                {app.counterAdditionalRequirements && (
                  <div
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: 8,
                      background: "rgba(251,191,36,0.05)",
                      border: "1px solid rgba(251,191,36,0.15)",
                      fontSize: "0.82rem",
                      color: "#94a3b8",
                      marginBottom: "0.3rem",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {app.counterAdditionalRequirements}
                  </div>
                )}
                {app.candidateOfferResponse && (
                  <div
                    style={{
                      padding: "0.65rem 0.8rem",
                      borderRadius: 8,
                      background: "rgba(15,23,42,0.45)",
                      border: "1px solid rgba(0,245,255,0.08)",
                      fontSize: "0.82rem",
                      color: "#cbd5e1",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {app.candidateOfferResponse}
                  </div>
                )}
              </div>
            )}
          </div>
        </article>
      )}

      {app.status === "OFFER_ACCEPTED" && (
        <article
          className="jlx-panel"
          style={{
            border: "1px solid rgba(16,185,129,0.25)",
            background: "rgba(16,185,129,0.04)",
          }}
        >
          <div
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
            >
              <CheckCircle2 size={18} style={{ color: "#10b981" }} />
              <strong style={{ fontSize: "0.95rem", color: "#e2e8f0" }}>
                Đề nghị đã được chấp nhận
              </strong>
            </div>
            {app.offerSalary && (
              <div
                style={{
                  padding: "0.75rem",
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#64748b",
                    marginBottom: "0.2rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Thỏa thuận lương
                </div>
                <div
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    color: "#10b981",
                  }}
                >
                  {app.offerSalary.toLocaleString("vi-VN")} VND/tháng
                </div>
              </div>
            )}
            {app.offerDetails && (
              <div className="jlx-offer-details">
                <div className="jlx-offer-details__label">
                  <FileText size={12} />
                  Điều khoản bổ sung
                </div>
                <div className="jlx-offer-details__content">
                  {app.offerDetails}
                </div>
              </div>
            )}
            {app.offerAdditionalRequirements && (
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "#94a3b8",
                  padding: "0.5rem 0.75rem",
                  background: "rgba(0,245,255,0.04)",
                  border: "1px solid rgba(0,245,255,0.12)",
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#00f5ff",
                    fontWeight: 600,
                  }}
                >
                  Yêu cầu bổ sung:{" "}
                </span>
                {app.offerAdditionalRequirements}
              </div>
            )}
          </div>
        </article>
      )}

      {!["OFFER_SENT", "OFFER_REJECTED", "OFFER_ACCEPTED"].includes(
        app.status,
      ) && (
        <div style={{ padding: "3rem", textAlign: "center", color: "#334155" }}>
          <Send size={40} style={{ opacity: 0.3 }} />
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.85rem",
              color: "#475569",
            }}
          >
            Chưa có đề nghị nào cho công việc này
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Interview Cards ──────────────────────────────────────────────────────────

function InterviewsList({
  interviews,
  formatDateTime,
  getCountdown,
  getMeetingIcon,
  getMeetingLabel,
  getInterviewStatusClass,
  interviewActionId,
  onConfirmInterview,
  onDeclineInterview,
}: {
  interviews: InterviewScheduleResponse[];
  formatDateTime: (d?: string) => string;
  getCountdown: (d: string) => {
    label: string;
    urgency: "normal" | "urgent" | "overdue";
  };
  getMeetingIcon: (t: string) => React.ReactNode;
  getMeetingLabel: (t: string) => string;
  getInterviewStatusClass: (s: string) => string;
  interviewActionId: number | null;
  onConfirmInterview: (interviewId: number) => void;
  onDeclineInterview: (interviewId: number) => void;
}) {
  const upcoming = interviews.filter((i) =>
    ["PENDING", "CONFIRMED"].includes(i.status),
  );
  const past = interviews.filter((i) =>
    ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(i.status),
  );

  const renderCard = (
    interview: InterviewScheduleResponse,
    isPast: boolean,
  ) => {
    const cd = getCountdown(interview.scheduledAt);
    return (
      <div
        key={interview.id}
        className="jlx-ft-interview-card"
        style={isPast ? { opacity: 0.65 } : {}}
      >
        <div className="jlx-ft-interview-card__top">
          <div className="jlx-ft-interview-card__meeting">
            {getMeetingIcon(interview.meetingType)}
            {getMeetingLabel(interview.meetingType)}
          </div>
          <span
            className={`jlx-ft-interview-card__status ${getInterviewStatusClass(interview.status)}`}
          >
            {interview.status === "PENDING" && "Chờ xác nhận"}
            {interview.status === "CONFIRMED" && "Đã xác nhận"}
            {interview.status === "COMPLETED" && "Đã hoàn thành"}
            {interview.status === "CANCELLED" && "Đã hủy"}
            {interview.status === "NO_SHOW" && "Không đến"}
          </span>
        </div>
        <div className="jlx-ft-interview-card__meta">
          <div className="jlx-ft-interview-card__meta-item">
            <Calendar size={12} />
            <span>{formatDateTime(interview.scheduledAt)}</span>
          </div>
          {interview.durationMinutes && (
            <div className="jlx-ft-interview-card__meta-item">
              <Clock3 size={12} />
              <span>{interview.durationMinutes} phút</span>
            </div>
          )}
          {interview.interviewerName && (
            <div className="jlx-ft-interview-card__meta-item">
              <span>
                Người phỏng vấn:{" "}
                <strong style={{ color: "#e2e8f0" }}>
                  {interview.interviewerName}
                </strong>
              </span>
            </div>
          )}
        </div>
        {!isPast && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <span
              className={`jlxinercountdown ${cd.urgency === "urgent" ? "jlxinercountdown--urgent" : cd.urgency === "overdue" ? "jlxinercountdown--overdue" : ""}`}
            >
              <Clock3 size={11} />
              {cd.label}
            </span>
            {interview.meetingLink && (
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="jlx-ft-interview-card__link"
              >
                <Link2 size={12} />
                Tham gia
              </a>
            )}
          </div>
        )}
        {!isPast &&
          interview.status === InterviewStatus.PENDING &&
          interview.responseDeadlineAt && (
            <div
              className="jlx-ft-interview-card__meta-item"
              style={{ marginTop: "0.4rem" }}
            >
              <AlertTriangle size={12} />
              <span>
                Hạn xác nhận: {formatDateTime(interview.responseDeadlineAt)}
              </span>
            </div>
          )}
        {!isPast && interview.status === InterviewStatus.PENDING && (
          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              marginTop: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="jlx-btn jlx-btn--primary"
              disabled={interviewActionId === interview.id}
              onClick={() => onConfirmInterview(interview.id)}
            >
              Xác nhận tham gia
            </button>
            <button
              type="button"
              className="jlx-btn jlx-btn--ghost"
              disabled={interviewActionId === interview.id}
              onClick={() => onDeclineInterview(interview.id)}
            >
              Từ chối lịch
            </button>
          </div>
        )}
        {interview.location && (
          <div
            className="jlx-ft-interview-card__meta-item"
            style={{ marginTop: "0.3rem" }}
          >
            <MapPin size={12} />
            <span>{interview.location}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="jlx-ft-interviews">
      {upcoming.length > 0 && (
        <div className="jlx-ft-interviews__section">
          <div className="jlx-ft-interviews__section-head">
            <Calendar size={14} />
            Lịch sắp tới ({upcoming.length})
          </div>
          <div className="jlx-ft-interviews__list">
            {upcoming.map((i) => renderCard(i, false))}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div className="jlx-ft-interviews__section">
          <div className="jlx-ft-interviews__section-head">
            <Clock3 size={14} />
            Đã qua ({past.length})
          </div>
          <div className="jlx-ft-interviews__list">
            {past.map((i) => renderCard(i, true))}
          </div>
        </div>
      )}
    </div>
  );
}
