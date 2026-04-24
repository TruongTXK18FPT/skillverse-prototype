/**
 * [Nghiệp vụ] Service cho luồng xác thực skill student.
 *
 * Student: gửi request kèm bằng chứng → xem trạng thái → xem skill verified.
 * Admin: xem queue → duyệt/reject → xem tất cả request.
 * Public: xem skill đã verified kèm evidence.
 *
 * Upload evidence images qua Cloudinary reuse uploadEvidence() từ mentorVerificationService.
 */
import axiosInstance from "./axiosInstance";
import type {
  EvidenceType,
  EvidenceItem,
  EvidenceResponse,
  PageResponse,
  VerificationStatus,
} from "./mentorVerificationService";

// ==================== Types ====================

export interface CreateStudentVerificationRequest {
  skillName: string;
  githubUrl?: string;
  portfolioUrl?: string;
  additionalNotes?: string;
  certificateIds: number[];
  evidences: EvidenceItem[];
}

export interface ReviewStudentVerificationRequest {
  approved: boolean;
  reviewNote?: string;
}

export interface StudentVerificationResponse {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string;
  skillName: string;
  status: VerificationStatus;
  githubUrl?: string;
  portfolioUrl?: string;
  additionalNotes?: string;
  reviewNote?: string;
  reviewedById?: number;
  reviewedByName?: string;
  requestedAt: string;
  reviewedAt?: string;
  evidences: EvidenceResponse[];
}

// Re-export shared types for convenience
export type { EvidenceType, EvidenceItem, EvidenceResponse, VerificationStatus };

// ==================== Student APIs ====================

/** Student: gửi yêu cầu xác thực skill */
export const submitStudentVerification = async (
  request: CreateStudentVerificationRequest,
): Promise<StudentVerificationResponse> => {
  const response = await axiosInstance.post(
    "/api/v1/student/skill-verifications",
    request,
  );
  return response.data;
};

/** Student: xem tất cả request của mình */
export const getMyStudentVerifications = async (): Promise<
  StudentVerificationResponse[]
> => {
  const response = await axiosInstance.get(
    "/api/v1/student/skill-verifications",
  );
  return response.data;
};

/** Student: xem danh sách skill đã verified */
export const getMyStudentVerifiedSkills = async (): Promise<string[]> => {
  const response = await axiosInstance.get(
    "/api/v1/student/skill-verifications/verified-skills",
  );
  return response.data;
};

// ==================== Admin APIs ====================

/** Admin: lấy danh sách request student chờ duyệt */
export const getStudentPendingVerifications = async (
  page = 0,
  size = 20,
): Promise<PageResponse<StudentVerificationResponse>> => {
  const response = await axiosInstance.get(
    "/api/v1/admin/student-verifications/pending",
    {
      params: { page, size },
    },
  );
  return response.data;
};

/** Admin: lấy tất cả request student (có filter status) */
export const getAllStudentVerifications = async (
  statuses?: VerificationStatus[],
  page = 0,
  size = 20,
): Promise<PageResponse<StudentVerificationResponse>> => {
  const response = await axiosInstance.get(
    "/api/v1/admin/student-verifications",
    {
      params: { statuses, page, size },
    },
  );
  return response.data;
};

/** Admin: xem chi tiết 1 request student */
export const getStudentVerificationById = async (
  requestId: number,
): Promise<StudentVerificationResponse> => {
  const response = await axiosInstance.get(
    `/api/v1/admin/student-verifications/${requestId}`,
  );
  return response.data;
};

/** Admin: duyệt hoặc reject request student */
export const reviewStudentVerification = async (
  requestId: number,
  request: ReviewStudentVerificationRequest,
): Promise<StudentVerificationResponse> => {
  const response = await axiosInstance.post(
    `/api/v1/admin/student-verifications/${requestId}/review`,
    request,
  );
  return response.data;
};

/** Admin: đếm pending student (cho badge) */
export const countStudentPendingVerifications = async (): Promise<number> => {
  const response = await axiosInstance.get(
    "/api/v1/admin/student-verifications/count-pending",
  );
  return response.data.count;
};

// ==================== Public APIs ====================

/** Public: lấy danh sách skill APPROVED kèm evidence của 1 student */
export const getPublicStudentVerifiedSkillDetails = async (
  userId: number,
): Promise<StudentVerificationResponse[]> => {
  const response = await axiosInstance.get(
    `/api/v1/public/students/${userId}/verified-skills/details`,
  );
  return response.data;
};
