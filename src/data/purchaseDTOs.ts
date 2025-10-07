// Purchase DTOs - Matching Backend Structure

export enum PurchaseType {
  FREE = 'FREE',
  SKILL_POINTS = 'SKILL_POINTS',
  PREMIUM_ONLY = 'PREMIUM_ONLY',
  PAID = 'PAID'
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

// Purchase Option for Course
export interface CoursePurchaseOption {
  type: PurchaseType;
  price?: number; // For PAID type (VND)
  skillPoints?: number; // For SKILL_POINTS type
  currency?: string; // Default 'VND'
}

// Purchase Detail DTO
export interface PurchaseDetailDTO {
  id: number;
  userId: number;
  courseId: number;
  courseTitle: string;
  price: number;
  currency: string;
  status: PurchaseStatus;
  purchasedAt: string;
  couponCode?: string;
}

// Purchase Create DTO
export interface PurchaseCreateDTO {
  courseId: number;
  userId: number;
  price: number;
  currency: string;
  couponCode?: string;
}

// Purchase Summary DTO
export interface PurchaseSummaryDTO {
  id: number;
  courseTitle: string;
  price: number;
  currency: string;
  status: PurchaseStatus;
  purchasedAt: string;
}
