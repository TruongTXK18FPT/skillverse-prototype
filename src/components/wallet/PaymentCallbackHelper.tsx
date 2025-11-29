import React, { useState, useEffect } from 'react';
import axiosInstance from '../../services/axiosInstance';
import './PaymentCallbackHelper.css';

interface PaymentCallbackHelperProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Helper component for triggering payment callback manually
 * Used when PayOS webhook cannot reach localhost
 */
const PaymentCallbackHelper: React.FC<PaymentCallbackHelperProps> = ({ 
  isVisible, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  useEffect(() => {
    if (isVisible) {
      fetchPendingPayments();
    }
  }, [isVisible]);

  const fetchPendingPayments = async () => {
    try {
      const { data } = await axiosInstance.get('/api/payments/history');
      // Filter PENDING wallet topup or coin purchase payments
      const pending = data.filter((p: any) => 
        p.status === 'PENDING' && (p.type === 'WALLET_TOPUP' || p.type === 'COIN_PURCHASE')
      );
      setPendingPayments(pending);
    } catch (err) {
      console.error('Failed to fetch pending payments:', err);
    }
  };

  const triggerCallback = async (internalReference: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.post(
        `/api/payments/test/trigger-callback/${internalReference}?status=PAID`
      );

      console.log('Callback response:', response.data);
      setSuccess(true);
      
      // Wait a bit then refresh and close
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Callback error:', err);
      setError(err.response?.data?.message || 'Không thể xử lý callback');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="callback-helper-overlay" onClick={onClose}>
      <div className="callback-helper-modal" onClick={(e) => e.stopPropagation()}>
        <div className="callback-helper-header">
          <h3>🔄 Xử Lý Thanh Toán</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="callback-helper-body">
          {success ? (
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h4>Thành công!</h4>
              <p>Số dư đã được cập nhật</p>
            </div>
          ) : (
            <>
              <div className="info-box">
                <p>
                  <strong>Lưu ý:</strong> Trong môi trường development (localhost), 
                  PayOS không thể gửi webhook tự động. Bạn cần kích hoạt xử lý thanh toán thủ công.
                </p>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="no-pending">
                  <p>Không có giao dịch nào đang chờ xử lý</p>
                </div>
              ) : (
                <>
                  <h4>Giao dịch đang chờ xử lý:</h4>
                  <div className="pending-payments-list">
                    {pendingPayments.map((payment) => (
                      <div key={payment.internalReference} className="pending-payment-item">
                        <div className="payment-info">
                          <div className="payment-amount">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(payment.amount)}
                          </div>
                          <div className="payment-date">
                            {new Date(payment.createdAt).toLocaleString('vi-VN')}
                          </div>
                          <div className="payment-ref">
                            Mã: {payment.internalReference}
                          </div>
                        </div>
                        <button
                          className="trigger-btn"
                          onClick={() => triggerCallback(payment.internalReference)}
                          disabled={loading}
                        >
                          {loading ? 'Đang xử lý...' : 'Xử lý ngay'}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {error && (
                <div className="error-message">
                  ❌ {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="callback-helper-footer">
          <button className="cancel-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallbackHelper;
