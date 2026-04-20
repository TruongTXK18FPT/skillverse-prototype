import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Sparkles, Target, X } from 'lucide-react';
import { RoadmapNode, RoadmapNodeStudyPlanRequest } from '../../types/Roadmap';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import TicTacToeGame from '../game/tic-tac-toe/TicTacToeGame';
import { NodeLearningContext } from './nodeLearningContext';
import {
  DEADLINE_BEFORE_START_ERROR,
  getMaxDeadlineDate,
  getTodayDate,
  inferRoadmapStudyPlanDeadline,
  resolvePreferredStudyDays,
  resolvePreferredTimeWindows,
  resolveRoadmapWorkloadMinutes,
  STUDY_WINDOW_PRESETS,
  type StudyPlanIntensityId,
  type StudyWindowId,
} from './roadmapStudyPlanPolicy';
import './RoadmapNodeStudyPlanModal.css';

/**
 * When studyWindow is 'flexible', compute earliestStartLocalTime dynamically:
 * current time + 30 min buffer, rounded up to next 15-min mark.
 * For fixed windows (morning/afternoon/evening), use the preset default.
 */
const resolveEarliestStartTime = (
  studyWindow: StudyWindowId,
  presetDefault: string,
): string => {
  if (studyWindow !== 'flexible') {
    return presetDefault;
  }

  const now = new Date();
  // Add 30 minutes
  const withBuffer = new Date(now.getTime() + 30 * 60 * 1000);
  // Round up to next 15-minute mark
  const minutes = withBuffer.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  withBuffer.setMinutes(roundedMinutes);
  withBuffer.setSeconds(0);
  withBuffer.setMilliseconds(0);

  // Format as HH:MM
  const h = String(withBuffer.getHours()).padStart(2, '0');
  const m = String(withBuffer.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

interface RoadmapNodeStudyPlanModalProps {
  isOpen: boolean;
  node: RoadmapNode | null;
  learningContext?: NodeLearningContext | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (request: RoadmapNodeStudyPlanRequest) => Promise<void> | void;
  /** AI-prefilled params from Meowl study plan intent detection */
  aiPrefilledParams?: {
    deadline: string;
    intensity: StudyPlanIntensityId;
    studyWindow: StudyWindowId;
    selectedDays: string[];
  } | null;
  /** Roadmap type — determines deadline behavior */
  roadmapMode?: 'SKILL_BASED' | 'CAREER_BASED';
}

const NODE_PLAN_GAME_DELAY_MS = 7000;

const DAY_OPTIONS = [
  { value: 'MONDAY', label: 'T2' },
  { value: 'TUESDAY', label: 'T3' },
  { value: 'WEDNESDAY', label: 'T4' },
  { value: 'THURSDAY', label: 'T5' },
  { value: 'FRIDAY', label: 'T6' },
  { value: 'SATURDAY', label: 'T7' },
  { value: 'SUNDAY', label: 'CN' }
] as const;

const INTENSITY_OPTIONS: Array<{
  id: StudyPlanIntensityId;
  label: string;
  description: string;
  durationMinutes: number;
  maxSessionsPerDay: number;
}> = [
  {
    id: 'light',
    label: 'Nhẹ nhàng',
    description: 'Tiến độ chậm, phù hợp lịch bận',
    durationMinutes: 60,
    maxSessionsPerDay: 1
  },
  {
    id: 'balanced',
    label: 'Cân bằng',
    description: 'Ổn định theo tuần',
    durationMinutes: 90,
    maxSessionsPerDay: 2
  },
  {
    id: 'intensive',
    label: 'Tăng tốc',
    description: 'Tập trung cao để đẩy nhanh tiến độ',
    durationMinutes: 120,
    maxSessionsPerDay: 3
  }
];

const STUDY_WINDOWS: Record<StudyWindowId, { label: string }> = {
  morning: {
    label: 'Buổi sáng',
  },
  afternoon: {
    label: 'Buổi chiều',
  },
  evening: {
    label: 'Buổi tối',
  },
  flexible: {
    label: 'Linh hoạt',
  },
};

const RoadmapNodeStudyPlanModal = ({
  isOpen,
  node,
  learningContext,
  isSubmitting,
  onClose,
  onSubmit,
  aiPrefilledParams,
  roadmapMode,
}: RoadmapNodeStudyPlanModalProps) => {
  const [startDate, setStartDate] = useState<string>(getTodayDate());
  const [deadline, setDeadline] = useState<string>('');
  const [deadlineError, setDeadlineError] = useState<string>('');
  const [intensity, setIntensity] = useState<StudyPlanIntensityId>('balanced');
  const [studyWindow, setStudyWindow] = useState<StudyWindowId>('flexible');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [desiredOutcome, setDesiredOutcome] = useState<string>('');
  const [freeTimeDescription, setFreeTimeDescription] = useState<string>('');
  const [showSubmittingGame, setShowSubmittingGame] = useState(false);

  const intensityMeta = useMemo(
    () => INTENSITY_OPTIONS.find((item) => item.id === intensity) ?? INTENSITY_OPTIONS[1],
    [intensity]
  );
  const workloadMinutes = useMemo(
    () => resolveRoadmapWorkloadMinutes(node, learningContext?.primaryCourse),
    [learningContext?.primaryCourse, node],
  );
  const inferredPreferredDays = useMemo(
    () => resolvePreferredStudyDays(selectedDays, studyWindow),
    [selectedDays, studyWindow],
  );
  const inferredDeadline = useMemo(
    () => inferRoadmapStudyPlanDeadline({
      startDate,
      intensity,
      preferredDays: inferredPreferredDays,
      workloadMinutes,
      durationMinutes: intensityMeta.durationMinutes,
      maxSessionsPerDay: intensityMeta.maxSessionsPerDay,
      childBranchCount: 0,
    }),
    [
      inferredPreferredDays,
      intensity,
      intensityMeta.durationMinutes,
      intensityMeta.maxSessionsPerDay,
      startDate,
      workloadMinutes,
    ],
  );
  const plannerSummary = useMemo(() => {
    const primaryCourseLabel = learningContext?.primaryCourse
      ? learningContext.primaryCourse.title
      : 'Chưa có khóa học chính';
    const estimatedTimeLabel =
      node?.estimatedTimeMinutes && node.estimatedTimeMinutes > 0
        ? `${node.estimatedTimeMinutes} phút`
        : 'Linh hoạt';

    return [
      { label: 'Mục tiêu chính', value: learningContext?.objectiveSummary || node?.learningObjectives?.[0] || node?.title || 'Node này' },
      { label: 'Khóa học chính', value: primaryCourseLabel },
      { label: 'Thời lượng node', value: estimatedTimeLabel },
      { label: 'Tiêu chí hoàn thành', value: learningContext?.completionCriteriaSummary || 'Hoàn tất kế hoạch học cho node này.' },
    ];
  }, [learningContext, node?.estimatedTimeMinutes, node?.learningObjectives, node?.title]);

  useEffect(() => {
    if (!isOpen) return;
    setStartDate(getTodayDate());
    setDeadline('');
    setDeadlineError('');
    setIntensity('balanced');
    setStudyWindow('flexible');
    setSelectedDays([]);
    setDesiredOutcome('');
    setFreeTimeDescription('');
  }, [isOpen, node?.id]);

  // Apply AI-prefilled params when they change
  useEffect(() => {
    if (!aiPrefilledParams) return;
    if (aiPrefilledParams.deadline) setDeadline(aiPrefilledParams.deadline);
    if (aiPrefilledParams.intensity) setIntensity(aiPrefilledParams.intensity);
    if (aiPrefilledParams.studyWindow) setStudyWindow(aiPrefilledParams.studyWindow);
    if (aiPrefilledParams.selectedDays.length > 0) setSelectedDays(aiPrefilledParams.selectedDays);
  }, [aiPrefilledParams]);

  useEffect(() => {
    if (!isSubmitting) {
      setShowSubmittingGame(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSubmittingGame(true);
    }, NODE_PLAN_GAME_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isSubmitting]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !node) {
    return null;
  }

  const toggleDay = (dayValue: string) => {
    setSelectedDays((previous) => {
      if (previous.includes(dayValue)) {
        return previous.filter((value) => value !== dayValue);
      }
      return [...previous, dayValue];
    });
  };

  const handleSubmit = async () => {
    if (!startDate) {
      return;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
    const windowPreset = STUDY_WINDOW_PRESETS[studyWindow];
    const normalizedDays = inferredPreferredDays;
    const mergedDesiredOutcome = [
      learningContext?.objectiveSummary,
      desiredOutcome.trim(),
    ].filter(Boolean).join(' ');
    const mergedFreeTimeDescription = [freeTimeDescription.trim()].filter(Boolean).join(' ');
    const plannerTopics = Array.from(
      new Set([
        ...(node.learningObjectives ?? []),
        ...(node.keyConcepts ?? []),
        ...(learningContext?.primaryCourse?.learningObjectives ?? []),
      ].map((item) => item?.trim()).filter(Boolean) as string[]),
    ).slice(0, 8);

    const payload: RoadmapNodeStudyPlanRequest = {
      subjectName: learningContext?.primaryCourse
        ? `${node.title} - ${learningContext.primaryCourse.title}`
        : node.title,
      startDate,
      timezone,
      deadline: deadline || inferredDeadline,
      preferredDays: normalizedDays,
      preferredTimeWindows: resolvePreferredTimeWindows(studyWindow),
      desiredOutcome: mergedDesiredOutcome || undefined,
      freeTimeDescription: mergedFreeTimeDescription || undefined,
      intensityLevel: intensity,
      durationMinutes: intensityMeta.durationMinutes,
      maxSessionsPerDay: intensityMeta.maxSessionsPerDay,
      breakMinutesBetweenSessions: 10,
      maxDailyStudyMinutes: intensityMeta.durationMinutes * intensityMeta.maxSessionsPerDay,
      studyMethod: 'Active Recall + Practical Exercise',
      resourcesPreference: 'mixed resources',
      studyPreference: studyWindow,
      earliestStartLocalTime: resolveEarliestStartTime(studyWindow, windowPreset.earliestStartLocalTime),
      latestEndLocalTime: windowPreset.latestEndLocalTime,
      avoidLateNight: studyWindow !== 'evening',
      allowLateNight: studyWindow === 'evening',
      confirmLateNight: studyWindow === 'evening',
      topics: plannerTopics,
    };

    await onSubmit(payload);
  };

  return (
    <div className="roadmap-node-plan-modal__overlay" role="dialog" aria-modal="true">
      <div className="roadmap-node-plan-modal__container">
        <div className="roadmap-node-plan-modal__header">
          <div className="roadmap-node-plan-modal__title-wrap">
            <Sparkles size={18} />
            <h3 className="roadmap-node-plan-modal__title">Tạo kế hoạch AI cho node</h3>
          </div>
          <button
            type="button"
            className="roadmap-node-plan-modal__close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="roadmap-node-plan-modal__node-name">{node.title}</div>

        <div className="roadmap-node-plan-modal__body">
          <section className="roadmap-node-plan-modal__context-grid">
            {plannerSummary.map((item) => (
              <div key={item.label} className="roadmap-node-plan-modal__context-card">
                <span className="roadmap-node-plan-modal__context-label">{item.label}</span>
                <strong className="roadmap-node-plan-modal__context-value">{item.value}</strong>
              </div>
            ))}
          </section>

          <section className="roadmap-node-plan-modal__section">
            <label className="roadmap-node-plan-modal__label">
              <Target size={14} />
              Mục tiêu chi tiết (tuỳ chọn)
            </label>
            <textarea
              className="roadmap-node-plan-modal__textarea"
              placeholder="Ví dụ: Ưu tiên làm project thực tế, luyện theo ca intern, tập trung phần còn yếu."
              value={desiredOutcome}
              onChange={(event) => setDesiredOutcome(event.target.value)}
              rows={3}
            />
          </section>

          <section className="roadmap-node-plan-modal__section roadmap-node-plan-modal__grid-2">
            <label className="roadmap-node-plan-modal__label">
              <CalendarDays size={14} />
              Ngày bắt đầu
              <input
                type="date"
                className="roadmap-node-plan-modal__input"
                value={startDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setStartDate(value);
                  // Clear deadline + error if deadline < new startDate
                  if (deadline && value && deadline < value) {
                    setDeadline('');
                    setDeadlineError('');
                  }
                }}
                min={getTodayDate()}
              />
            </label>

            <label className="roadmap-node-plan-modal__label">
              <CalendarDays size={14} />
              {roadmapMode === 'CAREER_BASED' ? 'Deadline (bắt buộc)' : 'Deadline (tuỳ chọn)'}
              <input
                type="date"
                className="roadmap-node-plan-modal__input"
                value={deadline}
                onChange={(event) => {
                  const value = event.target.value;
                  setDeadline(value);
                  if (value && startDate && value < startDate) {
                    setDeadlineError(DEADLINE_BEFORE_START_ERROR);
                  } else {
                    setDeadlineError('');
                  }
                }}
                min={startDate || getTodayDate()}
                max={startDate ? getMaxDeadlineDate(startDate) : getMaxDeadlineDate(getTodayDate())}
              />
              {deadlineError && (
                <span className="deadline-warning">{deadlineError}</span>
              )}
            </label>
            {roadmapMode === 'CAREER_BASED' ? (
              <p className="roadmap-node-plan-modal__hint">
                Vì roadmap career có nhiều milestone, bạn hãy tự ước tính deadline phù hợp với lịch trình cá nhân.
              </p>
            ) : (
              <p className="roadmap-node-plan-modal__hint">
                Nếu bỏ trống, hệ thống sẽ tự ước tính deadline theo khối lượng node và cường độ học. Dự kiến: {inferredDeadline}.
              </p>
            )}
          </section>

          <section className="roadmap-node-plan-modal__section">
            <label className="roadmap-node-plan-modal__label">
              <Clock3 size={14} />
              Cường độ học
            </label>
            <div className="roadmap-node-plan-modal__choice-list">
              {INTENSITY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`roadmap-node-plan-modal__choice-item ${intensity === option.id ? 'is-active' : ''}`}
                  onClick={() => setIntensity(option.id)}
                >
                  <span className="roadmap-node-plan-modal__choice-title">{option.label}</span>
                  <span className="roadmap-node-plan-modal__choice-desc">{option.description}</span>
                  <span className="roadmap-node-plan-modal__choice-meta">
                    {option.durationMinutes} phút/phiên • tối đa {option.maxSessionsPerDay} phiên/ngày
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="roadmap-node-plan-modal__section">
            <label className="roadmap-node-plan-modal__label">
              <Clock3 size={14} />
              Khung giờ ưu tiên
            </label>
            <p className="roadmap-node-plan-modal__hint">
              Đây là preference. Nếu bạn không tinh chỉnh thêm, plan sẽ dùng preset khung giờ đã chọn.
            </p>
            <div className="roadmap-node-plan-modal__chip-list">
              {(Object.keys(STUDY_WINDOWS) as StudyWindowId[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`roadmap-node-plan-modal__chip ${studyWindow === key ? 'is-active' : ''}`}
                  onClick={() => setStudyWindow(key)}
                >
                  {STUDY_WINDOWS[key].label}
                </button>
              ))}
            </div>
          </section>

          <section className="roadmap-node-plan-modal__section">
            <label className="roadmap-node-plan-modal__label">Ngày học trong tuần (tuỳ chọn)</label>
            <p className="roadmap-node-plan-modal__hint">
              Bạn có thể để trống để hệ thống tự chọn lịch mặc định phù hợp với khung giờ ưu tiên.
            </p>
            <div className="roadmap-node-plan-modal__chip-list">
              {DAY_OPTIONS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={`roadmap-node-plan-modal__chip ${selectedDays.includes(day.value) ? 'is-active' : ''}`}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </section>

          <section className="roadmap-node-plan-modal__section">
            <label className="roadmap-node-plan-modal__label">Thời gian rảnh / ghi chú thêm (tuỳ chọn)</label>
            <textarea
              className="roadmap-node-plan-modal__textarea"
              placeholder="Ví dụ: Tối T2-T6 rảnh sau 20:00, cuối tuần có thể học 2 block."
              value={freeTimeDescription}
              onChange={(event) => setFreeTimeDescription(event.target.value)}
              rows={2}
            />
          </section>
        </div>

        <div className="roadmap-node-plan-modal__footer">
          <button
            type="button"
            className="roadmap-node-plan-modal__action roadmap-node-plan-modal__action--ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="button"
            className="roadmap-node-plan-modal__action roadmap-node-plan-modal__action--primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !startDate || (roadmapMode === 'CAREER_BASED' && !deadline)}
          >
            {isSubmitting ? 'Đang tạo kế hoạch...' : 'Tạo kế hoạch AI'}
          </button>
        </div>

        {isSubmitting && (
          <div
            className={`roadmap-node-plan-modal__loading-overlay ${showSubmittingGame ? 'roadmap-node-plan-modal__loading-overlay--split' : ''}`}
          >
            <div className="roadmap-node-plan-modal__loading-shell">
              <div className="roadmap-node-plan-modal__loading-loader">
                <MeowlKuruLoader
                  size="medium"
                  text="Meowl đang dựng Study Planner cho node này..."
                  layout="vertical"
                />

                {showSubmittingGame && (
                  <p className="roadmap-node-plan-modal__loading-hint">
                    Hệ thống đang xử lý lâu hơn dự kiến. Chơi một ván caro với Meowl trong lúc chờ nhé.
                  </p>
                )}
              </div>

              <aside
                className="roadmap-node-plan-modal__loading-game"
                aria-hidden={!showSubmittingGame}
              >
                {showSubmittingGame && (
                  <>
                    <header className="roadmap-node-plan-modal__loading-game-header">
                      <span className="roadmap-node-plan-modal__loading-eyebrow">MINI GAME KHI CHỜ</span>
                      <h3>MEOWL TIC-TAC-TOE</h3>
                    </header>
                    <div className="roadmap-node-plan-modal__loading-game-body">
                      <TicTacToeGame mode="embedded" />
                    </div>
                  </>
                )}
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapNodeStudyPlanModal;
