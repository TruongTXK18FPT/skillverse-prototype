import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FaRobot,
  FaTimes,
  FaMagic,
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaLightbulb,
  FaBrain,
  FaMoon,
  FaPlus,
  FaTrash,
  FaLock,
  FaGem,
  FaChevronDown,
  FaChevronUp,
  FaLayerGroup,
} from 'react-icons/fa';
import {
  GenerateScheduleRequest,
  StudySession,
  ScheduleHealthReport,
} from '../../../types/StudyPlan';
import { studyPlanService } from '../../../services/studyPlanService';
import { premiumService } from '../../../services/premiumService';
import { UserSubscriptionResponse } from '../../../data/premiumDTOs';
import { useNavigate } from 'react-router-dom';
import MeowlKuruLoader from '../../../components/kuru-loader/MeowlKuruLoader';
import '../../study-planner/styles/StudyPlanner.css';

interface AIAgentPlannerProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: (result?: {
    createdCount: number;
    subjectName: string;
  }) => Promise<void> | void;
}

type PlannerLoadingPhase =
  | 'generating'
  | 'analyzing'
  | 'optimizing'
  | 'saving'
  | null;

type SubjectPreset = {
  id: string;
  label: string;
  description: string;
  subjectName: string;
  topics: string[];
  resourcesPreference: string;
  studyMethod: string;
};

type GoalPreset = {
  id: string;
  label: string;
  description: string;
  outcomeTemplate: string;
};

type IntensityPreset = {
  id: string;
  label: string;
  description: string;
  durationMinutes: number;
  maxDailyStudyMinutes: number;
  maxSessionsPerDay: number;
  breakMinutes: number;
};

type AvailabilityPreset = {
  id: string;
  label: string;
  description: string;
  preferredDays: string[];
  preferredTimeWindows: { startTime: string; endTime: string }[];
  earliestStartLocalTime: string;
  latestEndLocalTime: string;
  chronotype: string;
  idealFocusWindows: string[];
};

type TimelinePreset = {
  id: string;
  label: string;
  description: string;
  offsetDays: number | null;
};

const DEFAULT_SUBJECT_PRESET_ID = 'frontend';
const DEFAULT_GOAL_PRESET_ID = 'foundation';
const DEFAULT_INTENSITY_PRESET_ID = 'balanced';
const DEFAULT_AVAILABILITY_PRESET_ID = 'weekday-evening';
const DEFAULT_TIMELINE_PRESET_ID = '30-days';

const SUBJECT_PRESETS: SubjectPreset[] = [
  {
    id: 'frontend',
    label: 'Frontend Web',
    description: 'React, UI, tối ưu trải nghiệm người dùng',
    subjectName: 'Lập trình Frontend',
    topics: ['HTML/CSS', 'JavaScript', 'React', 'State Management', 'UI Testing'],
    resourcesPreference: 'VIDEO',
    studyMethod: 'POMODORO',
  },
  {
    id: 'backend',
    label: 'Backend API',
    description: 'Java Spring Boot, DB, bảo mật API',
    subjectName: 'Backend với Spring Boot',
    topics: ['REST API', 'JPA/Hibernate', 'Security', 'PostgreSQL', 'Testing'],
    resourcesPreference: 'ARTICLE',
    studyMethod: 'DEEP_WORK',
  },
  {
    id: 'english',
    label: 'Tiếng Anh',
    description: 'Từ vựng, đọc hiểu, giao tiếp thực tế',
    subjectName: 'Tiếng Anh chuyên ngành',
    topics: ['Vocabulary', 'Reading', 'Listening', 'Speaking', 'Grammar'],
    resourcesPreference: 'MIXED',
    studyMethod: '52_17',
  },
  {
    id: 'data',
    label: 'Data Analysis',
    description: 'Excel, SQL, Python, trực quan dữ liệu',
    subjectName: 'Phân tích dữ liệu',
    topics: ['Excel', 'SQL', 'Python', 'Visualization', 'Business Insights'],
    resourcesPreference: 'MIXED',
    studyMethod: 'DEEP_WORK',
  },
  {
    id: 'custom',
    label: 'Tùy chỉnh',
    description: 'Tự nhập môn học của bạn',
    subjectName: '',
    topics: [],
    resourcesPreference: 'MIXED',
    studyMethod: 'POMODORO',
  },
];

const GOAL_PRESETS: GoalPreset[] = [
  {
    id: 'foundation',
    label: 'Xây nền vững',
    description: 'Ưu tiên kiến thức cốt lõi và thực hành cơ bản',
    outcomeTemplate:
      'Nắm chắc nền tảng {subject}, hoàn thành các bài tập cốt lõi và tự tin áp dụng vào bài thực hành.',
  },
  {
    id: 'project',
    label: 'Hoàn thành dự án',
    description: 'Tập trung kỹ năng để làm ra sản phẩm',
    outcomeTemplate:
      'Hoàn thành một dự án thực tế về {subject}, có thể demo sản phẩm và giải thích cách triển khai.',
  },
  {
    id: 'exam',
    label: 'Ôn thi/chứng chỉ',
    description: 'Tối ưu lịch học theo deadline và đề mẫu',
    outcomeTemplate:
      'Đạt kết quả tốt trong kỳ thi/chứng chỉ liên quan đến {subject}, kèm kế hoạch ôn tập theo từng tuần.',
  },
  {
    id: 'interview',
    label: 'Chuẩn bị phỏng vấn',
    description: 'Luyện kiến thức trọng tâm và câu hỏi thường gặp',
    outcomeTemplate:
      'Sẵn sàng phỏng vấn vị trí liên quan tới {subject}, trả lời được các câu hỏi cốt lõi và tình huống thực tế.',
  },
];

const INTENSITY_PRESETS: IntensityPreset[] = [
  {
    id: 'light',
    label: 'Nhẹ nhàng',
    description: '1-1.5 giờ/ngày, phù hợp lịch bận',
    durationMinutes: 420,
    maxDailyStudyMinutes: 90,
    maxSessionsPerDay: 2,
    breakMinutes: 15,
  },
  {
    id: 'balanced',
    label: 'Cân bằng',
    description: '2-3 giờ/ngày, tiến độ ổn định',
    durationMinutes: 900,
    maxDailyStudyMinutes: 180,
    maxSessionsPerDay: 3,
    breakMinutes: 15,
  },
  {
    id: 'intensive',
    label: 'Tăng tốc',
    description: '3-4 giờ/ngày, sprint theo mục tiêu',
    durationMinutes: 1440,
    maxDailyStudyMinutes: 240,
    maxSessionsPerDay: 4,
    breakMinutes: 20,
  },
];

const AVAILABILITY_PRESETS: AvailabilityPreset[] = [
  {
    id: 'weekday-evening',
    label: 'Tối ngày thường',
    description: 'Thứ 2 - Thứ 6, 19:00 - 22:00',
    preferredDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    preferredTimeWindows: [{ startTime: '19:00', endTime: '22:00' }],
    earliestStartLocalTime: '18:30',
    latestEndLocalTime: '22:30',
    chronotype: 'WOLF',
    idealFocusWindows: ['EVENING'],
  },
  {
    id: 'morning-focus',
    label: 'Sáng tập trung',
    description: 'Thứ 2 - Thứ 6, 06:30 - 09:00',
    preferredDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    preferredTimeWindows: [{ startTime: '06:30', endTime: '09:00' }],
    earliestStartLocalTime: '06:00',
    latestEndLocalTime: '21:30',
    chronotype: 'LION',
    idealFocusWindows: ['MORNING'],
  },
  {
    id: 'weekend-deep',
    label: 'Cuối tuần chuyên sâu',
    description: 'Thứ 7 - Chủ nhật, 08:00 - 12:00',
    preferredDays: ['SATURDAY', 'SUNDAY'],
    preferredTimeWindows: [{ startTime: '08:00', endTime: '12:00' }],
    earliestStartLocalTime: '07:00',
    latestEndLocalTime: '23:00',
    chronotype: 'BEAR',
    idealFocusWindows: ['MORNING'],
  },
  {
    id: 'flexible',
    label: 'Linh hoạt',
    description: 'Nhiều ngày, nhiều khung giờ',
    preferredDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SATURDAY'],
    preferredTimeWindows: [
      { startTime: '09:00', endTime: '11:30' },
      { startTime: '19:00', endTime: '21:30' },
    ],
    earliestStartLocalTime: '08:00',
    latestEndLocalTime: '22:30',
    chronotype: 'BEAR',
    idealFocusWindows: ['MORNING', 'EVENING'],
  },
];

const TIMELINE_PRESETS: TimelinePreset[] = [
  {
    id: '14-days',
    label: '2 tuần',
    description: 'Phù hợp ôn nhanh hoặc mini sprint',
    offsetDays: 14,
  },
  {
    id: '30-days',
    label: '1 tháng',
    description: 'Cân bằng giữa tốc độ và chất lượng',
    offsetDays: 30,
  },
  {
    id: '60-days',
    label: '2 tháng',
    description: 'Chi tiết hơn cho mục tiêu lớn',
    offsetDays: 60,
  },
  {
    id: 'custom',
    label: 'Tự chọn deadline',
    description: 'Nhập hạn chót thủ công',
    offsetDays: null,
  },
];

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Thứ 2',
  TUESDAY: 'Thứ 3',
  WEDNESDAY: 'Thứ 4',
  THURSDAY: 'Thứ 5',
  FRIDAY: 'Thứ 6',
  SATURDAY: 'Thứ 7',
  SUNDAY: 'Chủ nhật',
};

const getPresetById = <T extends { id: string }>(items: T[], id: string): T =>
  items.find((item) => item.id === id) ?? items[0];

const toInputDate = (date: Date): string => {
  const normalized = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return normalized.toISOString().split('T')[0];
};

const addDaysToDate = (baseDate: string, offset: number): string => {
  const parsed = new Date(`${baseDate}T00:00:00`);
  parsed.setDate(parsed.getDate() + offset);
  return toInputDate(parsed);
};

const buildOutcome = (goalPreset: GoalPreset, subjectName: string): string => {
  const safeSubject = subjectName?.trim() || 'môn học đã chọn';
  return goalPreset.outcomeTemplate.replace('{subject}', safeSubject);
};

const buildPresetDrivenFormData = (
  startDate: string,
  subjectPresetId: string,
  _goalPresetId: string,
  intensityPresetId: string,
  availabilityPresetId: string,
  timelinePresetId: string,
): GenerateScheduleRequest => {
  const subjectPreset = getPresetById(SUBJECT_PRESETS, subjectPresetId);
  const intensityPreset = getPresetById(INTENSITY_PRESETS, intensityPresetId);
  const availabilityPreset = getPresetById(AVAILABILITY_PRESETS, availabilityPresetId);
  const timelinePreset = getPresetById(TIMELINE_PRESETS, timelinePresetId);

  return {
    // Keep initial form lean, avoid pre-filling too many user-facing inputs.
    subjectName: '',
    topics: [],
    desiredOutcome: '',
    studyMethod: subjectPreset.studyMethod,
    resourcesPreference: subjectPreset.resourcesPreference,
    startDate,
    deadline:
      timelinePreset.offsetDays !== null
        ? addDaysToDate(startDate, timelinePreset.offsetDays)
        : '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    durationMinutes: intensityPreset.durationMinutes,
    breakMinutesBetweenSessions: intensityPreset.breakMinutes,
    maxSessionsPerDay: intensityPreset.maxSessionsPerDay,
    maxDailyStudyMinutes: intensityPreset.maxDailyStudyMinutes,
    preferredDays: [],
    preferredTimeWindows: [],
    studyPreference: 'BALANCED',
    chronotype: availabilityPreset.chronotype,
    idealFocusWindows: [...availabilityPreset.idealFocusWindows],
    earliestStartLocalTime: availabilityPreset.earliestStartLocalTime,
    latestEndLocalTime: availabilityPreset.latestEndLocalTime,
    avoidLateNight: true,
    allowLateNight: false,
  };
};

const AIAgentPlanner: React.FC<AIAgentPlannerProps> = ({
  isOpen,
  onClose,
  onPlanGenerated,
}) => {
  const navigate = useNavigate();

  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<PlannerLoadingPhase>(null);
  const [error, setError] = useState<string | null>(null);

  const [checkingPremium, setCheckingPremium] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [aiModelName, setAiModelName] = useState<string>('Mistral Small');

  const [selectedSubjectPresetId, setSelectedSubjectPresetId] = useState<string>(
    DEFAULT_SUBJECT_PRESET_ID,
  );
  const [selectedGoalPresetId, setSelectedGoalPresetId] = useState<string>(
    DEFAULT_GOAL_PRESET_ID,
  );
  const [selectedIntensityPresetId, setSelectedIntensityPresetId] = useState<string>(
    DEFAULT_INTENSITY_PRESET_ID,
  );
  const [selectedAvailabilityPresetId, setSelectedAvailabilityPresetId] = useState<string>(
    DEFAULT_AVAILABILITY_PRESET_ID,
  );
  const [selectedTimelinePresetId, setSelectedTimelinePresetId] = useState<string>(
    DEFAULT_TIMELINE_PRESET_ID,
  );
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const initialFormData = useMemo(() => {
    const today = toInputDate(new Date());
    return buildPresetDrivenFormData(
      today,
      DEFAULT_SUBJECT_PRESET_ID,
      DEFAULT_GOAL_PRESET_ID,
      DEFAULT_INTENSITY_PRESET_ID,
      DEFAULT_AVAILABILITY_PRESET_ID,
      DEFAULT_TIMELINE_PRESET_ID,
    );
  }, []);

  const [formData, setFormData] = useState<GenerateScheduleRequest>(initialFormData);
  const [topicInput, setTopicInput] = useState('');
  const [showTopicInput, setShowTopicInput] = useState(false);

  const [generatedSessions, setGeneratedSessions] = useState<StudySession[]>([]);
  const [healthReport, setHealthReport] = useState<ScheduleHealthReport | null>(null);
  const [showLateNightConfirm, setShowLateNightConfirm] = useState(false);

  const activeSubjectPreset = useMemo(
    () => getPresetById(SUBJECT_PRESETS, selectedSubjectPresetId),
    [selectedSubjectPresetId],
  );

  const activeGoalPreset = useMemo(
    () => getPresetById(GOAL_PRESETS, selectedGoalPresetId),
    [selectedGoalPresetId],
  );

  const activeIntensityPreset = useMemo(
    () => getPresetById(INTENSITY_PRESETS, selectedIntensityPresetId),
    [selectedIntensityPresetId],
  );

  const activeAvailabilityPreset = useMemo(
    () => getPresetById(AVAILABILITY_PRESETS, selectedAvailabilityPresetId),
    [selectedAvailabilityPresetId],
  );

  const activeTimelinePreset = useMemo(
    () => getPresetById(TIMELINE_PRESETS, selectedTimelinePresetId),
    [selectedTimelinePresetId],
  );

  const recommendedTopics = useMemo(() => {
    const baseTopics = activeSubjectPreset.topics;
    const currentTopics = formData.topics || [];
    return Array.from(new Set([...baseTopics, ...currentTopics])).filter(Boolean);
  }, [activeSubjectPreset.topics, formData.topics]);

  const resetPlannerState = () => {
    const today = toInputDate(new Date());
    setCheckingPremium(true);
    setSubscription(null);
    setIsPremium(false);
    setSelectedSubjectPresetId(DEFAULT_SUBJECT_PRESET_ID);
    setSelectedGoalPresetId(DEFAULT_GOAL_PRESET_ID);
    setSelectedIntensityPresetId(DEFAULT_INTENSITY_PRESET_ID);
    setSelectedAvailabilityPresetId(DEFAULT_AVAILABILITY_PRESET_ID);
    setSelectedTimelinePresetId(DEFAULT_TIMELINE_PRESET_ID);
    setShowAdvancedOptions(false);
    setShowTopicInput(false);
    setTopicInput('');
    setStep('form');
    setError(null);
    setLoading(false);
    setLoadingPhase(null);
    setGeneratedSessions([]);
    setHealthReport(null);
    setShowLateNightConfirm(false);
    setFormData(
      buildPresetDrivenFormData(
        today,
        DEFAULT_SUBJECT_PRESET_ID,
        DEFAULT_GOAL_PRESET_ID,
        DEFAULT_INTENSITY_PRESET_ID,
        DEFAULT_AVAILABILITY_PRESET_ID,
        DEFAULT_TIMELINE_PRESET_ID,
      ),
    );
  };

  useEffect(() => {
    if (!isOpen) {
      document.body.classList.remove('modal-open');
      return;
    }

    document.body.classList.add('modal-open');
    resetPlannerState();

    const checkPremium = async () => {
      try {
        const sub = await premiumService.getCurrentSubscription();
        setSubscription(sub);

        if (sub && sub.isActive && sub.plan.planType !== 'FREE_TIER') {
          setIsPremium(true);
          const planName = sub.plan.name.toLowerCase();
          const planType = sub.plan.planType;
          if ((planName.includes('mentor') && planName.includes('pro')) || planType === 'PREMIUM_PLUS') {
            setAiModelName('Mistral Large (Premium)');
          } else {
            setAiModelName('Mistral Small (Standard)');
          }
        } else {
          setIsPremium(false);
        }
      } catch (premiumError) {
        console.error('Failed to check premium status', premiumError);
        setIsPremium(false);
      } finally {
        setCheckingPremium(false);
      }
    };

    void checkPremium();

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;

    if (type === 'checkbox') {
      const checked = (event.target as HTMLInputElement).checked;
      setFormData((previous) => ({ ...previous, [name]: checked }));
      return;
    }

    if (type === 'number') {
      const numericValue = Number(value);
      setFormData((previous) => ({ ...previous, [name]: Number.isNaN(numericValue) ? 0 : numericValue }));
      return;
    }

    if (name === 'startDate') {
      setFormData((previous) => {
        const nextState: GenerateScheduleRequest = { ...previous, startDate: value };
        const timelinePreset = getPresetById(TIMELINE_PRESETS, selectedTimelinePresetId);
        if (timelinePreset.offsetDays !== null) {
          nextState.deadline = addDaysToDate(value, timelinePreset.offsetDays);
        }
        return nextState;
      });
      return;
    }

    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handlePresetSubjectChange = (presetId: string) => {
    const preset = getPresetById(SUBJECT_PRESETS, presetId);
    setSelectedSubjectPresetId(presetId);
    setFormData((previous) => {
      const previousPreset = getPresetById(SUBJECT_PRESETS, selectedSubjectPresetId);
      const hasManualSubjectName =
        !!previous.subjectName?.trim() &&
        previous.subjectName.trim() !== previousPreset.subjectName;

      if (presetId === 'custom') {
        return {
          ...previous,
          subjectName: hasManualSubjectName ? previous.subjectName : '',
          resourcesPreference: 'MIXED',
          studyMethod: 'POMODORO',
        };
      }

      return {
        ...previous,
        subjectName: hasManualSubjectName ? previous.subjectName : preset.subjectName,
        resourcesPreference: preset.resourcesPreference,
        studyMethod: preset.studyMethod,
      };
    });
  };

  const handlePresetGoalChange = (presetId: string) => {
    setSelectedGoalPresetId(presetId);
    setFormData((previous) => ({
      ...previous,
      desiredOutcome: previous.desiredOutcome?.trim()
        ? previous.desiredOutcome
        : '',
    }));
  };

  const handlePresetIntensityChange = (presetId: string) => {
    const preset = getPresetById(INTENSITY_PRESETS, presetId);
    setSelectedIntensityPresetId(presetId);
    setFormData((previous) => ({
      ...previous,
      durationMinutes: preset.durationMinutes,
      breakMinutesBetweenSessions: preset.breakMinutes,
      maxSessionsPerDay: preset.maxSessionsPerDay,
      maxDailyStudyMinutes: preset.maxDailyStudyMinutes,
    }));
  };

  const handlePresetAvailabilityChange = (presetId: string) => {
    const preset = getPresetById(AVAILABILITY_PRESETS, presetId);
    setSelectedAvailabilityPresetId(presetId);
    setFormData((previous) => ({
      ...previous,
      preferredDays: [...preset.preferredDays],
      preferredTimeWindows: preset.preferredTimeWindows.map((window) => ({ ...window })),
      earliestStartLocalTime: preset.earliestStartLocalTime,
      latestEndLocalTime: preset.latestEndLocalTime,
      chronotype: preset.chronotype,
      idealFocusWindows: [...preset.idealFocusWindows],
    }));
  };

  const handlePresetTimelineChange = (presetId: string) => {
    const preset = getPresetById(TIMELINE_PRESETS, presetId);
    setSelectedTimelinePresetId(presetId);
    setFormData((previous) => ({
      ...previous,
      deadline:
        preset.offsetDays !== null ? addDaysToDate(previous.startDate, preset.offsetDays) : previous.deadline,
    }));
  };

  const handleTopicAdd = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const nextTopic = topicInput.trim();
    if (!nextTopic) return;

    setFormData((previous) => {
      const currentTopics = previous.topics || [];
      const hasTopic = currentTopics.some(
        (topic) => topic.toLowerCase() === nextTopic.toLowerCase(),
      );
      if (hasTopic) return previous;
      return {
        ...previous,
        topics: [...currentTopics, nextTopic],
      };
    });

    setTopicInput('');
  };

  const toggleTopic = (topic: string) => {
    setFormData((previous) => {
      const currentTopics = previous.topics || [];
      const exists = currentTopics.includes(topic);
      return {
        ...previous,
        topics: exists
          ? currentTopics.filter((item) => item !== topic)
          : [...currentTopics, topic],
      };
    });
  };

  const removeTopic = (topic: string) => {
    setFormData((previous) => ({
      ...previous,
      topics: (previous.topics || []).filter((item) => item !== topic),
    }));
  };

  const toggleDay = (day: string) => {
    setFormData((previous) => {
      const currentDays = previous.preferredDays || [];
      const nextDays = currentDays.includes(day)
        ? currentDays.filter((item) => item !== day)
        : [...currentDays, day];
      return { ...previous, preferredDays: nextDays };
    });
  };

  const handleTimeWindowChange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string,
  ) => {
    const nextWindows = [...(formData.preferredTimeWindows || [])];
    if (!nextWindows[index]) return;
    nextWindows[index] = { ...nextWindows[index], [field]: value };
    setFormData((previous) => ({ ...previous, preferredTimeWindows: nextWindows }));
  };

  const addTimeWindow = () => {
    setFormData((previous) => ({
      ...previous,
      preferredTimeWindows: [
        ...(previous.preferredTimeWindows || []),
        { startTime: '09:00', endTime: '11:00' },
      ],
    }));
  };

  const removeTimeWindow = (index: number) => {
    setFormData((previous) => ({
      ...previous,
      preferredTimeWindows: (previous.preferredTimeWindows || []).filter((_, i) => i !== index),
    }));
  };

  const normalizeRequest = (): GenerateScheduleRequest => {
    const normalizedTopics = (formData.topics || [])
      .map((topic) => topic.trim())
      .filter(Boolean);
    const fallbackTopics = activeSubjectPreset.topics;
    const fallbackSubjectName = activeSubjectPreset.id === 'custom'
      ? ''
      : activeSubjectPreset.subjectName;
    const fallbackPreferredDays = activeAvailabilityPreset.preferredDays || [];
    const fallbackPreferredTimeWindows = (activeAvailabilityPreset.preferredTimeWindows || []).map(
      (window) => ({ ...window }),
    );

    const normalizedSubjectName = formData.subjectName.trim() || fallbackSubjectName;
    const normalizedPreferredDays = (formData.preferredDays || []).length > 0
      ? [...(formData.preferredDays || [])]
      : [...fallbackPreferredDays];
    const normalizedPreferredTimeWindows = (formData.preferredTimeWindows || []).length > 0
      ? (formData.preferredTimeWindows || []).map((window) => ({ ...window }))
      : fallbackPreferredTimeWindows;

    return {
      ...formData,
      subjectName: normalizedSubjectName,
      topics: normalizedTopics.length > 0 ? normalizedTopics : fallbackTopics,
      desiredOutcome:
        formData.desiredOutcome?.trim() || buildOutcome(activeGoalPreset, normalizedSubjectName),
      studyMethod: formData.studyMethod || activeSubjectPreset.studyMethod,
      resourcesPreference: formData.resourcesPreference || activeSubjectPreset.resourcesPreference,
      durationMinutes:
        formData.durationMinutes && formData.durationMinutes > 0
          ? formData.durationMinutes
          : activeIntensityPreset.durationMinutes,
      breakMinutesBetweenSessions:
        formData.breakMinutesBetweenSessions && formData.breakMinutesBetweenSessions > 0
          ? formData.breakMinutesBetweenSessions
          : activeIntensityPreset.breakMinutes,
      maxSessionsPerDay:
        formData.maxSessionsPerDay && formData.maxSessionsPerDay > 0
          ? formData.maxSessionsPerDay
          : activeIntensityPreset.maxSessionsPerDay,
      maxDailyStudyMinutes:
        formData.maxDailyStudyMinutes && formData.maxDailyStudyMinutes > 0
          ? formData.maxDailyStudyMinutes
          : activeIntensityPreset.maxDailyStudyMinutes,
      deadline:
        formData.deadline ||
        (activeTimelinePreset.offsetDays !== null
          ? addDaysToDate(formData.startDate, activeTimelinePreset.offsetDays)
          : ''),
      preferredDays: normalizedPreferredDays,
      preferredTimeWindows: normalizedPreferredTimeWindows,
      chronotype: formData.chronotype || activeAvailabilityPreset.chronotype,
      idealFocusWindows:
        (formData.idealFocusWindows || []).length > 0
          ? [...(formData.idealFocusWindows || [])]
          : [...(activeAvailabilityPreset.idealFocusWindows || [])],
      earliestStartLocalTime:
        formData.earliestStartLocalTime || activeAvailabilityPreset.earliestStartLocalTime,
      latestEndLocalTime:
        formData.latestEndLocalTime || activeAvailabilityPreset.latestEndLocalTime,
    };
  };

  const handleGenerateProposal = async () => {
    const requestPayload = normalizeRequest();

    if (!requestPayload.subjectName) {
      setError('Vui lòng chọn hoặc nhập môn học trước khi tạo kế hoạch.');
      return;
    }
    if (!requestPayload.deadline) {
      setError('Vui lòng chọn deadline cho kế hoạch học tập.');
      return;
    }
    if (!requestPayload.preferredDays || requestPayload.preferredDays.length === 0) {
      setError('Vui lòng chọn ít nhất 1 ngày học trong tuần.');
      return;
    }
    if (!requestPayload.preferredTimeWindows || requestPayload.preferredTimeWindows.length === 0) {
      setError('Vui lòng thêm ít nhất 1 khung giờ học.');
      return;
    }

    setLoading(true);
    setLoadingPhase('generating');
    setError(null);

    try {
      const sessions = await studyPlanService.generateProposal(requestPayload);
      setFormData(requestPayload);
      setGeneratedSessions(sessions);
      setStep('preview');
      setLoadingPhase('analyzing');
      await checkHealth(sessions, requestPayload);
    } catch (generateError: any) {
      console.error(generateError);
      const message =
        generateError.response?.data?.message ||
        'Không thể tạo đề xuất lịch trình. Vui lòng thử lại.';
      setError(message);
    } finally {
      setLoading(false);
      setLoadingPhase(null);
    }
  };

  const checkHealth = async (
    sessions: StudySession[],
    userPreferences: GenerateScheduleRequest = formData,
  ) => {
    try {
      const report = await studyPlanService.checkScheduleHealth({
        sessions,
        userPreferences,
      });
      setHealthReport(report);
    } catch (healthError) {
      console.error('Health check failed', healthError);
      setHealthReport(null);
    }
  };

  const handleSuggestFix = async () => {
    if (!healthReport) return;

    setLoading(true);
    setLoadingPhase('optimizing');
    try {
      const report = await studyPlanService.suggestHealthyAdjustments({
        sessions: generatedSessions,
        userPreferences: formData,
      });

      if (report.adjustedSessions) {
        setGeneratedSessions(report.adjustedSessions);
        await checkHealth(report.adjustedSessions, formData);
      }
    } catch (suggestError) {
      console.error('Suggest fix failed', suggestError);
      setError('Không thể đề xuất chỉnh sửa lịch học vào lúc này.');
    } finally {
      setLoading(false);
      setLoadingPhase(null);
    }
  };

  const handleConfirmSave = async () => {
    if (generatedSessions.length === 0) {
      setError('Chưa có phiên học nào để áp dụng vào Study Planner.');
      return;
    }

    const hasLateNightSessions = generatedSessions.some((session) => {
      const hour = new Date(session.startTime).getHours();
      return hour >= 23 || hour < 5;
    });

    if (hasLateNightSessions && !formData.allowLateNight && !showLateNightConfirm) {
      setShowLateNightConfirm(true);
      return;
    }

    setLoading(true);
    setLoadingPhase('saving');
    try {
      const createRequests = generatedSessions.map((session) => ({
        title: session.title,
        startTime: session.startTime,
        endTime: session.endTime,
        description: session.description,
      }));

      const createdSessions = await studyPlanService.createSessionsBatch(createRequests);
      await Promise.resolve(
        onPlanGenerated({
          createdCount: createdSessions.length,
          subjectName:
            formData.subjectName?.trim() ||
            (activeSubjectPreset.id !== 'custom'
              ? activeSubjectPreset.subjectName
              : 'Study plan'),
        }),
      );
      onClose();
    } catch (saveError) {
      console.error('Failed to save schedule', saveError);
      setError('Không thể lưu lịch trình. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setLoadingPhase(null);
    }
  };

  const preferredDaySummary = (formData.preferredDays || [])
    .map((day) => DAY_LABELS[day] || day)
    .join(', ');

  const preferredWindowSummary = (formData.preferredTimeWindows || [])
    .map((window) => `${window.startTime} - ${window.endTime}`)
    .join(' | ');

  const fallbackPreferredDaySummary = (activeAvailabilityPreset.preferredDays || [])
    .map((day) => DAY_LABELS[day] || day)
    .join(', ');

  const fallbackPreferredWindowSummary = (activeAvailabilityPreset.preferredTimeWindows || [])
    .map((window) => `${window.startTime} - ${window.endTime}`)
    .join(' | ');

  const effectivePreferredDaySummary =
    preferredDaySummary || (fallbackPreferredDaySummary ? `Theo mẫu: ${fallbackPreferredDaySummary}` : '');

  const effectivePreferredWindowSummary =
    preferredWindowSummary || (fallbackPreferredWindowSummary ? `Theo mẫu: ${fallbackPreferredWindowSummary}` : '');

  const healthIssues = healthReport?.issues ?? [];
  const healthOverallScore = healthReport?.overallScore ?? 100;
  const loadingMessage =
    loadingPhase === 'generating'
      ? 'Meowl Kuru đang tạo đề xuất study plan...'
      : loadingPhase === 'analyzing'
        ? 'Meowl Kuru đang phân tích sức khỏe lịch học...'
        : loadingPhase === 'optimizing'
          ? 'Meowl Kuru đang tối ưu lại lịch học...'
          : loadingPhase === 'saving'
            ? 'Meowl Kuru đang lưu study plan vào bảng của bạn...'
            : '';

  return (
    <div className="study-plan-modal-overlay" onClick={onClose}>
      <div className="study-plan-modal theme-gold" onClick={(event) => event.stopPropagation()}>
        <div className="study-plan-modal-header">
          <div className="study-plan-modal-title">
            <FaRobot className="study-plan-ai-icon" />
            <span>AI Study Planner</span>
            {isPremium && (
              <span className="study-plan-ai-model-badge">
                <FaBrain size={12} style={{ marginRight: 4 }} />
                {aiModelName}
              </span>
            )}
          </div>
          <button className="study-plan-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="study-plan-modal-content" style={{ position: 'relative' }}>
          {loadingPhase && !checkingPremium && (
            <div className="study-plan-loading-overlay study-plan-loading-overlay--modal">
              <MeowlKuruLoader size="medium" text={loadingMessage} />
            </div>
          )}

          {checkingPremium ? (
            <div className="study-plan-loading-overlay">
              <MeowlKuruLoader text="Đang kiểm tra quyền truy cập..." size="small" />
            </div>
          ) : !isPremium ? (
            <div className="study-plan-premium-lock">
              <div className="study-plan-lock-icon">
                <FaLock size={48} />
              </div>
              <h3>Tính năng Premium</h3>
              <p>
                AI Study Planner chỉ dành cho thành viên gói <strong>Skill-Plus</strong>,
                <strong> Student Pack</strong> hoặc <strong>Mentor-Pro</strong>.
              </p>
              <div className="study-plan-premium-benefits">
                <div className="benefit-item">
                  <FaCheckCircle /> Tạo lịch học tự động bằng AI
                </div>
                <div className="benefit-item">
                  <FaCheckCircle /> Tối ưu theo Chronotype và sức bền học tập
                </div>
                <div className="benefit-item">
                  <FaCheckCircle /> Đề xuất phiên học chi tiết, dễ áp dụng
                </div>
              </div>
              <button className="study-plan-upgrade-btn" onClick={() => navigate('/premium')}>
                <FaGem /> Nâng cấp ngay
              </button>
            </div>
          ) : step === 'form' ? (
            <div className="study-plan-ai-form">
              <div className="study-plan-ai-quick-intro">
                <div className="study-plan-ai-quick-intro-title">
                  <FaMagic /> Chọn nhanh và áp dụng
                </div>
                <p>
                  Chỉ cần chọn các cấu hình bên dưới. AI sẽ tự thiết lập thông số chi tiết để tạo
                  Study Planner đầy đủ như trước nhưng giảm nhập tay.
                </p>
                <div className="study-plan-ai-quick-meta">
                  <span>Gói hiện tại: {subscription?.plan?.name || 'Premium'}</span>
                  <span>Múi giờ: {formData.timezone}</span>
                </div>
              </div>

              <div className="study-plan-ai-quick-section">
                <div className="study-plan-ai-section-title">
                  <FaLayerGroup /> 1. Chọn lĩnh vực học tập
                </div>
                <div className="study-plan-ai-choice-grid">
                  {SUBJECT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className={`study-plan-ai-choice-card ${
                        selectedSubjectPresetId === preset.id
                          ? 'study-plan-ai-choice-card--active'
                          : ''
                      }`}
                      onClick={() => handlePresetSubjectChange(preset.id)}
                    >
                      <span className="study-plan-ai-choice-title">{preset.label}</span>
                      <span className="study-plan-ai-choice-desc">{preset.description}</span>
                    </button>
                  ))}
                </div>

                {selectedSubjectPresetId === 'custom' && (
                  <div className="study-plan-ai-form-group study-plan-ai-form-group--compact">
                    <label>Tên môn học/chủ đề</label>
                    <input
                      type="text"
                      name="subjectName"
                      value={formData.subjectName}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: Node.js nâng cao, IELTS Speaking..."
                      className="study-plan-input"
                    />
                  </div>
                )}
              </div>

              <div className="study-plan-ai-quick-section">
                <div className="study-plan-ai-section-title">
                  <FaBrain /> 2. Mục tiêu và cường độ học
                </div>
                <div className="study-plan-ai-subgroup-label">Mục tiêu học tập</div>
                <div className="study-plan-ai-choice-grid">
                  {GOAL_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className={`study-plan-ai-choice-card ${
                        selectedGoalPresetId === preset.id
                          ? 'study-plan-ai-choice-card--active'
                          : ''
                      }`}
                      onClick={() => handlePresetGoalChange(preset.id)}
                    >
                      <span className="study-plan-ai-choice-title">{preset.label}</span>
                      <span className="study-plan-ai-choice-desc">{preset.description}</span>
                    </button>
                  ))}
                </div>
                <div className="study-plan-ai-subgroup-label">Cường độ học</div>
                <div className="study-plan-ai-choice-grid study-plan-ai-choice-grid--compact">
                  {INTENSITY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className={`study-plan-ai-choice-card ${
                        selectedIntensityPresetId === preset.id
                          ? 'study-plan-ai-choice-card--active'
                          : ''
                      }`}
                      onClick={() => handlePresetIntensityChange(preset.id)}
                    >
                      <span className="study-plan-ai-choice-title">{preset.label}</span>
                      <span className="study-plan-ai-choice-desc">{preset.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="study-plan-ai-quick-section">
                <div className="study-plan-ai-section-title">
                  <FaCalendarAlt /> 3. Lịch học và deadline
                </div>
                <div className="study-plan-ai-subgroup-label">Lịch rảnh mẫu</div>
                <div className="study-plan-ai-choice-grid">
                  {AVAILABILITY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className={`study-plan-ai-choice-card ${
                        selectedAvailabilityPresetId === preset.id
                          ? 'study-plan-ai-choice-card--active'
                          : ''
                      }`}
                      onClick={() => handlePresetAvailabilityChange(preset.id)}
                    >
                      <span className="study-plan-ai-choice-title">{preset.label}</span>
                      <span className="study-plan-ai-choice-desc">{preset.description}</span>
                    </button>
                  ))}
                </div>
                <div className="study-plan-ai-subgroup-label">Mốc thời gian</div>
                <div className="study-plan-ai-choice-grid study-plan-ai-choice-grid--compact">
                  {TIMELINE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className={`study-plan-ai-choice-card ${
                        selectedTimelinePresetId === preset.id
                          ? 'study-plan-ai-choice-card--active'
                          : ''
                      }`}
                      onClick={() => handlePresetTimelineChange(preset.id)}
                    >
                      <span className="study-plan-ai-choice-title">{preset.label}</span>
                      <span className="study-plan-ai-choice-desc">{preset.description}</span>
                    </button>
                  ))}
                </div>

                <div className="study-plan-ai-form-row">
                  <div className="study-plan-ai-form-group">
                    <label>Ngày bắt đầu</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="study-plan-input"
                    />
                  </div>
                  <div className="study-plan-ai-form-group">
                    <label>Deadline</label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      className="study-plan-input"
                      disabled={selectedTimelinePresetId !== 'custom'}
                    />
                  </div>
                </div>
              </div>

              <div className="study-plan-ai-quick-section">
                <div className="study-plan-ai-section-title">
                  <FaClock /> Chủ đề học (chọn nhanh)
                </div>
                <div className="study-plan-ai-topic-cloud">
                  {recommendedTopics.map((topic) => (
                    <button
                      key={topic}
                      className={`study-plan-ai-topic-pill ${
                        (formData.topics || []).includes(topic)
                          ? 'study-plan-ai-topic-pill--active'
                          : ''
                      }`}
                      onClick={() => toggleTopic(topic)}
                    >
                      {topic}
                    </button>
                  ))}
                  <button
                    className="study-plan-ai-topic-pill study-plan-ai-topic-pill--add"
                    onClick={() => setShowTopicInput((previous) => !previous)}
                  >
                    <FaPlus size={11} /> Thêm chủ đề
                  </button>
                </div>

                {showTopicInput && (
                  <div className="study-plan-ai-form-group study-plan-ai-form-group--compact">
                    <label>Nhập chủ đề mới (nhấn Enter để thêm)</label>
                    <input
                      type="text"
                      value={topicInput}
                      onChange={(event) => setTopicInput(event.target.value)}
                      onKeyDown={handleTopicAdd}
                      placeholder="Ví dụ: RESTful API, Data Modeling..."
                      className="study-plan-input"
                    />
                  </div>
                )}

                {!!(formData.topics || []).length && (
                  <div className="study-plan-ai-chips-container">
                    {(formData.topics || []).map((topic) => (
                      <div key={topic} className="study-plan-ai-chip">
                        {topic}
                        <span
                          className="study-plan-ai-chip-remove"
                          onClick={() => removeTopic(topic)}
                        >
                          ×
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="study-plan-ai-summary-panel">
                <div className="study-plan-ai-summary-title">Thông số AI sẽ áp dụng</div>
                <div className="study-plan-ai-summary-grid">
                  <div className="study-plan-ai-summary-item">
                    <span>Môn học</span>
                    <strong>
                      {formData.subjectName ||
                        (activeSubjectPreset.id !== 'custom' ? activeSubjectPreset.subjectName : 'Chưa chọn')}
                    </strong>
                  </div>
                  <div className="study-plan-ai-summary-item">
                    <span>Mục tiêu</span>
                    <strong>{activeGoalPreset.label}</strong>
                  </div>
                  <div className="study-plan-ai-summary-item">
                    <span>Lịch học</span>
                    <strong>{effectivePreferredDaySummary || 'Chưa chọn ngày học'}</strong>
                  </div>
                  <div className="study-plan-ai-summary-item">
                    <span>Khung giờ</span>
                    <strong>{effectivePreferredWindowSummary || 'Chưa chọn khung giờ'}</strong>
                  </div>
                  <div className="study-plan-ai-summary-item">
                    <span>Tổng thời lượng</span>
                    <strong>{formData.durationMinutes || 0} phút</strong>
                  </div>
                  <div className="study-plan-ai-summary-item">
                    <span>Giới hạn mỗi ngày</span>
                    <strong>{formData.maxDailyStudyMinutes || 0} phút/ngày</strong>
                  </div>
                </div>
              </div>

              <button
                className="study-plan-ai-advanced-toggle"
                onClick={() => setShowAdvancedOptions((previous) => !previous)}
              >
                <span>Tùy chỉnh nâng cao (không bắt buộc)</span>
                {showAdvancedOptions ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {showAdvancedOptions && (
                <div className="study-plan-ai-advanced-panel">
                  <div className="study-plan-ai-form-row">
                    <div className="study-plan-ai-form-group">
                      <label>Phương pháp học</label>
                      <select
                        name="studyMethod"
                        value={formData.studyMethod}
                        onChange={handleInputChange}
                        className="study-plan-select"
                      >
                        <option value="POMODORO">Pomodoro (25/5)</option>
                        <option value="DEEP_WORK">Deep Work (90/20)</option>
                        <option value="52_17">52/17 Rule</option>
                        <option value="FLOW_TIME">Flowtime</option>
                      </select>
                    </div>
                    <div className="study-plan-ai-form-group">
                      <label>Chronotype</label>
                      <select
                        name="chronotype"
                        value={formData.chronotype}
                        onChange={handleInputChange}
                        className="study-plan-select"
                      >
                        <option value="BEAR">Bear - Nhịp ngày</option>
                        <option value="WOLF">Wolf - Năng lượng tối</option>
                        <option value="LION">Lion - Năng lượng sáng</option>
                        <option value="DOLPHIN">Dolphin - Dễ mất tập trung</option>
                      </select>
                    </div>
                  </div>

                  <div className="study-plan-ai-form-row">
                    <div className="study-plan-ai-form-group">
                      <label>Tối đa phiên học/ngày</label>
                      <input
                        type="number"
                        name="maxSessionsPerDay"
                        value={formData.maxSessionsPerDay}
                        onChange={handleInputChange}
                        className="study-plan-input"
                        min={1}
                      />
                    </div>
                    <div className="study-plan-ai-form-group">
                      <label>Nghỉ giữa phiên (phút)</label>
                      <input
                        type="number"
                        name="breakMinutesBetweenSessions"
                        value={formData.breakMinutesBetweenSessions}
                        onChange={handleInputChange}
                        className="study-plan-input"
                        min={5}
                      />
                    </div>
                  </div>

                  <div className="study-plan-ai-form-group">
                    <label>Ngày học ưu tiên</label>
                    <div className="study-plan-ai-multi-select">
                      {Object.keys(DAY_LABELS).map((day) => (
                        <button
                          key={day}
                          className={`study-plan-ai-select-option ${
                            (formData.preferredDays || []).includes(day) ? 'selected' : ''
                          }`}
                          onClick={() => toggleDay(day)}
                        >
                          {DAY_LABELS[day]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="study-plan-ai-form-group">
                    <label>Khung giờ rảnh</label>
                    {(formData.preferredTimeWindows || []).map((window, index) => (
                      <div key={`${window.startTime}-${window.endTime}-${index}`} className="study-plan-time-window-row">
                        <input
                          type="time"
                          value={window.startTime}
                          onChange={(event) =>
                            handleTimeWindowChange(index, 'startTime', event.target.value)
                          }
                        />
                        <span className="study-plan-time-separator">-</span>
                        <input
                          type="time"
                          value={window.endTime}
                          onChange={(event) =>
                            handleTimeWindowChange(index, 'endTime', event.target.value)
                          }
                        />
                        {(formData.preferredTimeWindows || []).length > 1 && (
                          <button
                            className="study-plan-ai-icon-btn"
                            onClick={() => removeTimeWindow(index)}
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button className="study-plan-ai-add-time-btn" onClick={addTimeWindow}>
                      <FaPlus /> Thêm khung giờ
                    </button>
                  </div>

                  <div className="study-plan-ai-form-group">
                    <label>Mục tiêu đầu ra chi tiết</label>
                    <textarea
                      name="desiredOutcome"
                      value={formData.desiredOutcome}
                      onChange={handleInputChange}
                      placeholder="AI đã gợi ý sẵn. Bạn có thể chỉnh nếu cần."
                      className="study-plan-input"
                    />
                  </div>

                  <div className="study-plan-ai-toggle-group">
                    <label className="study-plan-ai-toggle-label">
                      <input
                        type="checkbox"
                        name="avoidLateNight"
                        checked={!!formData.avoidLateNight}
                        onChange={handleInputChange}
                      />
                      Tránh học khuya (sau 23:00)
                    </label>
                    <label className="study-plan-ai-toggle-label">
                      <input
                        type="checkbox"
                        name="allowLateNight"
                        checked={!!formData.allowLateNight}
                        onChange={handleInputChange}
                      />
                      Cho phép học khuya khi bắt buộc
                    </label>
                  </div>
                </div>
              )}

              {error && <div className="study-plan-ai-error">{error}</div>}

              <div className="study-plan-ai-actions">
                <button className="study-plan-ai-cancel-btn" onClick={onClose}>
                  Hủy
                </button>
                <button
                  className="study-plan-ai-generate-btn"
                  onClick={handleGenerateProposal}
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Tạo đề xuất lịch trình'} <FaMagic />
                </button>
              </div>
            </div>
          ) : (
            <div className="study-plan-ai-preview">
              <div className="study-plan-ai-preview-header">
                <h3>Xem trước và tối ưu lịch trình</h3>
                <button className="study-plan-ai-text-btn" onClick={() => setStep('form')}>
                  &larr; Quay lại chỉnh sửa
                </button>
              </div>

              {healthReport && (
                <div className="study-plan-ai-health-report">
                  <div
                    className={`study-plan-ai-health-score ${
                      healthOverallScore >= 80
                        ? 'good'
                        : healthOverallScore >= 50
                          ? 'warning'
                          : 'bad'
                    }`}
                  >
                    Điểm sức khỏe lịch học: {healthOverallScore}/100
                  </div>

                  <div className="study-plan-ai-health-issues">
                    {healthIssues.map((issue, index) => (
                      <div
                        key={`${issue.message}-${index}`}
                        className={`study-plan-ai-issue-item ${issue.severity.toLowerCase()}`}
                      >
                        <FaExclamationTriangle />
                        <span>{issue.message}</span>
                        {issue.suggestion && (
                          <div className="study-plan-ai-issue-suggestion">
                            <FaLightbulb /> {issue.suggestion}
                          </div>
                        )}
                      </div>
                    ))}
                    {healthIssues.length === 0 && (
                      <div className="study-plan-ai-issue-item good">
                        <FaCheckCircle /> Lịch trình cân bằng và hợp lý.
                      </div>
                    )}
                  </div>

                  {healthOverallScore < 80 && (
                    <button
                      className="study-plan-ai-suggest-btn"
                      onClick={handleSuggestFix}
                      disabled={loading}
                    >
                      <FaMagic /> Đề xuất chỉnh sửa tự động
                    </button>
                  )}
                </div>
              )}

              <div className="study-plan-ai-preview-list">
                {generatedSessions.map((session, index) => (
                  <div key={index} className="study-plan-ai-session-card">
                    <div className="study-plan-ai-session-time">
                      {new Date(session.startTime).toLocaleDateString('vi-VN')}
                      <br />
                      {new Date(session.startTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' - '}
                      {new Date(session.endTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="study-plan-ai-session-info">
                      <div className="study-plan-ai-session-title">{session.title}</div>
                      <div className="study-plan-ai-session-desc study-plan-markdown-preview">
                        <ReactMarkdown>{session.description}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {showLateNightConfirm && (
                <div className="study-plan-ai-confirm-modal">
                  <div className="study-plan-ai-confirm-content">
                    <h4>
                      <FaMoon /> Xác nhận phiên học khuya
                    </h4>
                    <p>
                      Lịch trình có phiên học trong khoảng 23:00 - 05:00. Bạn có muốn vẫn áp dụng
                      lịch này không?
                    </p>
                    <div className="study-plan-ai-confirm-actions">
                      <button onClick={() => setShowLateNightConfirm(false)}>Xem lại</button>
                      <button
                        className="study-plan-ai-confirm-btn"
                        onClick={() => {
                          setFormData((previous) => ({ ...previous, allowLateNight: true }));
                          setShowLateNightConfirm(false);
                          void handleConfirmSave();
                        }}
                      >
                        Vẫn áp dụng
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="study-plan-ai-error">{error}</div>}

              <div className="study-plan-ai-actions">
                <button className="study-plan-ai-cancel-btn" onClick={onClose}>
                  Hủy
                </button>
                <button
                  className="study-plan-ai-generate-btn"
                  onClick={handleConfirmSave}
                  disabled={loading}
                >
                  Xác nhận và tạo lịch <FaCheckCircle />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAgentPlanner;
