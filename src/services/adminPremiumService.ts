import axiosInstance from './axiosInstance';

/**
 * Admin Premium Plan Management Service
 * Handles all API calls for admin premium plan CRUD operations
 */

// ==================== Types ====================

export interface AdminPremiumPlan {
  id: number;
  name: string;
  displayName: string;
  description: string;
  durationMonths: number;
  price: number;
  currency: string;
  planType: 'FREE_TIER' | 'PREMIUM_BASIC' | 'PREMIUM_PLUS' | 'STUDENT_PACK';
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
}

export interface CreatePremiumPlanRequest {
  name: string;
  displayName: string;
  description: string;
  durationMonths: number;
  price: number;
  planType: 'PREMIUM_BASIC' | 'PREMIUM_PLUS' | 'STUDENT_PACK';
  studentDiscountPercent: number;
  features: string; // JSON string array
  maxSubscribers?: number | null;
  isActive?: boolean;
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
}

// ==================== API Service ====================

const BASE_URL = '/api/admin/premium';

/**
 * Get all premium plans (including inactive)
 */
export const getAllPlans = async (): Promise<AdminPremiumPlan[]> => {
  const response = await axiosInstance.get<AdminPremiumPlan[]>(`${BASE_URL}/plans`);
  return response.data;
};

/**
 * Get premium plan by ID
 */
export const getPlanById = async (planId: number): Promise<AdminPremiumPlan> => {
  const response = await axiosInstance.get<AdminPremiumPlan>(`${BASE_URL}/plans/${planId}`);
  return response.data;
};

/**
 * Create new premium plan
 * Validation:
 * - Maximum 4 plans (excluding FREE_TIER)
 * - Cannot create FREE_TIER
 * - Plan name must be unique
 */
export const createPlan = async (data: CreatePremiumPlanRequest): Promise<AdminPremiumPlan> => {
  const response = await axiosInstance.post<AdminPremiumPlan>(`${BASE_URL}/plans`, data);
  return response.data;
};

/**
 * Update premium plan
 * Validation:
 * - Cannot update FREE_TIER
 */
export const updatePlan = async (
  planId: number,
  data: UpdatePremiumPlanRequest
): Promise<AdminPremiumPlan> => {
  const response = await axiosInstance.put<AdminPremiumPlan>(`${BASE_URL}/plans/${planId}`, data);
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
export const togglePlanActive = async (planId: number): Promise<AdminPremiumPlan> => {
  const response = await axiosInstance.patch<AdminPremiumPlan>(
    `${BASE_URL}/plans/${planId}/toggle-active`
  );
  return response.data;
};

// ==================== Helper Functions ====================

/**
 * Format price to VND currency
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
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
    console.error('Failed to parse features JSON:', error);
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
  planType: AdminPremiumPlan['planType']
): string => {
  const displayNames: Record<AdminPremiumPlan['planType'], string> = {
    FREE_TIER: 'Miễn Phí',
    PREMIUM_BASIC: 'Premium Cơ Bản',
    PREMIUM_PLUS: 'Premium Plus',
    STUDENT_PACK: 'Gói Sinh Viên',
  };
  return displayNames[planType];
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
};
