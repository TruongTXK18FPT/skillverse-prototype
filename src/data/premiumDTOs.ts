export interface PremiumPlan {
  id: number;
  name: string;
  displayName: string;
  description: string;
  durationMonths: number;
  price: string;
  currency: 'VND' | 'USD';
  planType: 'FREE_TIER' | 'PREMIUM_BASIC' | 'PREMIUM_PLUS' | 'STUDENT_PACK';
  features: string;
  studentDiscountPercent: string;
  isActive: boolean;
}

export interface CreateSubscriptionRequest {
  planId: number;
  paymentMethod: 'PAYOS';
  applyStudentDiscount?: boolean;
  autoRenew?: boolean;
  successUrl?: string;
  cancelUrl?: string;
  couponCode?: string;
}

export interface UserSubscriptionResponse {
  id: number;
  userId: number;
  plan: PremiumPlan;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  isStudentSubscription: boolean;
  autoRenew: boolean;
  paymentTransactionId?: number;
  daysRemaining?: number;
  currentlyActive?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}
