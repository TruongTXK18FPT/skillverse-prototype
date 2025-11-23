import React, { useState } from 'react';
import { X, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import './WalletPaymentModal.css';

interface WalletPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: number;
  walletBalance: number;
  isStudentPrice: boolean;
  onConfirm: () => Promise<void>;
}

const WalletPaymentModal: React.FC<WalletPaymentModalProps> = ({
  isOpen,
  onClose,
  planName,
  planPrice,
  walletBalance,
  isStudentPrice,
  onConfirm
}) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasEnoughBalance = walletBalance >= planPrice;
  const remainingBalance = walletBalance - planPrice;
  const needToDeposit = planPrice - walletBalance;

  const handleConfirm = async () => {
    if (!hasEnoughBalance) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      await onConfirm();
      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload(); // Reload to update subscription status
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Thanh toán thất bại. Vui lòng thử lại.');
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="wallet-payment-modal-overlay" onClick={onClose}>
      <div className="wallet-payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wallet-payment-modal__close" onClick={onClose}>
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
            <h3>Thanh toán thành công!</h3>
            <p>Gói Premium của bạn đã được kích hoạt.</p>
          </div>
        ) : (
          <>
            <div className="wallet-payment-modal__body">
              <div className="payment-detail">
                <div className="payment-detail__label">Gói Premium</div>
                <div className="payment-detail__value">{planName}</div>
              </div>

              {isStudentPrice && (
                <div className="payment-detail payment-detail--highlight">
                  <div className="payment-detail__label">🎓 Giảm giá sinh viên</div>
                  <div className="payment-detail__value">Đã áp dụng</div>
                </div>
              )}

              <div className="payment-detail payment-detail--price">
                <div className="payment-detail__label">Giá</div>
                <div className="payment-detail__value">
                  {planPrice.toLocaleString('vi-VN')} ₫
                </div>
              </div>

              <div className="payment-divider"></div>

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

              {error && (
                <div className="payment-error">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="wallet-payment-modal__footer">
              {hasEnoughBalance ? (
                <>
                  <button 
                    className="btn-secondary" 
                    onClick={onClose}
                    disabled={processing}
                  >
                    Hủy
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleConfirm}
                    disabled={processing}
                  >
                    {processing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-secondary" onClick={onClose}>
                    Hủy
                  </button>
                  <button 
                    className="btn-primary" 
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
