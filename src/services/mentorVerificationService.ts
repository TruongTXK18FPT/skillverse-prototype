/**
 * [Nghiệp vụ] Service cho luồng xác thực skill mentor.
 *
 * Mentor: gửi request kèm chứng chỉ → xem trạng thái → xem skill verified.
 * Admin: xem queue → duyệt/reject → xem tất cả request.
 */
import axiosInstance from "./axiosInstance";

// ==================== Types ====================

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type EvidenceType =
  | "CERTIFICATE"
  | "GITHUB"
  | "PORTFOLIO_LINK"
  | "WORK_EXPERIENCE";

export interface EvidenceItem {
  evidenceType: EvidenceType;
  evidenceUrl?: string;
  description?: string;
}

export interface CreateVerificationRequest {
  skillName: string;
  githubUrl?: string;
  portfolioUrl?: string;
  additionalNotes?: string;
  certificateIds: number[];
  evidences: EvidenceItem[];
}

export interface ReviewVerificationRequest {
  approved: boolean;
  reviewNote?: string;
}

export interface EvidenceResponse {
  id: number;
  evidenceType: EvidenceType;
  evidenceUrl?: string;
  description?: string;
  certificateId?: number;
  certificateTitle?: string;
  certificateImageUrl?: string;
  issuingOrganization?: string;
}

export interface MentorVerificationResponse {
  id: number;
  mentorId: number;
  mentorName: string;
  mentorEmail: string;
  mentorAvatarUrl?: string;
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

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

// ==================== Mentor APIs ====================

/** Mentor: gửi yêu cầu xác thực skill */
export const submitVerification = async (
  request: CreateVerificationRequest,
): Promise<MentorVerificationResponse> => {
  const response = await axiosInstance.post(
    "/api/v1/mentor/verifications",
    request,
  );
  return response.data;
};

/** Mentor: xem tất cả request của mình */
export const getMyVerifications = async (): Promise<
  MentorVerificationResponse[]
> => {
  const response = await axiosInstance.get("/api/v1/mentor/verifications");
  return response.data;
};

/** Mentor: xem danh sách skill đã verified */
export const getMyVerifiedSkills = async (): Promise<string[]> => {
  const response = await axiosInstance.get(
    "/api/v1/mentor/verifications/verified-skills",
  );
  return response.data;
};

// ==================== Admin APIs ====================

/** Admin: lấy danh sách request chờ duyệt */
export const getPendingVerifications = async (
  page = 0,
  size = 20,
): Promise<PageResponse<MentorVerificationResponse>> => {
  const response = await axiosInstance.get(
    "/api/v1/admin/mentor-verifications/pending",
    {
      params: { page, size },
    },
  );
  return response.data;
};

/** Admin: lấy tất cả request (có filter status) */
export const getAllVerifications = async (
  statuses?: VerificationStatus[],
  page = 0,
  size = 20,
): Promise<PageResponse<MentorVerificationResponse>> => {
  const response = await axiosInstance.get(
    "/api/v1/admin/mentor-verifications",
    {
      params: { statuses, page, size },
    },
  );
  return response.data;
};

/** Admin: xem chi tiết 1 request */
export const getVerificationById = async (
  requestId: number,
): Promise<MentorVerificationResponse> => {
  const response = await axiosInstance.get(
    `/api/v1/admin/mentor-verifications/${requestId}`,
  );
  return response.data;
};

/** Admin: duyệt hoặc reject request */
export const reviewVerification = async (
  requestId: number,
  request: ReviewVerificationRequest,
): Promise<MentorVerificationResponse> => {
  const response = await axiosInstance.post(
    `/api/v1/admin/mentor-verifications/${requestId}/review`,
    request,
  );
  return response.data;
};

/** Admin: đếm pending (cho badge) */
export const countPendingVerifications = async (): Promise<number> => {
  const response = await axiosInstance.get(
    "/api/v1/admin/mentor-verifications/count-pending",
  );
  return response.data.count;
};
// ==================== Public APIs ====================

/** Public: lấy danh sách skill APPROVED kèm evidence của 1 mentor (không cần auth) */
export const getPublicMentorVerifiedSkillDetails = async (
  mentorId: number,
): Promise<MentorVerificationResponse[]> => {
  const response = await axiosInstance.get(
    `/api/v1/public/mentors/${mentorId}/verified-skills/details`,
  );
  return response.data;
};

// ==================== Cloudinary Upload APIs ====================

/**
 * Mentor/Admin: Upload image evidence to Cloudinary
 */
export const uploadEvidence = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  // Using the exact endpoint specified (/api/media/upload/image)
  const response = await axiosInstance.post(
    "/api/media/upload/image",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  if (response.data && response.data.url) {
    return response.data.url;
  }
  throw new Error("Upload failed or missing secure_url");
};
