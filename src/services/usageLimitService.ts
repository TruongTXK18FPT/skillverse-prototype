import axiosInstance from './axiosInstance';

export type UsageResetPeriod =
  | 'HOURLY'
  | 'DAILY'
  | 'MONTHLY'
  | 'NEVER'
  | 'CUSTOM_8_HOURS'
  | string;

export interface FeatureLimitInfo {
  featureType: string;
  featureName: string;
  featureNameVi: string;
  limit: number | null;
  currentUsage: number;
  resetPeriod: string | null;
  nextResetAt: string | null;
  timeUntilReset: string | null;
  isUnlimited: boolean;
  remaining: number | null;
  usagePercentage: number;
  bonusMultiplier: number | null;
  isEnabled: boolean | null;
  approachingLimit?: boolean | null;
  limitExceeded?: boolean | null;
}

export interface UserCycleStats {
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  completedProjectsCount: number;
  certificatesCount: number;
  totalHoursStudied: number;
  currentStreak: number;
  longestStreak: number;
  weeklyActivity: boolean[];
  cycleStartDate: string;
  cycleEndDate: string;
}

const FEATURE_DISPLAY_ORDER: Record<string, number> = {
  AI_CHATBOT_REQUESTS: 0,
  AI_ROADMAP_GENERATION: 1,
  COIN_EARNING_MULTIPLIER: 2,
  MENTOR_BOOKING_MONTHLY: 3,
  PRIORITY_SUPPORT: 4,
  JOB_POSTING_MONTHLY: 10,
  SHORT_TERM_JOB_POSTING: 11,
  JOB_BOOST_MONTHLY: 12,
  HIGHLIGHT_JOB_POST: 13,
  AI_CANDIDATE_SUGGESTION: 14,
  COMPANY_PROFILE_PREMIUM: 15,
  ANALYTICS_DASHBOARD: 16,
  CANDIDATE_DATABASE_ACCESS: 17,
  AUTOMATED_OUTREACH: 18,
  BULK_IMPORT_CANDIDATES: 19,
  API_ACCESS: 20,
  RECRUITER_PRIORITY_SUPPORT: 21,
};

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = toNullableNumber(value);
  return parsed ?? fallback;
};

const toBooleanOrNull = (value: unknown): boolean | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }

  return null;
};

const getFallbackFeatureName = (featureType: string) =>
  featureType
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const normalizeFeatureLimitInfo = (payload: any): FeatureLimitInfo => {
  const featureType = String(payload?.featureType ?? 'UNKNOWN_FEATURE');
  const limit = toNullableNumber(payload?.limit);
  const currentUsage = toNumber(payload?.currentUsage);
  const isUnlimited = Boolean(payload?.isUnlimited);
  const remaining =
    payload?.remaining !== undefined && payload?.remaining !== null
      ? toNumber(payload.remaining)
      : limit !== null
        ? Math.max(0, limit - currentUsage)
        : null;

  const rawUsagePercentage = toNullableNumber(payload?.usagePercentage);
  const usagePercentage =
    rawUsagePercentage !== null
      ? Math.min(100, Math.max(0, rawUsagePercentage))
      : limit && limit > 0
        ? Math.min(100, Math.max(0, (currentUsage / limit) * 100))
        : 0;

  return {
    featureType,
    featureName: String(payload?.featureName ?? getFallbackFeatureName(featureType)),
    featureNameVi: String(payload?.featureNameVi ?? ''),
    limit,
    currentUsage,
    resetPeriod: (payload?.resetPeriod as UsageResetPeriod | null) ?? null,
    nextResetAt: payload?.nextResetAt ? String(payload.nextResetAt) : null,
    timeUntilReset: payload?.timeUntilReset ? String(payload.timeUntilReset) : null,
    isUnlimited,
    remaining,
    usagePercentage,
    bonusMultiplier: toNullableNumber(payload?.bonusMultiplier),
    isEnabled: toBooleanOrNull(payload?.isEnabled),
    approachingLimit: toBooleanOrNull(payload?.approachingLimit),
    limitExceeded: toBooleanOrNull(payload?.limitExceeded),
  };
};

export const normalizeFeatureUsageResponse = (payload: unknown): FeatureLimitInfo[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map(normalizeFeatureLimitInfo)
    .sort((left, right) => {
      const leftOrder = FEATURE_DISPLAY_ORDER[left.featureType] ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = FEATURE_DISPLAY_ORDER[right.featureType] ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.featureName.localeCompare(right.featureName);
    });
};

export const getMyUsage = async (): Promise<FeatureLimitInfo[]> => {
  const response = await axiosInstance.get('/api/usage/my-usage');
  return normalizeFeatureUsageResponse(response.data);
};

export const getCycleStats = async (): Promise<UserCycleStats> => {
  const response = await axiosInstance.get('/api/usage/stats');
  return response.data;
};
