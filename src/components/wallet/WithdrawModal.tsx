import React, { useState, useEffect } from 'react';
import { ArrowUpRight, X, AlertCircle, Building2, Settings, CreditCard, User } from 'lucide-react';
import walletService from '../../services/walletService';
import SetupBankAccountModal from './SetupBankAccountModal';
import PinConfirmModal from './PinConfirmModal';
import './WithdrawModal.css';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentBalance: number;
  hasBankAccount: boolean;
  hasTransactionPin: boolean;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currentBalance,
  hasBankAccount,
  hasTransactionPin,
  bankName: initialBankName,
  bankAccountNumber: initialBankAccountNumber,
  bankAccountName: initialBankAccountName
}) => {
  const [amount, setAmount] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [bankAccountNumber, setBankAccountNumber] = useState<string>('');
  const [bankAccountName, setBankAccountName] = useState<string>('');
  const [bankBranch, setBankBranch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<any>(null);

  // Auto-fill bank info when modal opens
  useEffect(() => {
    if (isOpen && hasBankAccount) {
      setBankName(initialBankName || '');
      // Don't auto-fill masked account number - user must enter it
      // setBankAccountNumber(initialBankAccountNumber || '');
      setBankAccountName(initialBankAccountName || '');
    }
  }, [isOpen, hasBankAccount, initialBankName, initialBankAccountNumber, initialBankAccountName]);

  const MIN_WITHDRAW = 100000; // 100,000 VND (backend requirement)
  const MAX_WITHDRAW = 10000000; // 10,000,000 VND
  const WITHDRAW_FEE_PERCENT = 2; // 2%

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const calculateFee = (withdrawAmount: number): number => {
    return Math.round(withdrawAmount * WITHDRAW_FEE_PERCENT / 100);
  };

  const calculateNetAmount = (withdrawAmount: number): number => {
    return withdrawAmount - calculateFee(withdrawAmount);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
    setError(null);
  };

  const handlePrepareWithdraw = () => {
    setError(null);

    const withdrawAmount = parseInt(amount);

    // Validation
    if (!withdrawAmount || withdrawAmount < MIN_WITHDRAW) {
      setError(`Số tiền rút tối thiểu là ${formatCurrency(MIN_WITHDRAW)}`);
      return;
    }

    if (withdrawAmount > MAX_WITHDRAW) {
      setError(`Số tiền rút tối đa là ${formatCurrency(MAX_WITHDRAW)}`);
      return;
    }

    if (withdrawAmount > currentBalance) {
      setError('Số dư không đủ để thực hiện giao dịch');
      return;
    }

    if (!bankName || !bankAccountNumber || !bankAccountName) {
      setError('Vui lòng điền đầy đủ thông tin ngân hàng');
      return;
    }

    // Validate bank account number format (alphanumeric, 5-19 characters)
    if (!/^[A-Za-z0-9]{5,19}$/.test(bankAccountNumber)) {
      setError('Số tài khoản phải từ 5-19 ký tự (chữ hoặc số)');
      return;
    }

    // Store withdrawal data and show PIN modal
    setPendingWithdrawal({
      amount: withdrawAmount,
      bankName,
      bankAccountNumber,
      bankAccountName,
      bankBranch: bankBranch || undefined
    });
    setShowPinModal(true);
  };

  const handleConfirmWithdraw = async (pin: string) => {
    try {
      setLoading(true);
      setPinError(null);

      // Call API with PIN
      await walletService.createWithdrawalRequest({
        ...pendingWithdrawal,
        transactionPin: pin
      });

      setLoading(false);
      setShowPinModal(false);
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setAmount('');
      setBankBranch('');
      setPendingWithdrawal(null);
      
      onClose();
    } catch (err: any) {
      console.error('Withdraw error:', err);
      setPinError(err.response?.data?.message || 'Mã PIN không đúng hoặc có lỗi xảy ra');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const withdrawAmount = parseInt(amount) || 0;
  const fee = calculateFee(withdrawAmount);
  const netAmount = calculateNetAmount(withdrawAmount);

  return (
    <div className="withdraw-modal-overlay" onClick={onClose}>
      <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="withdraw-modal-header">
          <div className="modal-title">
            <ArrowUpRight size={28} />
            <h2>Rút Tiền Về Ngân Hàng</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="withdraw-modal-body">
          {/* Balance Info */}
          <div className="balance-info">
            <span>Số dư khả dụng:</span>
            <strong>{formatCurrency(currentBalance)}</strong>
          </div>

          {/* Warning if no bank account or PIN */}
          {(!hasBankAccount || !hasTransactionPin) && (
            <div className="warning-box">
              <AlertCircle size={20} />
              <div>
                {!hasBankAccount && <p>⚠️ Bạn chưa thiết lập tài khoản ngân hàng</p>}
                {!hasTransactionPin && <p>⚠️ Bạn chưa thiết lập mã PIN giao dịch</p>}
                <button 
                  className="setup-now-btn"
                  onClick={() => setShowSetupModal(true)}
                >
                  <Settings size={16} />
                  Thiết lập ngay
                </button>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="form-group">
            <label>Số tiền muốn rút</label>
            <div className="input-with-icon">
              <input
                type="text"
                placeholder="Nhập số tiền (VND)"
                value={amount}
                onChange={handleAmountChange}
                autoFocus
              />
              <span className="currency-suffix">VND</span>
            </div>
            <div className="input-hint">
              Tối thiểu: {formatCurrency(MIN_WITHDRAW)} | Tối đa: {formatCurrency(MAX_WITHDRAW)}
            </div>
          </div>

          {/* Bank Information */}
          <div className="bank-info-section">
            <h3>
              <Building2 size={20} />
              Thông tin ngân hàng
            </h3>

            <div className="form-group">
              <label>Tên ngân hàng *</label>
              <input
                type="text"
                placeholder="VD: Vietcombank, Techcombank, BIDV..."
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Số tài khoản * {hasBankAccount && <span className="field-note">(Vui lòng nhập lại để xác nhận)</span>}</label>
              <div className="input-with-icon">
                <CreditCard size={18} />
                <input
                  type="text"
                  placeholder={hasBankAccount ? `Nhập lại số TK (***${initialBankAccountNumber?.slice(-4) || ''})` : "Nhập số tài khoản"}
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                />
              </div>
              <div className="input-hint">
                Số tài khoản: 5-19 ký tự (chữ hoặc số) {bankAccountNumber && `(${bankAccountNumber.length}/5-19)`}
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

            <div className="form-group">
              <label>Chi nhánh (tùy chọn)</label>
              <input
                type="text"
                placeholder="VD: Chi nhánh Hà Nội"
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
              />
            </div>
          </div>


          {/* Error Message */}
          {error && (
            <div className="withdraw-error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Summary */}
          {withdrawAmount >= MIN_WITHDRAW && (
            <div className="withdraw-summary">
              <h3>Chi tiết rút tiền:</h3>
              <div className="summary-row">
                <span>Số tiền rút:</span>
                <strong>{formatCurrency(withdrawAmount)}</strong>
              </div>
              <div className="summary-row fee">
                <span>Phí giao dịch ({WITHDRAW_FEE_PERCENT}%):</span>
                <strong className="fee-amount">-{formatCurrency(fee)}</strong>
              </div>
              <div className="summary-row total">
                <span>Số tiền nhận được:</span>
                <strong className="net-amount">{formatCurrency(netAmount)}</strong>
              </div>
              <div className="summary-note">
                <AlertCircle size={16} />
                <span>Yêu cầu rút tiền sẽ được xử lý trong vòng 1-3 ngày làm việc</span>
              </div>
            </div>
          )}
        </div>

        <div className="withdraw-modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            className="btn-withdraw"
            onClick={handlePrepareWithdraw}
            disabled={!amount || parseInt(amount) < MIN_WITHDRAW}
          >
            💸 Tạo Yêu Cầu Rút Tiền
          </button>
        </div>
      </div>

      {/* Setup Modal */}
      <SetupBankAccountModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSuccess={() => {
          setShowSetupModal(false);
          if (onSuccess) onSuccess();
        }}
        needsBank={!hasBankAccount}
        needsPin={!hasTransactionPin}
      />

      {/* PIN Confirm Modal */}
      <PinConfirmModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingWithdrawal(null);
          setPinError(null);
        }}
        onConfirm={handleConfirmWithdraw}
        loading={loading}
        error={pinError}
      />
    </div>
  );
};

export default WithdrawModal;
