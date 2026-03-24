import { useState, useEffect } from 'react';
import { Zap, Clock, X, AlertCircle, CheckCircle, Crown, Sparkles } from 'lucide-react';
import jobBoostService from '../../services/jobBoostService';
import recruiterSubscriptionService, { RecruiterSubscriptionInfoResponse } from '../../services/recruiterSubscriptionService';
import { JobBoostStatus, JobBoostResponse } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import { confirmAction } from '../../context/ConfirmDialogContext';
import './JobBoostButton.css';

interface JobBoostButtonProps {
  jobId: number;
  jobTitle: string;
  onBoostCreated?: (boost: JobBoostResponse) => void;
  onBoostCancelled?: (boostId: number) => void;
}

const JobBoostButton: React.FC<JobBoostButtonProps> = ({
  jobId,
  jobTitle,
  onBoostCreated,
  onBoostCancelled
}) => {
  const { showSuccess, showError, showWarning } = useToast();

  const [subscription, setSubscription] = useState<RecruiterSubscriptionInfoResponse | null>(null);
  const [boost, setBoost] = useState<JobBoostResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [showExtendModal, setShowExtendModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subData, boostData] = await Promise.all([
        recruiterSubscriptionService.getSubscriptionInfo(),
        jobBoostService.getBoostByJob(jobId)
      ]);
      setSubscription(subData);
      setBoost(boostData);
    } catch (error) {
      console.error('Error loading boost data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoost = async () => {
    if (!subscription?.canHighlightJobs) {
      showWarning('Cần Premium', 'Bạn cần đăng ký gói Premium để sử dụng tính năng này');
      return;
    }

    if (subscription.jobBoostRemaining <= 0) {
      showWarning('Hết Quota', 'Bạn đã sử dụng hết quota boost job. Vui lòng nâng cấp gói Premium');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmCreateBoost = async () => {
    setIsActionLoading(true);
    try {
      const newBoost = await jobBoostService.createBoost({
        jobId,
        durationDays: selectedDays
      });
      setBoost(newBoost);
      showSuccess('Boost Thành Công', `Job "${jobTitle}" đã được đẩy lên top!`);
      setShowConfirmModal(false);
      onBoostCreated?.(newBoost);
      loadData(); // Refresh quota
    } catch (error: any) {
      showError('Lỗi Boost', error.message || 'Không thể tạo boost. Vui lòng thử lại');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelBoost = async () => {
    if (!boost) return;

    const confirmCancel = await confirmAction('Bạn có chắc muốn hủy boost? Quota sẽ không được hoàn lại.');
    if (!confirmCancel) return;

    setIsActionLoading(true);
    try {
      await jobBoostService.cancelBoost(boost.id);
      setBoost(null);
      showSuccess('Đã Hủy Boost', 'Boost job đã được hủy thành công');
      onBoostCancelled?.(boost.id);
      loadData(); // Refresh quota
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể hủy boost');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExtendBoost = async () => {
    if (!boost) return;

    setIsActionLoading(true);
    try {
      const extended = await jobBoostService.extendBoost(boost.id, selectedDays);
      setBoost(extended);
      showSuccess('Gia Hạn Thành Công', 'Thời gian boost đã được gia hạn');
      setShowExtendModal(false);
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể gia hạn boost');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getBoostStatusBadge = () => {
    if (!boost) return null;

    const statusConfig = {
      [JobBoostStatus.ACTIVE]: {
        class: 'jb-badge--active',
        icon: <Sparkles size={12} />,
        text: 'Đang hoạt động'
      },
      [JobBoostStatus.SCHEDULED]: {
        class: 'jb-badge--scheduled',
        icon: <Clock size={12} />,
        text: 'Đã lên lịch'
      },
      [JobBoostStatus.EXPIRED]: {
        class: 'jb-badge--expired',
        icon: <AlertCircle size={12} />,
        text: 'Đã hết hạn'
      },
      [JobBoostStatus.CANCELLED]: {
        class: 'jb-badge--cancelled',
        icon: <X size={12} />,
        text: 'Đã hủy'
      }
    };

    const config = statusConfig[boost.status];
    if (!config) return null;

    return (
      <span className={`jb-badge ${config.class}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    if (!boost) return 0;
    const endDate = new Date(boost.endDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (isLoading) {
    return (
      <div className="jb-button-skeleton">
        <div className="jb-skeleton-line"></div>
      </div>
    );
  }

  // Not premium - show upgrade prompt
  if (!subscription?.canHighlightJobs) {
    return (
      <button className="jb-button jb-button--upgrade" disabled>
        <Crown size={16} />
        <span>Nâng Cấp Premium</span>
      </button>
    );
  }

  // Already boosted - show boost status and actions
  if (boost && boost.status !== JobBoostStatus.CANCELLED) {
    const daysRemaining = getDaysRemaining();

    return (
      <div className="jb-boost-active">
        <div className="jb-boost-info">
          {getBoostStatusBadge()}
          {boost.status === JobBoostStatus.ACTIVE && daysRemaining > 0 && (
            <span className="jb-days-remaining">
              <Clock size={12} />
              {daysRemaining} ngày còn lại
            </span>
          )}
          {boost.status === JobBoostStatus.ACTIVE && daysRemaining <= 3 && daysRemaining > 0 && (
            <span className="jb-days-warning">Sắp hết hạn!</span>
          )}
        </div>

        <div className="jb-boost-actions">
          {boost.status === JobBoostStatus.ACTIVE && daysRemaining > 0 && (
            <button
              className="jb-action-btn jb-action-btn--extend"
              onClick={() => setShowExtendModal(true)}
              disabled={isActionLoading}
            >
              <Clock size={14} />
              Gia hạn
            </button>
          )}
          <button
            className="jb-action-btn jb-action-btn--cancel"
            onClick={handleCancelBoost}
            disabled={isActionLoading}
          >
            <X size={14} />
            Hủy
          </button>
        </div>

        {/* Extend Modal */}
        {showExtendModal && (
          <div className="jb-modal-overlay" onClick={() => setShowExtendModal(false)}>
            <div className="jb-modal" onClick={e => e.stopPropagation()}>
              <h3 className="jb-modal-title">Gia Hạn Boost</h3>
              <p className="jb-modal-subtitle">Chọn số ngày muốn gia hạn</p>

              <div className="jb-duration-options">
                {[7, 14, 30].map(days => (
                  <button
                    key={days}
                    className={`jb-duration-btn ${selectedDays === days ? 'jb-duration-btn--selected' : ''}`}
                    onClick={() => setSelectedDays(days)}
                  >
                    {days} ngày
                  </button>
                ))}
              </div>

              <div className="jb-modal-actions">
                <button
                  className="jb-btn jb-btn--secondary"
                  onClick={() => setShowExtendModal(false)}
                >
                  Hủy
                </button>
                <button
                  className="jb-btn jb-btn--primary"
                  onClick={handleExtendBoost}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? 'Đang xử lý...' : 'Xác nhận gia hạn'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not boosted yet - show boost button
  return (
    <>
      <button
        className="jb-button jb-button--boost"
        onClick={handleCreateBoost}
        disabled={isLoading || subscription?.jobBoostRemaining <= 0}
      >
        <Zap size={16} />
        <span>Boost Job</span>
        {subscription && subscription.jobBoostRemaining > 0 && (
          <span className="jb-quota-badge">
            {subscription.jobBoostRemaining} lượt
          </span>
        )}
      </button>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="jb-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="jb-modal" onClick={e => e.stopPropagation()}>
            <h3 className="jb-modal-title">Xác Nhận Boost Job</h3>
            <p className="jb-modal-subtitle">
              Bạn có muốn đẩy job <strong>"{jobTitle}"</strong> lên top không?
            </p>

            <div className="jb-duration-options">
              {[7, 14, 30].map(days => (
                <button
                  key={days}
                  className={`jb-duration-btn ${selectedDays === days ? 'jb-duration-btn--selected' : ''}`}
                  onClick={() => setSelectedDays(days)}
                >
                  {days} ngày
                </button>
              ))}
            </div>

            <div className="jb-quota-info">
              <CheckCircle size={14} />
              <span>Quota còn lại: {subscription?.jobBoostRemaining || 0} lượt</span>
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
                {isActionLoading ? 'Đang xử lý...' : 'Xác Nhận Boost'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobBoostButton;
