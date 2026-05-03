import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Target, Layers, Trophy, Hash, AlertTriangle, Brain, Briefcase, GraduationCap, Rocket, Info, BookOpen, ClipboardList, UserCheck, Star, Wallet, Loader2, CalendarDays } from 'lucide-react';
import { RoadmapResponse, QuestProgress } from '../../types/Roadmap';
import RoadmapFlow from '../ai-roadmap/RoadmapFlow';
import type { RoadmapNodeFocusPanelProps } from './RoadmapNodeFocusPanel';
import { normalizeRoadmapMarkdown } from '../../utils/roadmapMarkdown';
import BookingModal from '../mentorship-hud/BookingModal';
import { getAllMentors, getMentorsByVerifiedSkill, type MentorProfile } from '../../services/mentorProfileService';
import { getMyBookings, type BookingResponse } from '../../services/bookingService';
import journeyService from '../../services/journeyService';
import { isSkillFuzzyVerified } from '../../utils/skillResolver';
import type { JourneyDetailResponse } from '../../types/Journey';
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
  workspaceJourneyId?: number | null;
  onNodeSelect?: (nodeId: string) => void;
  nodeFocusPanel?: RoadmapNodeFocusPanelProps | null;
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

const ACTIVE_ROADMAP_BOOKING_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'ONGOING',
  'MENTORING_ACTIVE',
  'PENDING_COMPLETION',
] as const;

const ROADMAP_BOOKING_STATUS_LABELS: Partial<Record<BookingResponse['status'], string>> = {
  PENDING: 'Chờ mentor duyệt',
  CONFIRMED: 'Đã xác nhận',
  ONGOING: 'Đang diễn ra',
  MENTORING_ACTIVE: 'Đang đồng hành',
  PENDING_COMPLETION: 'Chờ hoàn tất',
};

const getMentorDisplayName = (mentor: MentorProfile): string => {
  const fullName = `${mentor.firstName ?? ''} ${mentor.lastName ?? ''}`.trim();
  return fullName || mentor.email || `Mentor #${mentor.id}`;
};

const normalizeSkillCandidates = (values: Array<string | string[] | undefined | null>): string[] => {
  const result: string[] = [];
  const seen = new Set<string>();

  values.forEach((value) => {
    const items = Array.isArray(value) ? value : [value];
    items.forEach((item) => {
      const skill = typeof item === 'string' ? item.trim() : '';
      if (!skill) {
        return;
      }

      const key = skill.toLowerCase();
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      result.push(skill);
    });
  });

  return result;
};

const mentorSupportsRoadmapSkill = (mentor: MentorProfile, skillNames: string[]): boolean => {
  const profileSkills = Array.isArray(mentor.skills) ? mentor.skills : [];
  for (const skillName of skillNames) {
    if (profileSkills.length > 0 && isSkillFuzzyVerified(skillName, profileSkills)) {
      return true;
    }

    const specialization = mentor.specialization?.trim();
    if (specialization && isSkillFuzzyVerified(skillName, [specialization])) {
      return true;
    }
  }

  return false;
};

const getMatchedMentorSkills = (mentor: MentorProfile, skillNames: string[]): string[] => {
  const profileSkills = Array.isArray(mentor.skills) ? mentor.skills : [];
  const matchedSkills = profileSkills.filter((skill) => (
    skillNames.some((skillName) => isSkillFuzzyVerified(skillName, [skill]))
  ));

  if (matchedSkills.length > 0) {
    return Array.from(new Set(matchedSkills.map((skill) => skill.trim()).filter(Boolean))).slice(0, 4);
  }

  return skillNames.slice(0, 4);
};

const getRoadmapMentoringMentors = (mentors: MentorProfile[], skillNames: string[]): MentorProfile[] => (
  mentors
    .filter((mentor) => (mentor.roadmapMentoringPrice ?? 0) > 0)
    .filter((mentor) => mentorSupportsRoadmapSkill(mentor, skillNames))
    .slice(0, 3)
);

const formatVnd = (value?: number): string => (
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0)
);

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

const renderMarkdownInline = (value: string | undefined | null) => {
  const normalizedValue = normalizeRoadmapMarkdown(value);
  if (!normalizedValue) {
    return null;
  }

  return (
    <div className="rm-markdown-inline">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {normalizedValue}
      </ReactMarkdown>
    </div>
  );
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
  workspaceJourneyId,
  onNodeSelect,
  nodeFocusPanel,
}: RoadmapDetailViewerProps) => {
  const navigate = useNavigate();
  const showAdvancedSections = true;
  const [matchedMentors, setMatchedMentors] = useState<MentorProfile[]>([]);
  const [mentorMatchLoading, setMentorMatchLoading] = useState(false);
  const [mentorMatchError, setMentorMatchError] = useState<string | null>(null);
  const [currentRoadmapBooking, setCurrentRoadmapBooking] = useState<BookingResponse | null>(null);
  const [bookingMentor, setBookingMentor] = useState<MentorProfile | null>(null);
  const [journeyDetail, setJourneyDetail] = useState<JourneyDetailResponse | null>(null);
  const [journeyContextResolved, setJourneyContextResolved] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    const loadJourneyDetail = async () => {
      setJourneyContextResolved(false);

      if (!workspaceJourneyId) {
        setJourneyDetail(null);
        setJourneyContextResolved(true);
        return;
      }

      try {
        const detail = await journeyService.getJourneyById(workspaceJourneyId);
        if (!cancelled) {
          setJourneyDetail(detail);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to load journey context for roadmap mentor match:', error);
          setJourneyDetail(null);
        }
      } finally {
        if (!cancelled) {
          setJourneyContextResolved(true);
        }
      }
    };

    loadJourneyDetail();

    return () => {
      cancelled = true;
    };
  }, [workspaceJourneyId]);

  const roadmapMentorSkills = useMemo(() => {
    const journeySkills = normalizeSkillCandidates([
      journeyDetail?.skillName,
      journeyDetail?.skills,
      (journeyDetail as { skill?: string } | null)?.skill,
    ]);
    if (journeySkills.length > 0) {
      return journeySkills;
    }

    if (workspaceJourneyId && !journeyContextResolved) {
      return [];
    }

    return normalizeSkillCandidates([
      roadmap.metadata.skillMode?.skillName,
      roadmap.structure?.flatMap((phase) => phase.skillFocus ?? [])[0],
      roadmap.projectsEvidence?.flatMap((project) => project.skillsProven ?? [])[0],
      roadmap.metadata.target,
    ]);
  }, [journeyContextResolved, journeyDetail, roadmap, workspaceJourneyId]);

  const roadmapMentorSkillLabel = roadmapMentorSkills[0] ?? '';

  const refreshRoadmapBooking = useCallback(async () => {
    if (!workspaceJourneyId) {
      setCurrentRoadmapBooking(null);
      return;
    }

    try {
      const response = await getMyBookings(false, 0, 100);
      const activeBooking = (response.content || []).find((booking) => (
        booking.bookingType === 'ROADMAP_MENTORING' &&
        booking.journeyId === workspaceJourneyId &&
        ACTIVE_ROADMAP_BOOKING_STATUSES.includes(booking.status as typeof ACTIVE_ROADMAP_BOOKING_STATUSES[number])
      ));
      setCurrentRoadmapBooking(activeBooking ?? null);
    } catch (error) {
      console.error('Failed to load roadmap mentor booking:', error);
    }
  }, [workspaceJourneyId]);

  useEffect(() => {
    refreshRoadmapBooking();
  }, [refreshRoadmapBooking]);

  useEffect(() => {
    let cancelled = false;

    const loadMatchedMentors = async () => {
      if (roadmapMentorSkills.length === 0) {
        setMatchedMentors([]);
        setMentorMatchError(null);
        return;
      }

      try {
        setMentorMatchLoading(true);
        setMentorMatchError(null);
        const mentors: MentorProfile[] = [];
        for (const skillName of roadmapMentorSkills) {
          try {
            const matches = await getMentorsByVerifiedSkill(skillName);
            mentors.push(...matches);
          } catch (verifiedSkillError) {
            console.warn('Verified-skill mentor lookup failed, falling back to all mentors:', verifiedSkillError);
          }
        }

        if (cancelled) return;
        const mentorsById = new Map(mentors.map((mentor) => [mentor.id, mentor]));
        const verifiedSkillMatches = Array.from(mentorsById.values())
          .filter((mentor) => (mentor.roadmapMentoringPrice ?? 0) > 0)
          .slice(0, 3);

        if (verifiedSkillMatches.length > 0) {
          setMatchedMentors(verifiedSkillMatches);
          return;
        }

        const allMentors = await getAllMentors();
        if (cancelled) return;
        setMatchedMentors(getRoadmapMentoringMentors(allMentors, roadmapMentorSkills));
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load matched roadmap mentors:', error);
        setMatchedMentors([]);
        setMentorMatchError('Không thể tải mentor phù hợp lúc này.');
      } finally {
        if (!cancelled) {
          setMentorMatchLoading(false);
        }
      }
    };

    loadMatchedMentors();

    return () => {
      cancelled = true;
    };
  }, [roadmapMentorSkills]);

  const closeBookingModal = useCallback(() => {
    setBookingMentor(null);
    refreshRoadmapBooking();
  }, [refreshRoadmapBooking]);

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
                {!isSkillBased && careerBackgroundValue && careerBackgroundValue !== 'N/A' && (
                  <div className="rm-context-tags">
                    <span className="rm-context-tag">{careerBackgroundValue}</span>
                    {roadmap.metadata.dailyTime && (
                      <span className="rm-context-tag">{roadmap.metadata.dailyTime}/ngày</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Fields based on Type */}
            {isSkillBased && (
              <div className="rm-specs-grid">
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Kỹ năng trọng tâm</span>
                  {renderSpecValue(roadmap.metadata.target || roadmap.metadata.skillMode?.skillName || 'N/A')}
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Cấp độ hiện tại</span>
                  {renderSpecValue(roadmap.metadata.currentLevel || roadmap.metadata.skillMode?.currentSkillLevel || 'Zero')}
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Thời gian/ngày</span>
                  {renderSpecValue(roadmap.metadata.dailyTime || '1h')}
                </div>
                <div className="rm-spec-item">
                  <span className="rm-spec-label">Phong cách học</span>
                  {renderSpecValue(roadmap.metadata.learningStyle || 'Practice')}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Tactical Stats */}
          <div className="rm-tactical-stats">
            {/* Stat 1: Duration + Hours — commitment vs effort */}
            <div className="rm-stat-box">
              <div className="rm-stat-icon-wrapper"><Clock size={20} /></div>
              <div className="rm-stat-content">
                <span className="rm-stat-label">THỜI LƯỢNG</span>
                <span className="rm-stat-value">
                  {derivedStats.approxDays !== null && derivedStats.approxDays <= 14
                    ? `~${derivedStats.approxDays} ngày`
                    : derivedStats.approxWeeks !== null && derivedStats.approxWeeks <= 8
                      ? `~${derivedStats.approxWeeks} tuần`
                      : derivedStats.approxMonths !== null && derivedStats.approxMonths > 0
                        ? `~${derivedStats.approxMonths} tháng`
                        : roadmap.metadata.duration ?? roadmap.metadata.desiredDuration ?? 'N/A'}
                </span>
                <span className="rm-stat-sub">
                  {derivedStats.totalEstimatedHours > 0
                    ? `~${derivedStats.totalEstimatedHours.toFixed(0)}h @ ${derivedStats.dailyMinutes}m/ngày`
                    : ''}
                </span>
              </div>
            </div>


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

          </div>
        </div>

        {/* --- RESTORED SECTIONS --- */}


        {/* Overview Section - Expanded */}
        {roadmap.overview && (
          <div className="rm-overview-section">
            {roadmap.overview.purpose && (
              <div className="rm-overview-item">
                <Brain size={16} className="rm-icon-sub" />
                <div>
                  <strong>Mục đích:</strong>
                  {renderMarkdownInline(roadmap.overview.purpose)}
                </div>
              </div>
            )}
            {roadmap.overview.postRoadmapState && (
              <div className="rm-overview-item">
                <Rocket size={16} className="rm-icon-sub" />
                <div>
                  <strong>Kết quả:</strong>
                  {renderMarkdownInline(roadmap.overview.postRoadmapState)}
                </div>
              </div>
            )}
            {roadmap.overview.audience && (
              <div className="rm-overview-item">
                <Target size={16} className="rm-icon-sub" />
                <div>
                  <strong>Đối tượng:</strong>
                  {renderMarkdownInline(roadmap.overview.audience)}
                </div>
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

        {/* Action Bar inside Mission Briefing */}
        <div className="rm-action-bar">
          <button onClick={onBack} className="roadmap-detail-viewer__back-btn roadmap-detail-viewer__back-btn--briefing">
            <ArrowLeft className="h-4 w-4" />
            <span>QUAY LẠI</span>
          </button>

          <div className="rm-action-group">
            <button
              className="rm-workspace-btn"
              onClick={() => {
                const nextSearchParams = new URLSearchParams();
                if (selectedNodeId) {
                  nextSearchParams.set('nodeId', selectedNodeId);
                }
                if (workspaceJourneyId) {
                  nextSearchParams.set('journeyId', String(workspaceJourneyId));
                }

                navigate({
                  pathname: `/roadmap/${roadmap.sessionId}/workspace`,
                  search: nextSearchParams.toString() ? `?${nextSearchParams.toString()}` : '',
                }, {
                  state: {
                    journeyId: workspaceJourneyId,
                    selectedNodeId,
                  },
                });
              }}
            >
              <ClipboardList size={18} /> Đi đến Workspace
            </button>

            <button
              className="rm-planner-btn"
              onClick={() => {
                const params = new URLSearchParams({
                  source: 'roadmap',
                  roadmapSessionId: String(roadmap.sessionId),
                  view: 'calendar',
                });
                if (selectedNodeId) {
                  params.set('nodeId', selectedNodeId);
                }
                navigate(`/study-planner?${params.toString()}`);
              }}
            >
              <CalendarDays size={18} /> Đi tới Study Planner
            </button>
          </div>
        </div>

      </div>
    );
  }, [derivedStats, navigate, onBack, roadmap, selectedNodeId, workspaceJourneyId]);

  const mentorBookingSection = useMemo(() => {
    if (!workspaceJourneyId) {
      return (
        <section className="rdmv-mentor-match" aria-label="Đồng hành mentor">
          <div className="rdmv-mentor-match__copy">
            <span className="rdmv-mentor-match__eyebrow">Mentor Companion</span>
            <h2>Gắn hành trình trước khi book mentor</h2>
            <p>Roadmap này chưa có journey id nên chưa thể tạo booking đồng hành.</p>
          </div>
        </section>
      );
    }

    if (!journeyContextResolved) {
      return (
        <section className="rdmv-mentor-match" aria-label="Book mentor đồng hành">
          <div className="rdmv-mentor-match__copy">
            <span className="rdmv-mentor-match__eyebrow">Mentor Match</span>
            <h2>Book mentor đồng hành journey</h2>
            <p>SkillVerse đang đọc journey gắn với roadmap để lấy skill trọng tâm.</p>
          </div>

          <div className="rdmv-mentor-match__content">
            <div className="rdmv-mentor-match__state">
              <Loader2 size={20} className="rdmv-mentor-match__spin" />
              <span>Đang xác định skill của journey...</span>
            </div>
          </div>
        </section>
      );
    }

    if (currentRoadmapBooking) {
      return (
        <section className="rdmv-mentor-match rdmv-mentor-match--current" aria-label="Mentor đang đồng hành">
          <div className="rdmv-mentor-match__copy">
            <span className="rdmv-mentor-match__eyebrow">Mentor hiện tại</span>
            <h2>Hành trình này đã có mentor đồng hành</h2>
            <p>Mentor sẽ theo sát tiến độ, cập nhật roadmap và hỗ trợ bạn đi tới buổi verify cuối cùng.</p>
          </div>

          <div className="rdmv-current-mentor-card">
            <div className="rdmv-current-mentor-card__avatar">
              {currentRoadmapBooking.mentorAvatar ? (
                <img src={currentRoadmapBooking.mentorAvatar} alt={currentRoadmapBooking.mentorName || 'Mentor'} />
              ) : (
                <UserCheck size={24} />
              )}
            </div>
            <div className="rdmv-current-mentor-card__body">
              <strong>{currentRoadmapBooking.mentorName || `Mentor #${currentRoadmapBooking.mentorId}`}</strong>
              <span>{ROADMAP_BOOKING_STATUS_LABELS[currentRoadmapBooking.status] || currentRoadmapBooking.status}</span>
            </div>
            <div className="rdmv-current-mentor-card__price">
              {formatVnd(currentRoadmapBooking.priceVnd)}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="rdmv-mentor-match" aria-label="Book mentor đồng hành">
        <div className="rdmv-mentor-match__copy">
          <span className="rdmv-mentor-match__eyebrow">Mentor Match</span>
          <h2>Book mentor đồng hành journey</h2>
          <p>
            SkillVerse tìm mentor đã xác thực theo skill trọng tâm
            {roadmapMentorSkillLabel ? <strong> {roadmapMentorSkillLabel}</strong> : null}
            . Book xong bạn thanh toán ngay bằng ví và mentor sẽ nhận yêu cầu đồng hành.
          </p>
        </div>

        <div className="rdmv-mentor-match__content">
          {mentorMatchLoading ? (
            <div className="rdmv-mentor-match__state">
              <Loader2 size={20} className="rdmv-mentor-match__spin" />
              <span>Đang tìm mentor phù hợp...</span>
            </div>
          ) : mentorMatchError ? (
            <div className="rdmv-mentor-match__state rdmv-mentor-match__state--error">
              <AlertTriangle size={20} />
              <span>{mentorMatchError}</span>
            </div>
          ) : matchedMentors.length === 0 ? (
            <div className="rdmv-mentor-match__state">
              <Info size={20} />
              <span>Chưa có mentor bật gói đồng hành cho skill này.</span>
            </div>
          ) : (
            <div className="rdmv-mentor-list">
              {matchedMentors.map((mentor) => (
                <article key={mentor.id} className="rdmv-mentor-card">
                  <div className="rdmv-mentor-card__avatar">
                    {mentor.avatar ? (
                      <img src={mentor.avatar} alt={getMentorDisplayName(mentor)} />
                    ) : (
                      <UserCheck size={22} />
                    )}
                  </div>
                  <div className="rdmv-mentor-card__main">
                    <div className="rdmv-mentor-card__header">
                      <h3>{getMentorDisplayName(mentor)}</h3>
                      {(mentor.ratingAverage ?? 0) > 0 && (
                        <span className="rdmv-mentor-card__rating">
                          <Star size={13} />
                          {mentor.ratingAverage?.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p>{mentor.specialization || mentor.bio || 'Mentor đã xác thực skill phù hợp với roadmap này.'}</p>
                    <div className="rdmv-mentor-card__skills">
                      {getMatchedMentorSkills(mentor, roadmapMentorSkills).map((skill) => (
                        <span key={`${mentor.id}-${skill}`}>{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rdmv-mentor-card__aside">
                    <span className="rdmv-mentor-card__price">
                      {formatVnd(mentor.roadmapMentoringPrice)}
                    </span>
                    <button
                      type="button"
                      className="rdmv-mentor-card__book-btn"
                      onClick={() => setBookingMentor(mentor)}
                    >
                      <Wallet size={15} />
                      Book ngay
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }, [
    currentRoadmapBooking,
    matchedMentors,
    mentorMatchError,
    mentorMatchLoading,
    journeyContextResolved,
    roadmapMentorSkillLabel,
    workspaceJourneyId,
  ]);

  const advancedSection = useMemo(() => {

    return (
      <div className="rm-footer-briefing rm-footer-briefing--advanced">


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
            <h3 className="rm-footer-title"><Brain size={20} /> Sơ lược nội dung</h3>
            <ul className="rm-list-disc">
              {roadmap.thinkingProgression.map((thought, idx) => (
                <li key={idx}>{thought}</li>
              ))}
            </ul>
          </div>
        )}

        {roadmap.projectsEvidence && roadmap.projectsEvidence.length > 0 && (
          <div className="rm-footer-section">
            <h3 className="rm-footer-title"><Briefcase size={20} /> Gợi ý thực hành</h3>
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
          (roadmap.nextSteps.jobs?.length ?? 0) > 0 || (roadmap.nextSteps.nextSkills?.length ?? 0) > 0
        ) && (
            <div className="rm-footer-section">
              <h3 className="rm-footer-title"><Rocket size={20} /> Vị trí tiềm năng</h3>
              <div className="rm-next-steps-grid">
                {roadmap.nextSteps.jobs && roadmap.nextSteps.jobs.length > 0 && (
                  <div className="rm-next-col">
                    <ul>{roadmap.nextSteps.jobs.map((j, i) => <li key={i}>{j}</li>)}</ul>
                  </div>
                )}
                {roadmap.nextSteps.nextSkills && roadmap.nextSteps.nextSkills.length > 0 && (
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
  }, [roadmap]);

  return (
    <div className="roadmap-detail-viewer">
      <div className="roadmap-detail-viewer__content">
        {metadataSection}

        {mentorBookingSection}

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
            nodeFocusPanel={nodeFocusPanel}
          />
        </div>

        {hasAdvancedSections && advancedSection}
      </div>

      {bookingMentor && (
        <BookingModal
          isOpen={Boolean(bookingMentor)}
          onClose={closeBookingModal}
          mentorId={String(bookingMentor.id)}
          mentorName={getMentorDisplayName(bookingMentor)}
          hourlyRate={bookingMentor.hourlyRate || bookingMentor.roadmapMentoringPrice || 0}
          roadmapMentoringPrice={bookingMentor.roadmapMentoringPrice}
          journeyContext={{
            bookingType: 'ROADMAP_MENTORING',
            journeyId: workspaceJourneyId ?? undefined,
          }}
        />
      )}
    </div>
  );
});

RoadmapDetailViewer.displayName = 'RoadmapDetailViewer';

export default RoadmapDetailViewer;
