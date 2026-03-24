import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { ShieldCheck, Wallet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import shortTermJobService from "../../services/shortTermJobService";
import walletService from "../../services/walletService";
import { useToast } from "../../hooks/useToast";
import { WalletResponse } from "../../data/walletDTOs";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import "../business-hud/short-term-fleet.css";

interface FundingModalProps {
  visible: boolean;
  jobId: number;
  jobTitle: string;
  budget: number;
  walletBalance: number;
  onClose: () => void;
  onEscrowFunded: () => void;
}

type Step = "review" | "confirm" | "success";

const PLATFORM_FEE_RATE = 0.10;

const FundingModal: React.FC<FundingModalProps> = ({
  visible,
  jobId,
  jobTitle,
  budget,
  walletBalance,
  onClose,
  onEscrowFunded,
}) => {
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState<Step>("review");
  const [isLoading, setIsLoading] = useState(false);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);

  const platformFee = Math.round(budget * PLATFORM_FEE_RATE);
  const netAmount = budget - platformFee;

  useEffect(() => {
    if (visible) {
      setStep("review");
      setIsLoading(false);
      loadWalletBalance();
    }
  }, [visible]);

  const loadWalletBalance = async () => {
    try {
      const w = await walletService.getMyWallet();
      setWallet(w);
    } catch {
      // use prop walletBalance as fallback
    }
  };

  const currentBalance = wallet?.cashBalance ?? walletBalance;
  const insufficientBalance = currentBalance < budget;

  const handleFund = async () => {
    setIsLoading(true);
    try {
      await shortTermJobService.fundEscrow(jobId);
      setStep("success");
      showSuccess("Ký quỹ thành công", `Đã ký quỹ ${shortTermJobService.formatBudget(budget)} cho job "${jobTitle}".`);
      // dispatch wallet update event
      window.dispatchEvent(new Event("wallet:updated"));
    } catch (err: any) {
      showError("Ký quỹ thất bại", err.message || "Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (step === "success") {
      onEscrowFunded();
    }
    onClose();
  };

  if (!visible) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    background: "rgba(1, 5, 13, 0.74)",
    zIndex: 50,
    backdropFilter: "blur(4px)",
    animation: "stj-fadeIn 0.2s ease-out",
  };

  const modalStyle: React.CSSProperties = {
    width: "min(520px, 100%)",
    padding: "1.5rem",
    borderRadius: "20px",
    background: "radial-gradient(circle at top right, rgba(34, 211, 238, 0.06), transparent 28%), linear-gradient(180deg, rgba(12, 26, 47, 0.98), rgba(8, 18, 32, 0.98))",
    border: "1px solid rgba(34, 211, 238, 0.14)",
    color: "#e0f2fe",
    maxHeight: "90vh",
    overflowY: "auto",
  };

  const eyebrowStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#22d3ee",
    marginBottom: "0.5rem",
  };

  const titleStyle: React.CSSProperties = {
    margin: "0.35rem 0 0.5rem",
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#e0f2fe",
  };

  const descStyle: React.CSSProperties = {
    margin: "0 0 1rem",
    color: "#94a3b8",
    fontSize: "0.85rem",
    lineHeight: 1.55,
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.6rem 0",
    borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
    fontSize: "0.88rem",
  };

  const totalRowStyle: React.CSSProperties = {
    ...rowStyle,
    borderBottom: "none",
    paddingTop: "0.85rem",
    marginTop: "0.25rem",
    borderTop: "2px solid rgba(34, 211, 238, 0.2)",
    fontWeight: 700,
    fontSize: "1rem",
  };

  const warningStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    alignItems: "flex-start",
    padding: "0.85rem 1rem",
    borderRadius: "10px",
    background: "rgba(251, 113, 133, 0.08)",
    border: "1px solid rgba(251, 113, 133, 0.2)",
    color: "#fb7185",
    fontSize: "0.82rem",
    lineHeight: 1.5,
    marginBottom: "1rem",
  };

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.65rem",
    marginTop: "1rem",
  };

  const btnStyle = (variant: "primary" | "secondary"): React.CSSProperties => {
    if (variant === "primary") {
      return {
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.65rem 1.25rem",
        borderRadius: "10px",
        border: "none",
        fontSize: "0.88rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
        background: "linear-gradient(135deg, #f59e0b, #d97706)",
        color: "#0f172a",
      };
    }
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem",
      padding: "0.65rem 1.25rem",
      borderRadius: "10px",
      border: "1px solid rgba(148, 163, 184, 0.18)",
      background: "rgba(148, 163, 184, 0.08)",
      color: "#94a3b8",
      fontSize: "0.88rem",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s ease",
    };
  };

  const content = (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Step: Review */}
        {step === "review" && (
          <>
            <div style={eyebrowStyle}>
              <ShieldCheck size={14} />
              Ký quỹ cho công việc
            </div>
            <h2 style={titleStyle}>{jobTitle}</h2>
            <p style={descStyle}>
              Ký quỹ giúp bảo vệ cả hai bên. Tiền sẽ được giữ an toàn cho đến khi công việc hoàn thành.
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <div style={rowStyle}>
                <span style={{ color: "#94a3b8" }}>Ngân sách công việc</span>
                <strong>{shortTermJobService.formatBudget(budget)}</strong>
              </div>
              <div style={rowStyle}>
                <span style={{ color: "#94a3b8" }}>Phí nền tảng (10%)</span>
                <span style={{ color: "#fb7185" }}>- {shortTermJobService.formatBudget(platformFee)}</span>
              </div>
              <div style={rowStyle}>
                <span style={{ color: "#94a3b8" }}>Worker nhận được</span>
                <span style={{ color: "#4ade80" }}>{shortTermJobService.formatBudget(netAmount)}</span>
              </div>
              <div style={rowStyle}>
                <span style={{ color: "#94a3b8" }}>Số dư ví hiện tại</span>
                <span>{shortTermJobService.formatBudget(currentBalance)}</span>
              </div>
              <div style={totalRowStyle}>
                <span style={{ color: "#94a3b8" }}>Cần ký quỹ</span>
                <span style={{ color: "#e0f2fe" }}>{shortTermJobService.formatBudget(budget)}</span>
              </div>
            </div>

            {insufficientBalance && (
              <div style={warningStyle}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  Số dư ví không đủ. Vui lòng nạp thêm{" "}
                  {shortTermJobService.formatBudget(budget - currentBalance)} để ký quỹ.
                </div>
              </div>
            )}

            <div style={actionsStyle}>
              <button style={btnStyle("secondary")} onClick={handleClose}>
                Hủy
              </button>
              <button
                style={btnStyle("primary")}
                disabled={isLoading || insufficientBalance}
                onClick={() => setStep("confirm")}
              >
                {isLoading ? <Loader2 size={14} className="stj-spin" /> : null}
                Tiếp tục
              </button>
            </div>
          </>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <>
            <div style={eyebrowStyle}>
              <AlertCircle size={14} />
              Xác nhận ký quỹ
            </div>
            <h2 style={titleStyle}>Bạn có chắc chắn?</h2>
            <p style={descStyle}>
              Hành động này sẽ trừ{" "}
              <strong style={{ color: "#e0f2fe" }}>
                {shortTermJobService.formatBudget(budget)}
              </strong>{" "}
              từ ví của bạn. Tiền sẽ được giữ trong escrow cho đến khi công việc hoàn
              thành và worker được thanh toán.
            </p>

            <div style={{ marginBottom: "1rem", padding: "1rem", borderRadius: "12px", background: "rgba(8, 15, 30, 0.55)", border: "1px solid rgba(148, 163, 184, 0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.85rem" }}>
                <span style={{ color: "#94a3b8" }}>Job</span>
                <strong style={{ color: "#e0f2fe", textAlign: "right", maxWidth: "60%" }}>{jobTitle}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.85rem" }}>
                <span style={{ color: "#94a3b8" }}>Số tiền ký quỹ</span>
                <strong style={{ color: "#f59e0b" }}>{shortTermJobService.formatBudget(budget)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.85rem" }}>
                <span style={{ color: "#94a3b8" }}>Phí nền tảng (không hoàn)</span>
                <span style={{ color: "#fb7185" }}>{shortTermJobService.formatBudget(platformFee)}</span>
              </div>
            </div>

            <div style={actionsStyle}>
              <button style={btnStyle("secondary")} onClick={() => setStep("review")} disabled={isLoading}>
                Quay lại
              </button>
              <button
                style={{ ...btnStyle("primary"), minWidth: "160px", justifyContent: "center" }}
                disabled={isLoading}
                onClick={handleFund}
              >
                {isLoading ? (
                  <>
                    <MeowlKuruLoader size="small" text="" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    Ký quỹ ngay
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <>
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "rgba(74, 222, 128, 0.14)",
                  border: "2px solid rgba(74, 222, 128, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.25rem",
                  color: "#4ade80",
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h2 style={{ ...titleStyle, textAlign: "center" }}>Ký quỹ thành công!</h2>
              <p style={{ ...descStyle, textAlign: "center" }}>
                Bạn đã ký quỹ{" "}
                <strong style={{ color: "#e0f2fe" }}>
                  {shortTermJobService.formatBudget(budget)}
                </strong>{" "}
                cho job "{jobTitle}". Worker sẽ nhận được thông báo và có thể bắt đầu làm việc.
              </p>
            </div>

            <div style={{ marginBottom: "1.25rem", padding: "1rem", borderRadius: "12px", background: "rgba(8, 15, 30, 0.55)", border: "1px solid rgba(148, 163, 184, 0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.85rem" }}>
                <span style={{ color: "#94a3b8" }}>Số tiền ký quỹ</span>
                <strong style={{ color: "#4ade80" }}>{shortTermJobService.formatBudget(budget)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.85rem" }}>
                <span style={{ color: "#94a3b8" }}>Worker nhận được</span>
                <span style={{ color: "#94a3b8" }}>{shortTermJobService.formatBudget(netAmount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.85rem" }}>
                <span style={{ color: "#94a3b8" }}>Phí nền tảng</span>
                <span style={{ color: "#fb7185" }}>{shortTermJobService.formatBudget(platformFee)}</span>
              </div>
            </div>

            <div style={actionsStyle}>
              <button style={{ ...btnStyle("primary"), width: "100%", justifyContent: "center" }} onClick={handleClose}>
                Đóng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default FundingModal;
