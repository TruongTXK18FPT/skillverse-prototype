import axiosInstance from './axiosInstance';

// ==================== Types ====================

export interface EvidenceRequest {
  evidenceType: string; // SCREENSHOT, DOCUMENT, VIDEO, AUDIO, LINK, CHAT_LOG, OTHER
  fileUrl?: string;
  fileName?: string;
  description?: string;
  externalLink?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface CreateViolationReportRequest {
  title: string;
  reportedUserId?: number;
  reportedUserEmail?: string; // Can use email instead of ID
  reportType: string; // INAPPROPRIATE_CONTENT, HARASSMENT, SPAM, FRAUD, COPYRIGHT_VIOLATION, etc.
  severity?: string; // LOW, MEDIUM, HIGH
  description: string;
  evidences?: EvidenceRequest[];
}

export interface UpdateViolationReportRequest {
  status?: string;
  severity?: string;
  adminNotes?: string;
  assignedAdminId?: number;
  resolutionAction?: string;
}

export interface EvidenceResponse {
  id: number;
  evidenceType: string;
  fileUrl?: string;
  fileName?: string;
  description?: string;
  externalLink?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}

export interface ViolationReportResponse {
  id: number;
  reportCode: string;
  title: string;
  reporterId: number;
  reporterName: string;
  reporterEmail: string;
  reportedUserId: number;
  reportedUserName: string;
  reportedUserEmail: string;
  reportType: string;
  severity: string;
  description: string;
  status: string;
  adminNotes?: string;
  assignedAdminId?: number;
  assignedAdminName?: string;
  resolutionAction?: string;
  resolvedAt?: string;
  evidences?: EvidenceResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ViolationReportStatsResponse {
  totalReports: number;
  newReports: number;
  investigatingReports: number;
  resolvedReports: number;
  dismissedReports: number;
  criticalReports: number;
  reportsThisWeek: number;
  responseRate: number;
  reportsByType: Record<string, number>;
  reportsBySeverity: Record<string, number>;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ==================== Report Type & Severity Constants ====================

export const REPORT_TYPES = {
  INAPPROPRIATE_CONTENT: 'Nội dung không phù hợp',
  HARASSMENT: 'Quấy rối',
  SPAM: 'Spam và quảng cáo trái phép',
  FRAUD: 'Lừa đảo tài chính',
  COPYRIGHT_VIOLATION: 'Vi phạm bản quyền',
  HATE_SPEECH: 'Phát ngôn thù hận',
  IMPERSONATION: 'Mạo danh',
  MISINFORMATION: 'Thông tin sai lệch',
  PRIVACY_VIOLATION: 'Vi phạm quyền riêng tư',
  OTHER: 'Khác'
} as const;

export const REPORT_SEVERITIES = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao'
} as const;

export const REPORT_STATUSES = {
  PENDING: 'Chờ xử lý',
  INVESTIGATING: 'Đang điều tra',
  RESOLVED: 'Đã giải quyết',
  DISMISSED: 'Đã bỏ qua'
} as const;

export const EVIDENCE_TYPES = {
  SCREENSHOT: 'Ảnh chụp màn hình',
  DOCUMENT: 'Tài liệu',
  VIDEO: 'Video',
  AUDIO: 'Audio',
  LINK: 'Liên kết',
  CHAT_LOG: 'Lịch sử chat',
  OTHER: 'Khác'
} as const;

export const RESOLUTION_ACTIONS = {
  NO_ACTION: 'Không có hành động',
  WARNING_ISSUED: 'Đã gửi cảnh báo',
  CONTENT_REMOVED: 'Đã xóa nội dung',
  ACCOUNT_SUSPENDED: 'Tạm khóa tài khoản',
  ACCOUNT_BANNED: 'Cấm tài khoản vĩnh viễn',
  ESCALATED: 'Leo thang'
} as const;

// ==================== User API ====================

const violationReportService = {
  /**
   * Create a new violation report (User)
   */
  createReport: async (
    reporterId: number,
    request: CreateViolationReportRequest
  ): Promise<ViolationReportResponse> => {
    const response = await axiosInstance.post('/v1/reports', request, {
      params: { reporterId }
    });
    return response.data;
  },

  /**
   * Get my submitted reports (User)
   */
  getMyReports: async (userId: number): Promise<ViolationReportResponse[]> => {
    const response = await axiosInstance.get('/v1/reports/my', {
      params: { userId }
    });
    return response.data;
  },

  /**
   * Get report by ID (User - must be owner)
   */
  getReportById: async (
    reportId: number,
    userId: number
  ): Promise<ViolationReportResponse> => {
    const response = await axiosInstance.get(`/v1/reports/${reportId}`, {
      params: { userId }
    });
    return response.data;
  },

  /**
   * Track report by code (Public)
   */
  trackReport: async (reportCode: string): Promise<ViolationReportResponse> => {
    const response = await axiosInstance.get(`/v1/reports/track/${reportCode}`);
    return response.data;
  },

  // ==================== Admin API ====================

  /**
   * Get all reports with filters (Admin)
   */
  getAllReports: async (
    status?: string,
    reportType?: string,
    severity?: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ViolationReportResponse>> => {
    const response = await axiosInstance.get('/v1/reports/admin/all', {
      params: { status, reportType, severity, page, size }
    });
    return response.data;
  },

  /**
   * Get report by ID (Admin - no ownership check)
   */
  getReportByIdAdmin: async (reportId: number): Promise<ViolationReportResponse> => {
    const response = await axiosInstance.get(`/v1/reports/admin/${reportId}`);
    return response.data;
  },

  /**
   * Get reports assigned to an admin
   */
  getAssignedReports: async (
    adminId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ViolationReportResponse>> => {
    const response = await axiosInstance.get(`/v1/reports/admin/assigned/${adminId}`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Get pending critical reports
   */
  getCriticalReports: async (): Promise<ViolationReportResponse[]> => {
    const response = await axiosInstance.get('/v1/reports/admin/critical');
    return response.data;
  },

  /**
   * Get reports against a specific user
   */
  getReportsAgainstUser: async (userId: number): Promise<ViolationReportResponse[]> => {
    const response = await axiosInstance.get(`/v1/reports/admin/against/${userId}`);
    return response.data;
  },

  /**
   * Update a report (Admin)
   */
  updateReport: async (
    reportId: number,
    request: UpdateViolationReportRequest
  ): Promise<ViolationReportResponse> => {
    const response = await axiosInstance.put(`/v1/reports/admin/${reportId}`, request);
    return response.data;
  },

  /**
   * Investigate a report (Admin)
   */
  investigateReport: async (
    reportId: number,
    adminId: number
  ): Promise<ViolationReportResponse> => {
    const response = await axiosInstance.post(`/v1/reports/admin/${reportId}/investigate`, null, {
      params: { adminId }
    });
    return response.data;
  },

  /**
   * Resolve a report (Admin)
   */
  resolveReport: async (
    reportId: number,
    resolutionAction: string,
    adminNotes: string
  ): Promise<ViolationReportResponse> => {
    const response = await axiosInstance.post(`/v1/reports/admin/${reportId}/resolve`, {
      resolutionAction,
      adminNotes
    });
    return response.data;
  },

  /**
   * Dismiss a report (Admin)
   */
  dismissReport: async (
    reportId: number,
    adminNotes: string
  ): Promise<ViolationReportResponse> => {
    const response = await axiosInstance.post(`/v1/reports/admin/${reportId}/dismiss`, {
      adminNotes
    });
    return response.data;
  },

  /**
   * Escalate a report (Admin)
   */
  escalateReport: async (
    reportId: number,
    adminNotes: string
  ): Promise<ViolationReportResponse> => {
    const response = await axiosInstance.post(`/v1/reports/admin/${reportId}/escalate`, {
      adminNotes
    });
    return response.data;
  },

  /**
   * Get report statistics (Admin dashboard)
   */
  getReportStats: async (): Promise<ViolationReportStatsResponse> => {
    const response = await axiosInstance.get('/v1/reports/admin/stats');
    return response.data;
  },

  /**
   * Delete a report (Admin)
   */
  deleteReport: async (reportId: number): Promise<void> => {
    await axiosInstance.delete(`/v1/reports/admin/${reportId}`);
  }
};

export default violationReportService;
