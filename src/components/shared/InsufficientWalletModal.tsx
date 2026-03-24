import React from "react";
import { X, Wallet, ArrowRight, PiggyBank, Info } from "lucide-react";

interface InsufficientWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredAmount: number;
  currentBalance?: number;
  type?: "escrow" | "posting";
}

export const InsufficientWalletModal: React.FC<InsufficientWalletModalProps> = ({
  isOpen,
  onClose,
  requiredAmount,
  currentBalance,
  type = "escrow",
}) => {
  if (!isOpen) return null;

  const shortfall = currentBalance != null
    ? requiredAmount - currentBalance
    : requiredAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
  };

  const handleGoToWallet = () => {
    onClose();
    window.location.href = "/my-wallet";
  };

  const isEscrow = type === "escrow";
  const title = isEscrow
    ? "Số dư ví không đủ để ký quỹ"
    : "Số dư ví không đủ để đăng tin";
  const subtitle = isEscrow
    ? "Bạn cần có đủ số dư trong ví để ký quỹ cho công việc này khi chọn ứng viên."
    : "Bạn cần nạp thêm tiền vào ví để có thể đăng tin tuyển dụng.";

  return (
    <div className="iw-modal-overlay" onClick={onClose}>
      <div className="iw-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="iw-modal-close" onClick={onClose} type="button">
          <X size={18} />
        </button>

        {/* Animated icon */}
        <div className="iw-modal-icon-wrap">
          <div className="iw-modal-icon-ring" />
          <div className="iw-modal-icon-inner">
            <Wallet size={32} />
          </div>
        </div>

        {/* Title */}
        <h2 className="iw-modal-title">{title}</h2>
        <p className="iw-modal-subtitle">{subtitle}</p>

        {/* Amount breakdown */}
        <div className="iw-modal-breakdown">
          {currentBalance != null && (
            <div className="iw-breakdown-row">
              <span className="iw-breakdown-label">Số dư hiện tại</span>
              <span className="iw-breakdown-value iw-breakdown-value--current">
                {formatCurrency(currentBalance)}
              </span>
            </div>
          )}
          <div className="iw-breakdown-row">
            <span className="iw-breakdown-label">
              {isEscrow ? "Cần ký quỹ" : "Phí đăng tin"}
            </span>
            <span className="iw-breakdown-value">
              {formatCurrency(requiredAmount)}
            </span>
          </div>
          {currentBalance != null && shortfall > 0 && (
            <>
              <div className="iw-breakdown-divider" />
              <div className="iw-breakdown-row">
                <span className="iw-breakdown-label">Cần nạp thêm</span>
                <span className="iw-breakdown-value iw-breakdown-value--shortfall">
                  +{formatCurrency(shortfall)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Info note */}
        <div className="iw-modal-note">
          <Info size={14} />
          <span>
            {isEscrow
              ? "Số tiền ký quỹ sẽ được freeze trong ví và hoàn lại cho bạn sau khi hoàn thành công việc (trừ phí nền tảng 10%)."
              : "Sau khi nạp tiền, bạn có thể quay lại để tiếp tục đăng tin."}
          </span>
        </div>

        {/* CTA */}
        <button
          className="iw-modal-cta"
          onClick={handleGoToWallet}
          type="button"
        >
          <PiggyBank size={18} />
          <span>Nạp tiền vào ví</span>
          <ArrowRight size={16} />
        </button>

        {/* Skip / later */}
        <button
          className="iw-modal-skip"
          onClick={onClose}
          type="button"
        >
          Để sau
        </button>
      </div>
    </div>
  );
};

export default InsufficientWalletModal;
