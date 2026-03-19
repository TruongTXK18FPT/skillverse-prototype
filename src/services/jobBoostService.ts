import axiosInstance from './axiosInstance';
import {
  JobBoostResponse,
  CreateJobBoostRequest,
  JobBoostQuotaResponse,
  JobBoostAnalyticsResponse
} from '../data/jobDTOs';

// Helper type for axios error handling
type AxiosError = { response?: { data?: { message?: string } } };

type JobBoostApiResponse = {
  id: number;
  jobId: number;
  jobTitle: string;
  recruiterId: number;
  boostStatus?: string;
  startedAt?: string;
  expiresAt?: string;
  scheduledStartAt?: string;
  impressions?: number;
  clicks?: number;
  applications?: number;
  createdAt?: string;
  isActive?: boolean;
  remainingMinutes?: number;
};

type JobBoostEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  availableQuota?: number;
  quotaType?: string;
};

const normalizeJobBoost = (boost: JobBoostApiResponse): JobBoostResponse => ({
  id: boost.id,
  jobId: boost.jobId,
  jobTitle: boost.jobTitle,
  recruiterId: boost.recruiterId,
  status: (boost.boostStatus || 'NOT_BOOSTED') as JobBoostResponse['status'],
  startDate: boost.startedAt || boost.scheduledStartAt || boost.createdAt || new Date().toISOString(),
  endDate: boost.expiresAt || boost.startedAt || boost.createdAt || new Date().toISOString(),
  createdAt: boost.createdAt || boost.startedAt || new Date().toISOString(),
  impressions: boost.impressions || 0,
  clicks: boost.clicks || 0,
  applications: boost.applications || 0
});

class JobBoostService {

  private handleError(error: unknown, defaultMessage: string): never {
    const axiosError = error as AxiosError;
    const errorMessage = axiosError.response?.data?.message || defaultMessage;
    console.error(`${defaultMessage}:`, errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * Create a new job boost
   * @requires RECRUITER role with premium subscription
   */
  async createBoost(data: CreateJobBoostRequest): Promise<JobBoostResponse> {
    try {
      const response = await axiosInstance.post<JobBoostEnvelope<JobBoostApiResponse>>('/api/v1/recruiter/job-boosts', data);
      if (!response.data.data) {
        throw new Error('Missing boost payload');
      }
      return normalizeJobBoost(response.data.data);
    } catch (error) {
      this.handleError(error, 'Failed to create job boost');
    }
  }

  /**
   * Get all boosts for current recruiter
   * @requires RECRUITER role
   */
  async getMyBoosts(): Promise<JobBoostResponse[]> {
    try {
      const response = await axiosInstance.get<JobBoostEnvelope<JobBoostApiResponse[]>>('/api/v1/recruiter/job-boosts');
      return (response.data.data || []).map(normalizeJobBoost);
    } catch (error) {
      this.handleError(error, 'Failed to fetch boosts');
    }
  }

  /**
   * Get boost status for a specific job
   * @requires RECRUITER role
   */
  async getBoostByJob(jobId: number): Promise<JobBoostResponse | null> {
    try {
      const response = await axiosInstance.get<JobBoostEnvelope<JobBoostApiResponse>>(`/api/v1/recruiter/job-boosts/job/${jobId}`);
      return response.data.data ? normalizeJobBoost(response.data.data) : null;
    } catch (error: any) {
      // Return null if no boost exists
      if (error.response?.status === 404) {
        return null;
      }
      this.handleError(error, 'Failed to fetch job boost');
    }
  }

  /**
   * Get available boost quota for current recruiter
   * @requires RECRUITER role
   */
  async getBoostQuota(): Promise<JobBoostQuotaResponse> {
    try {
      const response = await axiosInstance.get<JobBoostEnvelope<never>>('/api/v1/recruiter/job-boosts/quota');
      return {
        totalQuota: response.data.quotaType === 'UNLIMITED' ? Number.MAX_SAFE_INTEGER : response.data.availableQuota || 0,
        usedQuota: 0,
        availableQuota: response.data.availableQuota || 0
      };
    } catch (error) {
      this.handleError(error, 'Failed to fetch boost quota');
    }
  }

  /**
   * Cancel an active boost
   * @requires RECRUITER role
   */
  async cancelBoost(boostId: number): Promise<JobBoostResponse> {
    try {
      const response = await axiosInstance.delete<JobBoostEnvelope<JobBoostApiResponse>>(`/api/v1/recruiter/job-boosts/${boostId}`);
      if (!response.data.data) {
        throw new Error('Missing boost payload');
      }
      return normalizeJobBoost(response.data.data);
    } catch (error) {
      this.handleError(error, 'Failed to cancel boost');
    }
  }

  /**
   * Extend boost duration
   * @requires RECRUITER role
   */
  async extendBoost(boostId: number, days: number): Promise<JobBoostResponse> {
    try {
      const response = await axiosInstance.post<JobBoostEnvelope<JobBoostApiResponse>>(
        `/api/v1/recruiter/job-boosts/${boostId}/extend?days=${days}`
      );
      if (!response.data.data) {
        throw new Error('Missing boost payload');
      }
      return normalizeJobBoost(response.data.data);
    } catch (error) {
      this.handleError(error, 'Failed to extend boost');
    }
  }

  /**
   * Get analytics for a specific boost
   * @requires RECRUITER role
   */
  async getBoostAnalytics(boostId: number): Promise<JobBoostAnalyticsResponse> {
    try {
      const response = await axiosInstance.get<JobBoostEnvelope<any>>(
        `/api/v1/recruiter/job-boosts/${boostId}/analytics`
      );
      const analytics = response.data.data;
      return {
        boostId: analytics?.boostId || boostId,
        jobId: analytics?.jobId || 0,
        jobTitle: analytics?.jobTitle || '',
        status: 'ACTIVE',
        startDate: analytics?.boostStartedAt || new Date().toISOString(),
        endDate: analytics?.boostExpiresAt || new Date().toISOString(),
        impressions: analytics?.totalImpressions || 0,
        clicks: analytics?.totalClicks || 0,
        applications: analytics?.totalApplications || 0,
        ctr: analytics?.clickThroughRate || 0,
        conversionRate: analytics?.applicationConversionRate || 0
      };
    } catch (error) {
      this.handleError(error, 'Failed to fetch boost analytics');
    }
  }
}

const jobBoostService = new JobBoostService();
export default jobBoostService;
