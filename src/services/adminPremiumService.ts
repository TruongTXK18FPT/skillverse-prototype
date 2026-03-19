import axiosInstance from "./axiosInstance";

/**
 * Admin Premium Plan Management Service
 * Handles all API calls for admin premium plan CRUD operations
 */

// ==================== Types ====================

export type FeatureType =
  | "AI_CHATBOT_REQUESTS"
  | "AI_ROADMAP_GENERATION"
  | "MENTOR_BOOKING_MONTHLY"
  | "COIN_EARNING_MULTIPLIER"
  | "PRIORITY_SUPPORT"
  | "JOB_POSTING_MONTHLY"
  | "SHORT_TERM_JOB_POSTING"
  | "JOB_BOOST_MONTHLY"
  | "HIGHLIGHT_JOB_POST"
  | "AI_CANDIDATE_SUGGESTION"
  | "COMPANY_PROFILE_PREMIUM"
  | "ANALYTICS_DASHBOARD"
  | "CANDIDATE_DATABASE_ACCESS"
  | "AUTOMATED_OUTREACH"
  | "API_ACCESS"
  | "RECRUITER_PRIORITY_SUPPORT";

export type ResetPeriod =
  | "HOURLY"
  | "DAILY"
  | "MONTHLY"
  | "CUSTOM_8_HOURS"
  | "NEVER";

export interface FeatureLimitConfig {
  featureType: FeatureType;
  limitValue: number | null;
  resetPeriod: ResetPeriod;
  isUnlimited: boolean;
  bonusMultiplier?: number;
  description?: string;
  isActive: boolean;
}

export interface FeatureLimitResponse {
  id: number;
  featureType: FeatureType;
  featureName: string;
  featureNameVi: string;
  limitValue: number | null;
  resetPeriod: ResetPeriod;
  isUnlimited: boolean;
  bonusMultiplier: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPremiumPlan {
  id: number;
  name: string;
  displayName: string;
  description: string;
  durationMonths: number;
  price: number;
  currency: string;
  planType:
    | "FREE_TIER"
    | "PREMIUM_BASIC"
    | "PREMIUM_PLUS"
    | "STUDENT_PACK"
    | "RECRUITER_PRO";
  targetRole?: "LEARNER" | "RECRUITER" | "PARENT";
  studentDiscountPercent: number;
  studentPrice: number;
  features: string[];
  isActive: boolean;
  maxSubscribers: number | null;
  currentSubscribers: number;
  totalRevenue: number;
  availableForSubscription: boolean;
  isFreeTier: boolean;
  createdAt: string;
  updatedAt: string;
  featureLimits: FeatureLimitResponse[];
}

export interface CreatePremiumPlanRequest {
  name: string;
  displayName: string;
  description: string;
  durationMonths: number;
  price: number;
  planType: "PREMIUM_BASIC" | "PREMIUM_PLUS" | "STUDENT_PACK" | "RECRUITER_PRO";
  targetRole?: "LEARNER" | "RECRUITER" | "PARENT";
  studentDiscountPercent: number;
  features: string; // JSON string array
  maxSubscribers?: number | null;
  isActive?: boolean;
  featureLimits?: FeatureLimitConfig[];
}

export interface UpdatePremiumPlanRequest {
  displayName: string;
  description: string;
  durationMonths: number;
  price: number;
  studentDiscountPercent: number;
  features: string; // JSON string array
  maxSubscribers?: number | null;
  isActive?: boolean;
  targetRole?: "LEARNER" | "RECRUITER" | "PARENT";
  featureLimits?: FeatureLimitConfig[];
}

// ==================== API Service ====================

const BASE_URL = "/api/admin/premium";

/**
 * Get all premium plans (including inactive)
 */
export const getAllPlans = async (): Promise<AdminPremiumPlan[]> => {
  const response = await axiosInstance.get<AdminPremiumPlan[]>(
    `${BASE_URL}/plans`,
  );
  return response.data;
};

/**
 * Get premium plan by ID
 */
export const getPlanById = async (
  planId: number,
): Promise<AdminPremiumPlan> => {
  const response = await axiosInstance.get<AdminPremiumPlan>(
    `${BASE_URL}/plans/${planId}`,
  );
  return response.data;
};

/**
 * Create new premium plan
 * Validation:
 * - Maximum 4 plans (excluding FREE_TIER)
 * - Cannot create FREE_TIER
 * - Plan name must be unique
 */
export const createPlan = async (
  data: CreatePremiumPlanRequest,
): Promise<AdminPremiumPlan> => {
  const response = await axiosInstance.post<AdminPremiumPlan>(
    `${BASE_URL}/plans`,
    data,
  );
  return response.data;
};

/**
 * Update premium plan
 * Validation:
 * - Cannot update FREE_TIER
 */
export const updatePlan = async (
  planId: number,
  data: UpdatePremiumPlanRequest,
): Promise<AdminPremiumPlan> => {
  const response = await axiosInstance.put<AdminPremiumPlan>(
    `${BASE_URL}/plans/${planId}`,
    data,
  );
  return response.data;
};

/**
 * Delete premium plan
 * Validation:
 * - Cannot delete FREE_TIER
 * - Cannot delete plan with active subscribers
 */
export const deletePlan = async (planId: number): Promise<void> => {
  await axiosInstance.delete(`${BASE_URL}/plans/${planId}`);
};

/**
 * Toggle plan active status
 * Validation:
 * - Cannot deactivate FREE_TIER
 */
export const togglePlanActive = async (
  planId: number,
): Promise<AdminPremiumPlan> => {
  const response = await axiosInstance.patch<AdminPremiumPlan>(
    `${BASE_URL}/plans/${planId}/toggle-active`,
  );
  return response.data;
};

// ==================== Helper Functions ====================

/**
 * Format price to VND currency
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Parse features JSON string to array
 */
export const parseFeatures = (featuresJson: string): string[] => {
  try {
    return JSON.parse(featuresJson);
  } catch (error) {
    console.error("Failed to parse features JSON:", error);
    return [];
  }
};

/**
 * Convert features array to JSON string
 */
export const stringifyFeatures = (features: string[]): string => {
  return JSON.stringify(features);
};

/**
 * Validate plan name format (lowercase, no spaces)
 */
export const validatePlanName = (name: string): boolean => {
  const regex = /^[a-z0-9_-]+$/;
  return regex.test(name);
};

/**
 * Get plan type display name
 */
export const getPlanTypeDisplayName = (
  planType: AdminPremiumPlan["planType"],
): string => {
  const displayNames: Record<AdminPremiumPlan["planType"], string> = {
    FREE_TIER: "Miễn Phí",
    PREMIUM_BASIC: "Premium Cơ Bản",
    PREMIUM_PLUS: "Premium Plus",
    STUDENT_PACK: "Gói Sinh Viên",
    RECRUITER_PRO: "Gói Nhà Tuyển Dụng",
  };
  return displayNames[planType] || planType;
};

/**
 * Get feature type display name (English)
 */
export const getFeatureTypeDisplayName = (featureType: FeatureType): string => {
  const names: Record<FeatureType, string> = {
    AI_CHATBOT_REQUESTS: "AI Chatbot Requests",
    AI_ROADMAP_GENERATION: "AI Roadmap Generation",
    MENTOR_BOOKING_MONTHLY: "Mentor Booking (Monthly)",
    COIN_EARNING_MULTIPLIER: "Coin Earning Multiplier",
    PRIORITY_SUPPORT: "Priority Support",
    JOB_POSTING_MONTHLY: "Job Posting (Monthly)",
    SHORT_TERM_JOB_POSTING: "Short-term Job Posting",
    JOB_BOOST_MONTHLY: "Job Boost (Monthly)",
    HIGHLIGHT_JOB_POST: "Highlight Job Post",
    AI_CANDIDATE_SUGGESTION: "AI Candidate Suggestion",
    COMPANY_PROFILE_PREMIUM: "Premium Company Profile",
    ANALYTICS_DASHBOARD: "Analytics Dashboard",
    CANDIDATE_DATABASE_ACCESS: "Candidate Database Access",
    AUTOMATED_OUTREACH: "Automated Outreach",
    API_ACCESS: "API Access",
    RECRUITER_PRIORITY_SUPPORT: "Recruiter Priority Support",
  };
  return names[featureType] || featureType;
};

/**
 * Get feature type display name (Vietnamese)
 */
export const getFeatureTypeDisplayNameVi = (
  featureType: FeatureType,
): string => {
  const names: Record<FeatureType, string> = {
    AI_CHATBOT_REQUESTS: "Số lượng request chat AI",
    AI_ROADMAP_GENERATION: "Số lần tạo roadmap",
    MENTOR_BOOKING_MONTHLY: "Số lần đặt mentor/tháng",
    COIN_EARNING_MULTIPLIER: "Hệ số nhân xu",
    PRIORITY_SUPPORT: "Hỗ trợ ưu tiên",
    JOB_POSTING_MONTHLY: "Số tin tuyển dụng/tháng",
    SHORT_TERM_JOB_POSTING: "Số tin việc ngắn hạn",
    JOB_BOOST_MONTHLY: "Số lần đẩy tin/tháng",
    HIGHLIGHT_JOB_POST: "Highlight bài đăng",
    AI_CANDIDATE_SUGGESTION: "AI gợi ý ứng viên",
    COMPANY_PROFILE_PREMIUM: "Hồ sơ công ty nâng cao",
    ANALYTICS_DASHBOARD: "Bảng phân tích",
    CANDIDATE_DATABASE_ACCESS: "Truy cập CSDL ứng viên",
    AUTOMATED_OUTREACH: "Liên hệ tự động",
    API_ACCESS: "Truy cập API",
    RECRUITER_PRIORITY_SUPPORT: "Hỗ trợ ưu tiên (Recruiter)",
  };
  return names[featureType] || featureType;
};

/**
 * Get reset period display name
 */
export const getResetPeriodDisplayName = (period: ResetPeriod): string => {
  const names: Record<ResetPeriod, string> = {
    HOURLY: "Mỗi giờ",
    DAILY: "Mỗi ngày",
    MONTHLY: "Mỗi tháng",
    CUSTOM_8_HOURS: "Mỗi 8 giờ",
    NEVER: "Không reset",
  };
  return names[period];
};

/**
 * Check if feature is multiplier type
 */
export const isMultiplierFeature = (featureType: FeatureType): boolean => {
  return featureType === "COIN_EARNING_MULTIPLIER";
};

/**
 * Check if feature is boolean type
 */
export const isBooleanFeature = (featureType: FeatureType): boolean => {
  const booleanFeatures: FeatureType[] = [
    "PRIORITY_SUPPORT",
    "HIGHLIGHT_JOB_POST",
    "AI_CANDIDATE_SUGGESTION",
    "COMPANY_PROFILE_PREMIUM",
    "ANALYTICS_DASHBOARD",
    "CANDIDATE_DATABASE_ACCESS",
    "AUTOMATED_OUTREACH",
    "API_ACCESS",
    "RECRUITER_PRIORITY_SUPPORT",
  ];
  return booleanFeatures.includes(featureType);
};

export default {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  togglePlanActive,
  formatPrice,
  parseFeatures,
  stringifyFeatures,
  validatePlanName,
  getPlanTypeDisplayName,
  getFeatureTypeDisplayName,
  getFeatureTypeDisplayNameVi,
  getResetPeriodDisplayName,
  isMultiplierFeature,
  isBooleanFeature,
};
