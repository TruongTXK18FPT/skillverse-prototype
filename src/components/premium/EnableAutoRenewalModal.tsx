import React, { useState } from 'react';
import { X, CheckCircle, RefreshCw, Shield, Wallet } from 'lucide-react';
import { premiumService } from '../../services/premiumService';
import { UserSubscriptionResponse } from '../../data/premiumDTOs';
import './EnableAutoRenewalModal.css';

const AUTO_RENEWAL_INTERVAL_MINUTES = 1;

const resolveDisplayedRenewalAttemptDate = (subscription: UserSubscriptionResponse): Date => {
  if (subscription.renewalAttemptDate) {
    return new Date(subscription.renewalAttemptDate);
  }

  const endDate = new Date(subscription.endDate);
  const attemptDate = new Date(endDate);
  attemptDate.setSeconds(0, 0);

  const isAligned = endDate.getSeconds() === 0
    && endDate.getMilliseconds() === 0
    && endDate.getMinutes() % AUTO_RENEWAL_INTERVAL_MINUTES === 0;

  if (isAligned) {
    return endDate;
  }

  const remainder = attemptDate.getMinutes() % AUTO_RENEWAL_INTERVAL_MINUTES;
  const minutesUntilNextRun = remainder === 0
    ? AUTO_RENEWAL_INTERVAL_MINUTES
    : AUTO_RENEWAL_INTERVAL_MINUTES - remainder;
  attemptDate.setMinutes(attemptDate.getMinutes() + minutesUntilNextRun);
  return attemptDate;
};

interface EnableAutoRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: UserSubscriptionResponse | null;
  walletBalance?: number | null;
  onSuccess: () => void;
}

const EnableAutoRenewalModal: React.FC<EnableAutoRenewalModalProps> = ({
  isOpen,
  onClose,
  subscription,
  walletBalance,
  onSuccess
}) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleEnableAutoRenewal = async () => {
    try {
      setProcessing(true);
      setError('');
      
      const result = await premiumService.enableAutoRenewal();
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      console.error('Failed to enable auto-renewal:', err);
      setError(err.response?.data?.message || err.message || 'Không thể bật thanh toán tự động');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !subscription) return null;

  const managesScheduledPlan = Boolean(subscription.scheduledChangePlan);
  const effectivePlan = subscription.scheduledChangePlan ?? subscription.plan;
  const price = managesScheduledPlan
    ? parseFloat(
        subscription.scheduledChangeRenewalPrice
          ?? subscription.scheduledChangePlan?.discountedPrice
          ?? subscription.scheduledChangePlan?.studentPrice
          ?? subscription.scheduledChangePlan?.price
          ?? '0',
      )
    : subscription.renewalPrice
      ? parseFloat(subscription.renewalPrice)
      : (subscription.isDiscountedSubscription ?? subscription.isStudentSubscription) && (
          subscription.plan.discountedPrice || subscription.plan.studentPrice
        )
        ? parseFloat(subscription.plan.discountedPrice || subscription.plan.studentPrice || '0')
        : parseFloat(subscription.plan.price);
  const renewalAttemptDate = managesScheduledPlan && subscription.scheduledChangeRenewalAttemptDate
    ? new Date(subscription.scheduledChangeRenewalAttemptDate)
    : resolveDisplayedRenewalAttemptDate(subscription);
  const normalizedWalletBalance = walletBalance ?? null;
  const hasEnoughBalance = normalizedWalletBalance == null
    ? null
    : normalizedWalletBalance >= price;
  const hasLockedRenewalPrice = Boolean(subscription.renewalPriceLockedAt);

  return (
    <div className="enable-renewal-modal-overlay" onClick={onClose}>
      <div className="enable-renewal-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="enable-renewal-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="enable-renewal-modal-content">
          {/* Icon */}
          <div className="enable-renewal-icon-wrapper">
            <CheckCircle className="enable-renewal-icon" size={64} />
          </div>

          {/* Title */}
          <h2 className="enable-renewal-modal-title">Xác nhận bật tự động gia hạn</h2>

          {/* Description */}
          <p className="enable-renewal-description">
            Bạn sắp bật tự động gia hạn cho gói <strong>{effectivePlan.displayName}</strong>.
            {' '}Sau khi xác nhận, hệ thống sẽ tự động trừ ví theo lịch gia hạn
            {managesScheduledPlan ? ' sau khi chuyển gói.' : '.'}
          </p>

          {/* Info Cards */}
          <div className="enable-renewal-info-cards">
            <div className="enable-renewal-info-card">
              <RefreshCw size={24} className="card-icon-success" />
              <div>
                <h4>Tự động gia hạn</h4>
                <p>Khi gói kết thúc</p>
              </div>
            </div>
            <div className="enable-renewal-info-card">
              <Wallet size={24} className="card-icon-info" />
              <div>
                <h4>Thanh toán</h4>
                <p>{price.toLocaleString('vi-VN')} VND/kỳ</p>
              </div>
            </div>
            <div className="enable-renewal-info-card">
              <Shield size={24} className="card-icon-warning" />
              <div>
                <h4>Hủy bất cứ lúc nào</h4>
                <p>Không ràng buộc</p>
              </div>
            </div>
          </div>

          {normalizedWalletBalance != null && (
            <div className="enable-renewal-note">
              <strong>Trạng thái ví:</strong>
              <p>
                Số dư hiện tại là <strong>{normalizedWalletBalance.toLocaleString('vi-VN')} VND</strong>.
                {" "}
                {hasEnoughBalance
                  ? 'Số dư này đủ cho kỳ gia hạn tiếp theo.'
                  : 'Số dư này chưa đủ. Bạn nên nạp thêm để tránh gia hạn thất bại.'}
              </p>
            </div>
          )}

          {/* Note */}
          <div className="enable-renewal-note">
              <strong>💡 Lưu ý:</strong>
              <p>
              Hệ thống sẽ tự động thử trừ <strong>{price.toLocaleString('vi-VN')} VND</strong> từ 
              ví của bạn vào khoảng <strong>{renewalAttemptDate.toLocaleString('vi-VN')}</strong>.
              {' '}Lần thử đầu tiên diễn ra trong tối đa {AUTO_RENEWAL_INTERVAL_MINUTES} phút sau khi gói hết hạn.
              {' '}{hasLockedRenewalPrice
                ? 'Mức phí này đã được khóa cho kỳ gia hạn kế tiếp.'
                : 'Mức phí này sẽ được khóa khi bạn bật tự động gia hạn.'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="enable-renewal-error">
              <X size={20} />
              <p>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="enable-renewal-actions">
            <button
              className="enable-renewal-btn enable-renewal-btn--secondary"
              onClick={onClose}
              disabled={processing}
            >
              Để sau
            </button>
            <button
              className="enable-renewal-btn enable-renewal-btn--primary"
              onClick={handleEnableAutoRenewal}
              disabled={processing}
            >
              {processing ? (
                <>
                  <RefreshCw className="spin" size={20} />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Bật thanh toán tự động
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnableAutoRenewalModal;
