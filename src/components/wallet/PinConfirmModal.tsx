import React, { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import './PinConfirmModal.css';

interface PinConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  loading?: boolean;
  error?: string | null;
}

const PinConfirmModal: React.FC<PinConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  loading = false,
  error = null
}) => {
  const [pin, setPin] = useState<string>('');

  const handleSubmit = () => {
    if (pin.length === 6) {
      onConfirm(pin);
    }
  };

  const handleClose = () => {
    setPin('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="pin-confirm-overlay" onClick={handleClose}>
      <div className="pin-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pin-confirm-header">
          <div className="modal-title">
            <Lock size={28} />
            <h2>Xác Nhận Mã PIN</h2>
          </div>
          <button className="modal-close-btn" onClick={handleClose} disabled={loading}>
            <X size={24} />
          </button>
        </div>

        <div className="pin-confirm-body">
          <div className="pin-info">
            <AlertCircle size={20} />
            <p>Vui lòng nhập mã PIN giao dịch để xác nhận yêu cầu rút tiền</p>
          </div>

          <div className="pin-input-group">
            <label>Mã PIN (6 chữ số)</label>
            <div className="pin-input-wrapper">
              <Lock size={18} />
              <input
                type="password"
                placeholder="Nhập mã PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                autoFocus
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && pin.length === 6) {
                    handleSubmit();
                  }
                }}
              />
            </div>
            <div className="pin-hint">
              {pin.length}/6 chữ số
            </div>
          </div>

          {error && (
            <div className="pin-error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>

        <div className="pin-confirm-footer">
          <button className="btn-cancel" onClick={handleClose} disabled={loading}>
            Hủy
          </button>
          <button
            className="btn-confirm"
            onClick={handleSubmit}
            disabled={loading || pin.length !== 6}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Đang xử lý...
              </>
            ) : (
              <>🔒 Xác Nhận</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinConfirmModal;
