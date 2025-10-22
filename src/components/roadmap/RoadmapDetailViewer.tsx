import { memo, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { RoadmapResponse, QuestProgress, ProgressStatus } from '../../types/Roadmap';
import RoadmapFlow from '../ai-roadmap/RoadmapFlow';
import aiRoadmapService from '../../services/aiRoadmapService';
import { useToast } from '../../hooks/useToast';
import './RoadmapDetailViewer.css';

interface RoadmapDetailViewerProps {
  roadmap: RoadmapResponse;
  progressMap: Map<string, QuestProgress>;
  onBack: () => void;
  onQuestComplete: (questId: string, completed: boolean) => void;
}

/**
 * Optimized component for viewing roadmap details
 * Separated from main roadmap page to improve performance
 */
const RoadmapDetailViewer = memo(({ 
  roadmap, 
  progressMap, 
  onBack, 
  onQuestComplete 
}: RoadmapDetailViewerProps) => {
  const { showSuccess, showError } = useToast();

  // Memoized quest completion handler to prevent unnecessary re-renders
  const handleQuestComplete = useCallback(async (questId: string, completed: boolean) => {
    try {
      // Update backend first
      const response = await aiRoadmapService.updateQuestProgress(
        roadmap.sessionId, 
        questId, 
        completed
      );

      // Call parent handler
      onQuestComplete(questId, completed);

      // Show progress stats
      const { completedQuests, totalQuests, completionPercentage } = response.stats;
      if (completed) {
        showSuccess(
          'Quest Completed! 🎉', 
          `${completedQuests}/${totalQuests} quests done (${completionPercentage.toFixed(1)}%)`
        );
      } else {
        showSuccess(
          'Quest Unchecked', 
          `${completedQuests}/${totalQuests} quests done (${completionPercentage.toFixed(1)}%)`
        );
      }
    } catch (error) {
      showError('Error', (error as Error).message);
    }
  }, [roadmap.sessionId, onQuestComplete, showSuccess, showError]);

  // Memoized metadata section to prevent re-renders
  const metadataSection = useMemo(() => (
    <div className="roadmap-page__viewer-info">
      <div className="roadmap-viewer__header">
        <h2 className="roadmap-viewer__title">{roadmap.metadata.title}</h2>
        {roadmap.metadata.difficultyLevel && (
          <span className={`roadmap-viewer__badge roadmap-viewer__badge--${roadmap.metadata.difficultyLevel}`}>
            {roadmap.metadata.difficultyLevel}
          </span>
        )}
      </div>
      
      <div className="roadmap-viewer__meta">
        <div className="roadmap-viewer__meta-grid">
          <div className="roadmap-viewer__meta-item">
            <span className="roadmap-viewer__meta-label">🎯 Mục tiêu học tập:</span>
            <span className="roadmap-viewer__meta-value">{roadmap.metadata.originalGoal}</span>
          </div>
          
          {roadmap.metadata.validatedGoal && (
            <div className="roadmap-viewer__meta-item">
              <span className="roadmap-viewer__meta-label">✅ Mục tiêu đã xác nhận:</span>
              <span className="roadmap-viewer__meta-value">{roadmap.metadata.validatedGoal}</span>
            </div>
          )}
          
          <div className="roadmap-viewer__meta-item">
            <span className="roadmap-viewer__meta-label">⏱️ Thời lượng:</span>
            <span className="roadmap-viewer__meta-value">{roadmap.metadata.duration}</span>
          </div>
          
          <div className="roadmap-viewer__meta-item">
            <span className="roadmap-viewer__meta-label">📊 Cấp độ kinh nghiệm:</span>
            <span className="roadmap-viewer__meta-value">{roadmap.metadata.experienceLevel}</span>
          </div>
          
          <div className="roadmap-viewer__meta-item">
            <span className="roadmap-viewer__meta-label">📚 Phong cách học:</span>
            <span className="roadmap-viewer__meta-value">{roadmap.metadata.learningStyle}</span>
          </div>
        </div>
      </div>

      {roadmap.metadata.validationNotes && 
       roadmap.metadata.validationNotes !== 'null' && 
       roadmap.metadata.validationNotes !== 'undefined' && (
        <div className="roadmap-viewer__warnings">
          <h4>📋 Ghi chú xác thực:</h4>
          <ul>
            {Array.isArray(roadmap.metadata.validationNotes) 
              ? roadmap.metadata.validationNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))
              : <li>{roadmap.metadata.validationNotes}</li>
            }
          </ul>
        </div>
      )}

      {roadmap.statistics && (
        <div className="roadmap-viewer__stats">
          <div className="stat-item">
            <span className="stat-label">Tổng số bước:</span>
            <span className="stat-value">{roadmap.statistics.totalNodes}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Thời gian ước tính:</span>
            <span className="stat-value">{roadmap.statistics.totalEstimatedHours.toFixed(1)}h</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Nhiệm vụ chính:</span>
            <span className="stat-value">{roadmap.statistics.mainNodes}</span>
          </div>
          {roadmap.statistics.sideNodes > 0 && (
            <div className="stat-item">
              <span className="stat-label">Nhiệm vụ phụ:</span>
              <span className="stat-value">{roadmap.statistics.sideNodes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  ), [roadmap.metadata, roadmap.statistics]);


  return (
    <div className="roadmap-detail-viewer">
      {/* Header with back button */}
      <div className="roadmap-detail-viewer__header">
        <button onClick={onBack} className="roadmap-detail-viewer__back-btn">
          <ArrowLeft className="h-5 w-5" />
          Quay lại Lộ trình
        </button>
        
        <div className="roadmap-detail-viewer__title-section">
          <h1 className="roadmap-detail-viewer__title">
            {roadmap.metadata.title}
          </h1>
          <p className="roadmap-detail-viewer__subtitle">
            {roadmap.metadata.duration} • Cấp độ {roadmap.metadata.experienceLevel}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="roadmap-detail-viewer__content">
        {/* Viewer Info Section - Moved to top */}
        {metadataSection}
        
        {/* Roadmap Flow - Full width below info */}
        <div className="roadmap-detail-viewer__flow">
          <RoadmapFlow
            roadmap={roadmap.roadmap}
            progressMap={progressMap}
            onQuestComplete={handleQuestComplete}
          />
        </div>
      </div>
    </div>
  );
});

RoadmapDetailViewer.displayName = 'RoadmapDetailViewer';

export default RoadmapDetailViewer;
