import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Star, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import shortTermJobService from "../../services/shortTermJobService";
import { useToast } from "../../hooks/useToast";
import TrustScoreDisplay from "../../components/short-term-job/TrustScoreDisplay";
import "../business-hud/short-term-fleet.css";
import "../../components/business-hud/short-term-fleet.css";

const TrustScorePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { showError } = useToast();

  const [score, setScore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadScore();
    }
  }, [userId]);

  const loadScore = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const s = await shortTermJobService.getTrustScore(parseInt(userId));
      setScore(s);
    } catch (err: any) {
      showError("Lỗi", err.message || "Không thể tải trust score.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="stj-fullpage stj-fullpage--loading">
        <Loader2 size={32} className="stj-spin" />
        <p>Đang tải trust score...</p>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="stj-fullpage">
        <div className="stj-handover-empty">
          <XCircle size={32} />
          <div>
            <strong>Không tìm thấy trust score</strong>
            <p>Người dùng này chưa có trust score hoặc bạn không có quyền truy cập.</p>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (val: number) => {
    if (val >= 85) return "#fbbf24";
    if (val >= 70) return "#10b981";
    if (val >= 50) return "#3b82f6";
    return "#94a3b8";
  };

  return (
    <div className="stj-fullpage">
      {/* Header */}
      <header className="stj-fullpage__header">
        <div className="stj-fullpage__header-left">
          <button className="stj-fullpage__back" onClick={() => navigate(-1)} title="Quay lại">
            <ArrowLeft size={18} />
          </button>
          <div className="stj-fullpage__job-info">
            <strong>Trust Score</strong>
            <TrustScoreDisplay userId={parseInt(userId || "0")} score={score} showScore size="medium" />
          </div>
        </div>
      </header>

      <div className="stj-fullpage__overview">
        {/* Score Overview */}
        <div className="stj-fullpage__detail-card">
          <h3>Điểm tin cậy</h3>
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
                background: `radial-gradient(circle, ${getScoreColor(score.score)}22, transparent)`,
                border: `3px solid ${getScoreColor(score.score)}44`,
                boxShadow: `0 0 40px ${getScoreColor(score.score)}22`,
              }}
            >
              <span
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  color: getScoreColor(score.score),
                  lineHeight: 1,
                }}
              >
                {Math.round(score.score)}
              </span>
              <span style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.25rem" }}>/100</span>
            </div>
            <TrustScoreDisplay userId={score.userId} score={score} showScore size="large" />
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.82rem", color: "#64748b" }}>
              Cập nhật: {new Date(score.calculatedAt).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stj-fullpage__overview-grid">
          <div className="stj-fullpage__detail-card">
            <h3>Hoạt động</h3>
            <div className="stj-fullpage__info-list">
              <div className="stj-fullpage__info-row">
                <span>Tổng công việc</span>
                <strong>{score.totalJobs}</strong>
              </div>
              <div className="stj-fullpage__info-row">
                <span>Đã hoàn thành</span>
                <strong style={{ color: "#4ade80" }}>{score.totalCompleted}</strong>
              </div>
              <div className="stj-fullpage__info-row">
                <span>Tỷ lệ hoàn thành</span>
                <strong>{score.completionRate}%</strong>
              </div>
              <div className="stj-fullpage__info-row">
                <span>Dispute</span>
                <strong style={{ color: score.totalDisputes > 0 ? "#fb7185" : "#4ade80" }}>
                  {score.totalDisputes}
                </strong>
              </div>
              <div className="stj-fullpage__info-row">
                <span>Hủy công việc</span>
                <strong style={{ color: score.totalCancellations > 0 ? "#fb7185" : "#94a3b8" }}>
                  {score.totalCancellations}
                </strong>
              </div>
            </div>
          </div>

          <div className="stj-fullpage__detail-card">
            <h3>Chất lượng</h3>
            <div className="stj-fullpage__info-list">
              <div className="stj-fullpage__info-row">
                <span>Đánh giá TB</span>
                <strong style={{ color: "#fbbf24" }}>
                  {score.avgRating ? `${score.avgRating.toFixed(1)}/5` : "Chưa có"}
                </strong>
              </div>
              <div className="stj-fullpage__info-row">
                <span>Tỷ lệ dispute</span>
                <strong style={{ color: score.disputeRate > 10 ? "#fb7185" : "#94a3b8" }}>
                  {score.disputeRate}%
                </strong>
              </div>
              <div className="stj-fullpage__info-row">
                <span>TB phản hồi</span>
                <strong>
                  {score.avgResponseTimeHours
                    ? `${Math.round(score.avgResponseTimeHours)} giờ`
                    : "N/A"}
                </strong>
              </div>
              <div className="stj-fullpage__info-row">
                <span>Tuổi tài khoản</span>
                <strong>{score.accountAgeDays} ngày</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="stj-fullpage__detail-card">
          <h3>Chi tiết điểm</h3>
          <div style={{ marginTop: "0.75rem" }}>
            {[
              { label: "Tỷ lệ hoàn thành (30%)", value: Math.min(100, score.completionRate), color: "#4ade80" },
              { label: "Đánh giá trung bình (25%)", value: score.avgRating ? score.avgRating * 20 : 0, color: "#fbbf24" },
              { label: "Tỷ lệ dispute (20%)", value: Math.max(0, 100 - score.disputeRate * 5), color: "#fb7185" },
              { label: "Thời gian phản hồi (15%)", value: Math.max(0, 100 - score.avgResponseTimeHours * 2), color: "#3b82f6" },
              { label: "Tuổi tài khoản (10%)", value: Math.min(100, score.accountAgeDays), color: "#8b5cf6" },
            ].map((item, idx) => (
              <div key={idx} style={{ marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>{item.label}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e0f2fe" }}>
                    {Math.round(item.value)}%
                  </span>
                </div>
                <div
                  style={{
                    height: "6px",
                    borderRadius: "3px",
                    background: "rgba(148, 163, 184, 0.1)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${item.value}%`,
                      height: "100%",
                      borderRadius: "3px",
                      background: item.color,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustScorePage;
