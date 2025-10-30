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
  
  // ==================== JOB POSTING ENDPOINTS (RECRUITER) ====================

  /**
   * Create a new job posting (status = IN_PROGRESS by default)
   * @requires RECRUITER role
   */
  async createJob(data: CreateJobRequest): Promise<JobPostingResponse> {
    try {
      console.log('Creating job:', data.title);
      const response = await axiosInstance.post<JobPostingResponse>('/api/jobs', data);
      console.log('Job created successfully:', response.data.id);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Failed to create job';
      console.error('Error creating job:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Update an existing job (only if IN_PROGRESS or CLOSED)
   * @requires RECRUITER role
   */
  async updateJob(jobId: number, data: UpdateJobRequest): Promise<JobPostingResponse> {
    try {
      console.log('Updating job:', jobId);
      const response = await axiosInstance.put<JobPostingResponse>(`/api/jobs/${jobId}`, data);
      console.log('Job updated successfully');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Failed to update job';
      console.error('Error updating job:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Change job status (IN_PROGRESS -> OPEN -> CLOSED)
   * @requires RECRUITER role
   */
  async changeJobStatus(jobId: number, status: JobStatus): Promise<JobPostingResponse> {
    try {
      console.log(`Changing job ${jobId} status to ${status}`);
      const response = await axiosInstance.patch<JobPostingResponse>(
        `/api/jobs/${jobId}/status`,
        null,
        { params: { status } }
      );
      console.log('Job status changed successfully');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Failed to change job status';
      console.error('Error changing job status:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a job (only if status = IN_PROGRESS)
   * @requires RECRUITER role
   */
  async deleteJob(jobId: number): Promise<void> {
    try {
      console.log('Deleting job:', jobId);
      await axiosInstance.delete(`/api/jobs/${jobId}`);
      console.log('Job deleted successfully');
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Failed to delete job';
      console.error('Error deleting job:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Reopen a closed job (hard deletes all applications)
   * @requires RECRUITER role
   */
  async reopenJob(jobId: number): Promise<JobPostingResponse> {
    try {
      console.log('Reopening job:', jobId);
      const response = await axiosInstance.post<JobPostingResponse>(`/api/jobs/${jobId}/reopen`);
      console.log('Job reopened successfully, all applications deleted');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Failed to reopen job';
      console.error('Error reopening job:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all jobs for current recruiter
   * @requires RECRUITER role
   */
  async getMyJobs(): Promise<JobPostingResponse[]> {
    try {
      console.log('Fetching my jobs');
      const response = await axiosInstance.get<JobPostingResponse[]>('/api/jobs/my-jobs');
      console.log(`Fetched ${response.data.length} jobs`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Failed to fetch jobs';
      console.error('Error fetching my jobs:', errorMessage);
      throw new Error(errorMessage);
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
      console.log('Fetching public jobs with filters:', filters);
      
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
      console.log(`Fetched ${response.data.length} public jobs`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Failed to fetch public jobs';
      console.error('Error fetching public jobs:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get job details by ID
   * @public No authentication required
   */
  async getJobDetails(jobId: number): Promise<JobPostingResponse> {
    try {
      console.log('Fetching job details:', jobId);
      const response = await axiosInstance.get<JobPostingResponse>(`/api/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Failed to fetch job details';
      console.error('Error fetching job details:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  // ==================== JOB APPLICATION ENDPOINTS (USER) ====================

  /**
   * Apply to a job
   * @requires USER role
   */
  async applyToJob(jobId: number, data: ApplyJobRequest): Promise<JobApplicationResponse> {
    try {
      console.log('Applying to job:', jobId);
      const response = await axiosInstance.post<JobApplicationResponse>(
        `/api/jobs/${jobId}/apply`,
        data
      );
      console.log('Application submitted successfully');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Failed to apply to job';
      console.error('Error applying to job:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all applications for current user
   * @requires USER role
   */
  async getMyApplications(): Promise<JobApplicationResponse[]> {
    try {
      console.log('Fetching my applications');
      const response = await axiosInstance.get<JobApplicationResponse[]>('/api/jobs/my-applications');
      console.log(`Fetched ${response.data.length} applications`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Failed to fetch applications';
      console.error('Error fetching my applications:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  // ==================== JOB APPLICATION ENDPOINTS (RECRUITER) ====================

  /**
   * Get all applicants for a job
   * @requires RECRUITER role (ownership validated)
   */
  async getJobApplicants(jobId: number): Promise<JobApplicationResponse[]> {
    try {
      console.log('Fetching applicants for job:', jobId);
      const response = await axiosInstance.get<JobApplicationResponse[]>(
        `/api/jobs/${jobId}/applicants`
      );
      console.log(`Fetched ${response.data.length} applicants`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Failed to fetch applicants';
      console.error('Error fetching applicants:', errorMessage);
      throw new Error(errorMessage);
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
      console.log(`Updating application ${applicationId} status to ${data.status}`);
      const response = await axiosInstance.patch<JobApplicationResponse>(
        `/api/jobs/applications/${applicationId}/status`,
        data
      );
      console.log('Application status updated, email notification sent');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Failed to update application status';
      console.error('Error updating application status:', errorMessage);
      throw new Error(errorMessage);
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
      case 'CLOSED': return 'red';
      case 'PENDING': return 'blue';
      case 'REVIEWED': return 'yellow';
      case 'ACCEPTED': return 'green';
      case 'REJECTED': return 'red';
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
      case 'CLOSED': return 'Đã Đóng';
      case 'PENDING': return 'Chờ Xét Duyệt';
      case 'REVIEWED': return 'Đã Xem';
      case 'ACCEPTED': return 'Đã Chấp Nhận';
      case 'REJECTED': return 'Đã Từ Chối';
      default: return status;
    }
  }
}

export default new JobService();
