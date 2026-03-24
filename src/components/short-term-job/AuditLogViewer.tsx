import React, { useState, useEffect } from "react";
import { Loader2, Clock, ArrowRight, DollarSign, AlertTriangle } from "lucide-react";
import shortTermJobService from "../../services/shortTermJobService";
import { JobStatusAuditLog } from "../../types/ShortTermJob";
import "../business-hud/short-term-fleet.css";

interface AuditLogViewerProps {
  jobId: number;
  auditLogs?: JobStatusAuditLog[];
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ jobId, auditLogs: propLogs }) => {
  const [logs, setLogs] = useState<JobStatusAuditLog[]>(propLogs || []);
  const [isLoading, setIsLoading] = useState(!propLogs);

  useEffect(() => {
    if (!propLogs) {
      // Try to fetch from service when backend supports it
      setIsLoading(false);
    }
  }, [jobId]);

  // Merge escrow/dispute events if passed via prop
  const allLogs = [...logs];

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="stj-loading" style={{ padding: "2rem" }}>
        <Loader2 size={20} className="stj-spin" />
        <span>Đang tải audit log...</span>
      </div>
    );
  }

  if (allLogs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#94a3b8" }}>
        <Clock size={32} style={{ margin: "0 auto 0.75rem", display: "block", opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: "0.88rem" }}>
          Chưa có lịch sử hoạt động nào.
        </p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", opacity: 0.6 }}>
          Các thay đổi trạng thái và giao dịch tài chính sẽ được ghi lại tại đây.
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Vertical timeline line */}
      <div
        style={{
          position: "absolute",
          left: "17px",
          top: "24px",
          bottom: "24px",
          width: "2px",
          background: "linear-gradient(to bottom, rgba(34, 211, 238, 0.3), rgba(34, 211, 238, 0.05))",
          borderRadius: "1px",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {allLogs.map((log, idx) => {
          const isFinancial =
            log.action?.includes("escrow") ||
            log.action?.includes("FEE") ||
            log.action?.includes("REFUND") ||
            log.action?.includes("RELEASE");
          const isDispute = log.action?.includes("dispute") || log.action?.includes("DISPUTE");

          return (
            <div
              key={log.id || idx}
              style={{
                display: "flex",
                gap: "0.85rem",
                padding: "0.6rem 0",
                position: "relative",
              }}
            >
              {/* Timeline dot */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  zIndex: 1,
                  background: isFinancial
                    ? "rgba(251, 191, 36, 0.15)"
                    : isDispute
                    ? "rgba(251, 113, 133, 0.15)"
                    : "rgba(34, 211, 238, 0.15)",
                  border: isFinancial
                    ? "2px solid rgba(251, 191, 36, 0.3)"
                    : isDispute
                    ? "2px solid rgba(251, 113, 133, 0.3)"
                    : "2px solid rgba(34, 211, 238, 0.3)",
                  color: isFinancial
                    ? "#fbbf24"
                    : isDispute
                    ? "#fb7185"
                    : "#22d3ee",
                }}
              >
                {isFinancial ? (
                  <DollarSign size={16} />
                ) : isDispute ? (
                  <AlertTriangle size={16} />
                ) : (
                  <ArrowRight size={14} />
                )}
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  padding: "0.5rem 0.75rem",
                  borderRadius: "10px",
                  background: "rgba(8, 15, 30, 0.45)",
                  border: "1px solid rgba(148, 163, 184, 0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    marginBottom: "0.2rem",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e0f2fe" }}>
                    {log.action || "Cập nhật trạng thái"}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", flexShrink: 0 }}>
                    {formatTime(log.createdAt)}
                  </span>
                </div>

                <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                  <span style={{ fontWeight: 500 }}>{log.changedByRole || log.actorName || "Hệ thống"}</span>
                  {log.oldStatus && log.newStatus && (
                    <>
                      {" · "}
                      <span
                        style={{
                          color: "#64748b",
                        }}
                      >
                        {log.previousStatus || log.oldStatus}
                      </span>
                      <ArrowRight size={10} style={{ display: "inline", margin: "0 0.25rem" }} />
                      <span
                        style={{
                          color: "#e0f2fe",
                          fontWeight: 500,
                        }}
                      >
                        {log.newStatus}
                      </span>
                    </>
                  )}
                </div>

                {log.reason && (
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      fontSize: "0.78rem",
                      color: "#64748b",
                      lineHeight: 1.4,
                    }}
                  >
                    {log.reason}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditLogViewer;
