export interface AdminJourneyBreakdownItem {
  label: string;
  value: number;
}

export interface AdminJourneyTopBank {
  questionBankId: number;
  title: string;
  domain: string;
  industry?: string;
  jobRole?: string;
  activeQuestionCount: number;
  totalQuestionUsage: number;
  linkedAssessmentTestCount: number;
  linkedJourneyCount: number;
  questionVolumeServed: number;
  averageScore?: number | null;
  lastUsedAt?: string | null;
  readinessStatus: string;
  readinessReason: string;
  difficultyBreakdown: Record<string, number>;
}

export interface AdminJourneyTopQuestion {
  questionId: number;
  questionBankId: number;
  questionBankTitle: string;
  domain: string;
  industry?: string;
  jobRole?: string;
  questionText: string;
  difficulty?: string;
  skillArea?: string;
  category?: string;
  source?: string;
  usedCount: number;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AdminJourneyDashboardResponse {
  totalJourneys: number;
  totalAssessmentTests: number;
  totalEvaluations: number;
  totalQuestionBanks: number;
  totalActiveQuestions: number;
  bankLinkedTests: number;
  aiGeneratedTests: number;
  legacyUnlinkedTests: number;
  recoveryReadyTests: number;
  roadmapReadyJourneys: number;
  questionSelectionsServed: number;
  bankLinkedCoverageRate: number;
  recoveryCoverageRate: number;
  assessmentFunnel: AdminJourneyBreakdownItem[];
  journeyStatusBreakdown: AdminJourneyBreakdownItem[];
  journeyTypeBreakdown: AdminJourneyBreakdownItem[];
  testSourceBreakdown: AdminJourneyBreakdownItem[];
  difficultyBreakdown: AdminJourneyBreakdownItem[];
  questionAuthoringSourceBreakdown: AdminJourneyBreakdownItem[];
  skillAreaBreakdown: AdminJourneyBreakdownItem[];
  topBanks: AdminJourneyTopBank[];
  topQuestions: AdminJourneyTopQuestion[];
}

export interface AdminJourneyListItemResponse {
  journeyId: number;
  userId: number;
  userName: string;
  userEmail: string;
  type?: string;
  domain?: string;
  industry?: string;
  jobRole?: string;
  goal?: string;
  status?: string;
  progressPercentage?: number | null;
  assessmentTestId?: number | null;
  assessmentTestStatus?: string | null;
  questionBankId?: number | null;
  questionBankTitle?: string | null;
  questionSource: string;
  latestScore?: number | null;
  evaluatedLevel?: string | null;
  roadmapReady: boolean;
  roadmapSessionId?: number | null;
  createdAt?: string | null;
  lastActivityAt?: string | null;
  evaluatedAt?: string | null;
}

export interface AdminQuestionAnalyticsItemResponse {
  questionId: number;
  questionBankId: number;
  questionBankTitle: string;
  domain: string;
  industry?: string;
  jobRole?: string;
  questionText: string;
  difficulty?: string;
  skillArea?: string;
  category?: string;
  source?: string;
  usedCount: number;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AdminJourneyPageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
