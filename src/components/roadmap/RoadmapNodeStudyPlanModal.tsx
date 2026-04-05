import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Sparkles, Target, X } from 'lucide-react';
import { RoadmapNode, RoadmapNodeStudyPlanRequest } from '../../types/Roadmap';
import { NodeLearningContext } from './nodeLearningContext';
import {
  inferRoadmapStudyPlanDeadline,
  resolvePreferredStudyDays,
  resolvePreferredTimeWindows,
  resolveRoadmapWorkloadMinutes,
  STUDY_WINDOW_PRESETS,
  type StudyPlanIntensityId,
  type StudyWindowId,
} from './roadmapStudyPlanPolicy';
import './RoadmapNodeStudyPlanModal.css';

interface RoadmapNodeStudyPlanModalProps {
  isOpen: boolean;
  node: RoadmapNode | null;
  learningContext?: NodeLearningContext | null;
  childBranchTitles?: string[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (request: RoadmapNodeStudyPlanRequest) => Promise<void> | void;
}

type ScopeMode = 'node_only' | 'node_with_children';

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

const getTodayDate = (): string => new Date().toISOString().slice(0, 10);

const RoadmapNodeStudyPlanModal = ({
  isOpen,
  node,
  learningContext,
  childBranchTitles = [],
  isSubmitting,
  onClose,
  onSubmit
}: RoadmapNodeStudyPlanModalProps) => {
  const [startDate, setStartDate] = useState<string>(getTodayDate());
  const [deadline, setDeadline] = useState<string>('');
  const [intensity, setIntensity] = useState<StudyPlanIntensityId>('balanced');
  const [studyWindow, setStudyWindow] = useState<StudyWindowId>('evening');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [desiredOutcome, setDesiredOutcome] = useState<string>('');
  const [freeTimeDescription, setFreeTimeDescription] = useState<string>('');
  const [scopeMode, setScopeMode] = useState<ScopeMode>('node_only');

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
      childBranchCount: scopeMode === 'node_with_children' ? childBranchTitles.length : 0,
    }),
    [
      childBranchTitles.length,
      inferredPreferredDays,
      intensity,
      intensityMeta.durationMinutes,
      intensityMeta.maxSessionsPerDay,
      scopeMode,
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
    setIntensity('balanced');
    setStudyWindow('evening');
    setSelectedDays([]);
    setDesiredOutcome('');
    setFreeTimeDescription('');
    setScopeMode('node_only');
  }, [isOpen, node?.id]);

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
    const scopeDescription =
      scopeMode === 'node_with_children' && childBranchTitles.length > 0
        ? `Phạm vi: tập trung node hiện tại và mở rộng sang các nhánh con trực tiếp gồm ${childBranchTitles.join(', ')}.`
        : 'Phạm vi: chỉ tập trung hoàn thành node hiện tại trước.';
    const mergedDesiredOutcome = [
      learningContext?.objectiveSummary,
      desiredOutcome.trim(),
      scopeDescription,
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
      earliestStartLocalTime: windowPreset.earliestStartLocalTime,
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
              Scope kế hoạch
            </label>
            <div className="roadmap-node-plan-modal__choice-list roadmap-node-plan-modal__choice-list--compact">
              <button
                type="button"
                className={`roadmap-node-plan-modal__choice-item ${scopeMode === 'node_only' ? 'is-active' : ''}`}
                onClick={() => setScopeMode('node_only')}
              >
                <span className="roadmap-node-plan-modal__choice-title">Chỉ node này</span>
                <span className="roadmap-node-plan-modal__choice-desc">Tập trung hoàn thành node hiện tại trước.</span>
              </button>
              <button
                type="button"
                className={`roadmap-node-plan-modal__choice-item ${scopeMode === 'node_with_children' ? 'is-active' : ''}`}
                onClick={() => setScopeMode('node_with_children')}
                disabled={childBranchTitles.length === 0}
              >
                <span className="roadmap-node-plan-modal__choice-title">Node này + nhánh con</span>
                <span className="roadmap-node-plan-modal__choice-desc">
                  {childBranchTitles.length > 0
                    ? `Mở rộng tiếp sang ${childBranchTitles.length} nhánh con trực tiếp.`
                    : 'Node này hiện chưa có nhánh con trực tiếp.'}
                </span>
              </button>
            </div>
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
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>

            <label className="roadmap-node-plan-modal__label">
              <CalendarDays size={14} />
              Deadline (tuỳ chọn)
              <input
                type="date"
                className="roadmap-node-plan-modal__input"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                min={startDate || undefined}
              />
            </label>
            <p className="roadmap-node-plan-modal__hint">
              Nếu bỏ trống, hệ thống sẽ tự ước tính deadline theo khối lượng node và cường độ học. Dự kiến hiện tại: {inferredDeadline}.
            </p>
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
            disabled={isSubmitting || !startDate}
          >
            {isSubmitting ? 'Đang tạo kế hoạch...' : 'Tạo kế hoạch AI'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapNodeStudyPlanModal;
