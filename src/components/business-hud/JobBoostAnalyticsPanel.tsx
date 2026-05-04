import React, { useState, useEffect } from "react";
import { Rocket, Eye, MousePointerClick, Users, Activity, Target } from "lucide-react";
import jobBoostService from "../../services/jobBoostService";
import { JobBoostResponse, JobBoostAnalyticsResponse } from "../../data/jobDTOs";
import "./job-boost-analytics.css";

const JobBoostAnalyticsPanel: React.FC = () => {
  const [boosts, setBoosts] = useState<JobBoostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalytics, setSelectedAnalytics] = useState<JobBoostAnalyticsResponse | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    fetchBoosts();
  }, []);

  const fetchBoosts = async () => {
    setLoading(true);
    try {
      const data = await jobBoostService.getMyBoosts();
      setBoosts(data || []);
      
      // Auto-select the most recent active boost if available
      if (data && data.length > 0) {
        const activeBoost = data.find(b => b.status === "ACTIVE") || data[0];
        handleViewAnalytics(activeBoost.id);
      }
    } catch (error) {
      console.error("Failed to fetch boosts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalytics = async (boostId: number) => {
    setLoadingAnalytics(true);
    try {
      const analytics = await jobBoostService.getBoostAnalytics(boostId);
      setSelectedAnalytics(analytics);
    } catch (error) {
      console.error("Failed to fetch analytics for boost", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="rh-boost-panel">
        <div className="rh-boost-loader">
          <div className="rh-boost-spinner" />
          <span>Đang tải dữ liệu Boost...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rh-boost-panel">
      <div className="rh-boost-header">
        <div className="rh-boost-title-wrap">
          <h2 className="rh-boost-title">
            <Rocket size={24} /> Job Boost Analytics
          </h2>
          <p className="rh-boost-subtitle">Theo dõi hiệu suất của các gói đẩy tin tuyển dụng của bạn</p>
        </div>
      </div>

      {selectedAnalytics && (
        <div className="rh-boost-selected-details">
          <h3 className="rh-boost-list-title" style={{ color: "#ffd700", marginBottom: "1rem" }}>
            <Activity size={20} /> Tổng quan chiến dịch: {selectedAnalytics.jobTitle}
          </h3>
          <div className="rh-boost-stats-grid">
            <div className="rh-boost-stat-card">
              <div className="rh-boost-stat-header">
                <Eye size={18} className="rh-boost-stat-icon" /> Lượt truy cập
              </div>
              <div className="rh-boost-stat-value">{selectedAnalytics.impressions.toLocaleString()}</div>
              <div className="rh-boost-stat-label">Tổng số lượt xem hiển thị</div>
            </div>
            
            <div className="rh-boost-stat-card">
              <div className="rh-boost-stat-header">
                <MousePointerClick size={18} className="rh-boost-stat-icon" style={{ color: "#38bdf8" }} /> Lượt Click
              </div>
              <div className="rh-boost-stat-value">{selectedAnalytics.clicks.toLocaleString()}</div>
              <div className="rh-boost-stat-label">Tỷ lệ CTR: {selectedAnalytics.ctr.toFixed(2)}%</div>
            </div>

            <div className="rh-boost-stat-card">
              <div className="rh-boost-stat-header">
                <Users size={18} className="rh-boost-stat-icon" style={{ color: "#34d399" }} /> Ứng tuyển
              </div>
              <div className="rh-boost-stat-value">{selectedAnalytics.applications.toLocaleString()}</div>
              <div className="rh-boost-stat-label">Chuyển đổi: {selectedAnalytics.conversionRate.toFixed(2)}%</div>
            </div>
          </div>
        </div>
      )}

      <div className="rh-boost-list-container">
        <h3 className="rh-boost-list-title">
          <Target size={20} /> Lịch sử gói đẩy tin
        </h3>
        
        {boosts.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "2rem 0" }}>
            Bạn chưa có chiến dịch đẩy tin nào.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="rh-boost-table">
              <thead>
                <tr>
                  <th>Công việc</th>
                  <th>Trạng thái</th>
                  <th>Thời gian bắt đầu</th>
                  <th>Thời gian kết thúc</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {boosts.map((boost) => (
                  <tr key={boost.id} style={{ 
                    background: selectedAnalytics?.boostId === boost.id ? "rgba(255, 215, 0, 0.05)" : "transparent"
                  }}>
                    <td style={{ fontWeight: 500, color: "#fff" }}>{boost.jobTitle}</td>
                    <td>
                      <span className={`rh-boost-status-badge rh-boost-status-badge--${boost.status.toLowerCase()}`}>
                        {boost.status === "ACTIVE" ? "Đang chạy" : 
                         boost.status === "EXPIRED" ? "Đã hết hạn" : boost.status}
                      </span>
                    </td>
                    <td>{formatDate(boost.startDate)}</td>
                    <td>{formatDate(boost.endDate)}</td>
                    <td>
                      <button 
                        className="rh-boost-view-btn"
                        onClick={() => handleViewAnalytics(boost.id)}
                        disabled={loadingAnalytics}
                      >
                        {selectedAnalytics?.boostId === boost.id ? "Đang xem" : "Xem thống kê"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobBoostAnalyticsPanel;
