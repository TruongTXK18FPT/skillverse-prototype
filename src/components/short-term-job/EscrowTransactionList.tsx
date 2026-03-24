import React, { useState, useEffect } from "react";
import { Loader2, ArrowDownCircle, ArrowUpCircle, MinusCircle, Clock } from "lucide-react";
import shortTermJobService from "../../services/shortTermJobService";
import { EscrowTransaction } from "../../types/ShortTermJob";
import "../business-hud/short-term-fleet.css";

interface EscrowTransactionListProps {
  jobId: number;
  transactions?: EscrowTransaction[];
}

const EscrowTransactionList: React.FC<EscrowTransactionListProps> = ({
  jobId,
  transactions: propTransactions,
}) => {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>(propTransactions || []);
  const [isLoading, setIsLoading] = useState(!propTransactions);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!propTransactions) {
      loadTransactions();
    }
  }, [jobId]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const result = await shortTermJobService.getEscrowTransactions(jobId, page, 20);
      if (page === 0) {
        setTransactions(result.content);
      } else {
        setTransactions((prev) => [...prev, ...result.content]);
      }
      setHasMore(result.totalPages > page + 1);
    } catch {
      // silent fail — component shows empty state
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    setPage((p) => p + 1);
    loadTransactions();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "FUND":
        return <ArrowDownCircle size={16} style={{ color: "#3b82f6" }} />;
      case "RELEASE":
      case "PAYOUT_RELEASE":
        return <ArrowUpCircle size={16} style={{ color: "#4ade80" }} />;
      case "PARTIAL_RELEASE":
        return <ArrowUpCircle size={16} style={{ color: "#8b5cf6" }} />;
      case "REFUND":
        return <ArrowUpCircle size={16} style={{ color: "#fbbf24" }} />;
      case "FEE_DEDUCTION":
        return <MinusCircle size={16} style={{ color: "#fb7185" }} />;
      default:
        return <Clock size={16} style={{ color: "#94a3b8" }} />;
    }
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      FUND: "Ký quỹ",
      RELEASE: "Giải phóng",
      PARTIAL_RELEASE: "Giải phóng một phần",
      REFUND: "Hoàn ký quỹ",
      FEE_DEDUCTION: "Phí nền tảng",
      PAYOUT_RELEASE: "Thanh toán worker",
    };
    return labels[type] || type;
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "FUND":
        return "#3b82f6";
      case "RELEASE":
      case "PAYOUT_RELEASE":
        return "#4ade80";
      case "PARTIAL_RELEASE":
        return "#8b5cf6";
      case "REFUND":
        return "#fbbf24";
      case "FEE_DEDUCTION":
        return "#fb7185";
      default:
        return "#94a3b8";
    }
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleString("vi-VN");
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="stj-loading">
        <Loader2 size={20} className="stj-spin" />
        <span>Đang tải lịch sử giao dịch...</span>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#94a3b8" }}>
        <Clock size={32} style={{ margin: "0 auto 0.75rem", display: "block", opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: "0.88rem" }}>Chưa có giao dịch ký quỹ nào.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {transactions.map((tx) => (
          <div
            key={tx.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              background: "rgba(8, 15, 30, 0.45)",
              border: "1px solid rgba(148, 163, 184, 0.08)",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: `rgba(${getTransactionColor(tx.transactionType) === "#3b82f6" ? "59,130,246" : getTransactionColor(tx.transactionType) === "#4ade80" ? "74,222,128" : getTransactionColor(tx.transactionType) === "#8b5cf6" ? "139,92,246" : getTransactionColor(tx.transactionType) === "#fbbf24" ? "251,191,36" : getTransactionColor(tx.transactionType) === "#fb7185" ? "251,113,133" : "148,163,184"}, 0.12)`,
              }}
            >
              {getTransactionIcon(tx.transactionType)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e0f2fe" }}>
                  {getTransactionLabel(tx.transactionType)}
                </span>
                <strong style={{ fontSize: "0.85rem", color: getTransactionColor(tx.transactionType), flexShrink: 0 }}>
                  {tx.transactionType === "FEE_DEDUCTION" ? "-" : "+"}{shortTermJobService.formatBudget(tx.netAmount || tx.amount)}
                </strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  {tx.actorName || "Hệ thống"}
                </span>
                {tx.reason && (
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    · {tx.reason.length > 40 ? tx.reason.substring(0, 40) + "..." : tx.reason}
                  </span>
                )}
              </div>
            </div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", flexShrink: 0 }}>
              {formatTime(tx.createdAt)}
            </span>
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
          <button
            className="stj-btn stj-btn--ghost"
            onClick={loadMore}
            disabled={isLoading}
            style={{ fontSize: "0.82rem" }}
          >
            {isLoading ? <Loader2 size={14} className="stj-spin" /> : null}
            Xem thêm
          </button>
        </div>
      )}
    </div>
  );
};

export default EscrowTransactionList;
