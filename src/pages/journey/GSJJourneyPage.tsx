import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Map, Play, Pause, CheckCircle, Target,
  Brain, Award, BookOpen, Activity, Sparkles,
  X, RefreshCw, FileText, Lightbulb, Zap, ChevronRight,
  Rocket, Calendar, ArrowLeft
} from 'lucide-react';
import journeyService from '../../services/journeyService';
import {
  JourneySummaryResponse,
  JourneyDetailResponse,
  JourneyStatus,
  AssessmentTestResponse,
  TestResultResponse,
  SkillLevel,
  JourneyType,
  DOMAIN_OPTIONS,
  SUB_CATEGORIES,
  JOBS_BY_DOMAIN
} from '../../types/Journey';
import GSJTestTaking from './GSJTestTaking';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import './../../styles/GSJJourney.css';

type ViewMode = 'list' | 'detail' | 'test' | 'result';

// Domain icons mapping
const DOMAIN_ICONS: Record<string, string> = {
  IT: '💻',
  DESIGN: '🎨',
  BUSINESS: '💼',
  ENGINEERING: '⚙️',
  EDUCATION: '📚',
  LOGISTICS: '🚚',
  LEGAL: '⚖️',
  ARTS: '🎭',
  SERVICE: '🤝',
  SOCIALCOMMUNITY: '🌍',
  AGRICULTUREENVIRONMENT: '🌱',
  HEALTHCARE: '🏥'
};

const GSJJourneyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const autoOpenedJourneyIdRef = useRef<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [journeys, setJourneys] = useState<JourneySummaryResponse[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<JourneyDetailResponse | null>(null);
  const [currentTest, setCurrentTest] = useState<AssessmentTestResponse | null>(null);
  const [currentResult, setCurrentResult] = useState<TestResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load journeys on mount
  const loadJourneys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await journeyService.getUserJourneys(0, 20);
      setJourneys(data.content);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load journeys:', err);
      setError(err.message || 'Failed to load journeys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJourneys();
  }, [loadJourneys]);

  // Select journey and load details
  const handleSelectJourney = useCallback(async (journeyId: number) => {
    try {
      setLoading(true);
      const detail = await journeyService.getJourneyById(journeyId);
      setSelectedJourney(detail);
      setCurrentTest(null);
      setCurrentResult(null);
      setViewMode('detail');
      setError(null);
    } catch (err: any) {
      console.error('Failed to load journey details:', err);
      setError(err.message || 'Failed to load journey details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const routeState = location.state as { autoOpenJourneyId?: number } | null;
    const autoOpenJourneyId = routeState?.autoOpenJourneyId;

    if (!autoOpenJourneyId || autoOpenedJourneyIdRef.current === autoOpenJourneyId) {
      return;
    }

    autoOpenedJourneyIdRef.current = autoOpenJourneyId;
    void handleSelectJourney(autoOpenJourneyId);

    navigate(location.pathname, { replace: true, state: null });
  }, [handleSelectJourney, location.pathname, location.state, navigate]);

  // Generate assessment test
  const handleGenerateTest = async () => {
    if (!selectedJourney) return;
    try {
      setActionLoading(true);
      const result = await journeyService.generateAssessmentTest(selectedJourney.id);
      setCurrentTest(result.test);
      setCurrentResult(null);

      setViewMode('test');
      const updated = await journeyService.getJourneyById(selectedJourney.id);
      setSelectedJourney(updated);
      setError(null);
    } catch (err: any) {
      console.error('Failed to generate test:', err);
      setError(err.message || 'Failed to generate assessment test');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewLatestResult = async () => {
    if (!selectedJourney) return;
    const latestResultId = selectedJourney.latestTestResult?.resultId;
    if (!latestResultId) {
      setError('Chưa có kết quả quiz để xem lại.');
      return;
    }

    try {
      setActionLoading(true);
      if (!currentResult || currentResult.id !== latestResultId) {
        const result = await journeyService.getTestResult(selectedJourney.id, latestResultId);
        setCurrentResult(result);
      }
      setViewMode('result');
      setError(null);
    } catch (err: any) {
      console.error('Failed to load latest test result:', err);
      setError(err.message || 'Failed to load latest quiz result.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit test
  const handleSubmitTest = async (answers: Record<number, string>, timeSpent: number) => {
    if (!selectedJourney || !currentTest) return;
    try {
      setActionLoading(true);
      const result = await journeyService.submitTest(selectedJourney.id, {
        testId: currentTest.id,
        answers,
        timeSpentSeconds: timeSpent
      });
      setCurrentResult(result);
      setViewMode('result');
      const updated = await journeyService.getJourneyById(selectedJourney.id);
      setSelectedJourney(updated);
      setError(null);
    } catch (err: any) {
      console.error('Failed to submit test:', err);
      setError(err.message || 'Failed to submit test');
    } finally {
      setActionLoading(false);
    }
  };

  // Generate roadmap
  const handleGenerateRoadmap = async () => {
    if (!selectedJourney) return;
    try {
      setActionLoading(true);
      const generated = await journeyService.generateRoadmap(selectedJourney.id);
      const updated = await journeyService.getJourneyById(selectedJourney.id);
      setSelectedJourney(updated);
      setError(null);

      const roadmapSessionId = generated.roadmapSessionId ?? updated.roadmapSessionId;
      if (roadmapSessionId) {
        navigate(`/roadmap/${roadmapSessionId}`);
        return;
      }

      setError('Đã tạo lộ trình nhưng chưa nhận được mã phiên roadmap. Vui lòng thử tải lại trang.');
    } catch (err: any) {
      console.error('Failed to generate roadmap:', err);
      setError(err.message || 'Failed to generate roadmap');
    } finally {
      setActionLoading(false);
    }
  };

  // Pause/Resume journey
  const handleTogglePause = async () => {
    if (!selectedJourney) return;
    try {
      setActionLoading(true);
      let updated: JourneySummaryResponse;
      if (selectedJourney.status === JourneyStatus.PAUSED) {
        updated = await journeyService.resumeJourney(selectedJourney.id);
      } else {
        updated = await journeyService.pauseJourney(selectedJourney.id);
      }
      const detail = await journeyService.getJourneyById(updated.id);
      setSelectedJourney(detail);
      await loadJourneys();
      setError(null);
    } catch (err: any) {
      console.error('Failed to toggle pause:', err);
      setError(err.message || 'Failed to update journey status');
    } finally {
      setActionLoading(false);
    }
  };

  // Get domain label
  const getDomainLabel = (domain: string): string => {
    const domainOption = DOMAIN_OPTIONS.find(d => d.value === domain);
    return domainOption?.label || domain;
  };

  // Get sub-category label
  const getSubCategoryLabel = (subCategory: string, domain: string): string => {
    const subCategories = SUB_CATEGORIES[domain] || [];
    const sub = subCategories.find(s => s.value === subCategory);
    return sub?.label || subCategory;
  };

  const getJobRoleLabel = (jobRole?: string, domain?: string): string => {
    if (!jobRole) return 'Vai trò chưa xác định';

    if (domain) {
      const roles = JOBS_BY_DOMAIN[domain] || [];
      const matched = roles.find((role) => role.value === jobRole);
      if (matched?.label) {
        return matched.label;
      }
    }

    return jobRole;
  };

  // Get status label
  const getStatusLabel = (status: JourneyStatus): string => {
    const labels: Record<JourneyStatus, string> = {
      [JourneyStatus.NOT_STARTED]: 'Chưa bắt đầu',
      [JourneyStatus.ASSESSMENT_PENDING]: 'Chờ đánh giá',
      [JourneyStatus.TEST_IN_PROGRESS]: 'Đang làm bài',
      [JourneyStatus.TEST_COMPLETED]: 'Hoàn thành bài test',
      [JourneyStatus.EVALUATION_PENDING]: 'Đang chấm điểm',
      [JourneyStatus.ROADMAP_GENERATING]: 'Tạo lộ trình',
      [JourneyStatus.ROADMAP_READY]: 'Lộ trình sẵn sàng',
      [JourneyStatus.STUDY_PLANS_READY]: 'Kế hoạch sẵn sàng',
      [JourneyStatus.IN_PROGRESS]: 'Đang học',
      [JourneyStatus.PAUSED]: 'Tạm dừng',
      [JourneyStatus.COMPLETED]: 'Hoàn thành',
      [JourneyStatus.CANCELLED]: 'Đã hủy'
    };
    return labels[status] || status;
  };

  // Get status color
  const getStatusColor = (status: JourneyStatus): string => {
    const colors: Record<JourneyStatus, string> = {
      [JourneyStatus.NOT_STARTED]: 'pending',
      [JourneyStatus.ASSESSMENT_PENDING]: 'pending',
      [JourneyStatus.TEST_IN_PROGRESS]: 'active',
      [JourneyStatus.TEST_COMPLETED]: 'active',
      [JourneyStatus.EVALUATION_PENDING]: 'active',
      [JourneyStatus.ROADMAP_GENERATING]: 'active',
      [JourneyStatus.ROADMAP_READY]: 'active',
      [JourneyStatus.STUDY_PLANS_READY]: 'active',
      [JourneyStatus.IN_PROGRESS]: 'active',
      [JourneyStatus.PAUSED]: 'paused',
      [JourneyStatus.COMPLETED]: 'completed',
      [JourneyStatus.CANCELLED]: 'cancelled'
    };
    return colors[status] || 'pending';
  };

  // Get current step index from real journey artifacts (test/result/roadmap), not only status flag
  const getCurrentStepIndex = (journey: JourneyDetailResponse): number => {
    if (journey.status === JourneyStatus.COMPLETED) {
      return 4;
    }

    const hasRoadmap = Boolean(journey.roadmapSessionId);
    const hasEvaluationResult = Boolean(journey.latestTestResult);
    const assessmentTestStatus = journey.assessmentTestStatus?.toUpperCase() || '';
    const hasAssessmentTest = Boolean(journey.assessmentTestId);
    const hasAssessmentInProgress = assessmentTestStatus === 'IN_PROGRESS' || journey.status === JourneyStatus.TEST_IN_PROGRESS;
    const hasAssessmentCompleted = hasEvaluationResult || assessmentTestStatus === 'COMPLETED';
    const progress = journey.progressPercentage || 0;

    if (
      journey.status === JourneyStatus.IN_PROGRESS ||
      journey.status === JourneyStatus.STUDY_PLANS_READY ||
      (journey.status === JourneyStatus.PAUSED && hasRoadmap && progress > 30) ||
      (hasRoadmap && progress > 30)
    ) {
      return 3;
    }

    if (
      hasRoadmap ||
      journey.status === JourneyStatus.ROADMAP_READY ||
      journey.status === JourneyStatus.ROADMAP_GENERATING ||
      (journey.status === JourneyStatus.PAUSED && hasRoadmap)
    ) {
      return 2;
    }

    if (hasAssessmentCompleted) {
      return 1;
    }

    if (
      hasAssessmentInProgress ||
      hasAssessmentTest ||
      journey.status === JourneyStatus.ASSESSMENT_PENDING ||
      journey.status === JourneyStatus.NOT_STARTED ||
      journey.status === JourneyStatus.TEST_COMPLETED ||
      journey.status === JourneyStatus.EVALUATION_PENDING
    ) {
      return 0;
    }

    return 0;
  };

  // Get journey type icon
  const getJourneyTypeIcon = (type: string) => {
    return type === JourneyType.CAREER ? <Target size={14} /> : <Sparkles size={14} />;
  };

  const getSkillLevelLabel = (level?: SkillLevel): string => {
    if (!level) return 'Chưa xác định';
    const labels: Record<SkillLevel, string> = {
      [SkillLevel.BEGINNER]: 'Mới bắt đầu',
      [SkillLevel.ELEMENTARY]: 'Sơ cấp',
      [SkillLevel.INTERMEDIATE]: 'Trung cấp',
      [SkillLevel.ADVANCED]: 'Nâng cao',
      [SkillLevel.EXPERT]: 'Chuyên gia'
    };
    return labels[level] || level;
  };

  const getSkillLevelClass = (level: SkillLevel): string => {
    switch (level) {
      case SkillLevel.BEGINNER:
        return 'beginner';
      case SkillLevel.ELEMENTARY:
      case SkillLevel.INTERMEDIATE:
        return 'intermediate';
      case SkillLevel.ADVANCED:
      case SkillLevel.EXPERT:
      default:
        return 'advanced';
    }
  };

  const formatDateTime = (value?: string): string => {
    if (!value) return 'Chưa có dữ liệu';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Chưa có dữ liệu';
    return date.toLocaleString('vi-VN', {
      hour12: false,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const activeJourneyStatuses: JourneyStatus[] = [
    JourneyStatus.ASSESSMENT_PENDING,
    JourneyStatus.TEST_IN_PROGRESS,
    JourneyStatus.TEST_COMPLETED,
    JourneyStatus.EVALUATION_PENDING,
    JourneyStatus.ROADMAP_GENERATING,
    JourneyStatus.ROADMAP_READY,
    JourneyStatus.STUDY_PLANS_READY,
    JourneyStatus.IN_PROGRESS
  ];

  const assessmentJourneyStatuses: JourneyStatus[] = [
    JourneyStatus.ASSESSMENT_PENDING,
    JourneyStatus.TEST_IN_PROGRESS,
    JourneyStatus.TEST_COMPLETED,
    JourneyStatus.EVALUATION_PENDING
  ];

  const totalJourneys = journeys.length;
  const activeJourneys = journeys.filter((journey) => activeJourneyStatuses.includes(journey.status)).length;
  const pausedJourneys = journeys.filter((journey) => journey.status === JourneyStatus.PAUSED).length;
  const completedJourneys = journeys.filter((journey) => journey.status === JourneyStatus.COMPLETED).length;
  const assessmentJourneys = journeys.filter((journey) => assessmentJourneyStatuses.includes(journey.status)).length;

  const averageProgress = totalJourneys === 0
    ? 0
    : Math.round(journeys.reduce((total, journey) => total + (journey.progressPercentage || 0), 0) / totalJourneys);

  const completionRate = totalJourneys === 0
    ? 0
    : Math.round((completedJourneys / totalJourneys) * 100);

  const domainFrequency = journeys.reduce<Record<string, number>>((acc, journey) => {
    acc[journey.domain] = (acc[journey.domain] || 0) + 1;
    return acc;
  }, {});

  const dominantDomain = Object.entries(domainFrequency).sort((a, b) => b[1] - a[1])[0];
  const dominantDomainLabel = dominantDomain ? getDomainLabel(dominantDomain[0]) : 'Chưa có dữ liệu';

  const latestActivityAt = journeys
    .map((journey) => journey.lastActivityAt || journey.startedAt || journey.createdAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  const latestActivityLabel = latestActivityAt
    ? new Date(latestActivityAt).toLocaleDateString('vi-VN')
    : 'Chưa có hoạt động';

  const selectedJourneyActivityAt = selectedJourney
    ? (selectedJourney.lastActivityAt || selectedJourney.startedAt || selectedJourney.createdAt)
    : null;

  const selectedJourneyActivityLabel = selectedJourneyActivityAt
    ? new Date(selectedJourneyActivityAt).toLocaleDateString('vi-VN')
    : 'Chưa có hoạt động';

  const selectedJourneyProgress = selectedJourney?.progressPercentage ?? 0;
  const selectedJourneyHasResult = Boolean(selectedJourney?.latestTestResult) ||
    selectedJourney?.assessmentTestStatus?.toUpperCase() === 'COMPLETED';
  const selectedJourneyHasTest = Boolean(selectedJourney?.assessmentTestId);
  const selectedJourneyHasRoadmap = Boolean(selectedJourney?.roadmapSessionId);
  const selectedJourneyStepLabel = selectedJourney
    ? ['Đánh giá ban đầu', 'Phân tích kỹ năng', 'Lộ trình học tập', 'Học & Thực hành', 'Thành tựu'][getCurrentStepIndex(selectedJourney)]
    : '';

  const heroStats = [
    {
      key: 'total',
      value: `${totalJourneys}`,
      label: 'Tổng hành trình',
      note: 'Đang được theo dõi'
    },
    {
      key: 'completion-rate',
      value: `${completionRate}%`,
      label: 'Tỉ lệ hoàn thành',
      note: `${completedJourneys}/${totalJourneys || 0} đã hoàn thành`
    },
    {
      key: 'avg-progress',
      value: `${averageProgress}%`,
      label: 'Tiến độ trung bình',
      note: 'Trên toàn bộ hành trình'
    },
    {
      key: 'active',
      value: `${activeJourneys}`,
      label: 'Đang hoạt động',
      note: 'Đang tiếp tục học'
    }
  ];

  const overviewMetrics = [
    { key: 'active', label: 'Đang hoạt động', value: activeJourneys, colorClass: 'gsj-overview__bar--active' },
    { key: 'completed', label: 'Hoàn thành', value: completedJourneys, colorClass: 'gsj-overview__bar--completed' },
    { key: 'paused', label: 'Tạm dừng', value: pausedJourneys, colorClass: 'gsj-overview__bar--paused' }
  ];

  const overviewSummaryItems = selectedJourney
    ? [
        {
          key: 'selected-domain',
          label: 'Lĩnh vực đang xem',
          value: getDomainLabel(selectedJourney.domain)
        },
        {
          key: 'selected-last-activity',
          label: 'Hoạt động gần nhất',
          value: selectedJourneyActivityLabel
        }
      ]
    : [
        {
          key: 'dominant-domain',
          label: 'Lĩnh vực trọng tâm',
          value: dominantDomainLabel
        },
        {
          key: 'latest-activity',
          label: 'Hoạt động gần nhất',
          value: latestActivityLabel
        }
      ];

  const overviewRows = selectedJourney
    ? [
        {
          key: 'selected-progress',
          label: 'Tiến độ hành trình',
          displayValue: `${selectedJourneyProgress}%`,
          ratio: selectedJourneyProgress,
          colorClass: 'gsj-overview__bar--active',
          caption: `Bước hiện tại: ${selectedJourneyStepLabel}`
        },
        {
          key: 'selected-assessment',
          label: 'Đánh giá đầu vào',
          displayValue: selectedJourneyHasResult ? 'Đã hoàn thành' : selectedJourneyHasTest ? 'Đang làm bài' : 'Chưa làm',
          ratio: selectedJourneyHasResult ? 100 : selectedJourneyHasTest ? 50 : 0,
          colorClass: selectedJourneyHasResult ? 'gsj-overview__bar--completed' : 'gsj-overview__bar--active',
          caption: selectedJourneyHasResult
            ? 'Đã có kết quả đánh giá.'
            : selectedJourneyHasTest
              ? 'Đang có bài test chưa nộp.'
              : 'Chưa tạo/hoàn thành bài test.'
        },
        {
          key: 'selected-roadmap',
          label: 'Roadmap học tập',
          displayValue: selectedJourneyHasRoadmap ? 'Sẵn sàng' : 'Chưa tạo',
          ratio: selectedJourneyHasRoadmap ? 100 : 0,
          colorClass: selectedJourneyHasRoadmap ? 'gsj-overview__bar--completed' : 'gsj-overview__bar--neutral',
          caption: selectedJourneyHasRoadmap
            ? 'Có thể mở roadmap ngay.'
            : 'Tạo roadmap sau khi có kết quả đánh giá.'
        }
      ]
    : overviewMetrics.map((item) => {
        const ratio = totalJourneys === 0 ? 0 : Math.round((item.value / totalJourneys) * 100);
        return {
          key: item.key,
          label: item.label,
          displayValue: `${item.value}`,
          ratio,
          colorClass: item.colorClass,
          caption: `${ratio}% trên tổng số hành trình`
        };
      });

  const overviewNote = selectedJourney
    ? selectedJourneyHasResult
      ? 'Journey này đã có kết quả đánh giá. Bạn có thể tạo hoặc mở roadmap để tiếp tục.'
      : selectedJourneyHasTest
        ? 'Journey này đang ở bước làm bài đánh giá. Hoàn thành bài test để mở khóa roadmap.'
        : 'Journey này chưa có dữ liệu đánh giá. Hãy bắt đầu bài test đầu vào.'
    : totalJourneys === 0
      ? 'Chưa có dữ liệu hành trình. Hãy tạo hành trình đầu tiên để bắt đầu.'
      : `${assessmentJourneys} hành trình đang ở giai đoạn đánh giá năng lực.`;

  // Render steps
  const renderSteps = () => {
    const steps = [
      { icon: FileText, title: 'Đánh giá ban đầu', description: 'Hoàn thành bài test đầu vào' },
      { icon: Brain, title: 'Phân tích kỹ năng', description: 'AI phân tích trình độ của bạn' },
      { icon: Map, title: 'Lộ trình học tập', description: 'Lộ trình cá nhân hóa' },
      { icon: BookOpen, title: 'Học & Thực hành', description: 'Theo kế hoạch cá nhân' },
      { icon: Award, title: 'Thành tựu', description: 'Chinh phục mục tiêu' }
    ];

    const currentIndex = selectedJourney ? getCurrentStepIndex(selectedJourney) : 0;

    return (
      <div className="gsj-steps">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`gsj-step ${index < currentIndex ? 'gsj-step--completed' : ''} ${index === currentIndex ? 'gsj-step--active' : ''}`}
          >
            <div className="gsj-step__icon">
              {index < currentIndex ? <CheckCircle size={20} /> : <step.icon size={20} />}
            </div>
            <div className="gsj-step__content">
              <div className="gsj-step__title">{step.title}</div>
              <div className="gsj-step__description">{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render hero section
  const renderHero = () => (
    <div className="gsj-hero">
      <div className="gsj-hero__content">
        <div className="gsj-hero__badge">
          <Sparkles size={14} />
          Hành trình học tập cá nhân hóa
        </div>
        <h1 className="gsj-hero__title">
          Khám phá tiềm năng của bạn
        </h1>
        <p className="gsj-hero__description">
          Bắt đầu hành trình học tập với lộ trình được thiết kế riêng cho bạn.
          Đánh giá kỹ năng, nhận lộ trình cá nhân hóa và đạt được mục tiêu nghề nghiệp.
        </p>
        <div className="gsj-hero__actions">
          <button className="gsj-btn gsj-btn--primary gsj-btn--lg" onClick={() => navigate('/journey/create')}>
            <Rocket size={20} />
            Bắt đầu ngay
          </button>
          <button className="gsj-btn gsj-btn--secondary gsj-btn--lg" onClick={() => document.getElementById('journeys-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <Map size={20} />
            Xem lộ trình của tôi
          </button>
        </div>
        <div className="gsj-hero__stats">
          {heroStats.map((stat) => (
            <article key={stat.key} className="gsj-hero-stat-card">
              <span className="gsj-hero-stat-card__value">{stat.value}</span>
              <span className="gsj-hero-stat-card__label">{stat.label}</span>
              <span className="gsj-hero-stat-card__note">{stat.note}</span>
            </article>
          ))}
        </div>
      </div>
      <div className="gsj-hero__visual">
        <div className="gsj-hero__card gsj-hero__card--1">
          <div className="gsj-hero__card-icon">🎯</div>
          <div className="gsj-hero__card-text">
            <span className="gsj-hero__card-title">Đánh giá kỹ năng</span>
            <span className="gsj-hero__card-desc">AI phân tích chính xác</span>
          </div>
        </div>
        <div className="gsj-hero__card gsj-hero__card--2">
          <div className="gsj-hero__card-icon">🗺️</div>
          <div className="gsj-hero__card-text">
            <span className="gsj-hero__card-title">Lộ trình cá nhân</span>
            <span className="gsj-hero__card-desc">Phù hợp với mục tiêu</span>
          </div>
        </div>
        <div className="gsj-hero__card gsj-hero__card--3">
          <div className="gsj-hero__card-icon">🏆</div>
          <div className="gsj-hero__card-text">
            <span className="gsj-hero__card-title">Chứng nhận</span>
            <span className="gsj-hero__card-desc">Công nhận năng lực</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render journey list
  const renderJourneyList = () => (
    <div className="gsj-journeys-section" id="journeys-section">
      <div className="gsj-section-header">
        <div className="gsj-section-header__left">
          <h2 className="gsj-section-header__title">
            <Map size={22} />
            Hành trình của bạn
          </h2>
          <p className="gsj-section-header__subtitle">
            {totalJourneys > 0 ? `Bạn đang theo dõi ${totalJourneys} hành trình, ${activeJourneys} hành trình đang hoạt động` : 'Bắt đầu hành trình đầu tiên của bạn'}
          </p>
        </div>
        <button className="gsj-btn gsj-btn--primary" onClick={() => navigate('/journey/create')}>
          <Zap size={16} />
          Tạo mới
        </button>
      </div>

      {loading ? (
        <div className="gsj-loading">
          <div className="gsj-spinner"></div>
          <div className="gsj-loading__text">Đang tải hành trình...</div>
        </div>
      ) : totalJourneys === 0 ? (
        <div className="gsj-empty-state">
          <div className="gsj-empty-state__visual">
            <div className="gsj-empty-state__icon">
              <Rocket size={48} />
            </div>
            <div className="gsj-empty-state__glow"></div>
          </div>
          <h3 className="gsj-empty-state__title">Sẵn sàng bắt đầu?</h3>
          <p className="gsj-empty-state__description">
            Tạo hành trình học tập đầu tiên để khám phá tiềm năng của bạn.
            Chúng tôi sẽ giúp bạn đánh giá kỹ năng và tạo lộ trình phù hợp.
          </p>
          <button className="gsj-btn gsj-btn--primary gsj-btn--lg" onClick={() => navigate('/journey/create')}>
            <Sparkles size={18} />
            Tạo hành trình đầu tiên
          </button>
        </div>
      ) : (
        <div className="gsj-journey-grid">
          {journeys.map((journey) => (
            <div
              key={journey.id}
              className="gsj-journey-card"
              onClick={() => handleSelectJourney(journey.id)}
            >
              <div className="gsj-journey-card__header">
                <div className="gsj-journey-card__domain">
                  <span className="gsj-journey-card__icon">{DOMAIN_ICONS[journey.domain] || '📚'}</span>
                  <div className="gsj-journey-card__info">
                    <span className="gsj-journey-card__name">{getDomainLabel(journey.domain)}</span>
                    {journey.subCategory && (
                      <span className="gsj-journey-card__sub">{getSubCategoryLabel(journey.subCategory, journey.domain)}</span>
                    )}
                  </div>
                </div>
                <span className={`gsj-journey-card__status gsj-journey-card__status--${getStatusColor(journey.status)}`}>
                  {getStatusLabel(journey.status)}
                </span>
              </div>

              {journey.jobRole && (
                <div className="gsj-journey-card__role">
                  {getJourneyTypeIcon(journey.type || 'SKILL')}
                  <span>{journey.jobRole}</span>
                </div>
              )}

              {journey.type === 'SKILL' && journey.skills && journey.skills.length > 0 && (
                <div className="gsj-journey-card__skills">
                  {journey.skills.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="gsj-journey-card__skill-tag">{skill}</span>
                  ))}
                  {journey.skills.length > 3 && (
                    <span className="gsj-journey-card__skill-more">+{journey.skills.length - 3}</span>
                  )}
                </div>
              )}

              <div className="gsj-journey-card__footer">
                <div className="gsj-journey-card__progress">
                  <div className="gsj-journey-card__progress-info">
                    <span>Tiến độ</span>
                    <span>{journey.progressPercentage}%</span>
                  </div>
                  <div className="gsj-journey-card__progress-bar">
                    <div
                      className="gsj-journey-card__progress-fill"
                      style={{ width: `${journey.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="gsj-journey-card__meta">
                  {journey.currentLevel && (
                    <span className="gsj-journey-card__level">
                      <Brain size={12} />
                      {journey.currentLevel}
                    </span>
                  )}
                  {journey.startedAt && (
                    <span className="gsj-journey-card__date">
                      <Calendar size={12} />
                      {new Date(journey.startedAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>

              <div className="gsj-journey-card__arrow">
                <ChevronRight size={20} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render detail view
  const renderDetailView = () => {
    if (!selectedJourney) return null;

    const assessmentStatus = selectedJourney.assessmentTestStatus?.toUpperCase() || '';
    const hasGeneratedTest = Boolean(selectedJourney.assessmentTestId);
    const hasAssessmentResult = Boolean(selectedJourney.latestTestResult) || assessmentStatus === 'COMPLETED';
    const hasTestInProgress = assessmentStatus === 'IN_PROGRESS' || selectedJourney.status === JourneyStatus.TEST_IN_PROGRESS;
    const latestResultId = selectedJourney.latestTestResult?.resultId;
    const assessmentAttemptCount = selectedJourney.assessmentAttemptCount ?? (hasGeneratedTest || hasAssessmentResult ? 1 : 0);
    const maxAssessmentAttempts = selectedJourney.maxAssessmentAttempts ?? 2;
    const remainingAssessmentRetakes = selectedJourney.remainingAssessmentRetakes ??
      Math.max(0, maxAssessmentAttempts - assessmentAttemptCount);

    const canTakeTest = !hasAssessmentResult && (
      selectedJourney.status === JourneyStatus.ASSESSMENT_PENDING ||
      selectedJourney.status === JourneyStatus.NOT_STARTED ||
      hasGeneratedTest ||
      hasTestInProgress
    );
    const canViewLatestResult = Boolean(latestResultId);
    const canRetakeQuiz = hasAssessmentResult && !hasTestInProgress && remainingAssessmentRetakes > 0;
    const canGenerateRoadmap = hasAssessmentResult && !selectedJourney.roadmapSessionId;
    const isPaused = selectedJourney.status === JourneyStatus.PAUSED;
    const roleTitle = getJobRoleLabel(selectedJourney.jobRole, selectedJourney.domain);
    const subCategoryLabel = selectedJourney.subCategory
      ? getSubCategoryLabel(selectedJourney.subCategory, selectedJourney.domain)
      : 'Ngành chưa xác định';
    const domainLabel = getDomainLabel(selectedJourney.domain);

    return (
      <div className="gsj-detail">
        <div className="gsj-card">
          <div className="gsj-detail__header">
            <div className="gsj-detail__toolbar">
              <button
                className="gsj-detail__back-btn"
                onClick={() => {
                  setViewMode('list');
                  setCurrentTest(null);
                  setCurrentResult(null);
                }}
              >
                <ArrowLeft size={16} />
                Quay lại danh sách
              </button>
              <div className="gsj-detail__badge">
                <span className="gsj-chip gsj-chip--primary">
                  {getStatusLabel(selectedJourney.status)}
                </span>
              </div>
            </div>
            <div className="gsj-detail__domain">
              <span className="gsj-detail__domain-icon">{DOMAIN_ICONS[selectedJourney.domain] || '📚'}</span>
              <div className="gsj-detail__identity">
                <h2 className="gsj-detail__title">{roleTitle}</h2>
                <p className="gsj-detail__sub">{subCategoryLabel}</p>
                <p className="gsj-detail__domain-text">{domainLabel}</p>
              </div>
            </div>
            {selectedJourney.goal && (
              <p className="gsj-detail__goal">
                <Target size={14} />
                {selectedJourney.goal}
              </p>
            )}
            <div className="gsj-detail__meta">
              {selectedJourney.currentLevel && (
                <span className="gsj-chip">
                  <Brain size={14} />
                  {selectedJourney.currentLevel}
                </span>
              )}
            </div>
          </div>
          {renderSteps()}
        </div>

        {/* Action Buttons */}
        <div className="gsj-card gsj-mt-24">
          <div className="gsj-card__body">
            <div className="gsj-assessment-meta gsj-mb-16">
              <div className="gsj-assessment-meta__item">
                <span className="gsj-assessment-meta__label">Lượt đã dùng</span>
                <span className="gsj-assessment-meta__value">
                  {assessmentAttemptCount}/{maxAssessmentAttempts}
                </span>
              </div>
              <div className="gsj-assessment-meta__item">
                <span className="gsj-assessment-meta__label">Lượt tạo lại còn</span>
                <span className="gsj-assessment-meta__value">{remainingAssessmentRetakes}</span>
              </div>
              <div className="gsj-assessment-meta__item">
                <span className="gsj-assessment-meta__label">Kết quả gần nhất</span>
                <span className="gsj-assessment-meta__value">
                  {formatDateTime(selectedJourney.latestTestResult?.evaluatedAt)}
                </span>
              </div>
            </div>

            {canTakeTest && (
              <button
                className="gsj-btn gsj-btn--primary gsj-btn--full gsj-mb-16"
                onClick={handleGenerateTest}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={16} className="gsj-spin" />
                    Đang tạo bài test...
                  </>
                ) : (
                  <>
                    <Brain size={16} />
                    Bắt đầu làm bài đánh giá
                  </>
                )}
              </button>
            )}

            {canViewLatestResult && (
              <button
                className="gsj-btn gsj-btn--secondary gsj-btn--full gsj-mb-16"
                onClick={handleViewLatestResult}
                disabled={actionLoading}
              >
                <FileText size={16} />
                Xem lại kết quả quiz
              </button>
            )}

            {canRetakeQuiz && (
              <button
                className="gsj-btn gsj-btn--secondary gsj-btn--full gsj-mb-16"
                onClick={handleGenerateTest}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={16} className="gsj-spin" />
                    Đang tạo bài quiz mới...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Tạo lại quiz ({remainingAssessmentRetakes} lượt còn lại)
                  </>
                )}
              </button>
            )}

            {canGenerateRoadmap && (
              <button
                className="gsj-btn gsj-btn--primary gsj-btn--full gsj-mb-16"
                onClick={handleGenerateRoadmap}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={16} className="gsj-spin" />
                    Đang tạo lộ trình...
                  </>
                ) : (
                  <>
                    <Map size={16} />
                    Tạo lộ trình học tập
                  </>
                )}
              </button>
            )}

            {(selectedJourney.status === JourneyStatus.IN_PROGRESS ||
              selectedJourney.status === JourneyStatus.ROADMAP_READY ||
              selectedJourney.status === JourneyStatus.STUDY_PLANS_READY ||
              selectedJourney.status === JourneyStatus.PAUSED) && (
              <button
                className="gsj-btn gsj-btn--secondary gsj-btn--full gsj-mb-16"
                onClick={handleTogglePause}
                disabled={actionLoading}
              >
                {isPaused ? (
                  <>
                    <Play size={16} />
                    Tiếp tục hành trình
                  </>
                ) : (
                  <>
                    <Pause size={16} />
                    Tạm dừng
                  </>
                )}
              </button>
            )}

            {selectedJourney.roadmapSessionId && (
              <button
                className="gsj-btn gsj-btn--secondary gsj-btn--full"
                onClick={() => navigate(`/roadmap/${selectedJourney.roadmapSessionId}`)}
              >
                <Map size={16} />
                Xem lộ trình
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render test taking view
  const renderTestView = () => (
    <GSJTestTaking
      test={currentTest!}
      onSubmit={handleSubmitTest}
      onBack={() => setViewMode('detail')}
      loading={actionLoading}
    />
  );

  // Render result view
  const renderResultView = () => {
    return renderResultViewEnhanced();

    if (!currentResult) return null;
    const completionRate = currentResult.totalQuestions > 0
      ? Math.round((currentResult.answeredQuestions / currentResult.totalQuestions) * 100)
      : 0;
    const correctRate = currentResult.totalQuestions > 0
      ? Math.round((currentResult.correctAnswers / currentResult.totalQuestions) * 100)
      : 0;

    return (
      <div className="gsj-card">
        <div className="gsj-card__header">
          <h3 className="gsj-card__title">
            <Award size={20} />
            Kết quả đánh giá
          </h3>
        </div>
        <div className="gsj-card__body">
          {/* Score */}
          <div className={`gsj-result-score ${currentResult.passed ? 'gsj-result-score--pass' : 'gsj-result-score--fail'}`}>
            <div className="gsj-result-score__value">{currentResult.score}%</div>
            <div className="gsj-result-score__label">
              {currentResult.passed ? 'Chúc mừng! Bạn đã pass!' : 'Cần cố gắng thêm'}
            </div>
          </div>

          <div className="gsj-result-score__meta">
            <span className="gsj-result-chip">{getSkillLevelLabel(currentResult.evaluatedLevel)}</span>
            <span className="gsj-result-chip">{currentResult.scoreBandLabel}</span>
            <span className="gsj-result-chip">{currentResult.recommendationLabel}</span>
          </div>

          <div className="gsj-result-metrics">
            <div className="gsj-result-metric-card">
              <span className="gsj-result-metric-card__label">Đúng</span>
              <span className="gsj-result-metric-card__value">{currentResult.correctAnswers}/{currentResult.totalQuestions}</span>
            </div>
            <div className="gsj-result-metric-card">
              <span className="gsj-result-metric-card__label">Sai</span>
              <span className="gsj-result-metric-card__value">{currentResult.incorrectAnswers}</span>
            </div>
            <div className="gsj-result-metric-card">
              <span className="gsj-result-metric-card__label">Độ tin cậy</span>
              <span className="gsj-result-metric-card__value">{currentResult.assessmentConfidence}%</span>
            </div>
          </div>

          <div className="gsj-result-progress-block">
            <div className="gsj-result-progress-block__header">
              <span>Tiến độ trả lời</span>
              <span>{completionRate}%</span>
            </div>
            <div className="gsj-result-progress-block__track">
              <div
                className="gsj-result-progress-block__fill gsj-result-progress-block__fill--completion"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>

          <div className="gsj-result-progress-block">
            <div className="gsj-result-progress-block__header">
              <span>Tỷ lệ chính xác</span>
              <span>{correctRate}%</span>
            </div>
            <div className="gsj-result-progress-block__track">
              <div
                className="gsj-result-progress-block__fill gsj-result-progress-block__fill--accuracy"
                style={{ width: `${correctRate}%` }}
              ></div>
            </div>
          </div>

          {currentResult.reassessmentRecommended && (
            <div className="gsj-result-alert">
              <Lightbulb size={16} />
              <span>Khuyến nghị làm lại bài đánh giá sau giai đoạn học đầu để tối ưu lộ trình.</span>
            </div>
          )}

          {/* Summary */}
          <div className="gsj-mb-24">
            <h4 className="gsj-text-primary gsj-mb-8">Tổng kết</h4>
            <p className="gsj-text-secondary">{currentResult.evaluationSummary}</p>
          </div>

          {/* Skill Analysis */}
          {currentResult.skillAnalysis.length > 0 && (
            <div className="gsj-skill-analysis">
              <h4 className="gsj-text-primary gsj-mb-16">Phân tích kỹ năng</h4>
              {currentResult.skillAnalysis.map((skill, index) => (
                <div key={index} className="gsj-skill-item">
                  <span className="gsj-skill-item__name">{skill.skillName}</span>
                  <span className={`gsj-skill-item__level gsj-skill-item__level--${
                    skill.currentLevel === SkillLevel.BEGINNER ? 'beginner' :
                    skill.currentLevel === SkillLevel.ELEMENTARY ? 'intermediate' :
                    'advanced'
                  }`}>
                    {skill.currentLevel}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="gsj-flex gsj-gap-16 gsj-mt-24">
            <div className="gsj-flex-1">
              <h4 className="gsj-text-success gsj-mb-8">Điểm mạnh</h4>
              <ul className="gsj-text-secondary">
                {(currentResult.overallStrengths.length > 0 ? currentResult.overallStrengths : ['Chưa có nhóm nổi bật rõ rệt.']).map((strength, i) => (
                  <li key={i} className="gsj-mb-8">+ {strength}</li>
                ))}
              </ul>
            </div>
            <div className="gsj-flex-1">
              <h4 className="gsj-text-warning gsj-mb-8">Cần cải thiện</h4>
              <ul className="gsj-text-secondary">
                {(currentResult.overallWeaknesses.length > 0 ? currentResult.overallWeaknesses : ['Chưa có dữ liệu cần cải thiện.']).map((weakness, i) => (
                  <li key={i} className="gsj-mb-8">- {weakness}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="gsj-flex gsj-gap-12 gsj-mt-24">
            <button
              className="gsj-btn gsj-btn--primary"
              onClick={handleGenerateRoadmap}
              disabled={actionLoading}
            >
              <Map size={16} />
              Tạo lộ trình
            </button>
            <button
              className="gsj-btn gsj-btn--secondary"
              onClick={() => setViewMode('detail')}
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderResultViewEnhanced = () => {
    if (!currentResult) return null;

    const completionRate = currentResult.totalQuestions > 0
      ? Math.round((currentResult.answeredQuestions / currentResult.totalQuestions) * 100)
      : 0;
    const correctRate = currentResult.totalQuestions > 0
      ? Math.round((currentResult.correctAnswers / currentResult.totalQuestions) * 100)
      : 0;

    const latestResultAt = selectedJourney?.latestTestResult?.evaluatedAt || currentResult.createdAt;
    const remainingRetakes = selectedJourney?.remainingAssessmentRetakes ?? 0;
    const hasRoadmap = Boolean(selectedJourney?.roadmapSessionId);
    const canRetakeQuiz = remainingRetakes > 0 && selectedJourney?.assessmentTestStatus?.toUpperCase() !== 'IN_PROGRESS';

    const strengths = currentResult.overallStrengths.length > 0
      ? currentResult.overallStrengths
      : ['Chưa có nhóm điểm mạnh rõ ràng. Cần thêm dữ liệu từ các lần luyện tập tiếp theo.'];
    const weaknesses = currentResult.overallWeaknesses.length > 0
      ? currentResult.overallWeaknesses
      : ['Hiện chưa phát hiện nhóm điểm yếu lớn. Hãy tiếp tục luyện tập để xác thực kết quả.'];
    const improvementTips = currentResult.improvementTips.length > 0
      ? currentResult.improvementTips
      : ['Tiếp tục hoàn thành các bài học nền tảng để củng cố kiến thức.'];

    return (
      <div className="gsj-card">
        <div className="gsj-card__header">
          <h3 className="gsj-card__title">
            <Award size={20} />
            Kết quả đánh giá
          </h3>
          <span className="gsj-result-header-time">{formatDateTime(latestResultAt)}</span>
        </div>

        <div className="gsj-card__body">
          <div className={`gsj-result-panel ${currentResult.passed ? 'gsj-result-panel--pass' : 'gsj-result-panel--fail'}`}>
            <div className="gsj-result-panel__score">{currentResult.score}%</div>
            <div className="gsj-result-panel__status">
              {currentResult.passed ? 'Đạt yêu cầu đánh giá' : 'Cần củng cố thêm kiến thức'}
            </div>
            <div className="gsj-result-panel__chips">
              <span className="gsj-result-pill">{getSkillLevelLabel(currentResult.evaluatedLevel)}</span>
              <span className="gsj-result-pill">{currentResult.scoreBandLabel}</span>
              <span className="gsj-result-pill">{currentResult.recommendationLabel}</span>
            </div>
          </div>

          <div className="gsj-result-kpi-grid">
            <div className="gsj-result-kpi-card">
              <div className="gsj-result-kpi-card__label">Câu đúng</div>
              <div className="gsj-result-kpi-card__value">{currentResult.correctAnswers}/{currentResult.totalQuestions}</div>
            </div>
            <div className="gsj-result-kpi-card">
              <div className="gsj-result-kpi-card__label">Câu sai</div>
              <div className="gsj-result-kpi-card__value">{currentResult.incorrectAnswers}</div>
            </div>
            <div className="gsj-result-kpi-card">
              <div className="gsj-result-kpi-card__label">Độ tin cậy</div>
              <div className="gsj-result-kpi-card__value">{currentResult.assessmentConfidence}%</div>
            </div>
          </div>

          <div className="gsj-result-kpi-progress-grid">
            <div className="gsj-result-kpi-progress">
              <div className="gsj-result-kpi-progress__head">
                <span>Tiến độ trả lời</span>
                <strong>{completionRate}%</strong>
              </div>
              <div className="gsj-result-kpi-progress__track">
                <div className="gsj-result-kpi-progress__fill gsj-result-kpi-progress__fill--completion" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
            <div className="gsj-result-kpi-progress">
              <div className="gsj-result-kpi-progress__head">
                <span>Tỷ lệ chính xác</span>
                <strong>{correctRate}%</strong>
              </div>
              <div className="gsj-result-kpi-progress__track">
                <div className="gsj-result-kpi-progress__fill gsj-result-kpi-progress__fill--accuracy" style={{ width: `${correctRate}%` }} />
              </div>
            </div>
          </div>

          {currentResult.reassessmentRecommended && (
            <div className="gsj-result-note">
              <Lightbulb size={16} />
              <span>Hệ thống khuyến nghị làm lại quiz sau khi học xong phần nền tảng để tối ưu lộ trình.</span>
            </div>
          )}

          <div className="gsj-result-section-grid">
            <section className="gsj-result-section">
              <h4 className="gsj-result-section__title">Đánh giá chung</h4>
              <p className="gsj-result-section__text">{currentResult.evaluationSummary}</p>
            </section>

            <section className="gsj-result-section gsj-result-section--strength">
              <h4 className="gsj-result-section__title">Điểm mạnh</h4>
              <ul className="gsj-result-list">
                {strengths.map((item, index) => (
                  <li key={`strength-${index}`}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="gsj-result-section gsj-result-section--weakness">
              <h4 className="gsj-result-section__title">Cần cải thiện</h4>
              <ul className="gsj-result-list">
                {weaknesses.map((item, index) => (
                  <li key={`weakness-${index}`}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="gsj-result-section">
              <h4 className="gsj-result-section__title">Gợi ý hành động</h4>
              <ul className="gsj-result-list">
                {improvementTips.map((tip, index) => (
                  <li key={`tip-${index}`}>{tip}</li>
                ))}
              </ul>
            </section>
          </div>

          {currentResult.skillAnalysis.length > 0 && (
            <section className="gsj-result-section gsj-result-section--full">
              <h4 className="gsj-result-section__title">Phân tích theo nhóm kỹ năng</h4>
              <div className="gsj-result-skill-grid">
                {currentResult.skillAnalysis.map((skill, index) => (
                  <article key={`${skill.skillName}-${index}`} className="gsj-result-skill-card">
                    <div className="gsj-result-skill-card__head">
                      <strong>{skill.skillName}</strong>
                      <span className={`gsj-result-skill-card__level gsj-skill-item__level--${getSkillLevelClass(skill.currentLevel)}`}>
                        {getSkillLevelLabel(skill.currentLevel)}
                      </span>
                    </div>
                    {skill.strengths.length > 0 && (
                      <p className="gsj-result-skill-card__text">
                        <span>Thế mạnh:</span> {skill.strengths.join(', ')}
                      </p>
                    )}
                    {skill.weaknesses.length > 0 && (
                      <p className="gsj-result-skill-card__text">
                        <span>Cần cải thiện:</span> {skill.weaknesses.join(', ')}
                      </p>
                    )}
                    {skill.recommendations.length > 0 && (
                      <p className="gsj-result-skill-card__text">
                        <span>Gợi ý:</span> {skill.recommendations.join(', ')}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {currentResult.questionReviews.length > 0 && (
            <section className="gsj-result-section gsj-result-section--full">
              <h4 className="gsj-result-section__title">Chi tiết bài quiz</h4>
              <div className="gsj-result-review-list">
                {currentResult.questionReviews.map((question, index) => (
                  <article
                    key={`${question.questionId}-${index}`}
                    className={`gsj-result-review-item ${question.isCorrect ? 'gsj-result-review-item--correct' : 'gsj-result-review-item--wrong'}`}
                  >
                    <div className="gsj-result-review-item__head">
                      <span>Câu {question.questionId} · {question.skillArea} · {question.difficulty}</span>
                      <span className={`gsj-result-review-item__status ${question.isCorrect ? 'gsj-result-review-item__status--correct' : 'gsj-result-review-item__status--wrong'}`}>
                        {question.isCorrect ? (
                          <>
                            <CheckCircle size={14} />
                            Đúng
                          </>
                        ) : (
                          <>
                            <X size={14} />
                            Sai
                          </>
                        )}
                      </span>
                    </div>
                    <p className="gsj-result-review-item__question">{question.question}</p>
                    <p className="gsj-result-review-item__answer">
                      <strong>Bạn chọn:</strong> {question.userAnswer}
                    </p>
                    <p className="gsj-result-review-item__answer">
                      <strong>Đáp án đúng:</strong> {question.correctAnswer}
                    </p>
                    {question.explanation && (
                      <p className="gsj-result-review-item__explain">{question.explanation}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="gsj-result-actions">
            {!hasRoadmap && (
              <button
                className="gsj-btn gsj-btn--primary"
                onClick={handleGenerateRoadmap}
                disabled={actionLoading}
              >
                <Map size={16} />
                {actionLoading ? 'Đang tạo lộ trình...' : 'Tạo lộ trình học tập'}
              </button>
            )}
            {hasRoadmap && selectedJourney?.roadmapSessionId && (
              <button
                className="gsj-btn gsj-btn--primary"
                onClick={() => navigate(`/roadmap/${selectedJourney.roadmapSessionId}`)}
              >
                <Map size={16} />
                Xem lộ trình hiện tại
              </button>
            )}
            {canRetakeQuiz && (
              <button
                className="gsj-btn gsj-btn--secondary"
                onClick={handleGenerateTest}
                disabled={actionLoading}
              >
                <RefreshCw size={16} />
                Tạo lại quiz ({remainingRetakes} lượt)
              </button>
            )}
            <button className="gsj-btn gsj-btn--secondary" onClick={() => setViewMode('detail')}>
              Quay lại Journey
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="gsj-page">
      <div className="gsj-container">
        {/* Hero Section */}
        {renderHero()}

        {/* Error Message */}
        {error && (
          <div className="gsj-alert gsj-alert--error gsj-mb-16">
            {error}
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Main Content */}
        <div className="gsj-content">
          {viewMode === 'list' && renderJourneyList()}
          {viewMode === 'detail' && renderDetailView()}
          {viewMode === 'test' && renderTestView()}
          {viewMode === 'result' && renderResultView()}

          {/* Sidebar - Quick Actions */}
          <div className="gsj-sidebar">
            <div className="gsj-card">
              <div className="gsj-card__header">
                <h3 className="gsj-card__title">
                  <Lightbulb size={20} />
                  Mẹo nhanh
                </h3>
              </div>
              <div className="gsj-card__body">
                <div className="gsj-tip">
                  <p className="gsj-text-secondary gsj-mb-0">
                    Làm bài đánh giá chân thực để nhận kết quả chính xác và lộ trình phù hợp nhất với bạn.
                  </p>
                </div>
              </div>
            </div>

            <div className="gsj-card gsj-mt-16">
              <div className="gsj-card__header">
                <h3 className="gsj-card__title">
                  <Activity size={20} />
                  Tổng quan dữ liệu
                </h3>
              </div>
              <div className="gsj-card__body">
                <div className="gsj-overview">
                  <div className="gsj-overview__summary">
                    {overviewSummaryItems.map((summary) => (
                      <div key={summary.key} className="gsj-overview__summary-item">
                        <span className="gsj-overview__summary-label">{summary.label}</span>
                        <strong className="gsj-overview__summary-value">{summary.value}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="gsj-overview__metrics">
                    {overviewRows.map((item) => (
                      <div key={item.key} className="gsj-overview__metric">
                        <div className="gsj-overview__metric-head">
                          <span>{item.label}</span>
                          <span>{item.displayValue}</span>
                        </div>
                        <div className="gsj-overview__bar-track">
                          <div className={`gsj-overview__bar ${item.colorClass}`} style={{ width: `${item.ratio}%` }}></div>
                        </div>
                        <div className="gsj-overview__metric-caption">{item.caption}</div>
                      </div>
                    ))}
                  </div>

                  <p className="gsj-overview__note">{overviewNote}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meowl Guide */}
      <MeowlGuide currentPage="journey" />
    </div>
  );
};

export default GSJJourneyPage;
