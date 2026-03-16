import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Sparkles, Target, X } from 'lucide-react';
import { RoadmapNode, RoadmapNodeStudyPlanRequest } from '../../types/Roadmap';
import './RoadmapNodeStudyPlanModal.css';

interface RoadmapNodeStudyPlanModalProps {
  isOpen: boolean;
  node: RoadmapNode | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (request: RoadmapNodeStudyPlanRequest) => Promise<void> | void;
}

type IntensityId = 'light' | 'balanced' | 'intensive';
type StudyWindowId = 'morning' | 'afternoon' | 'evening' | 'flexible';

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
  id: IntensityId;
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

const STUDY_WINDOWS: Record<
  StudyWindowId,
  {
    label: string;
    preferredTimeWindows: string[];
    earliestStartLocalTime: string;
    latestEndLocalTime: string;
  }
> = {
  morning: {
    label: 'Buổi sáng',
    preferredTimeWindows: ['07:00-10:00'],
    earliestStartLocalTime: '06:30',
    latestEndLocalTime: '21:30'
  },
  afternoon: {
    label: 'Buổi chiều',
    preferredTimeWindows: ['13:30-17:00'],
    earliestStartLocalTime: '08:00',
    latestEndLocalTime: '22:00'
  },
  evening: {
    label: 'Buổi tối',
    preferredTimeWindows: ['18:30-22:00'],
    earliestStartLocalTime: '09:00',
    latestEndLocalTime: '22:30'
  },
  flexible: {
    label: 'Linh hoạt',
    preferredTimeWindows: ['08:00-10:30', '19:00-21:30'],
    earliestStartLocalTime: '07:00',
    latestEndLocalTime: '22:30'
  }
};

const getTodayDate = (): string => new Date().toISOString().slice(0, 10);

const RoadmapNodeStudyPlanModal = ({
  isOpen,
  node,
  isSubmitting,
  onClose,
  onSubmit
}: RoadmapNodeStudyPlanModalProps) => {
  const [startDate, setStartDate] = useState<string>(getTodayDate());
  const [deadline, setDeadline] = useState<string>('');
  const [intensity, setIntensity] = useState<IntensityId>('balanced');
  const [studyWindow, setStudyWindow] = useState<StudyWindowId>('evening');
  const [selectedDays, setSelectedDays] = useState<string[]>(['MONDAY', 'WEDNESDAY', 'FRIDAY']);
  const [desiredOutcome, setDesiredOutcome] = useState<string>('');
  const [freeTimeDescription, setFreeTimeDescription] = useState<string>('');

  const intensityMeta = useMemo(
    () => INTENSITY_OPTIONS.find((item) => item.id === intensity) ?? INTENSITY_OPTIONS[1],
    [intensity]
  );

  useEffect(() => {
    if (!isOpen) return;
    setStartDate(getTodayDate());
    setDeadline('');
    setIntensity('balanced');
    setStudyWindow('evening');
    setSelectedDays(['MONDAY', 'WEDNESDAY', 'FRIDAY']);
    setDesiredOutcome('');
    setFreeTimeDescription('');
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
    const windowPreset = STUDY_WINDOWS[studyWindow];
    const normalizedDays = selectedDays.length > 0 ? selectedDays : ['MONDAY', 'WEDNESDAY', 'FRIDAY'];

    const payload: RoadmapNodeStudyPlanRequest = {
      startDate,
      timezone,
      deadline: deadline || undefined,
      preferredDays: normalizedDays,
      preferredTimeWindows: windowPreset.preferredTimeWindows,
      desiredOutcome: desiredOutcome.trim() || undefined,
      freeTimeDescription: freeTimeDescription.trim() || undefined,
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
      confirmLateNight: studyWindow === 'evening'
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
            <label className="roadmap-node-plan-modal__label">Ngày học trong tuần</label>
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
