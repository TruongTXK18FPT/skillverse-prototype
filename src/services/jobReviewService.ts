import axiosInstance from "./axiosInstance";
import {
  CreateJobReviewRequest,
  JobReviewResponse,
  UserRatingSummary,
} from "../types/ShortTermJob";

// Helper type for axios error handling
type AxiosError = { response?: { data?: { message?: string } } };

class JobReviewService {
  // ==================== PRIVATE HELPER ====================

  private handleError(error: unknown, defaultMessage: string): never {
    const axiosError = error as AxiosError;
    const errorMessage = axiosError.response?.data?.message || defaultMessage;
    console.error(`${defaultMessage}:`, errorMessage);
    throw new Error(errorMessage);
  }

  // ==================== REVIEW ENDPOINTS ====================

  /**
   * Create a review for completed job
   * Only allowed after job is COMPLETED and PAID
   * @requires USER or RECRUITER role
   */
  async createReview(data: CreateJobReviewRequest): Promise<JobReviewResponse> {
    try {
      const response = await axiosInstance.post<JobReviewResponse>(
        "/api/job-reviews",
        data,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to create review");
    }
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: number): Promise<JobReviewResponse> {
    try {
      const response = await axiosInstance.get<JobReviewResponse>(
        `/api/job-reviews/${reviewId}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch review");
    }
  }

  /**
   * Get reviews for an application
   * @requires USER or RECRUITER role
   */
  async getReviewsForApplication(
    applicationId: number,
  ): Promise<JobReviewResponse[]> {
    try {
      const response = await axiosInstance.get<JobReviewResponse[]>(
        `/api/job-reviews/application/${applicationId}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch reviews for application");
    }
  }

  /**
   * Get reviews written by current user
   * @requires USER or RECRUITER role
   */
  async getMyReviews(): Promise<JobReviewResponse[]> {
    try {
      const response = await axiosInstance.get<JobReviewResponse[]>(
        "/api/job-reviews/my-reviews",
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch my reviews");
    }
  }

  /**
   * Get my reviews with pagination
   * @requires USER or RECRUITER role
   */
  async getMyReviewsPaged(
    page: number = 0,
    size: number = 10,
  ): Promise<{
    content: JobReviewResponse[];
    totalPages: number;
    totalElements: number;
  }> {
    try {
      const response = await axiosInstance.get<any>(
        `/api/job-reviews/my-reviews/paged?page=${page}&size=${size}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch my reviews paged");
    }
  }

  /**
   * Get public reviews for a user
   */
  async getPublicReviewsForUser(userId: number): Promise<JobReviewResponse[]> {
    try {
      const response = await axiosInstance.get<JobReviewResponse[]>(
        `/api/job-reviews/user/${userId}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch public reviews");
    }
  }

  /**
   * Get public reviews for a user with pagination
   */
  async getPublicReviewsForUserPaged(
    userId: number,
    page: number = 0,
    size: number = 10,
  ): Promise<{
    content: JobReviewResponse[];
    totalPages: number;
    totalElements: number;
  }> {
    try {
      const response = await axiosInstance.get<any>(
        `/api/job-reviews/user/${userId}/paged?page=${page}&size=${size}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch public reviews paged");
    }
  }

  /**
   * Get rating summary for a user
   */
  async getUserRatingSummary(userId: number): Promise<UserRatingSummary> {
    try {
      const response = await axiosInstance.get<UserRatingSummary>(
        `/api/job-reviews/user/${userId}/summary`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch rating summary");
    }
  }

  /**
   * Check if user can write review for an application
   * @requires USER or RECRUITER role
   */
  async canWriteReview(applicationId: number): Promise<boolean> {
    try {
      const response = await axiosInstance.get<boolean>(
        `/api/job-reviews/can-review/${applicationId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error checking if can write review:", error);
      return false;
    }
  }

  /**
   * Update review visibility
   * @requires USER or RECRUITER role (owner only)
   */
  async updateReviewVisibility(
    reviewId: number,
    isPublic: boolean,
  ): Promise<JobReviewResponse> {
    try {
      const response = await axiosInstance.patch<JobReviewResponse>(
        `/api/job-reviews/${reviewId}/visibility?isPublic=${isPublic}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to update review visibility");
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Render star rating
   */
  renderStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      "★".repeat(fullStars) + (hasHalfStar ? "½" : "") + "☆".repeat(emptyStars)
    );
  }

  /**
   * Get rating color based on value
   */
  getRatingColor(rating: number): string {
    if (rating >= 4.5) return "green";
    if (rating >= 4.0) return "teal";
    if (rating >= 3.0) return "yellow";
    if (rating >= 2.0) return "orange";
    return "red";
  }

  /**
   * Format review type for display (Vietnamese)
   */
  getReviewTypeText(reviewType: string): string {
    const textMap: Record<string, string> = {
      RECRUITER_TO_CANDIDATE: "Nhà Tuyển Dụng → Ứng Viên",
      CANDIDATE_TO_RECRUITER: "Ứng Viên → Nhà Tuyển Dụng",
    };
    return textMap[reviewType] || reviewType;
  }
}

export default new JobReviewService();
