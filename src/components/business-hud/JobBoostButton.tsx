import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Crown,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { JobBoostResponse, JobBoostStatus } from "../../data/jobDTOs";
import { useToast } from "../../hooks/useToast";
import jobBoostService from "../../services/jobBoostService";
import recruiterSubscriptionService, {
  RecruiterSubscriptionInfoResponse,
} from "../../services/recruiterSubscriptionService";
import "./JobBoostButton.css";

interface JobBoostButtonProps {
  jobId: number;
  jobTitle: string;
  onBoostCreated?: (boost: JobBoostResponse) => void;
  onBoostCancelled?: (boostId: number) => void;
}

const MIN_BOOST_DAYS = 7;
const MAX_BOOST_DAYS = 30;

const clampDuration = (value: number) =>
  Math.min(MAX_BOOST_DAYS, Math.max(MIN_BOOST_DAYS, value));

const JobBoostButton: React.FC<JobBoostButtonProps> = ({
  jobId,
  jobTitle,
  onBoostCreated,
  onBoostCancelled,
}) => {
  const { showError, showSuccess, showWarning } = useToast();

  const [subscription, setSubscription] =
    useState<RecruiterSubscriptionInfoResponse | null>(null);
  const [boost, setBoost] = useState<JobBoostResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(MIN_BOOST_DAYS);

  useEffect(() => {
    void loadData();
  }, [jobId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subscriptionInfo, boostInfo] = await Promise.all([
        recruiterSubscriptionService.getSubscriptionInfo(),
        jobBoostService.getBoostByJob(jobId),
      ]);
      setSubscription(subscriptionInfo);
      setBoost(boostInfo);
    } catch (error) {
      console.error("Error loading boost data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoost = () => {
    if (!subscription?.canHighlightJobs) {
      showWarning(
        "Cần Premium",
        "Bạn cần gói Premium để sử dụng tính năng boost job.",
      );
      return;
    }

    if (boost) {
      showWarning(
        "Đã dùng lượt boost",
        "Mỗi job chỉ được boost một lần trong suốt vòng đời.",
      );
      return;
    }

    if ((subscription.jobBoostRemaining ?? 0) <= 0) {
      showWarning(
        "Hết quota",
        "Bạn đã dùng hết quota boost job trong kỳ hiện tại.",
      );
      return;
    }

    setSelectedDays(MIN_BOOST_DAYS);
    setShowConfirmModal(true);
  };

  const confirmCreateBoost = async () => {
    const durationDays = clampDuration(selectedDays);

    if (durationDays !== selectedDays) {
      setSelectedDays(durationDays);
      showWarning(
        "Thời lượng chưa hợp lệ",
        "Boost job chỉ hỗ trợ trong khoảng 7 đến 30 ngày.",
      );
      return;
    }

    if (boost) {
      showWarning(
        "Đã dùng lượt boost",
        "Job này đã dùng lượt boost trước đó nên không thể tạo lại.",
      );
      setShowConfirmModal(false);
      return;
    }

    setIsActionLoading(true);
    try {
      const createdBoost = await jobBoostService.createBoost({
        jobId,
        durationDays,
      });
      setBoost(createdBoost);
      showSuccess(
        "Boost thành công",
        `Job "${jobTitle}" đã được đưa vào diện ưu tiên hiển thị.`,
      );
      setShowConfirmModal(false);
      await loadData();
      onBoostCreated?.(createdBoost);
    } catch (error: any) {
      showError(
        "Không thể boost job",
        error.message || "Vui lòng thử lại sau.",
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelBoost = async () => {
    if (!boost) return;

    const confirmCancel = window.confirm(
      "Bạn có chắc muốn hủy boost? Lượt quota đã dùng sẽ không được hoàn lại.",
    );
    if (!confirmCancel) return;

    setIsActionLoading(true);
    try {
      const cancelledBoost = await jobBoostService.cancelBoost(boost.id);
      setBoost(cancelledBoost);
      showSuccess(
        "Đã hủy boost",
        "Boost đã được hủy. Quota đã dùng sẽ không được hoàn lại.",
      );
      await loadData();
      onBoostCancelled?.(boost.id);
    } catch (error: any) {
      showError(
        "Không thể hủy boost",
        error.message || "Vui lòng thử lại sau.",
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const getDaysRemaining = () => {
    if (!boost) return 0;
    const endDate = new Date(boost.endDate);
    const diff = endDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getBoostStatusBadge = () => {
    if (!boost) return null;

    const statusConfig = {
      [JobBoostStatus.ACTIVE]: {
        className: "jb-badge--active",
        icon: <Sparkles size={12} />,
        text: "Đang hoạt động",
      },
      [JobBoostStatus.SCHEDULED]: {
        className: "jb-badge--scheduled",
        icon: <Clock size={12} />,
        text: "Đã lên lịch",
      },
      [JobBoostStatus.EXPIRED]: {
        className: "jb-badge--expired",
        icon: <AlertCircle size={12} />,
        text: "Đã hết hạn",
      },
      [JobBoostStatus.CANCELLED]: {
        className: "jb-badge--cancelled",
        icon: <X size={12} />,
        text: "Đã hủy",
      },
      [JobBoostStatus.NOT_BOOSTED]: {
        className: "jb-badge--cancelled",
        icon: <AlertCircle size={12} />,
        text: "Chưa boost",
      },
    };

    const config = statusConfig[boost.status];
    if (!config) return null;

    return (
      <span className={`jb-badge ${config.className}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="jb-button-skeleton">
        <div className="jb-skeleton-line"></div>
      </div>
    );
  }

  if (!subscription?.canHighlightJobs) {
    return (
      <button className="jb-button jb-button--upgrade" disabled>
        <Crown size={16} />
        <span>Nâng cấp Premium</span>
      </button>
    );
  }

  if (boost) {
    const daysRemaining = getDaysRemaining();
    const canCancel =
      (boost.status === JobBoostStatus.ACTIVE ||
        boost.status === JobBoostStatus.SCHEDULED) &&
      !isActionLoading;

    return (
      <div
        className={`jb-boost-active jb-boost-active--${boost.status.toLowerCase()}`}
      >
        <div className="jb-boost-info">
          {getBoostStatusBadge()}
          {boost.status === JobBoostStatus.ACTIVE && daysRemaining > 0 && (
            <span className="jb-days-remaining">
              <Clock size={12} />
              Còn {daysRemaining} ngày
            </span>
          )}
          {(boost.status === JobBoostStatus.ACTIVE ||
            boost.status === JobBoostStatus.SCHEDULED) && (
            <span className="jb-status-note">
              Hiệu lực đến {formatDate(boost.endDate)}. Hủy boost sẽ không hoàn
              lại quota đã dùng.
            </span>
          )}
          {boost.status === JobBoostStatus.CANCELLED && (
            <span className="jb-status-note">
              Lượt boost này đã bị hủy. Job không thể tạo boost lần thứ hai.
            </span>
          )}
          {boost.status === JobBoostStatus.EXPIRED && (
            <span className="jb-status-note">
              Lượt boost này đã dùng xong. Mỗi job chỉ được boost một lần.
            </span>
          )}
        </div>

        {canCancel && (
          <div className="jb-boost-actions">
            <button
              className="jb-action-btn jb-action-btn--cancel"
              onClick={handleCancelBoost}
              disabled={isActionLoading}
            >
              <X size={14} />
              Hủy boost
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        className="jb-button jb-button--boost"
        onClick={handleCreateBoost}
        disabled={isLoading || (subscription?.jobBoostRemaining ?? 0) <= 0}
      >
        <Zap size={14} />
        <span>Boost job</span>
        {(subscription?.jobBoostRemaining ?? 0) > 0 && (
          <span className="jb-quota-badge">
            {subscription?.jobBoostRemaining} lượt
          </span>
        )}
      </button>

      {showConfirmModal &&
        typeof document !== "undefined" &&
        createPortal(
        <div
          className="jb-modal-overlay"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="jb-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="jb-modal-title">Xác nhận boost job</h3>
            <p className="jb-modal-subtitle">
              Bạn muốn boost <strong>{jobTitle}</strong> trong bao lâu?
            </p>

            <div className="jb-duration-options">
              {[7, 14, 21, 30].map((days) => (
                <button
                  key={days}
                  className={`jb-duration-btn ${selectedDays === days ? "jb-duration-btn--selected" : ""}`}
                  onClick={() => setSelectedDays(days)}
                >
                  {days} ngày
                </button>
              ))}
            </div>

            <label className="jb-duration-field">
              <span>Thời lượng boost</span>
              <div className="jb-duration-field__control">
                <input
                  type="number"
                  min={MIN_BOOST_DAYS}
                  max={MAX_BOOST_DAYS}
                  value={selectedDays}
                  onChange={(event) =>
                    setSelectedDays(
                      clampDuration(
                        Number(event.target.value) || MIN_BOOST_DAYS,
                      ),
                    )
                  }
                />
                <strong>ngày</strong>
              </div>
              <small>
                Mỗi job chỉ được boost một lần. Thời lượng hợp lệ từ 7 đến 30
                ngày.
              </small>
            </label>

            <div className="jb-quota-info">
              <CheckCircle size={14} />
              <span>
                Quota còn lại sau lần này:{" "}
                {Math.max(0, (subscription?.jobBoostRemaining ?? 0) - 1)} lượt
              </span>
            </div>

            <div className="jb-modal-actions">
              <button
                className="jb-btn jb-btn--secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Hủy
              </button>
              <button
                className="jb-btn jb-btn--primary"
                onClick={confirmCreateBoost}
                disabled={isActionLoading}
              >
                {isActionLoading ? "Đang xử lý..." : "Xác nhận boost"}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
};

export default JobBoostButton;
