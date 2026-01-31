// Enrollment DTOs - Matching Backend Structure

export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum EntitlementSource {
  PURCHASE = 'PURCHASE',
  FREE = 'FREE',
  GIFT = 'GIFT',
  TRIAL = 'TRIAL'
}

// Enroll Request DTO
export interface EnrollRequestDTO {
  courseId: number;
}

// Enrollment Detail DTO
export interface EnrollmentDetailDTO {
  id: number;
  courseId: number;
  userId: number;
  status: EnrollmentStatus | 'ENROLLED' | 'COMPLETED' | 'CANCELLED';
  progressPercent: number;
  entitlementSource: EntitlementSource | 'PURCHASE' | 'FREE' | 'GIFT' | 'TRIAL';
  entitlementRef?: string;
  enrolledAt: string;
  completedAt?: string;
  completed: boolean;
}

// Enrollment Stats DTO
export interface EnrollmentStatsDTO {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageProgress: number;
  enrollmentsThisMonth: number;
}

// Enrollment Summary DTO (for list views)
export interface EnrollmentSummaryDTO {
  id: number;
  courseId: number;
  courseTitle?: string;
  status: EnrollmentStatus;
  progressPercent: number;
  enrolledAt: string;
}
