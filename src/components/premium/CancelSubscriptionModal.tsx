import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, RefreshCw, CheckCircle, Clock, Wallet, XCircle } from 'lucide-react';
import { premiumService } from '../../services/premiumService';
import { UserSubscriptionResponse } from '../../data/premiumDTOs';
import CancellationLimitModal from './CancellationLimitModal';
import { useScrollLock } from '../portfolio-hud/useScrollLock';
import './CancelSubscriptionModal.css';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: UserSubscriptionResponse | null;
  onSuccess: () => void;
}

const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onSuccess
}) => {
  useScrollLock(isOpen);
  const [reason, setReason] = useState('');
  const [isEligible, setIsEligible] = useState(false);
  const [checking, setChecking] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [daysSincePurchase, setDaysSincePurchase] = useState(0);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundPercentage, setRefundPercentage] = useState(0);
  const [eligibilityMessage, setEligibilityMessage] = useState('');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');

  useEffect(() => {
    if (isOpen && subscription) {
      // Check cancellation limit FIRST
      checkCancellationLimit();
    }
  }, [isOpen, subscription]);

  const checkCancellationLimit = async () => {
    try {
      setChecking(true);
      
      // Try to get refund eligibility - if limit exceeded, backend will throw error
      const result = await premiumService.checkRefundEligibility();
      
      // If we reach here, no limit exceeded - use backend data
      setIsEligible(result.eligible);
      setRefundPercentage(result.refundPercentage);
      setRefundAmount(result.refundAmount);
      setDaysSincePurchase(result.daysUsed);
      setEligibilityMessage(result.message);
      if (!result.eligible) {
        setError(result.message);
      }
    } catch (err: any) {
      console.error('Failed to check cancellation limit:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Không thể kiểm tra điều kiện hủy gói';
      
      // Check if error is about cancellation limit
      if (errorMsg.includes('giới hạn') || errorMsg.includes('1 lần/tháng')) {
        setLimitMessage(errorMsg);
        setShowLimitModal(true);
        // Don't close main modal here - let limit modal handle it
      } else {
        setIsEligible(false);
        setError(errorMsg);
      }
    } finally {
      setChecking(false);
    }
  };


  const handleCancelAutoRenewal = async () => {
    try {
      setProcessing(true);
      setError('');
      
      const result = await premiumService.cancelAutoRenewal();
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      console.error('Failed to cancel auto-renewal:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Không thể hủy gia hạn tự động';
      
      // Check if error is about cancellation limit
      if (errorMsg.includes('giới hạn') || errorMsg.includes('1 lần/tháng')) {
        setLimitMessage(errorMsg);
        setShowLimitModal(true);
        onClose(); // Close main modal
      } else {
        setError(errorMsg);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelWithRefund = async () => {
    try {
      setProcessing(true);
      setError('');
      
      const result = await premiumService.cancelSubscriptionWithRefund(reason || undefined);
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      console.error('Failed to cancel subscription:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Không thể hủy gói đăng ký';
      
      // Check if error is about cancellation limit
      if (errorMsg.includes('giới hạn') || errorMsg.includes('1 lần/tháng')) {
        setLimitMessage(errorMsg);
        setShowLimitModal(true);
        onClose(); // Close main modal
      } else {
        setError(errorMsg);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cancel-modal-overlay" onClick={onClose}>
      <div className="cancel-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="cancel-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="cancel-modal-header">
          <div className="cancel-modal-icon">
            <AlertTriangle size={48} />
          </div>
          <h2>Hủy Gói Premium</h2>
          <p>Bạn có chắc chắn muốn hủy gói đăng ký?</p>
        </div>

        {checking ? (
          <div className="cancel-modal-loading">
            <RefreshCw className="spin" size={32} />
            <p>Đang kiểm tra điều kiện hoàn tiền...</p>
          </div>
        ) : (
          <>
            {/* Subscription Info */}
            {subscription && (
              <div className="cancel-modal-info">
                <div className="cancel-info-item">
                  <span className="cancel-info-label">Gói hiện tại:</span>
                  <span className="cancel-info-value">{subscription.plan.name}</span>
                </div>
                <div className="cancel-info-item">
                  <span className="cancel-info-label">Ngày đăng ký:</span>
                  <span className="cancel-info-value">
                    {new Date(subscription.startDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="cancel-info-item">
                  <span className="cancel-info-label">Số ngày đã sử dụng:</span>
                  <span className="cancel-info-value">{daysSincePurchase} ngày</span>
                </div>
              </div>
            )}

            {/* Refund Eligibility */}
            <div className={`cancel-modal-eligibility ${refundPercentage > 0 ? 'eligible' : 'not-eligible'}`}>
              {refundPercentage === 100 ? (
                <>
                  <CheckCircle size={24} />
                  <div className="eligibility-content">
                    <h3>✅ Hoàn tiền 100%</h3>
                    <p>Trong vòng 24 giờ - Hoàn tiền đầy đủ</p>
                    <div className="refund-amount">
                      <Wallet size={20} />
                      <span>Số tiền hoàn lại: <strong>{refundAmount.toLocaleString('vi-VN')} VND</strong></span>
                    </div>
                  </div>
                </>
              ) : refundPercentage === 50 ? (
                <>
                  <CheckCircle size={24} />
                  <div className="eligibility-content">
                    <h3>⚡ Hoàn tiền 50%</h3>
                    <p>Từ 1-3 ngày - Hoàn một nửa số tiền</p>
                    <div className="refund-amount">
                      <Wallet size={20} />
                      <span>Số tiền hoàn lại: <strong>{refundAmount.toLocaleString('vi-VN')} VND</strong></span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Clock size={24} />
                  <div className="eligibility-content">
                    <h3>❌ Không hoàn tiền</h3>
                    <p>Quá 3 ngày - Chỉ có thể hủy gia hạn tự động</p>
                    <p className="error-message">{eligibilityMessage}</p>
                  </div>
                </>
              )}
            </div>

            {/* Reason Input - Only for refund */}
            {refundPercentage > 0 && (
              <div className="cancel-modal-reason">
                <label htmlFor="cancel-reason">Lý do hủy (tùy chọn):</label>
                <textarea
                  id="cancel-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Vui lòng cho chúng tôi biết lý do bạn muốn hủy gói..."
                  rows={4}
                  maxLength={500}
                />
                <span className="char-count">{reason.length}/500</span>
              </div>
            )}

            {/* Warning for Refund */}
            {refundPercentage > 0 && (
              <div className="cancel-modal-warning">
                <AlertTriangle size={20} />
                <div>
                  <strong>Lưu ý khi hủy & hoàn tiền:</strong>
                  <ul>
                    <li>Gói Premium sẽ bị hủy ngay lập tức</li>
                    <li>Bạn sẽ quay về gói Free Tier</li>
                    <li>Hoàn {refundPercentage}% số tiền vào ví trong vài phút</li>
                    <li>Bạn có thể đăng ký lại bất cứ lúc nào</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Warning for Cancel Auto-Renewal Only */}
            {refundPercentage === 0 && (
              <div className="cancel-modal-warning">
                <AlertTriangle size={20} />
                <div>
                  <strong>Lưu ý khi hủy gia hạn:</strong>
                  <ul>
                    <li>Gói Premium tiếp tục hoạt động đến hết kỳ</li>
                    <li>Không bị charge ở kỳ tiếp theo</li>
                    <li>Không hoàn tiền (quá 3 ngày)</li>
                    <li>Có thể bật lại gia hạn tự động bất cứ lúc nào</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && !isEligible && (
              <div className="cancel-modal-error">
                <AlertTriangle size={20} />
                <p>{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="cancel-modal-actions">
              <button
                className="cancel-modal-btn cancel-modal-btn--secondary"
                onClick={onClose}
                disabled={processing}
              >
                Giữ gói Premium
              </button>
              
              {/* Cancel Auto-Renewal Button (for >3 days) */}
              {refundPercentage === 0 && (
                <button
                  className="cancel-modal-btn cancel-modal-btn--warning"
                  onClick={handleCancelAutoRenewal}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <RefreshCw className="spin" size={20} />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <XCircle size={20} />
                      Hủy gia hạn tự động
                    </>
                  )}
                </button>
              )}

              {/* Cancel with Refund Button (for ≤3 days) */}
              {refundPercentage > 0 && (
                <button
                  className="cancel-modal-btn cancel-modal-btn--danger"
                  onClick={handleCancelWithRefund}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <RefreshCw className="spin" size={20} />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={20} />
                      Hủy gói & hoàn {refundPercentage}%
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Cancellation Limit Modal */}
      <CancellationLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onCloseAll={onClose}
        message={limitMessage}
      />
    </div>
  );
};

export default CancelSubscriptionModal;
