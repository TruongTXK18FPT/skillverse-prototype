import { memo, useCallback, useMemo } from 'react';
import { ArrowLeft, Clock, Target, Zap, Layers, Trophy, Hash } from 'lucide-react';
import { RoadmapResponse, QuestProgress } from '../../types/Roadmap';
import RoadmapFlow from '../ai-roadmap/RoadmapFlow';
import aiRoadmapService from '../../services/aiRoadmapService';
import { useToast } from '../../hooks/useToast';
import './RoadmapDetailViewer.css';
import '../../styles/RoadmapHUD.css';

interface RoadmapDetailViewerProps {
  roadmap: RoadmapResponse;
  progressMap: Map<string, QuestProgress>;
  onBack: () => void;
  onQuestComplete: (questId: string, completed: boolean) => void;
}

const RoadmapDetailViewer = memo(({ 
  roadmap, 
  progressMap, 
  onBack, 
  onQuestComplete 
}: RoadmapDetailViewerProps) => {
  const { showSuccess, showError } = useToast();

  const handleQuestComplete = useCallback(async (questId: string, completed: boolean) => {
    try {
      const response = await aiRoadmapService.updateQuestProgress(
        roadmap.sessionId, 
        questId, 
        completed
      );
      onQuestComplete(questId, completed);
      
      const { completedQuests, totalQuests } = response.stats;
      if (completed) {
        showSuccess('Mission Updated', `Progress: ${completedQuests}/${totalQuests} modules synced.`);
      }
    } catch (error) {
      showError('Sync Error', (error as Error).message);
    }
  }, [roadmap.sessionId, onQuestComplete, showSuccess, showError]);

  // --- NEW METADATA SECTION (ISOLATED CLASSES: rm-*) ---
  const metadataSection = useMemo(() => (
    <div className="rm-mission-briefing">
      {/* Decorative Top Line */}
      <div className="rm-decor-line"></div>

      <div className="rm-grid">
        {/* LEFT COLUMN: Core Info */}
        <div className="rm-core-info">
          <div className="rm-status-bar">
            <span className="rm-system-dot"></span>
            <span className="rm-system-text">SYSTEM ONLINE // BRIEFING MODE</span>
            {roadmap.metadata.difficultyLevel && (
              <span className={`rm-badge ${roadmap.metadata.difficultyLevel.toLowerCase()}`}>
                {roadmap.metadata.difficultyLevel}
              </span>
            )}
          </div>

          <h1 className="rm-title">
            {roadmap.metadata.title}
          </h1>

          <div className="rm-objective-box">
            <Target size={18} className="rm-icon-accent" />
            <div>
              <span className="rm-label">MỤC TIÊU CHIẾN DỊCH</span>
              <p className="rm-value">{roadmap.metadata.originalGoal}</p>
            </div>
          </div>

          <div className="rm-style-tag">
            <Zap size={16} />
            <span>PHONG CÁCH: {roadmap.metadata.learningStyle}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Tactical Stats */}
        <div className="rm-tactical-stats">
          {/* Stat 1: Duration */}
          <div className="rm-stat-box">
            <div className="rm-stat-icon-wrapper"><Clock size={20} /></div>
            <div className="rm-stat-content">
              <span className="rm-stat-label">THỜI LƯỢNG</span>
              <span className="rm-stat-value">{roadmap.metadata.duration}</span>
              <span className="rm-stat-sub">Ước tính: {roadmap.statistics?.totalEstimatedHours.toFixed(0)}h</span>
            </div>
          </div>

          {/* Stat 2: Steps */}
          <div className="rm-stat-box">
            <div className="rm-stat-icon-wrapper"><Layers size={20} /></div>
            <div className="rm-stat-content">
              <span className="rm-stat-label">TỔNG BƯỚC</span>
              <span className="rm-stat-value">{roadmap.statistics?.totalNodes || 0}</span>
              <span className="rm-stat-sub">Modules</span>
            </div>
          </div>

          {/* Stat 3: Tasks */}
          <div className="rm-stat-box">
            <div className="rm-stat-icon-wrapper"><Trophy size={20} /></div>
            <div className="rm-stat-content">
              <span className="rm-stat-label">NHIỆM VỤ CHÍNH</span>
              <span className="rm-stat-value rm-text-accent">{roadmap.statistics?.mainNodes || 0}</span>
            </div>
          </div>

          {/* Stat 4: Side Quests */}
          <div className="rm-stat-box">
            <div className="rm-stat-icon-wrapper"><Hash size={20} /></div>
            <div className="rm-stat-content">
              <span className="rm-stat-label">NHIỆM VỤ PHỤ</span>
              <span className="rm-stat-value">{roadmap.statistics?.sideNodes || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), [roadmap.metadata, roadmap.statistics]);

  return (
    <div className="roadmap-detail-viewer">
      <div className="roadmap-detail-viewer__header">
        <button onClick={onBack} className="roadmap-detail-viewer__back-btn">
          <ArrowLeft className="h-5 w-5" />
          <span>TRỞ VỀ TRUNG TÂM CHỈ HUY</span>
        </button>
      </div>

      <div className="roadmap-detail-viewer__content">
        {metadataSection}
        
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