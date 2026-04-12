import axiosInstance from './axiosInstance';
import {
  CreateJobRequest,
  UpdateJobRequest,
  ApplyJobRequest,
  UpdateApplicationStatusRequest,
  JobPostingResponse,
  JobApplicationResponse,
  JobStatus
} from '../data/jobDTOs';

// Helper type for axios error handling
type AxiosError = { response?: { data?: { message?: string } } };

class JobService {
  
  // ==================== PRIVATE HELPER ====================
  
  private handleError(error: unknown, defaultMessage: string): never {
    const axiosError = error as AxiosError;
    const errorMessage = axiosError.response?.data?.message || defaultMessage;
    console.error(`${defaultMessage}:`, errorMessage);
    throw new Error(errorMessage);
  }

  // ==================== JOB POSTING ENDPOINTS (RECRUITER) ====================

  /**
   * Create a new job posting (status = IN_PROGRESS by default)
   * @requires RECRUITER role
   */
  async createJob(data: CreateJobRequest): Promise<JobPostingResponse> {
    try {
      const response = await axiosInstance.post<JobPostingResponse>('/api/jobs', data);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to create job');
    }
  }

  /**
   * Update an existing job (only if IN_PROGRESS or CLOSED)
   * @requires RECRUITER role
   */
  async updateJob(jobId: number, data: UpdateJobRequest): Promise<JobPostingResponse> {
    try {
      const response = await axiosInstance.put<JobPostingResponse>(`/api/jobs/${jobId}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to update job');
    }
  }

  /**
   * Change job status (IN_PROGRESS -> OPEN -> CLOSED)
   * @requires RECRUITER role
   */
  async changeJobStatus(jobId: number, status: JobStatus): Promise<JobPostingResponse> {
    try {
      const response = await axiosInstance.patch<JobPostingResponse>(
        `/api/jobs/${jobId}/status?status=${status}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to change job status');
    }
  }

  /**
   * Submit job for admin approval (IN_PROGRESS -> PENDING_APPROVAL)
   * Charges fee (subscription or 50k wallet)
   * @requires RECRUITER role
   */
  async submitForApproval(jobId: number): Promise<JobPostingResponse> {
    try {
      const response = await axiosInstance.post<JobPostingResponse>(
        `/api/jobs/${jobId}/submit`
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to submit job for approval');
    }
  }

  /**
   * Delete a job (only if status = IN_PROGRESS)
   * @requires RECRUITER role
   */
  async deleteJob(jobId: number): Promise<void> {
    try {
      await axiosInstance.delete(`/api/jobs/${jobId}`);
    } catch (error) {
      this.handleError(error, 'Failed to delete job');
    }
  }

  /**
   * Reopen a closed job (hard deletes all applications)
   * @requires RECRUITER role
   */
  async reopenJob(jobId: number, data?: { deadline?: string; clearApplications?: boolean }): Promise<JobPostingResponse> {
    try {
      const response = await axiosInstance.post<JobPostingResponse>(`/api/jobs/${jobId}/reopen`, data);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to reopen job');
    }
  }

  /**
   * Get all jobs for current recruiter
   * @requires RECRUITER role
   */
  async getMyJobs(): Promise<JobPostingResponse[]> {
    try {
      const response = await axiosInstance.get<JobPostingResponse[]>('/api/jobs/my-jobs');
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch jobs');
    }
  }

  // ==================== JOB POSTING ENDPOINTS (PUBLIC) ====================

  /**
   * Get all public jobs (status = OPEN) with optional filtering
   * @public No authentication required
   */
  async getPublicJobs(filters?: {
    search?: string;
    skills?: string[];
    minBudget?: number;
    maxBudget?: number;
    isRemote?: boolean;
    status?: string;
  }): Promise<JobPostingResponse[]> {
    try {
      
      
      // Build query params from filters
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.skills) filters.skills.forEach(skill => params.append('skills', skill));
      if (filters?.minBudget) params.append('minBudget', filters.minBudget.toString());
      if (filters?.maxBudget) params.append('maxBudget', filters.maxBudget.toString());
      if (filters?.isRemote !== undefined) params.append('isRemote', filters.isRemote.toString());
      if (filters?.status) params.append('status', filters.status);

      const queryString = params.toString();
      const url = `/api/jobs/public${queryString ? `?${queryString}` : ''}`;
      
      const response = await axiosInstance.get<JobPostingResponse[]>(url);
      
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch public jobs');
    }
  }

  /**
   * Get public jobs (status = OPEN) with pagination
   * @public No authentication required
   */
  async getPublicJobsPaged(
    page: number = 0,
    size: number = 10,
  ): Promise<{
    content: JobPostingResponse[];
    totalPages: number;
    totalElements: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());

      const response = await axiosInstance.get<{
        content: JobPostingResponse[];
        totalPages: number;
        totalElements: number;
        number: number;
        size: number;
      }>(`/api/jobs/public/paged?${params.toString()}`);

      return {
        content: response.data.content,
        totalPages: response.data.totalPages,
        totalElements: response.data.totalElements,
      };
    } catch (error) {
      this.handleError(error, 'Failed to fetch public jobs');
    }
  }

  /**
   * Get job details by ID
   * @public No authentication required
   */
  async getJobDetails(jobId: number): Promise<JobPostingResponse> {
    try {
      
      const response = await axiosInstance.get<JobPostingResponse>(`/api/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch job details');
    }
  }

  // ==================== JOB APPLICATION ENDPOINTS (USER) ====================

  /**
   * Apply to a job
   * @requires USER role
   */
  async applyToJob(jobId: number, data: ApplyJobRequest): Promise<JobApplicationResponse> {
    try {
      
      const response = await axiosInstance.post<JobApplicationResponse>(
        `/api/jobs/${jobId}/apply`,
        data
      );
      
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to apply to job');
    }
  }

  /**
   * Get all applications for current user
   * @requires USER role
   */
  async getMyApplications(): Promise<JobApplicationResponse[]> {
    try {
      
      const response = await axiosInstance.get<JobApplicationResponse[]>('/api/jobs/my-applications');
      
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch applications');
    }
  }

  // ==================== JOB APPLICATION ENDPOINTS (RECRUITER) ====================

  /**
   * Get all applicants for a job
   * @requires RECRUITER role (ownership validated)
   */
  async getJobApplicants(jobId: number, page: number = 0, size: number = 3): Promise<{ content: JobApplicationResponse[], totalPages: number, totalElements: number }> {
    try {
      
      const response = await axiosInstance.get<any>(
        `/api/jobs/${jobId}/applicants?page=${page}&size=${size}`
      );
      
      if (response.data && typeof response.data.content !== 'undefined') {
        return {
          content: response.data.content,
          totalPages: response.data.totalPages,
          totalElements: response.data.totalElements
        };
      }

      // Fallback for array response
      if (Array.isArray(response.data)) {
        return { content: response.data, totalPages: 1, totalElements: response.data.length };
      }

      return { content: [], totalPages: 0, totalElements: 0 };
    } catch (error) {
      this.handleError(error, 'Failed to fetch applicants');
      return { content: [], totalPages: 0, totalElements: 0 };
    }
  }

  /**
   * Update application status (REVIEWED, ACCEPTED, REJECTED)
   * Triggers email notification to applicant
   * @requires RECRUITER role (ownership validated)
   */
  async updateApplicationStatus(
    applicationId: number,
    data: UpdateApplicationStatusRequest
  ): Promise<JobApplicationResponse> {
    try {
      
      const response = await axiosInstance.patch<JobApplicationResponse>(
        `/api/jobs/applications/${applicationId}/status`,
        data
      );
      
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to update application status');
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Check if user has already applied to a job
   */
  async hasAppliedToJob(jobId: number): Promise<boolean> {
    try {
      const applications = await this.getMyApplications();
      return applications.some(app => app.jobId === jobId);
    } catch (error) {
      console.error('Error checking application status:', error);
      return false;
    }
  }

  /**
   * Format budget range for display
   */
  formatBudget(minBudget: number, maxBudget: number): string {
    const formatter = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    });
    return `${formatter.format(minBudget)} - ${formatter.format(maxBudget)}`;
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: JobStatus | string): string {
    switch (status) {
      case 'IN_PROGRESS': return 'gray';
      case 'OPEN': return 'green';
      case 'PENDING_APPROVAL': return 'orange';
      case 'CLOSED': return 'red';
      case 'PENDING': return 'blue';
      case 'REVIEWED': return 'yellow';
      case 'ACCEPTED': return 'green';
      case 'INTERVIEW_SCHEDULED': return 'cyan';
      case 'INTERVIEWED': return 'indigo';
      case 'OFFER_SENT': return 'purple';
      case 'OFFER_ACCEPTED': return 'green';
      case 'OFFER_REJECTED': return 'red';
      case 'REJECTED': return 'red';
      case 'CONTRACT_SIGNED': return 'green';
      default: return 'gray';
    }
  }

  /**
   * Get status display text (Vietnamese)
   */
  getStatusText(status: JobStatus | string): string {
    switch (status) {
      case 'IN_PROGRESS': return 'Đang Soạn';
      case 'OPEN': return 'Đang Mở';
      case 'PENDING_APPROVAL': return 'Chờ Duyệt';
      case 'CLOSED': return 'Đã Đóng';
      case 'PENDING': return 'Chờ Xét Duyệt';
      case 'REVIEWED': return 'Đã Xem';
      case 'ACCEPTED': return 'Đã Chấp Nhận';
      case 'INTERVIEW_SCHEDULED': return 'Đã Lên Lịch Phỏng Vấn';
      case 'INTERVIEWED': return 'Đã Phỏng Vấn';
      case 'OFFER_SENT': return 'Đã Gửi Đề Nghị';
      case 'OFFER_ACCEPTED': return 'Đề Nghị Được Chấp Nhận';
      case 'OFFER_REJECTED': return 'Đề Nghị Bị Từ Chối';
      case 'REJECTED': return 'Đã Từ Chối';
      case 'CONTRACT_SIGNED': return 'Đã ký hợp đồng';
      default: return status;
    }
  }
}

export default new JobService();
