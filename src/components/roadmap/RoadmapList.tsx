import { memo } from 'react';
import { BookOpen, Clock, Target, ChevronRight, PlayCircle, PauseCircle, Trash2, Skull, RotateCcw } from 'lucide-react';
import { RoadmapSessionSummary } from '../../types/Roadmap';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
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
  onActivateRoadmap?: (sessionId: number) => void;
  onPauseRoadmap?: (sessionId: number) => void;
  onDeleteRoadmap?: (sessionId: number) => void;
  onPermanentDeleteRoadmap?: (sessionId: number) => void;
  onRestoreRoadmap?: (sessionId: number) => void;
  actionLoadingId?: number | null;
  disableCardSelection?: boolean;
  hideEmptyCreateButton?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Total count of non-deleted roadmaps (active + paused) for disable logic */
  totalRoadmapCount?: number;
  /** Called before navigation; return false to block navigation (e.g., PAUSED roadmap) */
  onNavigateRoadmap?: (sessionId: number, status: RoadmapLifecycleStatus) => boolean;
}

type RoadmapLifecycleStatus = 'ACTIVE' | 'PAUSED' | 'DELETED';

const normalizeRoadmapStatus = (status?: string): RoadmapLifecycleStatus => {
  const normalized = (status || 'ACTIVE').trim().toUpperCase();
  if (normalized === 'PAUSED' || normalized === 'DELETED') {
    return normalized;
  }
  return 'ACTIVE';
};

const ROADMAP_STATUS_LABEL: Record<RoadmapLifecycleStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  PAUSED: 'Đang tạm dừng',
  DELETED: 'Đã xóa',
};

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
  onCreateRoadmap,
  onActivateRoadmap,
  onPauseRoadmap,
  onDeleteRoadmap,
  onPermanentDeleteRoadmap,
  onRestoreRoadmap,
  actionLoadingId = null,
  disableCardSelection = false,
  hideEmptyCreateButton = false,
  emptyTitle,
  emptyDescription,
  totalRoadmapCount,
  onNavigateRoadmap,
}: RoadmapListProps) => {

  // Memoized roadmap card component
  const RoadmapCard = memo(({ roadmap }: { roadmap: RoadmapSessionSummary }) => {
    const isOnlyRoadmap = (totalRoadmapCount ?? 0) <= 1;
    const status = normalizeRoadmapStatus(roadmap.status);

    // Pause is disabled when: this is the only roadmap (active or paused) AND it's ACTIVE
    // i.e., pausing would leave 0 active roadmaps
    const shouldDisablePause = isOnlyRoadmap && status === 'ACTIVE';

    const isActionBusy = actionLoadingId === roadmap.sessionId;
    const isSelectable = !disableCardSelection;

    const handleSelect = () => {
      if (!isSelectable) {
        return;
      }
      if (onNavigateRoadmap && !onNavigateRoadmap(roadmap.sessionId, status)) {
        return;
      }
      onSelectRoadmap(roadmap.sessionId);
    };

    return (
      <article
        className={`roadmap-hud-card ${displayMode === 'list' ? 'list-view' : ''} ${status === 'DELETED' ? 'roadmap-hud-card--deleted' : ''} ${isSelectable ? '' : 'roadmap-hud-card--readonly'}`}
        role={isSelectable ? 'button' : undefined}
        tabIndex={isSelectable ? 0 : -1}
        onClick={handleSelect}
        onKeyDown={(e) => {
          if (!isSelectable) {
            return;
          }
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect();
          }
        }}
        aria-label={isSelectable ? `Mở roadmap ${roadmap.title}` : undefined}
        aria-disabled={!isSelectable}
      >
        <div className="roadmap-hud-card-glow" />

        <div className="roadmap-hud-card-header">
          <div className="roadmap-hud-card-title-group">
            <h3 className="roadmap-hud-card-title">{roadmap.title}</h3>
            <div className="roadmap-hud-card-badges">
              <span className={`roadmap-hud-badge ${roadmap.experienceLevel.toLowerCase()}`}>
                {roadmap.experienceLevel}
              </span>
              <span className={`roadmap-hud-status-badge roadmap-hud-status-badge--${status.toLowerCase()}`}>
                {ROADMAP_STATUS_LABEL[status]}
              </span>
            </div>
          </div>
          {isSelectable && <ChevronRight className="roadmap-hud-card-arrow" size={20} />}
        </div>

        <div className="roadmap-hud-card-body">
          <div className="roadmap-hud-card-goal">
            <Target size={14} className="text-cyan-400" />
            <span className="truncate">{roadmap.originalGoal}</span>
          </div>

          <div className="roadmap-hud-card-stats">
            <div className="roadmap-hud-stat">
              <BookOpen size={14} />
              <span>{roadmap.totalQuests} Mục tiêu</span>
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
                style={{ width: `${Math.min(100, roadmap.progressPercentage ?? 0)}%` }}
              />
            </div>
            <div className="roadmap-hud-progress-text">
              <span>TIẾN ĐỘ SỨ MỆNH</span>
              <span>{(roadmap.progressPercentage ?? 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="roadmap-hud-card-footer">
          <span className="roadmap-hud-date">
            KHỞI TẠO: {new Date(roadmap.createdAt).toLocaleDateString('vi-VN')}
          </span>
          <div className="roadmap-hud-card-actions">
            {status === 'PAUSED' && onActivateRoadmap && (
              <button
                className="roadmap-hud-action-btn roadmap-hud-action-btn--activate"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onActivateRoadmap(roadmap.sessionId);
                }}
                disabled={isActionBusy}
              >
                <PlayCircle size={14} />
                Kích hoạt
              </button>
            )}

            {status === 'ACTIVE' && onPauseRoadmap && (
              <button
                className="roadmap-hud-action-btn roadmap-hud-action-btn--pause"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPauseRoadmap(roadmap.sessionId);
                }}
                disabled={isOnlyRoadmap || isActionBusy}
                title={isOnlyRoadmap ? 'Không thể tạm dừng roadmap cuối cùng' : undefined}
              >
                <PauseCircle size={14} />
                Tạm dừng
              </button>
            )}

            {status !== 'DELETED' && onDeleteRoadmap && (
              <button
                className="roadmap-hud-action-btn roadmap-hud-action-btn--delete"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRoadmap(roadmap.sessionId);
                }}
                disabled={isActionBusy}
              >
                <Trash2 size={14} />
                Xóa
              </button>
            )}

            {status === 'DELETED' && onRestoreRoadmap && (
              <button
                className="roadmap-hud-action-btn roadmap-hud-action-btn--restore"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestoreRoadmap(roadmap.sessionId);
                }}
                disabled={isActionBusy}
              >
                <RotateCcw size={14} />
                Khôi phục
              </button>
            )}

            {status === 'DELETED' && onPermanentDeleteRoadmap && (
              <button
                className="roadmap-hud-action-btn roadmap-hud-action-btn--permanent"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPermanentDeleteRoadmap(roadmap.sessionId);
                }}
                disabled={isActionBusy}
              >
                <Skull size={14} />
                Xóa vĩnh viễn
              </button>
            )}
          </div>
        </div>
      </article>
    );
  });

  RoadmapCard.displayName = 'RoadmapCard';

  // Loading state
  if (isLoading) {
    return (
      <div className="roadmap-list__loading">
        <MeowlKuruLoader text="ĐANG TẢI DỮ LIỆU..." />
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
            <h3>{emptyTitle || 'Chưa có lộ trình nào'}</h3>
            <p>{emptyDescription || 'Tạo lộ trình học đầu tiên bằng AI để bắt đầu nhé!'}</p>
            {onCreateRoadmap && !hideEmptyCreateButton && (
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
