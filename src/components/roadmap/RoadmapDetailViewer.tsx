import { memo, useCallback, useMemo } from 'react';
import { ArrowLeft, Clock, Target, Layers, Trophy, Hash, MapPin, Globe, DollarSign, AlertTriangle, Brain, Briefcase, GraduationCap, Rocket, CheckCircle, Info, BookOpen, Lightbulb } from 'lucide-react';
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

const InfoItem = ({ label, value, icon: Icon }: { label: string, value?: string | boolean, icon?: any }) => {
  if (!value || value === 'undefined' || value === 'null') return null;
  return (
    <div className="rm-info-item">
      <span className="rm-info-label">{Icon && <Icon size={12} style={{marginRight: 4}}/>}{label}:</span>
      <span className="rm-info-value">{value.toString()}</span>
    </div>
  );
};

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
  const metadataSection = useMemo(() => {
    const isSkillBased = roadmap.metadata.roadmapType === 'SKILL_BASED' || roadmap.metadata.roadmapType === 'skill';
    
    return (
    <div className="rm-mission-briefing">
      {/* Decorative Top Line */}
      <div className="rm-decor-line"></div>

      <div className="rm-grid">
        {/* LEFT COLUMN: Core Info */}
        <div className="rm-core-info">
          <div className="rm-status-bar">
            <span className="rm-system-dot"></span>
            <span className="rm-system-text">SYSTEM ONLINE // {isSkillBased ? 'SKILL PROTOCOL' : 'CAREER PROTOCOL'}</span>
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

          {/* Dynamic Fields based on Type */}
          <div className="rm-specs-grid">
            {isSkillBased ? (
              <>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Kỹ năng trọng tâm</span>
                  <span className="rm-spec-value">{roadmap.metadata.target || roadmap.metadata.skillMode?.skillName || 'N/A'}</span>
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Cấp độ hiện tại</span>
                  <span className="rm-spec-value">{roadmap.metadata.currentLevel || 'Zero'}</span>
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Thời gian/ngày</span>
                  <span className="rm-spec-value">{roadmap.metadata.dailyTime || '1h'}</span>
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Phong cách học</span>
                  <span className="rm-spec-value">{roadmap.metadata.learningStyle || 'Practice'}</span>
                </div>
              </>
            ) : (
              <>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Vị trí mục tiêu</span>
                  <span className="rm-spec-value">{roadmap.metadata.target || roadmap.metadata.careerMode?.targetRole || 'N/A'}</span>
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Background</span>
                  <span className="rm-spec-value">{roadmap.metadata.currentLevel || roadmap.metadata.background || 'N/A'}</span>
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Thời gian cam kết</span>
                  <span className="rm-spec-value">{roadmap.metadata.careerMode?.timelineToWork || roadmap.metadata.duration || '6M'}</span>
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Môi trường</span>
                  <span className="rm-spec-value">{roadmap.metadata.targetEnvironment || roadmap.metadata.careerMode?.companyType || 'Startup'}</span>
                </div>
              </>
            )}
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

      {/* --- RESTORED SECTIONS --- */}

      {/* Validation Notes (from Metadata) */}
      {roadmap.metadata.validationNotes && (
        <div className="rm-section-block">
          <h3 className="rm-section-title"><CheckCircle size={18} /> Validation Notes</h3>
          <ul className="rm-list-disc">
            {Array.isArray(roadmap.metadata.validationNotes) 
              ? roadmap.metadata.validationNotes.map((note, idx) => <li key={idx}>{note}</li>)
              : <li>{roadmap.metadata.validationNotes}</li>
            }
          </ul>
        </div>
      )}

      {/* Warnings */}
      {roadmap.warnings && roadmap.warnings.length > 0 && (
        <div className="rm-section-block rm-warning-block">
          <h3 className="rm-section-title rm-text-warning"><AlertTriangle size={18} /> Warnings</h3>
          <ul className="rm-list-disc">
            {roadmap.warnings.map((warn, idx) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Structure - Detailed List */}
      {roadmap.structure && Array.isArray(roadmap.structure) && roadmap.structure.length > 0 && (
        <div className="rm-section-block">
          <h3 className="rm-section-title"><BookOpen size={18} /> Cấu trúc lộ trình</h3>
          <div className="rm-structure-list">
            {roadmap.structure.map((phase, idx) => (
              <div key={idx} className="rm-structure-item">
                <div className="rm-structure-header">
                  <span className="rm-phase-title">{phase.title}</span>
                  {phase.timeframe && <span className="rm-phase-time">({phase.timeframe})</span>}
                </div>
                <p className="rm-phase-desc">{phase.goal}</p>
                
                {phase.skillFocus && phase.skillFocus.length > 0 && (
                  <div className="rm-phase-meta">
                    <span className="rm-meta-label">Trọng tâm kỹ năng:</span>
                    <span className="rm-meta-value">{phase.skillFocus.join(', ')}</span>
                  </div>
                )}
                
                {phase.expectedOutput && (
                  <div className="rm-phase-meta">
                    <span className="rm-meta-label">Output:</span>
                    <span className="rm-meta-value">{phase.expectedOutput}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thinking Progression - List */}
      {roadmap.thinkingProgression && roadmap.thinkingProgression.length > 0 && (
        <div className="rm-section-block">
          <h3 className="rm-section-title"><Brain size={18} /> Thinking Progression</h3>
          <ul className="rm-list-disc">
            {roadmap.thinkingProgression.map((thought, idx) => (
              <li key={idx}>{thought}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Overview Section - Expanded */}
      {roadmap.overview && (
        <div className="rm-overview-section">
           {roadmap.overview.purpose && (
             <div className="rm-overview-item">
                <Brain size={16} className="rm-icon-sub" />
                <span><strong>Mục đích:</strong> {roadmap.overview.purpose}</span>
             </div>
           )}
           {roadmap.overview.postRoadmapState && (
             <div className="rm-overview-item">
                <Rocket size={16} className="rm-icon-sub" />
                <span><strong>Kết quả:</strong> {roadmap.overview.postRoadmapState}</span>
             </div>
           )}
           {roadmap.overview.audience && (
             <div className="rm-overview-item">
                <Target size={16} className="rm-icon-sub" />
                <span><strong>Đối tượng:</strong> {roadmap.overview.audience}</span>
             </div>
           )}
           {/* Prerequisites might be in metadata if not in overview object */}
           {roadmap.metadata.prerequisites && roadmap.metadata.prerequisites.length > 0 && (
             <div className="rm-overview-item">
                <Info size={16} className="rm-icon-sub" />
                <span><strong>Yêu cầu:</strong> {roadmap.metadata.prerequisites.join(', ')}</span>
             </div>
           )}
        </div>
      )}
    </div>
  );
  }, [roadmap]);

  // --- LAYER 4 & 5: PROJECTS & NEXT STEPS (Below the graph) ---
  const footerSection = useMemo(() => (
    <div className="rm-footer-briefing">
      
      {/* Projects & Evidence */}
      {roadmap.projectsEvidence && roadmap.projectsEvidence.length > 0 && (
        <div className="rm-footer-section">
          <h3 className="rm-footer-title"><Briefcase size={20}/> PROJECTS & EVIDENCE (SKILL WALLET)</h3>
          <div className="rm-projects-grid">
            {roadmap.projectsEvidence.map((proj, idx) => (
              <div key={idx} className="rm-project-card">
                <div className="rm-project-header">
                  <span className="rm-phase-tag">{proj.phaseId || `Phase ${idx + 1}`}</span>
                  <h4>{proj.project}</h4>
                </div>
                <p className="rm-project-obj">{proj.objective}</p>
                <div className="rm-project-skills">
                  {proj.skillsProven?.map((s, i) => <span key={i} className="rm-skill-tag">{s}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {roadmap.nextSteps && (
        <div className="rm-footer-section">
          <h3 className="rm-footer-title"><Rocket size={20}/> NEXT STEPS & REAL-WORLD CONNECTION</h3>
          <div className="rm-next-steps-grid">
            {roadmap.nextSteps.jobs && (
              <div className="rm-next-col">
                <h4><Briefcase size={16}/> Potential Jobs</h4>
                <ul>{roadmap.nextSteps.jobs.map((j, i) => <li key={i}>{j}</li>)}</ul>
              </div>
            )}
            {roadmap.nextSteps.nextSkills && (
              <div className="rm-next-col">
                <h4><GraduationCap size={16}/> Next Skills</h4>
                <ul>{roadmap.nextSteps.nextSkills.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  ), [roadmap]);

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
        
        {footerSection}
      </div>
    </div>
  );
});

RoadmapDetailViewer.displayName = 'RoadmapDetailViewer';

export default RoadmapDetailViewer;
