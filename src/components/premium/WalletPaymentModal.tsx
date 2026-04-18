import React, { useEffect, useMemo, useState } from 'react';
import { X, Wallet, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useScrollLock } from '../portfolio-hud/useScrollLock';
import { SubscriptionCheckoutPreviewResponse, UserSubscriptionResponse } from '../../data/premiumDTOs';
import './WalletPaymentModal.css';

interface WalletPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: number;
  walletBalance: number;
  isStudentPrice: boolean;
  checkoutPreview?: SubscriptionCheckoutPreviewResponse | null;
  currentSubscription?: UserSubscriptionResponse | null;
  onConfirm: () => Promise<void>;
}

const WalletPaymentModal: React.FC<WalletPaymentModalProps> = ({
  isOpen,
  onClose,
  planName,
  planPrice,
  walletBalance,
  isStudentPrice,
  checkoutPreview,
  currentSubscription,
  onConfirm
}) => {
  useScrollLock(isOpen);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const pricingMode = checkoutPreview?.pricingMode;
  const isUpgrade = pricingMode === 'UPGRADE_PRORATED'
    || pricingMode === 'UPGRADE_GRACE_WINDOW'
    || pricingMode === 'UPGRADE_FULL_PRICE';
  const isScheduledDowngrade = pricingMode === 'DOWNGRADE_SCHEDULED';
  const isScheduledTarget = Boolean(
    isScheduledDowngrade &&
      currentSubscription?.scheduledChangePlan?.id &&
      checkoutPreview?.targetPlan?.id &&
      currentSubscription.scheduledChangePlan.id === checkoutPreview.targetPlan.id,
  );
  const requiresImmediatePayment = !isScheduledDowngrade && planPrice > 0;
  const hasEnoughBalance = !requiresImmediatePayment || walletBalance >= planPrice;
  const remainingBalance = walletBalance - planPrice;
  const needToDeposit = planPrice - walletBalance;
  const isGraceWindowUpgrade = pricingMode === 'UPGRADE_GRACE_WINDOW';
  const isFullPriceUpgrade = pricingMode === 'UPGRADE_FULL_PRICE';
  const formatCurrency = (value?: string | number | null) =>
    Number(value ?? 0).toLocaleString('vi-VN');
  const formatCountdown = (remainingMs: number) => {
    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setProcessing(false);
    setError(null);
    setSuccess(false);
  }, [isOpen]);

  const graceCountdown = useMemo(() => {
    if (!isGraceWindowUpgrade || !currentSubscription?.startDate) {
      return null;
    }

    const endsAt = new Date(currentSubscription.startDate).getTime() + 72 * 60 * 60 * 1000;
    const remainingMs = Math.max(0, endsAt - now);

    return {
      remainingMs,
      label: formatCountdown(remainingMs),
      isActive: remainingMs > 0,
    };
  }, [currentSubscription?.startDate, isGraceWindowUpgrade, now]);

  const creditLabel = 'Giảm trừ từ gói hiện tại';
  const todayCostLabel = isScheduledDowngrade ? 'Chi phí hôm nay' : isUpgrade ? 'Thanh toán hôm nay' : 'Giá';
  const targetPriceLabel = isFullPriceUpgrade
    ? 'Giá gói mới'
    : isGraceWindowUpgrade
      ? 'Giá gốc gói mới'
      : isScheduledDowngrade
        ? 'Giá gói sau khi chuyển'
        : 'Giá theo thời gian còn lại';
  const renewalLabel = isScheduledDowngrade
    ? 'Bắt đầu gói mới'
    : isGraceWindowUpgrade || isFullPriceUpgrade
      ? 'Hết hạn mới'
      : 'Gia hạn tiếp theo';

  const handleConfirm = async () => {
    if (!hasEnoughBalance || isScheduledTarget) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      await onConfirm();
      setSuccess(true);
      setProcessing(false);
    } catch (err: any) {
      setError(err.message || 'Thanh toán thất bại. Vui lòng thử lại.');
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="wallet-payment-modal-overlay" onClick={onClose}>
      <div className="wallet-payment-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="wallet-payment-modal__close"
          onClick={onClose}
          aria-label="Đóng modal thanh toán"
        >
          <X size={24} />
        </button>

        <div className="wallet-payment-modal__header">
          <div className="wallet-payment-modal__icon">
            <Wallet size={32} />
          </div>
          <h2>Thanh toán bằng ví</h2>
        </div>

        {success ? (
          <div className="wallet-payment-modal__success">
            <CheckCircle size={64} className="success-icon" />
            <h3>{isScheduledDowngrade ? 'Đã lên lịch chuyển gói!' : 'Thanh toán thành công!'}</h3>
            <p>
              {isScheduledDowngrade
                ? 'Gói mới sẽ tự động có hiệu lực khi gói hiện tại kết thúc.'
                : isUpgrade
                ? 'Gói Premium của bạn đã được nâng cấp thành công.'
                : 'Gói Premium của bạn đã được kích hoạt.'}
            </p>
            <div className="wallet-payment-modal__footer" style={{ marginTop: '16px' }}>
              <button
                className="wallet-btn-primary"
                onClick={() => {
                  window.location.href = '/chatbot';
                }}
              >
                Trải nghiệm đặc quyền mới ngay
              </button>
              <button className="wallet-btn-secondary" onClick={onClose}>
                Để sau
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="wallet-payment-modal__body">
              {isGraceWindowUpgrade && graceCountdown?.isActive && (
                <div className="payment-upgrade-banner">
                  <div className="payment-upgrade-banner__eyebrow">Ưu đãi nâng cấp 72h đang chạy</div>
                  <div className="payment-upgrade-banner__countdown">
                    Bạn còn {graceCountdown.label}
                  </div>
                  <p className="payment-upgrade-banner__text">
                    Nâng cấp ngay để giữ phần giảm trừ từ gói hiện tại.
                  </p>
                </div>
              )}

              <div className="payment-summary-grid">
                <div className="payment-summary-card">
                  <div className="payment-summary-card__label">Gói mới</div>
                  <div className="payment-summary-card__value">{planName}</div>
                </div>

                {(isUpgrade || isScheduledDowngrade) && checkoutPreview?.currentPlan && (
                  <div className="payment-summary-card">
                    <div className="payment-summary-card__label">Từ gói hiện tại</div>
                    <div className="payment-summary-card__value">
                      {checkoutPreview.currentPlan.displayName}
                    </div>
                  </div>
                )}
              </div>

              <div className="payment-detail">
                <div className="payment-detail__label">
                  {todayCostLabel}
                </div>
                <div className="payment-detail__value">
                  {planPrice.toLocaleString('vi-VN')} ₫
                </div>
              </div>

              {checkoutPreview?.nextRenewalDate && (
                <div className="payment-detail">
                  <div className="payment-detail__label">
                    {renewalLabel}
                  </div>
                  <div className="payment-detail__value">
                    {new Date(checkoutPreview.nextRenewalDate).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              )}

              {isStudentPrice && (
                <div className="payment-detail payment-detail--highlight">
                  <div className="payment-detail__label">🎓 Giảm giá sinh viên</div>
                  <div className="payment-detail__value">Đã áp dụng</div>
                </div>
              )}

              {(isUpgrade || isScheduledDowngrade) && checkoutPreview && (
                <>
                  {isScheduledTarget && (
                    <div className="payment-upgrade-note">
                      <div className="payment-upgrade-note__title">Đã có lịch chuyển gói</div>
                      <p className="payment-upgrade-note__text">
                        Gói này đã được lên lịch. Bạn không cần xác nhận lại.
                      </p>
                    </div>
                  )}

                  <div className="payment-upgrade-note">
                    <div className="payment-upgrade-note__title">
                      {isScheduledDowngrade ? 'Lưu ý chuyển gói theo lịch' : 'Lưu ý nâng cấp'}
                    </div>
                    <p className="payment-upgrade-note__text">
                      {isScheduledDowngrade
                        ? 'Không trừ tiền ngay. Gói mới sẽ tự bắt đầu khi gói hiện tại kết thúc.'
                        : checkoutPreview.message}
                    </p>
                  </div>

                  {!isScheduledDowngrade && !isFullPriceUpgrade && (
                    <div className="payment-detail">
                      <div className="payment-detail__label">
                        <span>{creditLabel}</span>
                        <span
                          className="payment-detail__help"
                          title="72h được tính từ lúc mua gói hiện tại."
                          aria-label="72h được tính từ lúc mua gói hiện tại."
                        >
                          <Info size={13} aria-hidden="true" />
                        </span>
                      </div>
                      <div className="payment-detail__value">
                        -{formatCurrency(checkoutPreview.currentPlanCredit)} ₫
                      </div>
                    </div>
                  )}

                  <div className="payment-detail">
                    <div className="payment-detail__label">{targetPriceLabel}</div>
                    <div className="payment-detail__value">
                      {formatCurrency(checkoutPreview.proratedTargetPrice)} ₫
                      {isScheduledDowngrade ? '/tháng' : ''}
                    </div>
                  </div>

                  {!isScheduledDowngrade && (
                    <div className="payment-detail">
                      <div className="payment-detail__label">Số ngày còn lại</div>
                      <div className="payment-detail__value">
                        {checkoutPreview.remainingDays} ngày
                      </div>
                    </div>
                  )}
                </>
              )}

              {requiresImmediatePayment && <div className="payment-divider"></div>}

              {requiresImmediatePayment && (
                <div className="wallet-balance-grid">
                  <div className="wallet-balance">
                    <div className="wallet-balance__label">Số dư ví hiện tại</div>
                    <div className="wallet-balance__value">
                      {walletBalance.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>

                  {hasEnoughBalance ? (
                    <div className="wallet-balance wallet-balance--after">
                      <div className="wallet-balance__label">Số dư sau thanh toán</div>
                      <div className="wallet-balance__value wallet-balance__value--success">
                        {remainingBalance.toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  ) : (
                    <div className="insufficient-balance">
                      <AlertCircle size={20} />
                      <div>
                        <p className="insufficient-balance__title">Số dư không đủ</p>
                        <p className="insufficient-balance__text">
                          Bạn cần nạp thêm <strong>{needToDeposit.toLocaleString('vi-VN')} ₫</strong>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="payment-error" aria-live="polite">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="wallet-payment-modal__footer">
              {hasEnoughBalance ? (
                <>
                  <button 
                    className="wallet-btn-secondary" 
                    onClick={onClose}
                    disabled={processing}
                  >
                    Hủy
                  </button>
                  <button 
                    className="wallet-btn-primary" 
                    onClick={handleConfirm}
                    disabled={processing || isScheduledTarget}
                  >
                    {isScheduledTarget
                      ? 'Đã lên lịch'
                      : processing
                      ? 'Đang xử lý…'
                      : isScheduledDowngrade
                        ? 'Xác nhận chuyển gói theo lịch'
                        : 'Xác nhận thanh toán'}
                  </button>
                </>
              ) : (
                <>
                  <button className="wallet-btn-secondary" onClick={onClose}>
                    Hủy
                  </button>
                  <button 
                    className="wallet-btn-primary" 
                    onClick={() => {
                      onClose();
                      window.location.href = '/my-wallet';
                    }}
                  >
                    Nạp tiền vào ví
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WalletPaymentModal;
