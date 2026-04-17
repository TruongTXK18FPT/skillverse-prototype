import api from "./axiosInstance";
import axios from "axios";
import {
  PremiumPlan,
  SubscriptionCheckoutPreviewResponse,
  UserSubscriptionResponse,
} from "../data/premiumDTOs";

type PremiumPlanApiResponse = Omit<
  PremiumPlan,
  | "price"
  | "discountPercent"
  | "discountedPrice"
  | "studentDiscountPercent"
  | "studentPrice"
  | "features"
> & {
  price: number | string;
  discountPercent?: number | string;
  discountedPrice?: number | string;
  studentDiscountPercent?: number | string;
  studentPrice?: number | string;
  features: string[] | string | null;
};

type UserSubscriptionApiResponse = Omit<UserSubscriptionResponse, "plan"> & {
  plan: PremiumPlanApiResponse;
};

type SubscriptionCheckoutPreviewApiResponse = Omit<
  SubscriptionCheckoutPreviewResponse,
  | "currentPlan"
  | "targetPlan"
  | "fullPrice"
  | "effectivePrice"
  | "amountDue"
  | "currentPlanCredit"
  | "proratedTargetPrice"
> & {
  currentPlan?: PremiumPlanApiResponse | null;
  targetPlan: PremiumPlanApiResponse;
  fullPrice: number | string;
  effectivePrice: number | string;
  amountDue: number | string;
  currentPlanCredit: number | string;
  proratedTargetPrice: number | string;
};

const normalizeFeatures = (
  features: PremiumPlanApiResponse["features"],
): string => {
  if (Array.isArray(features)) {
    return JSON.stringify(features);
  }

  if (typeof features === "string" && features.trim()) {
    return features;
  }

  return "[]";
};

const normalizePlan = (plan: PremiumPlanApiResponse): PremiumPlan => ({
  ...plan,
  price: String(plan.price ?? "0"),
  discountPercent:
    plan.discountPercent !== undefined
      ? String(plan.discountPercent)
      : String(plan.studentDiscountPercent ?? "0"),
  discountedPrice:
    plan.discountedPrice !== undefined
      ? String(plan.discountedPrice)
      : plan.studentPrice !== undefined
        ? String(plan.studentPrice)
        : undefined,
  studentDiscountPercent:
    plan.studentDiscountPercent !== undefined
      ? String(plan.studentDiscountPercent)
      : plan.discountPercent !== undefined
        ? String(plan.discountPercent)
        : undefined,
  studentPrice:
    plan.studentPrice !== undefined
      ? String(plan.studentPrice)
      : plan.discountedPrice !== undefined
        ? String(plan.discountedPrice)
        : undefined,
  features: normalizeFeatures(plan.features),
});

const normalizeSubscription = (
  subscription: UserSubscriptionApiResponse,
): UserSubscriptionResponse => ({
  ...subscription,
  isDiscountedSubscription:
    subscription.isDiscountedSubscription ?? subscription.isStudentSubscription,
  isStudentSubscription:
    subscription.isStudentSubscription ?? subscription.isDiscountedSubscription,
  renewalPrice:
    subscription.renewalPrice !== undefined &&
    subscription.renewalPrice !== null
      ? String(subscription.renewalPrice)
      : undefined,
  scheduledChangeRenewalPrice:
    subscription.scheduledChangeRenewalPrice !== undefined &&
    subscription.scheduledChangeRenewalPrice !== null
      ? String(subscription.scheduledChangeRenewalPrice)
      : undefined,
  plan: normalizePlan(subscription.plan),
});

const normalizeCheckoutPreview = (
  preview: SubscriptionCheckoutPreviewApiResponse,
): SubscriptionCheckoutPreviewResponse => ({
  ...preview,
  currentPlan: preview.currentPlan ? normalizePlan(preview.currentPlan) : null,
  targetPlan: normalizePlan(preview.targetPlan),
  fullPrice: String(preview.fullPrice ?? "0"),
  effectivePrice: String(preview.effectivePrice ?? "0"),
  amountDue: String(preview.amountDue ?? "0"),
  currentPlanCredit: String(preview.currentPlanCredit ?? "0"),
  proratedTargetPrice: String(preview.proratedTargetPrice ?? "0"),
});

const SUBSCRIPTION_CACHE_TTL_MS = 60 * 1000;
const SUBSCRIPTION_MISS_TTL_MS = 30 * 1000;

type SubscriptionCacheEntry = {
  value: UserSubscriptionResponse | null;
  expiresAt: number;
};

let currentSubscriptionCache: SubscriptionCacheEntry | null = null;
let currentSubscriptionRequest: Promise<UserSubscriptionResponse | null> | null =
  null;

const getCachedCurrentSubscription = ():
  | UserSubscriptionResponse
  | null
  | undefined => {
  if (!currentSubscriptionCache) {
    return undefined;
  }

  if (Date.now() >= currentSubscriptionCache.expiresAt) {
    currentSubscriptionCache = null;
    return undefined;
  }

  return currentSubscriptionCache.value;
};

const cacheCurrentSubscription = (
  value: UserSubscriptionResponse | null,
  ttlMs: number,
) => {
  currentSubscriptionCache = {
    value,
    expiresAt: Date.now() + ttlMs,
  };
};

const invalidateCurrentSubscriptionCache = () => {
  currentSubscriptionCache = null;
};

export const premiumService = {
  async getPremiumPlans(
    includeFreeTier: boolean = false,
  ): Promise<PremiumPlan[]> {
    const params: Record<string, string | boolean> = {
      includeFreeTier,
    };

    const { data } = await api.get<PremiumPlanApiResponse[]>(
      "/api/premium/plans",
      {
        params,
      },
    );
    return data.map(normalizePlan);
  },

  async getPlanById(planId: number): Promise<PremiumPlan> {
    const { data } = await api.get<PremiumPlanApiResponse>(
      `/api/premium/plans/${planId}`,
    );
    return normalizePlan(data);
  },

  async getCheckoutPreview(
    planId: number,
    _applyStudentDiscount: boolean = false,
    targetUserId?: number,
  ): Promise<SubscriptionCheckoutPreviewResponse> {
    const { data } = await api.get<SubscriptionCheckoutPreviewApiResponse>(
      "/api/premium/subscription/checkout-preview",
      {
        params: {
          planId,
          targetUserId,
        },
      },
    );
    return normalizeCheckoutPreview(data);
  },

  async getCurrentSubscription(): Promise<UserSubscriptionResponse | null> {
    const cached = getCachedCurrentSubscription();
    if (cached !== undefined) {
      return cached;
    }

    if (currentSubscriptionRequest) {
      return currentSubscriptionRequest;
    }

    currentSubscriptionRequest = (async () => {
      try {
        // Short-circuit for non-premium accounts to avoid noisy 404 responses.
        try {
          const { data: hasPremium } = await api.get<boolean>(
            "/api/premium/status",
          );
          if (!hasPremium) {
            cacheCurrentSubscription(null, SUBSCRIPTION_MISS_TTL_MS);
            return null;
          }
        } catch {
          // If status endpoint fails, continue with current-subscription call.
        }

        const { data } = await api.get<UserSubscriptionApiResponse | null>(
          "/api/premium/subscription/current",
        );

        if (!data) {
          cacheCurrentSubscription(null, SUBSCRIPTION_MISS_TTL_MS);
          return null;
        }

        const normalized = normalizeSubscription(data);
        cacheCurrentSubscription(normalized, SUBSCRIPTION_CACHE_TTL_MS);
        return normalized;
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          cacheCurrentSubscription(null, SUBSCRIPTION_MISS_TTL_MS);
          return null;
        }
        throw error;
      } finally {
        currentSubscriptionRequest = null;
      }
    })();

    return currentSubscriptionRequest;
  },

  async getSubscriptionHistory(): Promise<UserSubscriptionResponse[]> {
    const { data } = await api.get<UserSubscriptionApiResponse[]>(
      "/api/premium/subscription/history",
    );
    return data.map(normalizeSubscription);
  },

  async cancelSubscription(reason?: string): Promise<void> {
    await api.put("/api/premium/subscription/cancel", null, {
      params: { reason },
    });
    invalidateCurrentSubscriptionCache();
  },

  async checkPremiumStatus(): Promise<boolean> {
    const { data } = await api.get("/api/premium/status");
    return data;
  },

  async purchaseWithWallet(
    planId: number,
    _applyStudentDiscount: boolean = false,
    targetUserId?: number,
  ): Promise<UserSubscriptionResponse> {
    const params: Record<string, any> = { planId };
    if (targetUserId) {
      params.targetUserId = targetUserId;
    }
    const { data } = await api.post<UserSubscriptionApiResponse>(
      "/api/premium/purchase-with-wallet",
      null,
      {
        params,
      },
    );
    const normalized = normalizeSubscription(data);
    cacheCurrentSubscription(normalized, SUBSCRIPTION_CACHE_TTL_MS);
    return normalized;
  },

  async enableAutoRenewal(): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post(
      "/api/premium/subscription/enable-auto-renewal",
    );
    invalidateCurrentSubscriptionCache();
    return data;
  },

  async cancelAutoRenewal(): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post(
      "/api/premium/subscription/cancel-auto-renewal",
    );
    invalidateCurrentSubscriptionCache();
    return data;
  },

  async cancelSubscriptionWithRefund(
    reason?: string,
  ): Promise<{ success: boolean; message: string; refundAmount: number }> {
    const { data } = await api.post(
      "/api/premium/subscription/cancel-with-refund",
      null,
      {
        params: { reason },
      },
    );
    invalidateCurrentSubscriptionCache();
    return data;
  },

  async checkRefundEligibility(): Promise<{
    eligible: boolean;
    refundPercentage: number;
    refundAmount: number;
    daysUsed: number;
    message: string;
  }> {
    const { data } = await api.get(
      "/api/premium/subscription/refund-eligibility",
    );
    return data;
  },

  async recoverPendingSubscriptions(): Promise<{
    recovered: boolean;
    message: string;
  }> {
    const { data } = await api.post("/api/premium/subscription/recover");
    invalidateCurrentSubscriptionCache();
    return data;
  },

  // ==================== ADMIN METHODS ====================

  async adminGetAllSubscriptions(
    page: number = 0,
    size: number = 50,
    filters?: {
      status?: string;
      userId?: number;
      planId?: number;
    },
  ): Promise<{
    content: UserSubscriptionResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    const params: any = { page, size, ...filters };
    const { data } = await api.get<{
      content: UserSubscriptionApiResponse[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    }>("/api/admin/premium/subscriptions", {
      params,
    });
    return {
      ...data,
      content: data.content.map(normalizeSubscription),
    };
  },

  async adminGetSubscriptionDetail(
    id: number,
  ): Promise<UserSubscriptionResponse> {
    const { data } = await api.get<UserSubscriptionApiResponse>(
      `/api/admin/premium/subscriptions/${id}`,
    );
    return normalizeSubscription(data);
  },

  async adminGetPremiumStatistics(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    cancelledSubscriptions: number;
    totalRevenue: number;
  }> {
    const { data } = await api.get("/api/admin/premium/statistics");
    return data;
  },
};
