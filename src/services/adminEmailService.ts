import axiosInstance from './axiosInstance';

// API endpoints for admin email notifications
const ENDPOINTS = {
  SEND: '/admin/email-notifications/send',
  PREVIEW: '/admin/email-notifications/preview-recipients',
  STATISTICS: '/admin/email-notifications/statistics'
};

/**
 * Target role enum for email filtering
 */
export enum TargetRole {
  ALL = 'ALL',
  USER = 'USER',
  MENTOR = 'MENTOR',
  RECRUITER = 'RECRUITER',
  ADMIN = 'ADMIN'
}

/**
 * Email type enum
 */
export enum EmailType {
  PROMOTIONAL = 'PROMOTIONAL',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  UPDATE = 'UPDATE',
  MAINTENANCE = 'MAINTENANCE'
}

/**
 * Email notification request interface
 */
export interface EmailNotificationRequest {
  subject: string;
  htmlContent: string;
  targetRole: TargetRole;
  emailType: EmailType;
  isUrgent?: boolean;
}

/**
 * Email sending report interface
 */
export interface EmailSendingReport {
  totalRecipients: number;
  successCount: number;
  failedCount: number;
  failedEmails: string[];
  sentAt: string;
  status: 'COMPLETED' | 'PARTIAL_FAILURE' | 'FAILED' | 'IN_PROGRESS';
  successRate: number;
}

/**
 * Preview recipients response interface
 */
export interface PreviewRecipientsResponse {
  totalCount: number;
  sampleEmails: string[];
  targetRole: string;
}

/**
 * Email statistics interface
 */
export interface EmailStatistics {
  totalUsers: number;
  userCount: number;
  mentorCount: number;
  recruiterCount: number;
  adminCount: number;
}

/**
 * Admin Email Service
 * Handles all admin email notification operations
 */
class AdminEmailService {

  /**
   * Send bulk email notification
   * 
   * @param request Email notification request
   * @returns Email sending report
   */
  async sendBulkEmail(request: EmailNotificationRequest): Promise<EmailSendingReport> {
    try {
      const response = await axiosInstance.post<EmailSendingReport>(ENDPOINTS.SEND, request);
      return response.data;
    } catch (error) {
      console.error('Failed to send bulk email:', error);
      throw error;
    }
  }

  /**
   * Preview recipients before sending
   * 
   * @param targetRole Target role to filter users
   * @returns Preview response with count and sample emails
   */
  async previewRecipients(targetRole?: TargetRole): Promise<PreviewRecipientsResponse> {
    try {
      const params = targetRole ? { targetRole } : {};
      const response = await axiosInstance.get<PreviewRecipientsResponse>(ENDPOINTS.PREVIEW, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to preview recipients:', error);
      throw error;
    }
  }

  /**
   * Get email sending statistics
   * 
   * @returns Email statistics by role
   */
  async getStatistics(): Promise<EmailStatistics> {
    try {
      const response = await axiosInstance.get<EmailStatistics>(ENDPOINTS.STATISTICS);
      return response.data;
    } catch (error) {
      console.error('Failed to get email statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const adminEmailService = new AdminEmailService();
export default adminEmailService;
