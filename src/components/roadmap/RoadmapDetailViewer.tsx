import { memo, useCallback, useMemo, useState } from 'react';
import { ArrowLeft, Clock, Target, Layers, Trophy, Hash, AlertTriangle, Brain, Briefcase, GraduationCap, Rocket, CheckCircle, Info, BookOpen } from 'lucide-react';
import { RoadmapResponse, QuestProgress } from '../../types/Roadmap';
import RoadmapFlow from '../ai-roadmap/RoadmapFlow';
import './RoadmapDetailViewer.css';
import '../../styles/RoadmapHUD.css';

interface RoadmapDetailViewerProps {
  roadmap: RoadmapResponse;
  progressMap: Map<string, QuestProgress>;
  onBack: () => void;
  onQuestComplete: (questId: string, completed: boolean) => void;
  onCreateStudyTask?: (nodeId: string) => void;
  creatingTaskNodeId?: string | null;
  eligibleNodeId?: string | null;
  studyTaskNodeIds?: Set<string>;
  selectedNodeId?: string | null;
  onNodeSelect?: (nodeId: string) => void;
}

/** Replicate BE logic: AiRoadmapServiceImpl.parseDailyTimeMinutes() */
const parseDailyMinutes = (dailyTime: string | undefined | null): number => {
  if (!dailyTime) return 60;
  const s = dailyTime.toLowerCase();
  const numMatch = s.replace(/[^0-9]/g, '');
  if (numMatch) {
    const num = parseInt(numMatch, 10);
    if (s.includes('hour') || s.includes('giờ')) return num * 60;
    if (s.includes('min')) return num;
  }
  if (s.includes('30') && !s.includes('1')) return 30;
  if (s.includes('2') && !s.includes('12') && !s.includes('15')) return 120;
  if (s.includes('1') && !s.includes('12') && !s.includes('15')) return 60;
  return 60;
};

/** Parse commitment months from "6 tháng" / "3 months" etc. */
const parseCommitmentMonths = (duration: string | undefined | null): number | null => {
  if (!duration) return null;
  const s = duration.toLowerCase();
  const numMatch = s.replace(/[^0-9.]/g, '');
  const num = numMatch ? parseFloat(numMatch) : null;
  if (!num) return null;
  if (s.includes('tháng') || s.includes('month')) return num;
  if (s.includes('tuần') || s.includes('week')) return Math.round(num * 30 / 7) / 30; // weeks → months
  return num; // assume months if plain number
};

const SPEC_KEY_LABELS: Record<string, string> = {
  assessmentscore: 'Assessment score',
  level: 'Level',
  scoreband: 'Score band',
  recommendation: 'Recommendation',
  recommendationmode: 'Recommendation',
  strengths: 'Strengths',
  gaps: 'Gaps',
  background: 'Background',
};

const formatSpecKey = (key: string): string => {
  const normalizedKey = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const knownLabel = SPEC_KEY_LABELS[normalizedKey];
  if (knownLabel) {
    return knownLabel;
  }

  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const parseStructuredSpecValue = (value: string): Array<{ key: string; value: string }> => {
  const tokens = value
    .split(/[\n;]+|,\s*/g)
    .map((token) => token.trim())
    .filter(Boolean);

  const entries: Array<{ key: string; value: string }> = [];

  tokens.forEach((token) => {
    const separatorIndex = token.indexOf('=');
    if (separatorIndex >= 0) {
      const key = token.slice(0, separatorIndex).trim();
      const entryValue = token.slice(separatorIndex + 1).trim();
      if (key && entryValue) {
        entries.push({ key, value: entryValue });
      }
      return;
    }

    const lastEntry = entries[entries.length - 1];
    if (lastEntry) {
      lastEntry.value = `${lastEntry.value}, ${token}`;
      return;
    }

    entries.push({ key: '', value: token });
  });

  return entries;
};

const hasStructuredSpecValue = (value: string | undefined | null): boolean => {
  const safeValue = typeof value === 'string' ? value.trim() : '';
  if (!safeValue) {
    return false;
  }

  const structuredEntries = parseStructuredSpecValue(safeValue);
  return structuredEntries.length > 1 || structuredEntries.some((entry) => entry.key.length > 0);
};

const renderSpecValue = (value: string | undefined | null) => {
  const safeValue = typeof value === 'string' ? value.trim() : '';
  if (!safeValue) {
    return <span className="rm-spec-value">N/A</span>;
  }

  const structuredEntries = parseStructuredSpecValue(safeValue);
  const hasStructuredEntries =
    structuredEntries.length > 1 || structuredEntries.some((entry) => entry.key.length > 0);

  if (hasStructuredEntries) {
    return (
      <div className="rm-spec-value rm-spec-value--structured">
        {structuredEntries.map((entry, index) => (
          <div key={`${entry.key}-${index}`} className="rm-spec-kv">
            {entry.key ? <span className="rm-spec-kv-label">{formatSpecKey(entry.key)}</span> : null}
            <span className="rm-spec-kv-value">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return <span className="rm-spec-value">{safeValue}</span>;
};

const RoadmapDetailViewer = memo(({
  roadmap,
  progressMap,
  onBack,
  onQuestComplete,
  onCreateStudyTask,
  creatingTaskNodeId,
  eligibleNodeId,
  studyTaskNodeIds,
  selectedNodeId,
  onNodeSelect
}: RoadmapDetailViewerProps) => {
  const [showAdvancedSections, setShowAdvancedSections] = useState(false);

  const handleQuestComplete = useCallback(async (questId: string, completed: boolean) => {
    onQuestComplete(questId, completed);
  }, [onQuestComplete]);

  const derivedStats = useMemo(() => {
    const nodes = roadmap.roadmap ?? [];
    const totalFromNodes = nodes.length;
    const mainFromNodes = nodes.filter((node) => {
      const nodeType = (node.type || '').toString().toUpperCase();
      if (nodeType === 'MAIN') {
        return true;
      }
      if (nodeType === 'SIDE') {
        return false;
      }
      if (typeof node.isCore === 'boolean') {
        return node.isCore;
      }
      return true;
    }).length;
    const sideFromNodes = Math.max(0, totalFromNodes - mainFromNodes);

    const estimatedHoursFromNodes = nodes.reduce((sum, node) => {
      const minutes = Number(node.estimatedTimeMinutes ?? 0);
      return Number.isFinite(minutes) && minutes > 0 ? sum + minutes / 60 : sum;
    }, 0);

    const totalFromStats = Number(roadmap.statistics?.totalNodes ?? 0);
    const mainFromStats = Number(roadmap.statistics?.mainNodes ?? 0);
    const sideFromStats = Number(roadmap.statistics?.sideNodes ?? 0);
    const hoursFromStats = Number(roadmap.statistics?.totalEstimatedHours ?? 0);

    const hasStatsTotal = Number.isFinite(totalFromStats) && totalFromStats > 0;
    const hasStatsBreakdown =
      Number.isFinite(mainFromStats) &&
      Number.isFinite(sideFromStats) &&
      (mainFromStats > 0 || sideFromStats > 0);

    const totalEstimatedHours =
      Number.isFinite(hoursFromStats) && hoursFromStats > 0
        ? hoursFromStats
        : Math.max(0, estimatedHoursFromNodes);

    // Approximate duration from hours + dailyTime (using BE-compatible parse)
    const dailyMinutes = parseDailyMinutes(roadmap.metadata.dailyTime);
    const approxDays = dailyMinutes > 0
      ? Math.round(totalEstimatedHours * 60 / dailyMinutes)
      : null;
    const approxWeeks = approxDays ? Math.round(approxDays / 7) : null;
    const approxMonths = approxDays ? Math.round(approxDays / 30) : null;

    // Parse commitment vs effort gap
    const commitmentMonths = parseCommitmentMonths(roadmap.metadata.duration);
    const effortMonths = approxMonths;
    const commitmentMet = effortMonths !== null && commitmentMonths !== null && effortMonths <= commitmentMonths;
    const commitmentGapMonths = (commitmentMonths !== null && effortMonths !== null)
      ? Math.round((effortMonths - commitmentMonths) * 10) / 10
      : null;

    return {
      totalNodes: hasStatsTotal ? totalFromStats : totalFromNodes,
      mainNodes: hasStatsBreakdown ? mainFromStats : mainFromNodes,
      sideNodes: hasStatsBreakdown ? sideFromStats : sideFromNodes,
      totalEstimatedHours,
      approxDays,
      approxWeeks,
      approxMonths,
      commitmentMonths,
      commitmentMet,
      commitmentGapMonths,
      dailyMinutes,
      isFallback: !hasStatsTotal || !hasStatsBreakdown,
    };
  }, [roadmap]);

  const hasAdvancedSections = useMemo(() => (
    (roadmap.warnings?.length ?? 0) > 0 ||
    (roadmap.structure?.length ?? 0) > 0 ||
    (roadmap.thinkingProgression?.length ?? 0) > 0 ||
    (roadmap.projectsEvidence?.length ?? 0) > 0 ||
    Boolean(roadmap.nextSteps)
  ), [roadmap]);

  // --- NEW METADATA SECTION (ISOLATED CLASSES: rm-*) ---
  const metadataSection = useMemo(() => {
    const isSkillBased = roadmap.metadata.roadmapType === 'SKILL_BASED' || roadmap.metadata.roadmapType === 'skill';
    const careerBackgroundValue = roadmap.metadata.currentLevel || roadmap.metadata.background || 'N/A';
    
    return (
    <div className="rm-mission-briefing">
      {/* Decorative Top Line */}
      <div className="rm-decor-line"></div>

      <div className="rm-grid">
        {/* LEFT COLUMN: Core Info */}
        <div className="rm-core-info">
          <div className="rm-status-bar">
            <span className="rm-system-dot"></span>
            <div className="rm-status-modules">
              <span className="status-module-rm">Hoạt động</span>
              <span className="status-module-rm">{isSkillBased ? 'Kỹ năng' : 'Sự nghiệp'}</span>
            </div>
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
              <span className="rm-label">MỤC TIÊU HỌC TẬP</span>
              <p className="rm-value">{roadmap.metadata.originalGoal}</p>
            </div>
          </div>

          {/* Dynamic Fields based on Type */}
          <div className="rm-specs-grid">
            {isSkillBased ? (
              <>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Kỹ năng trọng tâm</span>
                  {renderSpecValue(roadmap.metadata.target || roadmap.metadata.skillMode?.skillName || 'N/A')}
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Cấp độ hiện tại</span>
                  {renderSpecValue(roadmap.metadata.currentLevel || 'Zero')}
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Thời gian/ngày</span>
                  {renderSpecValue(roadmap.metadata.dailyTime || '1h')}
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Phong cách học</span>
                  {renderSpecValue(roadmap.metadata.learningStyle || 'Practice')}
                </div>
              </>
            ) : (
              <>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Vị trí mục tiêu</span>
                  {renderSpecValue(roadmap.metadata.target || roadmap.metadata.careerMode?.targetRole || 'N/A')}
                </div>
                <div className={`rm-spec-item ${hasStructuredSpecValue(careerBackgroundValue) ? 'rm-spec-item--highlight' : ''}`}>
                  <span className="rm-spec-label">Background</span>
                  {renderSpecValue(careerBackgroundValue)}
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Thời gian cam kết</span>
                  {renderSpecValue(roadmap.metadata.careerMode?.timelineToWork || roadmap.metadata.duration || '6M')}
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Môi trường</span>
                  {renderSpecValue(roadmap.metadata.targetEnvironment || roadmap.metadata.careerMode?.companyType || 'Startup')}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Tactical Stats */}
        <div className="rm-tactical-stats">
          {/* Stat 1: Duration + Hours — commitment vs effort */}
          <div className="rm-stat-box">
            <div className="rm-stat-icon-wrapper"><Clock size={20} /></div>
            <div className="rm-stat-content">
              <span className="rm-stat-label">THỜI LƯỢNG</span>
              <span className="rm-stat-value">
                {derivedStats.approxMonths !== null
                  ? `~${derivedStats.approxMonths} tháng`
                  : roadmap.metadata.duration}
              </span>
              <span className="rm-stat-sub">
                {derivedStats.totalEstimatedHours > 0
                  ? `~${derivedStats.totalEstimatedHours.toFixed(0)}h @ ${derivedStats.dailyMinutes}m/ngày`
                  : roadmap.metadata.duration}
              </span>
            </div>
          </div>

          {/* Effort vs Commitment warning */}
          {derivedStats.commitmentGapMonths !== null && !derivedStats.commitmentMet && (
            <div className="rm-warning-inline rm-warning-effort">
              <AlertTriangle size={14} />
              <span>Effort vượt cam kết {Math.abs(derivedStats.commitmentGapMonths)} tháng — cân nhắc giảm scope</span>
            </div>
          )}
          {derivedStats.commitmentGapMonths !== null && derivedStats.commitmentMet && derivedStats.commitmentGapMonths > 0 && (
            <div className="rm-warning-inline rm-warning-ahead">
              <CheckCircle size={14} />
              <span>Effort thấp hơn cam kết {derivedStats.commitmentGapMonths} tháng — có thể hoàn thành sớm</span>
            </div>
          )}

          {/* Stat 2: Steps */}
          <div className="rm-stat-box">
            <div className="rm-stat-icon-wrapper"><Layers size={20} /></div>
            <div className="rm-stat-content">
              <span className="rm-stat-label">TỔNG BƯỚC</span>
              <span className="rm-stat-value">{derivedStats.totalNodes}</span>
              <span className="rm-stat-sub">Modules</span>
            </div>
          </div>

          {/* Stat 3: Tasks */}
          <div className="rm-stat-box">
            <div className="rm-stat-icon-wrapper"><Trophy size={20} /></div>
            <div className="rm-stat-content">
              <span className="rm-stat-label">MỤC TIÊU CHÍNH</span>
              <span className="rm-stat-value rm-text-accent">{derivedStats.mainNodes}</span>
            </div>
          </div>

          {/* Stat 4: Side Quests */}
          <div className="rm-stat-box">
            <div className="rm-stat-icon-wrapper"><Hash size={20} /></div>
            <div className="rm-stat-content">
              <span className="rm-stat-label">MỤC TIÊU PHỤ</span>
              <span className="rm-stat-value">{derivedStats.sideNodes}</span>
            </div>
          </div>

          {derivedStats.isFallback && (
            <p className="rm-stats-fallback-note">
              Số liệu đang được đồng bộ theo node hiện có để tránh thiếu tổng bước/chính/phụ.
            </p>
          )}

          {/* Inline warning: time budget exceeded */}
          {roadmap.warnings?.some(w => w.toLowerCase().includes('10%') || w.toLowerCase().includes('time')) && (
            <div className="rm-warning-inline">
              <AlertTriangle size={16} />
              <span>Lộ trình vượt thời gian cam kết — có thể cần điều chỉnh scope</span>
            </div>
          )}
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
  }, [derivedStats, roadmap]);

  const advancedSection = useMemo(() => {
    if (!showAdvancedSections) {
      return null;
    }

    return (
      <div className="rm-footer-briefing rm-footer-briefing--advanced">
        {roadmap.warnings && roadmap.warnings.length > 0 && (
          <div className="rm-footer-section rm-warning-block">
            <h3 className="rm-footer-title rm-text-warning"><AlertTriangle size={20} /> Warnings</h3>
            <ul className="rm-list-disc">
              {roadmap.warnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
          </div>
        )}

        {roadmap.structure && Array.isArray(roadmap.structure) && roadmap.structure.length > 0 && (
          <div className="rm-footer-section">
            <h3 className="rm-footer-title"><BookOpen size={20} /> Cấu trúc lộ trình</h3>
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

        {roadmap.thinkingProgression && roadmap.thinkingProgression.length > 0 && (
          <div className="rm-footer-section">
            <h3 className="rm-footer-title"><Brain size={20} /> Thinking Progression</h3>
            <ul className="rm-list-disc">
              {roadmap.thinkingProgression.map((thought, idx) => (
                <li key={idx}>{thought}</li>
              ))}
            </ul>
          </div>
        )}

        {roadmap.projectsEvidence && roadmap.projectsEvidence.length > 0 && (
          <div className="rm-footer-section">
            <h3 className="rm-footer-title"><Briefcase size={20} /> PROJECTS & EVIDENCE (SKILL WALLET)</h3>
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

        {roadmap.nextSteps && (
          <div className="rm-footer-section">
            <h3 className="rm-footer-title"><Rocket size={20} /> NEXT STEPS & REAL-WORLD CONNECTION</h3>
            <div className="rm-next-steps-grid">
              {roadmap.nextSteps.jobs && (
                <div className="rm-next-col">
                  <h4><Briefcase size={16} /> Potential Jobs</h4>
                  <ul>{roadmap.nextSteps.jobs.map((j, i) => <li key={i}>{j}</li>)}</ul>
                </div>
              )}
              {roadmap.nextSteps.nextSkills && (
                <div className="rm-next-col">
                  <h4><GraduationCap size={16} /> Next Skills</h4>
                  <ul>{roadmap.nextSteps.nextSkills.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }, [roadmap, showAdvancedSections]);

  return (
    <div className="roadmap-detail-viewer">
      <div className="roadmap-detail-viewer__header">
        <button onClick={onBack} className="roadmap-detail-viewer__back-btn">
          <ArrowLeft className="h-5 w-5" />
          <span>QUAY LẠI</span>
        </button>
      </div>

      <div className="roadmap-detail-viewer__content">
        {metadataSection}
        
        <div className="roadmap-detail-viewer__flow">
          <RoadmapFlow
            roadmap={roadmap.roadmap}
            progressMap={progressMap}
            onQuestComplete={handleQuestComplete}
            onCreateStudyTask={onCreateStudyTask}
            creatingTaskNodeId={creatingTaskNodeId}
            eligibleNodeId={eligibleNodeId}
            studyTaskNodeIds={studyTaskNodeIds}
            selectedNodeId={selectedNodeId}
            onNodeSelect={onNodeSelect}
          />
        </div>

        {hasAdvancedSections && (
          <div className="rm-advanced-toggle-wrap">
            <button
              type="button"
              className="rm-advanced-toggle-btn"
              onClick={() => setShowAdvancedSections((previous) => !previous)}
            >
              {showAdvancedSections ? 'Ẩn bớt chi tiết roadmap' : 'Xem thêm chi tiết roadmap'}
            </button>
          </div>
        )}

        {advancedSection}
      </div>
    </div>
  );
});

RoadmapDetailViewer.displayName = 'RoadmapDetailViewer';

export default RoadmapDetailViewer;
