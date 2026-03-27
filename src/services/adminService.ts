import axiosInstance from "./axiosInstance";
import {
  ApplicationActionRequest,
  AdminApprovalResponse,
  ApplicationsResponse,
  ApplicationStatusFilter,
  AdminJobStats,
  PageResponse,
  ResolveDisputeRequest,
  DisputeResponse,
} from "../data/adminDTOs";
import { Dispute, JobStatusAuditLog, ShortTermJobStatus } from "../types/ShortTermJob";

/**
 * AdminService - Service for admin operations to manage mentor/recruiter applications
 */
class AdminService {
  private readonly BASE_URL = "/api/admin";

  /**
   * Get all applications with optional status filter
   * @param status - Filter by status: 'ALL', 'PENDING', 'APPROVED', 'REJECTED' (default: 'ALL')
   * @returns Promise<ApplicationsResponse> - List of mentor and recruiter applications with stats
   */
  async getApplications(
    status: ApplicationStatusFilter = "ALL",
  ): Promise<ApplicationsResponse> {
    try {
      const response = await axiosInstance.get<ApplicationsResponse>(
        `${this.BASE_URL}/applications`,
        {
          params: { status },
        },
      );

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching applications:", error);
      throw error;
    }
  }

  /**
   * Process an application (Approve or Reject)
   * @param request - ApplicationActionRequest containing userId, applicationType, action, and optional rejectionReason
   * @returns Promise<AdminApprovalResponse> - Response with success status and message
   */
  async processApplication(
    request: ApplicationActionRequest,
  ): Promise<AdminApprovalResponse> {
    try {
      // Validate rejectionReason if action is REJECT
      if (request.action === "REJECT" && !request.rejectionReason) {
        throw new Error(
          "Rejection reason is required when rejecting an application",
        );
      }

      const response = await axiosInstance.post<AdminApprovalResponse>(
        `${this.BASE_URL}/applications/process`,
        request,
      );

      console.log(
        `Processed ${request.applicationType} application for user ${request.userId}`,
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error processing application:", error);
      console.error("📋 Request was:", JSON.stringify(request, null, 2));
      console.error("📋 Error response:", error.response?.data);
      console.error("📋 Error status:", error.response?.status);
      throw error;
    }
  }

  /**
   * Approve a mentor application
   * @param userId - User ID of the mentor applicant
   * @returns Promise<AdminApprovalResponse>
   */
  async approveMentorApplication(
    userId: number,
  ): Promise<AdminApprovalResponse> {
    return this.processApplication({
      userId,
      applicationType: "MENTOR",
      action: "APPROVE",
    });
  }

  /**
   * Reject a mentor application
   * @param userId - User ID of the mentor applicant
   * @param rejectionReason - Reason for rejection
   * @returns Promise<AdminApprovalResponse>
   */
  async rejectMentorApplication(
    userId: number,
    rejectionReason: string,
  ): Promise<AdminApprovalResponse> {
    return this.processApplication({
      userId,
      applicationType: "MENTOR",
      action: "REJECT",
      rejectionReason,
    });
  }

  /**
   * Approve a recruiter application
   * @param userId - User ID of the recruiter applicant
   * @returns Promise<AdminApprovalResponse>
   */
  async approveRecruiterApplication(
    userId: number,
  ): Promise<AdminApprovalResponse> {
    return this.processApplication({
      userId,
      applicationType: "RECRUITER",
      action: "APPROVE",
    });
  }

  /**
   * Reject a recruiter application
   * @param userId - User ID of the recruiter applicant
   * @param rejectionReason - Reason for rejection
   * @returns Promise<AdminApprovalResponse>
   */
  async rejectRecruiterApplication(
    userId: number,
    rejectionReason: string,
  ): Promise<AdminApprovalResponse> {
    return this.processApplication({
      userId,
      applicationType: "RECRUITER",
      action: "REJECT",
      rejectionReason,
    });
  }

  /**
   * Get only pending applications
   * @returns Promise<ApplicationsResponse>
   */
  async getPendingApplications(): Promise<ApplicationsResponse> {
    return this.getApplications("PENDING");
  }

  /**
   * Get only approved applications
   * @returns Promise<ApplicationsResponse>
   */
  async getApprovedApplications(): Promise<ApplicationsResponse> {
    return this.getApplications("APPROVED");
  }

  /**
   * Get only rejected applications
   * @returns Promise<ApplicationsResponse>
   */
  async getRejectedApplications(): Promise<ApplicationsResponse> {
    return this.getApplications("REJECTED");
  }

  /**
   * Download users report (CSV, Vietnamese)
   */
  async downloadUsersReport(params?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<void> {
    const url = `${this.BASE_URL}/reports/users`;
    const response = await axiosInstance.get(url, {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-nguoi-dung.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  /**
   * Download transactions report (CSV, Vietnamese)
   */
  async downloadTransactionsReport(params?: {
    status?: string;
    userId?: number;
    startDate?: string;
    endDate?: string;
    walletType?: string;
  }): Promise<void> {
    const url = `${this.BASE_URL}/reports/transactions`;
    const response = await axiosInstance.get(url, {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-giao-dich.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  async downloadUsersReportPdf(params?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<void> {
    const url = `${this.BASE_URL}/reports/users/pdf`;
    const response = await axiosInstance.get(url, {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-nguoi-dung.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  async downloadTransactionsReportPdf(params?: {
    status?: string;
    userId?: number;
    startDate?: string;
    endDate?: string;
    walletType?: string;
  }): Promise<void> {
    const url = `${this.BASE_URL}/reports/transactions/pdf`;
    const response = await axiosInstance.get(url, {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-giao-dich.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  /**
   * Get pending jobs
   */
  async getPendingJobs(): Promise<any[]> {
    const response = await axiosInstance.get<any[]>(
      `${this.BASE_URL}/jobs/pending`,
    );
    return response.data;
  }

  /**
   * Approve job
   */
  async approveJob(jobId: number): Promise<any> {
    const response = await axiosInstance.post(
      `${this.BASE_URL}/jobs/${jobId}/approve`,
    );
    return response.data;
  }

  /**
   * Reject job
   */
  async rejectJob(jobId: number, reason: string): Promise<any> {
    const response = await axiosInstance.post(
      `${this.BASE_URL}/jobs/${jobId}/reject`,
      null,
      {
        params: { reason },
      },
    );
    return response.data;
  }

  // ===================== SHORT-TERM JOB ADMIN =====================

  /**
   * Get pending short-term jobs
   */
  async getPendingShortTermJobs(): Promise<any[]> {
    const response = await axiosInstance.get<any[]>(
      `${this.BASE_URL}/short-term-jobs/pending`,
    );
    return response.data;
  }

  /**
   * Approve short-term job
   */
  async approveShortTermJob(jobId: number): Promise<any> {
    const response = await axiosInstance.post(
      `${this.BASE_URL}/short-term-jobs/${jobId}/approve`,
    );
    return response.data;
  }

  /**
   * Reject short-term job
   */
  async rejectShortTermJob(jobId: number, reason: string): Promise<any> {
    const response = await axiosInstance.post(
      `${this.BASE_URL}/short-term-jobs/${jobId}/reject`,
      null,
      {
        params: { reason },
      },
    );
    return response.data;
  }

  // ===================== FULL JOB MANAGEMENT =====================

  /**
   * Get paginated list of all short-term jobs
   */
  async getAllJobs(params?: {
    status?: ShortTermJobStatus;
    page?: number;
    size?: number;
  }): Promise<PageResponse<any>> {
    const response = await axiosInstance.get<PageResponse<any>>(
      `${this.BASE_URL}/short-term-jobs`,
      { params }
    );
    return response.data;
  }

  /**
   * Get job statistics for admin dashboard
   */
  async getJobStats(): Promise<AdminJobStats> {
    const response = await axiosInstance.get<AdminJobStats>(
      `${this.BASE_URL}/short-term-jobs/stats`,
    );
    return response.data;
  }

  /**
   * Get job detail by ID
   */
  async getJobDetail(jobId: number): Promise<any> {
    const response = await axiosInstance.get(
      `${this.BASE_URL}/short-term-jobs/${jobId}`,
    );
    return response.data;
  }

  /**
   * Delete a job (soft delete - sets to CANCELLED)
   */
  async deleteJob(jobId: number, reason?: string): Promise<any> {
    const response = await axiosInstance.delete(
      `${this.BASE_URL}/short-term-jobs/${jobId}`,
      { params: { reason } }
    );
    return response.data;
  }

  /**
   * Ban a job
   */
  async banJob(jobId: number, reason?: string): Promise<any> {
    const response = await axiosInstance.post(
      `${this.BASE_URL}/short-term-jobs/${jobId}/ban`,
      null,
      { params: { reason } },
    );
    return response.data;
  }

  /**
   * Unban a job
   */
  async unbanJob(jobId: number): Promise<any> {
    const response = await axiosInstance.post(
      `${this.BASE_URL}/short-term-jobs/${jobId}/unban`,
    );
    return response.data;
  }

  // ===================== DISPUTE MANAGEMENT =====================

  /**
   * Get paginated list of disputes
   */
  async getDisputes(params?: {
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<DisputeResponse>> {
    const response = await axiosInstance.get<PageResponse<DisputeResponse>>(
      `${this.BASE_URL}/short-term-jobs/disputes`,
      { params }
    );
    return response.data;
  }

  /**
   * Get dispute detail by ID
   */
  async getDisputeDetail(disputeId: number): Promise<Dispute> {
    const response = await axiosInstance.get<Dispute>(
      `${this.BASE_URL}/short-term-jobs/disputes/${disputeId}`,
    );
    return response.data;
  }

  /**
   * Get audit logs relevant to a dispute
   */
  async getDisputeAuditLogs(disputeId: number): Promise<JobStatusAuditLog[]> {
    const response = await axiosInstance.get<JobStatusAuditLog[]>(
      `${this.BASE_URL}/short-term-jobs/disputes/${disputeId}/audit-logs`,
    );
    return response.data;
  }

  /**
   * Resolve a dispute (admin action)
   */
  async resolveDispute(disputeId: number, request: Omit<ResolveDisputeRequest, never>): Promise<DisputeResponse> {
    const response = await axiosInstance.post<DisputeResponse>(
      `${this.BASE_URL}/short-term-jobs/disputes/${disputeId}/resolve`,
      request,
    );
    return response.data;
  }
}

// Export singleton instance
const adminService = new AdminService();
export default adminService;
