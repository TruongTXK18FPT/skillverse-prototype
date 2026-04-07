import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Activity, BarChart2, Target, CheckCircle, Clock, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { RoadmapSessionSummary } from '../../types/Roadmap';
import './AnalystTrack.css';

interface AnalystTrackProps {
  roadmaps: RoadmapSessionSummary[];
}

const ROADMAPS_PER_PAGE = 3;

const AnalystTrack: React.FC<AnalystTrackProps> = ({ roadmaps }) => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate Stats
  const totalRoadmaps = roadmaps.length;
  const totalProgress = roadmaps.reduce((acc, r) => acc + (r.progressPercentage || 0), 0);
  const avgCompletion = totalRoadmaps > 0 ? Math.round(totalProgress / totalRoadmaps) : 0;
  
  const completedRoadmaps = roadmaps.filter(r => (r.progressPercentage || 0) >= 100).length;
  const inProgressRoadmaps = roadmaps.filter(r => r.status === 'ACTIVE').length;

  // Sort by created date (newest first), fallback to sessionId for stability.
  const sortedRoadmaps = useMemo(() => [...roadmaps].sort((a, b) => {
    const aCreatedAt = Date.parse(a.createdAt || '');
    const bCreatedAt = Date.parse(b.createdAt || '');

    if (!Number.isNaN(aCreatedAt) && !Number.isNaN(bCreatedAt) && aCreatedAt !== bCreatedAt) {
      return bCreatedAt - aCreatedAt;
    }

    if (!Number.isNaN(aCreatedAt) && Number.isNaN(bCreatedAt)) {
      return -1;
    }

    if (Number.isNaN(aCreatedAt) && !Number.isNaN(bCreatedAt)) {
      return 1;
    }

    return b.sessionId - a.sessionId;
  }), [roadmaps]);

  useEffect(() => {
    setCurrentPage(1);
  }, [roadmaps.length]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedRoadmaps.length / ROADMAPS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRoadmaps = useMemo(() => {
    const start = (currentPage - 1) * ROADMAPS_PER_PAGE;
    return sortedRoadmaps.slice(start, start + ROADMAPS_PER_PAGE);
  }, [currentPage, sortedRoadmaps]);

  const showingStart =
    sortedRoadmaps.length === 0
      ? 0
      : (currentPage - 1) * ROADMAPS_PER_PAGE + 1;
  const showingEnd =
    sortedRoadmaps.length === 0
      ? 0
      : Math.min(currentPage * ROADMAPS_PER_PAGE, sortedRoadmaps.length);

  const formatCreatedAt = (value?: string) => {
    if (!value) return 'Không rõ ngày tạo';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Không rõ ngày tạo';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const getDifficultyLabel = (difficulty?: string) => {
    const normalized = (difficulty || '').toLowerCase();
    if (normalized === 'beginner') return 'Cơ bản';
    if (normalized === 'intermediate') return 'Trung cấp';
    if (normalized === 'advanced') return 'Nâng cao';
    if (normalized === 'normal') return 'Thường';
    return difficulty || 'Thường';
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="arm-analyst-track-container">
      <div className="arm-analyst-header">
        <div className="arm-header-title">
          <Activity className="arm-header-icon" />
          LỘ TRÌNH ĐANG HỌC
        </div>
        <div className="arm-header-actions">
          <button 
            className={`arm-refresh-btn ${isRefreshing ? 'arm-spin' : ''}`}
            onClick={handleRefresh}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="arm-analyst-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="arm-stat-card">
          <div className="arm-stat-icon-wrapper" style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)' }}>
            <PieChart size={20} />
          </div>
          <div className="arm-stat-content">
            <span className="arm-stat-value">{avgCompletion}%</span>
            <span className="arm-stat-label">HOÀN THÀNH TRUNG BÌNH</span>
          </div>
        </div>

        <div className="arm-stat-card">
          <div className="arm-stat-icon-wrapper" style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)' }}>
            <Target size={20} />
          </div>
          <div className="arm-stat-content">
            <span className="arm-stat-value">{inProgressRoadmaps}</span>
            <span className="arm-stat-label">ĐANG HỌC</span>
          </div>
        </div>

        <div className="arm-stat-card">
          <div className="arm-stat-icon-wrapper" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircle size={20} />
          </div>
          <div className="arm-stat-content">
            <span className="arm-stat-value">{completedRoadmaps}</span>
            <span className="arm-stat-label">HOÀN THÀNH</span>
          </div>
        </div>
      </div>

      <div className="arm-analyst-list-section">
        <div className="arm-list-header">
          <div className="arm-list-title">
            <BarChart2 size={16} />
            DANH SÁCH LỘ TRÌNH
          </div>
          <button 
            className="arm-view-all-btn"
            onClick={() => navigate('/roadmap')}
          >
            XEM TẤT CẢ
          </button>
        </div>

        <div className="arm-list-summary">
          {sortedRoadmaps.length === 0
            ? 'Không có lộ trình nào.'
            : `Hiển thị ${showingStart}-${showingEnd} / ${sortedRoadmaps.length} (sắp xếp theo ngày tạo mới nhất)`}
        </div>
        
        <div className="arm-roadmap-list">
          {paginatedRoadmaps.length > 0 ? (
            paginatedRoadmaps.map((roadmap) => (
              <div 
                key={roadmap.sessionId} 
                className="arm-roadmap-item"
                onClick={() => navigate(`/roadmap/${roadmap.sessionId}`)}
              >
                <div className="arm-item-header">
                  <span className="arm-item-title">{roadmap.title}</span>
                  <span className={`arm-item-badge ${roadmap.difficultyLevel?.toLowerCase() || 'beginner'}`}>
                    {getDifficultyLabel(roadmap.difficultyLevel)}
                  </span>
                </div>
                
                <div className="arm-item-meta">
                  <span className="arm-meta-info">
                    <Clock size={12} /> {roadmap.duration}
                  </span>
                  <span className="arm-meta-info">
                    <Target size={12} /> {roadmap.totalQuests} nhiệm vụ
                  </span>
                  <span className="arm-meta-info">
                    <Calendar size={12} /> {formatCreatedAt(roadmap.createdAt)}
                  </span>
                </div>

                <div className="arm-item-progress-wrapper">
                  <div className="arm-progress-labels">
                    <span>Tiến độ</span>
                    <span>{roadmap.progressPercentage || 0}%</span>
                  </div>
                  <div className="arm-item-progress-bar">
                    <div 
                      className={`arm-item-progress-fill ${
                        (roadmap.progressPercentage || 0) >= 100 ? 'complete' : 
                        (roadmap.progressPercentage || 0) > 50 ? 'good' : 'start'
                      }`}
                      style={{ width: `${roadmap.progressPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="arm-empty-state">
              <AlertCircle size={24} />
              <span>Không có lộ trình phù hợp.</span>
            </div>
          )}
        </div>

        {sortedRoadmaps.length > ROADMAPS_PER_PAGE && (
          <div className="arm-pagination">
            <button
              type="button"
              className="arm-pagination-btn"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Trang trước
            </button>
            <span className="arm-pagination-indicator">Trang {currentPage}/{totalPages}</span>
            <button
              type="button"
              className="arm-pagination-btn"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalystTrack;
