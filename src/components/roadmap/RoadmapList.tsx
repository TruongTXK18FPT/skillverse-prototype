import { memo, useMemo, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import { RoadmapSessionSummary } from '../../types/Roadmap';
import RoadmapCard from './RoadmapCard';
import './RoadmapList.css';

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
      className={`sv-roadmap-card ${displayMode === 'list' ? 'sv-roadmap-card--list' : ''}`}
      type="button"
      onClick={() => onSelectRoadmap(roadmap.sessionId)}
      onKeyDown={(e) => { 
        if (e.key === 'Enter' || e.key === ' ') { 
          e.preventDefault(); 
          onSelectRoadmap(roadmap.sessionId); 
        } 
      }}
    >
      <div className="sv-roadmap-card__header">
        <h3 className="sv-roadmap-card__title">{roadmap.title}</h3>
        <span className="sv-roadmap-card__badge">{roadmap.experienceLevel}</span>
      </div>
      
      <p className="sv-roadmap-card__goal">{roadmap.originalGoal}</p>
      
      <div className="sv-roadmap-card__stats">
        <div className="sv-roadmap-card__stat">
          <BookOpen size={16} />
          <span>{roadmap.totalQuests} Nhiệm vụ</span>
        </div>
        <div className="sv-roadmap-card__stat">
          <span>{roadmap.duration}</span>
        </div>
      </div>

      <div className="sv-roadmap-card__progress">
        <div className="sv-roadmap-card__progress-bar">
          <div
            className="sv-roadmap-card__progress-fill"
            style={{ width: `${roadmap.progressPercentage}%` }}
          />
        </div>
        <span className="sv-roadmap-card__progress-text">
          {roadmap.completedQuests} / {roadmap.totalQuests} đã xong ({roadmap.progressPercentage}%)
        </span>
      </div>

      <div className="sv-roadmap-card__date">
        Tạo ngày {new Date(roadmap.createdAt).toLocaleDateString('vi-VN')}
      </div>
    </button>
  ));

  RoadmapCard.displayName = 'RoadmapCard';

  // Loading state
  if (isLoading) {
    return (
      <div className="roadmap-list__loading">
        <div className="roadmap-list__spinner" />
        <p>Đang tải lộ trình của bạn...</p>
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
