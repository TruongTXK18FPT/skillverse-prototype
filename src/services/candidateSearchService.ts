import axiosInstance from './axiosInstance';
import {
  CandidateSearchFilters,
  CandidateSearchResult,
  CandidateSearchResponse,
  AICandidateMatchResponse,
  AiEnhancedAnalysisResponse,
  RecruitmentSessionResponse
} from '../data/portfolioDTOs';

// Helper type for axios error handling
type AxiosError = { response?: { data?: { message?: string } } };

type CandidateSearchApiItem = {
  userId: number;
  fullName: string;
  professionalTitle?: string;
  avatarUrl?: string;
  customUrlSlug?: string;
  topSkills?: string[] | string | null;
  isHighlighted?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
  hasPortfolio?: boolean;
  hourlyRate?: number;
  preferredCurrency?: string;
  totalProjects?: number;
  yearsOfExperience?: number;
  location?: string;
  availabilityStatus?: string;
  matchScore?: number | null;
  skillMatchPercent?: number | null;
  matchQuality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | null;
  primarySkillMatch?: boolean | null;
  skillMatchScore?: number | null;
  projectMatchScore?: number | null;
  certMatchScore?: number | null;
  missionMatchScore?: number | null;
  experienceMatchScore?: number | null;
  evidenceMatchScore?: number | null;
  deliveryMatchScore?: number | null;
  logisticsMatchScore?: number | null;
  confidenceMatchScore?: number | null;
  riskPenaltyScore?: number | null;
  matchedSkills?: string[] | null;
  unmatchedSkills?: string[] | null;
  totalRequiredSkills?: number | null;
  totalCandidateSkills?: number | null;
  completedMissionsCount?: number | null;
  totalCertificatesCount?: number | null;
  totalVerifiedSkillsCount?: number | null;
  relevantProjectsCount?: number | null;
  relevantCertificatesCount?: number | null;
  relevantMissionsCount?: number | null;
  averageMissionRating?: number | null;
  fitExplanation?: string | null;
  fitAnalysis?: CandidateSearchResult['fitAnalysis'];
  aiFitSummary?: string | null;
  shortlistId?: number | null;
  shortlistStatus?: string | null;
  shortlistNotes?: string | null;
};

type CandidateSearchApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: CandidateSearchApiItem[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};

type CandidateMatchApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: {
    candidateId?: number;
    jobId?: number;
    fitSummary?: string;
    skillSignals?: Array<{
      skill?: string;
      evidence?: string;
      isRequired?: boolean;
      relevanceScore?: number;
    }>;
    reasoning?: string;
    confidenceScore?: number;
    matchQuality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    modelUsed?: string;
    processingTimeMs?: number;
    isFallback?: boolean;
  };
};

const normalizeSkills = (value?: string[] | string | null): string[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return value
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  }
};

const deriveMatchQuality = (
  rawScore?: number | null,
): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' => {
  const score = rawScore ?? 0;
  if (score >= 0.8) return 'EXCELLENT';
  if (score >= 0.6) return 'GOOD';
  if (score >= 0.4) return 'FAIR';
  return 'POOR';
};

const normalizeCandidate = (candidate: CandidateSearchApiItem): CandidateSearchResult => {
  const matchScore = candidate.matchScore ?? candidate.fitAnalysis?.overallScore ?? 0;

  return {
    userId: candidate.userId,
    fullName: candidate.fullName,
    professionalTitle: candidate.professionalTitle,
    avatarUrl: candidate.avatarUrl,
    customUrlSlug: candidate.customUrlSlug,
    topSkills: normalizeSkills(candidate.topSkills),
    isHighlighted: Boolean(candidate.isHighlighted),
    isPremium: Boolean(candidate.isPremium ?? candidate.isHighlighted),
    isVerified: Boolean(candidate.isVerified),
    hasPortfolio: Boolean(candidate.hasPortfolio ?? candidate.customUrlSlug),
    hourlyRate: candidate.hourlyRate,
    preferredCurrency: candidate.preferredCurrency,
    totalProjects: candidate.totalProjects,
    yearsOfExperience: candidate.yearsOfExperience,
    location: candidate.location,
    availabilityStatus: candidate.availabilityStatus,
    matchScore,
    skillMatchPercent: candidate.skillMatchPercent ?? 0,
    matchQuality: candidate.matchQuality ?? deriveMatchQuality(matchScore),
    fitExplanation: candidate.fitExplanation ?? candidate.aiFitSummary ?? undefined,
    aiSummary: candidate.aiFitSummary ?? undefined,
    primarySkillMatch: candidate.primarySkillMatch ?? undefined,
    skillMatchScore: candidate.skillMatchScore ?? undefined,
    projectMatchScore: candidate.projectMatchScore ?? undefined,
    certMatchScore: candidate.certMatchScore ?? undefined,
    missionMatchScore: candidate.missionMatchScore ?? undefined,
    experienceMatchScore: candidate.experienceMatchScore ?? undefined,
    evidenceMatchScore: candidate.evidenceMatchScore ?? undefined,
    deliveryMatchScore: candidate.deliveryMatchScore ?? undefined,
    logisticsMatchScore: candidate.logisticsMatchScore ?? undefined,
    confidenceMatchScore: candidate.confidenceMatchScore ?? undefined,
    riskPenaltyScore: candidate.riskPenaltyScore ?? undefined,
    matchedSkills: candidate.matchedSkills ?? undefined,
    unmatchedSkills: candidate.unmatchedSkills ?? undefined,
    totalRequiredSkills: candidate.totalRequiredSkills ?? undefined,
    totalCandidateSkills: candidate.totalCandidateSkills ?? undefined,
    completedMissionsCount: candidate.completedMissionsCount ?? undefined,
    totalCertificatesCount: candidate.totalCertificatesCount ?? undefined,
    totalVerifiedSkillsCount: candidate.totalVerifiedSkillsCount ?? undefined,
    relevantProjectsCount: candidate.relevantProjectsCount ?? undefined,
    relevantCertificatesCount: candidate.relevantCertificatesCount ?? undefined,
    relevantMissionsCount: candidate.relevantMissionsCount ?? undefined,
    averageMissionRating: candidate.averageMissionRating ?? undefined,
    fitAnalysis: candidate.fitAnalysis,
    shortlistId: candidate.shortlistId ?? undefined,
    shortlistStatus: candidate.shortlistStatus ?? undefined,
    shortlistNotes: candidate.shortlistNotes ?? undefined,
  };
};

class CandidateSearchService {

  private handleError(error: unknown, defaultMessage: string): never {
    const axiosError = error as AxiosError;
    const errorMessage = axiosError.response?.data?.message || defaultMessage;
    console.error(`${defaultMessage}:`, errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * Search candidates with filters
   * @requires RECRUITER role
   */
  async searchCandidates(
    filters: CandidateSearchFilters,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'totalScore',
    sortDir: string = 'DESC'
  ): Promise<CandidateSearchResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.skills?.length) {
        params.append('skills', filters.skills.join(','));
      }
      if (filters.query) params.append('query', filters.query);
      if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
      if (filters.location) params.append('location', filters.location);
      if (filters.minHourlyRate !== undefined) params.append('minHourlyRate', filters.minHourlyRate.toString());
      if (filters.maxHourlyRate !== undefined) params.append('maxHourlyRate', filters.maxHourlyRate.toString());
      if (filters.isAvailable !== undefined) params.append('openToOffers', filters.isAvailable.toString());
      if (filters.hasPortfolio !== undefined) params.append('hasPortfolio', filters.hasPortfolio.toString());
      if (filters.isVerified !== undefined) params.append('isVerified', filters.isVerified.toString());
      if (filters.isPremium !== undefined) params.append('isPremium', filters.isPremium.toString());
      if (filters.hasCertificates !== undefined) params.append('hasCertificates', filters.hasCertificates.toString());
      if (filters.hasRelevantProjects !== undefined) params.append('hasRelevantProjects', filters.hasRelevantProjects.toString());
      if (filters.hasCompletedMissions !== undefined) params.append('hasCompletedMissions', filters.hasCompletedMissions.toString());
      if (filters.mustMatchPrimarySkill !== undefined) params.append('mustMatchPrimarySkill', filters.mustMatchPrimarySkill.toString());
      if (filters.minOverallScore !== undefined) params.append('minOverallScore', filters.minOverallScore.toString());
      if (filters.minSkillFit !== undefined) params.append('minSkillFit', filters.minSkillFit.toString());
      if (filters.openToOffers !== undefined) params.append('openToOffers', filters.openToOffers.toString());
      if (filters.jobId !== undefined) params.append('jobId', filters.jobId.toString());
      if (filters.shortTermJobId !== undefined) params.append('shortTermJobId', filters.shortTermJobId.toString());
      if (filters.enableAIMatching !== undefined) params.append('enableAIMatching', filters.enableAIMatching.toString());

      params.append('page', page.toString());
      params.append('size', size.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortDir.toUpperCase());

      const response = await axiosInstance.get<CandidateSearchApiEnvelope>(
        `/api/v1/recruiter/candidates/search?${params.toString()}`
      );
      const payload = response.data;

      return {
        candidates: (payload.data || []).map(normalizeCandidate),
        totalElements: payload.totalElements || 0,
        totalPages: payload.totalPages || 0,
        currentPage: payload.page || 0,
        pageSize: payload.size || size
      };
    } catch (error) {
      this.handleError(error, 'Failed to search candidates');
    }
  }

  async getMatchingCandidatesForJob(
    jobId: number,
    page: number = 0,
    size: number = 20
  ): Promise<CandidateSearchResponse> {
    try {
      const response = await axiosInstance.get<CandidateSearchApiEnvelope>(
        `/api/v1/recruiter/candidates/job/${jobId}?page=${page}&size=${size}`
      );
      const payload = response.data;

      return {
        candidates: (payload.data || []).map(normalizeCandidate),
        totalElements: payload.totalElements || 0,
        totalPages: payload.totalPages || 0,
        currentPage: payload.page || 0,
        pageSize: payload.size || size
      };
    } catch (error) {
      this.handleError(error, 'Failed to fetch matching candidates');
    }
  }

  /**
   * Get deterministic match breakdown for a candidate-job pair
   * @requires RECRUITER role with premium subscription
   */
  async getAIMatchExplanation(jobId: number, candidateId: number): Promise<CandidateSearchResult> {
    try {
      const response = await axiosInstance.get<{success: boolean; data: CandidateSearchApiItem}>(
        `/api/v1/recruiter/candidates/${candidateId}/match?jobId=${jobId}`
      );
      return normalizeCandidate(response.data.data);
    } catch (error) {
      this.handleError(error, 'Failed to get match explanation');
    }
  }

  /**
   * Get deterministic match breakdown for a candidate-shortTermJob pair
   * @requires RECRUITER role with premium subscription
   */
  async getShortTermJobMatchExplanation(shortTermJobId: number, candidateId: number): Promise<CandidateSearchResult> {
    try {
      const response = await axiosInstance.get<{success: boolean; data: CandidateSearchApiItem}>(
        `/api/v1/recruiter/candidates/${candidateId}/shortterm-match?shortTermJobId=${shortTermJobId}`
      );
      return normalizeCandidate(response.data.data);
    } catch (error) {
      this.handleError(error, 'Failed to get short-term job match explanation');
    }
  }

  /**
   * AI-enhanced analysis — combines deterministic scores + AI reasoning
   * @requires RECRUITER role
   */
  async getAiEnhancedAnalysis(candidateId: number, jobId?: number, shortTermJobId?: number): Promise<AiEnhancedAnalysisResponse> {
    try {
      const params = new URLSearchParams();
      if (jobId !== undefined) params.append('jobId', jobId.toString());
      if (shortTermJobId !== undefined) params.append('shortTermJobId', shortTermJobId.toString());
      const response = await axiosInstance.get<{success: boolean; data: AiEnhancedAnalysisResponse}>(
        `/api/v1/recruiter/candidates/${candidateId}/ai-analysis?${params.toString()}`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'Failed to get AI enhanced analysis');
    }
  }

  /**
   * Shortlist a candidate
   * @requires RECRUITER role
   */
  async shortlistCandidate(candidateId: number, jobId?: number): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (jobId !== undefined) {
        params.append('jobId', jobId.toString());
      }
      await axiosInstance.post(
        `/api/v1/recruiter/candidates/${candidateId}/shortlist${params.toString() ? `?${params.toString()}` : ''}`
      );
    } catch (error) {
      this.handleError(error, 'Failed to shortlist candidate');
    }
  }

  /**
   * Remove candidate from shortlist
   * @requires RECRUITER role
   */
  async removeFromShortlist(candidateId: number, jobId?: number): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (jobId !== undefined) {
        params.append('jobId', jobId.toString());
      }
      await axiosInstance.delete(
        `/api/v1/recruiter/candidates/${candidateId}/shortlist${params.toString() ? `?${params.toString()}` : ''}`
      );
    } catch (error) {
      this.handleError(error, 'Failed to remove from shortlist');
    }
  }

  /**
   * Get recruiter's shortlists
   * @requires RECRUITER role
   */
  async getShortlists(): Promise<CandidateSearchResponse> {
    try {
      const response = await axiosInstance.get<CandidateSearchApiEnvelope>(
        '/api/v1/recruiter/candidates/shortlisted'
      );
      const payload = response.data;

      return {
        candidates: (payload.data || []).map(normalizeCandidate),
        totalElements: payload.totalElements || 0,
        totalPages: payload.totalPages || 0,
        currentPage: payload.page || 0,
        pageSize: payload.size || 20
      };
    } catch (error) {
      this.handleError(error, 'Failed to get shortlists');
    }
  }

  /**
   * Connect candidate to a job (initiate recruitment process)
   * @requires RECRUITER role
   */
  async connectCandidateToJob(candidateId: number, jobId: number): Promise<RecruitmentSessionResponse> {
    try {
      const response = await axiosInstance.post<{success: boolean; message: string; data: RecruitmentSessionResponse}>(
        `/api/v1/recruiter/candidates/${candidateId}/connect?jobId=${jobId}`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'Failed to connect candidate to job');
    }
  }

  /**
   * Start chat with candidate
   * @requires RECRUITER role
   */
  async startChatWithCandidate(candidateId: number, jobId?: number): Promise<RecruitmentSessionResponse> {
    try {
      const params = jobId ? `?jobId=${jobId}` : '';
      const response = await axiosInstance.post<{success: boolean; message: string; data: RecruitmentSessionResponse}>(
        `/api/v1/recruiter/candidates/${candidateId}/chat${params}`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'Failed to start chat with candidate');
    }
  }
}

const candidateSearchService = new CandidateSearchService();
export default candidateSearchService;
