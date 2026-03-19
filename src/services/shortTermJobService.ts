import axiosInstance from "./axiosInstance";
import { uploadMedia } from "./mediaService";
import {
  CreateShortTermJobRequest,
  UpdateShortTermJobRequest,
  ApplyShortTermJobRequest,
  SubmitDeliverableRequest,
  RequestRevisionRequest,
  ShortTermJobResponse,
  ShortTermApplicationResponse,
  ShortTermJobFilters,
  ShortTermJobStatus,
  ShortTermApplicationStatus,
  DeliverableType,
  UpdateShortTermApplicationStatusRequest,
} from "../types/ShortTermJob";
import { getStoredUserRaw } from "../utils/authStorage";

// Helper type for axios error handling
type AxiosError = { response?: { data?: { message?: string } } };

class ShortTermJobService {
  // ==================== PRIVATE HELPERS ====================

  private handleError(error: unknown, defaultMessage: string): never {
    const axiosError = error as AxiosError;
    const errorMessage = axiosError.response?.data?.message || defaultMessage;
    console.error(`${defaultMessage}:`, errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * Transform backend response to match frontend interface.
   * Maps nested recruiterInfo fields to top-level fields expected by components.
   */
  private transformResponse(data: any): ShortTermJobResponse {
    return {
      ...data,
      recruiterCompanyName:
        data.recruiterCompanyName ||
        data.recruiterInfo?.companyName ||
        "Unknown",
      recruiterRating:
        data.recruiterRating ?? data.recruiterInfo?.rating ?? undefined,
      recruiterId: data.recruiterId ?? data.recruiterInfo?.id ?? 0,
    };
  }

  private getCurrentActorId(): number {
    try {
      const storedUser = getStoredUserRaw();
      if (!storedUser) {
        return 0;
      }

      const parsed = JSON.parse(storedUser) as { id?: number };
      return typeof parsed.id === "number" ? parsed.id : 0;
    } catch {
      return 0;
    }
  }

  private inferDeliverableType(file: File): DeliverableType {
    const mimeType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (mimeType.startsWith("image/")) return DeliverableType.IMAGE;
    if (mimeType.startsWith("video/")) return DeliverableType.VIDEO;
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.includes("spreadsheet") ||
      mimeType.includes("presentation")
    ) {
      return DeliverableType.DOCUMENT;
    }
    if (
      fileName.endsWith(".zip") ||
      fileName.endsWith(".rar") ||
      fileName.endsWith(".tar") ||
      fileName.endsWith(".gz") ||
      fileName.endsWith(".js") ||
      fileName.endsWith(".ts") ||
      fileName.endsWith(".tsx") ||
      fileName.endsWith(".jsx") ||
      fileName.endsWith(".java") ||
      fileName.endsWith(".py") ||
      fileName.endsWith(".cs") ||
      fileName.endsWith(".cpp") ||
      fileName.endsWith(".c")
    ) {
      return DeliverableType.CODE;
    }
    return DeliverableType.FILE;
  }

  // ==================== JOB POSTING ENDPOINTS (RECRUITER) ====================

  /**
   * Create a new short-term job posting (status = DRAFT by default)
   * @requires RECRUITER role
   */
  async createJob(
    data: CreateShortTermJobRequest,
  ): Promise<ShortTermJobResponse> {
    try {
      const response = await axiosInstance.post<ShortTermJobResponse>(
        "/api/short-term-jobs",
        data,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to create short-term job");
    }
  }

  /**
   * Update an existing short-term job (only if DRAFT or PUBLISHED)
   * @requires RECRUITER role
   */
  async updateJob(
    jobId: number,
    data: UpdateShortTermJobRequest,
  ): Promise<ShortTermJobResponse> {
    try {
      const response = await axiosInstance.put<ShortTermJobResponse>(
        `/api/short-term-jobs/${jobId}`,
        data,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to update short-term job");
    }
  }

  /**
   * Change job status
   * @requires RECRUITER role
   */
  async changeJobStatus(
    jobId: number,
    status: ShortTermJobStatus,
    reason?: string,
  ): Promise<ShortTermJobResponse> {
    try {
      const params = new URLSearchParams();
      params.append("status", status);
      if (reason) params.append("reason", reason);

      const response = await axiosInstance.patch<ShortTermJobResponse>(
        `/api/short-term-jobs/${jobId}/status?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to change job status");
    }
  }

  /**
   * Publish a draft job (submits for admin approval first)
   * @requires RECRUITER role
   */
  async publishJob(jobId: number): Promise<ShortTermJobResponse> {
    return this.changeJobStatus(jobId, ShortTermJobStatus.PENDING_APPROVAL);
  }

  /**
   * Submit a draft job for admin approval
   * @requires RECRUITER role
   */
  async submitForApproval(jobId: number): Promise<ShortTermJobResponse> {
    return this.changeJobStatus(jobId, ShortTermJobStatus.PENDING_APPROVAL);
  }

  /**
   * Cancel a job
   * @requires RECRUITER role
   */
  async cancelJob(
    jobId: number,
    reason?: string,
  ): Promise<ShortTermJobResponse> {
    return this.changeJobStatus(jobId, ShortTermJobStatus.CANCELLED, reason);
  }

  /**
   * Delete a job (only if DRAFT)
   * @requires RECRUITER role
   */
  async deleteJob(jobId: number): Promise<void> {
    try {
      await axiosInstance.delete(`/api/short-term-jobs/${jobId}`);
    } catch (error) {
      this.handleError(error, "Failed to delete job");
    }
  }

  /**
   * Get all jobs for current recruiter
   * @requires RECRUITER role
   */
  async getMyJobs(): Promise<ShortTermJobResponse[]> {
    try {
      const response = await axiosInstance.get<any[]>(
        "/api/short-term-jobs/my-jobs",
      );
      return response.data.map((job) => this.transformResponse(job));
    } catch (error) {
      this.handleError(error, "Failed to fetch my jobs");
    }
  }

  /**
   * Get my jobs with pagination
   * @requires RECRUITER role
   */
  async getMyJobsPaged(
    page: number = 0,
    size: number = 10,
  ): Promise<{
    content: ShortTermJobResponse[];
    totalPages: number;
    totalElements: number;
  }> {
    try {
      const response = await axiosInstance.get<any>(
        `/api/short-term-jobs/my-jobs/paged?page=${page}&size=${size}`,
      );
      const data = response.data;
      return {
        ...data,
        content: (data.content || []).map((job: any) =>
          this.transformResponse(job),
        ),
      };
    } catch (error) {
      this.handleError(error, "Failed to fetch my jobs paged");
    }
  }

  // ==================== JOB BROWSING ENDPOINTS (PUBLIC) ====================

  /**
   * Get all published short-term jobs
   * @public No authentication required
   */
  async getPublishedJobs(): Promise<ShortTermJobResponse[]> {
    try {
      const response = await axiosInstance.get<any[]>(
        "/api/short-term-jobs/public",
      );
      return response.data.map((job) => this.transformResponse(job));
    } catch (error) {
      this.handleError(error, "Failed to fetch published jobs");
    }
  }

  /**
   * Search jobs with filters
   * @public No authentication required
   */
  async searchJobs(
    filters?: ShortTermJobFilters,
    page: number = 0,
    size: number = 10,
  ): Promise<{
    content: ShortTermJobResponse[];
    totalPages: number;
    totalElements: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("size", size.toString());

      if (filters?.search) params.append("search", filters.search);
      if (filters?.minBudget)
        params.append("minBudget", filters.minBudget.toString());
      if (filters?.maxBudget)
        params.append("maxBudget", filters.maxBudget.toString());
      if (filters?.isRemote !== undefined)
        params.append("isRemote", filters.isRemote.toString());
      if (filters?.urgency) params.append("urgency", filters.urgency);

      const response = await axiosInstance.get<any>(
        `/api/short-term-jobs/search?${params.toString()}`,
      );
      const data = response.data;
      return {
        ...data,
        content: (data.content || []).map((job: any) =>
          this.transformResponse(job),
        ),
      };
    } catch (error) {
      this.handleError(error, "Failed to search jobs");
    }
  }

  /**
   * Get job details by ID
   * @public No authentication required
   */
  async getJobDetails(jobId: number): Promise<ShortTermJobResponse> {
    try {
      const response = await axiosInstance.get<any>(
        `/api/short-term-jobs/${jobId}`,
      );
      return this.transformResponse(response.data);
    } catch (error) {
      this.handleError(error, "Failed to fetch job details");
    }
  }

  // ==================== JOB APPLICATION ENDPOINTS (CANDIDATE) ====================

  /**
   * Apply to a short-term job
   * @requires USER role
   */
  async applyToJob(
    jobId: number,
    data: ApplyShortTermJobRequest,
  ): Promise<ShortTermApplicationResponse> {
    try {
      const response = await axiosInstance.post<ShortTermApplicationResponse>(
        `/api/short-term-jobs/${jobId}/apply`,
        data,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to apply to job");
    }
  }

  /**
   * Withdraw application
   * @requires USER role
   */
  async withdrawApplication(applicationId: number): Promise<void> {
    try {
      await axiosInstance.delete(
        `/api/short-term-jobs/applications/${applicationId}/withdraw`,
      );
    } catch (error) {
      this.handleError(error, "Failed to withdraw application");
    }
  }

  /**
   * Get all applications for current user
   * @requires USER role
   */
  async getMyApplications(): Promise<ShortTermApplicationResponse[]> {
    try {
      const response = await axiosInstance.get<ShortTermApplicationResponse[]>(
        "/api/short-term-jobs/my-applications",
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch my applications");
    }
  }

  /**
   * Get my applications with pagination
   * @requires USER role
   */
  async getMyApplicationsPaged(
    page: number = 0,
    size: number = 10,
  ): Promise<{
    content: ShortTermApplicationResponse[];
    totalPages: number;
    totalElements: number;
  }> {
    try {
      const response = await axiosInstance.get<any>(
        `/api/short-term-jobs/my-applications/paged?page=${page}&size=${size}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch my applications paged");
    }
  }

  // ==================== APPLICATION MANAGEMENT ENDPOINTS (RECRUITER) ====================

  /**
   * Get all applicants for a job
   * @requires RECRUITER role
   */
  async getJobApplicants(
    jobId: number,
    page: number = 0,
    size: number = 10,
  ): Promise<{
    content: ShortTermApplicationResponse[];
    totalPages: number;
    totalElements: number;
  }> {
    try {
      const response = await axiosInstance.get<any>(
        `/api/short-term-jobs/${jobId}/applicants?page=${page}&size=${size}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to fetch applicants");
    }
  }

  /**
   * Update application status
   * @requires RECRUITER role
   */
  async updateApplicationStatus(
    applicationId: number,
    data: UpdateShortTermApplicationStatusRequest,
  ): Promise<ShortTermApplicationResponse> {
    try {
      const response = await axiosInstance.patch<ShortTermApplicationResponse>(
        `/api/short-term-jobs/applications/${applicationId}/status`,
        data,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to update application status");
    }
  }

  /**
   * Select a candidate for the job
   * @requires RECRUITER role
   */
  async selectCandidate(
    jobId: number,
    applicationId: number,
  ): Promise<ShortTermApplicationResponse> {
    try {
      const response = await axiosInstance.post<ShortTermApplicationResponse>(
        `/api/short-term-jobs/${jobId}/select-candidate/${applicationId}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to select candidate");
    }
  }

  // ==================== WORK SUBMISSION ENDPOINTS (CANDIDATE) ====================

  /**
   * Submit deliverables (bàn giao công việc)
   * @requires USER role
   */
  async submitDeliverables(
    data: SubmitDeliverableRequest,
  ): Promise<ShortTermApplicationResponse> {
    try {
      const actorId = this.getCurrentActorId();
      const uploadedDeliverables = await Promise.all(
        (data.files || []).map(async (file) => {
          const media = await uploadMedia(file, actorId);
          return {
            type: this.inferDeliverableType(file),
            fileName: media.fileName || file.name,
            fileUrl: media.url,
            fileSize: media.fileSize ?? file.size,
            mimeType: file.type || undefined,
            description: undefined,
          };
        }),
      );

      const linkDeliverables = (data.links || [])
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => ({
          type: DeliverableType.LINK,
          fileName: url,
          fileUrl: url,
          fileSize: 0,
          mimeType: "text/uri-list",
          description: undefined,
        }));

      const response = await axiosInstance.post<ShortTermApplicationResponse>(
        "/api/short-term-jobs/applications/submit-deliverables",
        {
          applicationId: data.applicationId,
          milestoneId: data.milestoneId,
          workNote: data.workNote,
          deliverables: [...uploadedDeliverables, ...linkDeliverables],
          isFinalSubmission: data.isFinalSubmission,
        },
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to submit deliverables");
    }
  }

  // ==================== WORK REVIEW ENDPOINTS (RECRUITER) ====================

  /**
   * Approve submitted work
   * @requires RECRUITER role
   */
  async approveWork(
    applicationId: number,
    message?: string,
  ): Promise<ShortTermApplicationResponse> {
    try {
      const params = message ? `?message=${encodeURIComponent(message)}` : "";
      const response = await axiosInstance.post<ShortTermApplicationResponse>(
        `/api/short-term-jobs/applications/${applicationId}/approve${params}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to approve work");
    }
  }

  /**
   * Request revision
   * @requires RECRUITER role
   */
  async requestRevision(
    data: RequestRevisionRequest,
  ): Promise<ShortTermApplicationResponse> {
    try {
      const response = await axiosInstance.post<ShortTermApplicationResponse>(
        "/api/short-term-jobs/applications/request-revision",
        data,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to request revision");
    }
  }

  // ==================== COMPLETION ENDPOINTS ====================

  /**
   * Mark job as completed
   * @requires RECRUITER role
   */
  async completeJob(jobId: number): Promise<ShortTermJobResponse> {
    try {
      const response = await axiosInstance.post<ShortTermJobResponse>(
        `/api/short-term-jobs/${jobId}/complete`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to complete job");
    }
  }

  /**
   * Mark job as paid
   * @requires RECRUITER role
   */
  async markAsPaid(jobId: number): Promise<ShortTermJobResponse> {
    try {
      const response = await axiosInstance.post<ShortTermJobResponse>(
        `/api/short-term-jobs/${jobId}/mark-paid`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Failed to mark job as paid");
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get status badge color
   */
  getStatusColor(
    status: ShortTermJobStatus | ShortTermApplicationStatus | string,
  ): string {
    const colorMap: Record<string, string> = {
      // Job statuses
      DRAFT: "gray",
      PUBLISHED: "blue",
      APPLIED: "cyan",
      IN_PROGRESS: "orange",
      SUBMITTED: "purple",
      UNDER_REVIEW: "yellow",
      APPROVED: "green",
      REJECTED: "red",
      COMPLETED: "teal",
      PAID: "green",
      CANCELLED: "gray",
      DISPUTED: "red",
      // Application statuses
      PENDING: "blue",
      ACCEPTED: "green",
      WORKING: "orange",
      REVISION_REQUIRED: "yellow",
      WITHDRAWN: "gray",
    };
    return colorMap[status] || "gray";
  }

  /**
   * Get status display text (Vietnamese)
   */
  getStatusText(
    status: ShortTermJobStatus | ShortTermApplicationStatus | string,
  ): string {
    const textMap: Record<string, string> = {
      // Job statuses
      DRAFT: "Bản Nháp",
      PUBLISHED: "Đã Đăng",
      APPLIED: "Có Ứng Viên",
      IN_PROGRESS: "Đang Thực Hiện",
      SUBMITTED: "Đã Nộp Bài",
      UNDER_REVIEW: "Đang Xem Xét",
      APPROVED: "Đã Duyệt",
      REJECTED: "Cần Sửa Lại",
      COMPLETED: "Hoàn Thành",
      PAID: "Đã Thanh Toán",
      CANCELLED: "Đã Hủy",
      DISPUTED: "Tranh Chấp",
      // Application statuses
      PENDING: "Chờ Xét Duyệt",
      ACCEPTED: "Được Chấp Nhận",
      WORKING: "Đang Làm Việc",
      REVISION_REQUIRED: "Cần Sửa Lại",
      WITHDRAWN: "Đã Rút Đơn",
    };
    return textMap[status] || status;
  }

  /**
   * Get urgency badge color
   */
  getUrgencyColor(urgency: string): string {
    const colorMap: Record<string, string> = {
      NORMAL: "gray",
      URGENT: "orange",
      VERY_URGENT: "red",
      ASAP: "red",
    };
    return colorMap[urgency] || "gray";
  }

  /**
   * Get urgency display text (Vietnamese)
   */
  getUrgencyText(urgency: string): string {
    const textMap: Record<string, string> = {
      NORMAL: "Bình Thường",
      URGENT: "Gấp",
      VERY_URGENT: "Rất Gấp",
      ASAP: "Cần Ngay",
    };
    return textMap[urgency] || urgency;
  }

  /**
   * Format budget for display
   */
  formatBudget(budget: number): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(budget);
  }
}

export default new ShortTermJobService();
