import axiosInstance from './axiosInstance';

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

export const getMyUsage = async (): Promise<FeatureLimitInfo[]> => {
  const response = await axiosInstance.get('/api/usage/my-usage');
  return response.data;
};

export const getCycleStats = async (): Promise<UserCycleStats> => {
  const response = await axiosInstance.get('/api/usage/stats');
  return response.data;
};
