import React, { useState } from 'react';
import { X, AlertCircle, RefreshCw, CheckCircle, Calendar, Shield } from 'lucide-react';
import { premiumService } from '../../services/premiumService';
import { UserSubscriptionResponse } from '../../data/premiumDTOs';
import { useScrollLock } from '../portfolio-hud/useScrollLock';
import './CancelAutoRenewalModal.css';

interface CancelAutoRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: UserSubscriptionResponse | null;
  onSuccess: () => void;
}

const CancelAutoRenewalModal: React.FC<CancelAutoRenewalModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onSuccess
}) => {
  useScrollLock(isOpen);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

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
      setError(err.response?.data?.message || err.message || 'Không thể hủy thanh toán tự động');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !subscription) return null;
  const managesScheduledPlan = Boolean(subscription.scheduledChangePlan);
  const effectivePlan = subscription.scheduledChangePlan ?? subscription.plan;

  return (
    <div className="auto-renewal-modal-overlay" onClick={onClose}>
      <div className="auto-renewal-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="auto-renewal-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="auto-renewal-modal-content">
          {/* Icon */}
          <div className="auto-renewal-icon-wrapper">
            <AlertCircle className="auto-renewal-icon" size={64} />
          </div>

          {/* Title */}
          <h2 className="auto-renewal-modal-title">Hủy Thanh Toán Tự Động</h2>

          {/* Description */}
          <p className="auto-renewal-description">
            Bạn có chắc chắn muốn hủy thanh toán tự động cho gói <strong>{effectivePlan.displayName}</strong>
            {managesScheduledPlan ? ' sau khi chuyển gói' : ''}?
          </p>

          {/* Info Cards */}
          <div className="auto-renewal-info-cards">
            <div className="auto-renewal-info-card">
              <CheckCircle size={24} className="card-icon-success" />
              <div>
                <h4>Gói vẫn hoạt động</h4>
                <p>Đến {new Date(subscription.endDate).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
            <div className="auto-renewal-info-card">
              <Calendar size={24} className="card-icon-warning" />
              <div>
                <h4>Không gia hạn</h4>
                <p>Sau ngày hết hạn</p>
              </div>
            </div>
            <div className="auto-renewal-info-card">
              <Shield size={24} className="card-icon-info" />
              <div>
                <h4>Không hoàn tiền</h4>
                <p>Dùng đến hết kỳ</p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="auto-renewal-benefits">
            <h3>✅ Sau khi hủy thanh toán tự động:</h3>
            <ul>
              <li>Gói Premium tiếp tục hoạt động đến hết kỳ</li>
              <li>Không bị charge tiền ở kỳ tiếp theo</li>
              <li>Có thể bật lại thanh toán tự động bất cứ lúc nào</li>
              <li>Không mất bất kỳ khoản tiền nào</li>
            </ul>
          </div>

          {/* Note */}
          <div className="auto-renewal-note">
            <strong>💡 Lưu ý:</strong>
            <p>
              Nếu bạn muốn hủy gói ngay lập tức và nhận hoàn tiền, vui lòng sử dụng 
              chức năng <strong>"Hủy gói & hoàn tiền"</strong> thay vì hủy thanh toán tự động.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auto-renewal-error">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="auto-renewal-actions">
            <button
              className="auto-renewal-btn auto-renewal-btn--secondary"
              onClick={onClose}
              disabled={processing}
            >
              Giữ thanh toán tự động
            </button>
            <button
              className="auto-renewal-btn auto-renewal-btn--warning"
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
                  <AlertCircle size={20} />
                  Xác nhận hủy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelAutoRenewalModal;
