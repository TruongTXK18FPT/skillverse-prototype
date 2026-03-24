export enum StudySessionStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED'
}

export interface TimeWindow {
  startTime: string;
  endTime: string;
}

export interface CreateStudySessionRequest {
  title: string;
  startTime: string; // ISO Date Time
  endTime: string;   // ISO Date Time
  description?: string;
}

export interface GenerateScheduleRequest {
  subjectName: string;
  freeTimeDescription?: string;
  durationMinutes?: number;
  deadline: string; // ISO Date (YYYY-MM-DD)
  startDate: string; // ISO Date (YYYY-MM-DD)
  timezone: string;
  preferredDays?: string[];
  preferredTimeWindows?: TimeWindow[];
  topics?: string[];
  desiredOutcome?: string;
  intensityLevel?: string;
  breakMinutesBetweenSessions?: number;
  maxSessionsPerDay?: number;
  studyMethod?: string;
  resourcesPreference?: string;
  studyPreference?: string;
  avoidLateNight?: boolean;
  allowLateNight?: boolean;
  confirmLateNight?: boolean;
  earliestStartLocalTime?: string;
  latestEndLocalTime?: string;
  maxDailyStudyMinutes?: number;
  chronotype?: string;
  idealFocusWindows?: string[];
}

export interface StudySessionResponse {
  id: string; // UUID
  title: string;
  startTime: string;
  endTime: string;
  status: StudySessionStatus;
  description?: string;
  sessionScore?: number; // 0-100
  warnings?: string[];
}

export type StudySession = StudySessionResponse;

export interface ScheduleHealthIssue {
  message: string;
  severity: 'WARNING' | 'ERROR';
  suggestion?: string;
}

export interface CheckScheduleHealthRequest {
  sessions: StudySessionResponse[];
  timezone?: string;
  earliestStartLocalTime?: string;
  latestEndLocalTime?: string;
  maxDailyStudyMinutes?: number;
  breakMinutesBetweenSessions?: number;
  studyPreference?: string;
  chronotype?: string;
  idealFocusWindows?: string[];
  userPreferences?: GenerateScheduleRequest;
}

export interface ScheduleHealthReport {
  healthy?: boolean;
  overallScore: number;
  issues: ScheduleHealthIssue[];
  warnings: string[];
  errors: string[];
  sessionScores: Record<string, number>; // sessionId -> score
  suggestions: string[];
  adjustedSessions?: StudySessionResponse[];
}

export interface RefineScheduleRequest {
  currentSchedule: StudySessionResponse[];
  userFeedback: string;
  originalGoal?: string;
}
