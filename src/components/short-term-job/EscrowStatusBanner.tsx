import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldOff,
  DollarSign,
  Lock,
  Loader2,
} from "lucide-react";
import shortTermJobService from "../../services/shortTermJobService";
import { useToast } from "../../hooks/useToast";
import { JobEscrow, EscrowStatus } from "../../types/ShortTermJob";
import "../business-hud/short-term-fleet.css";

interface EscrowStatusBannerProps {
  escrow: JobEscrow | null;
  jobId: number;
  currentUserRole: "RECRUITER" | "WORKER" | "OTHER";
  onFund?: () => void;
  onRelease?: () => void;
  onDispute?: () => void;
  onRefund?: () => void;
}

const EscrowStatusBanner: React.FC<EscrowStatusBannerProps> = ({
  escrow,
  jobId,
  currentUserRole,
  onFund,
  onRelease,
  onDispute,
  onRefund,
  onRefund: _unused,
}) => {
  const { showSuccess, showError } = useToast();
  const [isReleasing, setIsReleasing] = useState(false);

  const getStatusInfo = (status: EscrowStatus | null) => {
    if (!escrow) {
      return {
        icon: <Lock size={18} />,
        label: "Chưa ký quỹ",
        color: "#94a3b8",
        bg: "rgba(148, 163, 184, 0.1)",
        border: "rgba(148, 163, 184, 0.2)",
        desc: "Công việc chưa được ký quỹ. Recruiter cần ký quỹ trước khi chọn ứng viên.",
      };
    }
    switch (status) {
      case EscrowStatus.FUNDED:
        return {
          icon: <ShieldCheck size={18} />,
          label: "Đã ký quỹ",
          color: "#3b82f6",
          bg: "rgba(59, 130, 246, 0.1)",
          border: "rgba(59, 130, 246, 0.2)",
          desc: currentUserRole === "RECRUITER"
            ? "Tiền đã được ký quỹ. Bạn cần giải phóng ký quỹ sau khi nghiệm thu công việc."
            : "Tiền đã được ký quỹ bởi recruiter. Chờ recruiter nghiệm thu và giải phóng thanh toán.",
        };
      case EscrowStatus.PARTIALLY_RELEASED:
        return {
          icon: <RefreshCw size={18} />,
          label: "Giải phóng một phần",
          color: "#8b5cf6",
          bg: "rgba(139, 92, 246, 0.1)",
          border: "rgba(139, 92, 246, 0.2)",
          desc: `Đã giải phóng một phần ký quỹ. Còn lại: ${shortTermJobService.formatBudget(escrow.escrowBalance)}`,
        };
      case EscrowStatus.FULLY_RELEASED:
        return {
          icon: <CheckCircle2 size={18} />,
          label: "Đã giải phóng",
          color: "#4ade80",
          bg: "rgba(74, 222, 128, 0.1)",
          border: "rgba(74, 222, 128, 0.2)",
          desc: `Tiền đã được giải phóng cho worker. Phí nền tảng: ${shortTermJobService.formatBudget(escrow.platformFee)}`,
        };
      case EscrowStatus.REFUNDED:
        return {
          icon: <ShieldOff size={18} />,
          label: "Đã hoàn ký quỹ",
          color: "#94a3b8",
          bg: "rgba(148, 163, 184, 0.1)",
          border: "rgba(148, 163, 184, 0.2)",
          desc: "Ký quỹ đã được hoàn về cho recruiter (sau khi trừ phí nền tảng 10%).",
        };
      case EscrowStatus.DISPUTED:
        return {
          icon: <AlertTriangle size={18} />,
          label: "Đang tranh chấp",
          color: "#fb7185",
          bg: "rgba(251, 113, 133, 0.1)",
          border: "rgba(251, 113, 133, 0.2)",
          desc: "Ký quỹ đang bị giữ do có dispute. Chờ admin giải quyết.",
        };
      default:
        return {
          icon: <DollarSign size={18} />,
          label: status || "Không xác định",
          color: "#94a3b8",
          bg: "rgba(148, 163, 184, 0.1)",
          border: "rgba(148, 163, 184, 0.2)",
          desc: "",
        };
    }
  };

  const statusInfo = getStatusInfo(escrow?.status ?? null);

  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        borderRadius: "16px",
        background: statusInfo.bg,
        border: `1px solid ${statusInfo.border}`,
        marginBottom: "1.25rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      {/* Status Icon */}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: `rgba(${statusInfo.color === "#fb7185" ? "251,113,133" : statusInfo.color === "#4ade80" ? "74,222,128" : statusInfo.color === "#3b82f6" ? "59,130,246" : statusInfo.color === "#8b5cf6" ? "139,92,246" : "148,163,184"}, 0.15)`,
          border: `1px solid ${statusInfo.border}`,
          color: statusInfo.color,
        }}
      >
        {statusInfo.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: "200px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: statusInfo.color,
            }}
          >
            {statusInfo.label}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.5 }}>
          {statusInfo.desc}
        </p>

        {/* Financial Details */}
        {escrow && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              marginTop: "0.75rem",
            }}
          >
            <div style={{ fontSize: "0.78rem" }}>
              <span style={{ color: "#94a3b8" }}>Tổng: </span>
              <strong style={{ color: "#e0f2fe" }}>
                {shortTermJobService.formatBudget(escrow.totalAmount)}
              </strong>
            </div>
            {escrow.escrowBalance > 0 && (
              <div style={{ fontSize: "0.78rem" }}>
                <span style={{ color: "#94a3b8" }}>Còn lại: </span>
                <strong style={{ color: "#fbbf24" }}>
                  {shortTermJobService.formatBudget(escrow.escrowBalance)}
                </strong>
              </div>
            )}
            {escrow.pendingPayoutBalance > 0 && (
              <div style={{ fontSize: "0.78rem" }}>
                <span style={{ color: "#94a3b8" }}>Chờ thanh toán: </span>
                <strong style={{ color: "#8b5cf6" }}>
                  {shortTermJobService.formatBudget(escrow.pendingPayoutBalance)}
                </strong>
              </div>
            )}
            {escrow.platformFee > 0 && (
              <div style={{ fontSize: "0.78rem" }}>
                <span style={{ color: "#94a3b8" }}>Phí: </span>
                <strong style={{ color: "#fb7185" }}>
                  {shortTermJobService.formatBudget(escrow.platformFee)}
                </strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        {/* Recruiter actions */}
        {currentUserRole === "RECRUITER" && !escrow && onFund && (
          <button
            onClick={onFund}
            className="stj-btn stj-btn--primary"
            style={{ fontSize: "0.82rem" }}
          >
            <ShieldCheck size={14} />
            Ký quỹ ngay
          </button>
        )}

        {currentUserRole === "RECRUITER" && escrow?.status === EscrowStatus.FUNDED && onRelease && (
          <button
            onClick={onRelease}
            className="stj-btn stj-btn--approve"
            disabled={isReleasing}
            style={{ fontSize: "0.82rem" }}
          >
            {isReleasing ? <Loader2 size={14} className="stj-spin" /> : <CheckCircle2 size={14} />}
            Giải phóng thanh toán
          </button>
        )}

        {/* Dispute action — available to both */}
        {escrow && onDispute && (
          <button
            onClick={onDispute}
            className="stj-btn stj-btn--danger"
            style={{ fontSize: "0.82rem" }}
          >
            <AlertTriangle size={14} />
            Mở Dispute
          </button>
        )}
      </div>
    </div>
  );
};

export default EscrowStatusBanner;
