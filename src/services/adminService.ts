import axiosInstance from './axiosInstance';
import {
  ApplicationActionRequest,
  AdminApprovalResponse,
  ApplicationsResponse,
  ApplicationStatusFilter
} from '../data/adminDTOs';

/**
 * AdminService - Service for admin operations to manage mentor/recruiter applications
 */
class AdminService {
  private readonly BASE_URL = '/api/admin';

  /**
   * Get all applications with optional status filter
   * @param status - Filter by status: 'ALL', 'PENDING', 'APPROVED', 'REJECTED' (default: 'ALL')
   * @returns Promise<ApplicationsResponse> - List of mentor and recruiter applications with stats
   */
  async getApplications(status: ApplicationStatusFilter = 'ALL'): Promise<ApplicationsResponse> {
    try {
      const response = await axiosInstance.get<ApplicationsResponse>(
        `${this.BASE_URL}/applications`,
        {
          params: { status }
        }
      );
      
      console.log(`✅ Fetched ${response.data.totalApplications} applications with filter: ${status}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching applications:', error);
      throw error;
    }
  }

  /**
   * Process an application (Approve or Reject)
   * @param request - ApplicationActionRequest containing userId, applicationType, action, and optional rejectionReason
   * @returns Promise<AdminApprovalResponse> - Response with success status and message
   */
  async processApplication(request: ApplicationActionRequest): Promise<AdminApprovalResponse> {
    try {
      // Validate rejectionReason if action is REJECT
      if (request.action === 'REJECT' && !request.rejectionReason) {
        throw new Error('Rejection reason is required when rejecting an application');
      }

      console.log('📤 Sending application process request:', JSON.stringify(request, null, 2));
      
      const response = await axiosInstance.post<AdminApprovalResponse>(
        `${this.BASE_URL}/applications/process`,
        request
      );
      
      console.log(`✅ Successfully ${request.action.toLowerCase()}ed ${request.applicationType} application for user ${request.userId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error processing application:', error);
      console.error('📋 Request was:', JSON.stringify(request, null, 2));
      console.error('📋 Error response:', error.response?.data);
      console.error('📋 Error status:', error.response?.status);
      throw error;
    }
  }

  /**
   * Approve a mentor application
   * @param userId - User ID of the mentor applicant
   * @returns Promise<AdminApprovalResponse>
   */
  async approveMentorApplication(userId: number): Promise<AdminApprovalResponse> {
    return this.processApplication({
      userId,
      applicationType: 'MENTOR',
      action: 'APPROVE'
    });
  }

  /**
   * Reject a mentor application
   * @param userId - User ID of the mentor applicant
   * @param rejectionReason - Reason for rejection
   * @returns Promise<AdminApprovalResponse>
   */
  async rejectMentorApplication(userId: number, rejectionReason: string): Promise<AdminApprovalResponse> {
    return this.processApplication({
      userId,
      applicationType: 'MENTOR',
      action: 'REJECT',
      rejectionReason
    });
  }

  /**
   * Approve a recruiter application
   * @param userId - User ID of the recruiter applicant
   * @returns Promise<AdminApprovalResponse>
   */
  async approveRecruiterApplication(userId: number): Promise<AdminApprovalResponse> {
    return this.processApplication({
      userId,
      applicationType: 'RECRUITER',
      action: 'APPROVE'
    });
  }

  /**
   * Reject a recruiter application
   * @param userId - User ID of the recruiter applicant
   * @param rejectionReason - Reason for rejection
   * @returns Promise<AdminApprovalResponse>
   */
  async rejectRecruiterApplication(userId: number, rejectionReason: string): Promise<AdminApprovalResponse> {
    return this.processApplication({
      userId,
      applicationType: 'RECRUITER',
      action: 'REJECT',
      rejectionReason
    });
  }

  /**
   * Get only pending applications
   * @returns Promise<ApplicationsResponse>
   */
  async getPendingApplications(): Promise<ApplicationsResponse> {
    return this.getApplications('PENDING');
  }

  /**
   * Get only approved applications
   * @returns Promise<ApplicationsResponse>
   */
  async getApprovedApplications(): Promise<ApplicationsResponse> {
    return this.getApplications('APPROVED');
  }

  /**
   * Get only rejected applications
   * @returns Promise<ApplicationsResponse>
   */
  async getRejectedApplications(): Promise<ApplicationsResponse> {
    return this.getApplications('REJECTED');
  }
}

// Export singleton instance
const adminService = new AdminService();
export default adminService;
