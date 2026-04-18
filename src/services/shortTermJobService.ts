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
  EscrowStatus,
  JobEscrow,
  EscrowTransaction,
  DisputeType,
  Dispute,
  DisputeEvidence,
  DisputeResponseEntity,
  TrustScore,
  TrustTier,
  UserSubmittedDispute,
} from "../types/ShortTermJob";
import { getStoredUserRaw } from "../utils/authStorage";

// Helper type for axios error handling — includes status for 404 detection
type AxiosError = {
  response?: { status?: number; data?: { message?: string } };
};

class ShortTermJobService {
  // ==================== PRIVATE HELPERS ====================

  private handleError(error: unknown, defaultMessage: string): never {
    const axiosError = error as AxiosError;
    const errorMessage = axiosError.response?.data?.message || defaultMessage;
    console.error(`${defaultMessage}:`, errorMessage);
    throw new Error(errorMessage);
  }

  private toNumber(value: unknown, fallback: number = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private normalizeEscrow(data: any, fallbackJobId?: number): JobEscrow | null {
    if (!data) {
      return null;
    }

    const totalAmount = this.toNumber(data.totalAmount);
    const platformFee = this.toNumber(data.platformFee);

    return {
      escrowId: this.toNumber(data.escrowId ?? data.id),
      jobId: this.toNumber(data.jobId ?? data.job?.id ?? fallbackJobId),
      jobTitle: data.jobTitle ?? data.job?.title,
      recruiterId: this.toNumber(data.recruiterId),
      recruiterName: data.recruiterName,
      workerId:
        data.workerId !== undefined && data.workerId !== null
          ? this.toNumber(data.workerId)
          : undefined,
      workerName: data.workerName,
      totalAmount,
      platformFee,
      netAmount: this.toNumber(data.netAmount, totalAmount - platformFee),
      escrowBalance: this.toNumber(data.escrowBalance),
      pendingPayoutBalance: this.toNumber(data.pendingPayoutBalance),
      status: (data.status ?? EscrowStatus.PENDING) as EscrowStatus,
      fundedAt: data.fundedAt ?? data.createdAt ?? new Date().toISOString(),
      releasedAt: data.releasedAt ?? undefined,
      refundedAt: data.refundedAt ?? undefined,
      transactions: Array.isArray(data.transactions)
        ? data.transactions.map((tx: any) => ({
            id: this.toNumber(tx.id),
            escrowId: this.toNumber(tx.escrowId ?? data.escrowId ?? data.id),
            type: tx.type ?? tx.transactionType,
            amount: this.toNumber(tx.amount),
            feeAmount: this.toNumber(tx.feeAmount),
            netAmount: this.toNumber(tx.netAmount),
            actorId:
              tx.actorId !== undefined && tx.actorId !== null
                ? this.toNumber(tx.actorId)
                : undefined,
            actorName: tx.actorName,
            reason: tx.reason,
            metadata: tx.metadata,
            createdAt: tx.createdAt ?? new Date().toISOString(),
          }))
        : undefined,
    };
  }

  private normalizeDisputeResponse(data: any): Dispute | null {
    const unwrapped =
      data?.data && typeof data.data === "object" ? data.data : data;
    const raw = Array.isArray(unwrapped) ? unwrapped[0] : unwrapped;
    if (!raw) {
      return null;
    }

    const disputeId = this.toNumber(raw.id);
    const jobId = this.toNumber(
      raw.jobId ?? raw.job?.id ?? raw.shortTermJob?.id,
    );
    const applicationId = this.toNumber(
      raw.applicationId ?? raw.application?.id,
    );

    return {
      id: disputeId,
      jobId,
      applicationId,
      jobTitle: raw.jobTitle ?? raw.job?.title ?? raw.shortTermJob?.title,
      initiatorId: this.toNumber(raw.initiatorId),
      initiatorName: raw.initiatorName,
      respondentId: this.toNumber(raw.respondentId),
      respondentName: raw.respondentName,
      disputeType: raw.disputeType as DisputeType,
      reason: raw.reason ?? "",
      status: raw.status,
      resolution: raw.resolution,
      partialRefundPct:
        raw.partialRefundPct !== undefined && raw.partialRefundPct !== null
          ? this.toNumber(raw.partialRefundPct)
          : undefined,
      resolutionNotes: raw.resolutionNotes,
      resolvedBy:
        raw.resolvedBy !== undefined && raw.resolvedBy !== null
          ? this.toNumber(raw.resolvedBy)
          : undefined,
      resolvedByName: raw.resolvedByName,
      resolvedAt: raw.resolvedAt ?? undefined,
      adminResolutionDeadlineAt: raw.adminResolutionDeadlineAt ?? undefined,
      escalationLevel: raw.escalationLevel,
      priority: raw.priority,
      createdAt: raw.createdAt ?? new Date().toISOString(),
      evidence: Array.isArray(raw.evidence)
        ? raw.evidence.map((ev: any) => ({
            id: this.toNumber(ev.id),
            disputeId: this.toNumber(
              ev.disputeId ?? ev.dispute?.id ?? disputeId,
            ),
            submittedBy: this.toNumber(ev.submittedBy),
            submittedByName: ev.submittedByName,
            evidenceType: ev.evidenceType,
            content: ev.content,
            fileUrl: ev.fileUrl,
            fileName: ev.fileName,
            description: ev.description,
            isOfficial: Boolean(ev.isOfficial),
            createdAt: ev.createdAt ?? new Date().toISOString(),
            responses: Array.isArray(ev.responses)
              ? ev.responses.map((resp: any) => ({
                  id: this.toNumber(resp.id),
                  disputeId: this.toNumber(
                    resp.disputeId ?? resp.dispute?.id ?? disputeId,
                  ),
                  evidenceId: this.toNumber(
                    resp.evidenceId ?? resp.evidence?.id ?? ev.id,
                  ),
                  respondedBy: this.toNumber(resp.respondedBy),
                  respondedByName: resp.respondedByName,
                  content: resp.content ?? "",
                  isAdminResponse: Boolean(resp.isAdminResponse),
                  createdAt: resp.createdAt ?? new Date().toISOString(),
                }))
              : [],
          }))
        : [],
    };
  }

  private normalizeUserSubmittedDisputeResponse(
    data: any,
  ): UserSubmittedDispute | null {
    if (!data) {
      return null;
    }

    return {
      id: this.toNumber(data.id),
      jobId:
        data.jobId !== undefined && data.jobId !== null
          ? this.toNumber(data.jobId)
          : undefined,
      applicationId:
        data.applicationId !== undefined && data.applicationId !== null
          ? this.toNumber(data.applicationId)
          : undefined,
      jobTitle: data.jobTitle ?? undefined,
      jobStatus: data.jobStatus ?? undefined,
      applicationStatus: data.applicationStatus ?? undefined,
      initiatorId: this.toNumber(data.initiatorId),
      initiatorName: data.initiatorName ?? undefined,
      respondentId: this.toNumber(data.respondentId),
      respondentName: data.respondentName ?? undefined,
      disputeType: (data.disputeType ?? DisputeType.OTHER) as DisputeType,
      reason: data.reason ?? "",
      status: data.status,
      resolution: data.resolution ?? undefined,
      partialRefundPct:
        data.partialRefundPct !== undefined && data.partialRefundPct !== null
          ? this.toNumber(data.partialRefundPct)
          : undefined,
      resolutionNotes: data.resolutionNotes ?? undefined,
      resolvedBy:
        data.resolvedBy !== undefined && data.resolvedBy !== null
          ? this.toNumber(data.resolvedBy)
          : undefined,
      resolvedByName: data.resolvedByName ?? undefined,
      resolvedAt: data.resolvedAt ?? undefined,
      createdAt: data.createdAt ?? new Date().toISOString(),
      adminResolutionDeadlineAt: data.adminResolutionDeadlineAt ?? undefined,
      escalationLevel:
        data.escalationLevel !== undefined && data.escalationLevel !== null
          ? this.toNumber(data.escalationLevel)
          : undefined,
      priority: data.priority ?? undefined,
    };
  }

  private normalizeTrustScore(data: any): TrustScore | null {
    if (!data) {
      return null;
    }

    return {
      userId: this.toNumber(data.userId),
      userName: data.userName,
      totalScore: this.toNumber(data.totalScore),
      trustTier: (data.trustTier ?? TrustTier.NEWCOMER) as TrustTier,
      completionRate: this.toNumber(data.completionRate),
      disputeRate: this.toNumber(data.disputeRate),
      responseTimeHours: this.toNumber(data.responseTimeHours),
      avgRating: this.toNumber(data.avgRating),
      totalJobs: this.toNumber(data.totalJobs),
      completedJobs: this.toNumber(data.completedJobs),
      disputedJobs: this.toNumber(data.disputedJobs),
      totalReviews: this.toNumber(data.totalReviews),
      accountAgeDays: this.toNumber(data.accountAgeDays),
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
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
      recruiterCompanyLogoUrl:
        data.recruiterCompanyLogoUrl ||
        data.recruiterInfo?.companyLogoUrl ||
        undefined,
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
   * Get published short-term jobs with pagination
   * @public No authentication required
   */
  async getPublishedJobsPaged(
    page: number = 0,
    size: number = 10,
  ): Promise<{
    content: ShortTermJobResponse[];
    totalPages: number;
    totalElements: number;
  }> {
    try {
      const response = await axiosInstance.get<{
        content: any[];
        totalPages: number;
        totalElements: number;
      }>(`/api/short-term-jobs/public/paged?page=${page}&size=${size}`);
      return {
        content: response.data.content.map((job) =>
          this.transformResponse(job),
        ),
        totalPages: response.data.totalPages,
        totalElements: response.data.totalElements,
      };
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

  /**
   * Recruiter requests admin review before cancelling after repeated revisions
   * @requires RECRUITER role
   */
  async requestCancellationReview(
    applicationId: number,
    reason: string,
  ): Promise<ShortTermApplicationResponse> {
    try {
      const response = await axiosInstance.post<ShortTermApplicationResponse>(
        "/api/short-term-jobs/applications/request-cancellation-review",
        {
          applicationId,
          reason,
        },
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Không thể gửi yêu cầu hủy để admin xem xét");
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

  // ==================== CANCELLATION / DISPUTE ENDPOINTS (WORKER) ====================

  /**
   * Accept cancellation requested by recruiter
   * POST /api/short-term-jobs/applications/{id}/accept-cancellation
   * @requires USER role
   */
  async acceptCancellation(
    applicationId: number,
  ): Promise<ShortTermApplicationResponse> {
    try {
      const response = await axiosInstance.post<ShortTermApplicationResponse>(
        `/api/short-term-jobs/applications/${applicationId}/accept-cancellation`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Không thể chấp nhận yêu cầu hủy");
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

  // ==================== ESCROW METHODS ====================

  /**
   * Fund escrow for a job
   * POST /api/short-term-jobs/{jobId}/fund-escrow
   */
  async fundEscrow(jobId: number): Promise<JobEscrow> {
    try {
      const response = await axiosInstance.post<JobEscrow>(
        `/api/short-term-jobs/${jobId}/fund-escrow`,
      );
      return this.normalizeEscrow(response.data, jobId)!;
    } catch (error) {
      this.handleError(error, "Không thể ký quỹ");
    }
  }

  /**
   * Get escrow status for a job
   * GET /api/short-term-jobs/{jobId}/escrow
   */
  async getEscrowStatus(jobId: number): Promise<JobEscrow | null> {
    try {
      const response = await axiosInstance.get(
        `/api/short-term-jobs/${jobId}/escrow`,
      );
      // Backend returns 204 (empty body) when no escrow exists
      if (!response.data) return null;
      return this.normalizeEscrow(response.data, jobId);
    } catch (error) {
      this.handleError(error, "Không thể lấy trạng thái ký quỹ");
    }
  }

  /**
   * Release escrow (pay worker)
   * POST /api/short-term-jobs/{jobId}/release-escrow
   */
  async releaseEscrow(jobId: number, message?: string): Promise<JobEscrow> {
    try {
      const params = message ? `?message=${encodeURIComponent(message)}` : "";
      const response = await axiosInstance.post(
        `/api/short-term-jobs/${jobId}/release-escrow${params}`,
      );
      return this.normalizeEscrow(response.data, jobId)!;
    } catch (error) {
      this.handleError(error, "Không thể giải phóng ký quỹ");
    }
  }

  /**
   * Refund escrow to recruiter
   * POST /api/short-term-jobs/{jobId}/refund-escrow
   */
  async refundEscrow(jobId: number, reason: string): Promise<JobEscrow> {
    try {
      const response = await axiosInstance.post(
        `/api/short-term-jobs/${jobId}/refund-escrow`,
        { reason },
      );
      return this.normalizeEscrow(response.data, jobId)!;
    } catch (error) {
      this.handleError(error, "Không thể hoàn ký quỹ");
    }
  }

  /**
   * Get escrow transactions
   * GET /api/short-term-jobs/{jobId}/escrow-transactions
   */
  async getEscrowTransactions(
    jobId: number,
    page: number = 0,
    size: number = 20,
  ): Promise<{
    content: EscrowTransaction[];
    totalElements: number;
    totalPages: number;
  }> {
    try {
      const response = await axiosInstance.get<any>(
        `/api/short-term-jobs/${jobId}/escrow-transactions?page=${page}&size=${size}`,
      );
      return {
        content: response.data.content || [],
        totalElements: response.data.totalElements || 0,
        totalPages: response.data.totalPages || 0,
      };
    } catch (error) {
      this.handleError(error, "Không thể lấy lịch sử giao dịch ký quỹ");
    }
  }

  // ==================== DISPUTE METHODS ====================

  // [Nghiệp vụ] Mở dispute — handle 404 để phân biệt job không tồn tại vs lỗi khác
  async openDispute(data: {
    jobId: number;
    applicationId: number;
    disputeType: DisputeType;
    reason: string;
  }): Promise<Dispute> {
    try {
      const response = await axiosInstance.post("/api/disputes", data);
      const dispute =
        this.normalizeDisputeResponse(response.data) ?? response.data;
      if (
        !dispute ||
        !Number.isFinite(Number(dispute.id)) ||
        Number(dispute.id) <= 0
      ) {
        throw new Error("Khong the doc dispute ID tu phan hoi tao khieu nai.");
      }
      return dispute;
    } catch (error) {
      // [Nghiệp vụ] Phân biệt 404 (job không tồn tại/hủy) vs lỗi khác để hiển thị message phù hợp
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      if (status === 404) {
        const message =
          axiosError.response?.data?.message ||
          "Công việc không tồn tại hoặc đã bị hủy.";
        console.error("Không thể mở dispute:", message);
        throw new Error(message);
      }
      this.handleError(error, "Không thể mở dispute");
    }
  }

  /**
   * Get dispute by ID
   * GET /api/disputes/{id}
   */
  async getDispute(disputeId: number): Promise<Dispute> {
    try {
      const response = await axiosInstance.get(`/api/disputes/${disputeId}`);
      return this.normalizeDisputeResponse(response.data) ?? response.data;
    } catch (error) {
      this.handleError(error, "Không thể lấy chi tiết dispute");
    }
  }

  /**
   * Get dispute by job ID
   * GET /api/disputes/job/{jobId}
   */
  async getDisputeByJob(jobId: number): Promise<Dispute | null> {
    try {
      const response = await axiosInstance.get(`/api/disputes/job/${jobId}`);
      const raw = response.data;
      if (!raw) return null;
      const list = Array.isArray(raw) ? raw : [raw];
      return this.normalizeDisputeResponse(list[0]) ?? list[0] ?? null;
    } catch {
      return null;
    }
  }

  // [Nghiệp vụ] Tab dispute đã gửi cần danh sách dispute do chính user khởi tạo để theo dõi read-only.
  async getMySubmittedDisputes(
    page: number = 0,
    size: number = 12,
  ): Promise<{
    content: UserSubmittedDispute[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
  }> {
    try {
      const response = await axiosInstance.get<any>(
        `/api/disputes/my-submitted?page=${page}&size=${size}`,
      );

      const data = response.data ?? {};
      const content = Array.isArray(data.content)
        ? data.content
            .map((item: any) =>
              this.normalizeUserSubmittedDisputeResponse(item),
            )
            .filter(Boolean)
        : [];

      return {
        content: content as UserSubmittedDispute[],
        totalPages: this.toNumber(data.totalPages),
        totalElements: this.toNumber(data.totalElements),
        number: this.toNumber(data.number),
        size: this.toNumber(data.size, size),
      };
    } catch (error) {
      this.handleError(error, "Không thể lấy danh sách dispute đã gửi");
    }
  }

  /**
   * Submit evidence to a dispute
   * POST /api/disputes/{disputeId}/evidence
   */
  async submitEvidence(
    disputeId: number,
    data: {
      evidenceType: string;
      content?: string;
      fileUrl?: string;
      fileName?: string;
      description?: string;
    },
  ): Promise<DisputeEvidence> {
    try {
      const response = await axiosInstance.post<DisputeEvidence>(
        `/api/disputes/${disputeId}/evidence`,
        data,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Không thể gửi bằng chứng");
    }
  }

  /**
   * Respond to evidence
   * POST /api/disputes/{disputeId}/evidence/{evidenceId}/respond
   */
  async respondToEvidence(
    disputeId: number,
    evidenceId: number,
    content: string,
  ): Promise<DisputeResponseEntity> {
    try {
      const response = await axiosInstance.post<DisputeResponseEntity>(
        `/api/disputes/${disputeId}/evidence/${evidenceId}/respond`,
        { content },
      );
      return response.data;
    } catch (error) {
      this.handleError(error, "Không thể phản hồi bằng chứng");
    }
  }

  // ==================== TRUST SCORE METHODS ====================

  /**
   * Get trust score for a user
   * GET /api/trust-scores/{userId}
   */
  async getTrustScore(userId: number): Promise<TrustScore | null> {
    try {
      const response = await axiosInstance.get(`/api/trust-scores/${userId}`);
      if (!response.data) return null;
      return this.normalizeTrustScore(response.data);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      this.handleError(error, "Không thể lấy trust score");
    }
  }

  /**
   * Get escrow status color
   */
  getEscrowStatusColor(status: EscrowStatus | string): string {
    const colorMap: Record<string, string> = {
      PENDING: "yellow",
      FUNDED: "blue",
      PARTIALLY_RELEASED: "purple",
      FULLY_RELEASED: "green",
      REFUNDED: "gray",
      DISPUTED: "red",
    };
    return colorMap[status] || "gray";
  }

  /**
   * Get escrow status text (Vietnamese)
   */
  getEscrowStatusText(status: EscrowStatus | string): string {
    const textMap: Record<string, string> = {
      PENDING: "Chờ ký quỹ",
      FUNDED: "Đã ký quỹ",
      PARTIALLY_RELEASED: "Đã giải phóng một phần",
      FULLY_RELEASED: "Đã giải phóng toàn bộ",
      REFUNDED: "Đã hoàn ký quỹ",
      DISPUTED: "Đang tranh chấp",
    };
    return textMap[status] || status;
  }

  /**
   * Get dispute status color
   */
  getDisputeStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      OPEN: "red",
      UNDER_INVESTIGATION: "yellow",
      AWAITING_RESPONSE: "blue",
      RESOLVED: "green",
      DISMISSED: "gray",
      ESCALATED: "purple",
    };
    return colorMap[status] || "gray";
  }

  /**
   * Get dispute status text (Vietnamese)
   */
  getDisputeStatusText(status: string): string {
    const textMap: Record<string, string> = {
      OPEN: "Mở",
      UNDER_INVESTIGATION: "Đang điều tra",
      AWAITING_RESPONSE: "Chờ phản hồi",
      RESOLVED: "Đã giải quyết",
      DISMISSED: "Bác bỏ",
      ESCALATED: "Đã leo thang",
    };
    return textMap[status] || status;
  }

  /**
   * Get dispute type text (Vietnamese)
   */
  getDisputeTypeText(type: DisputeType | string): string {
    const textMap: Record<string, string> = {
      NO_SUBMISSION: "Không nộp bài",
      POOR_QUALITY: "Chất lượng kém",
      MISSING_DELIVERABLE: "Thiếu sản phẩm",
      DEADLINE_VIOLATION: "Vi phạm deadline",
      PAYMENT_ISSUE: "Vấn đề thanh toán",
      COMMUNICATION_FAILURE: "Không liên lạc được",
      SCOPE_CHANGE: "Thay đổi phạm vi",
      SCAM_REPORT: "Báo lừa đảo",
      OTHER: "Khác",
    };
    return textMap[type] || type;
  }

  /**
   * Get trust tier text (Vietnamese)
   */
  getTrustTierText(tier: string): string {
    const textMap: Record<string, string> = {
      NEWCOMER: "Tân binh",
      BASIC: "Cơ bản",
      TRUSTED: "Đáng tin cậy",
      ELITE: "Elite",
    };
    return textMap[tier] || tier;
  }
}

export default new ShortTermJobService();
