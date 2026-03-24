import axiosInstance from './axiosInstance';
import {
  CandidateSearchFilters,
  CandidateSearchResult,
  CandidateSearchResponse,
  AICandidateMatchResponse,
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
  hourlyRate?: number;
  preferredCurrency?: string;
  totalProjects?: number;
  matchScore?: number | null;
  skillMatchPercent?: number | null;
  matchQuality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | null;
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

const normalizeCandidate = (candidate: CandidateSearchApiItem): CandidateSearchResult => ({
  userId: candidate.userId,
  fullName: candidate.fullName,
  professionalTitle: candidate.professionalTitle,
  avatarUrl: candidate.avatarUrl,
  customUrlSlug: candidate.customUrlSlug,
  topSkills: normalizeSkills(candidate.topSkills),
  isHighlighted: Boolean(candidate.isHighlighted),
  isPremium: Boolean(candidate.isHighlighted),
  isVerified: false,
  hasPortfolio: true,
  hourlyRate: candidate.hourlyRate,
  preferredCurrency: candidate.preferredCurrency,
  totalProjects: candidate.totalProjects,
  matchScore: candidate.matchScore ?? 0,
  skillMatchPercent: candidate.skillMatchPercent ?? 0,
  matchQuality: candidate.matchQuality ?? deriveMatchQuality(candidate.matchScore),
  fitExplanation: candidate.aiFitSummary ?? undefined,
  aiSummary: candidate.aiFitSummary ?? undefined,
  shortlistId: candidate.shortlistId ?? undefined,
  shortlistStatus: candidate.shortlistStatus ?? undefined,
  shortlistNotes: candidate.shortlistNotes ?? undefined,
});

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
      if (filters.minHourlyRate !== undefined) params.append('minHourlyRate', filters.minHourlyRate.toString());
      if (filters.maxHourlyRate !== undefined) params.append('maxHourlyRate', filters.maxHourlyRate.toString());
      if (filters.isAvailable !== undefined) params.append('openToOffers', filters.isAvailable.toString());
      if (filters.hasPortfolio !== undefined) params.append('hasPortfolio', filters.hasPortfolio.toString());
      if (filters.hasCertificates !== undefined) params.append('hasCertificates', filters.hasCertificates.toString());
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
   * Get AI-generated match explanation for a candidate-job pair
   * @requires RECRUITER role with premium subscription
   */
  async getAIMatchExplanation(jobId: number, candidateId: number): Promise<AICandidateMatchResponse> {
    try {
      const response = await axiosInstance.get<CandidateMatchApiEnvelope>(
        `/api/v1/recruiter/candidates/${candidateId}/match?jobId=${jobId}`
      );
      const match = response.data.data;

      return {
        candidateId: match?.candidateId || candidateId,
        jobId: match?.jobId || jobId,
        fitSummary: match?.fitSummary || '',
        skillSignals: (match?.skillSignals || []).map((signal) => ({
          skill: signal.skill || '',
          evidence: (signal as any).evidence || '',
          isRequired: signal.isRequired || false,
          relevanceScore: signal.relevanceScore || 0,
        })),
        reasoning: match?.reasoning || '',
        confidenceScore: match?.confidenceScore || 0,
        matchQuality: (match?.matchQuality as AICandidateMatchResponse['matchQuality']) || 'FAIR',
        modelUsed: (match as any)?.modelUsed,
        processingTimeMs: (match as any)?.processingTimeMs,
        isFallback: (match as any)?.isFallback,
      };
    } catch (error) {
      this.handleError(error, 'Failed to get AI match explanation');
    }
  }

  /**
   * Get AI-generated match explanation for a candidate-shortTermJob pair
   * @requires RECRUITER role with premium subscription
   */
  async getShortTermJobMatchExplanation(shortTermJobId: number, candidateId: number): Promise<AICandidateMatchResponse> {
    try {
      const response = await axiosInstance.get<CandidateMatchApiEnvelope>(
        `/api/v1/recruiter/candidates/${candidateId}/shortterm-match?shortTermJobId=${shortTermJobId}`
      );
      const match = response.data.data;

      return {
        candidateId: match?.candidateId || candidateId,
        jobId: match?.jobId || shortTermJobId,
        fitSummary: match?.fitSummary || '',
        skillSignals: (match?.skillSignals || []).map((signal) => ({
          skill: signal.skill || '',
          evidence: (signal as any).evidence || '',
          isRequired: signal.isRequired || false,
          relevanceScore: signal.relevanceScore || 0,
        })),
        reasoning: match?.reasoning || '',
        confidenceScore: match?.confidenceScore || 0,
        matchQuality: (match?.matchQuality as AICandidateMatchResponse['matchQuality']) || 'FAIR',
        modelUsed: (match as any)?.modelUsed,
        processingTimeMs: (match as any)?.processingTimeMs,
        isFallback: (match as any)?.isFallback,
      };
    } catch (error) {
      this.handleError(error, 'Failed to get short-term job AI match explanation');
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
