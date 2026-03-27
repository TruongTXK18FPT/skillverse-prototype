export interface PremiumPlan {
  id: number;
  name: string;
  displayName: string;
  description: string;
  durationMonths: number;
  price: string;
  currency: "VND" | "USD";
  planType:
    | "FREE_TIER"
    | "PREMIUM_BASIC"
    | "PREMIUM_PLUS"
    | "STUDENT_PACK"
    | "RECRUITER_PRO";
  targetRole?: "LEARNER" | "RECRUITER" | "PARENT";
  discountPercent?: string;
  discountedPrice?: string;
  // Legacy aliases kept for backward compatibility with older payloads.
  studentPrice?: string;
  features: string;
  studentDiscountPercent?: string;
  isActive: boolean;
}

export interface UserSubscriptionResponse {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  plan: PremiumPlan;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "SUSPENDED";
  // Legacy alias kept for backward compatibility with older payloads.
  isStudentSubscription?: boolean;
  isDiscountedSubscription?: boolean;
  autoRenew: boolean;
  renewalPrice?: string;
  renewalAttemptDate?: string;
  renewalPriceLockedAt?: string;
  scheduledChangePlan?: PremiumPlan | null;
  scheduledChangeEffectiveDate?: string | null;
  scheduledChangeAutoRenew?: boolean | null;
  scheduledChangeRenewalPrice?: string | null;
  scheduledChangeRenewalAttemptDate?: string | null;
  paymentTransactionId?: number;
  daysRemaining?: number;
  currentlyActive?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionCheckoutPreviewResponse {
  eligible: boolean;
  upgrade: boolean;
  samePlan: boolean;
  downgrade: boolean;
  buyerUserId: number;
  targetUserId: number;
  currentSubscriptionId?: number | null;
  currentPlan?: PremiumPlan | null;
  targetPlan: PremiumPlan;
  fullPrice: string;
  effectivePrice: string;
  amountDue: string;
  currentPlanCredit: string;
  proratedTargetPrice: string;
  remainingDays: number;
  nextRenewalDate?: string | null;
  currency: "VND" | "USD";
  pricingMode:
    | "FULL_PURCHASE"
    | "UPGRADE_PRORATED"
    | "UPGRADE_GRACE_WINDOW"
    | "UPGRADE_FULL_PRICE"
    | "UPGRADE_NOT_ALLOWED"
    | "CURRENT_PLAN"
    | "DOWNGRADE_NOT_ALLOWED"
    | "DOWNGRADE_SCHEDULED";
  message: string;
}
