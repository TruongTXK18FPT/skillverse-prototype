import React, { useState } from 'react';
import { paymentService } from '../../services/paymentService';
import { CreatePaymentRequest } from '../../data/paymentDTOs';
import { useTheme } from '../../context/ThemeContext';
import './DepositCashModal.css';

interface DepositCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
}


const DepositCashModal: React.FC<DepositCashModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log when modal opens
  React.useEffect(() => {
    if (isOpen) {
      console.log('💳 DepositCashModal opened!');
    }
  }, [isOpen]);

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(value);
    setError(null);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleDeposit = async () => {
    console.log('🚀 handleDeposit called!');
    try {
      setLoading(true);
      setError(null);

      const amount = parseInt(customAmount);
      console.log('💰 Amount:', amount);
      
      if (!amount || amount < 5000) {
        setError('Số tiền tối thiểu là 5.000 VND');
        setLoading(false);
        return;
      }
      if (amount > 10000000) {
        setError('Số tiền tối đa là 10.000.000 VND');
        setLoading(false);
        return;
      }
      
      const description = `Nạp tiền vào ví: ${formatCurrency(amount)}`;

      // Tạo payment request
      const paymentRequest: CreatePaymentRequest = {
        amount: amount.toString(),
        description,
        type: 'WALLET_TOPUP', // Wallet topup type
        paymentMethod: 'PAYOS',
        currency: 'VND',
        successUrl: `${window.location.origin}/my-wallet?status=success&message=${encodeURIComponent('Nạp tiền thành công! Số dư đã được cập nhật.')}`,
        cancelUrl: `${window.location.origin}/my-wallet?status=cancel`,
      };

      console.log('📤 Sending payment request:', paymentRequest);

      // Gọi payment service để tạo payment URL
      const paymentResponse = await paymentService.createPayment(paymentRequest);

      console.log('📥 Payment response:', paymentResponse);

      // Nếu có checkout URL, redirect đến trang thanh toán
      if (paymentResponse.checkoutUrl) {
        console.log('✅ Redirecting to:', paymentResponse.checkoutUrl);
        window.location.href = paymentResponse.checkoutUrl;
      } else {
        throw new Error('Không nhận được URL thanh toán');
      }

    } catch (err: any) {
      console.error('❌ Deposit error:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error message:', err.message);
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo thanh toán');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`deposit-modal-overlay ${theme}`} onClick={onClose}>
      <div className={`deposit-modal ${theme}`} onClick={(e) => e.stopPropagation()}>
        <div className="deposit-modal-header">
          <h2>💰 Nạp Tiền Vào Ví</h2>
          <button className="deposit-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="deposit-modal-body">
          {/* Custom Amount Input */}
          <div className="deposit-custom">
            <h3>Nhập số tiền muốn nạp:</h3>
            <div className="custom-input-group">
              <input
                type="text"
                className="custom-amount-input"
                placeholder="Nhập số tiền (VND)"
                value={customAmount}
                onChange={handleCustomAmountChange}
                autoFocus
              />
              <span className="currency-label">VND</span>
            </div>
            {customAmount && (
              <div className="custom-preview">
                Số tiền: <strong>{formatCurrency(parseInt(customAmount))}</strong>
              </div>
            )}
            <div className="custom-note">
              💡 Số tiền tối thiểu: 5.000 VND | Tối đa: 10.000.000 VND
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="deposit-error">{error}</div>}

          {/* Payment Summary */}
          {customAmount && (
            <div className="deposit-summary">
              <h3>Thông tin thanh toán:</h3>
              <div className="summary-row">
                <span>Phương thức:</span>
                <span>💳 PayOS (QR Code)</span>
              </div>
              <div className="summary-row">
                <span>Số tiền nạp:</span>
                <span className="highlight">
                  {formatCurrency(parseInt(customAmount))}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="deposit-modal-footer">
          <button className="deposit-btn-cancel" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            className="deposit-btn-submit"
            onClick={() => {
              console.log('🔘 Button clicked! Amount:', customAmount, 'Loading:', loading);
              handleDeposit();
            }}
            disabled={loading || !customAmount}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Đang xử lý...
              </>
            ) : (
              <>🚀 Tiến Hành Thanh Toán</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepositCashModal;
