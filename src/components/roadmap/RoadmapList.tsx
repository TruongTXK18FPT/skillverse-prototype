import { memo, useMemo, useCallback } from 'react';
import { BookOpen, Clock, Target, ChevronRight } from 'lucide-react';
import { RoadmapSessionSummary } from '../../types/Roadmap';
import './RoadmapList.css';
import '../../styles/RoadmapHUD.css';

interface RoadmapListProps {
  roadmaps: RoadmapSessionSummary[];
  displayMode: 'grid' | 'list';
  onSelectRoadmap: (sessionId: number) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  onLoginRedirect: () => void;
  onCreateRoadmap?: () => void;
}

/**
 * Optimized roadmap list component with virtualization support
 * Memoized to prevent unnecessary re-renders
 */
const RoadmapList = memo(({ 
  roadmaps, 
  displayMode, 
  onSelectRoadmap, 
  isLoading, 
  isAuthenticated, 
  onLoginRedirect,
  onCreateRoadmap
}: RoadmapListProps) => {
  
  // Memoized roadmap card component
  const RoadmapCard = memo(({ roadmap }: { roadmap: RoadmapSessionSummary }) => (
    <button
      className={`roadmap-hud-card ${displayMode === 'list' ? 'list-view' : ''}`}
      type="button"
      onClick={() => onSelectRoadmap(roadmap.sessionId)}
      onKeyDown={(e) => { 
        if (e.key === 'Enter' || e.key === ' ') { 
          e.preventDefault(); 
          onSelectRoadmap(roadmap.sessionId); 
        } 
      }}
    >
      <div className="roadmap-hud-card-glow" />
      
      <div className="roadmap-hud-card-header">
        <div className="roadmap-hud-card-title-group">
          <h3 className="roadmap-hud-card-title">{roadmap.title}</h3>
          <span className={`roadmap-hud-badge ${roadmap.experienceLevel.toLowerCase()}`}>
            {roadmap.experienceLevel}
          </span>
        </div>
        <ChevronRight className="roadmap-hud-card-arrow" size={20} />
      </div>
      
      <div className="roadmap-hud-card-body">
        <div className="roadmap-hud-card-goal">
          <Target size={14} className="text-cyan-400" />
          <span className="truncate">{roadmap.originalGoal}</span>
        </div>
        
        <div className="roadmap-hud-card-stats">
          <div className="roadmap-hud-stat">
            <BookOpen size={14} />
            <span>{roadmap.totalQuests} Nhiệm vụ</span>
          </div>
          <div className="roadmap-hud-stat">
            <Clock size={14} />
            <span>{roadmap.duration}</span>
          </div>
        </div>

        <div className="roadmap-hud-progress-container">
          <div className="roadmap-hud-progress-bar">
            <div
              className="roadmap-hud-progress-fill"
              style={{ width: `${roadmap.progressPercentage}%` }}
            />
          </div>
          <div className="roadmap-hud-progress-text">
            <span>TIẾN ĐỘ SỨ MỆNH</span>
            <span>{roadmap.progressPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="roadmap-hud-card-footer">
        <span className="roadmap-hud-date">
          KHỞI TẠO: {new Date(roadmap.createdAt).toLocaleDateString('vi-VN')}
        </span>
      </div>
    </button>
  ));

  RoadmapCard.displayName = 'RoadmapCard';

  // Loading state
  if (isLoading) {
    return (
      <div className="roadmap-list__loading">
        <div className="roadmap-list__spinner" />
        <p>ĐANG TẢI DỮ LIỆU...</p>
      </div>
    );
  }

  // Empty state
  if (roadmaps.length === 0) {
    return (
      <div className="roadmap-list__empty">
        <div className="roadmap-empty__icon">
          <BookOpen className="h-12 w-12" />
        </div>
        {!isAuthenticated ? (
          <>
            <h3>Vui lòng đăng nhập</h3>
            <p>Đăng nhập để tạo và quản lý lộ trình học của bạn!</p>
            <button 
              onClick={onLoginRedirect}
              className="roadmap-empty__create-btn"
              style={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              Đăng nhập ngay
            </button>
          </>
        ) : (
          <>
            <h3>Chưa có lộ trình nào</h3>
            <p>Tạo lộ trình học đầu tiên bằng AI để bắt đầu nhé!</p>
            {onCreateRoadmap && (
              <button 
                onClick={onCreateRoadmap}
                className="roadmap-empty__create-btn"
              >
                Tạo lộ trình đầu tiên
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // Main content with optimized grid
  return (
    <div className={`roadmap-list ${displayMode === 'list' ? 'roadmap-list--list' : 'roadmap-list--grid'}`}>
      {roadmaps.map((roadmap) => (
        <RoadmapCard key={roadmap.sessionId} roadmap={roadmap} />
      ))}
    </div>
  );
});

RoadmapList.displayName = 'RoadmapList';

export default RoadmapList;
