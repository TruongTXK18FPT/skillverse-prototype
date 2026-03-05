import api from './axiosInstance';

export interface RecruiterSubscriptionInfoResponse {
  hasSubscription: boolean;
  planName: string;
  planDisplayName: string;
  planPrice: number;
  durationMonths: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  autoRenew: boolean;

  // Full-time Job posting quota
  jobPostingLimit: number;
  jobPostingUsed: number;
  jobPostingRemaining: number;
  jobPostingUnlimited: boolean;
  jobPostingResetInfo: string;

  // Short-term Job posting quota
  shortTermJobPostingLimit: number;
  shortTermJobPostingUsed: number;
  shortTermJobPostingRemaining: number;
  shortTermJobPostingUnlimited: boolean;
  shortTermJobPostingResetInfo: string;

  // Job Boost quota
  jobBoostLimit: number;
  jobBoostUsed: number;
  jobBoostRemaining: number;
  jobBoostResetInfo: string;

  // Features
  canHighlightJobs: boolean;
  canUseAICandidateSuggestion: boolean;
  hasPremiumCompanyProfile: boolean;
  hasAnalyticsDashboard: boolean;
  hasCandidateDatabaseAccess: boolean;
  hasAutomatedOutreach: boolean;
  hasApiAccess: boolean;
  hasPrioritySupport: boolean;
}

export interface RecruiterPlanResponse {
  id: number;
  name: string;
  displayName: string;
  description: string;
  durationMonths: number;
  price: number;
  currency: string;
  planType: string;
  studentDiscountPercent: number;
  features: string;
  isActive: boolean;
}

export const recruiterSubscriptionService = {
  /**
   * Get current recruiter subscription info
   */
  async getSubscriptionInfo(): Promise<RecruiterSubscriptionInfoResponse> {
    const { data } = await api.get('/api/recruiter/subscription/info');
    return data;
  },

  /**
   * Check if recruiter has active subscription
   */
  async checkStatus(): Promise<{
    hasSubscription: boolean;
    canPostJob: boolean;
    canHighlightJob: boolean;
    canUseAICandidateSuggestion: boolean;
  }> {
    const { data } = await api.get('/api/recruiter/subscription/status');
    return data;
  },

  /**
   * Get available recruiter plans
   */
  async getPlans(): Promise<RecruiterPlanResponse[]> {
    const { data } = await api.get('/api/recruiter/subscription/plans');
    return data;
  },

  /**
   * Check if recruiter can post a job
   */
  async canPostJob(): Promise<{
    canPost: boolean;
    remaining: number;
    limit: number;
    used: number;
  }> {
    const { data } = await api.get('/api/recruiter/subscription/can-post');
    return data;
  },

  /**
   * Purchase recruiter subscription with wallet
   */
  async purchaseWithWallet(planId: number): Promise<any> {
    const { data } = await api.post(`/api/recruiter/subscription/purchase/${planId}`);
    return data;
  }
};

export default recruiterSubscriptionService;
