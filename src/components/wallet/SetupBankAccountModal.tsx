import React, { useState } from 'react';
import { Building2, CreditCard, User, Lock, X, AlertCircle } from 'lucide-react';
import walletService from '../../services/walletService';
import './SetupBankAccountModal.css';

interface SetupBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  needsPin: boolean;
  needsBank: boolean;
}

const SetupBankAccountModal: React.FC<SetupBankAccountModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  needsPin,
  needsBank
}) => {
  const [step, setStep] = useState<'bank' | 'pin'>(needsBank ? 'bank' : 'pin');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetupBank = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!bankName || !bankAccountNumber || !bankAccountName) {
        setError('Vui lòng điền đầy đủ thông tin ngân hàng');
        setLoading(false);
        return;
      }

      await walletService.updateBankAccount({
        bankName,
        bankAccountNumber,
        bankAccountName
      });

      // If also needs PIN, move to PIN step
      if (needsPin) {
        setStep('pin');
        setError(null);
      } else {
        if (onSuccess) onSuccess();
        onClose();
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Setup bank error:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi thiết lập tài khoản ngân hàng');
      setLoading(false);
    }
  };

  const handleSetupPin = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!pin || pin.length !== 6) {
        setError('Mã PIN phải có đúng 6 chữ số');
        setLoading(false);
        return;
      }

      if (pin !== confirmPin) {
        setError('Mã PIN xác nhận không khớp');
        setLoading(false);
        return;
      }

      if (!/^\d{6}$/.test(pin)) {
        setError('Mã PIN chỉ được chứa số');
        setLoading(false);
        return;
      }

      await walletService.setTransactionPin({ newPin: pin });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Setup PIN error:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi thiết lập mã PIN');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="setup-modal-overlay" onClick={onClose}>
      <div className="setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="setup-modal-header">
          <div className="modal-title">
            {step === 'bank' ? <Building2 size={28} /> : <Lock size={28} />}
            <h2>{step === 'bank' ? 'Thiết Lập Tài Khoản Ngân Hàng' : 'Thiết Lập Mã PIN Giao Dịch'}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="setup-modal-body">
          {/* Progress Steps */}
          {needsBank && needsPin && (
            <div className="setup-steps">
              <div className={`step ${step === 'bank' ? 'active' : 'completed'}`}>
                <div className="step-number">1</div>
                <span>Tài khoản NH</span>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step === 'pin' ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <span>Mã PIN</span>
              </div>
            </div>
          )}

          {/* Bank Account Setup */}
          {step === 'bank' && (
            <div className="setup-section">
              <div className="section-info">
                <AlertCircle size={20} />
                <p>Vui lòng thiết lập tài khoản ngân hàng để có thể rút tiền</p>
              </div>

              <div className="form-group">
                <label>Tên ngân hàng *</label>
                <input
                  type="text"
                  placeholder="VD: Vietcombank, Techcombank, BIDV..."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Số tài khoản *</label>
                <div className="input-with-icon">
                  <CreditCard size={18} />
                  <input
                    type="text"
                    placeholder="Nhập số tài khoản"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tên chủ tài khoản *</label>
                <div className="input-with-icon">
                  <User size={18} />
                  <input
                    type="text"
                    placeholder="Họ và tên chủ tài khoản"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="setup-error">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* PIN Setup */}
          {step === 'pin' && (
            <div className="setup-section">
              <div className="section-info">
                <AlertCircle size={20} />
                <p>Mã PIN 6 chữ số dùng để xác thực các giao dịch rút tiền</p>
              </div>

              <div className="form-group">
                <label>Mã PIN (6 chữ số) *</label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    type="password"
                    placeholder="Nhập mã PIN 6 số"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    autoFocus
                  />
                </div>
                <div className="input-hint">
                  {pin.length}/6 chữ số
                </div>
              </div>

              <div className="form-group">
                <label>Xác nhận mã PIN *</label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    type="password"
                    placeholder="Nhập lại mã PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                </div>
                {confirmPin && pin !== confirmPin && (
                  <div className="input-error">Mã PIN không khớp</div>
                )}
              </div>

              <div className="pin-requirements">
                <h4>Yêu cầu mã PIN:</h4>
                <ul>
                  <li className={pin.length === 6 ? 'valid' : ''}>✓ Đúng 6 chữ số</li>
                  <li className={/^\d+$/.test(pin) && pin.length > 0 ? 'valid' : ''}>✓ Chỉ chứa số (0-9)</li>
                  <li className={pin === confirmPin && pin.length === 6 ? 'valid' : ''}>✓ Khớp với xác nhận</li>
                </ul>
              </div>

              {error && (
                <div className="setup-error">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="setup-modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            className="btn-setup"
            onClick={step === 'bank' ? handleSetupBank : handleSetupPin}
            disabled={loading || (step === 'bank' ? !bankName || !bankAccountNumber || !bankAccountName : pin.length !== 6 || pin !== confirmPin)}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Đang xử lý...
              </>
            ) : (
              <>{step === 'bank' ? (needsPin ? 'Tiếp theo →' : '✓ Hoàn tất') : '✓ Hoàn tất'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupBankAccountModal;
