import React, { useState } from 'react';
import { X, CheckCircle, RefreshCw, Calendar, Shield, Wallet } from 'lucide-react';
import { premiumService } from '../../services/premiumService';
import { UserSubscriptionResponse } from '../../data/premiumDTOs';
import './EnableAutoRenewalModal.css';

interface EnableAutoRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: UserSubscriptionResponse | null;
  onSuccess: () => void;
}

const EnableAutoRenewalModal: React.FC<EnableAutoRenewalModalProps> = ({
  isOpen,
  onClose,
  subscription,
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

  const basePrice = parseFloat(subscription.plan.price);
  const price = subscription.isStudentSubscription 
    ? basePrice * 0.8 
    : basePrice;

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
          <h2 className="enable-renewal-modal-title">Bật Thanh Toán Tự Động</h2>

          {/* Description */}
          <p className="enable-renewal-description">
            Bật tính năng thanh toán tự động để gói <strong>{subscription.plan.displayName}</strong> của bạn 
            được gia hạn liền mạch mà không bị gián đoạn.
          </p>

          {/* Info Cards */}
          <div className="enable-renewal-info-cards">
            <div className="enable-renewal-info-card">
              <RefreshCw size={24} className="card-icon-success" />
              <div>
                <h4>Tự động gia hạn</h4>
                <p>Trước 3 ngày hết hạn</p>
              </div>
            </div>
            <div className="enable-renewal-info-card">
              <Wallet size={24} className="card-icon-info" />
              <div>
                <h4>Thanh toán</h4>
                <p>{price.toLocaleString('vi-VN')} VND/tháng</p>
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

          {/* Benefits */}
          <div className="enable-renewal-benefits">
            <h3>✅ Lợi ích khi bật thanh toán tự động:</h3>
            <ul>
              <li>Không bao giờ bị gián đoạn dịch vụ Premium</li>
              <li>Tự động trừ tiền từ ví 3 ngày trước khi hết hạn</li>
              <li>Giữ nguyên giá ưu đãi sinh viên (nếu có)</li>
              <li>Có thể tắt thanh toán tự động bất cứ lúc nào</li>
            </ul>
          </div>

          {/* Note */}
          <div className="enable-renewal-note">
            <strong>💡 Lưu ý:</strong>
            <p>
              Hệ thống sẽ tự động trừ <strong>{price.toLocaleString('vi-VN')} VND</strong> từ 
              ví của bạn vào ngày <strong>{new Date(new Date(subscription.endDate).getTime() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')}</strong> 
              (3 ngày trước khi hết hạn). Vui lòng đảm bảo ví có đủ số dư.
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
