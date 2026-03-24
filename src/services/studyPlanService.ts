import axiosInstance from './axiosInstance';
import { 
  CreateStudySessionRequest, 
  GenerateScheduleRequest, 
  StudySessionResponse, 
  StudySessionStatus,
  RefineScheduleRequest,
  CheckScheduleHealthRequest,
  ScheduleHealthIssue,
  ScheduleHealthReport
} from '../types/StudyPlan';

const BASE_URL = '/study-planner';

type RawSessionScore = {
  id?: string | null;
  title?: string | null;
  score?: number | null;
};

type RawScheduleHealthReport = Partial<Omit<ScheduleHealthReport, 'issues' | 'overallScore' | 'sessionScores'>> & {
  overallScore?: number | null;
  issues?: ScheduleHealthIssue[] | null;
  sessionScores?: RawSessionScore[] | Record<string, number> | null;
};

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const normalizeIssues = (report: RawScheduleHealthReport): ScheduleHealthIssue[] => {
  if (Array.isArray(report.issues) && report.issues.length > 0) {
    return report.issues
      .filter((issue): issue is ScheduleHealthIssue => Boolean(issue?.message && issue?.severity))
      .map((issue) => ({
        message: issue.message,
        severity: issue.severity,
        suggestion: issue.suggestion,
      }));
  }

  const errors = Array.isArray(report.errors) ? report.errors.filter(Boolean) : [];
  const warnings = Array.isArray(report.warnings) ? report.warnings.filter(Boolean) : [];

  return [
    ...errors.map((message) => ({ message, severity: 'ERROR' as const })),
    ...warnings.map((message) => ({ message, severity: 'WARNING' as const })),
  ];
};

const normalizeSessionScores = (
  rawScores: RawScheduleHealthReport['sessionScores'],
): Record<string, number> => {
  if (Array.isArray(rawScores)) {
    return rawScores.reduce<Record<string, number>>((accumulator, score, index) => {
      const key = score?.id || score?.title || `session-${index}`;
      const value = typeof score?.score === 'number' ? score.score : 0;
      accumulator[String(key)] = value;
      return accumulator;
    }, {});
  }

  if (rawScores && typeof rawScores === 'object') {
    return Object.entries(rawScores).reduce<Record<string, number>>((accumulator, [key, value]) => {
      accumulator[key] = typeof value === 'number' ? value : 0;
      return accumulator;
    }, {});
  }

  return {};
};

const computeOverallScore = (
  report: RawScheduleHealthReport,
  issues: ScheduleHealthIssue[],
  scoreMap: Record<string, number>,
) => {
  if (typeof report.overallScore === 'number') {
    return clampScore(report.overallScore);
  }

  const scoreValues = Object.values(scoreMap);
  const averageScore =
    scoreValues.length > 0
      ? scoreValues.reduce((total, score) => total + score, 0) / scoreValues.length
      : 100;
  const penalty = issues.reduce(
    (total, issue) => total + (issue.severity === 'ERROR' ? 14 : 6),
    0,
  );

  return clampScore(averageScore - penalty);
};

const normalizeScheduleHealthReport = (
  report: RawScheduleHealthReport,
): ScheduleHealthReport => {
  const warnings = Array.isArray(report.warnings) ? report.warnings.filter(Boolean) : [];
  const errors = Array.isArray(report.errors) ? report.errors.filter(Boolean) : [];
  const suggestions = Array.isArray(report.suggestions)
    ? report.suggestions.filter(Boolean)
    : [];
  const issues = normalizeIssues({ ...report, warnings, errors });
  const sessionScores = normalizeSessionScores(report.sessionScores);

  return {
    healthy: typeof report.healthy === 'boolean' ? report.healthy : errors.length === 0,
    overallScore: computeOverallScore(report, issues, sessionScores),
    issues,
    warnings,
    errors,
    sessionScores,
    suggestions,
    adjustedSessions: Array.isArray(report.adjustedSessions)
      ? report.adjustedSessions
      : [],
  };
};

export const studyPlanService = {
  createSession: async (request: CreateStudySessionRequest): Promise<StudySessionResponse> => {
    const response = await axiosInstance.post<StudySessionResponse>(`${BASE_URL}/sessions`, request);
    return response.data;
  },

  createSessionsBatch: async (requests: CreateStudySessionRequest[]): Promise<StudySessionResponse[]> => {
    const response = await axiosInstance.post<StudySessionResponse[]>(`${BASE_URL}/sessions/batch`, requests);
    return response.data;
  },

  getSessions: async (): Promise<StudySessionResponse[]> => {
    const response = await axiosInstance.get<StudySessionResponse[]>(`${BASE_URL}/sessions`);
    return response.data;
  },

  getSessionsInRange: async (start: string, end: string): Promise<StudySessionResponse[]> => {
    const response = await axiosInstance.get<StudySessionResponse[]>(`${BASE_URL}/sessions/range`, {
      params: { start, end }
    });
    return response.data;
  },

  updateStatus: async (sessionId: string, status: StudySessionStatus): Promise<StudySessionResponse> => {
    const response = await axiosInstance.patch<StudySessionResponse>(`${BASE_URL}/sessions/${sessionId}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/sessions/${sessionId}`);
  },

  generateSchedule: async (request: GenerateScheduleRequest): Promise<StudySessionResponse[]> => {
    const payload = {
      ...request,
      preferredTimeWindows: request.preferredTimeWindows?.map(w => `${w.startTime}-${w.endTime}`)
    };
    const response = await axiosInstance.post<StudySessionResponse[]>(`${BASE_URL}/generate-schedule`, payload, {
      timeout: 3600000 // 1 hour timeout (increased to handle long AI generation)
    });
    return response.data;
  },

  generateProposal: async (request: GenerateScheduleRequest): Promise<StudySessionResponse[]> => {
    const payload = {
      ...request,
      preferredTimeWindows: request.preferredTimeWindows?.map(w => `${w.startTime}-${w.endTime}`)
    };
    const response = await axiosInstance.post<StudySessionResponse[]>(`${BASE_URL}/generate-proposal`, payload, {
      timeout: 3600000 // 1 hour timeout (increased to handle long AI generation)
    });
    return response.data;
  },

  refineSchedule: async (request: RefineScheduleRequest): Promise<StudySessionResponse[]> => {
    const response = await axiosInstance.post<StudySessionResponse[]>(`${BASE_URL}/refine-schedule`, request);
    return response.data;
  },

  checkScheduleHealth: async (request: CheckScheduleHealthRequest): Promise<ScheduleHealthReport> => {
    const response = await axiosInstance.post<RawScheduleHealthReport>(`${BASE_URL}/schedule-health`, request);
    return normalizeScheduleHealthReport(response.data ?? {});
  },

  suggestHealthyAdjustments: async (request: CheckScheduleHealthRequest): Promise<ScheduleHealthReport> => {
    const response = await axiosInstance.post<RawScheduleHealthReport>(`${BASE_URL}/schedule-suggest-fix`, request);
    return normalizeScheduleHealthReport(response.data ?? {});
  }
};
