import axiosInstance from './axiosInstance';
import {
  StartJourneyRequest,
  SubmitTestRequest,
  JourneySummaryResponse,
  AssessmentTestResponse,
  GenerateTestResponse,
  TestResultResponse,
  JourneyDetailResponse,
  JourneyProgressResponse,
  JourneyStatus,
  TestStatus,
  SkillLevel,
  AssessmentQuestion,
  SkillAnalysis,
  QuestionReviewItem
} from '../types/Journey';
import { RoadmapNodeStudyPlanRequest } from '../types/Roadmap';

const DEFAULT_PASSING_SCORE = 70;

type JourneyPageResponse = {
  content: JourneySummaryResponse[];
  totalElements: number;
  totalPages: number;
};

type BackendJourneyPageResponse = {
  content?: unknown[];
  totalElements?: number;
  totalPages?: number;
};

type BackendGenerateTestResponse = {
  journeyId?: number;
  testId?: number;
  title?: string;
  description?: string;
  targetField?: string;
  questionCount?: number;
  timeLimitMinutes?: number;
  difficultyLevel?: string;
  questionsJson?: string;
  message?: string;
};

type BackendAssessmentTestResponse = {
  id?: number;
  title?: string;
  description?: string;
  targetField?: string;
  status?: string;
  questionCount?: number;
  timeLimitMinutes?: number;
  difficultyLevel?: string;
  questionsJson?: string;
  createdAt?: string;
  completedAt?: string;
  expiresAt?: string;
};

type BackendTestResultResponse = {
  id?: number;
  journeyId?: number;
  assessmentTestId?: number;
  scorePercentage?: number;
  evaluatedLevel?: string;
  scoreBand?: string;
  recommendationMode?: string;
  assessmentConfidence?: number;
  reassessmentRecommended?: boolean;
  skillGapsJson?: string;
  strengthsJson?: string;
  evaluationSummary?: string;
  detailedFeedback?: string;
  evaluationDetails?: string;
  aiDetailedFeedback?: string;
  feedbackDetails?: string;
  userAnswersJson?: string;
  correctAnswersJson?: string;
  evaluatedAt?: string;
  createdAt?: string;
  totalQuestions?: number;
  answeredQuestions?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
};

type SkillInsightItem = {
  skill: string;
  description: string;
  howToImprove?: string;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (typeof responseMessage === 'string' && responseMessage.trim().length > 0) {
    return responseMessage;
  }
  return fallback;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const toStringValue = (value: unknown, fallback = ''): string => {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
};

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
};

const safeParseJson = <T>(jsonValue: unknown, fallback: T): T => {
  if (typeof jsonValue !== 'string' || jsonValue.trim().length === 0) {
    return fallback;
  }
  try {
    return JSON.parse(jsonValue) as T;
  } catch {
    return fallback;
  }
};

const normalizeJourneyStatus = (status: unknown): JourneyStatus => {
  const value = toStringValue(status);
  switch (value) {
    case JourneyStatus.NOT_STARTED:
    case JourneyStatus.ASSESSMENT_PENDING:
    case JourneyStatus.TEST_IN_PROGRESS:
    case JourneyStatus.TEST_COMPLETED:
    case JourneyStatus.EVALUATION_PENDING:
    case JourneyStatus.ROADMAP_GENERATING:
    case JourneyStatus.ROADMAP_READY:
    case JourneyStatus.STUDY_PLANS_READY:
    case JourneyStatus.IN_PROGRESS:
    case JourneyStatus.PAUSED:
    case JourneyStatus.COMPLETED:
    case JourneyStatus.CANCELLED:
      return value;
    case 'ROADMAP_GENERATED':
      return JourneyStatus.ROADMAP_READY;
    case 'STUDY_PLAN_IN_PROGRESS':
      return JourneyStatus.STUDY_PLANS_READY;
    case 'ACTIVE':
      return JourneyStatus.IN_PROGRESS;
    default:
      return JourneyStatus.NOT_STARTED;
  }
};

const normalizeSkillLevel = (level: unknown): SkillLevel | undefined => {
  const value = toStringValue(level);
  switch (value) {
    case SkillLevel.BEGINNER:
      return SkillLevel.BEGINNER;
    case SkillLevel.ELEMENTARY:
      return SkillLevel.ELEMENTARY;
    case SkillLevel.INTERMEDIATE:
    case 'UPPER_INTERMEDIATE':
      return SkillLevel.INTERMEDIATE;
    case SkillLevel.ADVANCED:
      return SkillLevel.ADVANCED;
    case SkillLevel.EXPERT:
      return SkillLevel.EXPERT;
    default:
      return undefined;
  }
};

const normalizeTestStatus = (status: unknown): TestStatus => {
  const value = toStringValue(status);
  switch (value) {
    case TestStatus.PENDING:
    case TestStatus.IN_PROGRESS:
    case TestStatus.COMPLETED:
    case TestStatus.EXPIRED:
      return value;
    default:
      return TestStatus.PENDING;
  }
};

const parseAssessmentQuestions = (questionsJson: unknown): AssessmentQuestion[] => {
  const parsed = safeParseJson<unknown[]>(questionsJson, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const question = item as Record<string, unknown>;
      const options = Array.isArray(question.options)
        ? question.options.filter((option): option is string => typeof option === 'string')
        : [];

      return {
        questionId: toNumber(question.questionId, index + 1),
        question: toStringValue(question.question, `Câu hỏi ${index + 1}`),
        options,
        correctAnswer: typeof question.correctAnswer === 'string' ? question.correctAnswer : undefined,
        explanation: typeof question.explanation === 'string' ? question.explanation : undefined,
        difficulty: toStringValue(question.difficulty, 'MEDIUM'),
        skillArea: toStringValue(question.skillArea, 'GENERAL')
      };
    });
};

const mapJourneySummary = (payload: unknown): JourneySummaryResponse => {
  const data = (payload ?? {}) as Record<string, unknown>;
  const latestTestResultRaw = data.latestTestResult as Record<string, unknown> | undefined;
  const parsedRoadmapSessionId = data.roadmapSessionId == null ? undefined : toNumber(data.roadmapSessionId);

  return {
    ...(data as JourneySummaryResponse),
    id: toNumber(data.id),
    type: toStringValue(data.type, 'SKILL'),
    domain: toStringValue(data.domain),
    subCategory: typeof data.subCategory === 'string' ? data.subCategory : undefined,
    jobRole: typeof data.jobRole === 'string' ? data.jobRole : undefined,
    goal: toStringValue(data.goal),
    status: normalizeJourneyStatus(data.status),
    currentLevel: normalizeSkillLevel(data.currentLevel),
    progressPercentage: toNumber(data.progressPercentage),
    roadmapSessionId: parsedRoadmapSessionId && parsedRoadmapSessionId > 0 ? parsedRoadmapSessionId : undefined,
    totalNodesCompleted: data.totalNodesCompleted == null ? undefined : toNumber(data.totalNodesCompleted),
    assessmentTestId: data.assessmentTestId == null ? undefined : toNumber(data.assessmentTestId),
    assessmentTestTitle: typeof data.assessmentTestTitle === 'string' ? data.assessmentTestTitle : undefined,
    assessmentTestQuestionCount: data.assessmentTestQuestionCount == null ? undefined : toNumber(data.assessmentTestQuestionCount),
    assessmentTestStatus: typeof data.assessmentTestStatus === 'string' ? data.assessmentTestStatus : undefined,
    assessmentAttemptCount: data.assessmentAttemptCount == null ? undefined : toNumber(data.assessmentAttemptCount),
    maxAssessmentAttempts: data.maxAssessmentAttempts == null ? undefined : toNumber(data.maxAssessmentAttempts),
    remainingAssessmentRetakes: data.remainingAssessmentRetakes == null ? undefined : toNumber(data.remainingAssessmentRetakes),
    latestTestResult: latestTestResultRaw
      ? {
          resultId: latestTestResultRaw.resultId == null ? undefined : toNumber(latestTestResultRaw.resultId),
          scorePercentage: toNumber(latestTestResultRaw.scorePercentage),
          evaluatedLevel: normalizeSkillLevel(latestTestResultRaw.evaluatedLevel) ?? SkillLevel.BEGINNER,
          skillGapsCount: toNumber(latestTestResultRaw.skillGapsCount),
          strengthsCount: toNumber(latestTestResultRaw.strengthsCount),
          evaluatedAt: typeof latestTestResultRaw.evaluatedAt === 'string' ? latestTestResultRaw.evaluatedAt : undefined
        }
      : undefined,
    milestones: Array.isArray(data.milestones)
      ? data.milestones
          .filter((milestone) => milestone && typeof milestone === 'object')
          .map((milestone) => {
            const item = milestone as Record<string, unknown>;
            return {
              milestone: toStringValue(item.milestone),
              isCompleted: Boolean(item.isCompleted),
              completedAt: toStringValue(item.completedAt)
            };
          })
      : []
  };
};

const mapJourneyDetail = (payload: unknown): JourneyDetailResponse => {
  return mapJourneySummary(payload) as JourneyDetailResponse;
};

const mapAssessmentTest = (payload: BackendAssessmentTestResponse, journeyId: number): AssessmentTestResponse => {
  const questions = parseAssessmentQuestions(payload.questionsJson);
  const totalQuestions = toNumber(payload.questionCount, questions.length);

  return {
    id: toNumber(payload.id),
    journeyId,
    title: toStringValue(payload.title, 'Bài đánh giá kỹ năng'),
    targetField: toStringValue(payload.targetField),
    domain: toStringValue(payload.targetField),
    industry: '',
    role: '',
    questions,
    status: normalizeTestStatus(payload.status),
    totalQuestions,
    passingScore: DEFAULT_PASSING_SCORE,
    createdAt: toStringValue(payload.createdAt, new Date().toISOString()),
    completedAt: payload.completedAt,
    expiresAt: payload.expiresAt
  };
};

const mapGenerateTestResponse = (payload: BackendGenerateTestResponse, journeyId: number): GenerateTestResponse => {
  const test = mapAssessmentTest(
    {
      id: payload.testId,
      title: payload.title,
      description: payload.description,
      targetField: payload.targetField,
      status: TestStatus.PENDING,
      questionCount: payload.questionCount,
      timeLimitMinutes: payload.timeLimitMinutes,
      difficultyLevel: payload.difficultyLevel,
      questionsJson: payload.questionsJson,
      createdAt: new Date().toISOString()
    },
    journeyId
  );

  return {
    test,
    message: toStringValue(payload.message, 'Đã tạo bài đánh giá thành công.'),
    estimatedTimeMinutes: toNumber(payload.timeLimitMinutes, Math.max(10, test.totalQuestions))
  };
};

const parseSkillInsights = (jsonValue: unknown): SkillInsightItem[] => {
  const parsed = safeParseJson<unknown[]>(jsonValue, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => {
      if (typeof item === 'string') {
        return { skill: item, description: '' };
      }
      if (!item || typeof item !== 'object') {
        return null;
      }

      const rawItem = item as Record<string, unknown>;
      const skill = toStringValue(rawItem.skill);
      if (!skill) {
        return null;
      }

      return {
        skill,
        description: toStringValue(rawItem.description),
        howToImprove: typeof rawItem.howToImprove === 'string' ? rawItem.howToImprove : undefined
      };
    })
    .filter((item): item is SkillInsightItem => item !== null);
};

const inferTotalQuestions = (payload: BackendTestResultResponse): number => {
  const fromApi = toNumber(payload.totalQuestions, 0);
  if (fromApi > 0) {
    return fromApi;
  }

  const parsed = safeParseJson<unknown>(payload.correctAnswersJson, []);
  if (Array.isArray(parsed)) {
    return parsed.length;
  }
  if (parsed && typeof parsed === 'object') {
    return Object.keys(parsed as Record<string, unknown>).length;
  }
  return 0;
};

const formatInsightLabel = (item: SkillInsightItem): string => {
  if (!item.description) {
    return item.skill;
  }
  return `${item.skill}: ${item.description}`;
};

const normalizeAnswerText = (value: string): string => {
  return value
    .replace(/^[A-D](?:\s*[.):-]|\s+)/i, '')
    .trim()
    .toLowerCase();
};

const extractOptionKey = (value: string): string => {
  const match = value.trim().match(/^([A-D])(?:\s*[.):-]|\s+|$)/i);
  return match?.[1]?.toUpperCase() ?? '';
};

const resolveAnswerText = (answer: string, optionKey: string, options: string[]): string => {
  if (optionKey) {
    const index = optionKey.charCodeAt(0) - 65;
    if (index >= 0 && index < options.length) {
      return options[index];
    }
  }
  return answer;
};

const buildQuestionReviews = (payload: BackendTestResultResponse): QuestionReviewItem[] => {
  const questions = safeParseJson<unknown[]>(payload.correctAnswersJson, []);
  const answersRaw = safeParseJson<Record<string, unknown>>(payload.userAnswersJson, {});
  if (!Array.isArray(questions) || questions.length === 0) {
    return [];
  }

  return questions
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const question = item as Record<string, unknown>;
      const questionId = toNumber(question.questionId, index + 1);
      const questionText = toStringValue(question.question, `Câu hỏi ${index + 1}`);
      const skillArea = toStringValue(question.skillArea, 'GENERAL');
      const difficulty = toStringValue(question.difficulty, 'MEDIUM');
      const explanation = typeof question.explanation === 'string' ? question.explanation : undefined;
      const options = Array.isArray(question.options)
        ? question.options.filter((option): option is string => typeof option === 'string')
        : [];

      const correctRaw = toStringValue(question.correctAnswer);
      const userRaw = toStringValue(
        answersRaw[String(questionId)] ?? answersRaw[String(index + 1)] ?? ''
      );

      const correctKey = extractOptionKey(correctRaw);
      const userKey = extractOptionKey(userRaw);
      const correctText = normalizeAnswerText(resolveAnswerText(correctRaw, correctKey, options));
      const userText = normalizeAnswerText(resolveAnswerText(userRaw, userKey, options));

      const isCorrect = (correctKey && userKey)
        ? correctKey === userKey
        : (correctText.length > 0 && userText.length > 0 && correctText === userText);

      return {
        questionId,
        question: questionText,
        skillArea,
        difficulty,
        options,
        userAnswer: userRaw || 'Chưa trả lời',
        correctAnswer: correctRaw || 'N/A',
        isCorrect,
        explanation
      } satisfies QuestionReviewItem;
    })
    .filter((item): item is QuestionReviewItem => item !== null);
};

const getScoreBandLabel = (scoreBand: string, score: number): string => {
  switch (scoreBand) {
    case 'ZERO_BASE':
      return 'Nền tảng 0';
    case 'FOUNDATION':
      return 'Nền tảng';
    case 'CORE':
      return 'Cốt lõi';
    case 'ADVANCED':
      return 'Nâng cao';
    case 'EXPERT':
      return 'Chuyên sâu';
    default:
      if (score <= 20) return 'Nền tảng 0';
      if (score <= 45) return 'Nền tảng';
      if (score <= 70) return 'Cốt lõi';
      if (score <= 85) return 'Nâng cao';
      return 'Chuyên sâu';
  }
};

const getRecommendationLabel = (mode: string, score: number): string => {
  switch (mode) {
    case 'FROM_ZERO':
      return 'Lộ trình từ zero';
    case 'FOUNDATION':
      return 'Lộ trình nền tảng';
    case 'STANDARD':
      return 'Lộ trình tiêu chuẩn';
    case 'ADVANCED':
      return 'Lộ trình nâng cao';
    case 'FAST_TRACK':
      return 'Lộ trình tăng tốc';
    default:
      if (score <= 0) return 'Lộ trình từ zero';
      if (score <= 45) return 'Lộ trình nền tảng';
      if (score <= 70) return 'Lộ trình tiêu chuẩn';
      if (score <= 90) return 'Lộ trình nâng cao';
      return 'Lộ trình tăng tốc';
  }
};

const mapTestResult = (payload: BackendTestResultResponse): TestResultResponse => {
  const score = toNumber(payload.scorePercentage);
  const totalQuestions = inferTotalQuestions(payload);
  const correctAnswers = toNumber(payload.correctAnswers, totalQuestions > 0 ? Math.round((score * totalQuestions) / 100) : 0);
  const incorrectAnswers = toNumber(payload.incorrectAnswers, Math.max(0, totalQuestions - correctAnswers));
  const answeredQuestions = toNumber(payload.answeredQuestions, Math.min(totalQuestions, correctAnswers + incorrectAnswers));
  const evaluatedLevel = normalizeSkillLevel(payload.evaluatedLevel) ?? SkillLevel.BEGINNER;
  const scoreBand = toStringValue(payload.scoreBand);
  const recommendationMode = toStringValue(payload.recommendationMode);
  const assessmentConfidence = toNumber(payload.assessmentConfidence, 60);
  const reassessmentRecommended = toBoolean(
    payload.reassessmentRecommended,
    totalQuestions > 0 && (score === 0 || answeredQuestions < Math.ceil(totalQuestions * 0.6))
  );
  const scoreBandLabel = getScoreBandLabel(scoreBand, score);
  const recommendationLabel = getRecommendationLabel(recommendationMode, score);

  const skillGaps = parseSkillInsights(payload.skillGapsJson);
  const strengths = parseSkillInsights(payload.strengthsJson);
  const questionReviews = buildQuestionReviews(payload);

  const analysisBySkill = new Map<string, SkillAnalysis>();

  strengths.forEach((item) => {
    analysisBySkill.set(item.skill, {
      skillName: item.skill,
      currentLevel: evaluatedLevel,
      gap: 0,
      strengths: item.description ? [item.description] : [item.skill],
      weaknesses: [],
      recommendations: []
    });
  });

  skillGaps.forEach((item) => {
    const existing = analysisBySkill.get(item.skill);
    if (existing) {
      existing.gap = -1;
      existing.weaknesses.push(item.description || item.skill);
      if (item.howToImprove) {
        existing.recommendations.push(item.howToImprove);
      }
      return;
    }

    analysisBySkill.set(item.skill, {
      skillName: item.skill,
      currentLevel: evaluatedLevel,
      gap: -1,
      strengths: [],
      weaknesses: [item.description || item.skill],
      recommendations: item.howToImprove ? [item.howToImprove] : []
    });
  });

  const improvementTips = skillGaps
    .map((item) => item.howToImprove)
    .filter((tip): tip is string => typeof tip === 'string' && tip.trim().length > 0);

  const evaluationSummary = toStringValue(payload.evaluationSummary, 'Đã hoàn thành đánh giá kỹ năng.');
  const detailedFeedbackFromApi = [
    payload.detailedFeedback,
    payload.evaluationDetails,
    payload.aiDetailedFeedback,
    payload.feedbackDetails
  ].find((value) => typeof value === 'string' && value.trim().length > 0) ?? '';

  const generatedDetailedFeedback = [
    strengths.length > 0
      ? `Điểm mạnh nổi bật: ${strengths.slice(0, 3).map((item) => item.skill).join(', ')}.`
      : '',
    skillGaps.length > 0
      ? `Nhóm cần ưu tiên cải thiện: ${skillGaps.slice(0, 4).map((item) => item.skill).join(', ')}.`
      : '',
    improvementTips.length > 0
      ? `Gợi ý hành động: ${improvementTips.slice(0, 2).join(' ')}`
      : ''
  ].filter(Boolean).join('\n\n');

  const detailedFeedback = detailedFeedbackFromApi.trim() && detailedFeedbackFromApi.trim() !== evaluationSummary.trim()
    ? detailedFeedbackFromApi.trim()
    : (generatedDetailedFeedback || evaluationSummary);

  const passingScore = DEFAULT_PASSING_SCORE;

  return {
    id: toNumber(payload.id),
    journeyId: toNumber(payload.journeyId),
    testId: toNumber(payload.assessmentTestId),
    score,
    evaluatedLevel,
    scoreBand,
    scoreBandLabel,
    recommendationMode,
    recommendationLabel,
    assessmentConfidence,
    reassessmentRecommended,
    totalQuestions,
    answeredQuestions,
    correctAnswers,
    incorrectAnswers,
    passingScore,
    passed: score >= passingScore,
    skillAnalysis: Array.from(analysisBySkill.values()),
    questionReviews,
    overallStrengths: strengths.map(formatInsightLabel),
    overallWeaknesses: skillGaps.map(formatInsightLabel),
    skillGaps: skillGaps.map((item) => item.skill),
    evaluationSummary,
    detailedFeedback,
    improvementTips: improvementTips.length > 0 ? improvementTips : ['Tiếp tục luyện tập theo các kỹ năng còn thiếu.'],
    createdAt: toStringValue(payload.createdAt || payload.evaluatedAt, new Date().toISOString())
  };
};

/**
 * GSJ Journey Service - Guided SkillVerse Journey API
 * Handles all journey-related API calls including assessment tests and roadmaps
 */
const journeyService = {
  // ==================== Journey Lifecycle ====================

  /**
   * Start a new guided journey with comprehensive assessment info
   */
  startJourney: async (request: StartJourneyRequest): Promise<JourneySummaryResponse> => {
    try {
      const response = await axiosInstance.post<JourneySummaryResponse>(
        '/v1/journey',
        request
      );
      return mapJourneySummary(response.data);
    } catch (error) {
      console.error('Failed to start journey:', error);
      throw new Error(getErrorMessage(error, 'Failed to start journey. Please try again.'));
    }
  },

  /**
   * Get journey by ID with full details
   */
  getJourneyById: async (journeyId: number): Promise<JourneyDetailResponse> => {
    try {
      const response = await axiosInstance.get<JourneyDetailResponse>(
        `/v1/journey/${journeyId}`
      );
      return mapJourneyDetail(response.data);
    } catch (error) {
      console.error('Failed to fetch journey:', error);
      throw new Error(getErrorMessage(error, 'Failed to load journey details.'));
    }
  },

  /**
   * Get all journeys for current user with pagination
   */
  getUserJourneys: async (page = 0, size = 10): Promise<JourneyPageResponse> => {
    try {
      const response = await axiosInstance.get<BackendJourneyPageResponse>(
        '/v1/journey',
        { params: { page, size } }
      );

      const content = Array.isArray(response.data.content)
        ? response.data.content.map(mapJourneySummary)
        : [];

      return {
        content,
        totalElements: toNumber(response.data.totalElements, content.length),
        totalPages: toNumber(response.data.totalPages, 1)
      };
    } catch (error) {
      console.error('Failed to fetch journeys:', error);
      throw new Error(getErrorMessage(error, 'Failed to load journeys.'));
    }
  },

  /**
   * Get all active journeys for current user
   */
  getActiveJourneys: async (): Promise<JourneySummaryResponse[]> => {
    try {
      const response = await axiosInstance.get<JourneySummaryResponse[]>(
        '/v1/journey/active'
      );
      return Array.isArray(response.data) ? response.data.map(mapJourneySummary) : [];
    } catch (error) {
      console.error('Failed to fetch active journeys:', error);
      throw new Error(getErrorMessage(error, 'Failed to load active journeys.'));
    }
  },

  /**
   * Get current journey progress for dashboard
   */
  getCurrentJourneyProgress: async (): Promise<JourneySummaryResponse | null> => {
    try {
      const response = await axiosInstance.get<JourneySummaryResponse>(
        '/v1/journey/current'
      );
      return mapJourneySummary(response.data);
    } catch (error: any) {
      if (error.response?.status === 204) {
        return null;
      }
      console.error('Failed to fetch current journey:', error);
      throw new Error(getErrorMessage(error, 'Failed to load current journey.'));
    }
  },

  /**
   * Get journey progress details
   */
  getJourneyProgress: async (journeyId: number): Promise<JourneyProgressResponse> => {
    try {
      const response = await axiosInstance.get<JourneyProgressResponse>(
        `/v1/journey/${journeyId}/progress`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch journey progress:', error);
      throw new Error(getErrorMessage(error, 'Failed to load journey progress.'));
    }
  },

  // ==================== Journey Status Management ====================

  /**
   * Pause a journey
   */
  pauseJourney: async (journeyId: number): Promise<JourneySummaryResponse> => {
    try {
      const response = await axiosInstance.post<JourneySummaryResponse>(
        `/v1/journey/${journeyId}/pause`
      );
      return mapJourneySummary(response.data);
    } catch (error) {
      console.error('Failed to pause journey:', error);
      throw new Error(getErrorMessage(error, 'Failed to pause journey.'));
    }
  },

  /**
   * Resume a paused journey
   */
  resumeJourney: async (journeyId: number): Promise<JourneySummaryResponse> => {
    try {
      const response = await axiosInstance.post<JourneySummaryResponse>(
        `/v1/journey/${journeyId}/resume`
      );
      return mapJourneySummary(response.data);
    } catch (error) {
      console.error('Failed to resume journey:', error);
      throw new Error(getErrorMessage(error, 'Failed to resume journey.'));
    }
  },

  /**
   * Cancel a journey
   */
  cancelJourney: async (journeyId: number): Promise<JourneySummaryResponse> => {
    try {
      const response = await axiosInstance.post<JourneySummaryResponse>(
        `/v1/journey/${journeyId}/cancel`
      );
      return mapJourneySummary(response.data);
    } catch (error) {
      console.error('Failed to cancel journey:', error);
      throw new Error(getErrorMessage(error, 'Failed to cancel journey.'));
    }
  },

  /**
   * Mark journey as completed
   */
  completeJourney: async (journeyId: number): Promise<JourneySummaryResponse> => {
    try {
      const response = await axiosInstance.post<JourneySummaryResponse>(
        `/v1/journey/${journeyId}/complete`
      );
      return mapJourneySummary(response.data);
    } catch (error) {
      console.error('Failed to complete journey:', error);
      throw new Error(getErrorMessage(error, 'Failed to complete journey.'));
    }
  },

  /**
   * Update journey status
   */
  updateJourneyStatus: async (journeyId: number, status: string): Promise<JourneySummaryResponse> => {
    try {
      const response = await axiosInstance.put<JourneySummaryResponse>(
        `/v1/journey/${journeyId}/status`,
        null,
        { params: { status } }
      );
      return mapJourneySummary(response.data);
    } catch (error) {
      console.error('Failed to update journey status:', error);
      throw new Error(getErrorMessage(error, 'Failed to update journey status.'));
    }
  },

  // ==================== Assessment Test ====================

  /**
   * Generate AI assessment test for a journey
   * This triggers AI to create a personalized test based on user's profile
   */
  generateAssessmentTest: async (journeyId: number): Promise<GenerateTestResponse> => {
    try {
      const response = await axiosInstance.post<BackendGenerateTestResponse>(
        `/v1/journey/${journeyId}/generate-test`,
        {},
        { timeout: 600000 } // 10 minutes for AI generation
      );
      return mapGenerateTestResponse(response.data, journeyId);
    } catch (error) {
      console.error('Failed to generate assessment test:', error);
      throw new Error(getErrorMessage(error, 'Failed to generate assessment test. Please try again.'));
    }
  },

  /**
   * Get assessment test details
   */
  getAssessmentTest: async (journeyId: number, testId: number): Promise<AssessmentTestResponse> => {
    try {
      const response = await axiosInstance.get<BackendAssessmentTestResponse>(
        `/v1/journey/${journeyId}/test/${testId}`
      );
      return mapAssessmentTest(response.data, journeyId);
    } catch (error) {
      console.error('Failed to fetch assessment test:', error);
      throw new Error(getErrorMessage(error, 'Failed to load assessment test.'));
    }
  },

  /**
   * Submit test answers and get AI evaluation
   */
  submitTest: async (journeyId: number, request: SubmitTestRequest): Promise<TestResultResponse> => {
    try {
      const response = await axiosInstance.post<BackendTestResultResponse>(
        `/v1/journey/${journeyId}/submit-test`,
        request,
        { timeout: 600000 } // 10 minutes for AI evaluation
      );
      return mapTestResult(response.data);
    } catch (error) {
      console.error('Failed to submit test:', error);
      throw new Error(getErrorMessage(error, 'Failed to submit test. Please try again.'));
    }
  },

  /**
   * Get test result/evaluation
   */
  getTestResult: async (journeyId: number, resultId: number): Promise<TestResultResponse> => {
    try {
      const response = await axiosInstance.get<BackendTestResultResponse>(
        `/v1/journey/${journeyId}/result/${resultId}`
      );
      return mapTestResult(response.data);
    } catch (error) {
      console.error('Failed to fetch test result:', error);
      throw new Error(getErrorMessage(error, 'Failed to load test result.'));
    }
  },

  // ==================== Roadmap Integration ====================

  /**
   * Generate roadmap for journey based on evaluation results
   */
  generateRoadmap: async (journeyId: number): Promise<JourneySummaryResponse> => {
    try {
      const response = await axiosInstance.post<JourneySummaryResponse>(
        `/v1/journey/${journeyId}/generate-roadmap`,
        {},
        { timeout: 600000 } // 10 minutes for AI generation
      );
      return mapJourneySummary(response.data);
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      throw new Error(getErrorMessage(error, 'Failed to generate roadmap. Please try again.'));
    }
  },

  /**
   * Get roadmap for journey
   */
  getRoadmap: async (journeyId: number): Promise<any> => {
    try {
      const response = await axiosInstance.get(
        `/v1/journey/${journeyId}/roadmap`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch roadmap:', error);
      throw new Error(getErrorMessage(error, 'Failed to load roadmap.'));
    }
  },

  // ==================== Study Plans ====================

  /**
   * Generate study plan suggestions for all roadmap nodes
   */
  generateStudyPlans: async (journeyId: number): Promise<any> => {
    try {
      const response = await axiosInstance.post(
        `/v1/journey/${journeyId}/generate-study-plans`,
        {},
        { timeout: 600000 }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to generate study plans:', error);
      throw new Error(getErrorMessage(error, 'Failed to generate study plans.'));
    }
  },

  /**
   * Create study plan for specific roadmap node
   */
  createStudyPlanForNode: async (
    journeyId: number,
    nodeId: string,
    request?: RoadmapNodeStudyPlanRequest
  ): Promise<any> => {
    try {
      const response = await axiosInstance.post(
        `/v1/journey/${journeyId}/study-plan/node/${encodeURIComponent(nodeId)}`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create study plan:', error);
      throw new Error(getErrorMessage(error, 'Failed to create study plan.'));
    }
  },

  /**
   * Create study plan task for roadmap node using roadmap session id.
   */
  createStudyPlanForRoadmapNode: async (
    roadmapSessionId: number,
    nodeId: string,
    request?: RoadmapNodeStudyPlanRequest
  ): Promise<any> => {
    try {
      const response = await axiosInstance.post(
        `/v1/journey/roadmap/${roadmapSessionId}/study-plan/node/${encodeURIComponent(nodeId)}`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create study plan from roadmap node:', error);
      throw new Error(getErrorMessage(error, 'Failed to create study plan from roadmap node.'));
    }
  },

  // ==================== AI Report ====================

  /**
   * Generate AI summary report for journey
   */
  generateAiReport: async (journeyId: number): Promise<JourneySummaryResponse> => {
    try {
      const response = await axiosInstance.post<JourneySummaryResponse>(
        `/v1/journey/${journeyId}/generate-report`,
        {},
        { timeout: 600000 }
      );
      return mapJourneySummary(response.data);
    } catch (error) {
      console.error('Failed to generate AI report:', error);
      throw new Error(getErrorMessage(error, 'Failed to generate AI report.'));
    }
  }
};

export default journeyService;
